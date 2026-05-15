'use client';

import { useState } from 'react';
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
      toast('Signed in successfully.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed.';
      toast(message, 'error');
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

    const image = await generate(prompt, model, quality);
    if (image) {
      setSelectedImage(image);
      toast('Image generated.', 'success');
    }
  };

  const handleRetry = async () => {
    if (!lastPrompt || !lastModel) return;
    await handleGenerate(lastPrompt, lastModel, lastQuality);
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Loading Puter...
        </div>
      </div>
    );
  }

  if (authState === 'signed-out') {
    return <AuthGate onSignIn={handleSignIn} isLoading={signingIn} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="sticky top-0 z-30 border-b border-zinc-900/70 bg-[#0a0a0f]/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-700/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-300" />
            </div>
            <div>
              <div className="text-lg font-semibold">PixelForge</div>
              <div className="text-xs text-zinc-500">AI Image Studio</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <CreditsBadge sessionCount={sessionCount} username={username} />
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800
                         text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
            >
              <History className="w-4 h-4" />
              History
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800
                         text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
          <div className="space-y-6 lg:sticky lg:top-28 self-start">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Generate</h2>
                <p className="text-sm text-zinc-500">
                  Choose a model, set quality, and describe what you want to create.
                </p>
              </div>
              <GeneratorForm
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                progress={progress}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Gallery</h2>
              <span className="text-xs text-zinc-500">{images.length} images</span>
            </div>
            <ImageGrid images={images} onRemove={removeImage} onImageClick={setSelectedImage} />
          </div>
        </div>
      </main>

      <ErrorModal error={error} onClose={clearError} onRetry={handleRetry} />
      <SuccessModal image={selectedImage} onClose={() => setSelectedImage(null)} />

      <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title="Session History">
        {history.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No history yet. Generate an image to see it listed here.
          </p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {history.map(entry => (
              <div key={entry.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{entry.timestamp.toLocaleString()}</span>
                  <span>{(entry.durationMs / 1000).toFixed(1)}s</span>
                </div>
                <div className="text-sm text-white mt-1">{entry.prompt}</div>
                <div className="text-xs text-zinc-500 mt-1">{entry.model}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
