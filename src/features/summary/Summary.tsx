import { useState } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle, getPreviousCycle } from '../../shared/utils/cycle';

const CATEGORY_COLORS = ['#34D399', '#60A5FA', '#F472B6', '#FBBF24', '#A78BFA', '#FB923C', '#2DD4BF', '#F87171', '#818CF8', '#4ADE80'];
import { formatMoney } from '../../shared/utils/format';
import { getCategoryIconName } from '../../shared/utils/categories';
import { CategoryIcon, SearchIcon } from '../../shared/components/Icons';
import { Toast } from '../../shared/components/Toast';
import type { Screen, Transaction } from '../../shared/types';

export function Summary({ onNavigate }: { onNavigate: (s: Screen, txId?: string) => void }) {
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const customCategories = store.customCategories;
  const [tab, setTab] = useState<'current' | 'previous'>('current');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterTag, setFilterTag] = useState<'all' | 'needs' | 'wants'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [showUndoToast, setShowUndoToast] = useState(false);

  const cycle = tab === 'current' ? getCurrentCycle() : getPreviousCycle();
  const income = store.getTotalIncome(cycle);
  const expenses = store.getTotalExpenses(cycle);
  const balance = store.getBalance(cycle);
  const byCategory = store.getExpensesByCategory(cycle);
  const transactions = store
    .getTransactionsForCycle(cycle)
    .sort((a, b) => {
      if (sortBy === 'amount') return b.amount - a.amount;
      if (sortBy === 'category') {
        const aCat = a.type === 'income' ? a.source ?? 'Income' : a.category ?? 'Other';
        const bCat = b.type === 'income' ? b.source ?? 'Income' : b.category ?? 'Other';
        return aCat.localeCompare(bCat);
      }
      const aTime = a.createdAt ?? a.date;
      const bTime = b.createdAt ?? b.date;
      return bTime.localeCompare(aTime);
    });

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      store.deleteTransaction(id);
      setConfirmDelete(null);
      setShowUndoToast(true);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete((prev) => prev === id ? null : prev), 3000);
    }
  }

  function handleUndo() {
    store.restoreLastDeleted();
    setShowUndoToast(false);
  }

  function handleToastDismiss() {
    store.clearLastDeleted();
    setShowUndoToast(false);
  }

  function handleEdit(t: Transaction) {
    const screen = t.type === 'expense' ? 'edit-expense' : 'edit-income';
    onNavigate(screen as Screen, t.id);
  }

  function renderTransaction(t: Transaction) {
    return (
      <div
        key={t.id}
        onClick={() => handleEdit(t)}
        className="px-4 py-3 flex items-center justify-between active:bg-slate-800 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            t.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
          }`}>
            {t.type === 'income' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-7 7 7-7 7 7" />
              </svg>
            ) : (
              <CategoryIcon name={getCategoryIconName(t.category ?? 'Other', customCategories)} size={16} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-200 truncate">
                {t.type === 'income' ? t.source ?? 'Income' : t.category ?? 'Other'}
              </p>
              {t.tag && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                    t.tag === 'needs'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {t.tag}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500">{t.date}</p>
              {t.note && <p className="text-xs text-slate-500 truncate">· {t.note}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <p
            className={`text-sm font-bold ${
              t.type === 'income' ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {t.type === 'income' ? '+' : '−'}
            {formatMoney(t.amount, sym)}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
            className={`text-xs px-2 py-1 rounded-lg transition-all duration-200 ${
              confirmDelete === t.id
                ? 'bg-red-500 text-white scale-110'
                : 'bg-slate-800 text-slate-400 scale-100'
            }`}
          >
            {confirmDelete === t.id ? 'Sure?' : '×'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-28 px-4 pt-4">
      {/* Tabs */}
      <div className="flex bg-slate-900 rounded-xl p-1">
        <button
          onClick={() => setTab('current')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'current' ? 'bg-emerald-500 text-white' : 'text-slate-400'
          }`}
        >
          Current Cycle
        </button>
        <button
          onClick={() => setTab('previous')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'previous' ? 'bg-emerald-500 text-white' : 'text-slate-400'
          }`}
        >
          Previous Cycle
        </button>
      </div>

      {/* Cycle label */}
      <p className="text-center text-sm text-slate-400">{cycle.label}</p>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-500 uppercase">Income</p>
          <p className="text-base font-bold text-emerald-400">{formatMoney(income, sym)}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-500 uppercase">Expenses</p>
          <p className="text-base font-bold text-red-400">{formatMoney(expenses, sym)}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-500 uppercase">Balance</p>
          <p
            className={`text-base font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {formatMoney(balance, sym)}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-slate-900 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">By Category</p>
          <div className="space-y-2">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, total], i) => {
                const pct = expenses > 0 ? (total / expenses) * 100 : 0;
                const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-300 flex items-center gap-1.5">
                        <CategoryIcon name={getCategoryIconName(cat, customCategories)} size={16} style={{ color }} />
                        {cat}
                      </span>
                      <span className="text-sm font-semibold text-slate-200">
                        {formatMoney(total, sym)}
                        <span className="text-slate-500 text-xs ml-1">
                          ({pct.toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full bg-slate-900 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>

        {/* Filter toggles */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                filterType === f ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              {f === 'all' ? 'All' : f === 'income' ? 'Income' : 'Expenses'}
            </button>
          ))}
          <div className="w-px bg-slate-800 shrink-0" />
          {(['all', 'needs', 'wants'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterTag(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                filterTag === f
                  ? f === 'needs' ? 'bg-blue-500 text-white' : f === 'wants' ? 'bg-purple-500 text-white' : 'bg-emerald-500 text-white'
                  : 'bg-slate-900 text-slate-400'
              }`}
            >
              {f === 'all' ? 'All Tags' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-2">
          <span className="text-xs text-slate-500 self-center shrink-0">Sort:</span>
          {(['date', 'amount', 'category'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                sortBy === s ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* All transactions */}
      {(() => {
        const term = search.toLowerCase();
        const filtered = transactions.filter((t) => {
          if (filterType !== 'all' && t.type !== filterType) return false;
          if (filterTag !== 'all' && t.type === 'expense' && t.tag !== filterTag) return false;
          if (term) {
            const matchNote = t.note?.toLowerCase().includes(term);
            const matchCat = t.category?.toLowerCase().includes(term);
            const matchSrc = t.source?.toLowerCase().includes(term);
            if (!matchNote && !matchCat && !matchSrc) return false;
          }
          return true;
        });

        // Group by date when sorting by date
        const grouped: { date: string; items: Transaction[] }[] = [];
        if (sortBy === 'date') {
          const byDate = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
          for (const t of byDate) {
            const last = grouped[grouped.length - 1];
            if (last && last.date === t.date) {
              last.items.push(t);
            } else {
              grouped.push({ date: t.date, items: [t] });
            }
          }
        }

        return (
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
              Transactions ({filtered.length})
            </p>
            {filtered.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">
                {transactions.length === 0 ? 'No transactions this cycle' : 'No matching transactions'}
              </p>
            ) : sortBy === 'date' ? (
              <div className="space-y-3">
                {grouped.map((g) => {
                  const d = new Date(g.date + 'T00:00:00');
                  const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  return (
                    <div key={g.date}>
                      <p className="text-xs text-slate-500 font-medium mb-1.5 px-1">{label}</p>
                      <div className="bg-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-800">
                        {g.items.map(renderTransaction)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-800">{filtered.map(renderTransaction)}</div>
            )}
          </div>
        );
      })()}

      {showUndoToast && (
        <Toast
          message="Transaction deleted"
          action={{ label: 'Undo', onClick: handleUndo }}
          duration={5000}
          onDismiss={handleToastDismiss}
        />
      )}
    </div>
  );
}
