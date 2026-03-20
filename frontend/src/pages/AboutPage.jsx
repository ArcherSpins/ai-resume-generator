import { useTranslation } from '../i18n/LanguageContext';
import myAvatar from '../assets/me.jpg';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t('aboutMe')}</h1>
        <p className="mt-1 text-slate-500 text-sm sm:text-base">{t('aboutSubtitle')}</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 h-24 sm:h-28" />
        <div className="px-4 sm:px-6 pb-6 -mt-12 sm:-mt-14">
          <img
            src={myAvatar}
            alt={t('aboutAvatarAlt')}
            className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-white object-cover shadow-xl"
          />
          <h2 className="mt-4 text-lg sm:text-2xl font-bold text-slate-900">Ahmed Kambaev</h2>
          <p className="text-violet-700 font-medium text-sm sm:text-base">{t('aboutRole')}</p>
          <p className="mt-3 text-slate-600 leading-relaxed text-sm sm:text-base">{t('aboutBio')}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">{t('aboutStackTitle')}</h3>
          <p className="mt-2 text-sm sm:text-base text-slate-600">{t('aboutStackText')}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">{t('aboutFocusTitle')}</h3>
          <p className="mt-2 text-sm sm:text-base text-slate-600">{t('aboutFocusText')}</p>
        </article>
      </section>
    </div>
  );
}
