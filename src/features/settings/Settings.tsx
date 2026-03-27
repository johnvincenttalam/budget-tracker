import { useState } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle, getPreviousCycle } from '../../shared/utils/cycle';
import { getCategoryIconName } from '../../shared/utils/categories';
import { transactionsToCSV, downloadCSV } from '../../shared/utils/csv';
import { verifyPin } from '../security/pin';
import { CURRENCIES, DEFAULT_CATEGORIES, PRESET_ICONS, type Screen, type PresetIcon } from '../../shared/types';
import { ArrowLeftIcon, CategoryIcon, RepeatIcon } from '../../shared/components/Icons';
import { BudgetProgress } from '../../shared/components/BudgetProgress';
import { PinSetup } from '../security/PinSetup';

export function Settings({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const store = useBudgetStore();
  const { currencySymbol, setCurrencySymbol, categoryBudgets, setCategoryBudget, removeCategoryBudget } = store;
  const cycle = getCurrentCycle();
  const byCategory = store.getExpensesByCategory(cycle);
  const categories = store.getAllCategories();
  const customCategories = store.customCategories;

  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState<PresetIcon>('Shopping');
  const [exportScope, setExportScope] = useState<'current' | 'previous' | 'all'>('current');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showRemovePin, setShowRemovePin] = useState(false);
  const [removePinInput, setRemovePinInput] = useState('');
  const [removePinError, setRemovePinError] = useState(false);

  function handleSetLimit(cat: string) {
    const val = parseFloat(limitInput);
    if (val > 0) {
      setCategoryBudget(cat, val);
    }
    setEditingCat(null);
    setLimitInput('');
  }

  function handleExport() {
    let txns;
    let filename;
    if (exportScope === 'current') {
      const c = getCurrentCycle();
      txns = store.getTransactionsForCycle(c);
      filename = `budget-${c.label.replace(/\s/g, '-')}.csv`;
    } else if (exportScope === 'previous') {
      const c = getPreviousCycle();
      txns = store.getTransactionsForCycle(c);
      filename = `budget-${c.label.replace(/\s/g, '-')}.csv`;
    } else {
      txns = store.transactions;
      filename = 'budget-all.csv';
    }
    const csv = transactionsToCSV(txns);
    downloadCSV(csv, filename);
  }

  async function handleRemovePin() {
    if (!store.pinHash) return;
    const ok = await verifyPin(removePinInput, store.pinHash);
    if (ok) {
      store.setPinHash(null);
      setShowRemovePin(false);
      setRemovePinInput('');
      setRemovePinError(false);
    } else {
      setRemovePinError(true);
      setRemovePinInput('');
    }
  }

  function handleAddCategory() {
    const name = newCatName.trim();
    if (!name) return;
    const exists = categories.some((c) => c.toLowerCase() === name.toLowerCase());
    if (exists) return;
    store.addCustomCategory({ name, icon: newCatIcon });
    setNewCatName('');
    setNewCatIcon('Shopping');
    setShowAddCategory(false);
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-28">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-base font-semibold text-white">Settings</h2>
      </div>

      {/* Currency - hidden for now */}
      {/* <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Currency</p>
        <div className="flex gap-2">
          {CURRENCIES.map((sym) => (
            <button
              key={sym}
              onClick={() => setCurrencySymbol(sym)}
              className={`w-12 h-12 rounded-xl text-lg font-semibold transition-all ${
                currencySymbol === sym
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div> */}

      {/* Security */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Security</p>
        <div className="bg-slate-800/60 rounded-xl p-4">
          {!store.pinHash ? (
            <button
              onClick={() => setShowPinSetup(true)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-sm text-slate-200">Set PIN Lock</span>
              </div>
              <ArrowLeftIcon size={16} className="text-slate-500 rotate-180" />
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <span className="text-sm text-emerald-400 font-medium">PIN Lock Enabled</span>
                </div>
                <button
                  onClick={() => { setShowRemovePin(!showRemovePin); setRemovePinInput(''); setRemovePinError(false); }}
                  className="text-xs text-red-400 bg-slate-700 px-3 py-1.5 rounded-lg"
                >
                  Remove
                </button>
              </div>
              {showRemovePin && (
                <div className="space-y-2 animate-slide-up">
                  <p className="text-xs text-slate-400">Enter current PIN to remove:</p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={removePinInput}
                      onChange={(e) => { setRemovePinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setRemovePinError(false); }}
                      placeholder="4-digit PIN"
                      className="flex-1 bg-slate-700 rounded-lg px-3 py-2.5 text-sm text-white text-center tracking-[0.5em] placeholder:tracking-normal outline-none focus:ring-1 focus:ring-emerald-500/50"
                      autoFocus
                    />
                    <button
                      onClick={handleRemovePin}
                      disabled={removePinInput.length !== 4}
                      className="bg-red-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-30 transition-all"
                    >
                      Confirm
                    </button>
                  </div>
                  {removePinError && (
                    <p className="text-xs text-red-400">Wrong PIN. Try again.</p>
                  )}
                  <p className="text-[10px] text-slate-600">Forgot PIN? Clear app data in browser settings to reset.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showPinSetup && <PinSetup onClose={() => setShowPinSetup(false)} />}

      {/* Custom Categories */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Categories</p>
        <div className="space-y-2 mb-3">
          {DEFAULT_CATEGORIES.map((cat) => (
            <div key={cat} className="bg-slate-800/60 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                <CategoryIcon name={cat} size={16} className="text-slate-400" />
                {cat}
              </span>
              <span className="text-[10px] text-slate-600 uppercase">Default</span>
            </div>
          ))}
          {customCategories.map((cat) => (
            <div key={cat.name} className="bg-slate-800/60 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                <CategoryIcon name={cat.icon} size={16} className="text-slate-400" />
                {cat.name}
              </span>
              <button
                onClick={() => store.removeCustomCategory(cat.name)}
                className="text-xs text-red-400 bg-slate-700 px-2 py-1 rounded-lg"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {showAddCategory ? (
          <div className="bg-slate-800/60 rounded-xl p-4 space-y-3 animate-slide-up">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category name"
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
              autoFocus
            />
            <p className="text-xs text-slate-400">Choose an icon:</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setNewCatIcon(icon)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                    newCatIcon === icon ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  <CategoryIcon name={icon} size={18} />
                  <span className="text-[10px]">{icon}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCategory}
                disabled={!newCatName.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-emerald-500 text-white disabled:opacity-30 transition-all active:scale-[0.98]"
              >
                Add Category
              </button>
              <button
                onClick={() => { setShowAddCategory(false); setNewCatName(''); }}
                className="px-4 py-2.5 rounded-lg text-sm bg-slate-700 text-slate-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddCategory(true)}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-slate-800/60 text-emerald-400 active:bg-slate-800/80 transition-colors"
          >
            + Add Custom Category
          </button>
        )}
      </div>

      {/* Budget Limits */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">
          Budget Limits <span className="normal-case text-slate-500">(per cycle)</span>
        </p>
        <div className="space-y-3">
          {categories.map((cat) => {
            const budget = categoryBudgets.find((b) => b.category === cat);
            const spent = byCategory[cat] ?? 0;
            const isEditing = editingCat === cat;

            return (
              <div key={cat} className="bg-slate-800/60 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300 flex items-center gap-2">
                    <CategoryIcon name={getCategoryIconName(cat, customCategories)} size={16} className="text-slate-400" />
                    {cat}
                  </span>
                  {budget && !isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingCat(cat); setLimitInput(budget.limit.toString()); }}
                        className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-lg"
                      >
                        {currencySymbol}{budget.limit.toLocaleString()}
                      </button>
                      <button
                        onClick={() => removeCategoryBudget(cat)}
                        className="text-xs text-red-400 bg-slate-700 px-2 py-1 rounded-lg"
                      >
                        ×
                      </button>
                    </div>
                  ) : !isEditing ? (
                    <button
                      onClick={() => { setEditingCat(cat); setLimitInput(''); }}
                      className="text-xs text-emerald-400 bg-slate-700 px-3 py-1 rounded-lg"
                    >
                      Set limit
                    </button>
                  ) : null}
                </div>

                {isEditing && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={limitInput}
                      onChange={(e) => setLimitInput(e.target.value)}
                      placeholder="Amount"
                      className="flex-1 bg-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/50"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSetLimit(cat)}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditingCat(null); setLimitInput(''); }}
                      className="bg-slate-700 text-slate-400 px-3 py-2 rounded-lg text-sm"
                    >
                      ×
                    </button>
                  </div>
                )}

                {budget && !isEditing && (
                  <BudgetProgress spent={spent} limit={budget.limit} symbol={currencySymbol} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Data */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Export Data</p>
        <div className="bg-slate-800/60 rounded-xl p-4 space-y-3">
          <div className="flex gap-2">
            {(['current', 'previous', 'all'] as const).map((scope) => (
              <button
                key={scope}
                onClick={() => setExportScope(scope)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  exportScope === scope ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {scope === 'current' ? 'Current' : scope === 'previous' ? 'Previous' : 'All Time'}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="w-full py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white active:scale-[0.98] transition-transform"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Recurring */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Recurring Expenses</p>
        <button
          onClick={() => onNavigate('recurring')}
          className="w-full bg-slate-800/60 rounded-xl p-4 flex items-center justify-between active:bg-slate-800/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <RepeatIcon size={20} className="text-emerald-400" />
            <div className="text-left">
              <p className="text-sm text-slate-200 font-medium">Manage Templates</p>
              <p className="text-xs text-slate-500">
                {store.recurringTemplates.length} template{store.recurringTemplates.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <ArrowLeftIcon size={16} className="text-slate-500 rotate-180" />
        </button>
      </div>
    </div>
  );
}
