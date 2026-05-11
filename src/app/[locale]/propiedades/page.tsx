import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUnits } from '@/lib/supabase/queries';
import { mapUnitToProperty, type UnitRow } from '@/lib/mappers/unit-to-property';
import MarketplaceContent from './MarketplaceContent';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import type { Property } from '@/types/property';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return {
    title: t('marketplaceTitle'),
    description: t('marketplaceDescription'),
    openGraph: {
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
    },
    alternates: {
      canonical: `/${locale}/propiedades`,
      languages: {
        es: '/es/propiedades',
        en: '/en/propiedades',
        'x-default': '/es/propiedades',
      },
    },
  };
}

export default async function MarketplacePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  let properties: Property[] = [];
  let rawUnits: UnitRow[] = [];
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data } = await getUnits(supabase, { limit: 100 });
      if (data) {
        rawUnits = data as UnitRow[];
        properties = rawUnits.map(mapUnitToProperty);
      }
    }
  } catch (error) {
    console.error('[MarketplacePage] getUnits failed:', error);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.propyte.com';

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: locale === 'en' ? 'Property marketplace' : 'Catálogo de propiedades',
    url: `${baseUrl}/${locale}/propiedades`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: rawUnits.length,
      itemListElement: rawUnits.slice(0, 30).map((unit, i) => {
        const u = unit as UnitRow & {
          slug?: string | null;
          name?: string | null;
          unit_number?: string | null;
          price_mxn?: number | null;
          city?: string | null;
          zone?: string | null;
          images?: string[] | null;
        };
        const name = u.name || u.unit_number || 'Unidad';
        const slug = u.slug || '';
        return {
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'RealEstateListing',
            name,
            ...(slug ? { url: `${baseUrl}/${locale}/propiedades/${slug}` } : {}),
            address: {
              '@type': 'PostalAddress',
              addressLocality: u.city || undefined,
              addressRegion: u.zone || undefined,
              addressCountry: 'MX',
            },
            ...(u.price_mxn && u.price_mxn > 0
              ? { offers: { '@type': 'Offer', price: u.price_mxn, priceCurrency: 'MXN' } }
              : {}),
            ...(u.images?.[0] ? { image: u.images[0] } : {}),
          },
        };
      }),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[{ label: tBC('properties') }]}
      />
      <MarketplaceContent properties={properties} showMap />
    </>
  );
}
