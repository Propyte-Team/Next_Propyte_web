import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getExclusiveDevelopments } from '@/lib/supabase/queries';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import ExclusivosShowcase, { type ExclusiveDev } from '@/components/exclusivos/ExclusivosShowcase';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'exclusivos' });
  const title = t('heroTitle');
  const brandedTitle = `${title} | Propyte`;
  const description = t('metaDescription');
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title: brandedTitle,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
    },
    twitter: { card: 'summary_large_image', title: brandedTitle, description },
    alternates: {
      canonical: `/${locale}/exclusivos`,
      languages: {
        es: '/es/exclusivos',
        en: '/en/exclusivos',
        'x-default': '/es/exclusivos',
      },
    },
  };
}

export default async function ExclusivosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'exclusivos' }),
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  let items: ExclusiveDev[] = [];
  try {
    const supabase = await createServerSupabaseClient();
    const res = await getExclusiveDevelopments(supabase, 24);
    items = (res.data as ExclusiveDev[] | null) || [];
  } catch (error) {
    console.error('[ExclusivosPage] Supabase fetch failed:', error);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.propyte.com';

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('heroTitle'),
    description: t('metaDescription'),
    url: `${baseUrl}/${locale}/exclusivos`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((dev, i) => ({
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[{ label: t('breadcrumb') }]}
      />

      <ExclusivosShowcase items={items} locale={locale} />
    </>
  );
}
