import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getGlobalStats, getDevelopers, getFeaturedDevelopments } from '@/lib/supabase/queries';
import Hero from '@/components/home/Hero';
import ExploreCategories from '@/components/home/ExploreCategories';
import FeaturedProperties, { type FeaturedDevelopment } from '@/components/home/FeaturedProperties';
import TrendingMarket from '@/components/home/TrendingMarket';
import WhyPropyte from '@/components/home/WhyPropyte';
import DeveloperBanner from '@/components/home/DeveloperBanner';
import DeveloperLogos from '@/components/home/DeveloperLogos';
import Testimonials from '@/components/home/Testimonials';
import LeadMagnet from '@/components/home/LeadMagnet';
import AppDownloadBanner from '@/components/home/AppDownloadBanner';
import JoinTeamBanner from '@/components/home/JoinTeamBanner';
import RecentBlog from '@/components/home/RecentBlog';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import ScrollReveal from '@/components/shared/ScrollReveal';

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
  // Fetch global stats, developers, and featured developments
  let stats = { developments: 170, units: 500, cities: 5, zones: 30, typeCounts: {} as Record<string, number> };
  let developers: Array<{ name: string; logo_url: string | null; slug: string }> = [];
  let featured: FeaturedDevelopment[] = [];

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
    console.error('[HomePage] Supabase fetch failed, using fallback stats:', error);
  }

  return (
    <>
      <SchemaMarkup type="organization" />
      <Hero stats={stats} />
      <ScrollReveal>
        <ExploreCategories typeCounts={stats.typeCounts} />
      </ScrollReveal>
      <ScrollReveal delay={0.05}>
        <FeaturedProperties developments={featured} />
      </ScrollReveal>
      <ScrollReveal>
        <Testimonials />
      </ScrollReveal>
      <ScrollReveal delay={0.05}>
        <TrendingMarket />
      </ScrollReveal>
      <ScrollReveal>
        <WhyPropyte />
      </ScrollReveal>
      <ScrollReveal delay={0.05}>
        <JoinTeamBanner />
      </ScrollReveal>
      <ScrollReveal>
        <DeveloperBanner />
      </ScrollReveal>
      {developers.length > 0 && (
        <ScrollReveal delay={0.05}>
          <DeveloperLogos developers={developers} />
        </ScrollReveal>
      )}
      <ScrollReveal>
        <LeadMagnet />
      </ScrollReveal>
      <ScrollReveal delay={0.05}>
        <AppDownloadBanner />
      </ScrollReveal>
      <ScrollReveal delay={0.05}>
        <RecentBlog locale={locale} />
      </ScrollReveal>
    </>
  );
}
