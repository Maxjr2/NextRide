import { useEffect, createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { clsx } from '../utils/clsx';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

let _id = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[2000] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast }: { toast: ToastMessage }) {
  const typeClass: Record<ToastType, string> = {
    success: 'bg-accent text-white',
    error: 'bg-danger text-white',
    info: 'bg-offer text-white',
  };

  return (
    <div
      role="status"
      className={clsx(
        'px-6 py-3.5 rounded-full shadow-card-lg',
        'font-bold text-sm text-center',
        'animate-[fadeInDown_0.25s_ease]',
        typeClass[toast.type],
      )}
    >
      {toast.type === 'success' && '✓ '}
      {toast.message}
    </div>
  );
}
