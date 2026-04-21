import { useState } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { formatMoney } from '../../shared/utils/format';
import { getCategoryIconName } from '../../shared/utils/categories';
import { useToast } from '../../shared/components/ToastProvider';
import { BottomSheet } from '../../shared/components/BottomSheet';
import type { Tag, Screen } from '../../shared/types';
import { CategoryIcon } from '../../shared/components/Icons';

export function RecurringManage({ onNavigate: _onNavigate }: { onNavigate: (s: Screen) => void }) {
  const toast = useToast();
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const templates = store.recurringTemplates;
  const categories = store.getAllCategories();
  const customCategories = store.customCategories;

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Bills');
  const [tag, setTag] = useState<Tag>('needs');
  const [note, setNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function resetForm() {
    setAmount('');
    setCategory('Bills');
    setTag('needs');
    setNote('');
    setShowForm(false);
  }

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
    toast('Template added');
    resetForm();
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      store.deleteRecurringTemplate(id);
      setConfirmDelete(null);
      toast('Template deleted');
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete((prev) => prev === id ? null : prev), 3000);
    }
  }

  const totalEnabled = templates.filter((t) => t.enabled).reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex flex-col gap-3 px-5 pt-4">
      {/* Summary */}
      {templates.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-red-400">{formatMoney(totalEnabled, sym)}</p>
            <p className="text-[10px] text-slate-500">{templates.filter((t) => t.enabled).length} active template{templates.filter((t) => t.enabled).length !== 1 ? 's' : ''}</p>
          </div>
          <p className="text-[10px] text-slate-500">per cycle</p>
        </div>
      )}

      {/* Templates */}
      {templates.length > 0 ? (
        <div className="bg-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-800/50">
          {templates.map((t) => (
            <div key={t.id} className="px-3 py-2.5 flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.enabled ? 'bg-red-500/15 text-red-400' : 'bg-slate-800 text-slate-600'}`}>
                <CategoryIcon name={getCategoryIconName(t.category, customCategories)} size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm ${t.enabled ? 'text-slate-200' : 'text-slate-500'}`}>{t.category}</p>
                  <span className={`text-[9px] px-1.5 py-px rounded-full font-medium ${
                    t.tag === 'needs' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>{t.tag}</span>
                </div>
                {t.note && <p className="text-[10px] text-slate-500 truncate">{t.note}</p>}
              </div>
              <p className={`text-sm font-bold shrink-0 ${t.enabled ? 'text-red-400' : 'text-slate-600'}`}>
                {formatMoney(t.amount, sym)}
              </p>
              <button
                onClick={() => store.toggleRecurringTemplate(t.id)}
                className={`text-[9px] px-2 py-1 rounded-lg transition-all shrink-0 ${
                  t.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'
                }`}
              >
                {t.enabled ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className={`text-xs px-1.5 py-0.5 rounded-lg transition-all duration-200 shrink-0 ${
                  confirmDelete === t.id ? 'bg-red-500 text-white scale-110' : 'text-slate-600'
                }`}
              >
                {confirmDelete === t.id ? 'Sure?' : '×'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 mb-3">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">No recurring expenses</p>
          <p className="text-slate-500 text-xs mt-1">Templates auto-prompt at the start of each cycle</p>
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => { resetForm(); setShowForm(true); }}
        className="w-full py-3 rounded-2xl text-sm font-medium bg-slate-900 text-emerald-400 active:bg-slate-800 transition-colors"
      >
        + Add Template
      </button>

      {/* Bottom sheet form */}
      <BottomSheet open={showForm} onClose={resetForm} title="New Template">
        <div className="space-y-3">
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow"
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
            <button onClick={() => setTag('needs')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${tag === 'needs' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              Needs
            </button>
            <button onClick={() => setTag('wants')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${tag === 'wants' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              Wants
            </button>
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow"
          />

          <button
            onClick={handleAdd}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white disabled:opacity-30 transition-all active:scale-[0.98]"
          >
            Add Template
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
