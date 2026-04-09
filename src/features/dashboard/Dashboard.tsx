import { useState } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { ClipboardCheckIcon } from '../../shared/components/Icons';
import { getCurrentCycle, getNextCycle, getPrevCycle } from '../../shared/utils/cycle';

const CATEGORY_COLORS = ['#34D399', '#60A5FA', '#F472B6', '#FBBF24', '#A78BFA', '#FB923C', '#2DD4BF', '#F87171', '#818CF8', '#4ADE80'];
import { formatMoney } from '../../shared/utils/format';
import { getCategoryIconName } from '../../shared/utils/categories';
import { CategoryIcon, EmptyWalletIcon, SavingsIconComponent } from '../../shared/components/Icons';
import { BudgetProgress } from '../../shared/components/BudgetProgress';
import { RecurringPrompt } from '../recurring/RecurringPrompt';
import type { Screen } from '../../shared/types';

export function Dashboard({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const store = useBudgetStore();
  const customCategories = store.customCategories;
  const sym = store.currencySymbol;
  const [cycle, setCycle] = useState(() => getCurrentCycle());
  const isCurrentCycle = cycle.startDate === getCurrentCycle().startDate;
  const income = store.getTotalIncome(cycle);
  const expenses = store.getTotalExpenses(cycle);
  const balance = store.getBalance(cycle);
  const byCategory = store.getExpensesByCategory(cycle);
  const categoryBudgets = store.categoryBudgets;
  const isOverBudget = balance < 0;

  // Recent transactions (last 5)
  const recentTxns = store
    .getTransactionsForCycle(cycle)
    .sort((a, b) => {
      const aTime = a.createdAt ?? a.date;
      const bTime = b.createdAt ?? b.date;
      return bTime.localeCompare(aTime);
    })
    .slice(0, 5);

  // Bills summary for current cycle (with per-cycle overrides)
  const startDay = parseInt(cycle.startDate.split('-')[2]);
  const endDay = parseInt(cycle.endDate.split('-')[2]);
  const cycleBills = store.billTemplates
    .filter((b) => b.enabled && b.dueDay >= startDay && b.dueDay <= endDay && (!b.createdInCycle || b.createdInCycle <= cycle.startDate) && (!b.oneTimeCycle || b.oneTimeCycle === cycle.startDate))
    .map((b) => {
      const override = store.getBillOverride(b.id, cycle.startDate);
      if (!override) return b;
      return { ...b, amount: override.amount ?? b.amount };
    });
  const billPayments = store.getBillPaymentsForCycle(cycle.startDate);
  const billsPaid = cycleBills.filter((b) => billPayments.some((p) => p.billId === b.id)).length;
  const billsTotal = cycleBills.length;
  const billsTotalDue = cycleBills.reduce((sum, b) => sum + b.amount, 0);
  const billsTotalPaid = cycleBills.filter((b) => billPayments.some((p) => p.billId === b.id)).reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="flex flex-col gap-4 pb-28 px-4 pt-6">
      <RecurringPrompt />

      {/* Cycle switcher */}
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
          <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
            {isCurrentCycle ? 'Current Cycle' : 'Viewing'}
          </span>
          <button
            onClick={() => setCycle(getCurrentCycle())}
            className={`block mx-auto text-lg font-semibold mt-0.5 transition-colors ${isCurrentCycle ? 'text-white' : 'text-emerald-400'}`}
          >
            {cycle.label}
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

      {/* Balance card */}
      <div
        className={`rounded-2xl p-6 text-center transition-colors ${
          isOverBudget
            ? 'bg-slate-900 ring-1 ring-red-500/40'
            : 'bg-slate-900'
        }`}
      >
        <p className="text-sm text-slate-300 mb-1">Remaining Balance</p>
        <p
          className={`text-5xl font-bold tracking-tight ${
            isOverBudget ? 'text-red-400' : 'text-emerald-400'
          }`}
        >
          {isOverBudget && '−'}
          {formatMoney(Math.abs(balance), sym)}
        </p>
        {isOverBudget && (
          <p className="text-red-400 text-sm mt-2 font-medium">
            Over budget by {formatMoney(Math.abs(balance), sym)}
          </p>
        )}
      </div>

      {/* Income / Expense summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Income</p>
          <p className="text-xl font-bold text-emerald-400">+{formatMoney(income, sym)}</p>
        </div>
        <div className="bg-slate-900 rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Expenses</p>
          <p className="text-xl font-bold text-red-400">−{formatMoney(expenses, sym)}</p>
        </div>
      </div>

      {/* Bills summary */}
      {billsTotal > 0 && (
        <button
          onClick={() => onNavigate('bills')}
          className="bg-slate-900 rounded-2xl p-4 text-left active:bg-slate-800 transition-colors"
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <ClipboardCheckIcon size={16} className="text-slate-400" />
              <p className="text-xs text-slate-400 uppercase tracking-wider">Bills</p>
            </div>
            <p className="text-xs text-slate-500">{billsPaid} of {billsTotal} paid</p>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2.5">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(billsPaid / billsTotal) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-emerald-400 font-semibold">{formatMoney(billsTotalPaid, sym)}</span>
            <span className="text-slate-400">{formatMoney(billsTotalDue - billsTotalPaid, sym)} remaining</span>
          </div>
        </button>
      )}

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider">Expenses by Category</p>
          <div className="space-y-2">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, total], i) => {
                const budget = categoryBudgets.find((b) => b.category === cat);
                const pct = expenses > 0 ? (total / expenses) * 100 : 0;
                const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-300 flex items-center gap-1.5">
                        <CategoryIcon name={getCategoryIconName(cat, customCategories)} size={16} style={{ color }} />
                        {cat}
                      </span>
                      <span className="text-sm font-semibold text-slate-200">
                        {formatMoney(total, sym)}
                      </span>
                    </div>
                    {budget ? (
                      <BudgetProgress spent={total} limit={budget.limit} symbol={sym} />
                    ) : (
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Savings summary */}
      {store.savingsGoals.length > 0 && (() => {
        const totalSaved = store.savingsGoals.reduce((sum, g) => sum + g.savedAmount, 0);
        const totalTarget = store.savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
        const topGoal = store.savingsGoals.reduce((best, g) => {
          const pct = g.targetAmount > 0 ? g.savedAmount / g.targetAmount : 0;
          const bestPct = best.targetAmount > 0 ? best.savedAmount / best.targetAmount : 0;
          return pct > bestPct ? g : best;
        });
        return (
          <button
            onClick={() => onNavigate('savings')}
            className="bg-slate-900 rounded-2xl p-4 text-left active:bg-slate-800 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <SavingsIconComponent name={topGoal.icon} size={16} className="text-slate-400" />
                <p className="text-xs text-slate-400 uppercase tracking-wider">Savings</p>
              </div>
              <p className="text-xs text-slate-500">{store.savingsGoals.length} goal{store.savingsGoals.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2.5">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-400 font-semibold">{formatMoney(totalSaved, sym)}</span>
              <span className="text-slate-400">of {formatMoney(totalTarget, sym)}</span>
            </div>
          </button>
        );
      })()}

      {/* Wishlist summary */}
      {store.wishlistItems.filter((i) => !i.purchased).length > 0 && (() => {
        const unpurchased = store.wishlistItems.filter((i) => !i.purchased);
        // Sort by affordability (closest to affordable first), then by priority
        const priorityOrder: Record<string, number> = { need: 0, want: 1, someday: 2 };
        const topItems = [...unpurchased]
          .sort((a, b) => {
            const aDiff = Math.max(0, a.price - balance);
            const bDiff = Math.max(0, b.price - balance);
            if (aDiff !== bDiff) return aDiff - bDiff;
            return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
          })
          .slice(0, 3);
        return (
          <button
            onClick={() => onNavigate('wishlist')}
            className="bg-slate-900 rounded-2xl p-4 text-left active:bg-slate-800 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Wishlist</p>
              </div>
              <p className="text-xs text-slate-500">{unpurchased.length} item{unpurchased.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="space-y-1.5">
              {topItems.map((item) => {
                const canAfford = balance >= item.price;
                return (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 truncate flex-1 mr-2">{item.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-white font-medium">{formatMoney(item.price, sym)}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${canAfford ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </button>
        );
      })()}

      {/* Recent transactions */}
      {recentTxns.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Recent</p>
            <button
              onClick={() => onNavigate('summary')}
              className="text-xs text-emerald-400 font-medium"
            >
              View all
            </button>
          </div>
          <div className="bg-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-800">
            {recentTxns.map((t) => (
              <div
                key={t.id}
                className="px-4 py-3 flex items-center justify-between active:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    t.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  }`}>
                    {t.type === 'income' ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-7 7 7-7 7 7" />
                      </svg>
                    ) : (
                      <CategoryIcon name={getCategoryIconName(t.category ?? 'Other', customCategories)} size={16} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-200">
                      {t.type === 'income' ? t.source ?? 'Income' : t.category ?? 'Other'}
                    </p>
                    {t.note && <p className="text-xs text-slate-500">{t.note}</p>}
                  </div>
                </div>
                <p
                  className={`text-sm font-bold ${
                    t.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {t.type === 'income' ? '+' : '−'}
                  {formatMoney(t.amount, sym)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recentTxns.length === 0 && income === 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 mb-3">
            <EmptyWalletIcon size={32} className="text-slate-500" />
          </div>
          <p className="text-slate-400 text-sm">No transactions yet</p>
          <p className="text-slate-500 text-xs mt-1">Tap + to get started</p>
        </div>
      )}
    </div>
  );
}
