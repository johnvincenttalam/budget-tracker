import { useState, useEffect } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle, todayStr } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import { getCategoryIconName } from '../../shared/utils/categories';
import { CategoryIcon, RepeatIcon, CheckCircleIcon } from '../../shared/components/Icons';
import type { RecurringTemplate } from '../../shared/types';

const STORAGE_KEY = 'budget-tracker-last-prompted-cycle';

export function RecurringPrompt() {
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const templates = store.recurringTemplates.filter((t) => t.enabled);
  const customCategories = store.customCategories;

  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState<RecurringTemplate[]>([]);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  useEffect(() => {
    const cycle = getCurrentCycle();
    const lastPrompted = localStorage.getItem(STORAGE_KEY);
    if (lastPrompted !== cycle.startDate && templates.length > 0) {
      setPending(templates);
      setVisible(true);
    }
  }, [templates.length]);

  function handleConfirm(t: RecurringTemplate) {
    store.addTransaction({
      type: 'expense',
      amount: t.amount,
      category: t.category,
      tag: t.tag,
      note: t.note ? `${t.note} (recurring)` : 'Recurring',
      date: todayStr(),
    });
    setConfirmed((prev) => new Set(prev).add(t.id));
  }

  function handleSkip(id: string) {
    setSkipped((prev) => new Set(prev).add(id));
  }

  function handleDone() {
    localStorage.setItem(STORAGE_KEY, getCurrentCycle().startDate);
    setVisible(false);
  }

  if (!visible || pending.length === 0) return null;

  const allHandled = pending.every((t) => confirmed.has(t.id) || skipped.has(t.id));

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-end justify-center animate-fade-in">
      <div className="bg-slate-900 w-full max-w-2xl rounded-t-2xl p-5 space-y-4 animate-slide-up">
        <div className="flex items-center gap-2 text-emerald-400">
          <RepeatIcon size={20} />
          <h3 className="text-base font-semibold">Recurring Expenses</h3>
        </div>
        <p className="text-xs text-slate-400">
          New cycle started. Confirm which recurring expenses to add.
        </p>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {pending.map((t) => {
            const isConfirmed = confirmed.has(t.id);
            const isSkipped = skipped.has(t.id);
            return (
              <div
                key={t.id}
                className={`rounded-xl px-4 py-3 flex items-center justify-between transition-all ${
                  isConfirmed ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' :
                  isSkipped ? 'bg-slate-900 opacity-50' :
                  'bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/15 text-red-400 shrink-0">
                    <CategoryIcon name={getCategoryIconName(t.category, customCategories)} size={16} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-200">{t.category}</p>
                    {t.note && <p className="text-xs text-slate-500">{t.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-sm font-bold text-red-400">{formatMoney(t.amount, sym)}</p>
                  {!isConfirmed && !isSkipped && (
                    <>
                      <button
                        onClick={() => handleConfirm(t)}
                        className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium active:scale-95 transition-transform"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => handleSkip(t.id)}
                        className="bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg text-xs font-medium active:scale-95 transition-transform"
                      >
                        Skip
                      </button>
                    </>
                  )}
                  {isConfirmed && <CheckCircleIcon size={18} className="text-emerald-400" />}
                  {isSkipped && <span className="text-xs text-slate-500">Skipped</span>}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleDone}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
            allHandled ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          {allHandled ? 'Done' : 'Dismiss'}
        </button>
      </div>
    </div>
  );
}
