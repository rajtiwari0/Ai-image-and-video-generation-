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

export default DEFAULT_MODEL;
