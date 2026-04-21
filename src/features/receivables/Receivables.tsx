import { useState } from 'react';
import { useToast } from '../../shared/components/ToastProvider';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { formatMoney } from '../../shared/utils/format';
import { BottomSheet } from '../../shared/components/BottomSheet';
import { Card } from '../../shared/components/Card';
import { SectionLabel } from '../../shared/components/SectionLabel';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { EmptyState } from '../../shared/components/EmptyState';
import { ReceivableIcon } from '../../shared/components/Icons';
import { haptic } from '../../shared/utils/haptic';
import type { Screen, Receivable } from '../../shared/types';

export function Receivables({ onNavigate: _onNavigate }: { onNavigate: (s: Screen) => void }) {
  const toast = useToast();
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const receivables = store.receivables;

  const [filter, setFilter] = useState<'unsettled' | 'settled'>('unsettled');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const unsettled = receivables.filter((r) => !r.settled);
  const settled = receivables.filter((r) => r.settled);
  const displayed = filter === 'unsettled' ? unsettled : settled;

  const totalOutstanding = unsettled.reduce((sum, r) => sum + r.amount, 0);

  function resetForm() {
    setPersonName('');
    setAmount('');
    setReason('');
    setDueDate('');
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(rec: Receivable) {
    setEditingId(rec.id);
    setPersonName(rec.personName);
    setAmount(String(rec.amount));
    setReason(rec.reason);
    setDueDate(rec.dueDate ?? '');
    setShowForm(true);
  }

  function handleSave() {
    const num = parseFloat(amount);
    if (!personName.trim() || num <= 0) return;

    if (editingId) {
      store.updateReceivable(editingId, {
        personName: personName.trim(),
        amount: num,
        reason: reason.trim(),
        dueDate: dueDate || undefined,
      });
      toast('Receivable updated');
    } else {
      store.addReceivable({
        personName: personName.trim(),
        amount: num,
        reason: reason.trim(),
        dueDate: dueDate || undefined,
      });
      toast('Receivable added');
    }
    resetForm();
  }

  function handleSettle(id: string) {
    haptic();
    store.settleReceivable(id);
    const rec = receivables.find((r) => r.id === id);
    toast(rec ? `${rec.personName} settled` : 'Settled');
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      store.deleteReceivable(id);
      setConfirmDelete(null);
      toast('Receivable deleted');
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete((prev) => prev === id ? null : prev), 3000);
    }
  }

  return (
    <div className="flex flex-col gap-3 px-5 pt-4">
      {/* Hero card */}
      {unsettled.length > 0 && (
        <Card size="lg" className="animate-reveal-up">
          <p className="text-[2.25rem] font-bold text-amber-400 text-center tracking-tight">
            {formatMoney(totalOutstanding, sym)}
          </p>
          <p className="text-xs text-slate-500 text-center mt-1">Total Outstanding</p>
          <div className="flex justify-center mt-3 pt-3 border-t border-slate-800">
            <div className="text-center">
              <SectionLabel>Pending</SectionLabel>
              <p className="text-sm font-bold text-white mt-0.5">{unsettled.length} {unsettled.length === 1 ? 'person' : 'people'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Filter toggle */}
      <div className="flex bg-slate-900 rounded-xl p-0.5">
        <button
          onClick={() => setFilter('unsettled')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
            filter === 'unsettled' ? 'bg-emerald-500 text-white' : 'text-slate-400'
          }`}
        >
          Unsettled ({unsettled.length})
        </button>
        <button
          onClick={() => setFilter('settled')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
            filter === 'settled' ? 'bg-emerald-500 text-white' : 'text-slate-400'
          }`}
        >
          Settled ({settled.length})
        </button>
      </div>

      {/* Receivable list */}
      {displayed.length > 0 && (
        <div className="space-y-2">
          {displayed.map((rec) => {
            const isOverdue = rec.dueDate && !rec.settled && new Date(rec.dueDate) < new Date();
            return (
              <Card key={rec.id} className="animate-reveal-up">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      rec.settled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {rec.personName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${rec.settled ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {rec.personName}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {rec.reason}
                        {rec.dueDate && (
                          <span className={isOverdue ? ' text-red-400' : ''}>
                            {' '}· Due {new Date(rec.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${rec.settled ? 'text-slate-500' : 'text-amber-400'}`}>
                    {formatMoney(rec.amount, sym)}
                  </p>
                </div>

                {rec.settled && rec.settledAt && (
                  <p className="text-[10px] text-slate-600 mt-1.5">
                    Settled {new Date(rec.settledAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}

                <div className="flex gap-2 mt-2.5">
                  {!rec.settled && (
                    <button
                      onClick={() => handleSettle(rec.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-medium bg-emerald-500/15 text-emerald-400 active:bg-emerald-500/25 transition-colors"
                    >
                      Mark Settled
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(rec)}
                    className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-400 active:bg-slate-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rec.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      confirmDelete === rec.id ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {confirmDelete === rec.id ? 'Sure?' : 'Del'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {displayed.length === 0 && (
        <EmptyState
          icon={<ReceivableIcon size={32} className="text-slate-500" />}
          title={filter === 'unsettled' ? 'No pending receivables' : 'No settled receivables yet'}
          description={filter === 'unsettled' ? 'Track money owed to you' : undefined}
        />
      )}

      {/* Add button */}
      <Button
        variant="secondary"
        fullWidth
        onClick={() => { resetForm(); setShowForm(true); }}
        className="text-emerald-400"
      >
        + Add Receivable
      </Button>

      {/* Form sheet */}
      <BottomSheet open={showForm} onClose={resetForm} title={editingId ? 'Edit Receivable' : 'New Receivable'}>
        <div className="space-y-3">
          <Input
            type="text"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Who owes you?"
            label="Person"
          />
          <Input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            label="Amount"
          />
          <Input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What for?"
            label="Reason"
          />
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            label="Due Date (optional)"
          />
          <Button
            onClick={handleSave}
            disabled={!personName.trim() || !amount || parseFloat(amount) <= 0}
            variant="primary"
            fullWidth
          >
            {editingId ? 'Save' : 'Add Receivable'}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
