import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (title: string, message?: string, duration?: number) => void;
    error: (title: string, message?: string, duration?: number) => void;
    warning: (title: string, message?: string, duration?: number) => void;
    info: (title: string, message?: string, duration?: number) => void;
    show: (toast: Omit<ToastMessage, 'id'>) => void;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (title: string, message?: string, duration?: number) =>
      show({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      show({ type: 'error', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      show({ type: 'warning', title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      show({ type: 'info', title, message, duration }),
    show,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
  };

  const borderGradients = {
    success: 'border-emerald-500/30 bg-emerald-950/40',
    error: 'border-rose-500/30 bg-rose-950/40',
    warning: 'border-amber-500/30 bg-amber-950/40',
    info: 'border-sky-500/30 bg-sky-950/40',
  };

  const accentBars = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
  };

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl p-4 transition-all duration-300 transform translate-x-0 animate-in fade-in slide-in-from-top-4 ${borderGradients[toast.type]} bg-slate-900/90 text-slate-100 flex gap-3 items-start`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentBars[toast.type]}`} />
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 pr-2">
        <h4 className="text-sm font-semibold tracking-tight text-white">{toast.title}</h4>
        {toast.message && (
          <p className="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-line">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white dark:bg-slate-900/10"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context.toast;
}
