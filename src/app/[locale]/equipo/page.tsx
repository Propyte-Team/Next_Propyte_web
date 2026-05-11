import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Users } from 'lucide-react';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'equipoPage' });
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: {
      canonical: `/${locale}/equipo`,
      languages: {
        es: '/es/equipo',
        en: '/en/equipo',
        'x-default': '/es/equipo',
      },
    },
  };
}

export default async function EquipoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'equipoPage' });

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
          <span className="inline-block text-[#0F766E] text-xs font-bold tracking-widest uppercase mb-4">
            {t('heroEyebrow')}
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A2F3F] leading-tight mb-5">
            {t('heroTitle')}
          </h1>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed">
            {t('heroLead')}
          </p>
        </div>
      </section>

      {/* Section 1: cómo trabajamos */}
      <section className="bg-[#F4F6F8] py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-4">
            {t('section1Title')}
          </h2>
          <p className="text-base text-gray-700 leading-relaxed">
            {t('section1Body')}
          </p>
        </div>
      </section>

      {/* Section 2: bios placeholder honesto */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-8">
            {t('section2Title')}
          </h2>
          <div className="propyte-card-glass-light p-8 md:p-12 text-center border-2 border-dashed border-[#A2F9FF]/40 rounded-2xl">
            <div className="w-14 h-14 mx-auto mb-5 bg-[#A2F9FF]/20 rounded-2xl flex items-center justify-center">
              <Users size={28} strokeWidth={1.5} className="text-[#0D9488]" />
            </div>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-lg mx-auto">
              {t('section2Placeholder')}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0B1C1E] py-16 md:py-20 relative overflow-hidden">
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-96 h-96 bg-[#A2F9FF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-base text-white/80 leading-relaxed mb-8">
            {t('ctaBody')}
          </p>
          <Link
            href={`/${locale}/contacto`}
            className="inline-flex items-center gap-2 min-h-[44px] px-7 bg-[#A2F9FF] hover:bg-[#81EAF1] text-[#0B1C1E] font-bold rounded-lg transition-colors text-sm"
          >
            {t('ctaButton')}
            <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </section>
    </>
  );
}
