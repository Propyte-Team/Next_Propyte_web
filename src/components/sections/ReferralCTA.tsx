import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight } from 'lucide-react';

export default function ReferralCTA() {
  const t = useTranslations('referralCta');
  const locale = useLocale();

  return (
    <section className="py-10 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="bg-white rounded-xl p-6 md:p-8 border-l-4 border-[#5CE0D2] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#2C2C2C] mb-1">
              {t('title')}
            </h3>
            <p className="text-sm text-gray-500">{t('subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/corredores`}
            className="inline-flex items-center gap-2 h-11 px-6 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold text-sm rounded-lg transition-colors whitespace-nowrap"
          >
            {t('cta')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
