'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, GitCompare, MapPin, TrendingUp } from '@/lib/icons';
import type { Property, PropertyBadge } from '@/types/property';
import { useCompare } from '@/hooks/useCompare';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import { trackSelectContent } from '@/lib/analytics/track';

interface MarketplaceCardProps {
  property: Property;
  priority?: boolean;
  /**
   * Sync hover map↔card (solo split /propiedades). Cuando el id de esta card
   * coincide con `hoveredId`, se aplica ring brand + lift. El padre maneja
   * el state compartido entre MapView y PropertyList.
   */
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
  /** Layout variant — pasa desde PropertyList. Compact (split map+list) usa
   *  aspect ratio más corto vertical para que quepan 2x2 en el viewport. */
  variant?: 'compact' | 'grid';
}

export default function MarketplaceCard({
  property,
  priority = false,
  hoveredId,
  onHover,
  variant = 'grid',
}: MarketplaceCardProps) {
  const locale = useLocale();
  const tStages = useTranslations('stages');
  const tMkt = useTranslations('marketplace');
  const tTypes = useTranslations('types');
  const tDevTypes = useTranslations('developmentTypes');
  const safeStage = (s: string) => {
    try { return tStages(s as 'preventa'); } catch { return s; }
  };
  const safeType = (t: string) => {
    try { return tTypes(t as 'departamento'); } catch { return t; }
  };
  const safeDevType = (t: string) => {
    try { return tDevTypes(t as 'mixto'); } catch { return t; }
  };
  const [currentImg, setCurrentImg] = useState(0);
  const { isComparing, toggle: toggleCompare, isFull: compareFull } = useCompare();
  const comparing = isComparing(property.id);
  // Currency dinámica desde CurrencyContext — responde al toggle MXN↔USD
  // global (rate auto desde Banxico SF43718, ver lib/banxico/fetchUsdMxnRate.ts).
  const { format, currency: displayCurrency } = useCurrency();

  // Precio mínimo "Desde X" — el rango max se removió por feedback Luis
  // 2026-05-20 (los dos precios se veían atascados en cards densas).
  const formattedPriceMin = property.price.mxn > 0 ? format(property.price.mxn) : null;

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

  // Audit 2026-05-15: cada badge define su par bg+text para garantizar contraste
  // accesible. Antes era bg-only con `text-white` global, fallaba sobre cyan claro.
  // Preventa: dark + brand (destaca como CTA). Entrega Inmediata: brand + dark.
  const badgeStyles: Record<Exclude<PropertyBadge, null>, string> = {
    preventa: 'bg-[var(--propyte-dark-900)] text-[var(--propyte-brand)]',
    nuevo: 'bg-[#22C55E] text-white',
    construccion: 'bg-[#1A2F3F] text-white',
    entrega_inmediata: 'bg-[var(--propyte-brand)] text-[var(--propyte-dark-900)]',
    proximamente: 'bg-[#6366F1] text-white',
    reservado: 'bg-[#0E7490]/80 text-white',
    vendido: 'bg-gray-500 text-white',
  };

  const detailBase = property.kind === 'unit' ? 'propiedades' : 'desarrollos';

  // Hover sync ring + lift (split /propiedades only). Cuando hoveredId
  // coincide: outline brand cyan visible + subtle translate-y.
  const isHovered = hoveredId === property.id;
  const hoverHighlightClass = isHovered
    ? 'ring-2 ring-propyte-brand ring-offset-2 ring-offset-transparent -translate-y-0.5'
    : '';

  // Tipo desarrollo chip — solo para kind='development' con valor canónico.
  const devTypeLabel = property.kind === 'development' && property.developmentType
    ? safeDevType(property.developmentType)
    : null;

  // Rango bedrooms — solo desarrollos con datos agregados en page query.
  const bedroomsLabel = property.kind === 'development' && property.bedroomsMin != null
    ? (property.bedroomsMax != null && property.bedroomsMax > property.bedroomsMin
        ? tMkt('cardBedroomsRange', { min: property.bedroomsMin, max: property.bedroomsMax })
        : tMkt('cardBedroomsSingle', { count: property.bedroomsMin }))
    : null;

  return (
    <div
      className={`propyte-card-glass-light propyte-card-hover-glow overflow-hidden group transition-transform duration-150 ${hoverHighlightClass}`}
      onMouseEnter={onHover ? () => onHover(property.id) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
    >
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
        {/* Image carousel — aspect dinámico por variant.
            grid (full-width /desarrollos + taxonomies): 16/9 (~1.78:1) →
              cards más altas, más respiro para flechas+compare.
            compact (split /propiedades): 2/1 (~2:1) → más corto vertical
              para que quepan 2×2 en el viewport sin scroll del listado. */}
        <div className={`relative ${variant === 'compact' ? 'aspect-[2/1]' : 'aspect-[16/9]'} overflow-hidden bg-gray-100`}>
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

          {/* Top-right action stack — solo Compare (Heart y Brochure quitados
              2026-05-20 por solicitud Luis). */}
          <div className="absolute top-2 right-2 flex flex-row gap-1.5">
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

          {/* Badge stage (overlay imagen). El chip de tipo desarrollo se movió
              al info section abajo (feedback Luis 2026-05-20: badges encimados
              al overlay se veían apilados). */}
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5">
            {(property.badge || property.stage) && (
              <span
                className={`px-2 py-0.5 text-2xs font-bold uppercase rounded ${
                  badgeStyles[(property.badge ?? property.stage) as Exclude<PropertyBadge, null>] || 'bg-gray-600 text-white'
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
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-[#0E7490] to-[#0B7A6E] px-3 py-1.5 text-white text-2xs font-bold uppercase tracking-wider text-center line-clamp-1">
              {promoText}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          {/* Price — "Desde" chiquito + monto grande + "MXN/USD" chiquito.
              Currency dinámica desde toggle global (rate Banxico). */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {formattedPriceMin && (
              <>
                <span className="text-2xs font-semibold text-gray-500 uppercase tracking-wider">
                  {tMkt('cardPriceFrom')}
                </span>
                <span data-testid="marketplace-card-price" className="text-xl font-bold text-[var(--propyte-dark-900)] tabular-nums">
                  {formattedPriceMin}
                </span>
                <span className="text-2xs font-semibold text-gray-500 tabular-nums">
                  {displayCurrency}
                </span>
              </>
            )}
            {hasDiscount && (
              <>
                <span className="text-xs text-gray-500 line-through tabular-nums">
                  {formattedOriginal}
                </span>
                <span className="text-2xs font-bold text-[#0E7490] bg-[#5CE0D2]/15 px-1.5 py-0.5 rounded tabular-nums">
                  -{discountPct}%
                </span>
              </>
            )}
            {pricePerM2 !== null && (
              <span className="text-xs text-gray-600 tabular-nums font-medium">
                {format(pricePerM2)}/{tMkt('cardM2Short')}
              </span>
            )}
          </div>

          {/* Tipo desarrollo — chip dedicado en info section (no overlay).
              Solo kind='development' con valor canónico. */}
          {devTypeLabel && (
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 text-2xs font-bold uppercase tracking-wider rounded bg-propyte-cyan-100/60 text-[#0E7490] border border-propyte-brand/30">
                {devTypeLabel}
              </span>
            </div>
          )}

          {/* Bedrooms range (developments) — surface aggregated from v_units. */}
          {bedroomsLabel && (
            <div className="text-sm text-[var(--propyte-dark-700)] mt-1 font-semibold tabular-nums">
              {bedroomsLabel}
            </div>
          )}

          {/* Specs: solo cuando haya algún valor real (units tienen, developments aggregate no) */}
          {(property.specs.bedrooms > 0 || property.specs.bathrooms > 0 || property.specs.area > 0) && (
            <div className="flex items-center gap-1 text-base text-[var(--propyte-dark-700)] mt-1">
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
                  <span className="font-semibold">{property.specs.area.toLocaleString(locale === 'en' ? 'en-US' : 'es-MX')}</span>
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
          <div className="flex items-center gap-1.5 text-sm text-[var(--propyte-dark-700)] mt-1 line-clamp-1">
            <MapPin size={12} className="flex-shrink-0" />
            {property.location.zone}, {property.location.city}
          </div>

          {/* Developer attribution */}
          {property.developer && (
            <div className="text-2xs text-gray-600 mt-1">{property.developer}</div>
          )}

          {/* Investment metrics row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {property.roi.projected > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-[#5CE0D2]/10 text-[#0E7490] text-2xs font-bold rounded-full tabular-nums">
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
