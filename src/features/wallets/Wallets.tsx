import { useState } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { formatMoney } from '../../shared/utils/format';
import { todayStr } from '../../shared/utils/cycle';
import { Card } from '../../shared/components/Card';
import { SectionLabel } from '../../shared/components/SectionLabel';
import { BottomSheet } from '../../shared/components/BottomSheet';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import type { Screen, Wallet } from '../../shared/types';

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];

const PRESET_ICONS = [
  '\u{1F4B5}', '\u{1F4F1}', '\u{1F3E6}', '\u{1F4B3}',
  '\u{1F4B0}', '\u{1F3E0}', '\u{2B50}', '\u{1F4BC}',
];

export function Wallets({ onNavigate: _onNavigate }: { onNavigate: (s: Screen) => void }) {
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const wallets = store.wallets.filter((w) => !w.archived);
  const defaultWalletId = store.defaultWalletId;

  const [sheetMode, setSheetMode] = useState<'closed' | 'add' | 'edit' | 'transfer'>('closed');
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(PRESET_ICONS[0]);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [initialBalance, setInitialBalance] = useState('');

  // Transfer state
  const [fromWallet, setFromWallet] = useState('');
  const [toWallet, setToWallet] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState(todayStr());
  const [transferNote, setTransferNote] = useState('');

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const totalBalance = wallets.reduce((sum, w) => sum + store.getWalletBalance(w.id), 0);

  function openAdd() {
    setName('');
    setIcon(PRESET_ICONS[0]);
    setColor(PRESET_COLORS[0]);
    setInitialBalance('');
    setSheetMode('add');
  }

  function openEdit(w: Wallet) {
    setEditingWallet(w);
    setName(w.name);
    setIcon(w.icon);
    setColor(w.color);
    setInitialBalance(String(w.initialBalance));
    setSheetMode('edit');
  }

  function openTransfer() {
    setFromWallet(wallets[0]?.id ?? '');
    setToWallet(wallets[1]?.id ?? wallets[0]?.id ?? '');
    setTransferAmount('');
    setTransferDate(todayStr());
    setTransferNote('');
    setSheetMode('transfer');
  }

  function handleSaveWallet() {
    if (!name.trim()) return;
    if (sheetMode === 'add') {
      store.addWallet({
        name: name.trim(),
        icon,
        color,
        initialBalance: parseFloat(initialBalance) || 0,
      });
    } else if (sheetMode === 'edit' && editingWallet) {
      store.updateWallet(editingWallet.id, {
        name: name.trim(),
        icon,
        color,
        initialBalance: parseFloat(initialBalance) || 0,
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

  function handleDelete(id: string) {
    if (id === 'default' && wallets.length === 1) return;
    store.deleteWallet(id);
    setConfirmDeleteId(null);
  }

  return (
    <div className="px-5 pt-4 space-y-4">
      {/* Hero: total balance */}
      <Card size="lg" className="text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Balance</p>
        <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {sym}{formatMoney(Math.abs(totalBalance))}
        </p>
        <p className="text-[10px] text-slate-600 mt-1">{wallets.length} active wallet{wallets.length !== 1 ? 's' : ''}</p>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" fullWidth onClick={openAdd}>
          + Add Wallet
        </Button>
        {wallets.length >= 2 && (
          <Button variant="secondary" size="sm" fullWidth onClick={openTransfer}>
            Transfer
          </Button>
        )}
      </div>

      {/* Wallet cards */}
      <SectionLabel>Your Wallets</SectionLabel>
      <div className="space-y-3">
        {wallets.map((w) => {
          const balance = store.getWalletBalance(w.id);
          const isDefault = w.id === defaultWalletId;
          return (
            <Card
              key={w.id}
              size="md"
              onClick={() => openEdit(w)}
              className="relative"
            >
              {confirmDeleteId === w.id ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-300">Delete this wallet?</p>
                  <div className="flex gap-2">
                    <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(w.id); }}>
                      Delete
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: w.color + '25' }}
                  >
                    {w.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-white truncate">{w.name}</p>
                      {isDefault && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${balance >= 0 ? 'text-slate-400' : 'text-red-400'}`}>
                      {sym}{formatMoney(Math.abs(balance))}
                      {balance < 0 && ' (negative)'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!isDefault && (
                      <button
                        onClick={(e) => { e.stopPropagation(); store.setDefaultWalletId(w.id); }}
                        className="p-2 text-slate-600 active:text-emerald-400 transition-colors"
                        title="Set as default"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(w.id); }}
                      className="p-2 text-slate-600 active:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Wallet Sheet */}
      <BottomSheet
        open={sheetMode === 'add' || sheetMode === 'edit'}
        onClose={() => setSheetMode('closed')}
        title={sheetMode === 'add' ? 'Add Wallet' : 'Edit Wallet'}
      >
        <div className="space-y-4">
          <Input
            label="Wallet Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. GCash, BPI, Maya"
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
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    icon === ic
                      ? 'bg-emerald-500/20 ring-2 ring-emerald-500 scale-110'
                      : 'bg-slate-800 active:bg-slate-700'
                  }`}
                >
                  {ic}
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

          <Input
            label="Initial Balance"
            type="number"
            inputMode="decimal"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            placeholder="0.00"
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSaveWallet}
            disabled={!name.trim()}
          >
            {sheetMode === 'add' ? 'Add Wallet' : 'Save Changes'}
          </Button>
        </div>
      </BottomSheet>

      {/* Transfer Sheet */}
      <BottomSheet
        open={sheetMode === 'transfer'}
        onClose={() => setSheetMode('closed')}
        title="Transfer Between Wallets"
      >
        <div className="space-y-4">
          {/* From */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2">From</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setFromWallet(w.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shrink-0 transition-all ${
                    fromWallet === w.id
                      ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 active:bg-slate-700'
                  }`}
                >
                  {w.icon} {w.name}
                </button>
              ))}
            </div>
          </div>

          {/* To */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2">To</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {wallets.filter((w) => w.id !== fromWallet).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setToWallet(w.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shrink-0 transition-all ${
                    toWallet === w.id
                      ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 active:bg-slate-700'
                  }`}
                >
                  {w.icon} {w.name}
                </button>
              ))}
            </div>
          </div>

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
