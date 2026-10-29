import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import {
  getGlobalStats,
  getFeaturedDevelopments,
  getDevelopments,
  getDiscountedUnits,
  getBlogPosts,
  type BlogPost,
} from '@/lib/supabase/queries';
import { mapUnitToProperty, type UnitRow } from '@/lib/mappers/unit-to-property';
import { resolveInvestmentForRows } from '@/lib/investment/resolve-rows';
import type { Property } from '@/types/property';
import { CITY_MAP } from '@/lib/cities';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import ScrollReveal from '@/components/shared/ScrollReveal';
import DiscountedUnitsSection from '@/components/home/DiscountedUnitsSection';
import Testimonials from '@/components/home/Testimonials';
import GsapLenisSync from '@/components/home/v3/GsapLenisSync';
import HeroV3 from '@/components/home/v3/HeroV3';
import FiguresV3 from '@/components/home/v3/FiguresV3';
import CityCarouselV3 from '@/components/home/v3/CityCarouselV3';
import CityPanelsV3 from '@/components/home/v3/CityPanelsV3';
import BenefitsV3 from '@/components/home/v3/BenefitsV3';
import PartnersV3, { type PartnerBand } from '@/components/home/v3/PartnersV3';
import BlogFaqV3, { type BlogItem } from '@/components/home/v3/BlogFaqV3';
import type { HeroSlide, HomeCard, HomeCity, HomeStats, StageKey } from '@/components/home/v3/types';
import { getVisibility, isVisible, VISIBILITY_KEYS } from '@/lib/visibility';
import { getCta, getBlogFeatured, getTestimonials, localizedTestimonialLocation } from '@/lib/hub-content';
import { ogLocaleImages } from '@/lib/og/images';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    openGraph: {
      siteName: 'Propyte',
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: ogLocaleImages(locale),
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

// Filas de v_developments que usa la home v3 (la vista trae más columnas).
interface DevRow {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  zone: string | null;
  stage: string | null;
  price_min_mxn: number | null;
  images: string[] | null;
  property_types: string[] | null;
  available_units: number | null;
  featured: boolean | null;
}

// Precios por debajo de esto son errores de captura conocidos (p. ej. un lote a
// $35,000); no se usan para el "desde" de una ciudad.
const MIN_REAL_PRICE = 100_000;

const TYPE_LABELS: Record<'es' | 'en', Record<string, string>> = {
  es: { Departamento: 'Departamentos', Casa: 'Casas', Villa: 'Villas', Terreno: 'Lotes', Lote: 'Lotes', Penthouse: 'Penthouses', Local: 'Locales' },
  en: { Departamento: 'Apartments', Casa: 'Houses', Villa: 'Villas', Terreno: 'Lots', Lote: 'Lots', Penthouse: 'Penthouses', Local: 'Retail' },
};

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function stageKey(stage: string | null): StageKey {
  const s = norm(stage ?? '');
  if (s.includes('preventa') || s.includes('presale')) return 'presale';
  if (s.includes('constru')) return 'construction';
  return 'ready';
}

function compactPrice(n: number | null, locale: string): string | null {
  if (!n || n < MIN_REAL_PRICE) return null;
  if (n >= 1_000_000) {
    const v = (Math.round((n / 1_000_000) * 100) / 100).toString();
    return `$${v} M`;
  }
  return locale === 'en' ? `$${Math.round(n / 1000)}K` : `$${Math.round(n / 1000)} mil`;
}

function place(zone: string | null, city: string): string {
  if (!zone) return city;
  return norm(zone).includes(norm(city)) ? zone : `${zone}, ${city}`;
}

function citySlug(city: string): string | null {
  const n = norm(city);
  const hit = Object.entries(CITY_MAP).find(([, info]) => norm(info.name) === n);
  return hit ? hit[0] : null;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Sin esto next-intl resuelve el locale vía cookies()/headers() y la home
  // vuelve a caer a render dinámico. Mismo patrón que desarrolladores/page.tsx.
  setRequestLocale(locale);
  const lang: 'es' | 'en' = locale === 'en' ? 'en' : 'es';
  const t = await getTranslations({ locale, namespace: 'homeV3' });

  const EMPTY = {
    stats: { developments: 0, units: 0, cities: 0, zones: 0 } as HomeStats,
    featured: [] as DevRow[],
    rows: [] as DevRow[],
    posts: [] as BlogPost[],
    discountedUnits: [] as Property[],
  };

  // Visibilidad del Hub, catálogo de Supabase y contenido editorial del Hub son
  // independientes: van en paralelo, cada uno fail-open.
  const supabasePromise = (async (): Promise<typeof EMPTY> => {
    try {
      // Cliente sin cookies: la home se mantiene estática (ver comentario histórico).
      const supabase = createPublicSupabaseClient();
      if (!supabase) return EMPTY;
      const [stats, featuredRes, devsRes, blogRes, discountedRes] = await Promise.all([
        getGlobalStats(supabase),
        getFeaturedDevelopments(supabase, 6),
        getDevelopments(supabase, { limit: 120, orderBy: 'newest' }),
        getBlogPosts(supabase, { locale, limit: 7, page: 1 }),
        getDiscountedUnits(supabase, 6),
      ]);
      const discountedRows = (discountedRes.data || []) as unknown as UnitRow[];
      const discountedResolved = await resolveInvestmentForRows(supabase, discountedRows);
      return {
        stats: { developments: stats.developments, units: stats.units, cities: stats.cities, zones: stats.zones },
        featured: (featuredRes.data || []) as unknown as DevRow[],
        rows: (devsRes.data || []) as unknown as DevRow[],
        posts: blogRes.posts,
        discountedUnits: discountedRows.map((row) => mapUnitToProperty(row, locale, discountedResolved.get(row.id))),
      };
    } catch (error) {
      console.error('[HomePage v3] Supabase fetch failed:', error);
      return EMPTY;
    }
  })();

  const [visibility, data, developerCta, blogFeatured, hubTestimonials] = await Promise.all([
    getVisibility(),
    supabasePromise,
    getCta('home_developer_banner'),
    getBlogFeatured('inversionistas'),
    getTestimonials('home'),
  ]);
  const { stats, featured, rows, posts, discountedUnits } = data;

  // Testimonios reales del Hub (se conservan de la home anterior: son la prueba
  // social con liga a la publicación original).
  const homeTestimonials = hubTestimonials.map((t) => ({
    name: t.name,
    city: localizedTestimonialLocation(t.location, locale),
    rating: t.rating ?? 5,
    text: locale === 'en' ? t.quote_en : t.quote_es,
    // Puede venir null: `Testimonials` decide con eso si la insignia es enlace.
    sourceUrl: t.source_url,
  }));

  // Tarjetas por ciudad: destacados primero y solo con foto.
  const toCard = (r: DevRow): HomeCard => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    zone: r.zone,
    city: r.city ?? '',
    place: place(r.zone, r.city ?? ''),
    priceLabel: compactPrice(r.price_min_mxn, locale),
    stage: stageKey(r.stage),
    types: Array.from(new Set((r.property_types ?? []).map((tp) => TYPE_LABELS[lang][tp] ?? tp))),
    available: r.available_units,
    image: r.images?.[0] ?? null,
  });
  const byCity = new Map<string, DevRow[]>();
  for (const r of rows) {
    if (!r.city) continue;
    byCity.set(r.city, [...(byCity.get(r.city) ?? []), r]);
  }
  const cities: HomeCity[] = [...byCity.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
    .map(([city, list]) => {
      const withPhoto = list.filter((r) => r.images?.length);
      const ordered = [...withPhoto.filter((r) => r.featured), ...withPhoto.filter((r) => !r.featured)];
      const prices = list.map((r) => r.price_min_mxn ?? 0).filter((p) => p >= MIN_REAL_PRICE);
      const zoneCount = new Map<string, number>();
      list.forEach((r) => { if (r.zone && norm(r.zone) !== norm(city)) zoneCount.set(r.zone, (zoneCount.get(r.zone) ?? 0) + 1); });
      const slug = citySlug(city);
      return {
        key: slug ?? norm(city).replace(/\s+/g, '-'),
        name: city,
        href: slug ? `/${locale}/desarrollos/${slug}` : `/${locale}/desarrollos?search=${encodeURIComponent(city)}`,
        count: list.length,
        fromLabel: prices.length ? compactPrice(Math.min(...prices), locale) : null,
        zones: [...zoneCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([z]) => z),
        image: ordered[0]?.images?.[0] ?? null,
        items: ordered.slice(0, 6).map(toCard),
      };
    })
    .filter((c) => c.items.length > 0);

  const pool = [...featured, ...rows.filter((r) => !featured.some((f) => f.id === r.id))].filter((r) => r.images?.length);
  const heroSlides: HeroSlide[] = pool.slice(0, 4).map((r) => ({ src: r.images![0], name: r.name }));
  const benefitImages = pool.slice(0, 5).map((r) => r.images![1] ?? r.images![0]);
  const partnerImages = pool.slice(5, 7).map((r) => r.images![1] ?? r.images![0]);
  // Las portadas del blog son ilustraciones generadas: en la nota destacada se
  // usa una foto real de desarrollo (decisión del prototipo v3, auditoría "se ve IA").
  const blogLeadPhoto = pool[7] ? (pool[7].images![1] ?? pool[7].images![0]) : null;

  const bands: PartnerBand[] = [
    {
      key: 'developers',
      who: t('partners.developersWho'),
      title: (lang === 'en' ? developerCta?.title_en : developerCta?.title_es) || t('partners.developersTitle'),
      body: t('partners.developersBody'),
      cta: (lang === 'en' ? developerCta?.button_label_en : developerCta?.button_label_es) || t('partners.developersCta'),
      href: developerCta?.button_href || `/${locale}/desarrolladores`,
      image: partnerImages[0] ?? null,
    },
    isVisible(visibility, VISIBILITY_KEYS.NAV_BROKERS)
      ? { key: 'brokers', who: t('partners.brokersWho'), title: t('partners.brokersTitle'), body: t('partners.brokersBody'), cta: t('partners.brokersCta'), href: `/${locale}/brokers`, image: partnerImages[1] ?? null }
      : { key: 'team', who: t('partners.teamWho'), title: t('partners.teamTitle'), body: t('partners.teamBody'), cta: t('partners.teamCta'), href: `/${locale}/unete`, image: partnerImages[1] ?? null },
  ];

  const toBlog = (p: BlogPost): BlogItem => ({
    slug: p.slug, title: p.title, excerpt: p.excerpt, category: p.category,
    image: p.featured_image, publishedAt: p.published_at, minutes: p.read_time_min,
  });
  // La nota destacada la curan en el Hub (blog-featured); si no hay, la más reciente.
  const curatedSlug = blogFeatured[0]?.post_slug;
  const leadPost = posts.find((p) => p.slug === curatedSlug) ?? posts[0] ?? null;
  const latestPosts = posts.filter((p) => p !== leadPost).slice(0, 5);

  const asOf = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  // Home v3 (rediseño 2026-10, Figma "Propuesta v3" + comentarios de Lara):
  // Hero → Cifras → Lo más buscado por ciudad → Unidades con descuento →
  // Ciudades → Por qué Propyte → Desarrolladores/Brokers → Blog + FAQ.
  // Contacto vive en el footer global. Las secciones de la home anterior que no
  // están aquí (LeadMagnet, ProcessInfographic, NosotrosTeaser, ExploreCategories,
  // MetodologiaTeaser, HowItWorks, Testimonials, DondeEstamos, DeveloperLogos,
  // JoinTeamBanner) siguen en el repo para comparar en develop.
  return (
    <>
      <SchemaMarkup type="organization" />
      <GsapLenisSync />
      {isVisible(visibility, VISIBILITY_KEYS.HOME_HERO) && heroSlides.length > 0 && <HeroV3 slides={heroSlides} />}
      <FiguresV3 stats={stats} asOf={asOf} />
      {isVisible(visibility, VISIBILITY_KEYS.HOME_FEATURED) && <CityCarouselV3 cities={cities} />}
      <ScrollReveal delay={0.05}>
        <DiscountedUnitsSection units={discountedUnits} />
      </ScrollReveal>
      <CityPanelsV3 cities={cities} />
      {isVisible(visibility, VISIBILITY_KEYS.HOME_WHY_PROPYTE) && benefitImages.length > 0 && <BenefitsV3 images={benefitImages} />}
      {isVisible(visibility, VISIBILITY_KEYS.HOME_TESTIMONIALS) && homeTestimonials.length > 0 && (
        <ScrollReveal delay={0.05}>
          <Testimonials items={homeTestimonials} />
        </ScrollReveal>
      )}
      <PartnersV3 bands={bands} />
      <BlogFaqV3 lead={leadPost ? { ...toBlog(leadPost), image: blogLeadPhoto ?? leadPost.featured_image } : null} latest={latestPosts.map(toBlog)} />
    </>
  );
}
