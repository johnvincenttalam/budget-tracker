import { formatMoney } from '../utils/format';

type BudgetProgressProps = {
  spent: number;
  limit: number;
  symbol: string;
};

export function BudgetProgress({ spent, limit, symbol }: BudgetProgressProps) {
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const isWarning = pct >= 80 && pct < 100;
  const isExceeded = pct >= 100;

  const barColor = isExceeded ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';
  const textColor = isExceeded ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-500';

  return (
    <div className="mt-1">
      <div className="flex justify-between text-[11px] mb-0.5">
        <span className={textColor}>
          {formatMoney(spent, symbol)} / {formatMoney(limit, symbol)}
        </span>
        <span className={textColor}>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {isExceeded && (
        <p className="text-[11px] text-red-400 mt-0.5">
          Over by {formatMoney(spent - limit, symbol)}
        </p>
      )}
    </div>
  );
}
