import { useState } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { formatMoney } from '../../shared/utils/format';
import { getCategoryIconName } from '../../shared/utils/categories';
import type { Tag, Screen } from '../../shared/types';
import { CategoryIcon } from '../../shared/components/Icons';

export function RecurringManage({ onNavigate: _onNavigate }: { onNavigate: (s: Screen) => void }) {
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const templates = store.recurringTemplates;
  const categories = store.getAllCategories();
  const customCategories = store.customCategories;

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Bills');
  const [tag, setTag] = useState<Tag>('needs');
  const [note, setNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleAdd() {
    const num = parseFloat(amount);
    if (num <= 0 || isNaN(num)) return;
    store.addRecurringTemplate({
      amount: num,
      category,
      tag,
      note: note.trim() || undefined,
      enabled: true,
    });
    setAmount('');
    setNote('');
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      store.deleteRecurringTemplate(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-8">

      {/* Add form */}
      <div className="bg-slate-900 rounded-xl p-4 space-y-3">
        <p className="text-xs text-slate-400 uppercase tracking-wider">Add New</p>

        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="w-full bg-slate-800 rounded-lg px-4 py-3 text-lg font-bold text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50 text-center"
        />

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                category === cat ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <CategoryIcon name={getCategoryIconName(cat, customCategories)} size={14} />
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTag('needs')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              tag === 'needs' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >Needs</button>
          <button
            onClick={() => setTag('wants')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              tag === 'wants' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >Wants</button>
        </div>

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="w-full bg-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/50"
        />

        <button
          onClick={handleAdd}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-30 bg-emerald-500 text-white"
        >
          Add Recurring Expense
        </button>
      </div>

      {/* Templates list */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
          Templates ({templates.length})
        </p>
        {templates.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-6">No recurring expenses yet</p>
        ) : (
          <div className="bg-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-800">
            {templates.map((t) => (
              <div
                key={t.id}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-500/15 text-red-400">
                    <CategoryIcon name={getCategoryIconName(t.category, customCategories)} size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-200">{t.category}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        t.tag === 'needs' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {t.tag}
                      </span>
                    </div>
                    {t.note && <p className="text-xs text-slate-500 truncate">{t.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <p className="text-sm font-bold text-red-400">
                    {formatMoney(t.amount, sym)}
                  </p>
                  <button
                    onClick={() => store.toggleRecurringTemplate(t.id)}
                    className={`text-[10px] px-2 py-1 rounded-lg transition-all ${
                      t.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {t.enabled ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className={`text-xs px-2 py-1 rounded-lg transition-all duration-200 ${
                      confirmDelete === t.id ? 'bg-red-500 text-white scale-110' : 'bg-slate-800 text-slate-400 scale-100'
                    }`}
                  >
                    {confirmDelete === t.id ? 'Sure?' : '×'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
