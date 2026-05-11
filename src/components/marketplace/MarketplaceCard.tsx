'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Heart, ChevronLeft, ChevronRight, MapPin, TrendingUp, Download, GitCompare } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Property, PropertyBadge } from '@/types/property';
import { useCurrency } from '@/context/CurrencyContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useCompare } from '@/hooks/useCompare';
import { toast } from 'sonner';
import { trackAddToWishlist, trackFileDownload, trackSelectContent } from '@/lib/analytics/track';

interface MarketplaceCardProps {
  property: Property;
  priority?: boolean;
}

export default function MarketplaceCard({ property, priority = false }: MarketplaceCardProps) {
  const locale = useLocale();
  const tStages = useTranslations('stages');
  const tMkt = useTranslations('marketplace');
  const tTypes = useTranslations('types');
  const { format } = useCurrency();
  const safeStage = (s: string) => {
    try { return tStages(s as 'preventa'); } catch { return s; }
  };
  const safeType = (t: string) => {
    try { return tTypes(t as 'departamento'); } catch { return t; }
  };
  const [currentImg, setCurrentImg] = useState(0);
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const saved = isFavorite(property.id);
  const { isComparing, toggle: toggleCompare, isFull: compareFull } = useCompare();
  const comparing = isComparing(property.id);

  const intlLocale = locale === 'en' ? 'en-US' : 'es-MX';
  const formattedPrice = format(property.price.mxn);
  const pricePerM2 = property.specs.area > 0 ? Math.round(property.price.mxn / property.specs.area) : null;

  // Price strikethrough — show pre-discount price when meaningfully higher than current.
  const hasDiscount =
    typeof property.priceOriginal === 'number' &&
    property.priceOriginal > property.price.mxn &&
    property.price.mxn > 0;
  const formattedOriginal = hasDiscount ? format(property.priceOriginal!) : null;
  const discountPct = hasDiscount
    ? Math.round(((property.priceOriginal! - property.price.mxn) / property.priceOriginal!) * 100)
    : 0;

  // Promo banner — `validUntil` filtering is done server-side by the mapper.
  const promoText = property.promo
    ? (locale === 'en' ? (property.promo.textEn || property.promo.textEs) : property.promo.textEs)
    : null;
  const showPromo = !!promoText;

  const badgeColors: Record<Exclude<PropertyBadge, null>, string> = {
    preventa: 'bg-[#0D9488]',
    nuevo: 'bg-[#22C55E]',
    construccion: 'bg-[#1A2F3F]',
    entrega_inmediata: 'bg-[#5CE0D2]',
    proximamente: 'bg-[#6366F1]',
    reservado: 'bg-[#0D9488]/80',
    vendido: 'bg-gray-500',
  };

  const detailBase = property.kind === 'unit' ? 'propiedades' : 'desarrollos';

  return (
    <div className="border-b border-r border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-[transform,box-shadow] duration-200 motion-reduce:hover:translate-y-0 motion-reduce:transition-none group">
      <Link
        href={`/${locale}/${detailBase}/${property.slug}`}
        className="block"
        onClick={() =>
          trackSelectContent({
            contentType: 'property_card',
            contentId: property.id,
            contentName: property.name,
          })
        }
      >
        {/* Image with carousel */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          {property.images.map((src, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(${(i - currentImg) * 100}%)` }}
            >
              <Image
                src={src}
                alt={`${property.name} - ${i + 1}`}
                fill
                sizes="(max-width: 1023px) 100vw, 25vw"
                className="object-cover"
                priority={priority && i === 0}
              />
            </div>
          ))}

          {/* Carousel arrows */}
          {property.images.length > 1 && (
            <div
              role="region"
              aria-roledescription="carousel"
              aria-label={property.name}
              className="contents"
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImg(i => (i === 0 ? property.images.length - 1 : i - 1));
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImg(i => (i === property.images.length - 1 ? 0 : i + 1));
                }
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImg(i => (i === 0 ? property.images.length - 1 : i - 1));
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shadow-sm"
                aria-label={tMkt('cardPrevImage')}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImg(i => (i === property.images.length - 1 ? 0 : i + 1));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shadow-sm"
                aria-label={tMkt('cardNextImage')}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Top-right action stack: Save heart + Brochure download */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            <motion.button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const wasSaved = saved;
                toggleFavorite(property.id);
                // Fire only on the off→on transition; un-saving isn't a wishlist signal.
                if (!wasSaved) {
                  trackAddToWishlist({
                    itemId: property.id,
                    itemName: property.name,
                    itemKind: property.kind ?? 'development',
                    priceMxn: property.price.mxn || undefined,
                  });
                }
              }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 500, damping: 17 }}
              className="w-11 h-11 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] rounded-full"
              aria-label={tMkt('cardSave')}
              aria-pressed={saved}
            >
              <motion.span
                key={String(saved)}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 12 }}
                className="inline-flex"
              >
                <Heart
                  size={20}
                  className={`drop-shadow-md transition-colors ${saved ? 'fill-red-500 text-red-500' : 'fill-transparent text-white hover:text-red-300'}`}
                  strokeWidth={2}
                />
              </motion.span>
            </motion.button>
            {property.assets?.brochure && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  trackFileDownload({
                    fileType: 'brochure',
                    fileUrl: property.assets!.brochure!,
                    propertyId: property.id,
                    propertySlug: property.slug,
                  });
                  window.open(property.assets!.brochure!, '_blank', 'noopener,noreferrer');
                }}
                className="w-11 h-11 flex items-center justify-center bg-white/85 hover:bg-white rounded-full shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2]"
                aria-label={tMkt('cardBrochure')}
                title={tMkt('cardBrochure')}
              >
                <Download size={14} strokeWidth={2.25} className="text-[#1A2F3F]" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const kind = property.kind ?? 'development';
                const result = toggleCompare(property.id, kind);
                if (!result.ok && result.reason === 'full') {
                  toast.warning(tMkt('cardCompareFull'));
                } else if (result.ok && result.switched) {
                  toast.info(
                    tMkt('compareReset', {
                      kind: tMkt(kind === 'unit' ? 'compareKind_unit' : 'compareKind_development'),
                    }),
                  );
                }
              }}
              aria-disabled={!comparing && compareFull}
              className={`w-11 h-11 flex items-center justify-center rounded-full shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] ${
                comparing
                  ? 'bg-[#5CE0D2] text-[#0F1923]'
                  : compareFull
                    ? 'bg-white/60 text-[#1A2F3F] opacity-60 hover:bg-white/80'
                    : 'bg-white/85 hover:bg-white text-[#1A2F3F]'
              }`}
              aria-label={tMkt('cardCompare')}
              aria-pressed={comparing}
              title={!comparing && compareFull ? tMkt('cardCompareFull') : tMkt('cardCompare')}
            >
              <GitCompare size={14} strokeWidth={2.25} />
            </button>
          </div>

          {/* Badges: stage (priority property.badge → fallback to stage) + type (units only) */}
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            {(property.badge || property.stage) && (
              <span
                className={`px-2 py-0.5 text-2xs font-bold uppercase text-white rounded ${
                  badgeColors[(property.badge ?? property.stage) as Exclude<PropertyBadge, null>] || 'bg-gray-600'
                }`}
              >
                {safeStage(property.badge ?? property.stage)}
              </span>
            )}
            {property.kind === 'unit' && property.specs.type && (
              <span className="px-2 py-0.5 text-2xs font-bold uppercase rounded bg-white/95 text-[#1A2F3F] backdrop-blur-sm shadow-sm">
                {safeType(property.specs.type)}
              </span>
            )}
          </div>

          {/* Photo indicator dots */}
          {property.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {property.images.slice(0, 5).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentImg ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}

          {/* Promo banner — overlays bottom strip when active */}
          {showPromo && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-[#0D9488] to-[#0B7A6E] px-3 py-1.5 text-white text-2xs font-bold uppercase tracking-wider text-center line-clamp-1">
              {promoText}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          {/* Price + $/m² (+ strikethrough when discounted) */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span data-testid="marketplace-card-price" className="text-lg font-bold text-[#2C2C2C] tabular-nums">{formattedPrice}</span>
            {hasDiscount && (
              <>
                <span className="text-xs text-gray-500 line-through tabular-nums">
                  {formattedOriginal}
                </span>
                <span className="text-2xs font-bold text-[#0F766E] bg-[#5CE0D2]/15 px-1.5 py-0.5 rounded tabular-nums">
                  -{discountPct}%
                </span>
              </>
            )}
            {pricePerM2 !== null && (
              <span className="text-xs text-gray-600 tabular-nums font-medium">
                {format(pricePerM2, { decimals: 0 })}/{tMkt('cardM2Short')}
              </span>
            )}
          </div>

          {/* Specs: solo cuando haya algún valor real (units tienen, developments aggregate no) */}
          {(property.specs.bedrooms > 0 || property.specs.bathrooms > 0 || property.specs.area > 0) && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mt-0.5">
              {property.specs.bedrooms > 0 && (
                <>
                  <span className="font-semibold">{property.specs.bedrooms}</span>
                  <span className="text-gray-600">{tMkt('cardBedShort')}</span>
                  {(property.specs.bathrooms > 0 || property.specs.area > 0) && (
                    <span className="text-gray-300 mx-0.5">|</span>
                  )}
                </>
              )}
              {property.specs.bathrooms > 0 && (
                <>
                  <span className="font-semibold">{property.specs.bathrooms}</span>
                  <span className="text-gray-600">{tMkt('cardBathShort')}</span>
                  {property.specs.area > 0 && <span className="text-gray-300 mx-0.5">|</span>}
                </>
              )}
              {property.specs.area > 0 && (
                <>
                  <span className="font-semibold">{property.specs.area.toLocaleString(intlLocale)}</span>
                  <span className="text-gray-600">m²</span>
                </>
              )}
            </div>
          )}

          {/* Development-only: inventory + delivery */}
          {property.kind === 'development' && (property.inventory || property.delivery) && (
            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
              {property.inventory && property.inventory.available !== undefined && (
                <span>
                  {property.inventory.total
                    ? tMkt('cardAvailableOfTotal', {
                        available: property.inventory.available,
                        total: property.inventory.total,
                      })
                    : tMkt('cardAvailableOnly', { available: property.inventory.available })}
                </span>
              )}
              {property.delivery && (property.delivery.text || property.delivery.estimated) && (
                <>
                  {property.inventory?.available !== undefined && (
                    <span className="text-gray-300">·</span>
                  )}
                  <span>
                    {tMkt('cardDeliveryLabel')}: {property.delivery.text || property.delivery.estimated}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Address */}
          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1 line-clamp-1">
            <MapPin size={10} className="flex-shrink-0" />
            {property.location.zone}, {property.location.city}
          </div>

          {/* Developer attribution */}
          {property.developer && (
            <div className="text-2xs text-gray-600 mt-1.5">{property.developer}</div>
          )}

          {/* Investment metrics row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {property.roi.projected > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-[#5CE0D2]/10 text-[#0F766E] text-2xs font-bold rounded-full tabular-nums">
                ROI {property.roi.projected}%
              </span>
            )}
            {property.roi.appreciation > 0 && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-2xs font-bold rounded-full tabular-nums">
                <TrendingUp size={10} />
                +{property.roi.appreciation}% {tMkt('cardAppreciation')}
              </span>
            )}
            {property.capRate != null && property.capRate > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-[#1A2F3F]/8 text-[#1A2F3F] text-2xs font-bold rounded-full tabular-nums">
                Cap {property.capRate.toFixed(1)}%
              </span>
            )}
            {property.annualRevenue != null && property.annualRevenue > 0 && (
              <span className="text-2xs text-gray-600 font-medium tabular-nums">
                ${(property.annualRevenue / 1000).toFixed(0)}K/{tMkt('cardYearSuffix')}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
