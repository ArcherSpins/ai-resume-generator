import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { useTranslation } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AuthPage() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error === 'auth') {
      // Could show toast
    }
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-auth-hero px-4 py-8 sm:py-12 safe-area-pb">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <LanguageSwitcher variant="onDark" />
      </div>

      <div className="w-full max-w-3xl rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-6 shadow-xl backdrop-blur">
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-4 sm:gap-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="inline-flex rounded-full bg-primary-soft/80 px-3 py-1 text-xs font-semibold text-primary">
              {t('authHeroBadge')}
            </p>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-white tracking-tight">{t('appName')}</h1>
            <p className="mt-2 text-white/75 text-sm sm:text-base">{t('authHeroDescription')}</p>
            <div className="mt-4 space-y-2 text-sm text-white/85">
              <p>• {t('authFeatureTemplates')}</p>
              <p>• {t('authFeatureVoice')}</p>
              <p>• {t('authFeatureExport')}</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg sm:text-xl font-semibold text-white">{t('authSignInTitle')}</h2>
              <p className="mt-1 text-white/65 text-sm">{t('signInSubtitle')}</p>
            </div>
            {error === 'auth' && (
              <p className="mb-4 text-warning text-sm">{t('signInFailed')}</p>
            )}
            <button
              type="button"
              onClick={login}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-zinc-900 font-medium py-3 px-4 hover:bg-zinc-100 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('continueWithGoogle')}
            </button>
            <p className="mt-3 text-xs text-white/60">{t('authSignInHint')}</p>
          </div>
        </div>
        <div className="mt-5 border-t border-white/10 pt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/70">
          <Link to="/privacy" className="hover:text-white transition">{t('legalPrivacy')}</Link>
          <Link to="/terms" className="hover:text-white transition">{t('legalTerms')}</Link>
          <Link to="/refund" className="hover:text-white transition">{t('legalRefund')}</Link>
          <Link to="/contact" className="hover:text-white transition">{t('legalContact')}</Link>
        </div>
      </div>
    </div>
  );
}
