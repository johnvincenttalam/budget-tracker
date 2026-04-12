import type { Transaction, SavingsGoal, SavingsContribution, BillPayment, BillTemplate, Cycle } from '../types';
import { isDateInCycle } from './cycle';

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  type: 'permanent' | 'cycle'; // permanent = once unlocked stays, cycle = resets each cycle
};

type AchievementInput = {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
  billTemplates: BillTemplate[];
  billPayments: BillPayment[];
  cycle: Cycle;
  income: number;
  expenses: number;
  billsPaid: number;
  billsTotal: number;
};

export function getAchievements(input: AchievementInput): Achievement[] {
  const { transactions, savingsGoals, savingsContributions, billPayments, cycle, income, expenses, billsPaid, billsTotal } = input;

  const balance = income - expenses;
  const totalSaved = savingsGoals.reduce((s, g) => s + g.savedAmount, 0);
  const expenseCount = transactions.filter((t) => t.type === 'expense' && isDateInCycle(t.date, cycle)).length;
  const completedGoals = savingsGoals.filter((g) => g.savedAmount >= g.targetAmount).length;

  return [
    // Permanent achievements
    {
      id: 'first-expense',
      name: 'First Step',
      description: 'Log your first expense',
      icon: 'pencil',
      type: 'permanent' as const,
      unlocked: transactions.filter((t) => t.type === 'expense').length > 0,
    },
    {
      id: 'first-save',
      name: 'First Save',
      description: 'Make your first savings deposit',
      icon: 'coin',
      type: 'permanent' as const,
      unlocked: savingsContributions.filter((c) => c.amount > 0).length > 0,
    },
    {
      id: 'goal-reached',
      name: 'Goal Reached',
      description: 'Complete a savings goal',
      icon: 'trophy',
      type: 'permanent' as const,
      unlocked: completedGoals > 0,
    },
    {
      id: 'savings-10k',
      name: 'Five Figures',
      description: 'Save a total of 10,000',
      icon: 'star',
      type: 'permanent' as const,
      unlocked: totalSaved >= 10000,
    },
    // Per-cycle achievements
    {
      id: 'tracker-10',
      name: 'Tracker',
      description: 'Log 10 expenses this cycle',
      icon: 'list',
      type: 'cycle' as const,
      unlocked: expenseCount >= 10,
    },
    {
      id: 'bill-slayer',
      name: 'Bill Slayer',
      description: 'Pay all bills this cycle',
      icon: 'check',
      type: 'cycle' as const,
      unlocked: billsTotal > 0 && billsPaid === billsTotal,
    },
    {
      id: 'under-budget',
      name: 'Under Budget',
      description: 'Spend less than your income this cycle',
      icon: 'trending-down',
      type: 'cycle' as const,
      unlocked: income > 0 && balance > 0,
    },
    {
      id: 'saver-20',
      name: 'Super Saver',
      description: 'Save 20%+ of income this cycle',
      icon: 'piggy',
      type: 'cycle' as const,
      unlocked: income > 0 && (balance / income) >= 0.2,
    },
  ];
}
