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
        <Script src="https://js.puter.com/v2/" strategy="beforeInteractive" />
      </head>
      <body className="bg-[#0a0a0f] text-white antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
