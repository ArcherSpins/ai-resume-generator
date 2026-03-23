import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { localeNames } from '../i18n/translations';

/**
 * @param {'auto' | 'onDark'} [variant] auto = follow app theme; onDark = auth hero (always light-on-dark chrome)
 */
export default function LanguageSwitcher({ className = '', variant = 'auto' }) {
  const { locale, setLocale } = useTranslation();
  const { resolved } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const isDarkChrome = variant === 'onDark' || (variant === 'auto' && resolved === 'dark');

  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [open]);

  const buttonStyles = isDarkChrome
    ? 'bg-white/10 border-white/20 text-white hover:bg-white/15'
    : 'bg-surface border-edge text-ink-muted hover:bg-surface-2 hover:text-ink';
  const listStyles = isDarkChrome
    ? 'bg-zinc-900/95 border-white/10 shadow-modal'
    : 'bg-surface border-edge shadow-modal';
  const itemStyles = isDarkChrome
    ? 'text-zinc-200 hover:bg-white/10'
    : 'text-ink-muted hover:bg-surface-2';
  const itemActiveStyles = isDarkChrome ? 'bg-white/15 text-white' : 'bg-surface-2 text-ink';

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`
          flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium
          transition-colors outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-0
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
