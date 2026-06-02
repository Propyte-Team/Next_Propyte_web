import Link from 'next/link';
import Image from 'next/image';
import { getTranslations, getLocale } from 'next-intl/server';
import { ArrowRight, MapPin, Bed, Bath, Maximize } from '@/lib/icons';
import { formatPrice } from '@/lib/formatters';
import { getDisplayTitle, getStageLabel } from '@/lib/development-display';

/**
 * Mapeo defensivo del tipo de desarrollo desde BD sucia al catálogo canónico.
 * Igual lógica que `lib/mappers/development-to-property.ts`. Inline aquí para
 * evitar import cycle con el mapper UI Property.
 */
function normalizeDevType(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // toLowerCase + trim + `_`→`-` para converger el enum crudo de Zoho
  // (RESIDENCIAL_VERTICAL) con el catálogo canónico kebab-case.
  const lower = raw.toLowerCase().trim().replace(/_/g, '-');
  if (lower === 'residencial-vertical' || lower === 'residencial vertical' || lower === 'vertical') return 'residencial-vertical';
  if (lower === 'residencial-horizontal' || lower === 'residencial horizontal' || lower === 'horizontal') return 'residencial-horizontal';
  if (lower === 'mixto') return 'mixto';
  if (lower === 'comercial') return 'comercial';
  if (lower === 'hotelero' || lower === 'hotel') return 'hotelero';
  if (lower === 'torre-oficinas' || lower === 'torre de oficinas' || lower === 'oficinas') return 'torre-oficinas';
  if (lower === 'condominio') return 'condominio';
  if (lower === 'townhouse' || lower === 'town-house') return 'townhouse';
  if (lower === 'lotes' || lower === 'lote') return 'lotes';
  if (lower === 'macrolotes' || lower === 'macrolote') return 'macrolotes';
  return null; // legacy stage misplaced (e.g. 'preventa') → sin chip
}

export interface FeaturedDevelopment {
  id: string;
  slug: string;
  name: string;
  publication_title?: string | null;
  publication_title_en?: string | null;
  meta_title?: string | null;
  city: string;
  zone?: string;
  stage?: string;
  price_min_mxn?: number;
  /** Tope del rango de precio. Cuando max > min se muestra como "Desde X" igual,
   *  pero refuerza la jerarquía visual. */
  price_max_mxn?: number;
  /** Moneda de alta: 'MXN' | 'USD'. */
  currency?: string | null;
  images?: string[];
  property_types?: string[];
  /** Tipo de desarrollo (catálogo Hub). Mapeo defensivo en el componente. */
  development_type?: string | null;
  bedrooms_min?: number;
  /** Tope agregado desde v_units por development_id. */
  bedrooms_max?: number;
  bathrooms_min?: number;
  area_min?: number;
  roi_estimated?: number;
  /** ROI proyectado (alias canon v_developments.roi_projected). */
  roi_projected?: number;
}

interface FeaturedPropertiesProps {
  developments?: FeaturedDevelopment[];
}

