import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getDevelopments } from '@/lib/supabase/queries';
import { mapDevelopmentToProperty, type DevelopmentRow } from '@/lib/mappers/development-to-property';
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
  const tBC = await getTranslations({ locale, namespace: 'breadcrumbs' });

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
        properties = rawDevs.map(mapDevelopmentToProperty);
      }
    }
  } catch (error) {
    console.error('[TaxonomyDevelopmentsPage] getDevelopments failed:', error);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.propyte.com';

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description: subtitle,
    url: `${baseUrl}/${locale}${canonicalPath}`,
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
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4">
        <nav className="flex items-center gap-1 text-xs text-gray-600">
          <Link href={`/${locale}`} className="hover:text-[#0E7490]">
            {tBC('home')}
          </Link>
          <ChevronRight size={12} />
          <Link href={`/${locale}/desarrollos`} className="hover:text-[#0E7490]">
            {tBC('developments')}
          </Link>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-medium">{termLabel}</span>
        </nav>
      </div>
      <MarketplaceContent
        properties={properties}
        customTitle={title}
        customSubtitle={subtitle}
      />
    </>
  );
}
