export type TransactionType = 'income' | 'expense';
export type Tag = 'needs' | 'wants';

export const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Bills', 'Baby', 'Other'] as const;
export type Category = string;

export const PRESET_ICONS = [
  'Shopping', 'Health', 'Pet', 'Gym', 'Gift', 'Coffee',
  'Entertainment', 'Education', 'Home', 'Phone', 'Clothing', 'Travel',
] as const;
export type PresetIcon = (typeof PRESET_ICONS)[number];

export type CustomCategory = {
  name: string;
  icon: PresetIcon;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category?: Category;
  date: string; // ISO date string YYYY-MM-DD
  note?: string;
  source?: string; // for income
  tag?: Tag;
  createdAt?: string; // ISO timestamp for sort order
};

export type Cycle = {
  label: string;
  startDate: string;
  endDate: string;
};

export const CURRENCIES = ['₱', '$', '€', '£', '¥'] as const;
export type CurrencySymbol = (typeof CURRENCIES)[number];

export type CategoryBudget = {
  category: Category;
  limit: number;
};

export type RecurringTemplate = {
  id: string;
  amount: number;
  category: Category;
  tag: Tag;
  note?: string;
  enabled: boolean;
};

export type BillTemplate = {
  id: string;
  name: string;
  amount: number;
  category: Category;
  dueDay: number; // day of month (1-31)
  note?: string;
  enabled: boolean;
  totalInstallments?: number; // e.g. 6 for a 6-month plan
  currentInstallment?: number; // e.g. 2 means this is payment 2 of totalInstallments
  createdInCycle?: string; // cycle startDate when this bill was first added
  oneTimeCycle?: string; // if set, bill only appears in this specific cycle
};

export type BillPayment = {
  billId: string;
  cycleKey: string; // cycle startDate as unique key
  paidAt: string;
  transactionId: string;
};

export type BillOverride = {
  billId: string;
  cycleKey: string;
  amount?: number;
  note?: string;
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  icon: string;
  color: string;
  createdAt: string;
};

export type SavingsContribution = {
  id: string;
  goalId: string;
  amount: number; // positive = deposit, negative = withdrawal
  cycleKey: string;
  date: string;
  note?: string;
};

export type Screen =
  | 'dashboard'
  | 'add-expense'
  | 'add-income'
  | 'summary'
  | 'analytics'
  | 'settings'
  | 'recurring'
  | 'edit-expense'
  | 'edit-income'
  | 'bills'
  | 'savings';
