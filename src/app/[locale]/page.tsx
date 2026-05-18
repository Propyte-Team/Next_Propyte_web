import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getGlobalStats, getDevelopers, getFeaturedDevelopments } from '@/lib/supabase/queries';
import Hero from '@/components/home/Hero';
import NosotrosTeaser from '@/components/home/NosotrosTeaser';
import FeaturedProperties, { type FeaturedDevelopment } from '@/components/home/FeaturedProperties';
import ExploreCategories from '@/components/home/ExploreCategories';
import MetodologiaTeaser from '@/components/home/MetodologiaTeaser';
import ProcessInfographic from '@/components/home/ProcessInfographic';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import WhyPropyte from '@/components/home/WhyPropyte';
import TrendingMarket from '@/components/home/TrendingMarket';
import DondeEstamos from '@/components/home/DondeEstamos';
import DeveloperLogos from '@/components/home/DeveloperLogos';
import HomeFAQ from '@/components/home/HomeFAQ';
import DeveloperBanner from '@/components/home/DeveloperBanner';
import JoinTeamBanner from '@/components/home/JoinTeamBanner';
import LeadMagnet from '@/components/home/LeadMagnet';
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

  // Stats reales sin pisos inventados (Bloque A — FLOORS eliminado 2026-05-11).
  // Si Supabase devuelve 0 en alguna métrica, Hero omite esa pill condicionalmente.
  let stats = { developments: 0, units: 0, cities: 0, zones: 0, typeCounts: {} as Record<string, number> };
  let developers: Array<{ name: string; logo_url: string | null; slug: string; city: string | null; state: string | null }> = [];
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
    type DeveloperRow = { name: string; logo_url: string | null; verified: boolean | null; slug: string; city: string | null; state: string | null };
    developers = ((devsRes.data || []) as DeveloperRow[])
      .filter((d) => Boolean(d.logo_url) && Boolean(d.verified))
      .map((d) => ({ name: d.name, logo_url: d.logo_url, slug: d.slug, city: d.city, state: d.state }));
    featured = (featuredRes.data || []) as FeaturedDevelopment[];
  } catch (error) {
    console.error('[HomePage] Supabase fetch failed:', error);
  }

  // Contenido editorial dinámico desde Hub. Auto-hide si Hub no devuelve data:
  // si Luis quiere ocultar la sección, basta con borrar/desactivar los datos en hub.propyte.com.
  const [hubTestimonials, leadMagnetCta, hubExplore] = await Promise.all([
    getTestimonials('home'),
    getCta('home_lead_magnet'),
    getExploreCategories(),
  ]);

  const homeTestimonials = hubTestimonials.map((t) => ({
    name: t.name,
    city: t.location ?? '',
    rating: t.rating ?? 5,
    text: locale === 'en' ? t.quote_en : t.quote_es,
  }));

  const exploreOverride = hubExplore.length > 0
    ? hubExplore.map((c) => ({
        key: c.slug,
        typeKey: c.type_key ?? c.slug,
        label: localizedExploreLabel(c, locale),
        image: c.image_url,
        href: c.href,
      }))
    : null;

  const leadMagnetProps = leadMagnetCta
    ? {
        eyebrow: locale === 'en' ? leadMagnetCta.eyebrow_en : leadMagnetCta.eyebrow_es,
        title: locale === 'en' ? leadMagnetCta.title_en : leadMagnetCta.title_es,
        subtitle: locale === 'en' ? leadMagnetCta.subtitle_en : leadMagnetCta.subtitle_es,
        buttonLabel: locale === 'en' ? leadMagnetCta.button_label_en : leadMagnetCta.button_label_es,
      }
    : null;

  // Orden Home — Ajuste 2026-05-16 (decisión Luis):
  // Fijo top: Hero → ProcessInfographic → LeadMagnet(Hub) → FeaturedProperties →
  // DeveloperBanner → NosotrosTeaser
  // Resto reordenado para flujo CTA progresivo + SEO (E-E-A-T, FAQ schema,
  // freshness, internal linking):
  // ExploreCategories(Hub) → WhyPropyte → Metodología → HowItWorks →
  // Testimonials(Hub) → TrendingMarket → DondeEstamos → DeveloperLogos →
  // RecentBlog → HomeFAQ → JoinTeamBanner
  return (
    <>
      <SchemaMarkup type="organization" />
      {isVisible(visibility, VISIBILITY_KEYS.HOME_HERO) && <Hero stats={stats} />}

      <ScrollReveal delay={0.05}>
        <ProcessInfographic />
      </ScrollReveal>

      {leadMagnetProps && (
        <ScrollReveal>
          <LeadMagnet cta={leadMagnetProps} />
        </ScrollReveal>
      )}

      {isVisible(visibility, VISIBILITY_KEYS.HOME_FEATURED) && (
        <ScrollReveal delay={0.05}>
          <FeaturedProperties developments={featured} />
        </ScrollReveal>
      )}

      <ScrollReveal>
        <DeveloperBanner />
      </ScrollReveal>

      <ScrollReveal>
        <NosotrosTeaser />
      </ScrollReveal>

      {exploreOverride && (
        <ScrollReveal>
          <ExploreCategories typeCounts={stats.typeCounts} override={exploreOverride} />
        </ScrollReveal>
      )}

      {isVisible(visibility, VISIBILITY_KEYS.HOME_WHY_PROPYTE) && (
        <ScrollReveal delay={0.05}>
          <WhyPropyte />
        </ScrollReveal>
      )}

      <ScrollReveal>
        <MetodologiaTeaser />
      </ScrollReveal>

      <ScrollReveal>
        <HowItWorks />
      </ScrollReveal>

      {isVisible(visibility, VISIBILITY_KEYS.HOME_TESTIMONIALS) && homeTestimonials.length > 0 && (
        <ScrollReveal delay={0.05}>
          <Testimonials items={homeTestimonials} />
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

      <ScrollReveal>
        <RecentBlog locale={locale} />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <HomeFAQ />
      </ScrollReveal>

      {isVisible(visibility, VISIBILITY_KEYS.HOME_CTA_JOIN) && (
        <ScrollReveal delay={0.05}>
          <JoinTeamBanner />
        </ScrollReveal>
      )}
    </>
  );
}
