import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getRecentCycles } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';

export function SpendingTrendsChart() {
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const cycles = getRecentCycles(6);

  const data = cycles.map((cycle) => ({
    label: cycle.label,
    expenses: store.getTotalExpenses(cycle),
  }));

  const hasData = data.some((d) => d.expenses > 0);
  if (!hasData) return null;

  return (
    <div className="bg-slate-800/60 rounded-xl p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Spending Trends</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.75rem',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value) => [formatMoney(Number(value), sym), 'Expenses']}
            />
            <Bar dataKey="expenses" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === data.length - 1 ? '#f87171' : '#475569'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
