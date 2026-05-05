import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  Shield,
  BarChart3,
  Headphones,
  Zap,
  Award,
  Globe,
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

  const features = [
    { icon: BarChart3, title: t('feature1Title'), desc: t('feature1Desc') },
    { icon: Shield, title: t('feature2Title'), desc: t('feature2Desc') },
    { icon: Zap, title: t('feature3Title'), desc: t('feature3Desc') },
    { icon: Headphones, title: t('feature4Title'), desc: t('feature4Desc') },
    { icon: Award, title: t('feature5Title'), desc: t('feature5Desc') },
    { icon: Globe, title: t('feature6Title'), desc: t('feature6Desc') },
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
                className="p-6 md:p-8 bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 mb-4 bg-[#1A2F3F]/10 rounded-lg flex items-center justify-center">
                  <Icon size={24} strokeWidth={1.75} className="text-[#1A2F3F]" />
                </div>
                <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">{t(aud.titleKey)}</h3>
                <p className="text-gray-600 mb-4">{t(aud.descKey)}</p>
                <Link
                  href={aud.href}
                  className="inline-flex items-center gap-1.5 text-[#0F766E] font-medium hover:underline"
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
                className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="w-12 h-12 bg-[#5CE0D2]/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={24} strokeWidth={1.75} className="text-[#0F766E]" />
                </div>
                <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
