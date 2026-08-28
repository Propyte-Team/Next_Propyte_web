import { precioDesarrollo, type FilaPrecioDesarrollo } from '@/lib/precio-moneda';
import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getDevelopments } from '@/lib/supabase/queries';
import { mapDevelopmentToProperty, type DevelopmentRow } from '@/lib/mappers/development-to-property';
import { attachDevelopmentUnitAggregates } from '@/lib/supabase/development-aggregates';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import MarketplaceContent from '@/app/[locale]/propiedades/MarketplaceContent';
import type { Property } from '@/types/property';

interface TaxonomyDevelopmentsPageProps {
  locale: string;
  /** Crumb label for the taxonomy term (e.g. "Departamentos", "Preventa"). */
  termLabel: string;
  /** H1 heading shown above the marketplace. */
  title: string;
  /** Subtitle paragraph with SEO copy. */
  subtitle: string;
  /** Supabase filter to apply server-side. Pass exactly one of `type` or `stage`. */
  filter: { type: string } | { stage: string };
  /** Canonical URL path (without locale prefix). */
  canonicalPath: string;
}

export default async function TaxonomyDevelopmentsPage({
  locale,
  termLabel,
  title,
  subtitle,
  filter,
  canonicalPath,
}: TaxonomyDevelopmentsPageProps) {
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  let properties: Property[] = [];
  let rawDevs: DevelopmentRow[] = [];

  try {
    // Cookie-less client — pages declare `revalidate` + generateStaticParams,
    // and `cookies()` would break ISR (DYNAMIC_SERVER_USAGE error).
    const supabase = createPublicSupabaseClient();
    if (supabase) {
      const { data } = await getDevelopments(supabase, { ...filter, limit: 100, orderBy: 'newest' });
      if (data) {
        rawDevs = data as DevelopmentRow[];
        // Mismos agregados de v_units que /desarrollos: recámaras, tipos de
        // unidad del inventario y área mínima.
        await attachDevelopmentUnitAggregates(supabase, rawDevs);
        properties = rawDevs.map((d) => mapDevelopmentToProperty(d, locale));
      }
    }
  } catch (error) {
    console.error('[TaxonomyDevelopmentsPage] getDevelopments failed:', error);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://propyte.com';

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description: subtitle,
    url: `${baseUrl}/${locale}${canonicalPath}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: rawDevs.length,
      itemListElement: rawDevs.slice(0, 30).map((dev, i) => {
        const precio = precioDesarrollo(dev as FilaPrecioDesarrollo);
        return {
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
          // La moneda sale del dato, no de una constante: un priceCurrency fijo
          // en 'MXN' publicaba los desarrollos en USD con la moneda equivocada.
          ...(precio.min != null
            ? { offers: { '@type': 'Offer', price: precio.min, priceCurrency: precio.moneda } }
            : {}),
          ...(dev.images?.[0] ? { image: dev.images[0] } : {}),
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
        items={[
          { label: tBC('developments'), href: `/${locale}/desarrollos` },
          { label: termLabel },
        ]}
      />
      <MarketplaceContent
        properties={properties}
        customTitle={title}
        customSubtitle={subtitle}
      />
    </>
  );
}
