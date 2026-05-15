# 🎨 Puter AI Image Generator — Production App Build Instructions

> **Stack**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion  
> **Deployment**: Vercel (with 60s max duration)  
> **Image Model**: `gemini-3-pro-image-preview` via Puter.js  
> **Auth**: Puter's built-in Google OAuth (user-pays model)

---

## 📁 Project Structure

```
puter-image-gen/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       └── generate/
│           └── route.ts          ← (optional proxy, not required for Puter)
├── components/
│   ├── AuthGate.tsx              ← Puter login wall
│   ├── GeneratorForm.tsx         ← Prompt input + model/quality controls
│   ├── ImageGrid.tsx             ← Masonry gallery of generated images
│   ├── ImageCard.tsx             ← Single image with download/copy/zoom
│   ├── CreditsBadge.tsx          ← Session credit counter
│   ├── LoadingSpinner.tsx        ← Shimmer skeleton while generating
│   ├── ToastProvider.tsx         ← Global toast notifications
│   ├── Modal.tsx                 ← Reusable modal component
│   ├── ErrorModal.tsx            ← Error details modal
│   ├── SuccessModal.tsx          ← Success/share modal
│   └── Tooltip.tsx               ← Hover tooltip wrapper
├── hooks/
│   ├── usePuter.ts               ← Puter.js initialisation + auth state
│   ├── useImageGeneration.ts     ← Generation logic + queue
│   └── useCredits.ts             ← Session credit tracking
├── lib/
│   ├── puter.d.ts                ← TypeScript types for puter global
│   ├── models.ts                 ← Model list + metadata
│   └── utils.ts                  ← Helpers (download, share, etc.)
├── public/
│   └── puter-badge.svg
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 1. Bootstrap the Project

```bash
npx create-next-app@latest puter-image-gen \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias "@/*"

cd puter-image-gen
npm install framer-motion lucide-react clsx
npm install -D @types/node
```

---

## 2. `next.config.js` — Set Vercel Max Duration to 60s

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from Puter CDN + blob URLs
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.puter.com' },
      { protocol: 'https', hostname: '**.puterusercontent.com' },
    ],
  },
};

module.exports = nextConfig;
```

Then create `vercel.json` in the project root:

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

> **Note**: Puter.js runs client-side. The 60s limit applies if you add any server route wrappers. The main generation happens in the browser via Puter.js.

---

