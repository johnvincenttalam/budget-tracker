import type { ReactNode } from 'react';

type SectionLabelProps = {
  children: ReactNode;
  className?: string;
  action?: ReactNode;
};

export function SectionLabel({ children, className = '', action }: SectionLabelProps) {
  if (action) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{children}</span>
        {action}
      </div>
    );
  }
  return (
    <p className={`text-[10px] text-slate-500 uppercase tracking-wider font-medium ${className}`}>
      {children}
    </p>
  );
}
