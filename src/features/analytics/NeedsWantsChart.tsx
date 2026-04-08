import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { formatMoney } from '../../shared/utils/format';
import type { Cycle } from '../../shared/types';

const COLORS = { needs: '#0A84FF', wants: '#BF5AF2' };

export function NeedsWantsChart({ cycle }: { cycle: Cycle }) {
  const store = useBudgetStore();
  const sym = store.currencySymbol;
  const { needs, wants } = store.getExpensesByTag(cycle);
  const total = needs + wants;

  if (total === 0) return null;

  const data = [
    { name: 'Needs', value: needs, color: COLORS.needs },
    { name: 'Wants', value: wants, color: COLORS.wants },
  ];

  const needsPct = Math.round((needs / total) * 100);
  const wantsPct = 100 - needsPct;

  return (
    <div className="bg-slate-900 rounded-2xl p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Needs vs Wants</p>
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-300">Needs</span>
              <span className="text-xs text-slate-500 ml-auto">{needsPct}%</span>
            </div>
            <p className="text-sm font-semibold text-white pl-[18px]">{formatMoney(needs, sym)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-sm text-slate-300">Wants</span>
              <span className="text-xs text-slate-500 ml-auto">{wantsPct}%</span>
            </div>
            <p className="text-sm font-semibold text-white pl-[18px]">{formatMoney(wants, sym)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
