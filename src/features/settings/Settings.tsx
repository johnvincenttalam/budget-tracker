import { useState, useRef } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle, getPreviousCycle } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import { getCategoryIconName } from '../../shared/utils/categories';
import { transactionsToCSV, downloadCSV } from '../../shared/utils/csv';
import { verifyPin } from '../security/pin';
import { DEFAULT_CATEGORIES, PRESET_ICONS, type Screen, type PresetIcon } from '../../shared/types';
import { ArrowLeftIcon, CategoryIcon, RepeatIcon } from '../../shared/components/Icons';
import { PinSetup } from '../security/PinSetup';

export function Settings({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const categories = store.getAllCategories();
  const customCategories = store.customCategories;

  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState<PresetIcon>('Shopping');
  const [exportScope, setExportScope] = useState<'current' | 'previous' | 'all'>('current');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showRemovePin, setShowRemovePin] = useState(false);
  const [removePinInput, setRemovePinInput] = useState('');
  const [removePinError, setRemovePinError] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleBackup() {
    const data = localStorage.getItem('budget-tracker-storage');
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        // Validate it's valid JSON with expected structure
        const parsed = JSON.parse(text);
        if (!parsed.state || !Array.isArray(parsed.state.transactions)) {
          setRestoreStatus('error');
          return;
        }
        setPendingRestore(text);
        setShowRestoreConfirm(true);
      } catch {
        setRestoreStatus('error');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  }

  function confirmRestore() {
    if (!pendingRestore) return;
    try {
      localStorage.setItem('budget-tracker-storage', pendingRestore);
      setRestoreStatus('success');
      setShowRestoreConfirm(false);
      setPendingRestore(null);
      // Reload to apply restored data
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setRestoreStatus('error');
      setShowRestoreConfirm(false);
      setPendingRestore(null);
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

  const isDark = store.theme === 'dark';

  return (
    <div className="flex flex-col gap-3 px-4 pt-4 pb-28">
      {/* === PREFERENCES === */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-800/50">
        {/* Theme toggle */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? (
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            )}
            <span className="text-sm text-slate-200">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <button
            onClick={() => store.setTheme(isDark ? 'light' : 'dark')}
            className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${isDark ? 'bg-slate-700' : 'bg-emerald-500'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${isDark ? 'left-0.5' : 'left-[22px]'}`}
              style={{ '--color-white': '#ffffff' } as React.CSSProperties} />
          </button>
        </div>

        {/* Cycle split day */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <div>
              <p className="text-sm text-slate-200">Cycle split</p>
              <p className="text-[10px] text-slate-500">1–{store.cycleSplitDay} and {store.cycleSplitDay + 1}–end</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => store.setCycleSplitDay(Math.max(1, store.cycleSplitDay - 1))}
              className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center active:bg-slate-700 text-sm">−</button>
            <span className="text-sm font-bold text-white w-6 text-center">{store.cycleSplitDay}</span>
            <button onClick={() => store.setCycleSplitDay(Math.min(28, store.cycleSplitDay + 1))}
              className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center active:bg-slate-700 text-sm">+</button>
          </div>
        </div>

        {/* Recurring templates */}
        <button onClick={() => onNavigate('recurring')} className="w-full px-4 py-3 flex items-center justify-between active:bg-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <RepeatIcon size={16} className="text-slate-400" />
            <div className="text-left">
              <p className="text-sm text-slate-200">Recurring</p>
              <p className="text-[10px] text-slate-500">{store.recurringTemplates.length} template{store.recurringTemplates.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* === SECURITY === */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 px-1">Security</p>
      <div className="bg-slate-900 rounded-2xl p-4">
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
                  className="text-xs text-red-400 bg-slate-800 px-3 py-1.5 rounded-lg"
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
                      className="flex-1 bg-slate-800 rounded-lg px-3 py-2.5 text-sm text-white text-center tracking-[0.5em] placeholder:tracking-normal outline-none focus:ring-1 focus:ring-emerald-500/50"
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

      {showPinSetup && <PinSetup onClose={() => setShowPinSetup(false)} />}

      {/* === CATEGORIES === */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 px-1">Categories</p>
      <div className="bg-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-800/50">
        {DEFAULT_CATEGORIES.map((cat) => (
          <div key={cat} className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm text-slate-300 flex items-center gap-2">
              <CategoryIcon name={cat} size={14} className="text-slate-400" />
              {cat}
            </span>
            <span className="text-[9px] text-slate-600">default</span>
          </div>
        ))}
        {customCategories.map((cat) => (
          <div key={cat.name} className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm text-slate-300 flex items-center gap-2">
              <CategoryIcon name={cat.icon} size={14} className="text-slate-400" />
              {cat.name}
            </span>
            <button onClick={() => store.removeCustomCategory(cat.name)} className="text-slate-600 text-xs">×</button>
          </div>
        ))}
      </div>

      {showAddCategory ? (
        <div className="bg-slate-900 rounded-2xl p-4 space-y-3 animate-slide-up">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Category name"
            className="w-full bg-slate-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
            autoFocus
          />
          <div className="grid grid-cols-4 gap-2">
            {PRESET_ICONS.map((icon) => (
              <button
                key={icon}
                onClick={() => setNewCatIcon(icon)}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                  newCatIcon === icon ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <CategoryIcon name={icon} size={16} />
                <span className="text-[9px]">{icon}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddCategory} disabled={!newCatName.trim()}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-emerald-500 text-white disabled:opacity-30 active:scale-[0.98]">
              Add
            </button>
            <button onClick={() => { setShowAddCategory(false); setNewCatName(''); }}
              className="px-4 py-2.5 rounded-lg text-sm bg-slate-800 text-slate-400">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAddCategory(true)}
          className="w-full py-2.5 rounded-2xl text-xs font-medium bg-slate-900 text-emerald-400 active:bg-slate-800 transition-colors">
          + Add Category
        </button>
      )}

      {/* === BUDGET LIMITS === */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 px-1">Budget Limits (per cycle)</p>
      <div className="bg-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-800/50">
        {categories.map((cat) => {
          const budget = store.categoryBudgets.find((b) => b.category === cat);
          const isEditing = editingBudget === cat;
          return (
            <div key={cat} className="px-4 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <CategoryIcon name={getCategoryIconName(cat, customCategories)} size={14} className="text-slate-400" />
                  {cat}
                </span>
                {budget && !isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setEditingBudget(cat); setBudgetInput(String(budget.limit)); }}
                      className="text-xs text-emerald-400 bg-slate-800 px-2 py-1 rounded-lg"
                    >
                      {formatMoney(budget.limit, sym)}
                    </button>
                    <button onClick={() => store.removeCategoryBudget(cat)} className="text-slate-600 text-xs">×</button>
                  </div>
                ) : !isEditing ? (
                  <button
                    onClick={() => { setEditingBudget(cat); setBudgetInput(''); }}
                    className="text-[10px] text-slate-500 bg-slate-800 px-2 py-1 rounded-lg"
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
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    placeholder="Amount"
                    className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/50"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      const val = parseFloat(budgetInput);
                      if (val > 0) store.setCategoryBudget(cat, val);
                      setEditingBudget(null);
                      setBudgetInput('');
                    }}
                    className="bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingBudget(null); setBudgetInput(''); }}
                    className="text-slate-500 text-xs px-2"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* === DATA === */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 px-1">Data</p>
      <div className="bg-slate-900 rounded-2xl p-4 space-y-3">
        {/* Storage */}
        {(() => {
          const MAX_BYTES = 5 * 1024 * 1024;
          let usedBytes = 0;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) usedBytes += (key.length + (localStorage.getItem(key)?.length ?? 0)) * 2;
          }
          const usedKB = (usedBytes / 1024).toFixed(1);
          const pct = Math.min((usedBytes / MAX_BYTES) * 100, 100);
          return (
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75" />
              </svg>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{usedKB} KB</span>
                  <span className="text-slate-500">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Export */}
        <div className="flex gap-2 pt-1">
          {(['current', 'previous', 'all'] as const).map((scope) => (
            <button key={scope} onClick={() => setExportScope(scope)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                exportScope === scope ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
              {scope === 'current' ? 'Current' : scope === 'previous' ? 'Previous' : 'All'}
            </button>
          ))}
        </div>
        <button onClick={handleExport}
          className="w-full py-2.5 rounded-xl text-sm font-medium bg-emerald-500 text-white active:scale-[0.98]">
          Export CSV
        </button>

        {/* Backup / Restore */}
        <div className="flex gap-2 pt-1">
          <button onClick={handleBackup}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-800 text-slate-200 active:scale-[0.98]">
            Backup
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-800 text-slate-200 active:scale-[0.98]">
            Restore
          </button>
        </div>
        {restoreStatus === 'success' && <p className="text-xs text-emerald-400 text-center">Restored! Reloading...</p>}
        {restoreStatus === 'error' && <p className="text-xs text-red-400 text-center">Invalid backup file.</p>}
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-semibold text-base">Restore Backup?</h3>
            <p className="text-sm text-slate-400">This will replace all your current data. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowRestoreConfirm(false); setPendingRestore(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm bg-slate-800 text-slate-300">Cancel</button>
              <button onClick={confirmRestore}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white active:scale-[0.98]">Replace</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
