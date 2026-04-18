import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function MarketData() {
  const t = useTranslations('marketData');
  const locale = useLocale();

  const stats = [
    { value: t('stat1Value'), label: t('stat1Label'), source: t('stat1Source') },
    { value: t('stat2Value'), label: t('stat2Label'), source: t('stat2Source') },
    { value: t('stat3Value'), label: t('stat3Label'), source: t('stat3Source') },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-center text-[#2C2C2C] mb-12">{t('title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="p-6 bg-white border border-[#1A2F3F]/15 rounded-xl text-center">
              <div className="text-4xl font-bold text-[#1A2F3F] mb-2">{stat.value}</div>
              <p className="text-[#2C2C2C] font-medium mb-2">{stat.label}</p>
              <p className="text-xs text-gray-400">{stat.source}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="#" className="text-[#5CE0D2] font-medium hover:underline">
            {t('cta')} →
          </Link>
        </div>
      </div>
    </section>
  );
}
