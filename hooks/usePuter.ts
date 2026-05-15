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
    } catch {
      throw new Error('Sign-in failed. Please try again.');
    }
  }, [checkAuth]);

  const signOut = useCallback(async () => {
    try {
      await window.puter.auth.signOut();
      setAuthState('signed-out');
      setUsername(null);
    } catch {
      throw new Error('Sign-out failed.');
    }
  }, []);

  return { authState, username, signIn, signOut };
}
