import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getZoneDetail,
  getOccupancyTrend,
  getADRTrend,
  getForecasts,
  getSeasonalIndices,
  getDevelopments,
} from '@/lib/supabase/queries';
import { CITY_TO_AIRDNA, ZONE_TO_AIRDNA_SUBMARKETS, AIRDNA_SUBMARKET_TO_ZONE } from '@/lib/calculator';
import { ZoneAnalytics } from './ZoneAnalytics';

// Generate zone slugs for static generation
const ZONE_CONFIGS = Object.entries(AIRDNA_SUBMARKET_TO_ZONE).map(([sub, zone]) => ({
  slug: zone.toLowerCase().replace(/\s+/g, '-').replace(/[\/]/g, '-'),
  zone,
  city: 'Cancun', // Default to Cancun for now
  submarket: sub,
}));

// Deduplicate by slug
const UNIQUE_ZONES = ZONE_CONFIGS.reduce((acc, z) => {
  if (!acc.find((a) => a.slug === z.slug)) acc.push(z);
  return acc;
}, [] as typeof ZONE_CONFIGS);

// Force dynamic rendering — SSG can't access cookies() needed by Supabase client
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return UNIQUE_ZONES.map((z) => ({ slug: z.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const zoneConfig = UNIQUE_ZONES.find((z) => z.slug === slug);
  const zoneName = zoneConfig?.zone || slug.replace(/-/g, ' ');
  const cityName = zoneConfig?.city || 'Cancun';
  const isEn = locale === 'en';

  const title = isEn
    ? `${zoneName}, ${cityName} — Vacation Rental Market Analysis | Propyte`
    : `${zoneName}, ${cityName} — Análisis de Mercado de Renta Vacacional | Propyte`;
  const description = isEn
    ? `Investment analysis for ${zoneName}: occupancy rates, ADR trends, seasonal patterns, RevPAR, and zone intelligence score. Data-driven insights for real estate investors.`
    : `Análisis de inversión para ${zoneName}: ocupación, tendencias de ADR, estacionalidad, RevPAR y score de inteligencia de zona. Insights basados en datos para inversionistas inmobiliarios.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', locale: isEn ? 'en_US' : 'es_MX' },
    alternates: {
      languages: {
        es: `/es/zonas/${slug}`,
        en: `/en/zonas/${slug}`,
        'x-default': `/es/zonas/${slug}`,
      },
    },
  };
}

export default async function ZonePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const zoneConfig = UNIQUE_ZONES.find((z) => z.slug === slug);

  if (!zoneConfig) notFound();

  const { zone, city, submarket } = zoneConfig;
  const market = CITY_TO_AIRDNA[city] || 'cancun';

  const supabase = await createServerSupabaseClient();

  // Fetch all data in parallel — gracefully handle missing Supabase
  let zoneDetail = { score: null, submarkets: [] as string[] };
  let occupancyTrend: Array<{ date: string; value: number }> = [];
  let adrTrend: Array<{ date: string; value: number }> = [];
  let forecasts: Awaited<ReturnType<typeof getForecasts>> = [];
  let seasonality: Awaited<ReturnType<typeof getSeasonalIndices>> = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let developments: any[] = [];

  if (supabase) {
    try {
      const results = await Promise.allSettled([
        getZoneDetail(supabase, city, zone),
        getOccupancyTrend(supabase, market, submarket, 36),
        getADRTrend(supabase, market, submarket, 36),
        getForecasts(supabase, market, submarket),
        getSeasonalIndices(supabase, market, submarket),
        getDevelopments(supabase, { city, zone, orderBy: 'roi', limit: 10 }),
      ]);

      if (results[0].status === 'fulfilled') zoneDetail = results[0].value;
      if (results[1].status === 'fulfilled') occupancyTrend = results[1].value;
      if (results[2].status === 'fulfilled') adrTrend = results[2].value;
      if (results[3].status === 'fulfilled') forecasts = results[3].value;
      if (results[4].status === 'fulfilled') seasonality = results[4].value;
      if (results[5].status === 'fulfilled') developments = results[5].value?.data || [];
    } catch (e) {
      console.error('Zone page data fetch error:', e);
    }
  }

  // Separate forecasts and seasonality by metric
  const occupancyForecasts = forecasts.filter((f) => f.metric_name === 'occupancy');
  const adrForecasts = forecasts.filter((f) => f.metric_name === 'daily_rate');
  const occupancySeasonal = seasonality.filter((s) => s.metric_name === 'occupancy');
  const adrSeasonal = seasonality.filter((s) => s.metric_name === 'daily_rate');

  // Schema.org JSON-LD
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${zone}, ${city}`,
    description: `Vacation rental market analysis for ${zone} in ${city}, Mexico`,
    geo: { '@type': 'GeoCoordinates', latitude: 21.1619, longitude: -86.8515 },
  };

  const isEn = locale === 'en';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6">
          <a href={`/${locale}`} className="hover:text-gray-700">
            {isEn ? 'Home' : 'Inicio'}
          </a>
          {' / '}
          <a href={`/${locale}/zonas`} className="hover:text-gray-700">
            {isEn ? 'Zones' : 'Zonas'}
          </a>
          {' / '}
          <span className="text-gray-900 font-medium">{zone}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {zone}
          </h1>
          <p className="text-lg text-gray-500 mt-1">
            {city} &middot; {isEn ? 'Vacation Rental Market Intelligence' : 'Inteligencia de Mercado de Renta Vacacional'}
          </p>
        </div>

        {/* Client-side analytics component */}
        <ZoneAnalytics
          zone={zone}
          city={city}
          score={zoneDetail.score}
          occupancyTrend={occupancyTrend}
          adrTrend={adrTrend}
          occupancyForecasts={occupancyForecasts}
          adrForecasts={adrForecasts}
          occupancySeasonal={occupancySeasonal}
          adrSeasonal={adrSeasonal}
          developments={developments}
          locale={locale}
        />
      </main>
    </>
  );
}
