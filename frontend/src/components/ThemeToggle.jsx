import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';

/**
 * @param {'default' | 'menu'} [variant] menu = full-width row for profile dropdown
 */
export default function ThemeToggle({ className = '', variant = 'default' }) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const isMenu = variant === 'menu';

  const cycle = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const label =
    theme === 'system' ? t('themeAuto') : theme === 'light' ? t('themeLight') : t('themeDark');

  return (
    <button
      type="button"
      onClick={cycle}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl border border-edge bg-surface px-2.5 py-1.5
        text-sm font-medium text-ink-muted shadow-card transition
        hover:bg-surface-2 hover:text-ink
        dark:border-edge dark:bg-surface-2 dark:hover:bg-surface-3
        ${isMenu ? 'w-full justify-start rounded-lg border-0 bg-transparent px-3 py-2.5 shadow-none hover:bg-surface-2 dark:bg-transparent dark:hover:bg-surface-2' : ''}
        ${className}
      `}
      title={`${t('themeMenu')}: ${label}`}
      aria-label={`${t('themeMenu')}: ${label}`}
    >
      {theme === 'system' && (
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      )}
      {theme === 'light' && (
        <svg className="h-4 w-4 shrink-0 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
      {theme === 'dark' && (
        <svg className="h-4 w-4 shrink-0 text-voice" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
      <span className={`text-xs uppercase tracking-wide ${isMenu ? '' : 'hidden sm:inline'}`}>{label}</span>
    </button>
  );
}
