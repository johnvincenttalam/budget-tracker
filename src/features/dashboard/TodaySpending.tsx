import { useState, useMemo } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCurrentCycle, todayStr } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import { Card } from '../../shared/components/Card';
import { SectionLabel } from '../../shared/components/SectionLabel';

type Period = 'D' | 'W' | 'M';

export function TodaySpending() {
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const [period, setPeriod] = useState<Period>('D');

  const amount = useMemo(() => {
    const today = todayStr();
    const pad = (n: number) => String(n).padStart(2, '0');

    if (period === 'D') {
      return store.transactions
        .filter((t) => t.type === 'expense' && !t.transferId && t.date === today)
        .reduce((sum, t) => sum + t.amount, 0);
    }

    if (period === 'W') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      const weekStart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      return store.transactions
        .filter((t) => t.type === 'expense' && !t.transferId && t.date >= weekStart && t.date <= today)
        .reduce((sum, t) => sum + t.amount, 0);
    }

    // Month = current cycle
    const cycle = getCurrentCycle();
    return store.getTotalExpenses(cycle);
  }, [period, store]);

  const periodLabel = period === 'D' ? 'Today' : period === 'W' ? 'This Week' : 'This Cycle';

  return (
    <Card size="sm" className="flex-1">
      <SectionLabel className="mb-2">{periodLabel} Spent</SectionLabel>
      <p className="text-2xl font-bold text-white mb-3">{formatMoney(amount, sym)}</p>
      <div className="flex gap-1 bg-slate-800 rounded-lg p-0.5">
        {(['D', 'W', 'M'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-all ${
              period === p ? 'bg-emerald-500 text-white' : 'text-slate-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </Card>
  );
}
