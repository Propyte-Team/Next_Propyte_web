import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getZoneScores } from '@/lib/supabase/queries';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
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
  const { getTranslations } = await import('next-intl/server');
  const t = await getTranslations({ locale, namespace: 'mercadoMeta' });

  const title = t('title');
  const brandedTitle = `${title} | Propyte`;
  const description = t('description');

  return {
    title,
    description,
    openGraph: {
      title: brandedTitle,
      description,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
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
  if (!supabase) console.error('[MercadoPage] createServerSupabaseClient returned null — check env vars');
  const strScores = activeTab === 'vacacional' && supabase ? await getZoneScores(supabase) : [];
  console.log(`[MercadoPage] strScores after filter: ${strScores.length} zones`);

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

      <MercadoHero activeTab={activeTab} locale={locale} strStats={strStats} />

      <Suspense>
        <TabBar activeTab={activeTab} locale={locale} />
      </Suspense>

      <main className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'vacacional' && (
          <VacacionalTab scores={strScores} locale={locale} initialCity={city} />
        )}
        {activeTab === 'tradicional' && (
          <TradicionalTab locale={locale} />
        )}
        </div>
      </main>

      <MethodologySection activeTab={activeTab} locale={locale} />
      <AdvisorCTA activeTab={activeTab} locale={locale} />
    </>
  );
}
