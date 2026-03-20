import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, defaultLocale } from './translations';

const STORAGE_KEY = 'ai-resume-locale';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || defaultLocale;
    } catch {
      return defaultLocale;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {}
  }, [locale]);

  const setLocale = useCallback((next) => {
    setLocaleState((prev) => (typeof next === 'function' ? next(prev) : next));
  }, []);

  const t = useCallback(
    (key) => {
      const dict = translations[locale] || translations[defaultLocale];
      return dict[key] ?? translations[defaultLocale][key] ?? key;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
}
