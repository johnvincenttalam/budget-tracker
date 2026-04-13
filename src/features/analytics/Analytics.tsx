import { useState } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle, getPreviousCycle } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import { getCategoryIconName } from '../../shared/utils/categories';
import { CategoryIcon } from '../../shared/components/Icons';
import { SpendingTrendsChart } from './SpendingTrendsChart';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { NeedsWantsChart } from './NeedsWantsChart';
import type { Screen } from '../../shared/types';

export function Analytics({ onNavigate: _onNavigate }: { onNavigate: (s: Screen) => void }) {
  const store = useBudgetStore();
  const customCategories = store.customCategories;
  const sym = store.currencySymbol;
  const [tab, setTab] = useState<'current' | 'previous'>('current');

  const cycle = tab === 'current' ? getCurrentCycle() : getPreviousCycle();
  const prevCycle = getPreviousCycle();
  const currentCycle = getCurrentCycle();

  const income = store.getTotalIncome(cycle);
  const expenses = store.getTotalExpenses(cycle);
  const byCategory = store.getExpensesByCategory(cycle);

  // Average daily spend
  const today = new Date();
  const cycleStart = new Date(cycle.startDate + 'T00:00:00');
  const cycleEnd = new Date(cycle.endDate + 'T00:00:00');
  const daysElapsed = Math.max(1, Math.floor((today.getTime() - cycleStart.getTime()) / 86400000) + 1);
  const totalDays = Math.floor((cycleEnd.getTime() - cycleStart.getTime()) / 86400000) + 1;
  const avgDaily = expenses / daysElapsed;

  // Top spending category
  const catEntries = Object.entries(byCategory).sort(([, a], [, b]) => b - a);
  const topCategory = catEntries.length > 0 ? catEntries[0] : null;

  // Previous cycle data for comparison
  const prevByCategory = store.getExpensesByCategory(prevCycle);
  const prevTopAmount = topCategory ? (prevByCategory[topCategory[0]] ?? 0) : 0;
  const topCategoryChange = topCategory && prevTopAmount > 0
    ? ((topCategory[1] - prevTopAmount) / prevTopAmount) * 100
    : null;

  // Cycle comparison
  const curIncome = store.getTotalIncome(currentCycle);
  const curExpenses = store.getTotalExpenses(currentCycle);
  const curBalance = store.getBalance(currentCycle);
  const prevIncome = store.getTotalIncome(prevCycle);
  const prevExpenses = store.getTotalExpenses(prevCycle);
  const prevBalance = store.getBalance(prevCycle);
  const savingsRate = curIncome > 0 ? Math.round((curBalance / curIncome) * 100) : 0;
  const prevSavingsRate = prevIncome > 0 ? Math.round((prevBalance / prevIncome) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 pb-28 px-4 pt-4">
      {/* Cycle toggle */}
      <div className="flex bg-slate-900 rounded-xl p-0.5">
        <button onClick={() => setTab('current')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'current' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>
          Current · {tab === 'current' ? cycle.label : ''}
        </button>
        <button onClick={() => setTab('previous')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'previous' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>
          Previous · {tab === 'previous' ? cycle.label : ''}
        </button>
      </div>

      {/* Quick stats row */}
      {expenses > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900 rounded-xl p-3">
            <p className="text-[10px] text-slate-500">Daily Avg</p>
            <p className="text-sm font-bold text-white">{formatMoney(avgDaily, sym)}</p>
            <p className="text-[10px] text-slate-500">Day {daysElapsed}/{totalDays}</p>
          </div>
          {topCategory && (
            <div className="bg-slate-900 rounded-xl p-3">
              <p className="text-[10px] text-slate-500">Top Category</p>
              <div className="flex items-center gap-1.5">
                <CategoryIcon name={getCategoryIconName(topCategory[0], customCategories)} size={14} className="text-red-400" />
                <p className="text-sm font-bold text-white">{topCategory[0]}</p>
              </div>
              <p className="text-[10px] text-red-400">{formatMoney(topCategory[1], sym)}
                {topCategoryChange !== null && <span> ({topCategoryChange > 0 ? '+' : ''}{topCategoryChange.toFixed(0)}%)</span>}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <SpendingTrendsChart />
      <IncomeExpenseChart />
      <NeedsWantsChart cycle={cycle} />

      {/* Cycle Comparison */}
      <div className="bg-slate-900 rounded-2xl p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2.5">Cycle Comparison</p>
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-2 text-center pb-1 border-b border-slate-800/50">
            <div />
            <p className="text-[9px] text-emerald-400 font-medium uppercase">Current</p>
            <p className="text-[9px] text-slate-600 font-medium uppercase">Previous</p>
          </div>
          {([
            ['Income', formatMoney(curIncome, sym), formatMoney(prevIncome, sym), 'text-emerald-400'],
            ['Expenses', formatMoney(curExpenses, sym), formatMoney(prevExpenses, sym), 'text-red-400'],
            ['Balance', formatMoney(curBalance, sym), formatMoney(prevBalance, sym), curBalance >= 0 ? 'text-emerald-400' : 'text-red-400'],
            ['Saved', `${savingsRate}%`, `${prevSavingsRate}%`, 'text-white'],
          ] as const).map(([label, cur, prev, color]) => (
            <div key={label} className="grid grid-cols-3 gap-2 items-center">
              <p className="text-[11px] text-slate-400">{label}</p>
              <p className={`text-xs font-semibold text-center ${color}`}>{cur}</p>
              <p className="text-xs text-slate-600 text-center">{prev}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {expenses === 0 && income === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm">No data for this cycle</p>
          <p className="text-slate-500 text-xs mt-1">Add transactions to see analytics</p>
        </div>
      )}
    </div>
  );
}
