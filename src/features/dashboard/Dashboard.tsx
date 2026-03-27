import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle, getPreviousCycle } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import { getCategoryIconName } from '../../shared/utils/categories';
import { CategoryIcon, EmptyWalletIcon } from '../../shared/components/Icons';
import { BudgetProgress } from '../../shared/components/BudgetProgress';
import { RecurringPrompt } from '../recurring/RecurringPrompt';
import type { Screen } from '../../shared/types';

export function Dashboard({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const store = useBudgetStore();
  const customCategories = store.customCategories;
  const sym = store.currencySymbol;
  const cycle = getCurrentCycle();
  const income = store.getTotalIncome(cycle);
  const expenses = store.getTotalExpenses(cycle);
  const balance = store.getBalance(cycle);
  const byCategory = store.getExpensesByCategory(cycle);
  const categoryBudgets = store.categoryBudgets;
  const isOverBudget = balance < 0;

  // Recent transactions (last 5)
  const recentTxns = store
    .getTransactionsForCycle(cycle)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // Previous cycle
  const prevCycle = getPreviousCycle();
  const prevBalance = store.getBalance(prevCycle);

  return (
    <div className="flex flex-col gap-4 pb-28 px-4 pt-6">
      <RecurringPrompt />

      {/* Cycle label */}
      <div className="text-center">
        <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
          Current Cycle
        </span>
        <h2 className="text-lg font-semibold text-white mt-0.5">{cycle.label}</h2>
      </div>

      {/* Balance card */}
      <div
        className={`rounded-2xl p-6 text-center transition-colors ${
          isOverBudget
            ? 'bg-red-500/20 ring-1 ring-red-500/40'
            : 'bg-gradient-to-br from-emerald-600/30 to-emerald-800/20 ring-1 ring-emerald-500/20'
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
        <div className="bg-slate-800/60 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Income</p>
          <p className="text-xl font-bold text-emerald-400">+{formatMoney(income, sym)}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Expenses</p>
          <p className="text-xl font-bold text-red-400">−{formatMoney(expenses, sym)}</p>
        </div>
      </div>

      {/* Previous Cycle */}
      <div className="bg-slate-800/60 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Previous Cycle</p>
          <p className="text-xs text-slate-500">{prevCycle.label}</p>
        </div>
        <p className={`text-lg font-bold ${prevBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatMoney(prevBalance, sym)}
        </p>
      </div>

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-slate-800/60 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider">Expenses by Category</p>
          <div className="space-y-2">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, total]) => {
                const budget = categoryBudgets.find((b) => b.category === cat);
                const pct = expenses > 0 ? (total / expenses) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-300 flex items-center gap-1.5">
                        <CategoryIcon name={getCategoryIconName(cat, customCategories)} size={16} className="text-slate-400" />
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
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

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
          <div className="space-y-2">
            {recentTxns.map((t) => (
              <div
                key={t.id}
                className="bg-slate-800/40 rounded-xl px-4 py-3 flex items-center justify-between"
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 mb-3">
            <EmptyWalletIcon size={32} className="text-slate-500" />
          </div>
          <p className="text-slate-400 text-sm">No transactions yet</p>
          <p className="text-slate-500 text-xs mt-1">Tap + to get started</p>
        </div>
      )}
    </div>
  );
}
