'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{ toast: (msg: string, type?: ToastType) => void }>({
  toast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const colors = {
    success: 'bg-emerald-950 border-emerald-800 text-emerald-300',
    error: 'bg-red-950 border-red-800 text-red-300',
    info: 'bg-zinc-900 border-zinc-700 text-zinc-300',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-6 right-6 z-[60] space-y-3">
        <AnimatePresence>
          {toasts.map(t => {
            const Icon = icons[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl ${colors[t.type]}`}
              >
                <Icon className="w-4 h-4 mt-0.5" />
                <div className="text-sm leading-snug flex-1">{t.message}</div>
                <button
                  onClick={() => setToasts(list => list.filter(x => x.id !== t.id))}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
