import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getGlobalStats, getDevelopers, getFeaturedDevelopments } from '@/lib/supabase/queries';
import Hero from '@/components/home/Hero';
import NosotrosTeaser from '@/components/home/NosotrosTeaser';
import FeaturedProperties, { type FeaturedDevelopment } from '@/components/home/FeaturedProperties';
import MetodologiaTeaser from '@/components/home/MetodologiaTeaser';
import ProcessInfographic from '@/components/home/ProcessInfographic';
import HowItWorks from '@/components/home/HowItWorks';
import WhyPropyte from '@/components/home/WhyPropyte';
import TrendingMarket from '@/components/home/TrendingMarket';
import DondeEstamos from '@/components/home/DondeEstamos';
import DeveloperLogos from '@/components/home/DeveloperLogos';
import HomeFAQ from '@/components/home/HomeFAQ';
import DeveloperBanner from '@/components/home/DeveloperBanner';
import JoinTeamBanner from '@/components/home/JoinTeamBanner';
import RecentBlog from '@/components/home/RecentBlog';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import ScrollReveal from '@/components/shared/ScrollReveal';
import { getVisibility, isVisible, VISIBILITY_KEYS } from '@/lib/visibility';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    openGraph: {
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        es: '/es',
        en: '/en',
        'x-default': '/es',
      },
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  // Stats reales sin pisos inventados (Bloque A — FLOORS eliminado 2026-05-11).
  // Si Supabase devuelve 0 en alguna métrica, Hero omite esa pill condicionalmente.
  let stats = { developments: 0, units: 0, cities: 0, zones: 0, typeCounts: {} as Record<string, number> };
  let developers: Array<{ name: string; logo_url: string | null; slug: string }> = [];
  let featured: FeaturedDevelopment[] = [];

  const visibility = await getVisibility();

  try {
    const supabase = await createServerSupabaseClient();
    const [statsData, devsRes, featuredRes] = await Promise.all([
      getGlobalStats(supabase),
      getDevelopers(supabase),
      getFeaturedDevelopments(supabase, 6),
    ]);
    stats = statsData;
    type DeveloperRow = { name: string; logo_url: string | null; verified: boolean | null; slug: string };
    developers = ((devsRes.data || []) as DeveloperRow[])
      .filter((d) => Boolean(d.logo_url) && Boolean(d.verified))
      .map((d) => ({ name: d.name, logo_url: d.logo_url, slug: d.slug }));
    featured = (featuredRes.data || []) as FeaturedDevelopment[];
  } catch (error) {
    console.error('[HomePage] Supabase fetch failed:', error);
  }

  // Orden Home — Manual UX/UI §4.2 + ampliación E-E-A-T (decisión Luis 2026-05-11):
  // Hero → Nosotros → Featured → Metodología → ProcessInfographic →
  // HowItWorks → WhyPropyte → TrendingMarket → DondeEstamos →
  // DeveloperLogos → HomeFAQ → DeveloperBanner → JoinTeamBanner → RecentBlog
  return (
    <>
      <SchemaMarkup type="organization" />
      {isVisible(visibility, VISIBILITY_KEYS.HOME_HERO) && <Hero stats={stats} />}

      <ScrollReveal>
        <NosotrosTeaser />
      </ScrollReveal>

      {isVisible(visibility, VISIBILITY_KEYS.HOME_FEATURED) && (
        <ScrollReveal delay={0.05}>
          <FeaturedProperties developments={featured} />
        </ScrollReveal>
      )}

      <ScrollReveal>
        <MetodologiaTeaser />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <ProcessInfographic />
      </ScrollReveal>

      <ScrollReveal>
        <HowItWorks />
      </ScrollReveal>

      {isVisible(visibility, VISIBILITY_KEYS.HOME_WHY_PROPYTE) && (
        <ScrollReveal delay={0.05}>
          <WhyPropyte />
        </ScrollReveal>
      )}

      <ScrollReveal>
        <TrendingMarket />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <DondeEstamos />
      </ScrollReveal>

      {isVisible(visibility, VISIBILITY_KEYS.HOME_PARTNERS) && developers.length > 0 && (
        <ScrollReveal>
          <DeveloperLogos developers={developers} />
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.05}>
        <HomeFAQ />
      </ScrollReveal>

      <ScrollReveal>
        <DeveloperBanner />
      </ScrollReveal>

      {isVisible(visibility, VISIBILITY_KEYS.HOME_CTA_JOIN) && (
        <ScrollReveal delay={0.05}>
          <JoinTeamBanner />
        </ScrollReveal>
      )}

      <ScrollReveal>
        <RecentBlog locale={locale} />
      </ScrollReveal>
    </>
  );
}
