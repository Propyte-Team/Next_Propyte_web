import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { MapPin, Clock, ArrowRight } from '@/lib/icons';

export default function DondeEstamos() {
  const t = useTranslations('dondeEstamos');
  const locale = useLocale();

  const zones = [
    t('zone1'),
    t('zone2'),
    t('zone3'),
    t('zone4'),
    t('zone5'),
  ];

  return (
    <section className="py-20 md:py-28 bg-gray-light">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="inline-block text-teal-a11y text-xs font-bold tracking-widest uppercase mb-4">
            {t('eyebrow')}
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-navy leading-snug mb-5">
            {t('title')}
          </h2>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Real Estate Lab card */}
          <div className="propyte-card-glass-light p-8 md:p-10 flex flex-col">
            <div className="w-12 h-12 mb-5 bg-propyte-brand/20 rounded-xl flex items-center justify-center">
              <MapPin size={24} strokeWidth={1.75} className="text-teal-a11y" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-navy mb-3">
              {t('labTitle')}
            </h3>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              {t('labAddress')}
            </p>
            <p className="text-sm text-gray-600 mb-6 flex items-center gap-2">
              <Clock size={14} strokeWidth={1.75} className="text-teal-a11y" />
              {t('labHours')}
            </p>
            <div className="mt-auto">
              <Link
                href={`/${locale}/contacto`}
                className="inline-flex items-center gap-2 min-h-[44px] px-6 bg-navy hover:bg-aztec text-white font-semibold rounded-lg transition-colors text-sm"
              >
                {t('labCta')}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Zones card */}
          <div className="propyte-card-glass-light p-8 md:p-10">
            <h3 className="text-xl md:text-2xl font-bold text-navy mb-6">
              {t('zonesTitle')}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {zones.map((zone) => (
                <li key={zone}>
                  <Link
                    href={`/${locale}/propiedades?city=${encodeURIComponent(zone)}`}
                    className="flex items-center gap-2 min-h-[44px] px-4 rounded-lg bg-white/60 hover:bg-white border border-navy/10 hover:border-propyte-brand transition-all text-sm font-medium text-navy group"
                  >
                    <MapPin size={14} strokeWidth={1.75} className="text-teal-a11y" />
                    <span className="flex-1">{zone}</span>
                    <ArrowRight
                      size={14}
                      className="text-teal-a11y opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
