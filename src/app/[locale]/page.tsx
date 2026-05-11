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
import { getVisibility, isVisible, VISIBILITY_KEYS } from '@/lib/visibility';
import {
  getTestimonials,
  getCta,
  getExploreCategories,
  localizedExploreLabel,
} from '@/lib/hub-content';

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
    console.error('[HomePage] Supabase fetch failed, using fallback stats:', error);
  }

  // Contenido editorial dinámico desde Hub (con fallback a i18n hardcoded)
  const [hubTestimonials, leadMagnetCta, hubExplore] = await Promise.all([
    getTestimonials('home'),
    getCta('home_lead_magnet'),
    getExploreCategories(),
  ]);

  // Hub override de cards "Explora": si trae al menos 1 row, sustituye TODAS.
  // Si no, ExploreCategories cae al array hardcoded original.
  const exploreOverride = hubExplore.length > 0
    ? hubExplore.map((c) => ({
        key: c.slug,
        typeKey: c.type_key ?? c.slug,
        label: localizedExploreLabel(c, locale),
        image: c.image_url,
        href: c.href,
      }))
    : null;
  const homeTestimonials = hubTestimonials.map((t) => ({
    name: t.name,
    city: t.location ?? '',
    rating: t.rating ?? 5,
    text: locale === 'en' ? t.quote_en : t.quote_es,
  }));
  const leadMagnetProps = leadMagnetCta
    ? {
        eyebrow: locale === 'en' ? leadMagnetCta.eyebrow_en : leadMagnetCta.eyebrow_es,
        title: locale === 'en' ? leadMagnetCta.title_en : leadMagnetCta.title_es,
        subtitle: locale === 'en' ? leadMagnetCta.subtitle_en : leadMagnetCta.subtitle_es,
        buttonLabel: locale === 'en' ? leadMagnetCta.button_label_en : leadMagnetCta.button_label_es,
      }
    : null;

  return (
    <>
      <SchemaMarkup type="organization" />
      {isVisible(visibility, VISIBILITY_KEYS.HOME_HERO) && <Hero stats={stats} />}
      <ScrollReveal>
        <ExploreCategories
          typeCounts={stats.typeCounts}
          override={exploreOverride}
        />
      </ScrollReveal>
      {isVisible(visibility, VISIBILITY_KEYS.HOME_FEATURED) && (
        <ScrollReveal delay={0.05}>
          <FeaturedProperties developments={featured} />
        </ScrollReveal>
      )}
      {isVisible(visibility, VISIBILITY_KEYS.HOME_TESTIMONIALS) && (
        <ScrollReveal>
          <Testimonials items={homeTestimonials} />
        </ScrollReveal>
      )}
      <ScrollReveal delay={0.05}>
        <TrendingMarket />
      </ScrollReveal>
      {isVisible(visibility, VISIBILITY_KEYS.HOME_WHY_PROPYTE) && (
        <ScrollReveal>
          <WhyPropyte />
        </ScrollReveal>
      )}
      {isVisible(visibility, VISIBILITY_KEYS.HOME_CTA_JOIN) && (
        <ScrollReveal delay={0.05}>
          <JoinTeamBanner />
        </ScrollReveal>
      )}
      <ScrollReveal>
        <DeveloperBanner />
      </ScrollReveal>
      {isVisible(visibility, VISIBILITY_KEYS.HOME_PARTNERS) && developers.length > 0 && (
        <ScrollReveal delay={0.05}>
          <DeveloperLogos developers={developers} />
        </ScrollReveal>
      )}
      <ScrollReveal>
        <LeadMagnet cta={leadMagnetProps} />
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
