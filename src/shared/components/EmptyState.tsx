import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({ icon, title, description, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-10 ${className}`}>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 mb-3">
        {icon}
      </div>
      <p className="text-slate-400 text-sm">{title}</p>
      {description && <p className="text-slate-500 text-xs mt-1">{description}</p>}
    </div>
  );
}
