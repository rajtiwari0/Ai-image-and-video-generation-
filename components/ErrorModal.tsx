'use client';

import { RefreshCw } from 'lucide-react';
import { Modal } from './Modal';
import type { GenerationError } from '@/hooks/useImageGeneration';

interface Props {
  error: GenerationError | null;
  onClose: () => void;
  onRetry?: () => void;
}

const ERROR_ICONS: Record<string, string> = {
  AUTH_ERROR: '🔐',
  RATE_LIMIT: '⏱️',
  CONTENT_POLICY: '🚫',
  NETWORK_ERROR: '🌐',
  EMPTY_PROMPT: '✏️',
  UNKNOWN: '⚠️',
};

export function ErrorModal({ error, onClose, onRetry }: Props) {
  return (
    <Modal isOpen={!!error} onClose={onClose} title="Generation Failed" variant="error">
      {error && (
        <div className="space-y-4">
          <div className="flex gap-3 items-start p-4 bg-red-950/40 border border-red-900/50 rounded-xl">
            <span className="text-2xl">{ERROR_ICONS[error.code] || '⚠️'}</span>
            <div>
              <p className="text-red-300 font-medium">{error.message}</p>
              <p className="text-zinc-400 text-sm mt-1">{error.suggestion}</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            {onRetry && (
              <button
                onClick={() => {
                  onRetry();
                  onClose();
                }}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white text-sm transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
