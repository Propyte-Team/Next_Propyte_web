import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, MapPin, Building2, Calendar, ExternalLink, FileDown } from 'lucide-react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import { getDevelopmentBySlug, getDevelopmentWithUnits, getRentalEstimate, getDevelopmentFinancials, getMlRentalEstimates, getAirdnaMarketSummary, APPROVED_STATUSES } from '@/lib/supabase/queries';
import { formatPrice } from '@/lib/formatters';
import { CITY_TO_AIRDNA } from '@/lib/calculator';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import ContactForm from '@/components/property/ContactForm';
import RentalEstimate from '@/components/property/RentalEstimate';
import InvestmentSummary from '@/components/property/InvestmentSummary';
import UnitModelsTable from '@/components/property/UnitModelsTable';
import { slugify } from '@/lib/utils';

export const revalidate = 3600; // ISR: revalidate every hour

// ── City detection ──────────────────────────────────
const CITY_MAP: Record<string, { name: string; state: string; descEs: string; descEn: string }> = {
  'cancun': { name: 'Cancun', state: 'Quintana Roo', descEs: 'Explora los nuevos desarrollos inmobiliarios en Cancun, Quintana Roo. Preventas de departamentos, casas y terrenos con los mejores precios.', descEn: 'Explore new real estate developments in Cancun, Quintana Roo. Pre-sale apartments, houses, and land at the best prices.' },
  'playa-del-carmen': { name: 'Playa del Carmen', state: 'Quintana Roo', descEs: 'Descubre los nuevos desarrollos en Playa del Carmen. Condos de inversion, preventas y oportunidades en la Riviera Maya.', descEn: 'Discover new developments in Playa del Carmen. Investment condos, pre-sales, and opportunities in the Riviera Maya.' },
  'tulum': { name: 'Tulum', state: 'Quintana Roo', descEs: 'Nuevos lanzamientos inmobiliarios en Tulum. Departamentos, villas y terrenos en preventa con alto potencial de inversion.', descEn: 'New real estate launches in Tulum. Apartments, villas, and land in pre-sale with high investment potential.' },
  'merida': { name: 'Merida', state: 'Yucatan', descEs: 'Desarrollos inmobiliarios en Merida, Yucatan. Terrenos, casas y departamentos en preventa en las mejores zonas.', descEn: 'Real estate developments in Merida, Yucatan. Land, houses, and apartments in pre-sale in the best zones.' },
};

function isCity(slug: string) { return slug in CITY_MAP; }

export async function generateStaticParams() {
  const cityParams = Object.keys(CITY_MAP).map(city => ({ slug: city }));

  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .schema('real_estate_hub' as 'public')
      .from('v_developments')
      .select('slug')
      .not('approved_at', 'is', null)
      .in('zoho_pipeline_status', APPROVED_STATUSES)
      .limit(1000);

    if (data && data.length > 0) {
      return [...cityParams, ...data.map((p: { slug: string }) => ({ slug: p.slug }))];
    }
  } catch (err) {
    console.error('generateStaticParams failed:', err);
  }

  return cityParams;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const isEn = locale === 'en';

  // ── City page metadata ──
  if (isCity(slug)) {
    const city = CITY_MAP[slug];
    return {
      title: isEn
        ? `New Developments in ${city.name}, ${city.state} | Pre-Sales & Prices`
        : `Nuevos Desarrollos en ${city.name}, ${city.state} | Preventas y Precios`,
      description: isEn ? city.descEn : city.descEs,
      alternates: { languages: { es: `/es/desarrollos/${slug}`, en: `/en/desarrollos/${slug}`, 'x-default': `/es/desarrollos/${slug}` } },
    };
  }

  // ── Development page metadata ──
  let property: any = null;
  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await getDevelopmentBySlug(supabase, slug);
    if (data) property = data;
  } catch (err) {
    console.error('Metadata query failed:', err);
  }
  if (!property) return {};
  const title = isEn
    ? `${property.name} — ${property.city} | Pre-sale ${property.stage === 'preventa' ? 'Prices' : 'Now'}`
    : `${property.name} — ${property.city} | ${property.stage === 'preventa' ? 'Preventa' : 'En Construccion'}`;

  const description = isEn
    ? (property.description_en || `${property.name} in ${property.zone || ''}, ${property.city}. ${(property.price_min_mxn || (property.price_min_mxn || property.price_mxn)) > 0 ? `From ${formatPrice(property.price_min_mxn || (property.price_min_mxn || property.price_mxn))}.` : ''} Pre-sale opportunity in Riviera Maya.`)
    : (property.description_es || `${property.name} en ${property.zone || ''}, ${property.city}. ${(property.price_min_mxn || (property.price_min_mxn || property.price_mxn)) > 0 ? `Desde ${formatPrice(property.price_min_mxn || (property.price_min_mxn || property.price_mxn))}.` : ''} Oportunidad de preventa.`);

  return {
    title,
    description: description.slice(0, 155),
    openGraph: {
      title: property.name,
      description,
      images: property.images?.[0] ? [{ url: property.images[0], width: 800, height: 450 }] : [],
      type: 'website',
      locale: isEn ? 'en_US' : 'es_MX',
    },
    twitter: {
      card: 'summary_large_image',
      title: property.name,
      description,
    },
    alternates: {
      languages: {
        es: `/es/desarrollos/${slug}`,
        en: `/en/desarrollos/${slug}`,
        'x-default': `/es/desarrollos/${slug}`,
      },
    },
  };
}

