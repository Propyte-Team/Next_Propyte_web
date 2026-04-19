import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, MapPin, Building2, Calendar, FileText, TrendingUp,
  Package, DollarSign, Bed, Bath, Square, Download,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import {
  getDevelopmentBySlug,
  getDevelopmentWithUnits,
  getRentalEstimate,
  getDevelopmentFinancials,
  getMlRentalEstimates,
  getAirdnaMarketSummary,
  getDeveloperProjectCount,
  getDeveloperById,
  getSimilarDevelopments,
} from '@/lib/supabase/queries';
import { formatPrice } from '@/lib/formatters';
import { CITY_TO_AIRDNA } from '@/lib/calculator';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import SimilarListings, { type SimilarListingItem } from '@/components/shared/SimilarListings';
import ContactForm from '@/components/property/ContactForm';
import ImageGallery from '@/components/property/ImageGallery';
import MobileContactBar from '@/components/property/MobileContactBar';
import RentalEstimate from '@/components/property/RentalEstimate';
import InvestmentSummary from '@/components/property/InvestmentSummary';
import UnitModelsTable from '@/components/property/UnitModelsTable';
import AmenityList from '@/components/property/AmenityList';
import VirtualTour from '@/components/property/VirtualTour';
import VideoPlayer from '@/components/property/VideoPlayer';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import { slugify, deriveFilenameFromUrl } from '@/lib/utils';

