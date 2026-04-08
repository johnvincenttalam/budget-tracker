import type { Cycle } from '../types';

/** Get the last day of a given month (1-indexed) */
function lastDay(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Read the user's configured cycle split day from localStorage */
function getSplitDay(): number {
  try {
    const data = JSON.parse(localStorage.getItem('budget-tracker-storage') || '{}');
    return data.state?.cycleSplitDay ?? 15;
  } catch {
    return 15;
  }
}

/** Get cycle containing a given date */
export function getCycleForDate(dateStr: string): Cycle {
  const d = new Date(dateStr + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  const day = d.getDate();
  const split = getSplitDay();
  const monthEnd = lastDay(year, month + 1);

  // If split >= last day of month, entire month is one cycle
  if (split >= monthEnd) {
    return buildCycle(year, month, 1, monthEnd);
  }

  if (day <= split) {
    return buildCycle(year, month, 1, split);
  }
  return buildCycle(year, month, split + 1, monthEnd);
}

/** Get the current cycle */
export function getCurrentCycle(): Cycle {
  return getCycleForDate(todayStr());
}

/** Get the previous cycle relative to the current one */
export function getPreviousCycle(): Cycle {
  const current = getCurrentCycle();
  return getPrevCycle(current);
}

function buildCycle(year: number, month: number, startDay: number, endDay: number): Cycle {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n: number) => String(n).padStart(2, '0');
  const maxDay = lastDay(year, month + 1);
  const validStart = Math.min(startDay, maxDay);
  const validEnd = Math.min(endDay, maxDay);

  return {
    label: `${monthNames[month]} ${validStart}–${validEnd}`,
    startDate: `${year}-${pad(month + 1)}-${pad(validStart)}`,
    endDate: `${year}-${pad(month + 1)}-${pad(validEnd)}`,
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

/** Get the next cycle after a given cycle */
export function getNextCycle(cycle: Cycle): Cycle {
  const endDate = new Date(cycle.endDate + 'T00:00:00');
  const nextDay = new Date(endDate.getTime() + 86400000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return getCycleForDate(`${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}`);
}

/** Get the previous cycle before a given cycle */
export function getPrevCycle(cycle: Cycle): Cycle {
  const startDate = new Date(cycle.startDate + 'T00:00:00');
  const prevDay = new Date(startDate.getTime() - 86400000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return getCycleForDate(`${prevDay.getFullYear()}-${pad(prevDay.getMonth() + 1)}-${pad(prevDay.getDate())}`);
}

/** Today as YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
