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
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
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
    const savedToken = localStorage.getItem('hangout_token');
    if (savedToken) {
      setToken(savedToken);
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const res = await api.post<TokenResponse>('/auth/login', {
      username_or_email: usernameOrEmail,
      password,
    });
    localStorage.setItem('hangout_token', res.access_token);
    setToken(res.access_token);
    await fetchProfile();
  }, [fetchProfile]);

  const signup = useCallback(async (username: string, email: string, password: string) => {
    const res = await api.post<TokenResponse>('/auth/signup', {
      username,
      email,
      password,
    });
    localStorage.setItem('hangout_token', res.access_token);
    setToken(res.access_token);
    await fetchProfile();
  }, [fetchProfile]);

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
    <AuthContext.Provider value={{ user, token, loading, login, signup, loginDemoUser, logout, refreshUser }}>
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
