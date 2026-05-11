import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  Shield,
  BarChart3,
  Headphones,
  TrendingUp,
  Building2,
  Users,
  ArrowRight,
} from 'lucide-react';

export default function WhyPropyte() {
  const t = useTranslations('whyPropyte');
  const locale = useLocale();

  const audience = [
    { icon: TrendingUp, titleKey: 'aud1Title', descKey: 'aud1Desc', ctaKey: 'aud1Cta', href: `/${locale}/desarrollos` },
    { icon: Building2, titleKey: 'aud2Title', descKey: 'aud2Desc', ctaKey: 'aud2Cta', href: `/${locale}/desarrolladores` },
    { icon: Users, titleKey: 'aud3Title', descKey: 'aud3Desc', ctaKey: 'aud3Cta', href: `/${locale}/unete` },
  ];

  // Las rutas /metodologia, /equipo, /aviso-legal-inversion se crean en Bloque B (B4).
  // Los links existen ya para que el cambio de copy sea coherente; rinden 404 hasta B4.
  const features = [
    {
      icon: BarChart3,
      title: t('feature1Title'),
      desc: t('feature1Desc'),
      cta: t('feature1Cta'),
      href: `/${locale}/metodologia`,
    },
    {
      icon: Headphones,
      title: t('feature2Title'),
      desc: t('feature2Desc'),
      cta: t('feature2Cta'),
      href: `/${locale}/equipo`,
    },
    {
      icon: Shield,
      title: t('feature3Title'),
      desc: t('feature3Desc'),
      cta: t('feature3Cta'),
      href: `/${locale}/aviso-legal-inversion`,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        {/* Audience cards */}
        <h2 className="sr-only">{t('audienceHeading')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
          {audience.map((aud) => {
            const Icon = aud.icon;
            return (
              <div
                key={aud.titleKey}
                className="propyte-card-glass-light p-6 md:p-8 transition-transform hover:-translate-y-1"
              >
                <div className="w-12 h-12 mb-4 bg-[#A2F9FF]/20 rounded-lg flex items-center justify-center">
                  <Icon size={24} strokeWidth={1.75} className="text-[#0D9488]" />
                </div>
                <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">{t(aud.titleKey)}</h3>
                <p className="text-gray-600 mb-4">{t(aud.descKey)}</p>
                <Link
                  href={aud.href}
                  className="inline-flex items-center gap-1.5 min-h-[44px] md:min-h-0 text-[#0F766E] font-medium hover:underline"
                >
                  {t(aud.ctaKey)}
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Feature cards heading */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">{t('title')}</h2>
          <p className="text-gray-600 mt-2 max-w-xl mx-auto">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="propyte-card-glass-light p-6 transition-transform hover:-translate-y-0.5 flex flex-col"
              >
                <div className="w-12 h-12 bg-[#A2F9FF]/20 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={24} strokeWidth={1.75} className="text-[#0D9488]" />
                </div>
                <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">{feat.desc}</p>
                <Link
                  href={feat.href}
                  className="inline-flex items-center gap-1.5 text-[#0F766E] font-medium text-sm hover:underline mt-auto"
                >
                  {feat.cta}
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