interface DevelopmentDetailPageProps {
  locale: string;
  slug: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function DevelopmentDetailPage({ locale, slug }: DevelopmentDetailPageProps) {
  const isEn = locale === 'en';
  const supabase = createPublicSupabaseClient();

  // ── Fetch development + units ──
  let property: any = null;
  let units: any[] = [];
  try {
    if (!supabase) throw new Error('No Supabase');
    const { data } = await getDevelopmentWithUnits(supabase, slug);
    if (data) {
      const { units: devUnits, ...devData } = data;
      property = devData;
      units = devUnits || [];
    }
  } catch (err) {
    console.error('Development query failed:', err);
    try {
      if (supabase) {
        const { data } = await getDevelopmentBySlug(supabase, slug);
        if (data) property = data;
      }
    } catch (err2) {
      console.error('Fallback query failed:', err2);
    }
  }

  if (!property) notFound();

  const citySlug = slugify(property.city);
  const description = isEn ? property.description_en || '' : property.description_es || '';

  // ── Similar developments (4-level fallback) ──
  let similar: SimilarListingItem[] = [];
  try {
    if (supabase) {
      const data = await getSimilarDevelopments(
        supabase,
        {
          id: property.id,
          city: property.city,
          zone: property.zone || null,
          property_type: property.property_types?.[0] || property.property_type || null,
        },
        4,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      similar = (data as any[]).map((d) => ({
        id: d.id,
        slug: d.slug,
        name: d.name,
        city: d.city,
        zone: d.zone,
        images: d.images,
        price: d.price_min_mxn || null,
      }));
    }
  } catch (err) {
    console.error('Similar query failed:', err);
  }

  // ── Rental + financial data ──
  let rentalMedian: number | null = null;
  let rentalPerM2: number | null = null;
  let rentalMedianVac: number | null = null;
  let devFinancials: Awaited<ReturnType<typeof getDevelopmentFinancials>> = null;
  let mlEstimates: Awaited<ReturnType<typeof getMlRentalEstimates>> = [];
  let airdnaOccupancy: number | null = null;
  try {
    if (supabase) {
      const propType = property.property_types?.[0] || property.property_type || 'departamento';
      const airdnaMarket = CITY_TO_AIRDNA[property.city] || '';
      const [rentalResult, vacResult, financialsResult, mlEstimatesResult, airdnaResult] = await Promise.all([
        getRentalEstimate(supabase, property.city, propType, null, property.zone, 'residencial'),
        getRentalEstimate(supabase, property.city, propType, null, property.zone, 'vacacional'),
        getDevelopmentFinancials(supabase, property.id),
        getMlRentalEstimates(supabase, property.id),
        airdnaMarket ? getAirdnaMarketSummary(supabase, airdnaMarket) : Promise.resolve(null),
      ]);
      if (rentalResult.data) {
        rentalMedian = rentalResult.data.median_rent_mxn;
        rentalPerM2 = rentalResult.data.avg_rent_per_m2;
      }
      if (vacResult.data) rentalMedianVac = vacResult.data.median_rent_mxn;
      devFinancials = financialsResult;
      mlEstimates = mlEstimatesResult;
      if (airdnaResult) airdnaOccupancy = airdnaResult.current_occupancy;
    }
  } catch (err) {
    console.error('Rental/financial fetch failed:', err);
  }

  const propertyState = property.state || 'Quintana Roo';
  const propertyPrice = property.price_min_mxn || property.price_mxn || 0;
  const representativeArea = property.area_m2 || property.area_min || null;

  // ── Developer: project count + fallback record (ISR, amortized) ──
  // The v_developments view often returns developer_name/slug as null even
  // when developer_id is set. We fetch the row directly from
  // Propyte_desarrolladores as fallback so the card renders regardless.
  let developerProjects = 0;
  let developerRecord: Awaited<ReturnType<typeof getDeveloperById>> = null;
  if (supabase && property.developer_id) {
    try {
      [developerProjects, developerRecord] = await Promise.all([
        getDeveloperProjectCount(supabase, property.developer_id),
        getDeveloperById(supabase, property.developer_id),
      ]);
    } catch (err) {
      console.error('Developer fetch failed:', err);
    }
  }

  const developerDisplay = {
    name: developerRecord?.name || property.developer_name || null,
    logoUrl: developerRecord?.logoUrl || property.developer_logo_url || null,
    slug: developerRecord?.slug
      || property.developer_slug
      || (developerRecord?.name ? slugify(developerRecord.name) : null)
      || (property.developer_name ? slugify(property.developer_name) : null),
    verified: developerRecord?.verified || false,
    yearsExperience: developerRecord?.yearsExperience ?? null,
    unitsDelivered: developerRecord?.unitsDelivered ?? null,
    description: (isEn ? developerRecord?.descriptionEn : developerRecord?.descriptionEs)
      || developerRecord?.descriptionEs
      || null,
  };

  const developerInitials: string | null = developerDisplay.name
    ? (developerDisplay.name as string)
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase() || '')
        .join('') || null
    : null;

  // ── Unit aggregates (ranges) derived from units array ──
  interface UnitLite {
    bedrooms: number | null;
    bathrooms: number | null;
    area_m2: number | null;
    price_mxn: number | null;
    availability_status: string | null;
  }
  const unitList = units as UnitLite[];
  const rangeOf = (key: keyof UnitLite) => {
    const values = unitList
      .map((u) => u[key])
      .filter((v): v is number => typeof v === 'number' && v > 0);
    if (values.length === 0) return null;
    return { min: Math.min(...values), max: Math.max(...values) };
  };
  const bedRange = rangeOf('bedrooms');
  const bathRange = rangeOf('bathrooms');
  const areaRange = rangeOf('area_m2');
  const priceRange = rangeOf('price_mxn');
  const availableCount = unitList.filter((u) => u.availability_status === 'disponible').length;
  const totalUnits = property.total_units || unitList.length || null;
  const derivedAvailable = property.available_units ?? (availableCount > 0 ? availableCount : null);

  // ── Delivery display ──
  const deliveryDisplay = property.delivery_text
    || property.estimated_delivery
    || (property.construction_progress != null
        ? isEn ? `${property.construction_progress}% complete` : `${property.construction_progress}% completo`
        : null);

  // ── Starting price $/m² ──
  const pricePerM2 = propertyPrice > 0 && representativeArea && representativeArea > 0
    ? Math.round(propertyPrice / representativeArea)
    : null;

  // ── ROI projection from financials ──
  const roiDisplay = devFinancials?.roi_annual_pct ?? property.roi_projected ?? null;

  const stageLabel =
    property.stage === 'preventa'
      ? isEn ? 'Pre-sale' : 'Preventa'
      : property.stage === 'construccion'
        ? isEn ? 'Under Construction' : 'En Construccion'
        : isEn ? 'Ready to Move In' : 'Entrega Inmediata';

  const mainType = property.property_types?.[0] || property.property_type || 'departamento';
  const typeLabel =
    mainType === 'departamento'
      ? isEn ? 'Apartments' : 'Departamentos'
      : mainType === 'terreno'
        ? isEn ? 'Land' : 'Terrenos'
        : mainType === 'casa'
          ? isEn ? 'Houses' : 'Casas'
          : mainType === 'penthouse'
            ? 'Penthouse'
            : mainType;

  const tProp = await getTranslations({ locale, namespace: 'property' });

  return (
    <>
      <SchemaMarkup
        type="realEstateListing"
        data={{
          name: property.name,
          description,
          url: `https://propyte.com/${locale}/desarrollos/${slug}`,
          image: property.images?.[0] || undefined,
          datePosted: property.created_at,
          ...((property.price_min_mxn || property.price_mxn) > 0 && {
            offers: {
              '@type': 'Offer',
              price: property.price_min_mxn || property.price_mxn,
              priceCurrency: 'MXN',
              availability: 'https://schema.org/InStock',
            },
          }),
          address: {
            '@type': 'PostalAddress',
            streetAddress: property.zone || property.city,
            addressLocality: property.city,
            addressRegion: property.state,
            addressCountry: 'MX',
          },
          ...(rentalMedian && {
            additionalProperty: {
              '@type': 'PropertyValue',
              name: 'estimatedMonthlyRent',
              value: rentalMedian,
              unitCode: 'MXN',
              description: 'Estimated monthly rental income based on comparable listings',
            },
          }),
        }}
      />

      <SchemaMarkup
        type="breadcrumb"
        data={{
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: isEn ? 'Home' : 'Inicio', item: `https://propyte.com/${locale}` },
            { '@type': 'ListItem', position: 2, name: isEn ? 'Developments' : 'Desarrollos', item: `https://propyte.com/${locale}/desarrollos` },
            { '@type': 'ListItem', position: 3, name: property.city, item: `https://propyte.com/${locale}/desarrollos/${citySlug}` },
            { '@type': 'ListItem', position: 4, name: property.name },
          ],
        }}
      />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4 pb-24 md:pb-6">
        <nav aria-label={isEn ? 'Breadcrumb' : 'Migas de pan'} className="flex items-center gap-1 text-xs text-gray-500 mb-6">
          <Link href={`/${locale}`} className="hover:text-[#5CE0D2]">{isEn ? 'Home' : 'Inicio'}</Link>
          <ChevronRight size={12} />
          <Link href={`/${locale}/desarrollos`} className="hover:text-[#5CE0D2]">{isEn ? 'Developments' : 'Desarrollos'}</Link>
          <ChevronRight size={12} />
          <Link href={`/${locale}/desarrollos/${citySlug}`} className="hover:text-[#5CE0D2]">{property.city}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{property.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero gallery */}
            <ImageGallery
              images={(property.images || []).filter((x: unknown): x is string => typeof x === 'string' && x.length > 0)}
              alt={property.name}
              badgeTopLeft={
                <span className="px-3 py-1.5 bg-[#5CE0D2] text-white text-sm font-bold rounded-full">{stageLabel}</span>
              }
            />

