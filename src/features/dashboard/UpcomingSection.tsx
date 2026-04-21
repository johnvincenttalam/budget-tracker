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

  const { incomeItems, expenseItems } = useMemo(() => {
    const incomes: UpcomingItem[] = [];
    const expenses: UpcomingItem[] = [];

    // Project income: group current cycle income sources for next cycle
    const currentIncome = store.transactions.filter(
      (t) => t.type === 'income' && t.date >= cycle.startDate && t.date <= cycle.endDate
    );
    const sourceMap = new Map<string, number>();
    for (const t of currentIncome) {
      const source = t.source || 'Income';
      sourceMap.set(source, (sourceMap.get(source) || 0) + t.amount);
    }
    for (const [source, amount] of sourceMap) {
      incomes.push({
        id: `inc-${source}`,
        name: source,
        amount,
        dateLabel: nextCycle.label,
        type: 'income',
      });
    }

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

    return { incomeItems: incomes, expenseItems: expenses.slice(0, 5) };
  }, [store, cycle, nextCycle]);

  if (incomeItems.length === 0 && expenseItems.length === 0) return null;

  return (
    <Card>
      <SectionLabel className="mb-3">Upcoming</SectionLabel>
      <div className="space-y-3">
        {incomeItems.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider mb-1.5">Income</p>
            <div className="space-y-2">
              {incomeItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-7 7 7-7 7 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.dateLabel}</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-400 shrink-0">+{formatMoney(item.amount, sym)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {expenseItems.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-red-400 uppercase tracking-wider mb-1.5">Expenses</p>
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
          </div>
        )}
      </div>
    </Card>
  );
}

function ordSuffix(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  const last = n % 10;
  return last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th';
}
