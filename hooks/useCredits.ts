'use client';

import { useState, useCallback } from 'react';

export interface CreditEntry {
  id: string;
  model: string;
  prompt: string;
  timestamp: Date;
  durationMs: number;
}

export function useCredits() {
  const [sessionCount, setSessionCount] = useState(0);
  const [history, setHistory] = useState<CreditEntry[]>([]);

  const addUsage = useCallback((entry: Omit<CreditEntry, 'id'>) => {
    const id = crypto.randomUUID();
    setSessionCount(c => c + 1);
    setHistory(h => [{ id, ...entry }, ...h].slice(0, 50));
  }, []);

  return { sessionCount, history, addUsage };
}
