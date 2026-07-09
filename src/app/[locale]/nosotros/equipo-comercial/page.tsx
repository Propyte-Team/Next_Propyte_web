import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Home, MessageCircle } from '@/lib/icons';
import NosotrosTabs from '../_components/NosotrosTabs';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getTeamMembers } from '@/lib/supabase/queries';
import EquipoBios from './_components/EquipoBios';
import { getVisibility, isVisible, VISIBILITY_KEYS } from '@/lib/visibility';
import { getSiteConfig } from '@/lib/hub-content';
import { resolveSiteContact } from '@/lib/site-contact';

export const revalidate = 600; // 10 min ISR; on-demand revalidate desde Hub al editar miembros

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'equipoPage' });
  const tBC = await getTranslations({ locale, namespace: 'breadcrumbs' });
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
      images: [`/${locale}/nosotros/equipo-comercial/opengraph-image`],
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: {
      canonical: `/${locale}/nosotros/equipo-comercial`,
      languages: {
        es: '/es/nosotros/equipo-comercial',
        en: '/en/nosotros/equipo-comercial',
        'x-default': '/es/nosotros/equipo-comercial',
      },
    },
    other: { 'breadcrumb-about': tBC('about') },
  };
}

export default async function EquipoComercialPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const visibility = await getVisibility();
  if (!isVisible(visibility, VISIBILITY_KEYS.NOSOTROS_EQUIPO_COMERCIAL)) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: 'equipoPage' });
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  const supabase = createPublicSupabaseClient();
  const [teamMembers, siteConfig] = await Promise.all([
    supabase ? getTeamMembers(supabase) : Promise.resolve([]),
    getSiteConfig(),
  ]);
  const { whatsapp: WA } = resolveSiteContact(siteConfig);
  const WA_TEXT = encodeURIComponent(t('waText'));

  return (
    <>
      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[
          { label: tBC('about'), href: `/${locale}/nosotros/quienes-somos` },
          { label: t('breadcrumbCurrent') },
        ]}
      />

      {/* HERO — dark canvas editorial Propyte, mismo lenguaje que quienes-somos:
          eyebrow con dot + H1 con última palabra en brand cyan + lead.
          Watermark Home icon + coordenadas mantienen el carácter editorial. */}
      <section className="propyte-hero-canvas relative min-h-[60vh] flex items-center">
        <Home
          size={520}
          strokeWidth={0.5}
          aria-hidden="true"
          className="absolute -right-32 -bottom-40 text-white/[0.025] pointer-events-none select-none hidden md:block"
        />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 py-24 md:py-32 w-full">
          <div className="max-w-3xl">
            <span
              className="propyte-hero-eyebrow propyte-hero-rise"
              style={{ animationDelay: '60ms' }}
            >
              <span className="propyte-hero-eyebrow__dot" aria-hidden="true" />
              {t('heroEyebrow')}
            </span>

            <h1
              className="mt-7 text-[clamp(2.5rem,6vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.025em] text-white propyte-hero-rise"
              style={{ animationDelay: '160ms' }}
            >
              {t('heroTitle').split(' ').map((word, i, arr) => {
                const isLast = i === arr.length - 1;
                return (
                  <span key={i}>
                    {isLast ? (
                      <span className="text-propyte-brand">{word}</span>
                    ) : (
                      word
                    )}
                    {!isLast && ' '}
                  </span>
                );
              })}
            </h1>

            <p
              className="mt-7 max-w-2xl text-lg md:text-xl text-white/65 leading-relaxed propyte-hero-rise"
              style={{ animationDelay: '260ms' }}
            >
              {t('heroLead')}
            </p>
          </div>

          <div className="hidden md:flex absolute bottom-8 left-4 md:left-6 items-center gap-3 opacity-70">
            <span className="block w-6 h-px bg-propyte-brand" aria-hidden="true" />
            <span className="accent-mono text-2xs uppercase tracking-[0.18em] text-white/65">
              20.62°N · 87.07°W
            </span>
          </div>
        </div>
      </section>

      <NosotrosTabs locale={locale} active="equipo-comercial" visibility={visibility} />

      {/* Section 1: cómo trabajamos — proceso consultivo en 3 puntos */}
      <section className="bg-[#F4F6F8] py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <span className="text-[#0E7490] text-sm font-bold tracking-widest uppercase">
            {t('section1Eyebrow')}
          </span>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-8">
            {t('section1Title')}
          </h2>
          <div className="space-y-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border-l-2 border-propyte-brand/60 pl-5">
                <h3 className="font-bold text-[#1A2F3F]">{t(`section1Point${n}Title`)}</h3>
                <p className="mt-1 text-base text-gray-700 leading-relaxed">
                  {t(`section1Point${n}Body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: bios — grid Hub-driven con fallback honesto */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-3 text-center">
            {t('section2Title')}
          </h2>
          <p className="text-base text-gray-600 leading-relaxed text-center max-w-2xl mx-auto mb-10">
            {t('section2Sub')}
          </p>

          <EquipoBios teamMembers={teamMembers} />
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/contacto`}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-7 bg-[#A2F9FF] hover:bg-[#81EAF1] text-[#0B1C1E] font-bold rounded-lg transition-colors text-sm"
            >
              {t('ctaButton')}
              <ArrowRight size={16} />
            </Link>
            <a
              href={`https://wa.me/${WA}?text=${WA_TEXT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-7 border border-white/25 text-white hover:bg-white/10 font-bold rounded-lg transition-colors text-sm"
            >
              <MessageCircle size={16} />
              {t('ctaButtonSecondary')}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
