import type { BillTemplate, BillPayment, Cycle } from '../types';

export type BillStatus = 'overdue' | 'upcoming' | 'paid';

export function getBillStatus(
  bill: BillTemplate,
  cycle: Cycle,
  payment: BillPayment | undefined
): BillStatus {
  if (payment) return 'paid';

  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  // Future cycle — everything is upcoming
  if (cycle.startDate > todayStr) return 'upcoming';

  // Past cycle — unpaid bills are overdue
  if (cycle.endDate < todayStr) return 'overdue';

  // Current cycle — compare today's date to due day
  const dueDay = Math.min(bill.dueDay, parseInt(cycle.endDate.split('-')[2]));
  if (today.getDate() > dueDay) return 'overdue';
  return 'upcoming';
}

export function getDueDateLabel(dueDay: number): string {
  if (dueDay >= 11 && dueDay <= 13) return `${dueDay}th`;
  const lastDigit = dueDay % 10;
  const suffix = lastDigit === 1 ? 'st' : lastDigit === 2 ? 'nd' : lastDigit === 3 ? 'rd' : 'th';
  return `${dueDay}${suffix}`;
}