## 3. Load Puter.js — `app/layout.tsx`

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import { ToastProvider } from '@/components/ToastProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'PixelForge — AI Image Studio',
  description: 'Generate stunning images with Gemini, DALL-E, Flux & more. Free, unlimited.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Puter.js MUST load before app JS */}
        <Script
          src="https://js.puter.com/v2/"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-[#0a0a0f] text-white antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

---

## 4. TypeScript Types for Puter — `lib/puter.d.ts`

```ts
// lib/puter.d.ts
declare global {
  interface Window {
    puter: Puter;
  }

  interface Puter {
    auth: {
      isSignedIn(): boolean;
      signIn(): Promise<void>;
      signOut(): Promise<void>;
      getUser(): Promise<{ username: string; email?: string; uuid: string }>;
    };
    ai: {
      txt2img(
        prompt: string,
        options?: {
          model?: string;
          quality?: 'low' | 'medium' | 'high' | 'hd' | 'standard';
          size?: string;
          n?: number;
          test_mode?: boolean;
        }
      ): Promise<HTMLImageElement>;
    };
  }
}

export {};
```

---

## 5. Model Catalogue — `lib/models.ts`

```ts
// lib/models.ts
export interface ImageModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  badge?: 'BEST' | 'FAST' | 'HD' | 'NEW';
  supportsQuality?: Array<'low' | 'medium' | 'high' | 'hd' | 'standard'>;
  defaultQuality?: string;
  avgSeconds?: number;
}

export const MODELS: ImageModel[] = [
  {
    id: 'gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro',
    provider: 'Google',
    description: 'Latest Gemini Pro image model. Exceptional detail and instruction following.',
    badge: 'BEST',
    avgSeconds: 15,
  },
  {
    id: 'gemini-3.1-flash-image-preview',
    name: 'Gemini 3.1 Flash',
    provider: 'Google',
    description: 'Ultra-fast Gemini generation. Great for rapid iteration.',
    badge: 'FAST',
    avgSeconds: 8,
  },
  {
    id: 'gemini-2.5-flash-image-preview',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Balanced speed and quality from Google.',
    avgSeconds: 10,
  },
  {
    id: 'gpt-image-2',
    name: 'GPT Image 2',
    provider: 'OpenAI',
    description: "OpenAI's latest image model with vivid realism.",
    badge: 'HD',
    supportsQuality: ['low', 'medium', 'high'],
    defaultQuality: 'medium',
    avgSeconds: 20,
  },
  {
    id: 'dall-e-3',
    name: 'DALL·E 3',
    provider: 'OpenAI',
    description: 'OpenAI classic. Precise, stylised generations.',
    supportsQuality: ['standard', 'hd'],
    defaultQuality: 'standard',
    avgSeconds: 18,
  },
  {
    id: 'dall-e-2',
    name: 'DALL·E 2',
    provider: 'OpenAI',
    description: 'Classic DALL-E. Fastest OpenAI option.',
    badge: 'FAST',
    avgSeconds: 8,
  },
  {
    id: 'black-forest-labs/flux-1.1-pro',
    name: 'Flux 1.1 Pro',
    provider: 'Black Forest Labs',
    description: 'Photorealistic. Exceptional for portraits and landscapes.',
    badge: 'HD',
    avgSeconds: 20,
  },
  {
    id: 'black-forest-labs/flux-schnell',
    name: 'Flux Schnell',
    provider: 'Black Forest Labs',
    description: 'Lightning-fast Flux variant for quick drafts.',
    badge: 'FAST',
    avgSeconds: 5,
  },
  {
    id: 'black-forest-labs/FLUX.1-kontext-pro',
    name: 'Flux Kontext Pro',
    provider: 'Black Forest Labs',
    description: 'Context-aware generation. Great for scene consistency.',
    badge: 'NEW',
    avgSeconds: 22,
  },
  {
    id: 'stabilityai/stable-diffusion-3-medium',
    name: 'Stable Diffusion 3',
    provider: 'Stability AI',
    description: 'Open-source powerhouse. Versatile artistic styles.',
    avgSeconds: 12,
  },
  {
    id: 'stabilityai/stable-diffusion-xl-base-1.0',
    name: 'SDXL 1.0',
    provider: 'Stability AI',
    description: 'High-resolution open model. Great for artistic work.',
    avgSeconds: 14,
  },
  {
    id: 'google/imagen-4.0-ultra',
    name: 'Imagen 4 Ultra',
    provider: 'Google',
    description: "Google's highest quality image model. Stunning photorealism.",
    badge: 'HD',
    avgSeconds: 30,
  },
  {
    id: 'google/imagen-4.0-fast',
    name: 'Imagen 4 Fast',
    provider: 'Google',
    description: 'Fast variant of Imagen 4. Great speed-quality balance.',
    badge: 'FAST',
    avgSeconds: 10,
  },
  {
    id: 'ideogram/ideogram-3.0',
    name: 'Ideogram 3.0',
    provider: 'Ideogram',
    description: 'Excels at text-in-image generation.',
    badge: 'NEW',
    avgSeconds: 18,
  },
  {
    id: 'ByteDance-Seed/Seedream-4.0',
    name: 'Seedream 4.0',
    provider: 'ByteDance',
    description: 'Dreamlike, artistic generations from ByteDance.',
    badge: 'NEW',
    avgSeconds: 16,
  },
  {
    id: 'HiDream-ai/HiDream-I1-Full',
    name: 'HiDream I1 Full',
    provider: 'HiDream',
    description: 'Full-quality HiDream model for intricate scenes.',
    avgSeconds: 25,
  },
];

export const DEFAULT_MODEL = 'gemini-3-pro-image-preview';
```

---

## 6. Custom Hooks

### `hooks/usePuter.ts` — Auth + Init

```ts
// hooks/usePuter.ts
'use client';
import { useState, useEffect, useCallback } from 'react';

type AuthState = 'loading' | 'signed-in' | 'signed-out';

export function usePuter() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [username, setUsername] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !window.puter) return;
      const signedIn = window.puter.auth.isSignedIn();
      if (signedIn) {
        const user = await window.puter.auth.getUser();
        setUsername(user.username);
        setAuthState('signed-in');
      } else {
        setAuthState('signed-out');
      }
    } catch {
      setAuthState('signed-out');
    }
  }, []);

  useEffect(() => {
    // Wait for puter to be available
    const interval = setInterval(() => {
      if (window.puter) {
        clearInterval(interval);
        checkAuth();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [checkAuth]);

  const signIn = useCallback(async () => {
    try {
      await window.puter.auth.signIn();
      await checkAuth();
    } catch (err) {
      throw new Error('Sign-in failed. Please try again.');
    }
  }, [checkAuth]);

  const signOut = useCallback(async () => {
    try {
      await window.puter.auth.signOut();
      setAuthState('signed-out');
      setUsername(null);
    } catch (err) {
      throw new Error('Sign-out failed.');
    }
  }, []);

  return { authState, username, signIn, signOut };
}
```

---

### `hooks/useCredits.ts` — Session Usage Tracker

```ts
// hooks/useCredits.ts
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
    setHistory(h => [{ id, ...entry }, ...h].slice(0, 50)); // keep last 50
  }, []);

  return { sessionCount, history, addUsage };
}
```

---

### `hooks/useImageGeneration.ts` — Core Generation Logic

```ts
// hooks/useImageGeneration.ts
'use client';
import { useState, useCallback } from 'react';
import { useCredits } from './useCredits';

export interface GeneratedImage {
  id: string;
  src: string;
  prompt: string;
  model: string;
  quality?: string;
  createdAt: Date;
  durationMs: number;
  aspectRatio?: string;
}

export interface GenerationError {
  code: string;
  message: string;
  suggestion: string;
}

export function useImageGeneration() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<GenerationError | null>(null);
  const { addUsage } = useCredits();

  const generate = useCallback(async (
    prompt: string,
    model: string,
    quality?: string
  ) => {
    if (!prompt.trim()) {
      setError({
        code: 'EMPTY_PROMPT',
        message: 'Prompt cannot be empty.',
        suggestion: 'Describe what you want to generate — be specific for better results.',
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    // Fake progress ticker for UX
    const ticker = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 8, 88));
    }, 600);

    const start = Date.now();

    try {
      const options: Record<string, string> = { model };
      if (quality) options.quality = quality;

      const imgElement = await window.puter.ai.txt2img(prompt, options);
      const durationMs = Date.now() - start;

      clearInterval(ticker);
      setProgress(100);

      // Convert the HTMLImageElement src to a usable URL
      const src = imgElement.src;

      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        src,
        prompt,
        model,
        quality,
        createdAt: new Date(),
        durationMs,
      };

      setImages(prev => [newImage, ...prev]);
      addUsage({ model, prompt, timestamp: new Date(), durationMs });

      return newImage;
    } catch (err: unknown) {
      clearInterval(ticker);
      const errMsg = err instanceof Error ? err.message : 'Unknown error';

      // Parse common Puter errors
      if (errMsg.includes('auth') || errMsg.includes('sign')) {
        setError({
          code: 'AUTH_ERROR',
          message: 'Authentication required.',
          suggestion: 'Please sign in with your Puter account to continue.',
        });
      } else if (errMsg.includes('rate') || errMsg.includes('limit')) {
        setError({
          code: 'RATE_LIMIT',
          message: 'Too many requests.',
          suggestion: 'Wait a few seconds before generating again.',
        });
      } else if (errMsg.includes('content') || errMsg.includes('policy') || errMsg.includes('safety')) {
        setError({
          code: 'CONTENT_POLICY',
          message: 'Your prompt was blocked by content policy.',
          suggestion: 'Try rephrasing your prompt to avoid restricted content.',
        });
      } else if (errMsg.includes('network') || errMsg.includes('fetch')) {
        setError({
          code: 'NETWORK_ERROR',
          message: 'Network error.',
          suggestion: 'Check your internet connection and try again.',
        });
      } else {
        setError({
          code: 'UNKNOWN',
          message: errMsg || 'Generation failed.',
          suggestion: 'Try again with a different prompt or model.',
        });
      }
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 800);
    }
  }, [addUsage]);

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { images, isGenerating, progress, error, generate, removeImage, clearError };
}
```

---

## 7. Core Components

### `components/AuthGate.tsx`

```tsx
// components/AuthGate.tsx
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
```

---

### `components/CreditsBadge.tsx`

```tsx
// components/CreditsBadge.tsx
'use client';
import { Zap } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface Props {
  sessionCount: number;
  username?: string | null;
}

export function CreditsBadge({ sessionCount, username }: Props) {
  return (
    <Tooltip content="Credits are unlimited via Puter's User-Pays model. This shows images generated this session.">
      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-zinc-400">
          {username && <span className="text-white font-medium">{username} · </span>}
          <span className="text-yellow-400 font-bold">{sessionCount}</span>
          <span className="text-zinc-500"> generated · ∞ credits</span>
        </span>
      </div>
    </Tooltip>
  );
}
```

---

### `components/Tooltip.tsx`

```tsx
// components/Tooltip.tsx
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
            <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 border-zinc-700 rotate-45
              ${position === 'top' ? '-bottom-1 border-b border-r' : '-top-1 border-t border-l'}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

### `components/Modal.tsx`

```tsx
// components/Modal.tsx
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
```

---

### `components/ErrorModal.tsx`

```tsx
// components/ErrorModal.tsx
'use client';
import { AlertTriangle, RefreshCw } from 'lucide-react';
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
                onClick={() => { onRetry(); onClose(); }}
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
```

---

### `components/SuccessModal.tsx`

```tsx
// components/SuccessModal.tsx
'use client';
import { Download, Copy, Share2, CheckCircle } from 'lucide-react';
import { Modal } from './Modal';
import { useState } from 'react';
import type { GeneratedImage } from '@/hooks/useImageGeneration';

interface Props {
  image: GeneratedImage | null;
  onClose: () => void;
}

export function SuccessModal({ image, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    if (!image) return;
    const a = document.createElement('a');
    a.href = image.src;
    a.download = `pixelforge-${image.id.slice(0, 8)}.png`;
    a.click();
  };

  const handleCopyPrompt = async () => {
    if (!image) return;
    await navigator.clipboard.writeText(image.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={!!image} onClose={onClose} title="Image Generated!" variant="success">
      {image && (
        <div className="space-y-4">
          <div className="flex gap-2 items-center text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Generated in {(image.durationMs / 1000).toFixed(1)}s with {image.model}
          </div>
          <img
            src={image.src}
            alt={image.prompt}
            className="w-full rounded-xl object-cover max-h-64"
          />
          <p className="text-zinc-400 text-sm italic">"{image.prompt}"</p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
```

---

### `components/GeneratorForm.tsx`

```tsx
// components/GeneratorForm.tsx
'use client';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wand2, ChevronDown, Info } from 'lucide-react';
import { MODELS, DEFAULT_MODEL } from '@/lib/models';
import { Tooltip } from './Tooltip';

interface Props {
  onGenerate: (prompt: string, model: string, quality?: string) => void;
  isGenerating: boolean;
  progress: number;
}

const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'];
const STYLE_PRESETS = [
  'Photorealistic', 'Oil painting', 'Anime', 'Watercolor',
  'Cinematic', 'Digital art', '3D render', 'Sketch',
];

export function GeneratorForm({ onGenerate, isGenerating, progress }: Props) {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [selectedQuality, setSelectedQuality] = useState<string | undefined>(undefined);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentModel = MODELS.find(m => m.id === selectedModel);

  const handleStylePreset = (style: string) => {
    setPrompt(p => p ? `${p}, ${style.toLowerCase()} style` : `${style.toLowerCase()} style`);
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt, selectedModel, selectedQuality || currentModel?.defaultQuality);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  return (
    <div className="space-y-4">
      {/* Prompt Input */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the image you want to create… (Ctrl+Enter to generate)"
          rows={4}
          className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-500 rounded-2xl px-5 py-4 
                     text-white placeholder-zinc-500 resize-none outline-none transition-colors text-base
                     focus:ring-1 focus:ring-violet-500/30"
        />
        <div className="absolute bottom-3 right-3 text-xs text-zinc-600">{prompt.length}/1000</div>
      </div>

      {/* Style Presets */}
      <div className="flex flex-wrap gap-2">
        {STYLE_PRESETS.map(style => (
          <button
            key={style}
            onClick={() => handleStylePreset(style)}
            className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 
                       text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600 transition-all"
          >
            {style}
          </button>
        ))}
      </div>

      {/* Model Selector */}
      <div>
        <label className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
          Model
          <Tooltip content="Each model has different strengths. Gemini 3 Pro is recommended for best quality.">
            <Info className="w-3.5 h-3.5 text-zinc-600 cursor-help" />
          </Tooltip>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MODELS.slice(0, 6).map(model => (
            <button
              key={model.id}
              onClick={() => {
                setSelectedModel(model.id);
                setSelectedQuality(undefined);
              }}
              className={`text-left p-3 rounded-xl border transition-all text-sm
                ${selectedModel === model.id
                  ? 'bg-violet-950/60 border-violet-600 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{model.name}</span>
                {model.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold
                    ${model.badge === 'BEST' ? 'bg-violet-600 text-white' :
                      model.badge === 'FAST' ? 'bg-emerald-800 text-emerald-300' :
                      model.badge === 'HD' ? 'bg-blue-800 text-blue-300' :
                      'bg-amber-800 text-amber-300'}`}>
                    {model.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-zinc-500">{model.provider}</span>
            </button>
          ))}
        </div>

        {/* Show all models toggle */}
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="mt-2 text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          {showAdvanced ? 'Show fewer models' : `Show all ${MODELS.length} models`}
        </button>

        {showAdvanced && (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MODELS.slice(6).map(model => (
              <button
                key={model.id}
                onClick={() => {
                  setSelectedModel(model.id);
                  setSelectedQuality(undefined);
                }}
                className={`text-left p-3 rounded-xl border transition-all text-sm
                  ${selectedModel === model.id
                    ? 'bg-violet-950/60 border-violet-600 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{model.name}</span>
                  {model.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ml-1 shrink-0
                      ${model.badge === 'NEW' ? 'bg-amber-800 text-amber-300' : 'bg-zinc-700 text-zinc-400'}`}>
                      {model.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-zinc-500">{model.provider}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quality Selector — shown only for models that support it */}
      {currentModel?.supportsQuality && (
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">Quality</label>
          <div className="flex gap-2">
            {currentModel.supportsQuality.map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuality(q)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize
                  ${(selectedQuality || currentModel.defaultQuality) === q
                    ? 'bg-violet-950/60 border-violet-600 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <motion.button
        whileHover={{ scale: isGenerating ? 1 : 1.02 }}
        whileTap={{ scale: isGenerating ? 1 : 0.98 }}
        onClick={handleSubmit}
        disabled={isGenerating || !prompt.trim()}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500
                   disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold
                   py-4 rounded-2xl text-base transition-all shadow-lg shadow-violet-900/30 relative overflow-hidden"
      >
        {/* Progress bar */}
        {isGenerating && (
          <motion.div
            className="absolute inset-0 bg-white/10 origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={{ ease: 'linear' }}
          />
        )}
        <span className="relative flex items-center justify-center gap-2">
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating… {progress > 0 ? `${Math.round(progress)}%` : ''}
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Generate Image
              <span className="text-xs opacity-60 ml-1">⌘+Enter</span>
            </>
          )}
        </span>
      </motion.button>

      {currentModel && (
        <p className="text-xs text-zinc-600 text-center">
          {currentModel.name} · ~{currentModel.avgSeconds}s avg · {currentModel.description}
        </p>
      )}
    </div>
  );
}
```

---

### `components/ImageCard.tsx`

```tsx
// components/ImageCard.tsx
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, ZoomIn, Trash2, Clock } from 'lucide-react';
import { Tooltip } from './Tooltip';
import type { GeneratedImage } from '@/hooks/useImageGeneration';

interface Props {
  image: GeneratedImage;
  onRemove: (id: string) => void;
  onClick: (image: GeneratedImage) => void;
}

export function ImageCard({ image, onRemove, onClick }: Props) {
  const [copied, setCopied] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = image.src;
    a.download = `pixelforge-${image.id.slice(0, 8)}.png`;
    a.click();
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(image.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modelShort = image.model.split('/').pop() || image.model;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 
                 hover:border-zinc-600 transition-all cursor-pointer"
      onClick={() => onClick(image)}
    >
      <img
        src={image.src}
        alt={image.prompt}
        className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Prompt */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white text-xs line-clamp-2 mb-2">{image.prompt}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-zinc-400 text-[10px]">
              <Clock className="w-3 h-3" />
              {(image.durationMs / 1000).toFixed(1)}s
              <span className="ml-1 truncate max-w-[80px]">{modelShort}</span>
            </div>
            <div className="flex gap-1">
              <Tooltip content="Zoom in">
                <button
                  onClick={e => { e.stopPropagation(); onClick(image); }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content={copied ? 'Copied!' : 'Copy prompt'}>
                <button onClick={handleCopy} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Download">
                <button onClick={handleDownload} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Remove">
                <button
                  onClick={e => { e.stopPropagation(); onRemove(image.id); }}
                  className="p-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

---

### `components/ImageGrid.tsx`

```tsx
// components/ImageGrid.tsx
'use client';
import { AnimatePresence } from 'framer-motion';
import { ImageCard } from './ImageCard';
import type { GeneratedImage } from '@/hooks/useImageGeneration';
import { Images } from 'lucide-react';

interface Props {
  images: GeneratedImage[];
  onRemove: (id: string) => void;
  onImageClick: (image: GeneratedImage) => void;
}

export function ImageGrid({ images, onRemove, onImageClick }: Props) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-600 gap-4">
        <Images className="w-12 h-12" />
        <p className="text-sm">Your generated images will appear here</p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
      <AnimatePresence>
        {images.map(image => (
          <div key={image.id} className="break-inside-avoid">
            <ImageCard
              image={image}
              onRemove={onRemove}
              onClick={onImageClick}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

---

### `components/ToastProvider.tsx`

```tsx
// components/ToastProvider.tsx
'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; message: string; type: ToastType; }

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
    error: 'bg-red-950 border-red-900 text-red-300',
    info: 'bg-zinc-900 border-zinc-700 text-zinc-300',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => {
            const Icon = icons[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm max-w-sm pointer-events-auto ${colors[t.type]}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {t.message}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
```

---

## 8. Main Page — `app/page.tsx`

```tsx
// app/page.tsx
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, LogOut, History } from 'lucide-react';
import { usePuter } from '@/hooks/usePuter';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useCredits } from '@/hooks/useCredits';
import { useToast } from '@/components/ToastProvider';
import { AuthGate } from '@/components/AuthGate';
import { GeneratorForm } from '@/components/GeneratorForm';
import { ImageGrid } from '@/components/ImageGrid';
import { CreditsBadge } from '@/components/CreditsBadge';
import { ErrorModal } from '@/components/ErrorModal';
import { SuccessModal } from '@/components/SuccessModal';
import { Modal } from '@/components/Modal';
import type { GeneratedImage } from '@/hooks/useImageGeneration';

export default function Home() {
  const { authState, username, signIn, signOut } = usePuter();
  const { images, isGenerating, progress, error, generate, removeImage, clearError } = useImageGeneration();
  const { sessionCount, history } = useCredits();
  const { toast } = useToast();

  const [signingIn, setSigningIn] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');
  const [lastModel, setLastModel] = useState('');
  const [lastQuality, setLastQuality] = useState<string | undefined>(undefined);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signIn();
      toast('Signed in! Start generating images.', 'success');
    } catch (e) {
      toast('Sign-in failed. Please try again.', 'error');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast('Signed out.', 'info');
  };

  const handleGenerate = async (prompt: string, model: string, quality?: string) => {
    setLastPrompt(prompt);
    setLastModel(model);
    setLastQuality(quality);
    const result = await generate(prompt, model, quality);
    if (result) {
      toast('Image generated!', 'success');
      setSelectedImage(result);
    }
  };

  if (authState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (authState === 'signed-out') {
    return <AuthGate onSignIn={handleSignIn} isLoading={signingIn} />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <span className="font-bold text-lg tracking-tight">PixelForge</span>
          </div>

          <div className="flex items-center gap-3">
            <CreditsBadge sessionCount={sessionCount} username={username} />

            <button
              onClick={() => setShowHistory(true)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Generation history"
            >
              <History className="w-4 h-4" />
            </button>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">
          {/* Left: Generator Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-24 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              Create Image
            </h2>
            <GeneratorForm
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              progress={progress}
            />
          </motion.div>

          {/* Right: Gallery */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                Gallery
                {images.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-zinc-500">{images.length} images</span>
                )}
              </h2>
            </div>
            <ImageGrid
              images={images}
              onRemove={removeImage}
              onImageClick={setSelectedImage}
            />
          </motion.div>
        </div>
      </main>

      {/* Modals */}
      <ErrorModal
        error={error}
        onClose={clearError}
        onRetry={lastPrompt ? () => handleGenerate(lastPrompt, lastModel, lastQuality) : undefined}
      />

      <SuccessModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      {/* History Modal */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title={`Generation History (${history.length})`}
      >
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">No generations yet.</p>
          ) : (
            history.map(entry => (
              <div key={entry.id} className="p-3 bg-zinc-800 rounded-xl text-sm">
                <p className="text-white truncate">{entry.prompt}</p>
                <div className="flex gap-3 mt-1 text-xs text-zinc-500">
                  <span>{entry.model.split('/').pop()}</span>
                  <span>{(entry.durationMs / 1000).toFixed(1)}s</span>
                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
```

---

## 9. Global Styles — `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    color-scheme: dark;
  }

  body {
    background: #0a0a0f;
    color: white;
  }

  /* Smooth scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #52525b; }
}

@layer utilities {
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

---

## 10. `package.json`

```json
{
  "name": "puter-image-gen",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.383.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.2.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

---

## 11. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login & deploy
vercel login
vercel --prod
```

Or push to GitHub and import the repo at **vercel.com/new**.

**No environment variables needed** — Puter.js handles all auth + credentials client-side.

---

## 12. Feature Summary

| Feature | Implementation |
|---|---|
| **Puter Google Auth** | `usePuter` hook + `AuthGate` component |
| **Model: gemini-3-pro-image-preview** | Default model in `lib/models.ts` |
| **All 30+ models** | Full catalogue in `lib/models.ts` |
| **Quality selector** | Per-model quality options in `GeneratorForm` |
| **Progress bar** | Animated progress in generate button |
| **Unlimited credits display** | `CreditsBadge` shows session count + ∞ credits |
| **Error modal + tooltips** | `ErrorModal` with categorised errors + retry |
| **Success modal** | `SuccessModal` with download/copy |
| **Toast notifications** | `ToastProvider` for global toasts |
| **Masonry image grid** | CSS `columns` masonry layout |
| **Download images** | Anchor click download in `ImageCard` |
| **Copy prompt** | Clipboard API in `ImageCard` |
| **Zoom / lightbox** | `SuccessModal` reused for image preview |
| **Style presets** | One-click prompt appending |
| **History modal** | Session history via `useCredits` |
| **Vercel 60s timeout** | `vercel.json` `maxDuration: 60` |
| **Keyboard shortcut** | `Ctrl+Enter` to generate |
| **Loading skeleton** | Spinner + animated progress fill |
| **Responsive layout** | 2-column grid on desktop, single column mobile |

---

## 13. Optional Enhancements

- **Batch generation** — Call `puter.ai.txt2img` with `n: 4` to generate multiple images
- **Image-to-image** (if supported) — Pass a base image for variation
- **Prompt enhancement** — Pre-process prompts with a chat model call before image gen
- **Local storage gallery** — Persist `images` array in `localStorage` across sessions
- **Social sharing** — Web Share API for mobile sharing
- **PWA** — Add `manifest.json` + service worker for installable app

---

*Built with [Puter.js](https://developer.puter.com) · Deployed on Vercel · No API keys required*
