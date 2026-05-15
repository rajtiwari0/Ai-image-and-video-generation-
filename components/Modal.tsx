'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'error' | 'success';
}

const variantStyles = {
  default: 'border-zinc-700',
  error: 'border-red-900',
  success: 'border-emerald-900',
};

export function Modal({ isOpen, onClose, title, children, variant = 'default' }: Props) {
  useEffect(() => {
    if (isOpen) {
      const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-full max-w-lg bg-zinc-900 rounded-2xl border shadow-2xl p-6 ${variantStyles[variant]}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