export default async function FeaturedProperties({ developments = [] }: FeaturedPropertiesProps) {
  const t = await getTranslations('featured');
  const tStages = await getTranslations('stages');
  const tDevTypes = await getTranslations('developmentTypes');
  const tMkt = await getTranslations('marketplace');
  const locale = await getLocale();
  const safeDevType = (k: string) => {
    try { return tDevTypes(k as 'mixto'); } catch { return k; }
  };
  const items = developments.slice(0, 6);
  if (items.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-base md:text-xl font-bold text-[#2C2C2C] leading-tight tracking-tight">{t('title')}</h2>
            <p className="text-gray-600 mt-1">{t('subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/desarrollos`}
            className="hidden md:flex items-center gap-1.5 text-[#0E7490] font-semibold hover:underline"
          >
            {t('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-600">{t('loading')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((dev) => {
              const displayTitle = getDisplayTitle(dev, locale);
              const stageLabel = getStageLabel(dev.stage, (k) => tStages(k as 'preventa'));
              const stageKey = stageLabel ? (dev.stage || '').toLowerCase().trim() : null;
              const devTypeKey = normalizeDevType(dev.development_type);
              const devTypeLabel = devTypeKey ? safeDevType(devTypeKey) : null;
              const currencyDisplay = (dev.currency || 'MXN').toUpperCase() === 'USD' ? 'USD' : 'MXN';
              // Rango bedrooms — "1 - 4 rec" si max > min; "2 rec" si igual.
              const bedroomsLabel = dev.bedrooms_min && dev.bedrooms_min > 0
                ? (dev.bedrooms_max && dev.bedrooms_max > dev.bedrooms_min
                    ? tMkt('cardBedroomsRange', { min: dev.bedrooms_min, max: dev.bedrooms_max })
                    : tMkt('cardBedroomsSingle', { count: dev.bedrooms_min }))
                : null;
              const roiValue = dev.roi_projected ?? dev.roi_estimated ?? 0;
              return (
              <Link
                key={dev.id}
                href={`/${locale}/desarrollos/${dev.slug}`}
                className="group block"
              >
                <article className="propyte-card-glass-light overflow-hidden transition-all duration-300 hover:-translate-y-1">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {dev.images?.[0] ? (
                      <Image
                        src={dev.images[0]}
                        alt={`${displayTitle} - ${dev.city}`}
                        fill
                        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                    )}
                    {stageLabel && (
                      <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md shadow-sm ${
                          stageKey === 'preventa'
                            ? 'bg-[#A2F9FF] text-[#0B1C1E]'
                            : stageKey === 'construccion' || stageKey === 'en construcción' || stageKey === 'en construccion'
                            ? 'bg-[#22C55E] text-white'
                            : 'bg-[#0E7490] text-white'
                        }`}>
                          {stageLabel}
                        </span>
                      </div>
                    )}
                    {dev.images && dev.images.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm">
                        {dev.images.length} {t('photos')}
                      </div>
                    )}
                  </div>

                  {/* Info — rhythm vertical consistente con cards /desarrollos.
                      Cluster por fila: precio · chip tipo · bedrooms range ·
                      specs · título · ubicación · ROI badge. */}
                  <div className="p-4 flex flex-col gap-1.5">
                    {/* Row 1 — Precio "Desde X" + currency chiquito */}
                    {dev.price_min_mxn && dev.price_min_mxn > 0 && (
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-2xs font-semibold text-gray-500 uppercase tracking-wider">
                          {t('from')}
                        </span>
                        <span className="text-xl font-bold text-[#2C2C2C] tabular-nums leading-none">
                          {formatPrice(dev.price_min_mxn)}
                        </span>
                        <span className="text-2xs font-semibold text-gray-500 tabular-nums">
                          {currencyDisplay}
                        </span>
                      </div>
                    )}

                    {/* Row 2 — Chip tipo desarrollo */}
                    {devTypeLabel && (
                      <div>
                        <span className="inline-flex items-center px-2 py-0.5 text-2xs font-bold uppercase tracking-wider rounded bg-propyte-cyan-100/60 text-[#0E7490] border border-propyte-brand/30">
                          {devTypeLabel}
                        </span>
                      </div>
                    )}

                    {/* Row 3 — Rango bedrooms (agregado desde v_units) */}
                    {bedroomsLabel && (
                      <div className="text-sm text-[#2C2C2C] font-semibold tabular-nums">
                        {bedroomsLabel}
                      </div>
                    )}

                    {/* Row 4 — Specs: rec | ba | m² (cuando hay datos directos) */}
                    {((dev.bedrooms_min && dev.bedrooms_min > 0) || (dev.bathrooms_min && dev.bathrooms_min > 0) || (dev.area_min && dev.area_min > 0)) && !bedroomsLabel && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
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
                    )}

                    {/* Row 5 — Título (text-xs + line-clamp-2 para que nunca se corte;
                        fluye a una segunda línea cuando el título es largo). */}
                    <h3 className="font-semibold text-[#2C2C2C] text-xs leading-snug line-clamp-2 break-words">
                      {displayTitle}
                    </h3>

                    {/* Row 6 — Ubicación + ROI badge en línea (justify-between) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-xs text-gray-600 min-w-0">
                        <MapPin size={12} className="flex-shrink-0" />
                        <span className="truncate">{dev.zone ? `${dev.zone}, ` : ''}{dev.city}</span>
                      </div>
                      {roiValue > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-[#5CE0D2]/10 text-[#0E7490] text-2xs font-bold rounded-full tabular-nums flex-shrink-0">
                          ROI {roiValue}%
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link
            href={`/${locale}/desarrollos`}
            className="inline-flex items-center gap-1 min-h-[44px] text-[#0E7490] font-semibold"
          >
            {t('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
