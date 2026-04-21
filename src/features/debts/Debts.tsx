import { useState } from 'react';
import { useToast } from '../../shared/components/ToastProvider';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import { BottomSheet } from '../../shared/components/BottomSheet';
import { Card } from '../../shared/components/Card';
import { SectionLabel } from '../../shared/components/SectionLabel';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { EmptyState } from '../../shared/components/EmptyState';
import { DebtIcon } from '../../shared/components/Icons';
import { haptic } from '../../shared/utils/haptic';
import type { Screen, DebtItem } from '../../shared/types';

const DEBT_COLORS = [
  { name: 'red', bg: 'bg-red-500', bgLight: 'bg-red-500/15', text: 'text-red-400', bar: 'bg-red-500' },
  { name: 'orange', bg: 'bg-orange-500', bgLight: 'bg-orange-500/15', text: 'text-orange-400', bar: 'bg-orange-500' },
  { name: 'amber', bg: 'bg-amber-500', bgLight: 'bg-amber-500/15', text: 'text-amber-400', bar: 'bg-amber-500' },
  { name: 'blue', bg: 'bg-blue-500', bgLight: 'bg-blue-500/15', text: 'text-blue-400', bar: 'bg-blue-500' },
  { name: 'purple', bg: 'bg-purple-500', bgLight: 'bg-purple-500/15', text: 'text-purple-400', bar: 'bg-purple-500' },
  { name: 'rose', bg: 'bg-rose-500', bgLight: 'bg-rose-500/15', text: 'text-rose-400', bar: 'bg-rose-500' },
];

function getDebtColor(name: string) {
  return DEBT_COLORS.find((c) => c.name === name) ?? DEBT_COLORS[0];
}

const DEBT_ICONS = ['Target', 'Home', 'Car', 'Education', 'Health', 'Phone', 'Shopping', 'PiggyBank'];

