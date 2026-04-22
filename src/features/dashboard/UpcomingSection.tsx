import { useMemo } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle, getNextCycle } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import { Card } from '../../shared/components/Card';
import { SectionLabel } from '../../shared/components/SectionLabel';
import { ServiceAvatar } from '../../shared/components/ServiceAvatar';

type UpcomingItem = {
  id: string;
  name: string;
  amount: number;
  dateLabel: string;
  type: 'income' | 'expense';
};

export function UpcomingSection() {
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const cycle = getCurrentCycle();
  const nextCycle = getNextCycle(cycle);

  const expenseItems = useMemo(() => {
    const expenses: UpcomingItem[] = [];

    // Upcoming expenses: unpaid bills in current cycle + bills for next cycle
    const payments = store.getBillPaymentsForCycle(cycle.startDate);
    const startDay = parseInt(cycle.startDate.split('-')[2]);
    const endDay = parseInt(cycle.endDate.split('-')[2]);

    // Current cycle unpaid bills (future due day only)
    const todayDay = new Date().getDate();
    for (const bill of store.billTemplates) {
      if (!bill.enabled) continue;
      if (bill.dueDay < startDay || bill.dueDay > endDay) continue;
      if (bill.createdInCycle && bill.createdInCycle > cycle.startDate) continue;
      if (bill.oneTimeCycle && bill.oneTimeCycle !== cycle.startDate) continue;
      if (payments.some((p) => p.billId === bill.id)) continue;
      if (bill.dueDay <= todayDay) continue;

      const override = store.getBillOverride(bill.id, cycle.startDate);
      expenses.push({
        id: `bill-${bill.id}`,
        name: bill.name,
        amount: override?.amount ?? bill.amount,
        dateLabel: `Due ${bill.dueDay}${ordSuffix(bill.dueDay)}`,
        type: 'expense',
      });
    }

    // Recurring templates for next cycle
    for (const tmpl of store.recurringTemplates) {
      if (!tmpl.enabled) continue;
      expenses.push({
        id: `rec-${tmpl.id}`,
        name: tmpl.note || tmpl.category,
        amount: tmpl.amount,
        dateLabel: nextCycle.label,
        type: 'expense',
      });
    }

    return expenses.slice(0, 5);
  }, [store, cycle, nextCycle]);

  if (expenseItems.length === 0) return null;

  return (
    <Card>
      <SectionLabel className="mb-3">Upcoming</SectionLabel>
      <div className="space-y-2">
        {expenseItems.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5">
            <ServiceAvatar name={item.name} size={28} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{item.name}</p>
              <p className="text-[10px] text-slate-500">{item.dateLabel}</p>
            </div>
            <p className="text-sm font-semibold text-red-400 shrink-0">−{formatMoney(item.amount, sym)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ordSuffix(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  const last = n % 10;
  return last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th';
}
