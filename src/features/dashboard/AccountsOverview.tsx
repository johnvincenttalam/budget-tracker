import { useMemo } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { formatMoney } from '../../shared/utils/format';
import { Card } from '../../shared/components/Card';
import { SectionLabel } from '../../shared/components/SectionLabel';
import { WalletAccountIcon } from '../../shared/components/Icons';
import type { Screen } from '../../shared/types';

export function AccountsOverview({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const store = useBudgetStore();
  const sym = store.currencySymbol;

  const { netWorth, creditOwed, positiveDebit, positiveSum, totalDebitAccounts } = useMemo(() => {
    const wallets = store.wallets.filter((w) => !w.archived);
    const enriched = wallets.map((w) => ({
      id: w.id,
      name: w.name,
      icon: w.icon,
      color: w.color,
      logoDataUrl: w.logoDataUrl,
      type: w.type ?? 'debit',
      balance: store.getWalletBalance(w.id),
    }));

    const debit = enriched.filter((w) => w.type === 'debit');
    const credit = enriched.filter((w) => w.type === 'credit');

    const debitSum = debit.reduce((s, w) => s + w.balance, 0);
    const owed = credit.reduce((s, w) => s + Math.max(0, -w.balance), 0);

    const positive = debit.filter((w) => w.balance > 0).sort((a, b) => b.balance - a.balance);
    const posSum = positive.reduce((s, w) => s + w.balance, 0);

    return {
      netWorth: debitSum - owed,
      creditOwed: owed,
      positiveDebit: positive,
      positiveSum: posSum,
      totalDebitAccounts: debit.length,
    };
  }, [store]);

  // Don't show if there's only one default wallet with no data
  if (totalDebitAccounts === 0 || (totalDebitAccounts === 1 && netWorth === 0 && creditOwed === 0)) {
    return null;
  }

  const topN = positiveDebit.slice(0, 3);
  const remaining = positiveDebit.length - topN.length;

  return (
    <Card onClick={() => onNavigate('wallets')}>
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Across your accounts</SectionLabel>
        <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Net Worth</p>
          <p className={`text-2xl font-bold mt-0.5 ${netWorth >= 0 ? 'text-white' : 'text-red-400'}`}>
            {netWorth < 0 && '−'}{sym}{formatMoney(Math.abs(netWorth))}
          </p>
        </div>
        {creditOwed > 0 && (
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Credit owed</p>
            <p className="text-sm font-semibold text-red-400 mt-0.5">−{sym}{formatMoney(creditOwed)}</p>
          </div>
        )}
      </div>

      {positiveSum > 0 ? (
        <>
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-800 mb-3">
            {positiveDebit.map((w) => (
              <div
                key={w.id}
                style={{ width: `${(w.balance / positiveSum) * 100}%`, backgroundColor: w.color }}
                className="h-full"
              />
            ))}
          </div>

          <div className="space-y-1.5">
            {topN.map((w) => {
              const pct = (w.balance / positiveSum) * 100;
              return (
                <div key={w.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <WalletAccountIcon name={w.icon} accountName={w.name} logoDataUrl={w.logoDataUrl} size={14} style={{ color: w.color }} />
                    <span className="text-slate-300 truncate">{w.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-500 text-[10px]">{pct.toFixed(0)}%</span>
                    <span className="font-semibold text-slate-200">{sym}{formatMoney(w.balance)}</span>
                  </div>
                </div>
              );
            })}
            {remaining > 0 && (
              <p className="text-[10px] text-slate-500 pt-0.5">+ {remaining} more account{remaining !== 1 ? 's' : ''}</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-500">
          {totalDebitAccounts > 0 ? 'No debit balances yet. Add a starting balance in Accounts.' : 'Add an account to get started.'}
        </p>
      )}
    </Card>
  );
}
