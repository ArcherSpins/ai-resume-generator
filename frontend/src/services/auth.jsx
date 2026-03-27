import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAuthToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const data = await api.getUser();
    setUser(data);
    return data;
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const tokenFromUrl = url.searchParams.get('token');
    if (tokenFromUrl) {
      setAuthToken(tokenFromUrl);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
    }
    refreshUser()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const login = () => {
    const base = import.meta.env.VITE_API_URL || '';
    window.location.href = base ? `${base}/auth/google` : '/auth/google';
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setAuthToken(null);
      setUser(null);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
