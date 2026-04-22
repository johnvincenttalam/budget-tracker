import { useMemo } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { formatMoney } from '../../shared/utils/format';
import { Card } from '../../shared/components/Card';
import { SectionLabel } from '../../shared/components/SectionLabel';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function WeekChart() {
  const store = useBudgetStore();
  const sym = store.currencySymbol;

  const { days, maxAmount } = useMemo(() => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const result: { date: string; dayIndex: number; total: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      result.push({
        date: dateStr,
        dayIndex: d.getDay(),
        total: 0,
      });
    }

    for (const tx of store.transactions) {
      if (tx.type !== 'expense' || tx.transferId) continue;
      const day = result.find((r) => r.date === tx.date);
      if (day) day.total += tx.amount;
    }

    const max = Math.max(...result.map((r) => r.total), 1);
    return { days: result, maxAmount: max };
  }, [store.transactions]);

  const weekTotal = days.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card size="sm" className="flex-1">
      <SectionLabel className="mb-2">Last 7 Days</SectionLabel>
      <p className="text-lg font-bold text-white mb-2">{formatMoney(weekTotal, sym)}</p>
      <div className="flex items-end justify-between gap-1 h-16">
        {days.map((day, i) => {
          const isToday = i === days.length - 1;
          const heightPct = day.total > 0 ? (day.total / maxAmount) * 100 : 0;
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center h-12">
                <div
                  className={`w-full max-w-[14px] rounded-sm transition-all duration-300 ${
                    isToday ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                  style={{ height: `${Math.max(heightPct, 3)}%` }}
                />
              </div>
              <span className={`text-[9px] ${isToday ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                {DAY_LABELS[day.dayIndex]}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
