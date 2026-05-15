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
  'Photorealistic',
  'Oil painting',
  'Anime',
  'Watercolor',
  'Cinematic',
  'Digital art',
  '3D render',
  'Sketch',
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
    setPrompt(p => (p ? `${p}, ${style.toLowerCase()} style` : `${style.toLowerCase()} style`));
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
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold
                      ${model.badge === 'BEST'
                        ? 'bg-violet-600 text-white'
                        : model.badge === 'FAST'
                          ? 'bg-emerald-800 text-emerald-300'
                          : model.badge === 'HD'
                            ? 'bg-blue-800 text-blue-300'
                            : 'bg-amber-800 text-amber-300'
                      }`}
                  >
                    {model.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-zinc-500">{model.provider}</span>
            </button>
          ))}
        </div>

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
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ml-1 shrink-0
                        ${model.badge === 'NEW' ? 'bg-amber-800 text-amber-300' : 'bg-zinc-700 text-zinc-400'}`}
                    >
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

      <motion.button
        whileHover={{ scale: isGenerating ? 1 : 1.02 }}
        whileTap={{ scale: isGenerating ? 1 : 0.98 }}
        onClick={handleSubmit}
        disabled={isGenerating || !prompt.trim()}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500
                   disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold
                   py-4 rounded-2xl text-base transition-all shadow-lg shadow-violet-900/30 relative overflow-hidden"
      >
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
