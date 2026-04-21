import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type ToastProps = {
  message: string;
  icon?: ReactNode;
  action?: { label: string; onClick: () => void };
  duration?: number;
  onDismiss: () => void;
};

export function Toast({ message, icon, action, duration = 5000, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`fixed left-4 right-4 max-w-2xl mx-auto z-50
        bg-slate-900 rounded-xl px-4 py-3 flex items-center justify-between
        shadow-lg shadow-black/30 ring-1 ring-slate-800 ${exiting ? 'animate-fade-out' : 'animate-slide-up'}`}
      style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="text-sm text-slate-200 truncate">{message}</span>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-bold text-emerald-400 ml-3 shrink-0"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
