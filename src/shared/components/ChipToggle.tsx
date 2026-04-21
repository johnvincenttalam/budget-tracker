type ChipOption<T extends string> = {
  value: T;
  label: string;
  color?: string;
};

type ChipToggleProps<T extends string> = {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function ChipToggle<T extends string>({ options, value, onChange, className = '' }: ChipToggleProps<T>) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        const activeColor = opt.color || 'bg-emerald-500 text-white';
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isActive ? activeColor : 'bg-slate-900 text-slate-400'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
