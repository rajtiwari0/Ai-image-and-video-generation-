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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
          <Images className="w-7 h-7 text-zinc-600" />
        </div>
        <h3 className="text-lg font-semibold text-white">Your gallery is empty</h3>
        <p className="text-sm text-zinc-500 mt-2 max-w-md">
          Generate your first image to see it appear here. Try a style preset for a quick start.
        </p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
      <AnimatePresence>
        {images.map(image => (
          <div key={image.id} className="break-inside-avoid">
            <ImageCard image={image} onRemove={onRemove} onClick={onImageClick} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
