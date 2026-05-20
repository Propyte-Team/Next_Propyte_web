import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDevelopments } from '@/lib/supabase/queries';
import { mapDevelopmentToProperty, type DevelopmentRow } from '@/lib/mappers/development-to-property';
import MarketplaceContent from '@/app/[locale]/propiedades/MarketplaceContent';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import type { Property } from '@/types/property';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === 'en';

  return {
    title: isEn
      ? 'New Developments & Pre-Sales | Riviera Maya, Cancun, Tulum, Merida'
      : 'Nuevos Desarrollos y Preventas | Riviera Maya, Cancun, Tulum, Merida',
    description: isEn
      ? 'Explore new real estate developments in Cancun, Playa del Carmen, Tulum and Merida. Pre-sale prices, delivery dates, and investment analysis.'
      : 'Explora nuevos desarrollos inmobiliarios en Cancun, Playa del Carmen, Tulum y Merida. Precios de preventa, fechas de entrega y análisis de inversión.',
    openGraph: {
      locale: isEn ? 'en_US' : 'es_MX',
      alternateLocale: isEn ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
    },
    alternates: {
      canonical: `/${locale}/desarrollos`,
      languages: {
        es: '/es/desarrollos',
        en: '/en/desarrollos',
        'x-default': '/es/desarrollos',
      },
    },
  };
}

export default async function DesarrollosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  let properties: Property[] = [];
  let rawDevs: DevelopmentRow[] = [];
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data } = await getDevelopments(supabase, { limit: 100, orderBy: 'newest' });
      if (data) {
        rawDevs = data as DevelopmentRow[];

        // Inyectar agregado bedrooms_min/max desde v_units para cada
        // desarrollo. Una sola query bulk: lee bedrooms por development_id
        // de las unidades aprobadas, luego MIN/MAX en JS.
        const devIds = rawDevs.map((d) => d.id);
        if (devIds.length > 0) {
          try {
            const { data: unitsData } = await supabase
              .schema('real_estate_hub' as 'public')
              .from('v_units')
              .select('development_id, bedrooms')
              .in('development_id', devIds)
              .not('approved_at', 'is', null);
            const bedroomsByDev = new Map<string, { min: number; max: number }>();
            (unitsData as Array<{ development_id: string; bedrooms: number | null }> | null)?.forEach((u) => {
              if (!u.development_id || u.bedrooms == null || u.bedrooms <= 0) return;
              const existing = bedroomsByDev.get(u.development_id);
              if (!existing) {
                bedroomsByDev.set(u.development_id, { min: u.bedrooms, max: u.bedrooms });
              } else {
                existing.min = Math.min(existing.min, u.bedrooms);
                existing.max = Math.max(existing.max, u.bedrooms);
              }
            });
            rawDevs.forEach((d) => {
              const br = bedroomsByDev.get(d.id);
              if (br) {
                (d as DevelopmentRow & { bedrooms_min?: number; bedrooms_max?: number }).bedrooms_min = br.min;
                (d as DevelopmentRow & { bedrooms_min?: number; bedrooms_max?: number }).bedrooms_max = br.max;
              }
            });
          } catch (err) {
            console.error('[DesarrollosPage] bedrooms aggregate failed:', err);
          }
        }

        properties = rawDevs.map(mapDevelopmentToProperty);
      }
    }
  } catch (error) {
    console.error('[DesarrollosPage] getDevelopments failed:', error);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.propyte.com';

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: locale === 'en' ? 'New developments and pre-sales' : 'Nuevos desarrollos y preventas',
    url: `${baseUrl}/${locale}/desarrollos`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: rawDevs.length,
      itemListElement: rawDevs.slice(0, 30).map((dev, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'RealEstateListing',
          name: dev.name,
          url: `${baseUrl}/${locale}/desarrollos/${dev.slug}`,
          address: {
            '@type': 'PostalAddress',
            addressLocality: dev.city || undefined,
            addressRegion: dev.zone || undefined,
            addressCountry: 'MX',
          },
          ...(dev.price_min_mxn && dev.price_min_mxn > 0
            ? { offers: { '@type': 'Offer', price: dev.price_min_mxn, priceCurrency: 'MXN' } }
            : {}),
          ...(dev.images?.[0] ? { image: dev.images[0] } : {}),
        },
      })),
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
        items={[{ label: tBC('developments') }]}
      />
      <MarketplaceContent
        properties={properties}
        titleKey="h1Desarrollos"
        subtitleKey="subtitleDesarrollos"
        heroHidden
      />
    </>
  );
}
