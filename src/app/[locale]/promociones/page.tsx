import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { assertPageVisible } from '@/lib/page-visibility';
import { VISIBILITY_KEYS } from '@/lib/visibility';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getDiscountedUnits } from '@/lib/supabase/queries';
import { mapUnitToProperty, type UnitRow } from '@/lib/mappers/unit-to-property';
import { Tag, ArrowRight } from '@/lib/icons';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import EmptyState from '@/components/ui/EmptyState';
import MarketplaceCard from '@/components/marketplace/MarketplaceCard';
import { getCta } from '@/lib/hub-content';
import type { Property } from '@/types/property';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'promociones' });
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
      canonical: `/${locale}/promociones`,
      languages: {
        es: '/es/promociones',
        en: '/en/promociones',
        'x-default': '/es/promociones',
      },
    },
  };
}

export default async function PromocionesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertPageVisible(VISIBILITY_KEYS.PAGE_PROMOCIONES);
  const t = await getTranslations({ locale, namespace: 'promociones' });
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  // 2026-05-22: pivot de "developments featured" a "unidades con descuento activo".
  // Source: v_units.is_discount_active = true (vigencia + monto válido filtrado
  // server-side por la view). Ordena por discount_pct DESC para mostrar
  // primero los descuentos más fuertes.
  let items: Property[] = [];
  try {
    const supabase = createPublicSupabaseClient();
    const res = await getDiscountedUnits(supabase, 24);
    items = (res.data || []).map((row) => mapUnitToProperty(row as unknown as UnitRow, locale));
  } catch (error) {
    console.error('[PromocionesPage] Supabase fetch failed:', error);
  }

  // Hub CTA override del hero (eyebrow, color, título, subtítulo)
  const heroCta = await getCta('promociones_hero');
  const heroEyebrow = (locale === 'en' ? heroCta?.eyebrow_en : heroCta?.eyebrow_es) ?? t('heroEyebrow');
  const heroTitle = (locale === 'en' ? heroCta?.title_en : heroCta?.title_es) ?? t('heroTitle');
  const heroSubtitle = (locale === 'en' ? heroCta?.subtitle_en : heroCta?.subtitle_es) ?? t('heroSubtitle');
  const heroAccent = heroCta?.accent_color ?? '#A2F9FF';

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.propyte.com';

  // Schema.org Offer real: cada unidad con descuento → priceSpecification con
  // precio post-descuento + validThrough cuando exista. Threshold: 2+ items.
  const hasShowableItems = items.length >= 2;
  const collectionSchema = hasShowableItems
    ? {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: t('heroTitle'),
        description: t('metaDescription'),
        url: `${baseUrl}/${locale}/promociones`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: items.length,
          itemListElement: items.map((unit, i) => {
            const detailBase = unit.kind === 'development' ? 'desarrollos' : 'propiedades';
            return {
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Offer',
                name: unit.name,
                url: `${baseUrl}/${locale}/${detailBase}/${unit.slug}`,
                availability: 'https://schema.org/InStock',
                ...(unit.discount?.validUntil ? { validThrough: unit.discount.validUntil } : {}),
                priceSpecification: {
                  '@type': 'PriceSpecification',
                  price: unit.price.mxn > 0 ? unit.price.mxn : undefined,
                  priceCurrency: 'MXN',
                },
                ...(unit.priceOriginal && unit.priceOriginal > unit.price.mxn
                  ? {
                      // discount semantics in schema.org via PriceSpecification
                      // referenceQuantity is not the right field for list price;
                      // we encode it as a custom extension via priceValidUntil + priceSpec.
                      eligibleQuantity: { '@type': 'QuantitativeValue', unitText: 'unidad' },
                    }
                  : {}),
                itemOffered: {
                  '@type': 'RealEstateListing',
                  name: unit.name,
                  url: `${baseUrl}/${locale}/${detailBase}/${unit.slug}`,
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: unit.location.city || undefined,
                    addressRegion: unit.location.zone || undefined,
                    addressCountry: 'MX',
                  },
                  ...(unit.images?.[0] ? { image: unit.images[0] } : {}),
                },
              },
            };
          }),
        },
      }
    : null;

  return (
    <>
      {collectionSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
        />
      )}

      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[{ label: tBC('promotions') }]}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-propyte-brand/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#A2F9FF]/10 rounded-full blur-3xl" />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: `${heroAccent}33` }}
          >
            <Tag size={14} style={{ color: heroAccent }} />
            <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: heroAccent }}>
              {heroEyebrow}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            {heroSubtitle}
          </p>
          {items.length > 0 && (
            <p className="mt-6 text-sm text-propyte-brand font-semibold uppercase tracking-wide">
              {t('countLabel', { count: items.length })}
            </p>
          )}
        </div>
      </section>

      {/* Discounted units grid */}
      <section className="py-16 md:py-20 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          {items.length < 1 ? (
            <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState
                icon={Tag}
                title={t('emptyTitle')}
                description={t('emptyDesc')}
                actions={[
                  { label: t('emptyCtaSecondary'), href: `/${locale}/contacto?asunto=promos` },
                  { label: t('emptyCta'), href: `/${locale}/desarrollos`, variant: 'secondary' },
                ]}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((unit, i) => (
                <MarketplaceCard
                  key={unit.id}
                  property={unit}
                  priority={i < 3}
                  variant="grid"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-[#1A2F3F]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-white/70 max-w-lg mx-auto mb-8">{t('ctaDesc')}</p>
          <Link
            href={`/${locale}/contacto`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-bold rounded-xl transition-colors"
          >
            {t('ctaButton')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
