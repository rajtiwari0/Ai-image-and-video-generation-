'use client';

import { Download, Copy, CheckCircle } from 'lucide-react';
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
