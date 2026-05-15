'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ content, children, position = 'top' }: Props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 6 : -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'top' ? 6 : -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-64 px-3 py-2 text-xs text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl pointer-events-none
              ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2`}
          >
            {content}
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 border-zinc-700 rotate-45
              ${position === 'top' ? '-bottom-1 border-b border-r' : '-top-1 border-t border-l'}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
