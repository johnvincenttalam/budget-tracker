import { useState } from 'react';
import { useToast } from '../../shared/components/ToastProvider';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle, getNextCycle, getPrevCycle, getCycleForDate } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import { getBillStatus, getDueDateLabel, type BillStatus } from '../../shared/utils/bills';
import { getCategoryIconName } from '../../shared/utils/categories';
import { CategoryIcon } from '../../shared/components/Icons';
import type { Screen, CustomCategory } from '../../shared/types';

export function Bills({ onNavigate: _onNavigate }: { onNavigate: (s: Screen) => void }) {
  const toast = useToast();
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const categories = store.getAllCategories();
  const customCategories = store.customCategories;
  const billsCycleStart = store.billsCycleStart;
  const [cycle, setCycleLocal] = useState(() =>
    billsCycleStart ? getCycleForDate(billsCycleStart) : getCurrentCycle()
  );
  const isCurrentCycle = cycle.startDate === getCurrentCycle().startDate;
  const setCycle = (c: ReturnType<typeof getCurrentCycle>) => {
    setCycleLocal(c);
    store.setBillsCycleStart(c.startDate);
    resetForm();
  };
  const payments = store.getBillPaymentsForCycle(cycle.startDate);
  const startDay = parseInt(cycle.startDate.split('-')[2]);
  const endDay = parseInt(cycle.endDate.split('-')[2]);
  const rawBills = store.billTemplates.filter((b) =>
    b.enabled && b.dueDay >= startDay && b.dueDay <= endDay &&
    (!b.createdInCycle || b.createdInCycle <= cycle.startDate) &&
    (!b.oneTimeCycle || b.oneTimeCycle === cycle.startDate)
  );
  // Apply per-cycle overrides
  const bills = rawBills.map((b) => {
    const override = store.getBillOverride(b.id, cycle.startDate);
    if (!override) return b;
    return { ...b, amount: override.amount ?? b.amount, note: override.note !== undefined ? override.note : b.note };
  });
  const completedBills = store.billTemplates.filter((b) => !b.enabled && b.totalInstallments && b.currentInstallment && b.currentInstallment >= b.totalInstallments);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cycleOnly, setCycleOnly] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Bills');
  const [dueDay, setDueDay] = useState('');
  const [note, setNote] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function resetForm() {
    setName('');
    setAmount('');
    setCategory('Bills');
    setDueDay('');
    setNote('');
    setTotalInstallments('');
    setCurrentInstallment('');
    setEditingId(null);
    setCycleOnly(false);
    setShowForm(false);
  }

  function handleEdit(billId: string) {
    // Show the effective values (with override applied) for this cycle
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return;
    setEditingId(billId);
    setCycleOnly(!!bill.oneTimeCycle);
    setName(bill.name);
    setAmount(String(bill.amount));
    setCategory(bill.category);
    setDueDay(String(bill.dueDay));
    setNote(bill.note ?? '');
    setTotalInstallments(bill.totalInstallments ? String(bill.totalInstallments) : '');
    setCurrentInstallment(bill.currentInstallment ? String(bill.currentInstallment) : '');
    setShowForm(true);
  }

  function handleSave() {
    const num = parseFloat(amount);
    const day = parseInt(dueDay);
    if (!name.trim() || num <= 0 || isNaN(num) || day < 1 || day > 31) return;
    const total = parseInt(totalInstallments);
    const current = parseInt(currentInstallment);
    const installmentFields = total > 0 && current > 0
      ? { totalInstallments: total, currentInstallment: current }
      : { totalInstallments: undefined, currentInstallment: undefined };

    if (editingId) {
      if (cycleOnly) {
        // Save amount & note as cycle override only
        store.setBillOverride(editingId, cycle.startDate, {
          amount: num,
          note: note.trim() || undefined,
        });
        // Template-level fields always update the template
        store.updateBillTemplate(editingId, {
          name: name.trim(),
          category,
          dueDay: day,
          oneTimeCycle: cycle.startDate,
          ...installmentFields,
        });
      } else {
        // Update everything on the template (affects all cycles)
        store.updateBillTemplate(editingId, {
          name: name.trim(),
          amount: num,
          category,
          dueDay: day,
          note: note.trim() || undefined,
          oneTimeCycle: undefined,
          ...installmentFields,
        });
      }
    } else {
      store.addBillTemplate({
        name: name.trim(),
        amount: num,
        category,
        dueDay: day,
        note: note.trim() || undefined,
        enabled: true,
        createdInCycle: cycle.startDate,
        ...(cycleOnly ? { oneTimeCycle: cycle.startDate } : {}),
        ...installmentFields,
      });
    }
    toast(editingId ? 'Bill updated' : 'Bill added');
    resetForm();
  }

  function handleTogglePay(billId: string) {
    const bill = bills.find((b) => b.id === billId);
    const payment = payments.find((p) => p.billId === billId);
    if (payment) {
      store.unpayBill(billId, cycle.startDate);
      toast(bill ? `${bill.name} marked unpaid` : 'Bill marked unpaid');
    } else {
      store.payBill(billId, cycle);
      toast(bill ? `${bill.name} paid` : 'Bill paid');
    }
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      const bill = store.billTemplates.find((b) => b.id === id);
      store.deleteBillTemplate(id);
      setConfirmDelete(null);
      toast(bill ? `${bill.name} deleted` : 'Bill deleted');
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete((prev) => prev === id ? null : prev), 3000);
    }
  }

  // Group bills by status
  const grouped: Record<BillStatus, typeof bills> = { overdue: [], upcoming: [], paid: [] };
  for (const bill of bills) {
    const payment = payments.find((p) => p.billId === bill.id);
    const status = getBillStatus(bill, cycle, payment);
    grouped[status].push(bill);
  }

  // Sort each group by dueDay
  for (const key of Object.keys(grouped) as BillStatus[]) {
    grouped[key].sort((a, b) => a.dueDay - b.dueDay);
  }

  const paidCount = grouped.paid.length;
  const totalCount = bills.length;
  const totalDue = bills.reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = grouped.paid.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="flex flex-col gap-4 pb-28 px-4 pt-4">
      {/* Header with cycle navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCycle(getPrevCycle(cycle))}
          className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 active:bg-slate-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-base font-semibold text-white">Bills</h2>
          <button
            onClick={() => setCycle(getCurrentCycle())}
            className={`text-sm mt-0.5 transition-colors ${isCurrentCycle ? 'text-slate-400' : 'text-emerald-400 underline underline-offset-2'}`}
          >
            {cycle.label}{!isCurrentCycle && ' (tap for today)'}
          </button>
        </div>
        <button
          onClick={() => setCycle(getNextCycle(cycle))}
          className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 active:bg-slate-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Summary */}
      {totalCount > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Progress</p>
            <p className="text-xs text-slate-400">{paidCount} of {totalCount} paid</p>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-slate-500 text-xs">Paid</p>
              <p className="text-emerald-400 font-semibold">{formatMoney(totalPaid, sym)}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs">Remaining</p>
              <p className="text-white font-semibold">{formatMoney(totalDue - totalPaid, sym)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Overdue */}
      {grouped.overdue.length > 0 && (
        <BillSection
          title="Overdue"
          bills={grouped.overdue}
          payments={payments}
          sym={sym}
          customCategories={customCategories}
          onTogglePay={handleTogglePay}
          onDelete={handleDelete}
          onEdit={handleEdit}
          confirmDelete={confirmDelete}
          statusColor="text-red-400"
        />
      )}

      {/* Upcoming */}
      {grouped.upcoming.length > 0 && (
        <BillSection
          title="Upcoming"
          bills={grouped.upcoming}
          payments={payments}
          sym={sym}
          customCategories={customCategories}
          onTogglePay={handleTogglePay}
          onDelete={handleDelete}
          onEdit={handleEdit}
          confirmDelete={confirmDelete}
          statusColor="text-slate-400"
        />
      )}

      {/* Paid */}
      {grouped.paid.length > 0 && (
        <BillSection
          title="Paid"
          bills={grouped.paid}
          payments={payments}
          sym={sym}
          customCategories={customCategories}
          onTogglePay={handleTogglePay}
          onDelete={handleDelete}
          onEdit={handleEdit}
          confirmDelete={confirmDelete}
          statusColor="text-emerald-400"
        />
      )}

      {/* Cycle total */}
      {totalCount > 0 && (
        <div className="bg-slate-900/60 rounded-2xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-slate-400">Cycle Total</p>
          <p className="text-lg font-bold text-white">{formatMoney(totalDue, sym)}</p>
        </div>
      )}

      {/* Completed installments */}
      {completedBills.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider mb-2 text-slate-600">Completed</p>
          <div className="bg-slate-900/50 rounded-2xl overflow-hidden divide-y divide-slate-800/50">
            {completedBills.map((bill) => (
              <div key={bill.id} className="px-4 py-3 flex items-center gap-3 opacity-50">
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-500 line-through">{bill.name}</p>
                  <p className="text-xs text-slate-600">
                    {bill.totalInstallments}/{bill.totalInstallments} payments done
                  </p>
                </div>
                <p className="text-sm text-slate-600 font-medium">{formatMoney(bill.amount, sym)}</p>
                <button
                  onClick={() => handleDelete(bill.id)}
                  className={`text-xs px-2 py-1 rounded-lg transition-all duration-200 ${
                    confirmDelete === bill.id
                      ? 'bg-red-500 text-white scale-110'
                      : 'bg-slate-800 text-slate-400 scale-100'
                  }`}
                >
                  {confirmDelete === bill.id ? 'Sure?' : '×'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && !showForm && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 mb-3">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <path d="M9 2h6v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V2z" />
              <path d="m9 14 2 2 4-4" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">No bills yet</p>
          <p className="text-slate-500 text-xs mt-1">Add your recurring bills to track them each cycle</p>
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <div className="bg-slate-900 rounded-2xl p-4 space-y-3 animate-slide-up">
          <p className="text-xs text-slate-400 uppercase tracking-wider">{editingId ? 'Edit Bill' : 'New Bill'}</p>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bill name (e.g. Electricity)"
            className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
            <input
              type="number"
              inputMode="numeric"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="Due day (1-31)"
              className="bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                  category === cat ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <CategoryIcon name={getCategoryIconName(cat, customCategories)} size={14} />
                {cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
          />

          {/* Installment fields */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Installment (optional — e.g. payment 2 of 6)</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                inputMode="numeric"
                value={currentInstallment}
                onChange={(e) => setCurrentInstallment(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="Current (e.g. 2)"
                className="bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              <input
                type="number"
                inputMode="numeric"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="Total (e.g. 6)"
                className="bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Cycle scope toggle */}
          <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setCycleOnly(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                !cycleOnly ? 'bg-emerald-500 text-white' : 'text-slate-400'
              }`}
            >
              Every cycle
            </button>
            <button
              onClick={() => setCycleOnly(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                cycleOnly ? 'bg-amber-500 text-white' : 'text-slate-400'
              }`}
            >
              This cycle only
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!name.trim() || !amount || parseFloat(amount) <= 0 || !dueDay || parseInt(dueDay) < 1 || parseInt(dueDay) > 31}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white disabled:opacity-30 transition-all active:scale-[0.98]"
            >
              {editingId ? 'Save' : 'Add Bill'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-3 rounded-xl text-sm bg-slate-800 text-slate-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="w-full py-3 rounded-2xl text-sm font-medium bg-slate-900 text-emerald-400 active:bg-slate-800 transition-colors"
        >
          + Add Bill
        </button>
      )}
    </div>
  );
}

function BillSection({
  title,
  bills,
  payments,
  sym,
  customCategories,
  onTogglePay,
  onDelete,
  onEdit,
  confirmDelete,
  statusColor,
}: {
  title: string;
  bills: { id: string; name: string; amount: number; category: string; dueDay: number; note?: string; totalInstallments?: number; currentInstallment?: number }[];
  payments: { billId: string }[];
  sym: string;
  customCategories: CustomCategory[];
  onTogglePay: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  confirmDelete: string | null;
  statusColor: string;
}) {
  return (
    <div>
      <p className={`text-xs uppercase tracking-wider mb-2 ${statusColor}`}>{title}</p>
      <div className="bg-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-800">
        {bills.map((bill) => {
          const isPaid = payments.some((p) => p.billId === bill.id);
          const hasInstallments = bill.totalInstallments && bill.currentInstallment;
          return (
            <div key={bill.id} className="px-4 py-3 flex items-center gap-3">
              {/* Checkbox */}
              <button
                onClick={() => onTogglePay(bill.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  isPaid
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-slate-600'
                }`}
              >
                {isPaid && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isPaid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
                <CategoryIcon name={getCategoryIconName(bill.category, customCategories)} size={16} />
              </div>

              {/* Info — tap to edit */}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(bill.id)}>
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-medium ${isPaid ? 'text-slate-500 line-through' : 'text-white'}`}>
                    {bill.name}
                  </p>
                  {hasInstallments && (
                    <span className="text-xs text-amber-400 font-medium">
                      ({bill.currentInstallment}/{bill.totalInstallments})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500">Due {getDueDateLabel(bill.dueDay)}</p>
                  {hasInstallments && (
                    <p className="text-xs text-slate-600">
                      {bill.totalInstallments! - bill.currentInstallment! + (isPaid ? 1 : 0)} left
                    </p>
                  )}
                  {bill.note && <p className="text-xs text-slate-600 truncate">· {bill.note}</p>}
                </div>
              </div>

              {/* Amount & delete */}
              <div className="flex items-center gap-2 shrink-0">
                <p className={`text-sm font-bold ${isPaid ? 'text-emerald-400' : 'text-white'}`}>
                  {formatMoney(bill.amount, sym)}
                </p>
                <button
                  onClick={() => onDelete(bill.id)}
                  className={`text-xs px-2 py-1 rounded-lg transition-all duration-200 ${
                    confirmDelete === bill.id
                      ? 'bg-red-500 text-white scale-110'
                      : 'bg-slate-800 text-slate-400 scale-100'
                  }`}
                >
                  {confirmDelete === bill.id ? 'Sure?' : '×'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
