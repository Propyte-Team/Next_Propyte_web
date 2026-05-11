import Link from 'next/link';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, MapPin, Bed, Bath, Maximize, Sparkles } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getFeaturedDevelopments } from '@/lib/supabase/queries';
import { formatPrice } from '@/lib/formatters';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { getCta } from '@/lib/hub-content';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'destacados' });
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
      canonical: `/${locale}/destacados`,
      languages: {
        es: '/es/destacados',
        en: '/en/destacados',
        'x-default': '/es/destacados',
      },
    },
  };
}

interface FeaturedDev {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  zone?: string | null;
  stage?: string | null;
  price_min_mxn?: number | null;
  images?: string[] | null;
  bedrooms_min?: number | null;
  bathrooms_min?: number | null;
  area_min?: number | null;
  roi_estimated?: number | null;
}

export default async function DestacadosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'destacados' });
  const tStages = await getTranslations({ locale, namespace: 'stages' });
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  let items: FeaturedDev[] = [];
  try {
    const supabase = await createServerSupabaseClient();
    const res = await getFeaturedDevelopments(supabase, 12);
    items = ((res.data as FeaturedDev[] | null) || []).slice(0, 12);
  } catch (error) {
    console.error('[DestacadosPage] Supabase fetch failed:', error);
  }

  // Hub CTA override del hero
  const heroCta = await getCta('destacados_hero');
  const heroEyebrow = (locale === 'en' ? heroCta?.eyebrow_en : heroCta?.eyebrow_es) ?? t('heroEyebrow');
  const heroTitle = (locale === 'en' ? heroCta?.title_en : heroCta?.title_es) ?? t('heroTitle');
  const heroSubtitle = (locale === 'en' ? heroCta?.subtitle_en : heroCta?.subtitle_es) ?? t('heroSubtitle');
  const heroAccent = heroCta?.accent_color ?? '#A2F9FF';

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.propyte.com';

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('heroTitle'),
    description: t('metaDescription'),
    url: `${baseUrl}/${locale}/destacados`,
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
            ? {
                offers: {
                  '@type': 'Offer',
                  price: dev.price_min_mxn,
                  priceCurrency: 'MXN',
                },
              }
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
        items={[{ label: tBC('featured') }]}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-propyte-cyan-100 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-propyte-cyan-100/60 rounded-full blur-3xl" />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: `${heroAccent}26` }}
          >
            <Sparkles size={14} strokeWidth={2} style={{ color: heroAccent }} />
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

      {/* Featured grid */}
      <section className="py-16 md:py-20 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          {items.length === 0 ? (
            <div className="max-w-md mx-auto text-center bg-white p-10 rounded-xl border border-gray-100">
              <h2 className="text-xl font-bold text-[#1A2F3F] mb-2">{t('emptyTitle')}</h2>
              <p className="text-sm text-gray-600 mb-6">{t('emptyDesc')}</p>
              <Link
                href={`/${locale}/desarrollos`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-bold rounded-xl transition-colors"
              >
                {t('viewAll')}
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((dev) => (
                <Link
                  key={dev.id}
                  href={`/${locale}/desarrollos/${dev.slug}`}
                  className="group block"
                >
                  <article className="propyte-card-glass-light propyte-card-hover-glow overflow-hidden h-full flex flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {dev.images?.[0] ? (
                        <Image
                          src={dev.images[0]}
                          alt={`${dev.name} — ${dev.city ?? ''}`}
                          fill
                          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                      )}
                      {dev.stage && (
                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md shadow-sm ${
                              dev.stage === 'preventa'
                                ? 'bg-[#0D9488] text-white'
                                : dev.stage === 'construccion'
                                  ? 'bg-[#22C55E] text-white'
                                  : 'bg-propyte-brand text-[#0F1923]'
                            }`}
                          >
                            {(() => { try { return tStages(dev.stage as 'preventa'); } catch { return dev.stage; } })()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      {dev.price_min_mxn && dev.price_min_mxn > 0 && (
                        <div className="text-xl font-bold text-[#1A2F3F] mb-1">
                          {t('from')} {formatPrice(dev.price_min_mxn)}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                        {dev.bedrooms_min != null && dev.bedrooms_min > 0 && (
                          <span className="flex items-center gap-1">
                            <Bed size={14} /> <strong>{dev.bedrooms_min}</strong>
                          </span>
                        )}
                        {dev.bathrooms_min != null && dev.bathrooms_min > 0 && (
                          <span className="flex items-center gap-1">
                            <Bath size={14} /> <strong>{dev.bathrooms_min}</strong>
                          </span>
                        )}
                        {dev.area_min != null && dev.area_min > 0 && (
                          <span className="flex items-center gap-1">
                            <Maximize size={14} /> <strong>{dev.area_min}</strong> m²
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-[#1A2F3F] text-base mb-1 line-clamp-1">
                        {dev.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin size={12} />
                        <span>
                          {dev.zone ? `${dev.zone}, ` : ''}
                          {dev.city}
                        </span>
                      </div>

                      {dev.roi_estimated != null && dev.roi_estimated > 0 && (
                        <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 bg-propyte-cyan-100 text-[#0F766E] text-xs font-bold rounded-full self-start">
                          {t('roiBadge')} {dev.roi_estimated}%
                        </div>
                      )}

                      <div className="mt-auto pt-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] group-hover:underline">
                          {t('viewProperty')} <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
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
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/desarrollos`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-bold rounded-xl transition-colors"
            >
              {t('ctaAll')}
              <ArrowRight size={18} />
            </Link>
            <Link
              href={`/${locale}/mercado`}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-colors"
            >
              {t('ctaMercado')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
