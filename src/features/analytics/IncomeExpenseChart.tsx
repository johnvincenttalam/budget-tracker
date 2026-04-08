import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getRecentCycles } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';

export function IncomeExpenseChart() {
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const isDark = store.theme === 'dark';
  const cycles = getRecentCycles(6);

  const data = cycles.map((cycle) => ({
    label: cycle.label,
    income: store.getTotalIncome(cycle),
    expenses: store.getTotalExpenses(cycle),
  }));

  const hasData = data.some((d) => d.income > 0 || d.expenses > 0);
  if (!hasData) return null;

  return (
    <div className="bg-slate-900 rounded-2xl p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Income vs Expenses</p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: isDark ? '#636366' : '#8E8E93' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: isDark ? '#636366' : '#8E8E93' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                border: `1px solid ${isDark ? '#38383A' : '#D1D1D6'}`,
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: isDark ? '#E5E5EA' : '#1C1C1E',
              }}
              labelStyle={{ color: isDark ? '#8E8E93' : '#636366' }}
              formatter={(value) => [formatMoney(Number(value), sym)]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: isDark ? '#8E8E93' : '#636366' }}
              formatter={(value: string) => (value === 'income' ? 'Income' : 'Expenses')}
            />
            <Bar dataKey="income" fill="#34D399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#FF453A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
