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

  const generate = useCallback(
    async (prompt: string, model: string, quality?: string) => {
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

      const ticker = setInterval(() => {
        setProgress(p => Math.min(p + Math.random() * 8, 88));
      }, 600);

      const start = Date.now();

      try {
        const options: {
          model?: string;
          quality?: 'low' | 'medium' | 'high' | 'hd' | 'standard';
          size?: string;
          n?: number;
          test_mode?: boolean;
        } = { model };
        if (quality) options.quality = quality as 'low' | 'medium' | 'high' | 'hd' | 'standard';

        const imgElement = await window.puter.ai.txt2img(prompt, options);
        const durationMs = Date.now() - start;

        clearInterval(ticker);
        setProgress(100);

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
    },
    [addUsage]
  );

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { images, isGenerating, progress, error, generate, removeImage, clearError };
}
