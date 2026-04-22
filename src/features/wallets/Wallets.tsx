import { useState, useMemo } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { formatMoney } from '../../shared/utils/format';
import { todayStr } from '../../shared/utils/cycle';
import { Card } from '../../shared/components/Card';
import { BottomSheet } from '../../shared/components/BottomSheet';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { WalletAccountIcon, WALLET_ICON_NAMES } from '../../shared/components/Icons';
import { WalletPicker } from '../../shared/components/WalletPicker';
import type { Screen, Wallet, WalletType } from '../../shared/types';

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];

const PRESET_ICONS: readonly string[] = WALLET_ICON_NAMES;

type Filter = 'all' | 'debit' | 'credit';

function walletType(w: Wallet): WalletType {
  return w.type ?? 'debit';
}

export function Wallets({ onNavigate: _onNavigate }: { onNavigate: (s: Screen) => void }) {
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const activeWallets = store.wallets.filter((w) => !w.archived);
  const defaultWalletId = store.defaultWalletId;

  const [filter, setFilter] = useState<Filter>('all');
  const [sheetMode, setSheetMode] = useState<'closed' | 'add' | 'edit' | 'transfer'>('closed');
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  // Form state
  const [type, setType] = useState<WalletType>('debit');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(PRESET_ICONS[0]);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [initialBalance, setInitialBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [statementDay, setStatementDay] = useState('');
  const [dueDay, setDueDay] = useState('');

  // Transfer state
  const [fromWallet, setFromWallet] = useState('');
  const [toWallet, setToWallet] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState(todayStr());
  const [transferNote, setTransferNote] = useState('');

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { debitTotal, creditOwed, netWorth } = useMemo(() => {
    let debit = 0;
    let credit = 0;
    for (const w of activeWallets) {
      const bal = store.getWalletBalance(w.id);
      if (walletType(w) === 'credit') {
        // Credit balance is typically negative (debt); owed = -min(bal, 0)
        credit += Math.max(0, -bal);
      } else {
        debit += bal;
      }
    }
    return { debitTotal: debit, creditOwed: credit, netWorth: debit - credit };
  }, [activeWallets, store]);

  const visibleWallets = activeWallets.filter((w) => filter === 'all' || walletType(w) === filter);

  function resetForm() {
    setType('debit');
    setName('');
    setIcon(PRESET_ICONS[0]);
    setColor(PRESET_COLORS[0]);
    setInitialBalance('');
    setCreditLimit('');
    setStatementDay('');
    setDueDay('');
    setConfirmDelete(false);
  }

  function openAdd() {
    resetForm();
    setEditingWallet(null);
    setSheetMode('add');
  }

  function openEdit(w: Wallet) {
    setEditingWallet(w);
    setType(walletType(w));
    setName(w.name);
    setIcon(w.icon);
    setColor(w.color);
    setInitialBalance(String(w.initialBalance));
    setCreditLimit(w.creditLimit != null ? String(w.creditLimit) : '');
    setStatementDay(w.statementDay != null ? String(w.statementDay) : '');
    setDueDay(w.dueDay != null ? String(w.dueDay) : '');
    setConfirmDelete(false);
    setSheetMode('edit');
  }

  function openTransfer() {
    setFromWallet(activeWallets[0]?.id ?? '');
    setToWallet(activeWallets[1]?.id ?? activeWallets[0]?.id ?? '');
    setTransferAmount('');
    setTransferDate(todayStr());
    setTransferNote('');
    setSheetMode('transfer');
  }

  function handleSaveWallet() {
    if (!name.trim()) return;
    const baseInitial = parseFloat(initialBalance) || 0;
    // For credit, interpret positive input as outstanding debt (stored negative)
    const resolvedInitial = type === 'credit' ? -Math.abs(baseInitial) : baseInitial;
    const extras = type === 'credit'
      ? {
          type: 'credit' as const,
          creditLimit: parseFloat(creditLimit) || 0,
          statementDay: parseInt(statementDay) || undefined,
          dueDay: parseInt(dueDay) || undefined,
        }
      : { type: 'debit' as const, creditLimit: undefined, statementDay: undefined, dueDay: undefined };

    if (sheetMode === 'add') {
      store.addWallet({ name: name.trim(), icon, color, initialBalance: resolvedInitial, ...extras });
    } else if (sheetMode === 'edit' && editingWallet) {
      store.updateWallet(editingWallet.id, {
        name: name.trim(),
        icon,
        color,
        initialBalance: resolvedInitial,
        ...extras,
      });
    }
    setSheetMode('closed');
  }

  function handleTransfer() {
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0 || fromWallet === toWallet) return;
    store.transferBetweenWallets(fromWallet, toWallet, amt, transferDate, transferNote.trim() || undefined);
    setSheetMode('closed');
  }

  function handleDelete() {
    if (!editingWallet) return;
    if (editingWallet.id === 'default' && activeWallets.length === 1) return;
    store.deleteWallet(editingWallet.id);
    setSheetMode('closed');
  }

  const nwColor = netWorth >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="px-5 pt-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Accounts</h1>
        <p className="text-xs text-slate-500 mt-0.5">Cash, bank, and credit</p>
      </div>

      {/* Net Worth hero */}
      <Card size="lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Net Worth</p>
            <p className={`text-3xl font-bold mt-1 ${nwColor}`}>
              {netWorth < 0 && '−'}{sym}{formatMoney(Math.abs(netWorth))}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Debit</p>
            <p className="text-sm font-semibold text-emerald-400 mt-0.5">{sym}{formatMoney(debitTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Credit owed</p>
            <p className="text-sm font-semibold text-red-400 mt-0.5">{sym}{formatMoney(creditOwed)}</p>
          </div>
        </div>
      </Card>

      {/* Filter tabs + actions */}
      <div className="flex items-center gap-2">
        <div className="flex bg-slate-900 rounded-xl p-0.5 flex-1">
          {(['all', 'debit', 'credit'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                filter === f ? 'bg-emerald-500 text-white' : 'text-slate-400'
              }`}
            >
              {f === 'all' ? 'All' : f === 'debit' ? 'Debit' : 'Credit'}
            </button>
          ))}
        </div>
        {activeWallets.length >= 2 && (
          <button
            type="button"
            onClick={openTransfer}
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-[11px] font-medium active:bg-slate-800 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            Transfer
          </button>
        )}
      </div>

      {/* Account card grid */}
      {visibleWallets.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          {filter === 'all' ? 'No accounts yet.' : `No ${filter} accounts.`}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visibleWallets.map((w) => {
            const isCredit = walletType(w) === 'credit';
            const balance = store.getWalletBalance(w.id);
            const isDefault = w.id === defaultWalletId;
            const used = isCredit ? Math.max(0, -balance) : 0;
            const limit = w.creditLimit ?? 0;
            const available = Math.max(0, limit - used);
            const usedPct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

            return (
              <button
                key={w.id}
                type="button"
                onClick={() => openEdit(w)}
                className="relative rounded-2xl p-3.5 text-left active:scale-[0.98] transition-transform overflow-hidden min-h-[140px]"
                style={{
                  background: `linear-gradient(135deg, ${w.color}dd, ${w.color}99)`,
                }}
              >
                {/* Decorative blob */}
                <div
                  className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-20"
                  style={{ backgroundColor: '#ffffff' }}
                />

                {/* Header row */}
                <div className="flex items-start justify-between gap-2 relative">
                  <p className="text-sm font-semibold text-white truncate drop-shadow min-w-0">{w.name}</p>
                  {isDefault && (
                    <span className="text-[9px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-medium shrink-0 backdrop-blur-sm">
                      Default
                    </span>
                  )}
                </div>

                {/* Type badge */}
                <p className="text-[10px] text-white/80 mt-1 relative">
                  {isCredit
                    ? w.dueDay ? `Credit · due day ${w.dueDay}` : 'Credit'
                    : 'Debit'}
                </p>

                {/* Body */}
                {isCredit ? (
                  <div className="mt-3 relative">
                    {/* Progress bar */}
                    <div className="h-1 bg-white/25 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-white rounded-full transition-all"
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-white/75 uppercase tracking-wider">
                      {usedPct.toFixed(0)}% used · {sym}{formatMoney(available)} left
                    </p>
                    <p className="text-lg font-bold text-white mt-0.5 tabular-nums">
                      {sym}{formatMoney(used)}
                    </p>
                    <p className="text-[9px] text-white/75">of {sym}{formatMoney(limit)}</p>
                  </div>
                ) : (
                  <div className="mt-3 relative">
                    <p className="text-[9px] text-white/75 uppercase tracking-wider">Balance</p>
                    <p className="text-lg font-bold text-white mt-0.5 tabular-nums">
                      {balance < 0 && '−'}{sym}{formatMoney(Math.abs(balance))}
                    </p>
                  </div>
                )}
              </button>
            );
          })}

          {/* Add card tile */}
          <button
            type="button"
            onClick={openAdd}
            className="rounded-2xl border-2 border-dashed border-slate-700 text-slate-400 active:bg-slate-900 transition-colors flex flex-col items-center justify-center gap-1 min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="text-xs font-medium">Add account</p>
          </button>
        </div>
      )}

      {/* Add/Edit Account Sheet */}
      <BottomSheet
        open={sheetMode === 'add' || sheetMode === 'edit'}
        onClose={() => setSheetMode('closed')}
        title={sheetMode === 'add' ? 'Add Account' : 'Edit Account'}
      >
        <div className="space-y-4">
          {/* Type toggle */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2">Type</p>
            <div className="flex bg-slate-800 rounded-xl p-0.5">
              {(['debit', 'credit'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    type === t ? 'bg-emerald-500 text-white' : 'text-slate-400'
                  }`}
                >
                  {t === 'debit' ? 'Debit / Cash' : 'Credit Card'}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'credit' ? 'e.g. BPI Visa' : 'e.g. GCash, BPI, Cash'}
            autoFocus
          />

          {/* Icon picker */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2">Icon</p>
            <div className="flex gap-2 flex-wrap">
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-emerald-500/20 ring-2 ring-emerald-500 scale-110 text-emerald-400'
                      : 'bg-slate-800 active:bg-slate-700 text-slate-300'
                  }`}
                  aria-label={ic}
                >
                  <WalletAccountIcon name={ic} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2">Color</p>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-white scale-110' : 'ring-1 ring-slate-700'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {type === 'credit' ? (
            <>
              <Input
                label="Credit Limit"
                type="number"
                inputMode="decimal"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="e.g. 40000"
              />
              <Input
                label="Current Outstanding"
                type="number"
                inputMode="decimal"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0.00"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Statement Day"
                  type="number"
                  inputMode="numeric"
                  value={statementDay}
                  onChange={(e) => setStatementDay(e.target.value)}
                  placeholder="1–28"
                />
                <Input
                  label="Due Day"
                  type="number"
                  inputMode="numeric"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  placeholder="1–28"
                />
              </div>
            </>
          ) : (
            <Input
              label="Initial Balance"
              type="number"
              inputMode="decimal"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0.00"
            />
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSaveWallet}
            disabled={!name.trim() || (type === 'credit' && !creditLimit)}
          >
            {sheetMode === 'add' ? 'Add Account' : 'Save Changes'}
          </Button>

          {sheetMode === 'edit' && editingWallet && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              {editingWallet.id !== defaultWalletId && walletType(editingWallet) === 'debit' && (
                <button
                  type="button"
                  onClick={() => { store.setDefaultWalletId(editingWallet.id); setSheetMode('closed'); }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium bg-slate-800 text-slate-200 active:bg-slate-700"
                >
                  Set as Default
                </button>
              )}
              {confirmDelete ? (
                <div className="flex gap-2">
                  <Button variant="danger" size="md" fullWidth onClick={handleDelete}>
                    Confirm Delete
                  </Button>
                  <Button variant="ghost" size="md" fullWidth onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-red-400 active:bg-slate-800"
                >
                  Delete Account
                </button>
              )}
              <p className="text-[10px] text-slate-600 text-center">
                {editingWallet.id === defaultWalletId ? 'Default accounts cannot be deleted without reassignment.' : 'Accounts with transactions are archived instead of removed.'}
              </p>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Transfer Sheet */}
      <BottomSheet
        open={sheetMode === 'transfer'}
        onClose={() => setSheetMode('closed')}
        title="Transfer Between Accounts"
      >
        <div className="space-y-4">
          <WalletPicker
            walletId={fromWallet}
            onChange={setFromWallet}
            label="From"
            surface="sheet"
          />

          <WalletPicker
            walletId={toWallet}
            onChange={setToWallet}
            label="To"
            surface="sheet"
            excludeId={fromWallet}
          />

          <Input
            label="Amount"
            type="number"
            inputMode="decimal"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Date"
            type="date"
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
          />
          <Input
            label="Note (optional)"
            type="text"
            value={transferNote}
            onChange={(e) => setTransferNote(e.target.value)}
            placeholder="What's this transfer for?"
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleTransfer}
            disabled={!transferAmount || parseFloat(transferAmount) <= 0 || fromWallet === toWallet}
          >
            Transfer
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
