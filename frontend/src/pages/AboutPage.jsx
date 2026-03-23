import { useTranslation } from '../i18n/LanguageContext';
import myAvatar from '../assets/me.jpg';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink">{t('aboutMe')}</h1>
        <p className="mt-1 text-ink-muted text-sm sm:text-base">{t('aboutSubtitle')}</p>
      </div>

      <section className="rounded-2xl border border-edge bg-surface shadow-card overflow-hidden">
        <div className="bg-about-hero h-24 sm:h-28" />
        <div className="px-4 sm:px-6 pb-6 -mt-12 sm:-mt-14">
          <img
            src={myAvatar}
            alt={t('aboutAvatarAlt')}
            className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-surface object-cover shadow-xl"
          />
          <h2 className="mt-4 text-lg sm:text-2xl font-bold text-ink">Ahmed Kambaev</h2>
          <p className="text-voice font-medium text-sm sm:text-base">{t('aboutRole')}</p>
          <p className="mt-3 text-ink-muted leading-relaxed text-sm sm:text-base">{t('aboutBio')}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <article className="rounded-xl border border-edge bg-surface p-4 sm:p-5 shadow-card">
          <h3 className="font-semibold text-ink">{t('aboutStackTitle')}</h3>
          <p className="mt-2 text-sm sm:text-base text-ink-muted">{t('aboutStackText')}</p>
        </article>
        <article className="rounded-xl border border-edge bg-surface p-4 sm:p-5 shadow-card">
          <h3 className="font-semibold text-ink">{t('aboutProjectStackTitle')}</h3>
          <p className="mt-2 text-sm sm:text-base text-ink-muted leading-relaxed">{t('aboutProjectStackText')}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <article className="rounded-xl border border-edge bg-surface p-4 sm:p-5 shadow-card">
          <h3 className="font-semibold text-ink">{t('aboutFocusTitle')}</h3>
          <p className="mt-2 text-sm sm:text-base text-ink-muted">{t('aboutFocusText')}</p>
        </article>
      </section>

      <section className="rounded-xl border border-edge bg-surface p-4 sm:p-5 shadow-card">
        <h3 className="font-semibold text-ink">{t('aboutContactsTitle')}</h3>
        <div className="mt-3 space-y-2 text-sm sm:text-base">
          <p className="text-ink-muted">
            {t('aboutPhone')}: <a className="text-primary hover:underline" href="tel:+8165702520">+8165702520</a>
          </p>
          <p className="text-ink-muted">
            {t('aboutEmail')}: <a className="text-primary hover:underline" href="mailto:kambaevahmed@gmail.com">kambaevahmed@gmail.com</a>
          </p>
          <p className="text-ink-muted">
            {t('aboutTelegram')}: <a className="text-primary hover:underline" href="https://t.me/misapandasma" target="_blank" rel="noreferrer">t.me/misapandasma</a>
          </p>
        </div>
      </section>
    </div>
  );
}
