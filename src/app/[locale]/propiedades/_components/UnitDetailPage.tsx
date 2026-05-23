import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { getVisibility, isVisible, VISIBILITY_KEYS } from '@/lib/visibility';
import {
  ChevronRight, MapPin, Bed, Bath, Square, Car, Building2, ArrowLeft,
} from '@/lib/icons';
import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import {
  getUnitBySlug,
  getSlugRedirect,
  getRentalEstimate,
  getAirdnaMarketSummary,
  getSimilarUnits,
  getDeveloperById,
  getDeveloperProjectCount,
  type DeveloperRecord,
} from '@/lib/supabase/queries';
import VirtualTour from '@/components/property/VirtualTour';
import VideoPlayer from '@/components/property/VideoPlayer';
import GeoAnalysis from '@/components/property/GeoAnalysis';
import { mapUnitToProperty, type UnitRow } from '@/lib/mappers/unit-to-property';
import { formatPrice } from '@/lib/formatters';
import { CITY_TO_MARKET_CODE, VAC } from '@/lib/calculator';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import ViewItemTracker from '@/components/shared/ViewItemTracker';
import SimilarListings from '@/components/shared/SimilarListings';
import ContactForm from '@/components/property/ContactForm';
import ImageGallery from '@/components/property/ImageGallery';
import MobileContactBar from '@/components/property/MobileContactBar';
import ShareDownloadModal, { type ShareDownloadData } from '@/components/property/ShareDownloadModal';
import AreaDisplay from '@/components/ui/AreaDisplay';
import PriceDisplay from '@/components/ui/PriceDisplay';
import PriceDisclaimer from '@/components/ui/PriceDisclaimer';
import type { Currency } from '@/context/CurrencyContext';
import Badge from '@/components/ui/Badge';
import ExpandableText from '@/components/ui/ExpandableText';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import UnitInvestmentCalculator from './UnitInvestmentCalculator';
import MarketIndicator from './MarketIndicator';
import AmenityList from '@/components/property/AmenityList';
import FloatingKeyData from '@/components/property/FloatingKeyData';
import Highlights from '@/components/property/Highlights';
import Proximity from '@/components/property/Proximity';
import RichContentSections from '@/components/property/RichContentSections';
import UnitFAQs from './UnitFAQs';
import { slugify } from '@/lib/utils';

interface UnitDetailPageProps {
  locale: string;
  slug: string;
}

