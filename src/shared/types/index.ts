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

export type Screen =
  | 'dashboard'
  | 'add-expense'
  | 'add-income'
  | 'summary'
  | 'analytics'
  | 'settings'
  | 'recurring'
  | 'edit-expense'
  | 'edit-income';