export function Debts({ onNavigate: _onNavigate }: { onNavigate: (s: Screen) => void }) {
  const toast = useToast();
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const cycle = getCurrentCycle();
  const debts = store.debtItems;

  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeDebt, setActiveDebt] = useState<DebtItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState('red');

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const totalDebt = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalMinPayments = debts.reduce((sum, d) => sum + d.minimumPayment, 0);

  // Estimate debt-free date (simplified: total remaining / avg monthly payment)
  const avgMonthlyPayment = totalMinPayments > 0 ? totalMinPayments : 1;
  const monthsToPayoff = totalDebt > 0 ? Math.ceil(totalDebt / avgMonthlyPayment) : 0;
  const debtFreeDate = new Date();
  debtFreeDate.setMonth(debtFreeDate.getMonth() + monthsToPayoff);

  function resetForm() {
    setName('');
    setTotalAmount('');
    setRemainingAmount('');
    setInterestRate('');
    setMinimumPayment('');
    setDueDay('');
    setIcon('Target');
    setColor('red');
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(debt: DebtItem) {
    setEditingId(debt.id);
    setName(debt.name);
    setTotalAmount(String(debt.totalAmount));
    setRemainingAmount(String(debt.remainingAmount));
    setInterestRate(String(debt.interestRate));
    setMinimumPayment(String(debt.minimumPayment));
    setDueDay(String(debt.dueDay));
    setIcon(debt.icon);
    setColor(debt.color);
    setShowForm(true);
  }

  function handleSave() {
    const total = parseFloat(totalAmount);
    const remaining = parseFloat(remainingAmount);
    const interest = parseFloat(interestRate) || 0;
    const minPay = parseFloat(minimumPayment) || 0;
    const day = parseInt(dueDay);
    if (!name.trim() || total <= 0 || remaining < 0 || day < 1 || day > 31) return;

    if (editingId) {
      store.updateDebtItem(editingId, {
        name: name.trim(),
        totalAmount: total,
        remainingAmount: remaining,
        interestRate: interest,
        minimumPayment: minPay,
        dueDay: day,
        icon,
        color,
      });
      toast('Debt updated');
    } else {
      store.addDebtItem({
        name: name.trim(),
        totalAmount: total,
        remainingAmount: remaining,
        interestRate: interest,
        minimumPayment: minPay,
        dueDay: day,
        icon,
        color,
      });
      toast('Debt added');
    }
    resetForm();
  }

  function handlePayment() {
    if (!activeDebt) return;
    const amount = parseFloat(paymentAmount);
    if (amount <= 0) return;

    haptic();
    store.addDebtPayment({
      debtId: activeDebt.id,
      amount,
      date: new Date().toISOString().slice(0, 10),
      cycleKey: cycle.startDate,
      note: paymentNote.trim() || undefined,
    });
    toast(`${formatMoney(amount, sym)} paid toward ${activeDebt.name}`);
    setPaymentAmount('');
    setPaymentNote('');
    setShowPayment(false);
    setActiveDebt(null);
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      store.deleteDebtItem(id);
      setConfirmDelete(null);
      toast('Debt deleted');
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete((prev) => prev === id ? null : prev), 3000);
    }
  }

  return (
    <div className="flex flex-col gap-3 px-5 pt-4">
      {/* Hero card */}
      {debts.length > 0 && (
        <Card size="lg" className="animate-reveal-up">
          <p className="text-[2.25rem] font-bold text-red-400 text-center tracking-tight">
            {formatMoney(totalDebt, sym)}
          </p>
          <p className="text-xs text-slate-500 text-center mt-1">Total Remaining Debt</p>

          <div className="flex justify-between mt-4 pt-3 border-t border-slate-800">
            <div>
              <SectionLabel>Min. Payments</SectionLabel>
              <p className="text-sm font-bold text-amber-400 mt-0.5">{formatMoney(totalMinPayments, sym)}/mo</p>
            </div>
            <div className="text-right">
              <SectionLabel>Debt-free by</SectionLabel>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">
                {monthsToPayoff > 0 ? debtFreeDate.toLocaleDateString('en', { month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Debt cards */}
      {debts.map((debt) => {
        const colorObj = getDebtColor(debt.color);
        const paidPct = debt.totalAmount > 0 ? ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100 : 0;
        const payments = store.getDebtPayments(debt.id);
        const recentPayments = payments.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

        return (
          <Card key={debt.id} className="animate-reveal-up">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl ${colorObj.bgLight} ${colorObj.text} flex items-center justify-center`}>
                  <DebtIcon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{debt.name}</p>
                  <p className="text-[10px] text-slate-500">Due day {debt.dueDay}{debt.interestRate > 0 ? ` · ${debt.interestRate}% APR` : ''}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{formatMoney(debt.remainingAmount, sym)}</p>
                <p className="text-[10px] text-slate-500">of {formatMoney(debt.totalAmount, sym)}</p>
              </div>
            </div>

            <ProgressBar value={paidPct} color={colorObj.bar} height="h-2" className="mb-2" />
            <p className="text-[10px] text-slate-500 mb-2">{paidPct.toFixed(0)}% paid off · Min. {formatMoney(debt.minimumPayment, sym)}/mo</p>

            {/* Recent payments */}
            {recentPayments.length > 0 && (
              <div className="mb-2">
                {recentPayments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-1">
                    <span className="text-[10px] text-slate-500">{new Date(p.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                    <span className="text-xs font-medium text-emerald-400">−{formatMoney(p.amount, sym)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setActiveDebt(debt); setShowPayment(true); }}
                className="flex-1 py-2 rounded-xl text-xs font-medium bg-emerald-500/15 text-emerald-400 active:bg-emerald-500/25 transition-colors"
              >
                Make Payment
              </button>
              <button
                onClick={() => handleEdit(debt)}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-400 active:bg-slate-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(debt.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  confirmDelete === debt.id ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {confirmDelete === debt.id ? 'Sure?' : 'Del'}
              </button>
            </div>
          </Card>
        );
      })}

      {/* Empty state */}
      {debts.length === 0 && (
        <EmptyState
          icon={<DebtIcon size={32} className="text-slate-500" />}
          title="No debts tracked"
          description="Add your debts to monitor payoff progress"
        />
      )}

      {/* Add button */}
      <Button
        variant="secondary"
        fullWidth
        onClick={() => { resetForm(); setShowForm(true); }}
        className="text-emerald-400"
      >
        + Add Debt
      </Button>

      {/* Add/Edit Debt form */}
      <BottomSheet open={showForm} onClose={resetForm} title={editingId ? 'Edit Debt' : 'New Debt'}>
        <div className="space-y-3">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Debt name (e.g. Credit Card)"
            label="Name"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              inputMode="decimal"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="Total owed"
              label="Total Amount"
            />
            <Input
              type="number"
              inputMode="decimal"
              value={remainingAmount}
              onChange={(e) => setRemainingAmount(e.target.value)}
              placeholder="Remaining"
              label="Remaining"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              type="number"
              inputMode="decimal"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="0"
              label="Interest %"
            />
            <Input
              type="number"
              inputMode="decimal"
              value={minimumPayment}
              onChange={(e) => setMinimumPayment(e.target.value)}
              placeholder="0"
              label="Min. Payment"
            />
            <Input
              type="number"
              inputMode="numeric"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="1-31"
              label="Due Day"
            />
          </div>

          {/* Icon picker */}
          <div>
            <SectionLabel className="mb-2">Icon</SectionLabel>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {DEBT_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    icon === ic ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <SectionLabel className="mb-2">Color</SectionLabel>
            <div className="flex gap-2">
              {DEBT_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={`w-8 h-8 rounded-full ${c.bg} transition-all ${color === c.name ? 'ring-2 ring-white scale-110' : 'opacity-60'}`}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={!name.trim() || !totalAmount || parseFloat(totalAmount) <= 0 || !dueDay}
            variant="primary"
            fullWidth
          >
            {editingId ? 'Save' : 'Add Debt'}
          </Button>
        </div>
      </BottomSheet>

      {/* Payment sheet */}
      <BottomSheet open={showPayment} onClose={() => { setShowPayment(false); setActiveDebt(null); }} title={`Pay ${activeDebt?.name ?? ''}`}>
        <div className="space-y-3">
          {activeDebt && (
            <p className="text-xs text-slate-500">
              Remaining: <span className="text-white font-medium">{formatMoney(activeDebt.remainingAmount, sym)}</span>
              {activeDebt.minimumPayment > 0 && <> · Min: {formatMoney(activeDebt.minimumPayment, sym)}</>}
            </p>
          )}
          <Input
            type="number"
            inputMode="decimal"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Payment amount"
            label="Amount"
          />
          <Input
            type="text"
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            placeholder="Note (optional)"
            label="Note"
          />
          <Button
            onClick={handlePayment}
            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
            variant="primary"
            fullWidth
          >
            Record Payment
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