export default async function UnitDetailPage({ locale, slug }: UnitDetailPageProps) {
  const supabase = createPublicSupabaseClient();
  const [tProp, visibility] = await Promise.all([
    getTranslations({ locale, namespace: 'property' }),
    getVisibility(),
  ]);

  // ── Fetch unit row — Supabase only, 404 si no existe ──
  let row: UnitRow | null = null;
  try {
    if (supabase) {
      const { data } = await getUnitBySlug(supabase, slug);
      if (data) row = data as UnitRow;
    }
  } catch (err) {
    console.error('Unit query failed:', err);
  }

  if (!row) {
    if (supabase) {
      const newSlug = await getSlugRedirect(supabase, 'unit', slug);
      if (newSlug && newSlug !== slug) {
        permanentRedirect(`/${locale}/propiedades/${newSlug}`);
      }
    }
    notFound();
  }

  const property = mapUnitToProperty(row);
  const description = property.description[locale as 'es' | 'en'] || property.description.es || '';
  // Moneda en que se cotizó originalmente (moneda_principal en BD). Default MXN.
  const originalCurrency: Currency = (row.currency || '').toUpperCase() === 'USD' ? 'USD' : 'MXN';
  const _citySlug = slugify(property.location.city); void _citySlug;

  // ── Parent development data (amenities + developer) ──
  let devAmenities: string[] = [];
  let developerDisplay: DeveloperRecord | null = null;
  let developerProjects = 0;
  try {
    if (supabase && row.development_id) {
      const { data: devData } = await supabase
        .schema('real_estate_hub' as 'public')
        .from('v_developments')
        .select('amenities, developer_id')
        .eq('id', row.development_id)
        .single();
      const d = devData as { amenities?: string[] | null; developer_id?: string | null } | null;
      devAmenities = d?.amenities || [];
      const developerId = d?.developer_id;
      if (developerId) {
        const [devRecord, projCount] = await Promise.all([
          getDeveloperById(supabase, developerId),
          getDeveloperProjectCount(supabase, developerId),
        ]);
        developerDisplay = devRecord;
        developerProjects = projCount;
      }
    }
  } catch (err) {
    console.error('Dev data fetch failed:', err);
  }

  // ── Rental estimates + market data ──
  let estRentRes: number | null = null;
  let estRentVac: number | null = null;
  let airdnaOccupancy: number | null = null;

  try {
    if (supabase) {
      const airdnaMarket = CITY_TO_MARKET_CODE[property.location.city] || '';
      const [resResult, vacResult, airdnaResult] = await Promise.all([
        getRentalEstimate(supabase, property.location.city, property.specs.type, property.specs.bedrooms, property.location.zone, 'residencial'),
        getRentalEstimate(supabase, property.location.city, property.specs.type, property.specs.bedrooms, property.location.zone, 'vacacional'),
        airdnaMarket ? getAirdnaMarketSummary(supabase, airdnaMarket) : Promise.resolve(null),
      ]);

      if (resResult.data) {
        const perM2 = resResult.data.avg_rent_per_m2;
        const area = property.specs.area;
        estRentRes = perM2 && perM2 > 0 && area > 0
          ? Math.round(perM2 * area)
          : resResult.data.median_rent_mxn;
      }
      if (vacResult.data) estRentVac = vacResult.data.median_rent_mxn;
      if (airdnaResult) airdnaOccupancy = airdnaResult.current_occupancy;
    }
  } catch (err) {
    console.error('Rental estimate fetch failed:', err);
  }

  // Fallback values from unit metadata / mock
  const monthlyRentRes = estRentRes ?? property.roi.rentalMonthly ?? 0;
  const monthlyRentVac = estRentVac ?? Math.round(monthlyRentRes * 1.35);

  // ── Similar units (4-level fallback) ──
  let similar: Array<{ id: string; slug: string; name: string; city: string | null; zone: string | null; images: string[] | null; price_mxn: number | null; bedrooms: number | null; bathrooms: number | null; area_m2: number | null; unit_number: string | null; development_name: string | null }> = [];
  try {
    if (supabase) {
      const data = await getSimilarUnits(
        supabase,
        { id: property.id, city: property.location.city, zone: property.location.zone, unit_type: property.specs.type },
        4,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      similar = (data as any) || [];
    }
  } catch (err) {
    console.error('Similar units fetch failed:', err);
  }

  const stageLabel =
    property.stage === 'preventa' ? tProp('stagePresale')
      : property.stage === 'construccion' ? tProp('stageConstruction')
        : tProp('stageReady');

  const typeLabelMap: Record<string, string> = {
    departamento: tProp('typeApartmentSingular'),
    penthouse: 'Penthouse',
    casa: tProp('typeHouseSingular'),
    terreno: tProp('typeLandSingular'),
    macrolote: tProp('typeMacrolote'),
  };
  const typeLabel = typeLabelMap[property.specs.type] || property.specs.type;

  const _defaultOccupancy = airdnaOccupancy != null ? airdnaOccupancy : VAC.DEFAULT_OCCUPANCY * 100;
  void _defaultOccupancy;

  // ── Share/Download modal data ──
  const shareSpecs: ShareDownloadData['specs'] = [];
  if (property.specs.bedrooms > 0) shareSpecs.push({ label: tProp('bedrooms'), value: String(property.specs.bedrooms) });
  if (property.specs.bathrooms > 0) shareSpecs.push({ label: tProp('bathrooms'), value: String(property.specs.bathrooms) });
  if (property.specs.area > 0) shareSpecs.push({ label: 'Área', value: `${property.specs.area} m²` });
  if (row.parking && row.parking > 0) shareSpecs.push({ label: tProp('parkingShort'), value: String(row.parking) });
  if (row.floor != null) shareSpecs.push({ label: tProp('floorLabel', { n: '' }).trim(), value: String(row.floor) });
  const shareData: ShareDownloadData = {
    title: property.name,
    price: property.price.mxn > 0 ? formatPrice(property.price.mxn) : '—',
    location: [property.location.zone, property.location.city, property.location.state].filter(Boolean).join(', '),
    img: property.images?.[0] || '',
    url: `https://propyte.com/${locale}/propiedades/${slug}`,
    wa: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '529843235354',
    etapa: stageLabel,
    specs: shareSpecs,
    desc: description || undefined,
    amenidades: devAmenities.length ? devAmenities : (property.amenities?.length ? property.amenities : undefined),
    piso: row.floor != null ? String(row.floor) : undefined,
    num_unidad: row.unit_number || undefined,
    prop_type: typeLabel,
    precio_usd: row.price_usd ? formatPrice(row.price_usd) : undefined,
  };

  return (
    <>
      <ViewItemTracker
        itemId={property.id}
        itemName={property.name}
        itemKind="unit"
        city={property.location.city || undefined}
        zone={property.location.zone || undefined}
        priceMxn={property.price.mxn || undefined}
      />
      <SchemaMarkup
        type="realEstateListing"
        data={{
          name: property.name,
          description,
          url: `https://propyte.com/${locale}/propiedades/${slug}`,
          image: property.images?.[0] || undefined,
          datePosted: property.createdAt,
          numberOfRooms: property.specs.bedrooms,
          numberOfBathroomsTotal: property.specs.bathrooms,
          floorSize: { '@type': 'QuantitativeValue', value: property.specs.area, unitCode: 'MTK' },
          ...(property.price.mxn > 0 && {
            offers: {
              '@type': 'Offer',
              price: property.price.mxn,
              priceCurrency: 'MXN',
              availability: 'https://schema.org/InStock',
            },
          }),
          address: {
            '@type': 'PostalAddress',
            streetAddress: property.location.address || property.location.zone,
            addressLocality: property.location.city,
            addressRegion: property.location.state,
            addressCountry: 'MX',
          },
          ...(estRentRes && {
            additionalProperty: {
              '@type': 'PropertyValue',
              name: 'estimatedMonthlyRent',
              value: estRentRes,
              unitCode: 'MXN',
            },
          }),
        }}
      />
      <SchemaMarkup
        type="breadcrumb"
        data={{
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: tProp('breadcrumbHome'), item: `https://propyte.com/${locale}` },
            { '@type': 'ListItem', position: 2, name: tProp('breadcrumbProperties'), item: `https://propyte.com/${locale}/propiedades` },
            { '@type': 'ListItem', position: 3, name: property.location.city, item: `https://propyte.com/${locale}/propiedades?city=${encodeURIComponent(property.location.city)}` },
            { '@type': 'ListItem', position: 4, name: property.name },
          ],
        }}
      />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4 pb-24 md:pb-6">
        {/* Breadcrumbs */}
        <nav aria-label={tProp('breadcrumbAriaLabel')} className="flex items-center gap-1 text-xs text-gray-600 mb-4">
          <Link href={`/${locale}`} className="hover:text-[#0E7490]">{tProp('breadcrumbHome')}</Link>
          <ChevronRight size={12} />
          <Link href={`/${locale}/propiedades`} className="hover:text-[#0E7490]">{tProp('breadcrumbProperties')}</Link>
          <ChevronRight size={12} />
          <Link href={`/${locale}/propiedades?city=${encodeURIComponent(property.location.city)}`} className="hover:text-[#0E7490]">{property.location.city}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-medium truncate max-w-[240px]">{property.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero gallery */}
            <ImageGallery
              images={property.images}
              alt={property.name}
              badgeTopLeft={
                <>
                  {/* Pill stage (entrega inmediata / preventa / construcción) —
                      siempre presente. */}
                  <span className="px-3 py-1.5 bg-[#0E7490] text-white text-xs font-bold rounded-full">{stageLabel}</span>
                  {/* Badge complementario SOLO para estados que aportan info
                      nueva respecto al stage: reservado / vendido. 'nuevo' es
                      ruido visual (ya implícito en stage='entrega_inmediata')
                      y duplicaba el label hasta 2026-05-23. */}
                  {property.badge && property.badge !== 'nuevo' && (
                    <Badge
                      type={property.badge}
                      label={tProp(`badge_${property.badge}` as 'badge_reservado')}
                    />
                  )}
                </>
              }
              badgeTopRight={property.discount ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0E7490] text-white text-sm font-bold rounded-full shadow-md tabular-nums">
                  −{Math.round(property.discount.pct)}% {tProp('discount')}
                </span>
              ) : null}
            />

            {/* Title + Specs */}
            <div>
              <div className="flex items-center gap-2 text-xs text-[#0E7490] font-semibold uppercase tracking-wider mb-1">
                <span>{typeLabel}</span>
                {property.parentDevelopmentSlug && (
                  <>
                    <span>·</span>
                    <Link
                      href={`/${locale}/desarrollos/${property.parentDevelopmentSlug}`}
                      className="inline-flex items-center gap-1 hover:text-[#0E7490] underline underline-offset-2"
                    >
                      <ArrowLeft size={12} />
                      {tProp('viewDevelopment')}
                      {property.parentDevelopmentName && `: ${property.parentDevelopmentName}`}
                    </Link>
                  </>
                )}
              </div>
              {/* Título + Share/Ficha en la misma fila — libera espacio vertical
                  para el bloque de precio (original + referencial + TC). */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <h1 className="text-base md:text-2xl font-bold text-[#2C2C2C] flex-1 min-w-0 leading-tight tracking-tight">
                  {property.name}
                </h1>
                <ShareDownloadModal data={shareData} locale={locale} />
              </div>

              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <MapPin size={18} />
                <span className="text-base">
                  {property.location.address || `${property.location.zone}, ${property.location.city}, ${property.location.state}`}
                </span>
              </div>

              {/* Precio (full width) — sin Share aquí, el título lo lleva arriba.
                  Con descuento: precio lista tachado encima, post-descuento abajo + badge %. */}
              {property.price.mxn > 0 && (
                <div className="mt-4 space-y-1">
                  {property.discount && property.priceOriginal && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">{tProp('listPriceLabel')}:</span>
                      <span className="line-through decoration-[#0E7490] decoration-2 text-gray-600 tabular-nums">
                        <PriceDisplay
                          mxn={property.priceOriginal}
                          variant="single"
                          size="sm"
                        />
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <PriceDisplay
                      mxn={property.price.mxn}
                      variant="dual"
                      size="xl"
                      showRateNote
                      originalCurrency={originalCurrency}
                    />
                    {property.discount && (
                      <span className="inline-flex items-center px-2.5 py-1 bg-[#0E7490] text-white text-sm font-bold rounded-full tabular-nums">
                        −{Math.round(property.discount.pct)}%
                      </span>
                    )}
                    {property.specs.area > 0 && (
                      <div className="text-sm text-gray-600">
                        <PriceDisplay
                          mxn={Math.round(property.price.mxn / property.specs.area)}
                          variant="single"
                          size="sm"
                          suffix="/m²"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Specs chips — bumped: iconos + texto más grandes para
                  jerarquía visual. Padding aumentado para que respiren. */}
              <div className="flex flex-wrap gap-2.5 mt-5">
                {property.specs.bedrooms > 0 && (
                  <SpecChip icon={<Bed size={20} />} label={`${property.specs.bedrooms} ${tProp('bedShort', { count: property.specs.bedrooms })}`} />
                )}
                {property.specs.bathrooms > 0 && (
                  <SpecChip icon={<Bath size={20} />} label={`${property.specs.bathrooms} ${tProp('bathShort', { count: property.specs.bathrooms })}`} />
                )}
                {property.specs.area > 0 && (
                  <SpecChip
                    icon={<Square size={20} />}
                    label={<AreaDisplay m2={property.specs.area} variant="dual" size="sm" />}
                  />
                )}
                {row.parking && row.parking > 0 && (
                  <SpecChip icon={<Car size={20} />} label={`${row.parking} ${tProp('parkingShort')}`} />
                )}
                {row.floor != null && (
                  <SpecChip icon={<Building2 size={20} />} label={tProp('floorLabel', { n: row.floor })} />
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              tablistLabel={tProp('unitDetailsTitle')}
              items={[
                {
                  id: 'descripcion',
                  label: tProp('tabDescripcion'),
                  panel: (
                    <div className="space-y-6">
                      <Highlights property={property} />

                      <div>
                        <h2 className="text-xl font-bold text-[#2C2C2C] mb-3">{tProp('aboutUnitTitle')}</h2>
                        {description ? (
                          <ExpandableText
                            maxHeight={120}
                            moreLabel={tProp('readMore')}
                            lessLabel={tProp('readLess')}
                            className="text-gray-600 leading-relaxed text-sm md:text-base"
                          >
                            {description}
                          </ExpandableText>
                        ) : (
                          <p className="text-gray-600 leading-relaxed">{tProp('descriptionComingSoon')}</p>
                        )}
                      </div>
                      {property.richContent && (
                        <RichContentSections richContent={property.richContent} locale={locale} />
                      )}
                      <AmenityList locale={locale} amenities={devAmenities.length > 0 ? devAmenities : property.amenities} />
                      <Proximity city={property.location.city} zone={property.location.zone} />

                      {developerDisplay?.name && (
                        <div className="propyte-card-glass-light p-6">
                          <h2 className="text-lg font-bold text-gray-900 mb-4">
                            {tProp('developerTitle')}
                          </h2>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                              {developerDisplay.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={developerDisplay.logoUrl} alt={developerDisplay.name} className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-xl font-extrabold text-[#0E7490] tracking-tight">
                                  {developerDisplay.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-gray-900 text-lg truncate">{developerDisplay.name}</div>
                                {developerDisplay.verified && (
                                  <span className="px-2 py-0.5 text-2xs font-bold text-[#0E7490] bg-propyte-cyan-100 rounded-full uppercase tracking-wider">
                                    {tProp('verified')}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-2 flex-wrap">
                                {developerProjects > 0 && <span>{tProp('projectsCount', { count: developerProjects })}</span>}
                                {developerDisplay.yearsExperience != null && developerDisplay.yearsExperience > 0 && (
                                  <span>· {developerDisplay.yearsExperience} {tProp('yearsExperience')}</span>
                                )}
                                {developerDisplay.unitsDelivered != null && developerDisplay.unitsDelivered > 0 && (
                                  <span>· {developerDisplay.unitsDelivered.toLocaleString()} {tProp('unitsDelivered')}</span>
                                )}
                              </div>
                            </div>
                            {developerDisplay.slug && (
                              <Link
                                href={`/${locale}/desarrolladores/${developerDisplay.slug}`}
                                className="px-4 py-2 bg-white border border-gray-200 hover:border-propyte-brand text-sm font-semibold text-gray-700 rounded-lg transition-colors shrink-0"
                              >
                                {tProp('viewProfile')}
                              </Link>
                            )}
                          </div>
                          {(locale === 'en' ? developerDisplay.descriptionEn : developerDisplay.descriptionEs) && (
                            <p className="text-sm text-gray-600 leading-relaxed mt-4 pt-4 border-t border-gray-200">
                              {locale === 'en' ? developerDisplay.descriptionEn : developerDisplay.descriptionEs}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ),
                },
                ...((property.media?.virtualTour || property.media?.video) && isVisible(visibility, VISIBILITY_KEYS.PROPIEDADES_DETAIL_TOUR) ? [{
                  id: 'tour',
                  label: tProp('tabTour'),
                  panel: (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-[#2C2C2C]">{tProp('tabTour')}</h2>
                      <div className={`grid gap-4 ${property.media?.virtualTour && property.media?.video ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                        {property.media?.virtualTour && (
                          <VirtualTour url={property.media.virtualTour} propertyName={property.name} />
                        )}
                        {property.media?.video && (
                          <VideoPlayer
                            url={property.media.video}
                            propertyName={property.name}
                            thumbnail={property.images?.[0]}
                          />
                        )}
                      </div>
                    </div>
                  ),
                }] as TabItem[] : []),
                ...(isVisible(visibility, VISIBILITY_KEYS.PROPIEDADES_DETAIL_GEO) ? [{
                  id: 'geo',
                  label: tProp('tabGeo'),
                  panel: (
                    <div className="space-y-8">
                      <MarketIndicator
                        city={property.location.city}
                        price={property.price.mxn}
                        monthlyRent={monthlyRentRes || null}
                        capRate={property.capRate ?? null}
                        airdnaOccupancy={airdnaOccupancy}
                        locale={locale}
                      />
                      <GeoAnalysis
                        lat={property.location.lat ?? null}
                        lng={property.location.lng ?? null}
                        address={property.location.address || null}
                        city={property.location.city}
                        zone={property.location.zone || null}
                        state={property.location.state || null}
                        zoneScore={null}
                        locale={locale}
                      />
                    </div>
                  ),
                }] as TabItem[] : []),
                ...(isVisible(visibility, VISIBILITY_KEYS.PROPIEDADES_DETAIL_RENTABILIDAD) ? [{
                  id: 'rentabilidad',
                  label: tProp('tabRentabilidad'),
                  panel: (
                    <UnitInvestmentCalculator
                      price={property.price.mxn}
                      state={property.location.state || 'Quintana Roo'}
                      monthlyRentRes={monthlyRentRes}
                      monthlyRentVac={monthlyRentVac}
                      airdnaOccupancy={airdnaOccupancy}
                      downPaymentMinPct={property.financing.downPaymentMin}
                      financingMonths={property.financing.months}
                      interestRateDefault={property.financing.interestRate}
                      appreciationDefault={property.roi.appreciation}
                      locale={locale}
                    />
                  ),
                }] as TabItem[] : []),
              ] satisfies TabItem[]}
            />

            {/* FAQ */}
            <UnitFAQs
              locale={locale}
              unitName={property.name}
              city={property.location.city}
              price={property.price.mxn}
              downPaymentMin={property.financing.downPaymentMin}
              customFaqs={(locale === 'en'
                ? property.richContent?.faqs?.en
                : property.richContent?.faqs?.es) ?? undefined}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Datos clave (cuadro azul) — siempre arriba del formulario (decisión Luis 2026-05-11). */}
              <FloatingKeyData
                priceMxn={property.price.mxn > 0 ? property.price.mxn : null}
                originalCurrency={originalCurrency}
                areaM2={property.specs.area > 0 ? property.specs.area : null}
                bedrooms={property.specs.bedrooms > 0 ? String(property.specs.bedrooms) : null}
                bathrooms={property.specs.bathrooms > 0 ? String(property.specs.bathrooms) : null}
                discount={property.discount && property.priceOriginal ? {
                  listPriceMxn: property.priceOriginal,
                  pct: property.discount.pct,
                } : undefined}
                labels={{
                  title: locale === 'es' ? 'Datos clave' : 'Key data',
                  price: locale === 'es' ? 'Precio' : 'Price',
                  area: 'Área',
                  bedrooms: tProp('bedrooms'),
                  bathrooms: tProp('bathrooms'),
                  discount: tProp('discount'),
                  listPrice: tProp('listPriceLabel'),
                }}
              />

              <div id="contact-form" className="propyte-card-glass-light p-6 scroll-mt-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {tProp('interestedUnitQuestion')}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {tProp('responseUnder5min')}
                </p>
                <ContactForm
                  propertyId={property.id}
                  propertyName={property.name}
                  whatsappUrl={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '529843235354'}?text=${encodeURIComponent(
                    tProp('whatsappInterestText', { name: property.name })
                  )}`}
                />
              </div>
            </div>
          </div>
        </div>

        <SimilarListings
          items={similar.map((u) => ({
            id: u.id,
            slug: u.slug,
            name: u.name,
            city: u.city,
            zone: u.zone,
            images: u.images,
            price: u.price_mxn,
            bedrooms: u.bedrooms,
            bathrooms: u.bathrooms,
            area: u.area_m2,
            unitNumber: u.unit_number,
            developmentName: u.development_name,
          }))}
          kind="unit"
          locale={locale}
        />

        {/* Aviso legal sobre TC referencial — al final del contenido principal. */}
        <PriceDisclaimer />
      </div>

      <MobileContactBar
        price={property.price.mxn}
        propertyName={property.name}
        propertyUrl={`https://propyte.com/${locale}/propiedades/${slug}`}
        locale={locale}
        roiPct={property.roi.projected}
      />
    </>
  );
}

function SpecChip({ icon, label }: { icon: React.ReactNode; label: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
      <span className="text-[#0E7490]">{icon}</span>
      {label}
    </div>
  );
}
