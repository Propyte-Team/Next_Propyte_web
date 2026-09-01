import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getZoneScores } from '@/lib/supabase/queries';
import { getRentalAnalysis } from '@/lib/rental-data/analysis';
import { partitionByPool } from '@/lib/rental-data/pools';
import { oldestDataThrough } from '@/lib/rental-data/zone-metrics';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { MercadoHero } from './components/MercadoHero';
import { TabBar } from './components/TabBar';
import { VacacionalTab } from './components/vacacional/VacacionalTab';
import { TradicionalTab } from './components/tradicional/TradicionalTab';
import { MethodologySection } from './components/shared/MethodologySection';
import { AdvisorCTA } from './components/shared/AdvisorCTA';
import type { TabId } from '@/lib/rental-data/types';
import { ogLocaleImages } from '@/lib/og/images';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { getTranslations } = await import('next-intl/server');
  const t = await getTranslations({ locale, namespace: 'mercadoMeta' });

  const title = t('title');
  const brandedTitle = `${title} | Propyte`;
  const description = t('description');

  return {
    title,
    description,
    openGraph: {
      siteName: 'Propyte',
      title: brandedTitle,
      description,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: ogLocaleImages(locale),
    },
    twitter: { card: 'summary_large_image', title: brandedTitle, description },
    alternates: {
      canonical: `/${locale}/mercado`,
      languages: { es: '/es/mercado', en: '/en/mercado', 'x-default': '/es/mercado' },
    },
  };
}

export default async function MercadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; city?: string }>;
}) {
  const { locale } = await params;
  const { tab: tabParam, city } = await searchParams;
  const isEn = locale === 'en';
  const activeTab: TabId = tabParam === 'tradicional' ? 'tradicional' : 'vacacional';
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  // Pre-fetch STR data for vacacional tab
  const supabase = await createServerSupabaseClient();
  const strScores = activeTab === 'vacacional' && supabase ? await getZoneScores(supabase) : [];

  // La tab tradicional tambien se pre-carga en el servidor: su tabla ES el contenido de
  // la pagina, y con el fetch de cliente no llegaba al HTML rastreable.
  const tradicionalData = activeTab === 'tradicional' ? await getRentalAnalysis() : null;

  // STR stats for hero — solo cuenta el pool de ranking. CDMX es referencia,
  // no oferta (ver src/lib/rental-data/pools.ts): 14,266 de 21,115 propiedades
  // (67.6%) eran CDMX, un mercado que la propia página declara fuera de la
  // oferta dos párrafos más abajo.
  const { ranking: strRanking, benchmark: strBenchmark } = partitionByPool(strScores);
  const strStats = strRanking.length > 0
    ? {
        zones: strRanking.length,
        listings: strRanking.reduce((s, z) => s + (z.active_listings ?? 0), 0),
        cities: new Set(strRanking.map((z) => z.city)).size,
        benchmarkListings: strBenchmark.reduce((s, z) => s + (z.active_listings ?? 0), 0),
        // data_through es lo que el dato realmente cubre; computed_at es solo
        // cuando corrió el pipeline (Task 8 review). Y se toma la fecha MÁS
        // ANTIGUA del ranking, no la más reciente: con el máximo, una sola zona
        // refrescada rotulaba el hero entero y apagaba el aviso de serie rancia
        // de las otras 25 todavía congeladas en febrero.
        updatedAt: oldestDataThrough(strRanking),
      }
    : undefined;

  // LTR stats for hero — antes nunca se calculaba, así que en ?tab=tradicional
  // el hero mostraba "Actualizando datos de mercado…" sobre una tabla con
  // 10,695 resultados ya cargados.
  // `getRentalAnalysis` puede devolver un objeto DEGRADADO (no null) cuando la
  // consulta trae cero comparables: con `?? 0` el hero publicaba
  // "0 comparables · 0 desarrollos analizados" como si fueran mediciones. null
  // = sin dato, y MercadoHero oculta la tila (mismo criterio que VacacionalKPIs).
  const nonZero = (n: number | undefined) => (n != null && n > 0 ? n : null);
  const ltrStats = tradicionalData
    ? {
        comparables: nonZero(tradicionalData.total_comparables),
        cities: nonZero(tradicionalData.city_stats?.length),
        developments: nonZero(tradicionalData.developments?.length),
        // data_freshness YA es el max(scraped_at) de los comparables limpios
        // (ver getRentalAnalysis en src/lib/rental-data/analysis.ts) — no hace
        // falta un campo nuevo en AnalysisData.
        updatedAt: tradicionalData.data_freshness ?? null,
      }
    : undefined;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isEn ? 'Propyte — Market Intelligence' : 'Propyte — Inteligencia de Mercado',
    description: isEn
      ? 'Free rental market analysis tool for Mexico'
      : 'Herramienta gratuita de análisis de mercado de rentas en México',
    url: `https://propyte.com/${locale}/mercado`,
    applicationCategory: 'BusinessApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'MXN' },
    areaServed: { '@type': 'Place', name: 'Mexico' },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[{ label: tBC('market') }]}
      />

      <MercadoHero activeTab={activeTab} locale={locale} strStats={strStats} ltrStats={ltrStats} />

      {/* Cuerpo claro debajo del hero oscuro (patrón del sitio: dark hero →
          light body → dark footer). El wrapper dark de MainPadding solo debe
          verse detrás del padding-top/hero; sin este bg-white el fondo oscuro
          se filtraba a todo el contenido y volvía ilegibles la tabla, los KPIs
          y los textos (todos construidos en tema claro). */}
      <div className="bg-white">
        <Suspense>
          <TabBar activeTab={activeTab} locale={locale} />
        </Suspense>

        <main>
          <div
            id={`mercado-tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`mercado-tab-${activeTab}`}
            tabIndex={0}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          >
          {activeTab === 'vacacional' && (
            <VacacionalTab scores={strScores} locale={locale} initialCity={city} />
          )}
          {activeTab === 'tradicional' && (
            <TradicionalTab locale={locale} initialData={tradicionalData} />
          )}
          </div>
        </main>

        <MethodologySection activeTab={activeTab} locale={locale} />
        <AdvisorCTA activeTab={activeTab} locale={locale} />
      </div>
    </>
  );
}
