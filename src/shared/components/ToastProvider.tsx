import { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from './Toast';

type ToastData = {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
};

const ToastContext = createContext<(message: string, opts?: { action?: ToastData['action']; duration?: number }) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const show = useCallback((message: string, opts?: { action?: ToastData['action']; duration?: number }) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, ...opts }].slice(-5));
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          action={t.action}
          duration={t.duration ?? 2500}
          onDismiss={() => dismiss(t.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}
