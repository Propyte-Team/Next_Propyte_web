import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import {
  getZoneDetail,
  getOccupancyTrend,
  getADRTrend,
  getForecasts,
  getSeasonalIndices,
  getDevelopments,
} from '@/lib/supabase/queries';
import { CITY_TO_MARKET_CODE, MARKET_SUBMARKET_TO_ZONE, MARKET_SUBMARKET_TO_CITY } from '@/lib/calculator';
import { ZoneAnalytics } from './ZoneAnalytics';
import SiteMedia from '@/components/shared/SiteMedia';
import { zoneSlug } from '@/lib/utils';

// City → state, for the ones present in MARKET_SUBMARKET_TO_CITY. Used for the
// Place JSON-LD addressRegion and the SSR summary copy — previously hardcoded
// to 'Quintana Roo' for every zone (wrong for CDMX/Mérida).
const CITY_TO_STATE: Record<string, string> = {
  'Cancun': 'Quintana Roo',
  'Playa del Carmen': 'Quintana Roo',
  'Tulum': 'Quintana Roo',
  'Akumal': 'Quintana Roo',
  'CDMX': 'Ciudad de México',
  'Merida': 'Yucatán',
};

// Generate zone slugs for static generation
const ZONE_CONFIGS = Object.entries(MARKET_SUBMARKET_TO_ZONE).map(([sub, zone]) => ({
  slug: zoneSlug(zone),
  zone,
  city: MARKET_SUBMARKET_TO_CITY[sub] || 'Cancun', // real city per submarket; conservative fallback for any unmapped code
  submarket: sub,
}));

// Deduplicate by slug
const UNIQUE_ZONES = ZONE_CONFIGS.reduce((acc, z) => {
  if (!acc.find((a) => a.slug === z.slug)) acc.push(z);
  return acc;
}, [] as typeof ZONE_CONFIGS);

// ISR — cookieless public client (createPublicSupabaseClient) lets this
// prerender + revalidate instead of forcing per-request dynamic rendering.
export const revalidate = 3600;

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

  // El template del root layout ('%s | Propyte') ya añade el sufijo de marca.
  const title = isEn
    ? `${zoneName}, ${cityName} — Vacation Rental Market Analysis`
    : `${zoneName}, ${cityName} — Análisis de Mercado de Renta Vacacional`;
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

  // La normalización de slugs con acento (puerto-cancún → puerto-cancun) se
  // maneja en middleware.ts con un 308 (permanentRedirect en el render no corta
  // bajo force-dynamic).
  if (!zoneConfig) notFound();

  const { zone, city, submarket } = zoneConfig;
  const market = CITY_TO_MARKET_CODE[city] || 'cancun';
  const state = CITY_TO_STATE[city] || 'Quintana Roo';

  const supabase = createPublicSupabaseClient();

  // Fetch all data in parallel — gracefully handle missing Supabase
  let zoneDetail: Awaited<ReturnType<typeof getZoneDetail>> = { score: null, submarkets: [] };
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

  const tProp = await getTranslations({ locale, namespace: 'property' });
  const tZonas = await getTranslations({ locale, namespace: 'zonas' });

  // Schema.org JSON-LD — Place + BreadcrumbList (coincide con el breadcrumb visible).
  const isEn = locale === 'en';
  const baseUrl = 'https://propyte.com';
  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${zone}, ${city}`,
    description: isEn
      ? `Vacation rental market analysis for ${zone}, ${city}, Mexico: occupancy, ADR, RevPAR and seasonality.`
      : `Análisis de mercado de renta vacacional en ${zone}, ${city}: ocupación, ADR, RevPAR y estacionalidad.`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressRegion: state,
      addressCountry: 'MX',
    },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: tProp('breadcrumbHome'), item: `${baseUrl}/${locale}` },
      { '@type': 'ListItem', position: 2, name: tZonas('breadcrumbZones'), item: `${baseUrl}/${locale}/zonas` },
      { '@type': 'ListItem', position: 3, name: zone, item: `${baseUrl}/${locale}/zonas/${slug}` },
    ],
  };

  // Resumen de mercado en texto plano (SSR) — cifras disponibles para Googlebot e IA
  // sin ejecutar JS. Mismos campos/formato que los KPIs del chart (ZoneAnalytics).
  const zs = zoneDetail.score;
  const fmtMoney = (n: number | null | undefined) =>
    n != null ? `$${Math.round(n).toLocaleString('en-US')}` : null;
  const summaryStats = zs
    ? [
        {
          label: isEn ? 'Median occupancy' : 'Ocupación media',
          value: zs.median_occupancy != null ? `${Math.round(zs.median_occupancy)}%` : null,
        },
        { label: isEn ? 'Average daily rate (ADR)' : 'Tarifa diaria promedio (ADR)', value: fmtMoney(zs.median_adr) },
        { label: 'RevPAR', value: fmtMoney(zs.revpar) },
        {
          label: isEn ? 'Active listings' : 'Propiedades activas',
          value: zs.active_listings != null ? zs.active_listings.toLocaleString(isEn ? 'en-US' : 'es-MX') : null,
        },
        {
          label: isEn ? 'Zone intelligence score' : 'Score de inteligencia de zona',
          value: zs.score != null ? `${Math.round(zs.score)}/100` : null,
        },
      ].filter((x) => x.value != null)
    : [];
  const summaryUpdated = zs?.computed_at
    ? new Date(zs.computed_at).toLocaleDateString(isEn ? 'en-US' : 'es-MX', { month: 'long', year: 'numeric' })
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-600 mb-6">
          <a href={`/${locale}`} className="hover:text-gray-700">
            {tProp('breadcrumbHome')}
          </a>
          {' / '}
          <a href={`/${locale}/zonas`} className="hover:text-gray-700">
            {tZonas('breadcrumbZones')}
          </a>
          {' / '}
          <span className="text-gray-900 font-medium">{zone}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {zone}
          </h1>
          <p className="text-lg text-gray-600 mt-1">
            {city} &middot; {tZonas('vacationMarketIntelligence')}
          </p>
        </div>

        {/* Resumen de mercado en texto (SSR) — extraíble por Googlebot/IA sin JS */}
        {summaryStats.length > 0 && (
          <section className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {isEn
                ? `Vacation rental market in ${zone}, ${city}`
                : `Mercado de renta vacacional en ${zone}, ${city}`}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {isEn
                ? `Key short-term rental indicators for ${zone}, ${city}, ${state}, based on AirDNA market data${summaryUpdated ? ` (updated ${summaryUpdated})` : ''}:`
                : `Indicadores clave de renta vacacional en ${zone}, ${city}, ${state}, con datos de mercado de AirDNA${summaryUpdated ? ` (actualizado a ${summaryUpdated})` : ''}:`}
            </p>
            <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              {summaryStats.map((stat) => (
                <div key={stat.label} className="flex justify-between border-b border-gray-100 py-1">
                  <dt className="text-gray-600">{stat.label}</dt>
                  <dd className="font-semibold text-gray-900">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Foto de la zona — Hub › Materiales (zona.generic); fallback a placeholder */}
        <SiteMedia mediaKey="zona.generic" locale={locale} label={`Foto de ${zone}, ${city}`} className="h-44 md:h-56 mb-8" sizes="(max-width: 1024px) 100vw, 1024px" />

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
