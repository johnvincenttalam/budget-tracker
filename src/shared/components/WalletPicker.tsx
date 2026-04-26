import { useBudgetStore } from '../store/useBudgetStore';
import { WalletAccountIcon } from './Icons';

type WalletPickerProps = {
  walletId: string;
  onChange: (id: string) => void;
  label?: string;
  className?: string;
  excludeId?: string;
  surface?: 'page' | 'sheet';
};

export function WalletPicker({
  walletId,
  onChange,
  label,
  className = '',
  excludeId,
  surface = 'page',
}: WalletPickerProps) {
  const wallets = useBudgetStore((s) => s.wallets);
  const activeWallets = wallets.filter((w) => !w.archived && w.id !== excludeId);

  if (activeWallets.length === 0) return null;

  const unselectedBg = surface === 'sheet'
    ? 'bg-slate-800 text-slate-300 active:bg-slate-700'
    : 'bg-slate-900 text-slate-300 active:bg-slate-800';

  return (
    <div className={className}>
      {label && (
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5">{label}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {activeWallets.map((w) => {
          const selected = walletId === w.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onChange(w.id)}
              style={selected ? { backgroundColor: w.color } : undefined}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                selected ? 'text-white shadow-sm' : unselectedBg
              }`}
            >
              <WalletAccountIcon
                name={w.icon}
                accountName={w.name}
                logoDataUrl={w.logoDataUrl}
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
