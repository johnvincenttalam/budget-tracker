import { useBudgetStore } from '../store/useBudgetStore';
import { WalletAccountIcon } from './Icons';

type WalletPickerProps = {
  walletId: string;
  onChange: (id: string) => void;
  label?: string;
  className?: string;
};

export function WalletPicker({ walletId, onChange, label, className = '' }: WalletPickerProps) {
  const wallets = useBudgetStore((s) => s.wallets);
  const activeWallets = wallets.filter((w) => !w.archived);

  if (activeWallets.length === 0) return null;

  return (
    <div className={className}>
      {label && (
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5">{label}</p>
      )}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {activeWallets.map((w) => {
          const selected = walletId === w.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onChange(w.id)}
              style={selected ? { backgroundColor: w.color } : undefined}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold shrink-0 transition-all ${
                selected
                  ? 'text-white shadow-sm'
                  : 'bg-slate-900 text-slate-300 active:bg-slate-800'
              }`}
            >
              <WalletAccountIcon
                name={w.icon}
                size={14}
                style={selected ? undefined : { color: w.color }}
              />
              {w.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
