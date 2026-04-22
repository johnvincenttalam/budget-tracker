import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle, getNextCycle, getPrevCycle, isDateInCycle } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import { Card } from '../../shared/components/Card';
import { SectionLabel } from '../../shared/components/SectionLabel';

export function PaydayCountdown() {
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const cycle = getCurrentCycle();
  const nextCycle = getNextCycle(cycle);
  const prevCycle = getPrevCycle(cycle);

  const today = new Date();
  const endDate = new Date(cycle.endDate + 'T00:00:00');
  const startDate = new Date(cycle.startDate + 'T00:00:00');
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / 86400000));
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) || 1;
  const elapsed = totalDays - daysLeft;
  const progressPct = Math.min(100, (elapsed / totalDays) * 100);

  const prevSalary = store.transactions
    .filter((t) => t.type === 'income' && t.source === 'Salary' && isDateInCycle(t.date, prevCycle))
    .reduce((sum, t) => sum + t.amount, 0);
  const expected = store.expectedSalary > 0 ? store.expectedSalary : prevSalary;

  // Format next cycle start as "May 1"
  const nextStart = new Date(nextCycle.startDate + 'T00:00:00');
  const monthName = nextStart.toLocaleString('en-US', { month: 'short' });
  const dayNum = nextStart.getDate();

  return (
    <Card size="md">
      <SectionLabel className="mb-2">Days Until Payday</SectionLabel>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-4xl font-bold text-white">{daysLeft}</p>
          <p className="text-xs text-slate-500 mt-0.5">Next: {monthName} {dayNum}</p>
        </div>
        {expected > 0 && (
          <div className="text-right">
            <p className="text-sm font-semibold text-emerald-400">{formatMoney(expected, sym)}</p>
            <p className="text-[10px] text-slate-500">Expected salary</p>
          </div>
        )}
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </Card>
  );
}
