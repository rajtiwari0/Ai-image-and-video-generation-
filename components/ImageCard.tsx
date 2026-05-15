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

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                  onClick={e => {
                    e.stopPropagation();
                    onClick(image);
                  }}
                  className="p-1.5 bg-black/60 hover:bg-black/80 rounded-md text-white"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content={copied ? 'Copied!' : 'Copy prompt'}>
                <button
                  onClick={handleCopy}
                  className="p-1.5 bg-black/60 hover:bg-black/80 rounded-md text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Download">
                <button
                  onClick={handleDownload}
                  className="p-1.5 bg-black/60 hover:bg-black/80 rounded-md text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Delete">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onRemove(image.id);
                  }}
                  className="p-1.5 bg-red-900/60 hover:bg-red-800 rounded-md text-red-200"
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
