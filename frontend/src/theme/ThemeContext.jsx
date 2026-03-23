import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'theme';

/** @typedef {'light' | 'dark' | 'system'} ThemePreference */

const ThemeContext = createContext({
  /** @type {ThemePreference} */
  theme: 'light',
  /** @type {'light' | 'dark'} */
  resolved: 'light',
  setTheme: () => {},
  toggle: () => {},
});

function getSystemDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveTheme(pref) {
  if (pref === 'system' || !pref) return getSystemDark() ? 'dark' : 'light';
  return pref;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return /** @type {ThemePreference} */ (localStorage.getItem(STORAGE_KEY) || 'light');
    } catch {
      return 'light';
    }
  });

  const [resolved, setResolved] = useState(() => resolveTheme(theme));

  useEffect(() => {
    const next = resolveTheme(theme);
    setResolved(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const next = mq.matches ? 'dark' : 'light';
      setResolved(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((t) => {
    setThemeState(t);
  }, []);

  /** Toggle between light and dark (sets explicit preference; use cycle for system restore via UI) */
  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const r = resolveTheme(prev);
      return r === 'dark' ? 'light' : 'dark';
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolved,
      setTheme,
      toggle,
    }),
    [theme, resolved, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
