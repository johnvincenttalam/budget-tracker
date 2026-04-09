import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, Cycle, CurrencySymbol, CategoryBudget, RecurringTemplate, CustomCategory, BillTemplate, BillPayment, BillOverride, SavingsGoal, SavingsContribution, WishlistItem, Screen } from '../types';
import { DEFAULT_CATEGORIES } from '../types';
import { isDateInCycle } from '../utils/cycle';

const genId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

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
  billTemplates: BillTemplate[];
  billPayments: BillPayment[];
  billOverrides: BillOverride[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
  wishlistItems: WishlistItem[];
  currentScreen: Screen;
  billsCycleStart: string | null;

  // Navigation
  setCurrentScreen: (screen: Screen) => void;
  setBillsCycleStart: (startDate: string | null) => void;

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

  // Bills
  addBillTemplate: (t: Omit<BillTemplate, 'id'>) => void;
  updateBillTemplate: (id: string, updates: Partial<Omit<BillTemplate, 'id'>>) => void;
  deleteBillTemplate: (id: string) => void;
  payBill: (billId: string, cycle: Cycle) => void;
  unpayBill: (billId: string, cycleKey: string) => void;
  getBillPaymentsForCycle: (cycleKey: string) => BillPayment[];
  setBillOverride: (billId: string, cycleKey: string, overrides: Omit<BillOverride, 'billId' | 'cycleKey'>) => void;
  getBillOverride: (billId: string, cycleKey: string) => BillOverride | undefined;

  // PIN lock
  setPinHash: (hash: string | null) => void;

  // Theme
  setTheme: (theme: Theme) => void;

  // Cycle config
  cycleSplitDay: number;
  setCycleSplitDay: (day: number) => void;

  // Savings
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  updateSavingsGoal: (id: string, updates: Partial<Omit<SavingsGoal, 'id'>>) => void;
  deleteSavingsGoal: (id: string) => void;
  addContribution: (goalId: string, amount: number, cycleKey: string, note?: string) => void;
  deleteContribution: (id: string) => void;
  getContributionsForGoal: (goalId: string) => SavingsContribution[];

  // Wishlist
  addWishlistItem: (item: Omit<WishlistItem, 'id' | 'createdAt' | 'purchased'>) => void;
  updateWishlistItem: (id: string, updates: Partial<Omit<WishlistItem, 'id'>>) => void;
  deleteWishlistItem: (id: string) => void;
  toggleWishlistPurchased: (id: string) => void;

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
      billTemplates: [],
      billPayments: [],
      billOverrides: [],
      savingsGoals: [],
      savingsContributions: [],
      wishlistItems: [],
      currentScreen: 'dashboard' as Screen,
      billsCycleStart: null,

      // Navigation
      setCurrentScreen: (screen) => set({ currentScreen: screen }),
      setBillsCycleStart: (startDate) => set({ billsCycleStart: startDate }),

      // Transaction actions
      addTransaction: (t) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            { ...t, id: genId(), createdAt: new Date().toISOString() },
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
            { ...t, id: genId() },
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

      // Bills
      addBillTemplate: (t) =>
        set((state) => ({
          billTemplates: [...state.billTemplates, { ...t, id: genId() }],
        })),

      updateBillTemplate: (id, updates) =>
        set((state) => ({
          billTemplates: state.billTemplates.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      deleteBillTemplate: (id) =>
        set((state) => ({
          billTemplates: state.billTemplates.filter((b) => b.id !== id),
          billPayments: state.billPayments.filter((p) => p.billId !== id),
        })),

      payBill: (billId, cycle) =>
        set((state) => {
          const bill = state.billTemplates.find((b) => b.id === billId);
          if (!bill) return {};

          // Advance installment and auto-disable if fully paid
          const updatedTemplates = state.billTemplates.map((b) => {
            if (b.id !== billId || !b.totalInstallments || b.currentInstallment == null) return b;
            const isLastPayment = b.currentInstallment >= b.totalInstallments;
            return {
              ...b,
              currentInstallment: isLastPayment ? b.currentInstallment : b.currentInstallment + 1,
              enabled: isLastPayment ? false : b.enabled,
            };
          });

          return {
            billTemplates: updatedTemplates,
            billPayments: [...state.billPayments, {
              billId,
              cycleKey: cycle.startDate,
              paidAt: new Date().toISOString(),
              transactionId: '',
            }],
          };
        }),

      unpayBill: (billId, cycleKey) =>
        set((state) => {
          // Reverse installment advancement
          const updatedTemplates = state.billTemplates.map((b) => {
            if (b.id !== billId || !b.totalInstallments || b.currentInstallment == null) return b;
            return {
              ...b,
              currentInstallment: Math.max(1, b.currentInstallment - 1),
              enabled: true,
            };
          });
          return {
            billTemplates: updatedTemplates,
            billPayments: state.billPayments.filter(
              (p) => !(p.billId === billId && p.cycleKey === cycleKey)
            ),
          };
        }),

      getBillPaymentsForCycle: (cycleKey) =>
        get().billPayments.filter((p) => p.cycleKey === cycleKey),

      setBillOverride: (billId, cycleKey, overrides) =>
        set((state) => {
          const existing = state.billOverrides.findIndex(
            (o) => o.billId === billId && o.cycleKey === cycleKey
          );
          if (existing >= 0) {
            const updated = [...state.billOverrides];
            updated[existing] = { ...updated[existing], ...overrides };
            return { billOverrides: updated };
          }
          return {
            billOverrides: [...state.billOverrides, { billId, cycleKey, ...overrides }],
          };
        }),

      getBillOverride: (billId, cycleKey) =>
        get().billOverrides.find((o) => o.billId === billId && o.cycleKey === cycleKey),

      // PIN lock
      setPinHash: (hash) => set({ pinHash: hash }),

      // Theme
      setTheme: (theme) => set({ theme }),

      // Cycle config
      cycleSplitDay: 15,
      setCycleSplitDay: (day) => set({ cycleSplitDay: day }),

      // Savings
      addSavingsGoal: (goal) =>
        set((state) => ({
          savingsGoals: [...state.savingsGoals, { ...goal, id: genId(), createdAt: new Date().toISOString() }],
        })),

      updateSavingsGoal: (id, updates) =>
        set((state) => ({
          savingsGoals: state.savingsGoals.map((g) => g.id === id ? { ...g, ...updates } : g),
        })),

      deleteSavingsGoal: (id) =>
        set((state) => ({
          savingsGoals: state.savingsGoals.filter((g) => g.id !== id),
          savingsContributions: state.savingsContributions.filter((c) => c.goalId !== id),
        })),

      addContribution: (goalId, amount, cycleKey, note) =>
        set((state) => {
          const contribution: SavingsContribution = {
            id: genId(),
            goalId,
            amount,
            cycleKey,
            date: new Date().toISOString().slice(0, 10),
            note,
          };
          return {
            savingsContributions: [...state.savingsContributions, contribution],
            savingsGoals: state.savingsGoals.map((g) =>
              g.id === goalId ? { ...g, savedAmount: g.savedAmount + amount } : g
            ),
          };
        }),

      deleteContribution: (id) =>
        set((state) => {
          const contrib = state.savingsContributions.find((c) => c.id === id);
          if (!contrib) return {};
          return {
            savingsContributions: state.savingsContributions.filter((c) => c.id !== id),
            savingsGoals: state.savingsGoals.map((g) =>
              g.id === contrib.goalId ? { ...g, savedAmount: g.savedAmount - contrib.amount } : g
            ),
          };
        }),

      getContributionsForGoal: (goalId) =>
        get().savingsContributions.filter((c) => c.goalId === goalId),

      // Wishlist
      addWishlistItem: (item) =>
        set((state) => ({
          wishlistItems: [...state.wishlistItems, { ...item, id: genId(), createdAt: new Date().toISOString(), purchased: false }],
        })),

      updateWishlistItem: (id, updates) =>
        set((state) => ({
          wishlistItems: state.wishlistItems.map((i) => i.id === id ? { ...i, ...updates } : i),
        })),

      deleteWishlistItem: (id) =>
        set((state) => ({
          wishlistItems: state.wishlistItems.filter((i) => i.id !== id),
        })),

      toggleWishlistPurchased: (id) =>
        set((state) => ({
          wishlistItems: state.wishlistItems.map((i) =>
            i.id === id ? { ...i, purchased: !i.purchased, purchasedAt: !i.purchased ? new Date().toISOString() : undefined } : i
          ),
        })),

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
        billTemplates: state.billTemplates,
        billPayments: state.billPayments,
        billOverrides: state.billOverrides,
        savingsGoals: state.savingsGoals,
        savingsContributions: state.savingsContributions,
        wishlistItems: state.wishlistItems,
        currentScreen: state.currentScreen,
        billsCycleStart: state.billsCycleStart,
        cycleSplitDay: state.cycleSplitDay,
      }),
    }
  )
);
