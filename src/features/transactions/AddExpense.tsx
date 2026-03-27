import { useState } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import type { Tag, Screen } from '../../shared/types';
import { todayStr } from '../../shared/utils/cycle';
import { getCategoryIconName } from '../../shared/utils/categories';
import { CategoryIcon, ArrowLeftIcon, DeleteIcon, CheckCircleIcon } from '../../shared/components/Icons';

export function AddExpense({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const store = useBudgetStore();
  const addTransaction = store.addTransaction;
  const categories = store.getAllCategories();
  const customCategories = store.customCategories;
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [tag, setTag] = useState<Tag>('needs');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const numericAmount = parseFloat(amount) || 0;

  function handleKeypad(val: string) {
    if (val === 'del') {
      setAmount((prev) => prev.slice(0, -1));
      return;
    }
    if (val === '.' && amount.includes('.')) return;
    // Limit to 2 decimal places
    if (amount.includes('.') && amount.split('.')[1].length >= 2) return;
    setAmount((prev) => prev + val);
  }

  function handleSave() {
    if (numericAmount <= 0) return;
    addTransaction({
      type: 'expense',
      amount: numericAmount,
      category,
      tag,
      date: todayStr(),
      note: note.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => {
      onNavigate('dashboard');
    }, 600);
  }

  if (saved) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-3 animate-success">
            <CheckCircleIcon size={32} className="text-emerald-400" />
          </div>
          <p className="text-lg text-slate-300 animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>Expense saved!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-1rem)] px-4 pt-4 pb-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950 flex items-center justify-between pb-3 -mx-4 px-4 pt-0">
        <button
          onClick={() => onNavigate('dashboard')}
          className="text-slate-400 p-2 -ml-2 flex items-center gap-1"
        >
          <ArrowLeftIcon size={18} />
          <span className="text-sm">Back</span>
        </button>
        <h2 className="text-base font-semibold text-white">Add Expense</h2>
        <div className="w-14" />
      </div>

      {/* Amount display */}
      <div className="text-center py-4">
        <p className="text-5xl font-bold text-white tracking-tight min-h-[3.5rem]">
          {amount || '0'}
        </p>
      </div>

      {/* Category buttons */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              category === cat
                ? 'bg-emerald-500 text-white scale-105'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            <CategoryIcon name={getCategoryIconName(cat, customCategories)} size={16} />
            {cat}
          </button>
        ))}
      </div>

      {/* Needs / Wants toggle */}
      <div className="flex justify-center gap-2 mb-3">
        <button
          onClick={() => setTag('needs')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            tag === 'needs'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          Needs
        </button>
        <button
          onClick={() => setTag('wants')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            tag === 'wants'
              ? 'bg-purple-500 text-white'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          Wants
        </button>
      </div>

      {/* Note input */}
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        className="bg-slate-800/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50 mb-3"
      />

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2 flex-1 max-h-[280px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'].map(
          (key) => (
            <button
              key={key}
              onClick={() => handleKeypad(key)}
              className={`rounded-xl text-xl font-semibold transition-all active:scale-95 flex items-center justify-center ${
                key === 'del'
                  ? 'bg-slate-700 text-red-400'
                  : 'bg-slate-800 text-white active:bg-slate-700'
              }`}
            >
              {key === 'del' ? <DeleteIcon size={22} /> : key}
            </button>
          )
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={numericAmount <= 0}
        className="mt-3 mb-2 w-full py-4 rounded-2xl text-lg font-bold transition-all active:scale-[0.98] disabled:opacity-30 bg-emerald-500 text-white"
      >
        Save Expense
      </button>
    </div>
  );
}
