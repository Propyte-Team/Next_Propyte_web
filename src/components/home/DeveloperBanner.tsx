import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function DeveloperBanner() {
  const t = useTranslations('developerBanner');
  const locale = useLocale();

  return (
    <section className="bg-gradient-to-r from-[#1A2F3F] to-[#1A3550] py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6">{t('title')}</h2>
        <Link
          href={`/${locale}/desarrolladores`}
          className="inline-flex items-center h-12 px-8 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-semibold rounded-lg transition-colors"
        >
          {t('cta')}
        </Link>
      </div>
    </section>
  );
}
