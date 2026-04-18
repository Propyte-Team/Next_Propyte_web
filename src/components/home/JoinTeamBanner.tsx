import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function JoinTeamBanner() {
  const t = useTranslations('joinTeam');

  return (
    <section className="bg-[#F4F6F8] py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#1A2F3F] mb-6">{t('title')}</h2>
        <Link
          href="#"
          className="inline-flex items-center h-12 px-8 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-semibold rounded-lg transition-colors"
        >
          {t('cta')}
        </Link>
      </div>
    </section>
  );
}