            {/* Title & Location */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{property.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-gray-500">
                <MapPin size={18} />
                <span className="text-lg">
                  {property.zone !== property.city ? `${property.zone}, ` : ''}
                  {property.city}, {property.state}
                </span>
              </div>
              {(property.price_min_mxn || property.price_mxn) > 0 && (
                <div className="mt-4">
                  <span className="text-sm text-gray-500">{isEn ? 'Starting from' : 'Desde'}</span>
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPrice(property.price_min_mxn || property.price_mxn)}
                  </div>
                </div>
              )}
            </div>

            {/* 3-tab layout */}
            <Tabs
              tablistLabel={tProp('specs')}
              items={[
                {
                  id: 'descripcion',
                  label: tProp('tabDescripcion'),
                  panel: (
                    <div className="space-y-8">
                      {/* Unit range chips */}
                      {(bedRange || bathRange || areaRange || priceRange) && (
                        <div className="flex flex-wrap gap-2">
                          {bedRange && (
                            <RangeChip
                              icon={<Bed size={16} />}
                              label={isEn
                                ? formatRange(bedRange, bedRange.max === 1 ? 'bed' : 'beds')
                                : formatRange(bedRange, 'rec')}
                            />
                          )}
                          {bathRange && (
                            <RangeChip
                              icon={<Bath size={16} />}
                              label={isEn
                                ? formatRange(bathRange, bathRange.max === 1 ? 'bath' : 'baths')
                                : formatRange(bathRange, 'baños')}
                            />
                          )}
                          {areaRange && (
                            <RangeChip
                              icon={<Square size={16} />}
                              label={formatRange(areaRange, 'm²')}
                            />
                          )}
                          <RangeChip
                            icon={<Building2 size={16} />}
                            label={typeLabel}
                          />
                        </div>
                      )}

                      {/* 4 metric cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard
                          icon={<DollarSign size={22} />}
                          label={isEn ? 'Starting from' : 'Precio desde'}
                          value={propertyPrice > 0 ? formatPrice(propertyPrice) : '—'}
                          note={pricePerM2 ? `${formatPrice(pricePerM2)}/m²` : undefined}
                        />
                        <MetricCard
                          icon={<Package size={22} />}
                          label={isEn ? 'Availability' : 'Disponibilidad'}
                          value={
                            derivedAvailable != null && totalUnits
                              ? `${derivedAvailable} / ${totalUnits}`
                              : derivedAvailable != null
                                ? String(derivedAvailable)
                                : isEn ? 'Inquire' : 'Consultar'
                          }
                          note={
                            derivedAvailable != null && totalUnits
                              ? (isEn ? 'units available' : 'unidades disp.')
                              : undefined
                          }
                        />
                        <MetricCard
                          icon={<Calendar size={22} />}
                          label={isEn ? 'Delivery' : 'Entrega'}
                          value={deliveryDisplay || stageLabel}
                          note={property.construction_progress != null && property.construction_progress > 0
                            ? `${property.construction_progress}%`
                            : undefined}
                        />
                        <MetricCard
                          icon={<TrendingUp size={22} />}
                          label={isEn ? 'Projected ROI' : 'ROI proyectado'}
                          value={roiDisplay != null ? `${roiDisplay.toFixed(1)}%` : '—'}
                          note={isEn ? 'annual' : 'anual'}
                        />
                      </div>

                      {description && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-3">
                            {isEn ? 'About this Development' : 'Sobre este Desarrollo'}
                          </h2>
                          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
                        </div>
                      )}

                      {/* Virtual Tour + Video */}
                      {(property.virtual_tour_url || property.video_url) && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {isEn ? 'Explore the development' : 'Recorre el desarrollo'}
                          </h2>
                          <div className={`grid gap-4 ${property.virtual_tour_url && property.video_url ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                            {property.virtual_tour_url && (
                              <VirtualTour url={property.virtual_tour_url} propertyName={property.name} />
                            )}
                            {property.video_url && (
                              <VideoPlayer
                                url={property.video_url}
                                propertyName={property.name}
                                thumbnail={property.images?.[0]}
                              />
                            )}
                          </div>
                        </div>
                      )}

                      <UnitModelsTable units={units} mlEstimates={mlEstimates} locale={locale} />

                      <AmenityList locale={locale} amenities={property.amenities || undefined} />

                      {property.brochure_url && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-3">
                            {isEn ? 'Documents' : 'Documentos'}
                          </h2>
                          <a
                            href={property.brochure_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-colors"
                          >
                            <div className="w-12 h-12 rounded-lg bg-[#1A2F3F] flex items-center justify-center shrink-0">
                              <FileText size={22} className="text-[#5CE0D2]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-900 truncate">
                                {isEn ? 'Brochure' : 'Brochure'}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {deriveFilenameFromUrl(property.brochure_url, 'brochure.pdf')}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0D9488] group-hover:text-[#5CE0D2] shrink-0">
                              <Download size={16} />
                              {isEn ? 'Download' : 'Descargar'}
                            </div>
                          </a>
                        </div>
                      )}

                      {developerDisplay.name && (
                        <div className="bg-gray-50 rounded-2xl p-6">
                          <h2 className="text-lg font-bold text-gray-900 mb-4">
                            {isEn ? 'Developer' : 'Desarrolladora'}
                          </h2>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                              {developerDisplay.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={developerDisplay.logoUrl}
                                  alt={developerDisplay.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : developerInitials ? (
                                <span className="text-xl font-extrabold text-[#0D9488] tracking-tight">
                                  {developerInitials}
                                </span>
                              ) : (
                                <Building2 size={28} className="text-gray-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-gray-900 text-lg truncate">{developerDisplay.name}</div>
                                {developerDisplay.verified && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold text-[#0D9488] bg-[#5CE0D2]/15 rounded-full uppercase tracking-wider">
                                    {isEn ? 'Verified' : 'Verificado'}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                {developerProjects > 0 && (
                                  <span>
                                    {isEn
                                      ? `${developerProjects} ${developerProjects === 1 ? 'project' : 'projects'} on Propyte`
                                      : `${developerProjects} ${developerProjects === 1 ? 'proyecto' : 'proyectos'} en Propyte`}
                                  </span>
                                )}
                                {developerDisplay.yearsExperience != null && developerDisplay.yearsExperience > 0 && (
                                  <span>
                                    · {developerDisplay.yearsExperience} {isEn ? 'yrs experience' : 'años de experiencia'}
                                  </span>
                                )}
                                {developerDisplay.unitsDelivered != null && developerDisplay.unitsDelivered > 0 && (
                                  <span>
                                    · {developerDisplay.unitsDelivered.toLocaleString()} {isEn ? 'units delivered' : 'unidades entregadas'}
                                  </span>
                                )}
                              </div>
                            </div>
                            {developerDisplay.slug && (
                              <Link
                                href={`/${locale}/desarrolladores/${developerDisplay.slug}`}
                                className="px-4 py-2 bg-white border border-gray-200 hover:border-[#5CE0D2] text-sm font-semibold text-gray-700 rounded-lg transition-colors shrink-0"
                              >
                                {isEn ? 'View profile' : 'Ver perfil'}
                              </Link>
                            )}
                          </div>
                          {developerDisplay.description && (
                            <p className="text-sm text-gray-600 leading-relaxed mt-4 pt-4 border-t border-gray-200">
                              {developerDisplay.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  id: 'geo',
                  label: tProp('tabGeo'),
                  panel: (
                    <div className="space-y-6">
                      <div className="aspect-[16/9] bg-[#F4F6F8] rounded-xl flex flex-col items-center justify-center text-gray-400">
                        <MapPin size={40} strokeWidth={1.5} className="mb-3" />
                        <p className="text-sm font-medium">{tProp('geoMapComingSoon')}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-xs text-gray-500 mb-1">{tProp('geoAddress')}</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {property.address || `${property.zone || ''}, ${property.city}`}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-xs text-gray-500 mb-1">{tProp('geoZone')}</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {property.zone || property.city}, {property.state}
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'rentabilidad',
                  label: tProp('tabRentabilidad'),
                  panel: (
                    <div className="space-y-8">
                      <RentalEstimate
                        city={property.city}
                        zone={property.zone}
                        propertyType={property.property_types?.[0] || property.property_type || 'departamento'}
                        bedrooms={null}
                        locale={locale}
                        areaM2={representativeArea}
                        priceMin={propertyPrice > 0 ? propertyPrice : null}
                        state={propertyState}
                      />
                      {devFinancials && (
                        <InvestmentSummary
                          financials={devFinancials}
                          locale={locale}
                          price={propertyPrice > 0 ? propertyPrice : null}
                          state={propertyState}
                          estimatedRent={
                            rentalPerM2 && representativeArea
                              ? Math.round(rentalPerM2 * representativeArea)
                              : rentalMedian
                          }
                          estimatedRentVac={rentalMedianVac}
                          airdnaOccupancy={airdnaOccupancy}
                        />
                      )}
                    </div>
                  ),
                },
              ] satisfies TabItem[]}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div id="contact-form" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24 scroll-mt-24">
              {property.contact_name && (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5CE0D2] to-[#1A2F3F] flex items-center justify-center text-white font-bold text-sm">
                    {property.contact_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{property.contact_name}</div>
                    <div className="text-xs text-gray-400">{isEn ? 'Verified Advisor' : 'Asesor Verificado'}</div>
                  </div>
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {isEn ? 'Interested in this development?' : 'Te interesa este desarrollo?'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {isEn
                  ? 'Get pricing, floor plans, and availability directly from our advisors.'
                  : 'Recibe precios, planos y disponibilidad directamente de nuestros asesores.'}
              </p>
              <ContactForm propertyId={property.id} propertyName={property.name} />

              {property.contact_phone && (
                <a
                  href={`https://wa.me/${property.contact_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    isEn
                      ? `Hi, I'm interested in ${property.name}. I saw it on Propyte.`
                      : `Hola, me interesa ${property.name}. Lo vi en Propyte.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-12 mt-3 bg-[#25D366] hover:bg-[#1EBE57] text-white font-semibold rounded-lg transition-colors"
                >
                  WhatsApp {property.contact_name ? `· ${property.contact_name.split(' ')[0]}` : ''}
                </a>
              )}
            </div>
          </div>
        </div>

        <SimilarListings items={similar} kind="development" locale={locale} />
      </div>

      <MobileContactBar
        price={propertyPrice}
        propertyName={property.name}
        propertyUrl={`https://propyte.com/${locale}/desarrollos/${slug}`}
        locale={locale}
        roiPct={roiDisplay ?? undefined}
      />
    </>
  );
}

// ── helpers ──

function formatRange(r: { min: number; max: number }, suffix: string): string {
  const fmt = (n: number) => Number.isInteger(n) ? String(n) : n.toFixed(1);
  return r.min === r.max
    ? `${fmt(r.max)} ${suffix}`
    : `${fmt(r.min)}–${fmt(r.max)} ${suffix}`;
}

function RangeChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
      <span className="text-[#5CE0D2]">{icon}</span>
      {label}
    </div>
  );
}

function MetricCard({
  icon, label, value, note,
}: { icon: React.ReactNode; label: string; value: string; note?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">{label}</span>
        <span className="text-[#5CE0D2]">{icon}</span>
      </div>
      <div className="text-base md:text-lg font-bold text-gray-900 leading-tight truncate">{value}</div>
      {note && <div className="text-[10px] text-gray-400 mt-0.5">{note}</div>}
    </div>
  );
}
