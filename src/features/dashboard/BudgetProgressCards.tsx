import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import { getCategoryIconName } from '../../shared/utils/categories';
import { CategoryIcon } from '../../shared/components/Icons';
import { Card } from '../../shared/components/Card';
import { SectionLabel } from '../../shared/components/SectionLabel';

export function BudgetProgressCards() {
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const cycle = getCurrentCycle();
  const byCategory = store.getExpensesByCategory(cycle);
  const customCategories = store.customCategories;

  const budgets = store.categoryBudgets.filter((b) => b.limit > 0);
  if (budgets.length === 0) return null;

  return (
    <div>
      <SectionLabel className="mb-2">Budget Progress</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        {budgets.map((budget) => {
          const spent = byCategory[budget.category] || 0;
          const pct = Math.min((spent / budget.limit) * 100, 100);
          const remaining = budget.limit - spent;
          const isOver = spent > budget.limit;
          const barColor =
            pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500';
          const textColor =
            pct > 80 ? 'text-red-400' : pct > 50 ? 'text-amber-400' : 'text-emerald-400';

          return (
            <Card key={budget.category} size="sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center">
                  <CategoryIcon
                    name={getCategoryIconName(budget.category, customCategories)}
                    size={14}
                    className="text-slate-300"
                  />
                </div>
                <p className="text-xs text-white font-medium truncate">{budget.category}</p>
              </div>
              <p className="text-[10px] text-slate-500 mb-1.5">
                {formatMoney(spent, sym)} / {formatMoney(budget.limit, sym)}
              </p>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className={`text-[10px] font-medium ${textColor}`}>
                {isOver
                  ? `Over by ${formatMoney(Math.abs(remaining), sym)}`
                  : `${formatMoney(remaining, sym)} left`}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
