import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const pageMap = {
  '/privacy': {
    titleKey: 'privacyTitle',
    bodyKeys: ['privacyBody1', 'privacyBody2', 'privacyBody3'],
  },
  '/terms': {
    titleKey: 'termsTitle',
    bodyKeys: ['termsBody1', 'termsBody2', 'termsBody3'],
  },
  '/refund': {
    titleKey: 'refundTitle',
    bodyKeys: ['refundBody1', 'refundBody2', 'refundBody3'],
  },
  '/contact': {
    titleKey: 'contactTitle',
    bodyKeys: ['contactBody1', 'contactBody2', 'contactBody3'],
  },
};

export default function PublicInfoPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const page = pageMap[location.pathname] || pageMap['/privacy'];

  return (
    <div className="min-h-screen bg-auth-hero px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15 transition"
          >
            ← {t('legalBackHome')}
          </Link>
          <LanguageSwitcher variant="onDark" />
        </div>

        <section className="rounded-2xl border border-white/15 bg-white/10 p-5 sm:p-7 shadow-xl backdrop-blur text-white">
          <h1 className="text-xl sm:text-2xl font-bold">{t(page.titleKey)}</h1>
          <div className="mt-4 space-y-3 text-sm sm:text-base text-white/85 leading-relaxed">
            {page.bodyKeys.map((k) => (
              <p key={k}>{t(k)}</p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
