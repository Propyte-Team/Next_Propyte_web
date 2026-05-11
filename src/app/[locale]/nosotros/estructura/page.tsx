import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import EstructuraPageContent from './EstructuraPageContent';
import NosotrosTabs from '../_components/NosotrosTabs';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getOrgStructure, getPageContent } from '@/lib/supabase/queries';
import { getVisibility, isVisible, VISIBILITY_KEYS } from '@/lib/visibility';
import { getCompanyStats, localizedStatLabel } from '@/lib/hub-content';

export const revalidate = 600; // 10 min ISR; on-demand revalidate from Hub

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tSeo = await getTranslations({ locale, namespace: 'seo' });
  const tAbout = await getTranslations({ locale, namespace: 'about' });

  const supabase = createPublicSupabaseClient();
  const content = supabase ? await getPageContent(supabase, 'nosotros/estructura', locale) : {};
  const heroTitle = content['hero.title'] ?? tAbout('structureTitle');

  const title = heroTitle + ' — Propyte';
  const description = tSeo('aboutDescription');

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: {
      canonical: `/${locale}/nosotros/estructura`,
      languages: {
        es: '/es/nosotros/estructura',
        en: '/en/nosotros/estructura',
        'x-default': '/es/nosotros/estructura',
      },
    },
  };
}

export default async function EstructuraPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const visibility = await getVisibility();
  if (!isVisible(visibility, VISIBILITY_KEYS.NOSOTROS_ESTRUCTURA)) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: 'about' });
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  const supabase = createPublicSupabaseClient();
  const [nodes, content, hubStats] = supabase
    ? await Promise.all([
        getOrgStructure(supabase),
        getPageContent(supabase, 'nosotros/estructura', locale),
        getCompanyStats('estructura'),
      ])
    : [[], {} as Record<string, string>, []];

  const heroTitle = content['hero.title'] ?? t('structureTitle');
  const heroSubtitle = content['hero.subtitle'] ?? t('structureSubtitle');

  // Hub override: si trae al menos 1 stat, sustituye TODOS los slots (no mezcla
  // hardcoded con hub para evitar inconsistencia). Si no, fallback a i18n.
  const statValues = hubStats.length > 0
    ? hubStats.slice(0, 4).map((s) => s.value)
    : [t('stat1Value'), t('stat2Value'), t('stat3Value'), t('stat4Value')];
  const statLabels = hubStats.length > 0
    ? hubStats.slice(0, 4).map((s) => localizedStatLabel(s, locale))
    : [t('stat1Label'), t('stat2Label'), t('stat3Label'), t('stat4Label')];

  const fallback = {
    philosophyTitle: t('structurePhilosophyTitle'),
    philosophyText: t('structurePhilosophyText'),
    philosophyHighlight: t('structurePhilosophyHighlight'),
    statValues,
    statLabels,
  };

  return (
    <>
      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[
          { label: tBC('about'), href: `/${locale}/nosotros/quienes-somos` },
          { label: tBC('aboutStructure') },
        ]}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#5CE0D2]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#5CE0D2]/5 rounded-full blur-3xl" />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#5CE0D2]/15 rounded-full mb-6">
            <Sparkles size={14} strokeWidth={2} className="text-[#5CE0D2]" />
            <span className="text-[#5CE0D2] text-sm font-semibold tracking-wide uppercase">
              {t('label')}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-white/75 max-w-3xl mx-auto leading-relaxed">
            {heroSubtitle}
          </p>
        </div>
      </section>

      <NosotrosTabs locale={locale} active="estructura" visibility={visibility} />

      <EstructuraPageContent nodes={nodes} content={content} fallback={fallback} />
    </>
  );
}
