import Link from 'next/link';
import Image from 'next/image';
import { getTranslations, getLocale } from 'next-intl/server';
import { ArrowRight, MapPin, Bed, Bath, Maximize } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

export interface FeaturedDevelopment {
  id: string;
  slug: string;
  name: string;
  city: string;
  zone?: string;
  stage?: string;
  price_min_mxn?: number;
  images?: string[];
  property_types?: string[];
  bedrooms_min?: number;
  bathrooms_min?: number;
  area_min?: number;
  roi_estimated?: number;
}

interface FeaturedPropertiesProps {
  developments?: FeaturedDevelopment[];
}

export default async function FeaturedProperties({ developments = [] }: FeaturedPropertiesProps) {
  const t = await getTranslations('featured');
  const tStages = await getTranslations('stages');
  const locale = await getLocale();
  const items = developments.slice(0, 6);
  if (items.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">{t('title')}</h2>
            <p className="text-gray-500 mt-1">{t('subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/desarrollos`}
            className="hidden md:flex items-center gap-1.5 text-[#0D9488] font-semibold hover:underline"
          >
            {t('viewAll')} <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">{t('loading')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((dev) => (
              <Link
                key={dev.id}
                href={`/${locale}/desarrollos/${dev.slug}`}
                className="group block"
              >
                <article className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {dev.images?.[0] ? (
                      <Image
                        src={dev.images[0]}
                        alt={`${dev.name} - ${dev.city}`}
                        fill
                        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                    )}
                    {dev.stage && (
                      <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md shadow-sm ${
                          dev.stage === 'preventa'
                            ? 'bg-[#F5A623] text-white'
                            : dev.stage === 'construccion'
                            ? 'bg-[#22C55E] text-white'
                            : 'bg-[#5CE0D2] text-white'
                        }`}>
                          {tStages(dev.stage)}
                        </span>
                      </div>
                    )}
                    {dev.images && dev.images.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm">
                        {dev.images.length} {t('photos')}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {dev.price_min_mxn && dev.price_min_mxn > 0 && (
                      <div className="text-xl font-bold text-[#2C2C2C] mb-1">
                        {t('from')} {formatPrice(dev.price_min_mxn)}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                      {dev.bedrooms_min && dev.bedrooms_min > 0 && (
                        <span className="flex items-center gap-1">
                          <Bed size={14} /> <strong>{dev.bedrooms_min}</strong> {t('bedShort')}
                        </span>
                      )}
                      {dev.bathrooms_min && dev.bathrooms_min > 0 && (
                        <span className="flex items-center gap-1">
                          <Bath size={14} /> <strong>{dev.bathrooms_min}</strong> {t('bathShort')}
                        </span>
                      )}
                      {dev.area_min && dev.area_min > 0 && (
                        <span className="flex items-center gap-1">
                          <Maximize size={14} /> <strong>{dev.area_min}</strong> m²
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-[#2C2C2C] text-sm mb-1 line-clamp-1">
                      {dev.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={12} />
                      <span>{dev.zone ? `${dev.zone}, ` : ''}{dev.city}</span>
                    </div>

                    {dev.roi_estimated && dev.roi_estimated > 0 && (
                      <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 bg-[#5CE0D2]/10 text-[#4BCEC0] text-xs font-bold rounded-full">
                        {t('roiAnnual', { value: dev.roi_estimated })}
                      </div>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link
            href={`/${locale}/desarrollos`}
            className="inline-flex items-center gap-1 text-[#0D9488] font-semibold"
          >
            {t('viewAll')} <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
