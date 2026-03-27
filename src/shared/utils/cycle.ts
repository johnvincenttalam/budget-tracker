import type { Cycle } from '../types';

/** Get the last day of a given month (1-indexed) */
function lastDay(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Get cycle containing a given date */
export function getCycleForDate(dateStr: string): Cycle {
  const d = new Date(dateStr + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  const day = d.getDate();

  if (day <= 15) {
    return buildCycle(year, month, 1, 15);
  }
  return buildCycle(year, month, 16, lastDay(year, month + 1));
}

/** Get the current cycle */
export function getCurrentCycle(): Cycle {
  return getCycleForDate(todayStr());
}

/** Get the previous cycle relative to the current one */
export function getPreviousCycle(): Cycle {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  if (day <= 15) {
    // Previous cycle is last month 16–end
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    return buildCycle(prevYear, prevMonth, 16, lastDay(prevYear, prevMonth + 1));
  }
  // Previous cycle is this month 1–15
  return buildCycle(year, month, 1, 15);
}

function buildCycle(year: number, month: number, startDay: number, endDay: number): Cycle {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    label: `${monthNames[month]} ${startDay}–${endDay}`,
    startDate: `${year}-${pad(month + 1)}-${pad(startDay)}`,
    endDate: `${year}-${pad(month + 1)}-${pad(endDay)}`,
  };
}

/** Check if a date string falls within a cycle */
export function isDateInCycle(dateStr: string, cycle: Cycle): boolean {
  return dateStr >= cycle.startDate && dateStr <= cycle.endDate;
}

/** Get the N most recent cycles, ending with the current one */
export function getRecentCycles(count: number): Cycle[] {
  const cycles: Cycle[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');
  let d = new Date();

  for (let i = 0; i < count; i++) {
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const cycle = getCycleForDate(dateStr);

    if (cycles.length === 0 || cycles[cycles.length - 1].startDate !== cycle.startDate) {
      cycles.push(cycle);
    }

    // Move to the day before this cycle's start
    const startDate = new Date(cycle.startDate + 'T00:00:00');
    d = new Date(startDate.getTime() - 86400000);
  }

  return cycles.reverse();
}

/** Today as YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
