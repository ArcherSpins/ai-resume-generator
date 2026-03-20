import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { useTranslation } from '../i18n/LanguageContext';
import { localeNames } from '../i18n/translations';
import LanguageSwitcher from './LanguageSwitcher';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinkClass = ({ isActive }) =>
    `block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
      isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex h-14 items-center justify-between">
            <NavLink
              to="/dashboard"
              className="flex items-center gap-2 font-semibold text-slate-900"
              onClick={() => setMenuOpen(false)}
            >
              <span className="text-lg">📄</span>
              <span className="hidden sm:inline">{t('appName')}</span>
            </NavLink>

            {/* Desktop: nav + user */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard/create" className={navLinkClass}>
                {t('createResume')}
              </NavLink>
              <NavLink to="/dashboard/history" className={navLinkClass}>
                {t('history')}
              </NavLink>
              <NavLink to="/dashboard/about" className={navLinkClass}>
                {t('aboutMe')}
              </NavLink>
            </nav>
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher />
              <span className="text-sm text-slate-500 truncate max-w-[160px]">{user?.email}</span>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
              >
                {t('logout')}
              </button>
            </div>

            {/* Mobile: hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="md:hidden rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 transition-colors"
              aria-expanded={menuOpen}
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer: backdrop + sliding panel */}
      <div
        className="md:hidden fixed inset-0 z-40"
        style={{ pointerEvents: menuOpen ? 'auto' : 'none' }}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          className={`fixed top-0 right-0 bottom-0 z-50 w-[min(20rem,88vw)] max-w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col transition-[transform] duration-300 ease-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          role="dialog"
          aria-label="Menu"
        >
          <div className="flex items-center justify-between h-14 px-4 border-b border-slate-100 shrink-0">
            <span className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="text-xl">📄</span>
              {t('appName')}
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 overflow-auto p-4 space-y-1">
            <NavLink
              to="/dashboard/create"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              {t('createResume')}
            </NavLink>
            <NavLink
              to="/dashboard/history"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              {t('history')}
            </NavLink>
            <NavLink
              to="/dashboard/about"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              {t('aboutMe')}
            </NavLink>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <p className="px-4 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">{t('language')}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(localeNames).map(([code, name]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLocale(code)}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${locale === code ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
              <p className="px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">{t('account')}</p>
              <p className="px-4 text-sm text-slate-600 truncate" title={user?.email}>{user?.email}</p>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          </nav>
        </aside>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8 pb-24">
        <Outlet />
      </main>
      <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
        <div className="mx-auto max-w-4xl px-4 pb-2 sm:pb-3">
          <div className="pointer-events-auto rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 px-3 py-2 text-xs sm:text-sm font-semibold text-center shadow-lg">
            {t('betaProjectNotice')}
          </div>
        </div>
      </div>
    </div>
  );
}
