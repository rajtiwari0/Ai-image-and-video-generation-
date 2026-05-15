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
