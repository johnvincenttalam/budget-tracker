import { useState } from 'react';
import { useToast } from '../../shared/components/ToastProvider';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import type { Screen, WishlistPriority } from '../../shared/types';

const PRIORITIES: { value: WishlistPriority; label: string; color: string; bg: string }[] = [
  { value: 'need', label: 'Need', color: 'text-red-400', bg: 'bg-red-500' },
  { value: 'want', label: 'Want', color: 'text-purple-400', bg: 'bg-purple-500' },
  { value: 'someday', label: 'Someday', color: 'text-slate-400', bg: 'bg-slate-500' },
];

function getPriorityStyle(p: WishlistPriority) {
  return PRIORITIES.find((pr) => pr.value === p) ?? PRIORITIES[1];
}

export function Wishlist({ onNavigate: _onNavigate }: { onNavigate: (s: Screen) => void }) {
  const toast = useToast();
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const items = store.wishlistItems;
  const cycle = getCurrentCycle();
  const balance = store.getBalance(cycle);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [priority, setPriority] = useState<WishlistPriority>('want');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'price' | 'date'>('priority');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showPurchased, setShowPurchased] = useState(false);

  const unpurchased = items.filter((i) => !i.purchased);
  const purchased = items.filter((i) => i.purchased);
  const totalWishlist = unpurchased.reduce((sum, i) => sum + i.price, 0);

  // Sort
  const sorted = [...unpurchased].sort((a, b) => {
    if (sortBy === 'price') return b.price - a.price;
    if (sortBy === 'date') return b.createdAt.localeCompare(a.createdAt);
    // priority: need > want > someday
    const order: Record<WishlistPriority, number> = { need: 0, want: 1, someday: 2 };
    return order[a.priority] - order[b.priority];
  });

  function resetForm() {
    setName('');
    setPrice('');
    setPriority('want');
    setNote('');
    setLink('');
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setEditingId(id);
    setName(item.name);
    setPrice(String(item.price));
    setPriority(item.priority);
    setNote(item.note ?? '');
    setLink(item.link ?? '');
    setShowForm(true);
  }

  function handleSave() {
    const num = parseFloat(price);
    if (!name.trim() || num <= 0 || isNaN(num)) return;
    if (editingId) {
      store.updateWishlistItem(editingId, {
        name: name.trim(),
        price: num,
        priority,
        note: note.trim() || undefined,
        link: link.trim() || undefined,
      });
      toast('Item updated');
    } else {
      store.addWishlistItem({
        name: name.trim(),
        price: num,
        priority,
        note: note.trim() || undefined,
        link: link.trim() || undefined,
      });
      toast(`${name.trim()} added`);
    }
    resetForm();
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      const item = items.find((i) => i.id === id);
      store.deleteWishlistItem(id);
      setConfirmDelete(null);
      toast(item ? `${item.name} removed` : 'Item removed');
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete((prev) => prev === id ? null : prev), 3000);
    }
  }

  function handleTogglePurchased(id: string) {
    const item = items.find((i) => i.id === id);
    store.toggleWishlistPurchased(id);
    if (item && !item.purchased) {
      toast(`${item.name} marked as purchased`);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-28 px-4 pt-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-base font-semibold text-white">Wishlist</h2>
      </div>

      {/* Summary */}
      {unpurchased.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider">{unpurchased.length} item{unpurchased.length !== 1 ? 's' : ''}</p>
            <p className="text-sm font-bold text-white">{formatMoney(totalWishlist, sym)}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${balance >= totalWishlist ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <p className={`text-xs ${balance >= totalWishlist ? 'text-emerald-400' : 'text-slate-500'}`}>
              {balance >= totalWishlist
                ? `You can afford everything (${formatMoney(balance, sym)} balance)`
                : `${formatMoney(totalWishlist - balance, sym)} more needed`
              }
            </p>
          </div>
        </div>
      )}

      {/* Sort */}
      {unpurchased.length > 1 && (
        <div className="flex gap-2">
          <span className="text-xs text-slate-500 self-center shrink-0">Sort:</span>
          {(['priority', 'price', 'date'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sortBy === s ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Items */}
      {sorted.length > 0 && (
        <div className="bg-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-800">
          {sorted.map((item) => {
            const ps = getPriorityStyle(item.priority);
            const canAfford = balance >= item.price;
            return (
              <div key={item.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Purchase checkbox */}
                  <button
                    onClick={() => handleTogglePurchased(item.id)}
                    className="w-6 h-6 rounded-full border-2 border-slate-600 flex items-center justify-center shrink-0 transition-all active:scale-90"
                  >
                  </button>

                  {/* Info — tap to edit */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleEdit(item.id)}>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{item.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ps.color} ${ps.bg}/20`}>
                        {ps.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.note && <p className="text-xs text-slate-500 truncate">{item.note}</p>}
                    </div>
                  </div>

                  {/* Price & affordability */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{formatMoney(item.price, sym)}</p>
                      <p className={`text-[10px] ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>
                        {canAfford ? 'Can afford' : 'Not yet'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className={`text-xs px-2 py-1 rounded-lg transition-all duration-200 ${
                        confirmDelete === item.id ? 'bg-red-500 text-white scale-110' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {confirmDelete === item.id ? 'Sure?' : '×'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Purchased section */}
      {purchased.length > 0 && (
        <div>
          <button
            onClick={() => setShowPurchased(!showPurchased)}
            className="flex items-center gap-2 text-xs text-slate-500 mb-2"
          >
            <svg className={`w-3 h-3 transition-transform ${showPurchased ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Purchased ({purchased.length})
          </button>
          {showPurchased && (
            <div className="bg-slate-900/50 rounded-2xl overflow-hidden divide-y divide-slate-800/50">
              {purchased.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center gap-3 opacity-50">
                  <button
                    onClick={() => handleTogglePurchased(item.id)}
                    className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center shrink-0"
                  >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-500 line-through">{item.name}</p>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">{formatMoney(item.price, sym)}</p>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className={`text-xs px-2 py-1 rounded-lg transition-all duration-200 ${
                      confirmDelete === item.id ? 'bg-red-500 text-white scale-110' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {confirmDelete === item.id ? 'Sure?' : '×'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 mb-3">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">No wishlist items yet</p>
          <p className="text-slate-500 text-xs mt-1">Add things you want to buy and track if you can afford them</p>
        </div>
      )}

      {/* Add/Edit form */}
      {showForm ? (
        <div className="bg-slate-900 rounded-2xl p-4 space-y-3 animate-slide-up">
          <p className="text-xs text-slate-400 uppercase tracking-wider">{editingId ? 'Edit Item' : 'New Item'}</p>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
            autoFocus
          />

          <input
            type="number"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Estimated price"
            className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
          />

          {/* Priority */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Priority</p>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    priority === p.value ? `${p.bg} text-white` : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
          />

          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link (optional)"
            className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
          />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!name.trim() || !price || parseFloat(price) <= 0}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white disabled:opacity-30 transition-all active:scale-[0.98]"
            >
              {editingId ? 'Save' : 'Add Item'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-3 rounded-xl text-sm bg-slate-800 text-slate-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="w-full py-3 rounded-2xl text-sm font-medium bg-slate-900 text-emerald-400 active:bg-slate-800 transition-colors"
        >
          + Add Item
        </button>
      )}
    </div>
  );
}
