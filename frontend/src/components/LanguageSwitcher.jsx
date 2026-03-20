import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { localeNames } from '../i18n/translations';

export default function LanguageSwitcher({ className = '', variant = 'light' }) {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const isDark = variant === 'dark';

  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [open]);

  const buttonStyles = isDark
    ? 'bg-white/10 border-white/20 text-white hover:bg-white/15'
    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
  const listStyles = isDark
    ? 'bg-slate-800/95 border-white/10 shadow-xl'
    : 'bg-white border-slate-200 shadow-lg';
  const itemStyles = isDark
    ? 'text-slate-200 hover:bg-white/10'
    : 'text-slate-700 hover:bg-slate-50';
  const itemActiveStyles = isDark ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-900';

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`
          flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium
          transition-colors outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-0
          ${buttonStyles}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
      >
        <span>{localeNames[locale] ?? locale}</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          className={`
            absolute right-0 top-full z-50 mt-1.5 min-w-[10rem] rounded-xl border py-1
            ${listStyles}
          `}
          role="listbox"
        >
          {Object.entries(localeNames).map(([code, name]) => (
            <li key={code} role="option" aria-selected={locale === code}>
              <button
                type="button"
                onClick={() => {
                  setLocale(code);
                  setOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm font-medium transition-colors
                  first:rounded-t-[10px] last:rounded-b-[10px]
                  ${itemStyles}
                  ${locale === code ? itemActiveStyles : ''}
                `}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
