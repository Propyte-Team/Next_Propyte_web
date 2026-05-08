import Link from 'next/link';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getFeaturedDevelopments } from '@/lib/supabase/queries';
import { formatPrice } from '@/lib/formatters';
import { MapPin, Building2, Tag, ArrowRight } from 'lucide-react';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import EmptyState from '@/components/ui/EmptyState';
import { getCta } from '@/lib/hub-content';

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

interface PromoDev {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  zone?: string | null;
  stage?: string | null;
  price_min_mxn?: number | null;
  price_mxn?: number | null;
  images?: string[] | null;
  roi_estimated?: number | null;
  roi_projected?: number | null;
}

export default async function PromocionesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'promociones' });
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  let items: PromoDev[] = [];
  try {
    const supabase = await createServerSupabaseClient();
    const res = await getFeaturedDevelopments(supabase, 12);
    items = ((res.data as PromoDev[] | null) || []).slice(0, 12);
  } catch (error) {
    console.error('[PromocionesPage] Supabase fetch failed:', error);
  }

  // Hub CTA override del hero (eyebrow, color, título, subtítulo)
  const heroCta = await getCta('promociones_hero');
  const heroEyebrow = (locale === 'en' ? heroCta?.eyebrow_en : heroCta?.eyebrow_es) ?? t('heroEyebrow');
  const heroTitle = (locale === 'en' ? heroCta?.title_en : heroCta?.title_es) ?? t('heroTitle');
  const heroSubtitle = (locale === 'en' ? heroCta?.subtitle_en : heroCta?.subtitle_es) ?? t('heroSubtitle');
  const heroAccent = heroCta?.accent_color ?? '#F5A623';

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.propyte.com';

  // Offers valid 90 days from now (referential — no real expiration in data yet).
  // eslint-disable-next-line react-hooks/purity -- server component; Date.now() is per-request, not per-render
  const validThrough = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Solo emitir CollectionPage + Offers cuando hay 2+ promos reales — el
  // mismo threshold que la UI (items.length < 2 → empty state). Si la UI
  // oculta AZUL VIVO, el JSON-LD tampoco debe declararlo: Google Rich
  // Results podría mostrar la oferta y el usuario llegaría al empty state.
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
          itemListElement: items.map((dev, i) => {
            const price = dev.price_min_mxn ?? dev.price_mxn ?? 0;
            return {
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Offer',
                name: dev.name,
                url: `${baseUrl}/${locale}/desarrollos/${dev.slug}`,
                availability: 'https://schema.org/InStock',
                validThrough,
                priceSpecification: {
                  '@type': 'PriceSpecification',
                  price: price > 0 ? price : undefined,
                  priceCurrency: 'MXN',
                },
                itemOffered: {
                  '@type': 'RealEstateListing',
                  name: dev.name,
                  url: `${baseUrl}/${locale}/desarrollos/${dev.slug}`,
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: dev.city || undefined,
                    addressRegion: dev.zone || undefined,
                    addressCountry: 'MX',
                  },
                  ...(dev.images?.[0] ? { image: dev.images[0] } : {}),
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
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#5CE0D2]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-3xl" />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: `${heroAccent}33` }}
          >
            <Tag size={14} strokeWidth={2} style={{ color: heroAccent }} />
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
            <p className="mt-6 text-sm text-[#5CE0D2] font-semibold uppercase tracking-wide">
              {t('countLabel', { count: items.length })}
            </p>
          )}
        </div>
      </section>

      {/* Promotions grid */}
      <section className="py-16 md:py-20 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          {items.length < 2 ? (
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
              {items.map((dev) => {
                const price = dev.price_min_mxn ?? dev.price_mxn ?? 0;
                const roi = dev.roi_estimated ?? dev.roi_projected ?? 0;
                return (
                  <Link
                    key={dev.id}
                    href={`/${locale}/desarrollos/${dev.slug}`}
                    className="group bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all overflow-hidden h-full flex flex-col"
                  >
                    <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                      {dev.images?.[0] ? (
                        <Image
                          src={dev.images[0]}
                          alt={`${dev.name} — ${dev.city ?? ''}`}
                          fill
                          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Building2 size={36} className="text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#F5A623] to-[#FF8C00] px-4 py-2 text-white text-xs font-bold uppercase tracking-wider text-center">
                        {t('featuredLabel')}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-[#1A2F3F] group-hover:text-[#0F766E] transition-colors mb-1 line-clamp-1">
                        {dev.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <MapPin size={14} />
                        <span>
                          {dev.zone ? `${dev.zone}, ` : ''}
                          {dev.city}
                        </span>
                      </div>
                      {price > 0 && (
                        <div className="font-bold text-lg text-[#1A2F3F]">
                          {t('fromLabel')} {formatPrice(price)}
                        </div>
                      )}
                      {roi > 0 && (
                        <div className="mt-2 inline-flex self-start items-center px-2 py-0.5 bg-[#5CE0D2]/10 text-[#0F766E] text-xs font-bold rounded-full">
                          {t('roiBadge')} {roi}%
                        </div>
                      )}
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] group-hover:underline">
                          {t('viewCta')} <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold rounded-xl transition-colors"
          >
            {t('ctaButton')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
