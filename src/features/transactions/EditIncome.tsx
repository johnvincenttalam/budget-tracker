import { useState } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { ArrowLeftIcon, CheckCircleIcon } from '../../shared/components/Icons';
import type { Screen } from '../../shared/types';

export function EditIncome({ onNavigate, transactionId }: { onNavigate: (s: Screen) => void; transactionId: string }) {
  const store = useBudgetStore();
  const transaction = store.transactions.find((t) => t.id === transactionId);

  const [amount, setAmount] = useState(transaction?.amount.toString() ?? '');
  const [source, setSource] = useState(transaction?.source ?? '');
  const [date, setDate] = useState(transaction?.date ?? '');
  const [note, setNote] = useState(transaction?.note ?? '');
  const [saved, setSaved] = useState(false);

  if (!transaction || transaction.type !== 'income') {
    onNavigate('summary');
    return null;
  }

  const numericAmount = parseFloat(amount) || 0;
  const quickSources = ['Salary', 'Freelance', 'Bonus', 'Other'];

  function handleSave() {
    if (numericAmount <= 0) return;
    store.updateTransaction(transactionId, {
      amount: numericAmount,
      date,
      source: source.trim() || 'Income',
      note: note.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => onNavigate('summary'), 600);
  }

  if (saved) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-3 animate-success">
            <CheckCircleIcon size={32} className="text-emerald-400" />
          </div>
          <p className="text-lg text-slate-300 animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>Income updated!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => onNavigate('summary')} className="text-slate-400 p-2 -ml-2 flex items-center gap-1">
          <ArrowLeftIcon size={18} />
          <span className="text-sm">Back</span>
        </button>
        <h2 className="text-base font-semibold text-white">Edit Income</h2>
        <div className="w-14" />
      </div>

      {/* Amount */}
      <label className="text-xs text-slate-400 uppercase tracking-wider mb-2">Amount</label>
      <input
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        className="bg-slate-800/60 rounded-xl px-4 py-4 text-3xl font-bold text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-emerald-500/50 mb-5 text-center"
        autoFocus
      />

      {/* Source */}
      <label className="text-xs text-slate-400 uppercase tracking-wider mb-2">Source</label>
      <div className="flex gap-2 flex-wrap mb-3">
        {quickSources.map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              source === s ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={source}
        onChange={(e) => setSource(e.target.value)}
        placeholder="Or type a source..."
        className="bg-slate-800/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50 mb-5"
      />

      {/* Date */}
      <label className="text-xs text-slate-400 uppercase tracking-wider mb-2">Date</label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="bg-slate-800/60 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/50 mb-5 [color-scheme:dark]"
      />

      {/* Note */}
      <label className="text-xs text-slate-400 uppercase tracking-wider mb-2">Note</label>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        className="bg-slate-800/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50 mb-8"
      />

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={numericAmount <= 0}
        className="w-full py-4 rounded-2xl text-lg font-bold transition-all active:scale-[0.98] disabled:opacity-30 bg-emerald-500 text-white"
      >
        Update Income
      </button>
    </div>
  );
}
