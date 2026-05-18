import Link from 'next/link';
import { Building2, MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { formatPrice } from '@/lib/formatters';

export interface SimilarListingItem {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  zone: string | null;
  images: string[] | null;
  price: number | null;
  // Unit-only extras
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
  unitNumber?: string | null;
  developmentName?: string | null;
}

interface SimilarListingsProps {
  items: SimilarListingItem[];
  kind: 'development' | 'unit';
  locale: string;
  title?: string;
}

/**
 * Reusable similar-listings grid. Covers both developments and units via the
 * `kind` discriminator. Card layout adapts: units show bed/bath/area chips
 * and a "development — unit#" heading; developments show "from {price}".
 */
export default async function SimilarListings({ items, kind, locale, title }: SimilarListingsProps) {
  if (!items || items.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'property' });

  const defaultTitle = kind === 'unit' ? t('similarUnits') : t('moreDevelopments');
  const resolvedTitle = title ?? defaultTitle;
  const basePath = kind === 'unit' ? 'propiedades' : 'desarrollos';

  return (
    <section aria-label={resolvedTitle} className="mt-16">
      <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6">{resolvedTitle}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/${locale}/${basePath}/${item.slug}`}
            className="group bg-white rounded-2xl border border-gray-100 hover:border-[#5CE0D2]/40 hover:shadow-md transition-all overflow-hidden"
          >
            <div className="aspect-[4/3] bg-gray-100 relative">
              {item.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 size={36} className="text-gray-300" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-[#2C2C2C] group-hover:text-[#0E7490] transition-colors text-base line-clamp-1">
                {kind === 'unit' && item.developmentName
                  ? `${item.developmentName}${item.unitNumber ? ` · ${item.unitNumber}` : ''}`
                  : item.name}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                <MapPin size={12} />
                <span className="truncate">
                  {item.zone && item.zone !== item.city ? `${item.zone}, ` : ''}
                  {item.city || ''}
                </span>
              </div>

              {kind === 'unit' && (item.bedrooms || item.bathrooms || item.area) && (
                <div className="flex items-center gap-2 mt-2 text-2xs text-gray-600">
                  {item.bedrooms ? <span>{item.bedrooms} {t('bedShort', { count: item.bedrooms })}</span> : null}
                  {item.bathrooms ? <span>· {item.bathrooms} {t('bathAbbrev')}</span> : null}
                  {item.area ? <span>· {item.area} m²</span> : null}
                </div>
              )}

              {item.price != null && item.price > 0 && (
                <div className="mt-2 font-bold text-[#2C2C2C] text-sm">
                  {kind === 'development'
                    ? t('fromPrice', { price: formatPrice(item.price) })
                    : formatPrice(item.price)}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
