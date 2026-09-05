import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mutate } from 'swr';
import { api } from '../lib/api';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string;
}

export interface TokenResponse {
  access_token?: string | null;
  token_type: string;
  user_id: string;
  email: string;
  email_confirmed?: boolean;
  message?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<TokenResponse>;
  resendConfirmation: (email: string) => Promise<void>;
  setAuthToken: (token: string) => Promise<void>;
  loginDemoUser: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await api.get<UserProfile>('/profiles/me');
      setUser(profile);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      // Clear token if invalid or expired
      localStorage.removeItem('hangout_token');
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let initialToken: string | null = null;
    if (typeof window !== 'undefined') {
      initialToken = localStorage.getItem('hangout_token');

      // Check if user arrived via email confirmation or OAuth link (#access_token=...)
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const hashToken = params.get('access_token');
        if (hashToken) {
          initialToken = hashToken;
          localStorage.setItem('hangout_token', hashToken);
          // Strip token from browser URL bar cleanly
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }

    if (initialToken) {
      setToken(initialToken);
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  // Synchronize authentication state across multiple browser tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hangout_token') {
        if (e.newValue) {
          // Another tab confirmed email or logged in
          setToken(e.newValue);
          fetchProfile();
        } else {
          // Another tab logged out
          setToken(null);
          setUser(null);
          mutate(() => true, undefined, { revalidate: false });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchProfile]);

  const setAuthToken = useCallback(async (newToken: string) => {
    localStorage.setItem('hangout_token', newToken);
    setToken(newToken);
    await fetchProfile();
  }, [fetchProfile]);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const res = await api.post<TokenResponse>('/auth/login', {
      username_or_email: usernameOrEmail,
      password,
    });
    if (res.access_token) {
      localStorage.setItem('hangout_token', res.access_token);
      setToken(res.access_token);
      await fetchProfile();
    }
  }, [fetchProfile]);

  const signup = useCallback(async (username: string, email: string, password: string): Promise<TokenResponse> => {
    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
    const res = await api.post<TokenResponse>('/auth/signup', {
      username,
      email,
      password,
      redirect_url: redirectUrl,
    });
    if (res.access_token) {
      localStorage.setItem('hangout_token', res.access_token);
      setToken(res.access_token);
      await fetchProfile();
    }
    return res;
  }, [fetchProfile]);

  const resendConfirmation = useCallback(async (email: string) => {
    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
    await api.post('/auth/resend-confirmation', { email, redirect_url: redirectUrl });
  }, []);

  const loginDemoUser = useCallback(async () => {
    try {
      await login('mika@example.com', 'demo123456');
    } catch {
      await signup('Mika', 'mika@example.com', 'demo123456');
    }
  }, [login, signup]);

  const logout = useCallback(() => {
    localStorage.removeItem('hangout_token');
    setToken(null);
    setUser(null);
    mutate(() => true, undefined, { revalidate: false });
  }, []);

  const refreshUser = useCallback(async () => {
    if (localStorage.getItem('hangout_token')) {
      await fetchProfile();
    }
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, resendConfirmation, setAuthToken, loginDemoUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
