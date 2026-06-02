import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight, Languages, Laptop, Users } from '@/lib/icons';

export default function NosotrosTeaser() {
  const t = useTranslations('nosotrosTeaser');
  const locale = useLocale();

  // Icono acorde a cada badge: equipo/trayectoria (Users), metodología PropTech
  // (Laptop) y bilingüe (Languages). Antes estaban cruzados (Clock/Languages/Shield).
  const stats = [
    { icon: Users, label: t('stat1') },
    { icon: Laptop, label: t('stat2') },
    { icon: Languages, label: t('stat3') },
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left: copy */}
          <div className="lg:col-span-7">
            <span className="inline-block text-[#0E7490] text-xs font-bold tracking-widest uppercase mb-4">
              {t('eyebrow')}
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A2F3F] leading-snug mb-5">
              {t('title')}
            </h2>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4 max-w-xl">
              {t('paragraph1')}
            </p>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-8 max-w-xl">
              {t('paragraph2')}
            </p>
            <Link
              href={`/${locale}/nosotros/equipo-comercial`}
              className="inline-flex items-center gap-2 min-h-[44px] px-6 bg-[#1A2F3F] hover:bg-[#0F1923] text-white font-semibold rounded-lg transition-colors text-sm"
            >
              {t('cta')}
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Right: stats verticales */}
          <div className="lg:col-span-5 lg:pl-10 lg:border-l lg:border-[#1A2F3F]/10 flex flex-col gap-5">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="propyte-card-glass-light p-5 flex items-center gap-4"
                >
                  <div className="w-11 h-11 shrink-0 bg-[#A2F9FF]/20 rounded-lg flex items-center justify-center">
                    <Icon size={22} strokeWidth={1.75} className="text-[#0E7490]" />
                  </div>
                  <p className="text-sm md:text-base font-semibold text-[#1A2F3F] leading-snug">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
