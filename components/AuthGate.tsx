'use client';

import { motion } from 'framer-motion';
import { Sparkles, LogIn } from 'lucide-react';

interface Props {
  onSignIn: () => Promise<void>;
  isLoading?: boolean;
}

export function AuthGate({ onSignIn, isLoading }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen gap-8 px-4"
    >
      <div className="text-center space-y-4 max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Sparkles className="w-10 h-10 text-violet-400" />
          <h1 className="text-5xl font-bold tracking-tight">PixelForge</h1>
        </div>
        <p className="text-xl text-zinc-400">
          Free, unlimited AI image generation powered by Gemini, DALL·E, Flux & more.
        </p>
        <p className="text-sm text-zinc-500">
          Uses Puter's User-Pays model — you generate with your own Puter credits. Credits are free and unlimited.
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onSignIn}
        disabled={isLoading}
        className="flex items-center gap-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 
                   text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-violet-900/40"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <LogIn className="w-5 h-5" />
        )}
        Sign in with Puter (Google)
      </motion.button>

      <p className="text-xs text-zinc-600 text-center max-w-sm">
        Puter will ask you to authenticate via Google. This keeps your usage under your own account — no API keys needed.
      </p>
    </motion.div>
  );
}
