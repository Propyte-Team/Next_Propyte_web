import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getZoneScores } from '@/lib/supabase/queries';
import { ZonasExplorer } from './ZonasExplorer';
import { assertPageVisible } from '@/lib/page-visibility';
import { VISIBILITY_KEYS } from '@/lib/visibility';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'zonas' });

  const title = t('metaTitle');
  const description = t('metaDescription');

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', locale: locale === 'en' ? 'en_US' : 'es_MX' },
    alternates: {
      languages: { es: '/es/zonas', en: '/en/zonas', 'x-default': '/es/zonas' },
    },
  };
}

export default async function ZonasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await assertPageVisible(VISIBILITY_KEYS.PAGE_ZONAS);
  const t = await getTranslations({ locale, namespace: 'zonas' });

  // Fetch ALL zone scores (no city filter)
  const supabase = await createServerSupabaseClient();
  const allScores = supabase ? await getZoneScores(supabase) : [];

  // Get unique cities
  const cities = [...new Set(allScores.map((s) => s.city))].sort();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('schemaName'),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-sm text-gray-600 mb-6">
          <a href={`/${locale}`} className="hover:text-gray-700">
            {t('breadcrumbHome')}
          </a>
          {' / '}
          <span className="text-gray-900 font-medium">{t('breadcrumbZones')}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('h1')}</h1>
          <p className="text-lg text-gray-600 mt-1">{t('subtitle')}</p>
        </div>

        <ZonasExplorer
          scores={allScores}
          cities={cities}
          locale={locale}
        />

        <div className="mt-12 bg-gray-50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('methodology')}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{t('methodologyText')}</p>
        </div>
      </main>
    </>
  );
}
