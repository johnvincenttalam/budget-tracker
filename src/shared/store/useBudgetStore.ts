import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, Cycle, CurrencySymbol, CategoryBudget, RecurringTemplate, CustomCategory } from '../types';
import { DEFAULT_CATEGORIES } from '../types';
import { isDateInCycle } from '../utils/cycle';

type Theme = 'dark' | 'light';

interface BudgetState {
  transactions: Transaction[];
  currencySymbol: CurrencySymbol;
  categoryBudgets: CategoryBudget[];
  recurringTemplates: RecurringTemplate[];
  customCategories: CustomCategory[];
  lastDeletedTransaction: Transaction | null;
  pinHash: string | null;
  theme: Theme;

  // Transaction actions
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;
  restoreLastDeleted: () => void;
  clearLastDeleted: () => void;

  // Currency
  setCurrencySymbol: (symbol: CurrencySymbol) => void;

  // Budget limits
  setCategoryBudget: (category: string, limit: number) => void;
  removeCategoryBudget: (category: string) => void;

  // Recurring templates
  addRecurringTemplate: (t: Omit<RecurringTemplate, 'id'>) => void;
  deleteRecurringTemplate: (id: string) => void;
  toggleRecurringTemplate: (id: string) => void;

  // PIN lock
  setPinHash: (hash: string | null) => void;

  // Theme
  setTheme: (theme: Theme) => void;

  // Custom categories
  addCustomCategory: (cat: CustomCategory) => void;
  removeCustomCategory: (name: string) => void;
  getAllCategories: () => string[];

  // Computed helpers
  getTransactionsForCycle: (cycle: Cycle) => Transaction[];
  getTotalIncome: (cycle: Cycle) => number;
  getTotalExpenses: (cycle: Cycle) => number;
  getBalance: (cycle: Cycle) => number;
  getExpensesByCategory: (cycle: Cycle) => Record<string, number>;
  getExpensesByTag: (cycle: Cycle) => { needs: number; wants: number };
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      transactions: [],
      currencySymbol: '₱',
      categoryBudgets: [],
      recurringTemplates: [],
      customCategories: [],
      lastDeletedTransaction: null,
      pinHash: null,
      theme: 'dark' as Theme,

      // Transaction actions
      addTransaction: (t) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
          ],
        })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTransaction: (id) =>
        set((state) => {
          const deleted = state.transactions.find((t) => t.id === id);
          return {
            transactions: state.transactions.filter((t) => t.id !== id),
            lastDeletedTransaction: deleted ?? null,
          };
        }),

      restoreLastDeleted: () =>
        set((state) => {
          if (!state.lastDeletedTransaction) return {};
          return {
            transactions: [...state.transactions, state.lastDeletedTransaction],
            lastDeletedTransaction: null,
          };
        }),

      clearLastDeleted: () => set({ lastDeletedTransaction: null }),

      // Currency
      setCurrencySymbol: (symbol) => set({ currencySymbol: symbol }),

      // Budget limits
      setCategoryBudget: (category, limit) =>
        set((state) => {
          const exists = state.categoryBudgets.some((b) => b.category === category);
          if (exists) {
            return {
              categoryBudgets: state.categoryBudgets.map((b) =>
                b.category === category ? { ...b, limit } : b
              ),
            };
          }
          return {
            categoryBudgets: [...state.categoryBudgets, { category, limit }],
          };
        }),

      removeCategoryBudget: (category) =>
        set((state) => ({
          categoryBudgets: state.categoryBudgets.filter((b) => b.category !== category),
        })),

      // Recurring templates
      addRecurringTemplate: (t) =>
        set((state) => ({
          recurringTemplates: [
            ...state.recurringTemplates,
            { ...t, id: crypto.randomUUID() },
          ],
        })),

      deleteRecurringTemplate: (id) =>
        set((state) => ({
          recurringTemplates: state.recurringTemplates.filter((t) => t.id !== id),
        })),

      toggleRecurringTemplate: (id) =>
        set((state) => ({
          recurringTemplates: state.recurringTemplates.map((t) =>
            t.id === id ? { ...t, enabled: !t.enabled } : t
          ),
        })),

      // PIN lock
      setPinHash: (hash) => set({ pinHash: hash }),

      // Theme
      setTheme: (theme) => set({ theme }),

      // Custom categories
      addCustomCategory: (cat) =>
        set((state) => ({
          customCategories: [...state.customCategories, cat],
        })),

      removeCustomCategory: (name) =>
        set((state) => ({
          customCategories: state.customCategories.filter((c) => c.name !== name),
          categoryBudgets: state.categoryBudgets.filter((b) => b.category !== name),
        })),

      getAllCategories: () => {
        const custom = get().customCategories.map((c) => c.name);
        return [...DEFAULT_CATEGORIES, ...custom];
      },

      // Computed helpers
      getTransactionsForCycle: (cycle) =>
        get().transactions.filter((t) => isDateInCycle(t.date, cycle)),

      getTotalIncome: (cycle) =>
        get()
          .transactions.filter((t) => t.type === 'income' && isDateInCycle(t.date, cycle))
          .reduce((sum, t) => sum + t.amount, 0),

      getTotalExpenses: (cycle) =>
        get()
          .transactions.filter((t) => t.type === 'expense' && isDateInCycle(t.date, cycle))
          .reduce((sum, t) => sum + t.amount, 0),

      getBalance: (cycle) =>
        get().getTotalIncome(cycle) - get().getTotalExpenses(cycle),

      getExpensesByCategory: (cycle) => {
        const expenses = get().transactions.filter(
          (t) => t.type === 'expense' && isDateInCycle(t.date, cycle)
        );
        const grouped: Record<string, number> = {};
        for (const e of expenses) {
          const cat = e.category ?? 'Other';
          grouped[cat] = (grouped[cat] ?? 0) + e.amount;
        }
        return grouped;
      },

      getExpensesByTag: (cycle) => {
        const expenses = get().transactions.filter(
          (t) => t.type === 'expense' && isDateInCycle(t.date, cycle)
        );
        let needs = 0;
        let wants = 0;
        for (const e of expenses) {
          if (e.tag === 'wants') wants += e.amount;
          else needs += e.amount;
        }
        return { needs, wants };
      },
    }),
    {
      name: 'budget-tracker-storage',
      partialize: (state) => ({
        transactions: state.transactions,
        currencySymbol: state.currencySymbol,
        categoryBudgets: state.categoryBudgets,
        recurringTemplates: state.recurringTemplates,
        customCategories: state.customCategories,
        pinHash: state.pinHash,
        theme: state.theme,
      }),
    }
  )
);
