import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import { getBillStatus } from '../../shared/utils/bills';
import { getDueDateLabel } from '../../shared/utils/bills';
import { Card } from '../../shared/components/Card';
import { SectionLabel } from '../../shared/components/SectionLabel';
import { ServiceAvatar } from '../../shared/components/ServiceAvatar';
import type { Screen } from '../../shared/types';

function getUrgencyBadge(dueDay: number, isPast: boolean): { label: string; color: string } {
  if (isPast) return { label: 'OVERDUE', color: 'bg-red-500/20 text-red-400' };

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const dueDate = new Date(currentYear, currentMonth, dueDay);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);

  if (diffDays <= 0) return { label: 'OVERDUE', color: 'bg-red-500/20 text-red-400' };
  if (diffDays <= 3) return { label: `${diffDays}D LEFT`, color: 'bg-amber-500/20 text-amber-400' };
  return { label: `${diffDays}D`, color: 'bg-emerald-500/15 text-emerald-400' };
}

export function UpcomingBills({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const cycle = getCurrentCycle();
  const payments = store.getBillPaymentsForCycle(cycle.startDate);

  const startDay = parseInt(cycle.startDate.split('-')[2]);
  const endDay = parseInt(cycle.endDate.split('-')[2]);

  const unpaidBills = store.billTemplates
    .filter((b) => {
      if (!b.enabled) return false;
      if (b.dueDay < startDay || b.dueDay > endDay) return false;
      if (b.createdInCycle && b.createdInCycle > cycle.startDate) return false;
      if (b.oneTimeCycle && b.oneTimeCycle !== cycle.startDate) return false;
      const payment = payments.find((p) => p.billId === b.id);
      return !payment;
    })
    .map((b) => {
      const override = store.getBillOverride(b.id, cycle.startDate);
      const amount = override?.amount ?? b.amount;
      const status = getBillStatus(b, cycle, undefined);
      return { ...b, amount, status };
    })
    .sort((a, b) => {
      // Overdue first, then by dueDay ascending
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      return a.dueDay - b.dueDay;
    })
    .slice(0, 4);

  if (unpaidBills.length === 0) return null;

  return (
    <div>
      <SectionLabel className="mb-2" action={
        <button onClick={() => onNavigate('bills')} className="text-xs text-emerald-400 font-medium">View all</button>
      }>
        Upcoming Bills
      </SectionLabel>
      <Card size="sm" className="!p-0 overflow-hidden" onClick={() => onNavigate('bills')}>
        <div className="divide-y divide-slate-800">
          {unpaidBills.map((bill) => {
            const isOverdue = bill.status === 'overdue';
            const badge = getUrgencyBadge(bill.dueDay, isOverdue);
            return (
              <div key={bill.id} className="px-3 py-2.5 flex items-center gap-2.5">
                <ServiceAvatar name={bill.name} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{bill.name}</p>
                  <p className="text-[10px] text-slate-500">Due {getDueDateLabel(bill.dueDay)}</p>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badge.color}`}>
                  {badge.label}
                </span>
                <p className="text-sm font-bold text-white shrink-0">{formatMoney(bill.amount, sym)}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
