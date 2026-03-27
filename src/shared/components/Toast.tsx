import { useEffect, useState } from 'react';

type ToastProps = {
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
  onDismiss: () => void;
};

export function Toast({ message, action, duration = 5000, onDismiss }: ToastProps) {
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
      className={`fixed bottom-20 left-4 right-4 max-w-2xl mx-auto z-50
        bg-slate-800 rounded-xl px-4 py-3 flex items-center justify-between
        ring-1 ring-slate-700 ${exiting ? 'animate-fade-out' : 'animate-slide-up'}`}
    >
      <span className="text-sm text-slate-200">{message}</span>
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
