import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getGlobalStats, getDevelopers } from '@/lib/supabase/queries';
import Hero from '@/components/home/Hero';
import ExploreCategories from '@/components/home/ExploreCategories';
import FeaturedProperties from '@/components/home/FeaturedProperties';
import TrendingMarket from '@/components/home/TrendingMarket';
import WhyPropyte from '@/components/home/WhyPropyte';
import DeveloperBanner from '@/components/home/DeveloperBanner';
import DeveloperLogos from '@/components/home/DeveloperLogos';
import Testimonials from '@/components/home/Testimonials';
import LeadMagnet from '@/components/home/LeadMagnet';
import AppDownloadBanner from '@/components/home/AppDownloadBanner';
import RecentBlog from '@/components/home/RecentBlog';
import SchemaMarkup from '@/components/shared/SchemaMarkup';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    alternates: {
      languages: {
        es: '/es',
        en: '/en',
        'x-default': '/es',
      },
    },
  };
}

export default async function HomePage() {
  // Fetch global stats + developers for home page sections
  let stats = { developments: 170, units: 500, cities: 5, zones: 30, typeCounts: {} as Record<string, number> };
  let developers: Array<{ name: string; logo_url: string | null; slug: string }> = [];

  try {
    const supabase = await createServerSupabaseClient();
    const [statsData, devsRes] = await Promise.all([
      getGlobalStats(supabase),
      getDevelopers(supabase),
    ]);
    stats = statsData;
    developers = (devsRes.data || [])
      .filter((d: any) => d.logo_url && d.verified)
      .map((d: any) => ({ name: d.name, logo_url: d.logo_url, slug: d.slug }));
  } catch {
    // Supabase not available — use fallback stats
  }

  return (
    <>
      <SchemaMarkup type="organization" />
      <Hero stats={stats} />
      <ExploreCategories typeCounts={stats.typeCounts} />
      <FeaturedProperties />
      <Testimonials />
      <TrendingMarket />
      <WhyPropyte />
      <DeveloperBanner />
      {developers.length > 0 && <DeveloperLogos developers={developers} />}
      <LeadMagnet />
      <AppDownloadBanner />
      {/* TODO: Habilitar cuando haya articulos reales — fase de contenido */}
      {/* <RecentBlog /> */}
    </>
  );
}
