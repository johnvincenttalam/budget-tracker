import { useState } from 'react';
import { useToast } from '../../shared/components/ToastProvider';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import { SavingsIconComponent } from '../../shared/components/Icons';
import type { Screen, SavingsGoal } from '../../shared/types';

const GOAL_COLORS = [
  { name: 'emerald', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/15', text: 'text-emerald-400', ring: 'ring-emerald-500' },
  { name: 'blue', bg: 'bg-blue-500', bgLight: 'bg-blue-500/15', text: 'text-blue-400', ring: 'ring-blue-500' },
  { name: 'purple', bg: 'bg-purple-500', bgLight: 'bg-purple-500/15', text: 'text-purple-400', ring: 'ring-purple-500' },
  { name: 'amber', bg: 'bg-amber-500', bgLight: 'bg-amber-500/15', text: 'text-amber-400', ring: 'ring-amber-500' },
  { name: 'rose', bg: 'bg-rose-500', bgLight: 'bg-rose-500/15', text: 'text-rose-400', ring: 'ring-rose-500' },
  { name: 'cyan', bg: 'bg-cyan-500', bgLight: 'bg-cyan-500/15', text: 'text-cyan-400', ring: 'ring-cyan-500' },
  { name: 'orange', bg: 'bg-orange-500', bgLight: 'bg-orange-500/15', text: 'text-orange-400', ring: 'ring-orange-500' },
  { name: 'pink', bg: 'bg-pink-500', bgLight: 'bg-pink-500/15', text: 'text-pink-400', ring: 'ring-pink-500' },
];

function getColor(name: string) {
  return GOAL_COLORS.find((c) => c.name === name) ?? GOAL_COLORS[0];
}

const GOAL_ICONS = [
  { icon: 'Target', label: 'Target' },
  { icon: 'Home', label: 'Home' },
  { icon: 'Car', label: 'Car' },
  { icon: 'Travel', label: 'Travel' },
  { icon: 'Phone', label: 'Tech' },
  { icon: 'Education', label: 'Education' },
  { icon: 'Health', label: 'Health' },
  { icon: 'Shield', label: 'Emergency' },
  { icon: 'Baby', label: 'Baby' },
  { icon: 'Ring', label: 'Wedding' },
  { icon: 'Gift', label: 'Gift' },
  { icon: 'PiggyBank', label: 'General' },
];

export function Savings({ onNavigate: _onNavigate }: { onNavigate: (s: Screen) => void }) {
  const toast = useToast();
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const goals = store.savingsGoals;
  const cycle = getCurrentCycle();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState('emerald');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Contribute & history state
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeNote, setContributeNote] = useState('');

  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  function resetForm() {
    setName('');
    setTargetAmount('');
    setIcon('Target');
    setColor('emerald');
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(goal: SavingsGoal) {
    setEditingId(goal.id);
    setName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setIcon(goal.icon);
    setColor(goal.color || 'emerald');
    setShowForm(true);
  }

  function handleSave() {
    const target = parseFloat(targetAmount);
    if (!name.trim() || target <= 0 || isNaN(target)) return;
    if (editingId) {
      store.updateSavingsGoal(editingId, { name: name.trim(), targetAmount: target, icon, color });
      toast('Goal updated');
    } else {
      store.addSavingsGoal({ name: name.trim(), targetAmount: target, savedAmount: 0, icon, color });
      toast(`${name.trim()} created`);
    }
    resetForm();
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      const goal = goals.find((g) => g.id === id);
      store.deleteSavingsGoal(id);
      setConfirmDelete(null);
      toast(goal ? `${goal.name} deleted` : 'Goal deleted');
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete((prev) => prev === id ? null : prev), 3000);
    }
  }

  function handleContribute(goalId: string) {
    const amount = parseFloat(contributeAmount);
    if (!amount || isNaN(amount)) return;
    store.addContribution(goalId, amount, cycle.startDate, contributeNote.trim() || undefined);
    toast(`${formatMoney(amount, sym)} deposited`);
    setContributingId(null);
    setContributeAmount('');
    setContributeNote('');
  }

  function handleWithdraw(goalId: string) {
    const amount = parseFloat(contributeAmount);
    if (!amount || isNaN(amount)) return;
    store.addContribution(goalId, -amount, cycle.startDate, contributeNote.trim() || 'Withdrawal');
    toast(`${formatMoney(amount, sym)} withdrawn`);
    setContributingId(null);
    setContributeAmount('');
    setContributeNote('');
  }

  return (
    <div className="flex flex-col gap-4 pb-28 px-4 pt-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-base font-semibold text-white">Savings</h2>
      </div>

      {/* Total overview */}
      {goals.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-5 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Saved</p>
          <p className="text-3xl font-bold text-emerald-400">{formatMoney(totalSaved, sym)}</p>
          {totalTarget > 0 && (
            <>
              <p className="text-xs text-slate-500 mt-1">of {formatMoney(totalTarget, sym)} target</p>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((totalSaved / totalTarget) * 100, 100)}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Goals */}
      {goals.map((goal) => {
        const pct = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;
        const isComplete = goal.savedAmount >= goal.targetAmount;
        const isContributing = contributingId === goal.id;
        const gc = getColor(goal.color);

        return (
          <div key={goal.id} className="bg-slate-900 rounded-2xl overflow-hidden">
            <div className="p-4">
              {/* Goal header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${gc.bgLight} flex items-center justify-center ${gc.text}`}>
                  <SavingsIconComponent name={goal.icon} size={20} />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleEdit(goal)}>
                  <p className="text-sm font-medium text-white">{goal.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatMoney(goal.savedAmount, sym)} of {formatMoney(goal.targetAmount, sym)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {isComplete && (
                    <span className={`text-xs ${gc.bgLight} ${gc.text} px-2 py-0.5 rounded-full font-medium`}>Done</span>
                  )}
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className={`text-xs px-2 py-1 rounded-lg transition-all duration-200 ${
                      confirmDelete === goal.id ? 'bg-red-500 text-white scale-110' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {confirmDelete === goal.id ? 'Sure?' : '×'}
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${gc.bg}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{pct.toFixed(0)}%</span>
                <span className="text-slate-500">{formatMoney(goal.targetAmount - goal.savedAmount, sym)} left</span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setContributingId(isContributing ? null : goal.id);
                    setHistoryId(null);
                    setContributeAmount('');
                    setContributeNote('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    isContributing ? 'bg-slate-700 text-slate-300' : `${gc.bgLight} ${gc.text}`
                  }`}
                >
                  {isContributing ? 'Cancel' : '+ Add Money'}
                </button>
                <button
                  onClick={() => {
                    setHistoryId(historyId === goal.id ? null : goal.id);
                    setContributingId(null);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                    historyId === goal.id ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  History
                </button>
              </div>
            </div>

            {/* Contribute form */}
            {isContributing && (
              <div className="border-t border-slate-800 p-4 space-y-3 animate-slide-up">
                <input
                  type="number"
                  inputMode="decimal"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
                  autoFocus
                />
                <input
                  type="text"
                  value={contributeNote}
                  onChange={(e) => setContributeNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleContribute(goal.id)}
                    disabled={!contributeAmount || parseFloat(contributeAmount) <= 0}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white disabled:opacity-30 transition-all active:scale-[0.98]"
                  >
                    Deposit
                  </button>
                  {goal.savedAmount > 0 && (
                    <button
                      onClick={() => handleWithdraw(goal.id)}
                      disabled={!contributeAmount || parseFloat(contributeAmount) <= 0}
                      className="py-2.5 px-4 rounded-xl text-sm font-medium bg-red-500/15 text-red-400 disabled:opacity-30 transition-all active:scale-[0.98]"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Contribution history */}
            {historyId === goal.id && (() => {
              const contributions = store.getContributionsForGoal(goal.id)
                .sort((a, b) => b.date.localeCompare(a.date));
              return (
                <div className="border-t border-slate-800 animate-slide-up">
                  {contributions.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No transactions yet</p>
                  ) : (
                    <div className="divide-y divide-slate-800/50">
                      {contributions.map((c) => {
                        const isDeposit = c.amount > 0;
                        const d = new Date(c.date + 'T00:00:00');
                        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        return (
                          <div key={c.id} className="px-4 py-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                isDeposit ? 'bg-emerald-500/15' : 'bg-red-500/15'
                              }`}>
                                <svg className={`w-3 h-3 ${isDeposit ? 'text-emerald-400' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d={isDeposit ? 'M12 19V5m-7 7 7-7 7 7' : 'M12 5v14m7-7-7 7-7-7'} />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-slate-400">{label}</p>
                                {c.note && <p className="text-[10px] text-slate-600 truncate">{c.note}</p>}
                              </div>
                            </div>
                            <p className={`text-sm font-semibold shrink-0 ${isDeposit ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isDeposit ? '+' : '−'}{formatMoney(Math.abs(c.amount), sym)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}

      {/* Empty state */}
      {goals.length === 0 && !showForm && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 mb-3 text-slate-500">
            <SavingsIconComponent name="Target" size={32} />
          </div>
          <p className="text-slate-400 text-sm">No savings goals yet</p>
          <p className="text-slate-500 text-xs mt-1">Set a goal and start saving each cycle</p>
        </div>
      )}

      {/* Add/Edit form */}
      {showForm ? (
        <div className="bg-slate-900 rounded-2xl p-4 space-y-3 animate-slide-up">
          <p className="text-xs text-slate-400 uppercase tracking-wider">{editingId ? 'Edit Goal' : 'New Goal'}</p>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Goal name (e.g. Emergency Fund)"
            className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
            autoFocus
          />

          <input
            type="number"
            inputMode="decimal"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="Target amount"
            className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
          />

          {/* Icon picker */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Icon</p>
            <div className="grid grid-cols-4 gap-2">
              {GOAL_ICONS.map((g) => {
                const sel = getColor(color);
                return (
                  <button
                    key={g.icon}
                    onClick={() => setIcon(g.icon)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all ${
                      icon === g.icon ? `${sel.bgLight} ring-1 ${sel.ring} ${sel.text}` : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <SavingsIconComponent name={g.icon} size={20} />
                    <span className="text-[10px]">{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Color</p>
            <div className="flex gap-2 flex-wrap">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={`w-9 h-9 rounded-xl ${c.bg} transition-all ${
                    color === c.name ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-60'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!name.trim() || !targetAmount || parseFloat(targetAmount) <= 0}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white disabled:opacity-30 transition-all active:scale-[0.98]"
            >
              {editingId ? 'Save' : 'Create Goal'}
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
          + New Goal
        </button>
      )}
    </div>
  );
}
