import type { Transaction, Cycle } from '../types';
import { isDateInCycle } from './cycle';

/**
 * Forecast total spending for the current cycle based on the daily pace so far.
 * Returns null if no expenses or cycle hasn't started.
 */
export function forecastCycleSpending(
  transactions: Transaction[],
  cycle: Cycle
): { projected: number; daysElapsed: number; totalDays: number; dailyAvg: number } | null {
  const today = new Date();
  const cycleStart = new Date(cycle.startDate + 'T00:00:00');
  const cycleEnd = new Date(cycle.endDate + 'T00:00:00');

  // If cycle hasn't started yet, no forecast
  if (today < cycleStart) return null;

  const totalDays = Math.floor((cycleEnd.getTime() - cycleStart.getTime()) / 86400000) + 1;
  const daysElapsed = Math.min(
    totalDays,
    Math.max(1, Math.floor((today.getTime() - cycleStart.getTime()) / 86400000) + 1)
  );

  const expenses = transactions
    .filter((t) => t.type === 'expense' && isDateInCycle(t.date, cycle))
    .reduce((sum, t) => sum + t.amount, 0);

  if (expenses === 0) return null;

  const dailyAvg = expenses / daysElapsed;
  const projected = dailyAvg * totalDays;

  return { projected, daysElapsed, totalDays, dailyAvg };
}

/**
 * Detect categories where current cycle spending is significantly higher
 * than the average of the previous N cycles.
 * Returns categories where spending is at least 30% higher than the average.
 */
export function detectSpendingAnomalies(
  transactions: Transaction[],
  currentCycle: Cycle,
  previousCycles: Cycle[]
): { category: string; current: number; average: number; pctIncrease: number }[] {
  const expensesInCycle = (cycle: Cycle) =>
    transactions.filter((t) => t.type === 'expense' && isDateInCycle(t.date, cycle));

  // Group current cycle expenses by category
  const currentByCategory: Record<string, number> = {};
  for (const t of expensesInCycle(currentCycle)) {
    const cat = t.category ?? 'Other';
    currentByCategory[cat] = (currentByCategory[cat] ?? 0) + t.amount;
  }

  // Average per category across previous cycles
  const previousByCategory: Record<string, number[]> = {};
  for (const cycle of previousCycles) {
    const sums: Record<string, number> = {};
    for (const t of expensesInCycle(cycle)) {
      const cat = t.category ?? 'Other';
      sums[cat] = (sums[cat] ?? 0) + t.amount;
    }
    for (const cat of Object.keys(sums)) {
      if (!previousByCategory[cat]) previousByCategory[cat] = [];
      previousByCategory[cat].push(sums[cat]);
    }
  }

  const anomalies: { category: string; current: number; average: number; pctIncrease: number }[] = [];
  for (const [cat, current] of Object.entries(currentByCategory)) {
    const history = previousByCategory[cat];
    if (!history || history.length === 0) continue;
    const average = history.reduce((s, n) => s + n, 0) / history.length;
    if (average === 0) continue;
    const pctIncrease = ((current - average) / average) * 100;
    if (pctIncrease >= 30) {
      anomalies.push({ category: cat, current, average, pctIncrease });
    }
  }

  return anomalies.sort((a, b) => b.pctIncrease - a.pctIncrease);
}

/**
 * Compare cycle progress (% of days elapsed) vs spending progress (% of typical budget used).
 * Returns a status if user is significantly ahead of pace.
 */
export function getSpendingPaceStatus(
  spent: number,
  typicalBudget: number,
  daysElapsed: number,
  totalDays: number
): { status: 'on-track' | 'ahead' | 'behind'; cyclePct: number; spentPct: number } | null {
  if (typicalBudget === 0 || totalDays === 0) return null;
  const cyclePct = (daysElapsed / totalDays) * 100;
  const spentPct = (spent / typicalBudget) * 100;
  const diff = spentPct - cyclePct;

  if (diff > 15) return { status: 'ahead', cyclePct, spentPct };
  if (diff < -15) return { status: 'behind', cyclePct, spentPct };
  return { status: 'on-track', cyclePct, spentPct };
}

/**
 * Calculate a financial health score (0-100) based on:
 * - Savings rate (0-30 pts): % of income unspent
 * - Bills adherence (0-25 pts): % of bills paid this cycle
 * - Budget control (0-25 pts): not overspending vs income
 * - Savings goals (0-20 pts): progress toward savings targets
 */
export function calculateHealthScore(params: {
  income: number;
  expenses: number;
  billsPaid: number;
  billsTotal: number;
  totalSaved: number;
  totalTarget: number;
}): { score: number; label: string; color: string; breakdown: { name: string; pts: number; max: number }[] } {
  const { income, expenses, billsPaid, billsTotal, totalSaved, totalTarget } = params;
  const breakdown: { name: string; pts: number; max: number }[] = [];

  // Savings rate (0-30)
  let savingsPts = 0;
  if (income > 0) {
    const rate = Math.max(0, (income - expenses) / income);
    savingsPts = Math.round(Math.min(rate * 100, 30));
  }
  breakdown.push({ name: 'Savings Rate', pts: savingsPts, max: 30 });

  // Bills (0-25)
  let billsPts = 25; // full marks if no bills
  if (billsTotal > 0) {
    billsPts = Math.round((billsPaid / billsTotal) * 25);
  }
  breakdown.push({ name: 'Bills Paid', pts: billsPts, max: 25 });

  // Budget control (0-25)
  let budgetPts = 25;
  if (income > 0) {
    const ratio = expenses / income;
    if (ratio > 1) budgetPts = 0;
    else if (ratio > 0.9) budgetPts = 10;
    else if (ratio > 0.7) budgetPts = 20;
  }
  breakdown.push({ name: 'Budget Control', pts: budgetPts, max: 25 });

  // Savings goals (0-20)
  let goalsPts = 0;
  if (totalTarget > 0) {
    goalsPts = Math.round(Math.min(totalSaved / totalTarget, 1) * 20);
  }
  breakdown.push({ name: 'Goal Progress', pts: goalsPts, max: 20 });

  const score = savingsPts + billsPts + budgetPts + goalsPts;
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';
  const color = score >= 80 ? '#34D399' : score >= 60 ? '#60A5FA' : score >= 40 ? '#FBBF24' : '#F87171';

  return { score, label, color, breakdown };
}

/**
 * Suggest a category for a transaction based on past transactions with similar notes.
 * Returns the most common category for transactions whose note matches the input.
 */
export function suggestCategory(
  noteText: string,
  transactions: Transaction[]
): string | null {
  const note = noteText.trim().toLowerCase();
  if (note.length < 2) return null;

  const matches = transactions.filter(
    (t) => t.type === 'expense' && t.note && t.note.toLowerCase().includes(note)
  );
  if (matches.length === 0) return null;

  const counts: Record<string, number> = {};
  for (const t of matches) {
    const cat = t.category ?? 'Other';
    counts[cat] = (counts[cat] ?? 0) + 1;
  }

  let topCat: string | null = null;
  let topCount = 0;
  for (const [cat, count] of Object.entries(counts)) {
    if (count > topCount) {
      topCount = count;
      topCat = cat;
    }
  }
  return topCat;
}
