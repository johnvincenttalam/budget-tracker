import { useBudgetStore } from '../store/useBudgetStore';

type WalletPickerProps = {
  walletId: string;
  onChange: (id: string) => void;
  className?: string;
};

export function WalletPicker({ walletId, onChange, className = '' }: WalletPickerProps) {
  const wallets = useBudgetStore((s) => s.wallets);
  const activeWallets = wallets.filter((w) => !w.archived);

  if (activeWallets.length <= 1) return null;

  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 scrollbar-hide ${className}`}>
      {activeWallets.map((w) => {
        const selected = walletId === w.id;
        return (
          <button
            key={w.id}
            type="button"
            onClick={() => onChange(w.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
              selected
                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                : 'bg-slate-900 text-slate-400 active:bg-slate-800'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: w.color }}
            />
            {w.icon} {w.name}
          </button>
        );
      })}
    </div>
  );
}