// Helper to safely get supabase anon client (service_role fails permission on views)
async function getSupabase() {
  try {
    return createPublicSupabaseClient();
  } catch (err) {
    console.error('Supabase client init failed:', err);
    return null;
  }
}

export default async function DesarrolloDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const isEn = locale === 'en';
  const supabase = await getSupabase();

  // ── CITY PAGE ─────────────────────────────────────
  if (isCity(slug)) {
    const cityInfo = CITY_MAP[slug];

    let properties: any[] = [];
    let count = 0;

    try {
      if (!supabase) throw new Error('No Supabase');
      const { data, count: dbCount } = await supabase
        .schema('real_estate_hub' as 'public')
        .from('v_developments')
        .select('id, slug, name, city, zone, state, price_min_mxn, stage, property_types, images, developer_name, developer_logo_url', { count: 'exact' })
        .not('approved_at', 'is', null)
        .in('zoho_pipeline_status', APPROVED_STATUSES)
        .ilike('city', `%${cityInfo.name}%`)
        .order('price_min_mxn', { ascending: false, nullsFirst: false })
        .limit(100);

      if (data && data.length > 0) {
        properties = data;
        count = dbCount || data.length;
      } else {
        throw new Error('No data');
      }
    } catch {
      properties = [];
      count = 0;
    }

    const zoneMap: Record<string, number> = {};
    properties?.forEach((p: { zone: string }) => { zoneMap[p.zone || cityInfo.name] = (zoneMap[p.zone || cityInfo.name] || 0) + 1; });
    const zones = Object.entries(zoneMap).sort((a, b) => b[1] - a[1]);
    const withPrice = properties?.filter((p: any) => (p.price_min_mxn || p.price_mxn) > 0) || [];
    const minPrice = withPrice.length > 0 ? Math.min(...withPrice.map((p: any) => p.price_min_mxn || p.price_mxn || 0)) : 0;

    return (
      <>
        <SchemaMarkup type="breadcrumb" data={{ itemListElement: [
          { '@type': 'ListItem', position: 1, name: isEn ? 'Home' : 'Inicio', item: `https://propyte.com/${locale}` },
          { '@type': 'ListItem', position: 2, name: isEn ? 'Developments' : 'Desarrollos', item: `https://propyte.com/${locale}/desarrollos` },
          { '@type': 'ListItem', position: 3, name: cityInfo.name },
        ] }} />
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4">
          <nav className="flex items-center gap-1 text-xs text-gray-500 mb-6">
            <Link href={`/${locale}`} className="hover:text-[#5CE0D2]">{isEn ? 'Home' : 'Inicio'}</Link>
            <ChevronRight size={12} />
            <Link href={`/${locale}/desarrollos`} className="hover:text-[#5CE0D2]">{isEn ? 'Developments' : 'Desarrollos'}</Link>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium">{cityInfo.name}</span>
          </nav>
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {isEn ? `New Developments in ${cityInfo.name}` : `Nuevos Desarrollos en ${cityInfo.name}`}
            </h1>
            <p className="mt-2 text-lg text-gray-600">{isEn ? cityInfo.descEn : cityInfo.descEs}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#5CE0D2]/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#5CE0D2]">{count || 0}</div>
              <div className="text-xs text-gray-500">{isEn ? 'Developments' : 'Desarrollos'}</div>
            </div>
            <div className="bg-[#5CE0D2]/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#5CE0D2]">{zones.length}</div>
              <div className="text-xs text-gray-500">{isEn ? 'Zones' : 'Zonas'}</div>
            </div>
            {minPrice > 0 && (
              <div className="bg-[#5CE0D2]/5 rounded-xl p-4 text-center col-span-2">
                <div className="text-lg font-bold text-[#5CE0D2]">{formatPrice(minPrice)}</div>
                <div className="text-xs text-gray-500">{isEn ? 'Starting from' : 'Desde'}</div>
              </div>
            )}
          </div>
          {zones.length > 1 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-3">{isEn ? `Zones in ${cityInfo.name}` : `Zonas en ${cityInfo.name}`}</h2>
              <div className="flex flex-wrap gap-2">
                {zones.map(([zone, zoneCount]) => (
                  <span key={zone} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full">{zone} ({zoneCount})</span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(properties || []).map((dev: any) => (
              <Link key={dev.id} href={`/${locale}/desarrollos/${dev.slug}`} className="group bg-white rounded-2xl border border-gray-100 hover:border-[#5CE0D2]/30 hover:shadow-lg transition-all overflow-hidden">
                <div className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  {dev.images?.[0] ? <img src={dev.images[0]} alt={dev.name} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center"><Building2 size={36} className="text-gray-300" /></div>}
                  <div className="absolute top-3 left-3"><span className="px-2.5 py-1 bg-[#5CE0D2] text-white text-xs font-bold rounded-full uppercase">{dev.stage === 'preventa' ? (isEn ? 'Pre-sale' : 'Preventa') : (isEn ? 'Construction' : 'Construccion')}</span></div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 group-hover:text-[#5CE0D2] transition-colors line-clamp-1">{dev.name}</h3>
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-500"><MapPin size={14} /><span>{dev.zone !== dev.city ? `${dev.zone}, ` : ''}{dev.city}</span></div>
                  {(dev.price_min_mxn || (dev.price_min_mxn || dev.price_mxn)) > 0 && <div className="mt-2 font-bold text-gray-900">{isEn ? 'From ' : 'Desde '}{formatPrice(dev.price_min_mxn || (dev.price_min_mxn || dev.price_mxn))}</div>}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-16 prose prose-gray max-w-none">
            <h2>{isEn ? `Investing in ${cityInfo.name}` : `Invertir en ${cityInfo.name}`}</h2>
            <p>{isEn
              ? `${cityInfo.name}, ${cityInfo.state} is one of Mexico's fastest-growing real estate markets with ${count || 0} active developments across ${zones.length} zones.`
              : `${cityInfo.name}, ${cityInfo.state} es uno de los mercados inmobiliarios de mayor crecimiento en Mexico con ${count || 0} desarrollos activos en ${zones.length} zonas.`
            }</p>
          </div>
        </div>
      </>
    );
  }

  // ── DEVELOPMENT DETAIL PAGE ───────────────────────
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
  const description = isEn ? (property.description_en || '') : (property.description_es || '');

  // Get similar developments in same city
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

  // Fetch rental estimate for schema markup + ML financials
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
      if (vacResult.data) {
        rentalMedianVac = vacResult.data.median_rent_mxn;
      }
      devFinancials = financialsResult;
      mlEstimates = mlEstimatesResult;
      if (airdnaResult) {
        airdnaOccupancy = airdnaResult.current_occupancy;
      }
    }
  } catch {
    // Rental/financial data not available
  }

  // Property data for financial analysis
  const propertyState = property.state || 'Quintana Roo';
  const propertyPrice = property.price_min_mxn || property.price_mxn || 0;
  // Get representative area from units or property
  const representativeArea = property.area_m2 || property.area_min || null;

  const stageLabel = property.stage === 'preventa'
    ? (isEn ? 'Pre-sale' : 'Preventa')
    : property.stage === 'construccion'
      ? (isEn ? 'Under Construction' : 'En Construccion')
      : (isEn ? 'Ready to Move In' : 'Entrega Inmediata');

  const mainType = property.property_types?.[0] || property.property_type || 'departamento';
  const typeLabel = mainType === 'departamento' ? (isEn ? 'Apartments' : 'Departamentos')
    : mainType === 'terreno' ? (isEn ? 'Land' : 'Terrenos')
    : mainType === 'casa' ? (isEn ? 'Houses' : 'Casas')
    : mainType === 'penthouse' ? 'Penthouse'
    : mainType;

  const tProp = await getTranslations({ locale, namespace: 'property' });

  return (
    <>
      {/* Schema: RealEstateListing */}
      <SchemaMarkup
        type="realEstateListing"
        data={{
          name: property.name,
          description: description,
          url: `https://propyte.com/${locale}/desarrollos/${slug}`,
          image: property.images?.[0] || undefined,
          datePosted: property.created_at,
          ...((property.price_min_mxn || property.price_mxn) > 0 && {
            offers: {
              '@type': 'Offer',
              price: (property.price_min_mxn || property.price_mxn),
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

      {/* Schema: Breadcrumb */}
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
        {/* Breadcrumbs */}
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
            {/* Hero Image / Placeholder */}
            <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden relative">
              {property.images?.[0] ? (
                <img src={property.images[0]} alt={property.name} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                  <Building2 size={64} />
                  <p className="mt-2 text-sm">{isEn ? 'Images coming soon' : 'Imagenes proximamente'}</p>
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 bg-[#5CE0D2] text-white text-sm font-bold rounded-full">
                  {stageLabel}
                </span>
              </div>
            </div>

            {/* Title & Location */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{property.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-gray-500">
                <MapPin size={18} />
                <span className="text-lg">{property.zone !== property.city ? `${property.zone}, ` : ''}{property.city}, {property.state}</span>
              </div>

              {(property.price_min_mxn || property.price_mxn) > 0 && (
                <div className="mt-4">
                  <span className="text-sm text-gray-500">{isEn ? 'Starting from' : 'Desde'}</span>
                  <div className="text-3xl font-bold text-gray-900">{formatPrice((property.price_min_mxn || property.price_mxn))}</div>
                </div>
              )}
            </div>

            {/* 3-tab layout: Descripción / Análisis Geográfico / Rentabilidad */}
            <Tabs
              tablistLabel={tProp('specs')}
              items={[
                {
                  id: 'descripcion',
                  label: tProp('tabDescripcion'),
                  panel: (
                    <div className="space-y-8">
                      {/* Key Details grid */}
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

                      {/* Description */}
                      {description && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-3">
                            {isEn ? 'About this Development' : 'Sobre este Desarrollo'}
                          </h2>
                          <p className="text-gray-600 leading-relaxed">{description}</p>
                        </div>
                      )}

                      {/* Unit Models Table */}
                      <UnitModelsTable units={units} mlEstimates={mlEstimates} locale={locale} />

                      {/* Amenities */}
                      {property.amenities?.length > 0 && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-3">
                            {isEn ? 'Amenities' : 'Amenidades'}
                          </h2>
                          <div className="flex flex-wrap gap-2">
                            {property.amenities.map((amenity: string) => (
                              <span key={amenity} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Brochure download */}
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

                      {/* Developer info */}
                      {property.developer_name && (
                        <div className="bg-gray-50 rounded-2xl p-6">
                          <h2 className="text-lg font-bold text-gray-900 mb-2">
                            {isEn ? 'Developer' : 'Desarrolladora'}
                          </h2>
                          <div className="flex items-center gap-3">
                            {property.developer_logo_url && (
                              <img src={property.developer_logo_url} alt={property.developer_name} className="w-12 h-12 rounded-lg object-contain bg-white" />
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
            {/* Contact Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
              {/* Named agent */}
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
                  : 'Recibe precios, planos y disponibilidad directamente de nuestros asesores.'
                }
              </p>
              <ContactForm propertyId={property.id} propertyName={property.name} />

              {/* Direct WhatsApp for this agent */}
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

        {/* Similar Developments */}
        {similar && similar.length > 0 && (
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
                        {isEn ? 'From ' : 'Desde '}{formatPrice((dev.price_min_mxn || dev.price_mxn))}
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
