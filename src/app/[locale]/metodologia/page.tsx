import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ScrollText, Calendar, Tag, Hammer, TrendingUp, ArrowRight, ShieldCheck } from '@/lib/icons';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metodologiaPage' });
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    openGraph: {
      type: 'article',
      title,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: {
      canonical: `/${locale}/metodologia`,
      languages: {
        es: '/es/metodologia',
        en: '/en/metodologia',
        'x-default': '/es/metodologia',
      },
    },
  };
}

const CRITERION_ICONS = [ScrollText, Calendar, Tag, Hammer, TrendingUp] as const;

export default async function MetodologiaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'metodologiaPage' });

  const criteria = [
    { num: '01', heading: t('criterion1Heading'), body: t('criterion1Body') },
    { num: '02', heading: t('criterion2Heading'), body: t('criterion2Body') },
    { num: '03', heading: t('criterion3Heading'), body: t('criterion3Body') },
    { num: '04', heading: t('criterion4Heading'), body: t('criterion4Body') },
    { num: '05', heading: t('criterion5Heading'), body: t('criterion5Body') },
  ];

  return (
    <>
      <Breadcrumbs
        locale={locale}
        homeLabel={t('breadcrumbHome')}
        ariaLabel="Breadcrumb"
        items={[{ label: t('breadcrumbCurrent') }]}
      />

      {/* Hero */}
      <section className="bg-white pt-6 pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <span className="inline-block text-[var(--propyte-dark-700)] text-xs font-bold tracking-widest uppercase mb-4">
            {t('heroEyebrow')}
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--propyte-dark-900)] leading-tight mb-5">
            {t('heroTitle')}
          </h1>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed">
            {t('heroLead')}
          </p>
        </div>
      </section>

      {/* Section 1: los 5 criterios */}
      <section className="bg-[#F4F6F8] py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="max-w-3xl mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-4">
              {t('section1Title')}
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              {t('section1Lead')}
            </p>
          </div>

          <div className="space-y-5">
            {criteria.map((c, i) => {
              const Icon = CRITERION_ICONS[i];
              return (
                <div
                  key={c.num}
                  className="propyte-card-glass-light p-6 md:p-8 flex flex-col md:flex-row gap-5 md:gap-8"
                >
                  <div className="flex md:flex-col items-center md:items-start gap-3 md:min-w-[80px]">
                    <span className="text-[#0E7490] text-xs font-bold tracking-widest">
                      {c.num}
                    </span>
                    <div className="w-12 h-12 bg-[#A2F9FF]/20 rounded-xl flex items-center justify-center">
                      <Icon size={24} strokeWidth={1.75} className="text-[#0E7490]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-[#1A2F3F] mb-2">
                      {c.heading}
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      {c.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 2: qué pasa si falla */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-4">
            {t('section2Title')}
          </h2>
          <p className="text-base text-gray-700 leading-relaxed">
            {t('section2Body')}
          </p>
        </div>
      </section>

      {/* Section 3: quién firma */}
      <section className="bg-[#0B1C1E] py-16 md:py-20 relative overflow-hidden">
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-96 h-96 bg-[#A2F9FF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 md:px-6">
          <div className="w-12 h-12 mb-6 bg-[#A2F9FF]/20 rounded-xl flex items-center justify-center">
            <ShieldCheck size={24} strokeWidth={1.75} className="text-[#A2F9FF]" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t('section3Title')}
          </h2>
          <p className="text-base text-white/80 leading-relaxed">
            {t('section3Body')}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-2xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-base text-gray-700 leading-relaxed mb-8">
            {t('ctaBody')}
          </p>
          <Link
            href={`/${locale}/contacto`}
            className="inline-flex items-center gap-2 min-h-[44px] px-7 bg-[#1A2F3F] hover:bg-[#0F1923] text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {t('ctaButton')}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
