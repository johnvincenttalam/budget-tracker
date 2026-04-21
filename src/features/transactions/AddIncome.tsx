import { useState } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { todayStr } from '../../shared/utils/cycle';
import { ArrowLeftIcon, CheckCircleIcon } from '../../shared/components/Icons';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { SectionLabel } from '../../shared/components/SectionLabel';
import type { Screen } from '../../shared/types';

export function AddIncome({ onNavigate, returnScreen = 'dashboard' }: { onNavigate: (s: Screen) => void; returnScreen?: Screen }) {
  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const numericAmount = parseFloat(amount) || 0;

  const quickSources = ['Salary', 'Freelance', 'Bonus', 'Other'];

  function handleSave() {
    if (numericAmount <= 0) return;
    addTransaction({
      type: 'income',
      amount: numericAmount,
      date,
      source: source.trim() || 'Income',
      note: note.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => {
      onNavigate(returnScreen);
    }, 600);
  }

  if (saved) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-3 animate-success">
            <CheckCircleIcon size={32} className="text-emerald-400" />
          </div>
          <p className="text-lg text-slate-300 animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>Income saved!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-0.5rem)] px-5 pt-4 pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950 flex items-center justify-between pb-3 -mx-5 px-5 pt-0">
        <button
          onClick={() => onNavigate(returnScreen)}
          className="text-slate-400 p-2 -ml-2 flex items-center gap-1"
        >
          <ArrowLeftIcon size={18} />
          <span className="text-sm">Back</span>
        </button>
        <h2 className="text-[15px] font-semibold text-white">Add Income</h2>
        <div className="w-14" />
      </div>

      {/* Amount */}
      <SectionLabel className="mb-2">Amount</SectionLabel>
      <input
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        className="bg-slate-900 rounded-xl px-4 py-4 text-3xl font-bold text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow mb-5 text-center"
        autoFocus
      />

      {/* Source */}
      <SectionLabel className="mb-2">Source</SectionLabel>
      <div className="flex gap-2 flex-wrap mb-3">
        {quickSources.map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              source === s
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-900 text-slate-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <Input
        type="text"
        value={source}
        onChange={(e) => setSource(e.target.value)}
        placeholder="Or type a source..."
        className="mb-5"
      />

      {/* Date */}
      <SectionLabel className="mb-2">Date</SectionLabel>
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-5"
      />

      {/* Note */}
      <SectionLabel className="mb-2">Note</SectionLabel>
      <Input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        className="mb-8"
      />

      {/* Save */}
      <div className="mt-auto">
        <Button
          onClick={handleSave}
          disabled={numericAmount <= 0}
          variant="primary"
          size="lg"
          fullWidth
        >
          Save Income
        </Button>
      </div>
    </div>
  );
}
