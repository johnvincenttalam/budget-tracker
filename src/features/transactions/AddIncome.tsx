import { useState } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { todayStr } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import { ArrowLeftIcon, CheckCircleIcon, DeleteIcon } from '../../shared/components/Icons';
import type { Screen } from '../../shared/types';
import { WalletPicker } from '../../shared/components/WalletPicker';

function safeEvaluate(expr: string): number {
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

export function AddIncome({ onNavigate, returnScreen = 'dashboard' }: { onNavigate: (s: Screen) => void; returnScreen?: Screen }) {
  const store = useBudgetStore();
  const addTransaction = store.addTransaction;
  const sym = store.currencySymbol;
  const expectedSalary = store.expectedSalary;

  const [amount, setAmount] = useState('');
  const [expression, setExpression] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [walletId, setWalletId] = useState(store.defaultWalletId);
  const [saved, setSaved] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const hasExpression = expression.includes('+') || expression.includes('-');

  const quickSources = ['Salary', 'Freelance', 'Bonus', 'Other'];

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

    setAmount(amount + val);
  }

  function useExpectedSalary() {
    setAmount(String(expectedSalary));
    setExpression('');
    setSource('Salary');
  }

  function handleSave() {
    let finalAmount = numericAmount;
    if (hasExpression) {
      const finalExpr = expression + amount;
      finalAmount = Math.max(0, safeEvaluate(finalExpr));
    }
    if (finalAmount <= 0) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date + 'T00:00:00').getTime())) return;
    addTransaction({
      type: 'income',
      amount: Math.round(finalAmount * 100) / 100,
      date,
      source: source.trim() || 'Income',
      note: note.trim() || undefined,
      walletId,
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

  const displayAmount = hasExpression
    ? String(Math.max(0, safeEvaluate(expression + amount)))
    : amount;

  const showExpectedSalaryHint = source === 'Salary' && expectedSalary > 0 && !amount && !expression;

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
        <h2 className="text-base font-semibold text-white">Add Income</h2>
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

      {/* Expected salary quick-fill */}
      {showExpectedSalaryHint && (
        <button
          onClick={useExpectedSalary}
          className="mb-4 self-center px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium active:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Use expected salary <span className="font-bold">{sym}{formatMoney(expectedSalary)}</span>
        </button>
      )}

      <div className="space-y-4">
        {/* Wallet picker — always visible */}
        <WalletPicker walletId={walletId} onChange={setWalletId} label="Going to" />

        {/* Source */}
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Source</p>
          <div className="flex gap-2 flex-wrap">
            {quickSources.map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  source === s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-900 text-slate-300 active:bg-slate-800'
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
            className="w-full bg-slate-900 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow"
          />
        </div>

        {/* Note + Date */}
        <div className="space-y-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full bg-slate-900 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-900 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow"
          />
        </div>
      </div>

      <div className="h-4" />


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

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={numericAmount <= 0 && !hasExpression}
        className="mt-3 mb-2 w-full py-3.5 rounded-2xl text-base font-bold transition-all active:scale-[0.98] disabled:opacity-30 bg-emerald-500 text-white"
      >
        Save Income
      </button>
    </div>
  );
}
