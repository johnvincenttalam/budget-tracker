import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-medium">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow ${className}`}
      />
    </div>
  );
}
