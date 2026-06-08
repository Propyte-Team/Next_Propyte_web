'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, GitCompare, MapPin, TrendingUp } from '@/lib/icons';
import type { Property, PropertyBadge } from '@/types/property';
import { useCompare } from '@/hooks/useCompare';
import { useCurrency } from '@/context/CurrencyContext';
import PriceDisplay from '@/components/ui/PriceDisplay';
import DiscountBadge from '@/components/ui/DiscountBadge';
import { toast } from 'sonner';
import { trackSelectContent } from '@/lib/analytics/track';
import { normalizeI18nKey, normalizeDevTypeKey } from '@/lib/i18n/normalizeKey';

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
  const safeStage = (s: string) => tStages(normalizeI18nKey(s) as 'preventa');
  const safeType = (t: string) => tTypes(normalizeI18nKey(t) as 'departamento');
  const safeDevType = (t: string) => tDevTypes(normalizeDevTypeKey(t) as 'mixto');
  const [currentImg, setCurrentImg] = useState(0);
  const { isComparing, toggle: toggleCompare, isFull: compareFull } = useCompare();
  const comparing = isComparing(property.id);
  // Decisión canónica 2026-05-23 (Luis): el sitio no tiene toggle MXN/USD.
  // Cada card muestra precio original (BD) + referencial (TC Banxico) via
  // <PriceDisplay variant='dual'/>. useCurrency() sólo provee formatMxn para
  // el price/m² (cálculo derivado en MXN).
  const { formatMxn } = useCurrency();

  const hasPrice = property.price.mxn > 0;
  const originalCurrency = property.price.currency;
  const pricePerM2 = property.specs.area > 0 ? Math.round(property.price.mxn / property.specs.area) : null;

  // Sistema de descuentos (2026-05-22):
  //  - Unit con descuento → property.discount está set y `priceOriginal` ya viene
  //    con el precio de lista del mapper. Render: tachado brand cyan + badge %.
  //  - Development con unidades hijas con descuento → property.discountedUnitsCount
  //    > 0; corner badge "Propiedades con descuento" sobre la imagen.
  //  - Legacy: cuando hay priceOriginal pero no discount (no debería pasar tras
  //    el mapper), igual rendea el patrón para no regresar.
  const hasDiscount =
    !!property.discount ||
    (typeof property.priceOriginal === 'number' &&
      property.priceOriginal > property.price.mxn &&
      property.price.mxn > 0);
  const formattedOriginal = hasDiscount && property.priceOriginal ? formatMxn(property.priceOriginal) : null;
  const discountPct = property.discount
    ? Math.round(property.discount.pct)
    : hasDiscount && property.priceOriginal
      ? Math.round(((property.priceOriginal - property.price.mxn) / property.priceOriginal) * 100)
      : 0;
  const hasDiscountedUnitsRollup =
    property.kind === 'development' &&
    typeof property.discountedUnitsCount === 'number' &&
    property.discountedUnitsCount > 0;

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
            compact (split /propiedades): 5/2 (~2.5:1) → muy corto vertical
              para que 2×2 cards muestren TODA su info sin scroll del listado
              (feedback Luis iter 2 2026-05-20). */}
        <div className={`relative ${variant === 'compact' ? 'aspect-[5/2]' : 'aspect-[16/9]'} overflow-hidden bg-gray-100`}>
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
            {/* Rollup descuento desarrollo — solo kind='development' con ≥1
                unidad con descuento activo (v_developments.discounted_units_count). */}
            {hasDiscountedUnitsRollup && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-bold uppercase rounded bg-[#0E7490] text-white shadow-sm">
                {tMkt('cardWithDiscounts')}
              </span>
            )}
          </div>

          {/* Tag corner descuento — kind='unit' con discount activo. Icono solo
              (sin número); el % real se lee en el chip junto al precio. Posicionado
              en bottom-left para no chocar con stage/type pills (top-left) ni con
              Compare (top-right). */}
          {property.kind === 'unit' && property.discount && (
            <div className="absolute bottom-2 left-2 pointer-events-none">
              <DiscountBadge
                variant="corner"
                size={36}
                ariaLabel={tMkt('cardDiscountLabel')}
              />
            </div>
          )}

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

        {/* Info — rhythm vertical consistente via flex gap, no mt-* dispersos.
            UI/UX: cada cluster en su propia fila, separadores generosos,
            sin información acumulada en una sola línea. */}
        <div
          className={`flex flex-col ${variant === 'compact' ? 'p-2.5 gap-1.5' : 'p-3 gap-1.5'}`}
        >
          {/* Row 1 — Precio destacado. "Desde" + monto + currency.
              En compact el monto sigue prominente (text-lg) para jerarquía. */}
          <div className="flex items-baseline gap-2 flex-wrap">
            {hasPrice && (
              <>
                <span className="text-2xs font-semibold text-gray-500 uppercase tracking-wider">
                  {tMkt('cardPriceFrom')}
                </span>
                <span
                  data-testid="marketplace-card-price"
                  className={`font-bold text-[var(--propyte-dark-900)] tabular-nums leading-none ${variant === 'compact' ? 'text-lg' : 'text-xl'}`}
                >
                  <PriceDisplay
                    mxn={property.price.mxn}
                    variant="dual"
                    size={variant === 'compact' ? 'sm' : 'md'}
                    originalCurrency={originalCurrency}
                  />
                </span>
              </>
            )}
            {hasDiscount && (
              <>
                {/* Strikethrough en brand cyan (#0E7490 teal-700, a11y) — la línea
                    azul sobre el precio de lista pedida por Luis 2026-05-22. */}
                <span className="text-xs text-gray-600 line-through decoration-[#0E7490] decoration-2 tabular-nums">
                  {formattedOriginal}
                </span>
                <DiscountBadge variant="inline" pct={discountPct} />
              </>
            )}
            {pricePerM2 !== null && variant !== 'compact' && (
              <span className="text-xs text-gray-600 tabular-nums font-medium">
                {formatMxn(pricePerM2)}/{tMkt('cardM2Short')}
              </span>
            )}
          </div>

          {/* Row 2 — Bedrooms range (developments) */}
          {bedroomsLabel && (
            <div className={`text-[var(--propyte-dark-700)] font-semibold tabular-nums ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
              {bedroomsLabel}
            </div>
          )}

          {/* Row 2 — Specs (units): rec | ba | m² con separadores generosos.
              UI/UX: `mx-2` en pipes para visual breathing, items-center alinea
              numéricos con labels. */}
          {(property.specs.bedrooms > 0 || property.specs.bathrooms > 0 || property.specs.area > 0) && (
            <div className={`flex items-center text-[var(--propyte-dark-700)] tabular-nums ${variant === 'compact' ? 'text-xs gap-1' : 'text-base gap-1'}`}>
              {property.specs.bedrooms > 0 && (
                <>
                  <span className="font-semibold">{property.specs.bedrooms}</span>
                  <span className="text-gray-600">{tMkt('cardBedShort')}</span>
                  {(property.specs.bathrooms > 0 || property.specs.area > 0) && (
                    <span className="text-gray-300 mx-2" aria-hidden="true">|</span>
                  )}
                </>
              )}
              {property.specs.bathrooms > 0 && (
                <>
                  <span className="font-semibold">{property.specs.bathrooms}</span>
                  <span className="text-gray-600">{tMkt('cardBathShort')}</span>
                  {property.specs.area > 0 && <span className="text-gray-300 mx-2" aria-hidden="true">|</span>}
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

          {/* Row 3 — Tipo desarrollo (chip dedicado). Solo development. */}
          {devTypeLabel && (
            <div>
              <span className="inline-flex items-center px-2 py-0.5 text-2xs font-bold uppercase tracking-wider rounded bg-propyte-cyan-100/60 text-[#0E7490] border border-propyte-brand/30">
                {devTypeLabel}
              </span>
            </div>
          )}

          {/* Row 4 (grid only) — Inventory + delivery. Frontend-only:
              mostramos sólo total de unidades (oculta "X disponibles"). */}
          {variant !== 'compact' && property.kind === 'development' && (property.inventory?.total || property.delivery) && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              {property.inventory?.total !== undefined && property.inventory.total > 0 && (
                <span>
                  {tMkt('cardTotalUnits', { total: property.inventory.total })}
                </span>
              )}
              {property.delivery && (property.delivery.text || property.delivery.estimated) && (
                <>
                  {property.inventory?.total !== undefined && property.inventory.total > 0 && (
                    <span className="text-gray-300">·</span>
                  )}
                  <span>
                    {tMkt('cardDeliveryLabel')}: {property.delivery.text || property.delivery.estimated}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Row 5 — Ubicación + ROI en línea (justify-between).
              UI/UX: agrupa contexto geográfico izquierda + métrica derecha.
              Maximiza uso de ancho, alivia stack vertical. */}
          <div className={`flex items-center justify-between gap-2 ${variant === 'compact' ? 'mt-auto pt-0.5' : ''}`}>
            <div className={`flex items-center gap-1.5 text-[var(--propyte-dark-700)] line-clamp-1 min-w-0 ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
              <MapPin size={12} className="flex-shrink-0" />
              <span className="truncate">{property.location.zone}, {property.location.city}</span>
            </div>
            {variant === 'compact' && property.roi.projected > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-[#5CE0D2]/10 text-[#0E7490] text-2xs font-bold rounded-full tabular-nums flex-shrink-0">
                ROI {property.roi.projected}%
              </span>
            )}
          </div>

          {/* Investment metrics row — solo grid; compact ya mostró ROI inline arriba */}
          {variant !== 'compact' && (
            <div className="flex flex-wrap items-center gap-1.5">
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
          )}
        </div>
      </Link>
    </div>
  );
}
