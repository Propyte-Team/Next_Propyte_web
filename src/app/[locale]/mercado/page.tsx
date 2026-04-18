import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getZoneScores } from '@/lib/supabase/queries';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { MercadoHero } from './components/MercadoHero';
import { TabBar } from './components/TabBar';
import { VacacionalTab } from './components/vacacional/VacacionalTab';
import { TradicionalTab } from './components/tradicional/TradicionalTab';
import { MethodologySection } from './components/shared/MethodologySection';
import { AdvisorCTA } from './components/shared/AdvisorCTA';
import type { TabId } from '@/lib/rental-data/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';

  const title = isEn
    ? 'Rental Market Intelligence — Vacation & Traditional Rentals in Mexico | Propyte'
    : 'Inteligencia de Mercado — Rentas Vacacionales y Tradicionales en México | Propyte';
  const description = isEn
    ? 'Analyze vacation and traditional rental markets in Cancun, Playa del Carmen, Tulum, CDMX and Merida. +2M records, 10,000+ comparables, daily updates.'
    : 'Analiza el mercado de rentas vacacionales y tradicionales en Cancún, Playa del Carmen, Tulum, CDMX y Mérida. +2M registros, 10,000+ comparables, actualización diaria.';

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', locale: isEn ? 'en_US' : 'es_MX' },
    alternates: {
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

  // Pre-fetch STR data for vacacional tab
  const supabase = await createServerSupabaseClient();
  const strScores = activeTab === 'vacacional' && supabase ? await getZoneScores(supabase) : [];

  // STR stats for hero
  const strStats = strScores.length > 0
    ? {
        zones: strScores.length,
        listings: strScores.reduce((s, z) => s + (z.active_listings ?? 0), 0),
        cities: new Set(strScores.map((z) => z.city)).size,
        updatedAt: strScores[0]?.computed_at || '',
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
    <CurrencyProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <MercadoHero activeTab={activeTab} locale={locale} strStats={strStats} />

      <Suspense>
        <TabBar activeTab={activeTab} locale={locale} />
      </Suspense>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'vacacional' && (
          <VacacionalTab scores={strScores} locale={locale} initialCity={city} />
        )}
        {activeTab === 'tradicional' && (
          <TradicionalTab locale={locale} />
        )}
      </main>

      <MethodologySection activeTab={activeTab} locale={locale} />
      <AdvisorCTA activeTab={activeTab} locale={locale} />
    </CurrencyProvider>
  );
}
