import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, MapPin, Building2, Calendar, FileDown } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import {
  getDevelopmentBySlug,
  getDevelopmentWithUnits,
  getRentalEstimate,
  getDevelopmentFinancials,
  getMlRentalEstimates,
  getAirdnaMarketSummary,
  APPROVED_STATUSES,
} from '@/lib/supabase/queries';
import { formatPrice } from '@/lib/formatters';
import { CITY_TO_AIRDNA } from '@/lib/calculator';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import ContactForm from '@/components/property/ContactForm';
import RentalEstimate from '@/components/property/RentalEstimate';
import InvestmentSummary from '@/components/property/InvestmentSummary';
import UnitModelsTable from '@/components/property/UnitModelsTable';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import { slugify } from '@/lib/utils';

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

  // ── Similar developments ──
  let similar: any[] = [];
  try {
    if (!supabase) throw new Error('No Supabase');
    const { data } = await supabase
      .schema('real_estate_hub' as 'public')
      .from('v_developments')
      .select('id, slug, name, city, zone, price_min_mxn, stage, property_types, images, developer_name')
      .not('approved_at', 'is', null)
      .in('zoho_pipeline_status', APPROVED_STATUSES)
      .eq('city', property.city)
      .neq('id', property.id)
      .limit(6);
    if (data) similar = data;
  } catch (err) {
    console.error('Similar query failed:', err);
    similar = [];
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

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4">
        <nav className="flex items-center gap-1 text-xs text-gray-500 mb-6">
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
            {/* Hero */}
            <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden relative">
              {property.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={property.images[0]} alt={property.name} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                  <Building2 size={64} />
                  <p className="mt-2 text-sm">{isEn ? 'Images coming soon' : 'Imagenes proximamente'}</p>
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 bg-[#5CE0D2] text-white text-sm font-bold rounded-full">{stageLabel}</span>
              </div>
            </div>

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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                          <Building2 size={24} className="mx-auto text-[#5CE0D2] mb-2" />
                          <div className="text-sm font-bold text-gray-900">{typeLabel}</div>
                          <div className="text-xs text-gray-500">{isEn ? 'Property Type' : 'Tipo'}</div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                          <Calendar size={24} className="mx-auto text-[#5CE0D2] mb-2" />
                          <div className="text-sm font-bold text-gray-900">{stageLabel}</div>
                          <div className="text-xs text-gray-500">{isEn ? 'Stage' : 'Etapa'}</div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                          <MapPin size={24} className="mx-auto text-[#5CE0D2] mb-2" />
                          <div className="text-sm font-bold text-gray-900">{property.zone || property.city}</div>
                          <div className="text-xs text-gray-500">{isEn ? 'Zone' : 'Zona'}</div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                          <MapPin size={24} className="mx-auto text-[#5CE0D2] mb-2" />
                          <div className="text-sm font-bold text-gray-900">{property.state}</div>
                          <div className="text-xs text-gray-500">{isEn ? 'State' : 'Estado'}</div>
                        </div>
                      </div>

                      {description && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-3">
                            {isEn ? 'About this Development' : 'Sobre este Desarrollo'}
                          </h2>
                          <p className="text-gray-600 leading-relaxed">{description}</p>
                        </div>
                      )}

                      <UnitModelsTable units={units} mlEstimates={mlEstimates} locale={locale} />

                      {property.amenities?.length > 0 && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-3">{isEn ? 'Amenities' : 'Amenidades'}</h2>
                          <div className="flex flex-wrap gap-2">
                            {property.amenities.map((amenity: string) => (
                              <span key={amenity} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {property.brochure_url && (
                        <div>
                          <a
                            href={property.brochure_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A2F3F] hover:bg-[#0F1923] text-white font-semibold rounded-xl transition-colors"
                          >
                            <FileDown size={20} />
                            {isEn ? 'Download Brochure' : 'Descargar Brochure'}
                          </a>
                        </div>
                      )}

                      {property.developer_name && (
                        <div className="bg-gray-50 rounded-2xl p-6">
                          <h2 className="text-lg font-bold text-gray-900 mb-2">
                            {isEn ? 'Developer' : 'Desarrolladora'}
                          </h2>
                          <div className="flex items-center gap-3">
                            {property.developer_logo_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={property.developer_logo_url}
                                alt={property.developer_name}
                                className="w-12 h-12 rounded-lg object-contain bg-white"
                              />
                            )}
                            <div>
                              <div className="font-bold text-gray-900">{property.developer_name}</div>
                            </div>
                          </div>
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
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

        {/* Similar developments */}
        {similar.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {isEn ? `More Developments in ${property.city}` : `Mas Desarrollos en ${property.city}`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((dev) => (
                <Link
                  key={dev.id}
                  href={`/${locale}/desarrollos/${dev.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-[#5CE0D2]/30 hover:shadow-lg transition-all overflow-hidden"
                >
                  <div className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 relative">
                    {dev.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={dev.images[0]} alt={dev.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Building2 size={36} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 group-hover:text-[#5CE0D2] transition-colors line-clamp-1">
                      {dev.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <MapPin size={14} />
                      <span>{dev.zone}, {dev.city}</span>
                    </div>
                    {(dev.price_min_mxn || dev.price_mxn) > 0 && (
                      <div className="mt-2 font-bold text-gray-900">
                        {isEn ? 'From ' : 'Desde '}{formatPrice(dev.price_min_mxn || dev.price_mxn)}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
