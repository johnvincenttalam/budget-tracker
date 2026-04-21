import { useState, useMemo } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import type { Tag, Screen } from '../../shared/types';
import { todayStr } from '../../shared/utils/cycle';
import { getCategoryIconName } from '../../shared/utils/categories';
import { suggestCategory } from '../../shared/utils/smart';
import { formatMoney } from '../../shared/utils/format';
import { CategoryIcon, ArrowLeftIcon, DeleteIcon, CheckCircleIcon } from '../../shared/components/Icons';

function safeEvaluate(expr: string): number {
  // Split expression by + and - while keeping operators
  const tokens: { op: '+' | '-'; value: number }[] = [];
  let current = '';
  let currentOp: '+' | '-' = '+';

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if ((ch === '+' || ch === '-') && current.length > 0) {
      tokens.push({ op: currentOp, value: parseFloat(current) || 0 });
      currentOp = ch as '+' | '-';
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.length > 0) {
    tokens.push({ op: currentOp, value: parseFloat(current) || 0 });
  }

  return tokens.reduce((sum, t) => (t.op === '+' ? sum + t.value : sum - t.value), 0);
}

export function AddExpense({ onNavigate, returnScreen = 'dashboard' }: { onNavigate: (s: Screen) => void; returnScreen?: Screen }) {
  const store = useBudgetStore();
  const addTransaction = store.addTransaction;
  const categories = store.getAllCategories();
  const customCategories = store.customCategories;
  const sym = store.currencySymbol;
  const [amount, setAmount] = useState('');
  const [expression, setExpression] = useState('');
  const [category, setCategory] = useState('Food');
  const [tag, setTag] = useState<Tag>('needs');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const hasExpression = expression.includes('+') || expression.includes('-');

  // Recent unique expenses for quick-fill chips
  const recentExpenses = useMemo(() => {
    const seen = new Set<string>();
    const results: { amount: number; category: string; note: string; tag: Tag }[] = [];
    const sorted = [...store.transactions]
      .filter((t) => t.type === 'expense')
      .sort((a, b) => (b.createdAt ?? b.date).localeCompare(a.createdAt ?? a.date));

    for (const t of sorted) {
      const key = `${t.amount}-${t.category}-${t.note || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        amount: t.amount,
        category: t.category || 'Other',
        note: t.note || '',
        tag: t.tag || 'needs',
      });
      if (results.length >= 5) break;
    }
    return results;
  }, [store.transactions]);

  // Auto-suggest category from past transactions matching the note
  const suggestion = useMemo(() => {
    if (!note.trim() || note.trim().length < 2) return null;
    const cat = suggestCategory(note, store.transactions);
    return cat && cat !== category ? cat : null;
  }, [note, store.transactions, category]);

  function handleKeypad(val: string) {
    if (val === 'C') {
      setAmount('');
      setExpression('');
      return;
    }
    if (val === 'del') {
      if (expression) {
        const newExpr = expression.slice(0, -1);
        setExpression(newExpr);
        // Recalculate amount from the last segment
        const lastOp = Math.max(newExpr.lastIndexOf('+'), newExpr.lastIndexOf('-'));
        setAmount(lastOp >= 0 ? newExpr.slice(lastOp + 1) : newExpr);
      } else {
        setAmount((prev) => prev.slice(0, -1));
      }
      return;
    }
    if (val === '+' || val === '-') {
      if (!amount && !expression) return;
      const newExpr = (expression || amount) + val;
      setExpression(newExpr);
      setAmount('');
      return;
    }
    if (val === '=') {
      if (!hasExpression) return;
      const finalExpr = expression + amount;
      const result = safeEvaluate(finalExpr);
      setAmount(String(Math.max(0, Math.round(result * 100) / 100)));
      setExpression('');
      return;
    }
    if (val === '.' && amount.includes('.')) return;
    if (amount.includes('.') && amount.split('.')[1].length >= 2) return;

    const newAmount = amount + val;
    setAmount(newAmount);
    if (expression) {
      // Keep expression in sync — replace last segment
      const lastOp = Math.max(expression.lastIndexOf('+'), expression.lastIndexOf('-'));
      if (lastOp >= 0 && lastOp === expression.length - 1) {
        // Operator is at the end, amount is the new segment
      }
    }
  }

  function handleChipTap(chip: typeof recentExpenses[0]) {
    setAmount(String(chip.amount));
    setCategory(chip.category);
    setNote(chip.note);
    setTag(chip.tag);
    setExpression('');
  }

  function handleSave() {
    // Auto-evaluate if expression pending
    let finalAmount = numericAmount;
    if (hasExpression) {
      const finalExpr = expression + amount;
      finalAmount = Math.max(0, safeEvaluate(finalExpr));
    }
    if (finalAmount <= 0) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date + 'T00:00:00').getTime())) return;
    addTransaction({
      type: 'expense',
      amount: Math.round(finalAmount * 100) / 100,
      category,
      tag,
      date,
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
          <p className="text-lg text-slate-300 animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>Expense saved!</p>
        </div>
      </div>
    );
  }

  const displayAmount = hasExpression
    ? String(Math.max(0, safeEvaluate(expression + amount)))
    : amount;

  return (
    <div className="flex flex-col h-[calc(100dvh-0.5rem)] px-5 pt-4 pb-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950 flex items-center justify-between pb-3 -mx-4 px-4 pt-0">
        <button
          onClick={() => onNavigate(returnScreen)}
          className="text-slate-400 p-2 -ml-2 flex items-center gap-1"
        >
          <ArrowLeftIcon size={18} />
          <span className="text-sm">Back</span>
        </button>
        <h2 className="text-base font-semibold text-white">Add Expense</h2>
        <div className="w-14" />
      </div>

      {/* Amount display */}
      <div className="text-center py-6">
        {hasExpression && (
          <p className="text-sm text-slate-500 mb-1">{expression}{amount}</p>
        )}
        <p className="text-6xl font-bold text-white tracking-tight min-h-[4rem] transition-all duration-150">
          <span className="text-2xl text-slate-500">{sym}</span>
          {displayAmount || '0'}
        </p>
      </div>

      {/* Recent expense quick-fill chips */}
      {!amount && !expression && recentExpenses.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {recentExpenses.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleChipTap(chip)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 shrink-0 active:bg-slate-800 transition-colors"
            >
              <CategoryIcon name={getCategoryIconName(chip.category, customCategories)} size={12} className="text-slate-400" />
              <span className="text-xs text-white font-medium">{formatMoney(chip.amount)}</span>
              {chip.note && <span className="text-[10px] text-slate-500 max-w-[60px] truncate">{chip.note}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Category buttons */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              category === cat
                ? 'bg-emerald-500 text-white scale-105'
                : 'bg-slate-900 text-slate-300'
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
              : 'bg-slate-900 text-slate-400'
          }`}
        >
          Needs
        </button>
        <button
          onClick={() => setTag('wants')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            tag === 'wants'
              ? 'bg-purple-500 text-white'
              : 'bg-slate-900 text-slate-400'
          }`}
        >
          Wants
        </button>
      </div>

      {/* Note */}
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className="w-full bg-slate-900 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow mb-2"
      />

      {/* Category suggestion */}
      {suggestion && (
        <button
          onClick={() => setCategory(suggestion)}
          className="text-[11px] text-emerald-400 mb-2 -mt-1 self-start px-2 py-1 rounded-lg bg-emerald-500/10 active:bg-emerald-500/20 transition-colors flex items-center gap-1"
        >
          <span>✨</span>
          Tap to use <span className="font-semibold">{suggestion}</span>
        </button>
      )}

      {/* Date */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full bg-slate-900 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow mb-3"
      />

      {/* Calculator Keypad */}
      <div className="grid grid-cols-4 gap-2 flex-1 max-h-[280px]">
        {[
          '1', '2', '3', '+',
          '4', '5', '6', '-',
          '7', '8', '9', '=',
          '.', '0', 'del', 'C',
        ].map((key) => (
          <button
            key={key}
            onClick={() => handleKeypad(key)}
            className={`rounded-xl text-xl font-semibold transition-all active:scale-95 flex items-center justify-center ${
              key === 'del'
                ? 'bg-slate-800 text-red-400'
                : key === 'C'
                  ? 'bg-slate-800 text-amber-400'
                  : key === '+' || key === '-' || key === '='
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-slate-900 text-white active:bg-slate-800'
            }`}
          >
            {key === 'del' ? <DeleteIcon size={22} /> : key}
          </button>
        ))}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={numericAmount <= 0 && !hasExpression}
        className="mt-3 mb-2 w-full py-3.5 rounded-2xl text-base font-bold transition-all active:scale-[0.98] disabled:opacity-30 bg-emerald-500 text-white"
      >
        Save Expense
      </button>
    </div>
  );
}
