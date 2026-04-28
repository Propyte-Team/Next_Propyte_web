import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, MapPin, Bed, Bath, Square, Car, Building2, ArrowLeft,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import {
  getUnitBySlug,
  getRentalEstimate,
  getAirdnaMarketSummary,
  getSimilarUnits,
} from '@/lib/supabase/queries';
import { getMockUnit, getSimilarMockUnits } from '@/lib/mocks/unit-fixtures';
import { mapUnitToProperty, type UnitRow } from '@/lib/mappers/unit-to-property';
import { formatPrice } from '@/lib/formatters';
import { CITY_TO_AIRDNA, VAC } from '@/lib/calculator';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import SimilarListings from '@/components/shared/SimilarListings';
import ContactForm from '@/components/property/ContactForm';
import ImageGallery from '@/components/property/ImageGallery';
import MobileContactBar from '@/components/property/MobileContactBar';
import ShareDownloadModal, { type ShareDownloadData } from '@/components/property/ShareDownloadModal';
import Badge from '@/components/ui/Badge';
import ExpandableText from '@/components/ui/ExpandableText';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import UnitInvestmentCalculator from './UnitInvestmentCalculator';
import MarketIndicator from './MarketIndicator';
import AmenityList from '@/components/property/AmenityList';
import UnitFAQs from './UnitFAQs';
import { slugify } from '@/lib/utils';

interface UnitDetailPageProps {
  locale: string;
  slug: string;
}

export default async function UnitDetailPage({ locale, slug }: UnitDetailPageProps) {
  const supabase = createPublicSupabaseClient();
  const tProp = await getTranslations({ locale, namespace: 'property' });

  // ── Fetch unit row — Supabase first, mock fallback ──
  let row: UnitRow | null = null;
  try {
    if (supabase) {
      const { data } = await getUnitBySlug(supabase, slug);
      if (data) row = data as UnitRow;
    }
  } catch (err) {
    console.error('Unit query failed:', err);
  }

  if (!row) row = getMockUnit(slug);
  if (!row) notFound();

  const property = mapUnitToProperty(row);
  const description = property.description[locale as 'es' | 'en'] || property.description.es || '';
  const citySlug = slugify(property.location.city);

  // ── Rental estimates + AirDNA ──
  let estRentRes: number | null = null;
  let estRentVac: number | null = null;
  let airdnaOccupancy: number | null = null;

  try {
    if (supabase) {
      const airdnaMarket = CITY_TO_AIRDNA[property.location.city] || '';
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

  if (similar.length === 0) {
    similar = getSimilarMockUnits(slug, property.location.city, 4).map((u) => ({
      id: u.id, slug: u.slug, name: u.development_name || u.name,
      city: u.city, zone: u.zone, images: u.images, price_mxn: u.price_mxn,
      bedrooms: u.bedrooms, bathrooms: u.bathrooms, area_m2: u.area_m2,
      unit_number: u.unit_number, development_name: u.development_name,
    }));
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

  const defaultOccupancy = airdnaOccupancy != null ? airdnaOccupancy : VAC.DEFAULT_OCCUPANCY * 100;

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
    amenidades: property.amenities?.length ? property.amenities : undefined,
    piso: row.floor != null ? String(row.floor) : undefined,
    num_unidad: row.unit_number || undefined,
    prop_type: typeLabel,
    precio_usd: row.price_usd ? formatPrice(row.price_usd) : undefined,
  };

  return (
    <>
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
        <nav aria-label={tProp('breadcrumbAriaLabel')} className="flex items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href={`/${locale}`} className="hover:text-[#5CE0D2]">{tProp('breadcrumbHome')}</Link>
          <ChevronRight size={12} />
          <Link href={`/${locale}/propiedades`} className="hover:text-[#5CE0D2]">{tProp('breadcrumbProperties')}</Link>
          <ChevronRight size={12} />
          <Link href={`/${locale}/propiedades?city=${encodeURIComponent(property.location.city)}`} className="hover:text-[#5CE0D2]">{property.location.city}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-medium truncate max-w-[240px]">{property.name}</span>
        </nav>

        {/* Hero gallery */}
        <ImageGallery
          images={property.images}
          alt={property.name}
          badgeTopLeft={
            <>
              <span className="px-3 py-1.5 bg-[#5CE0D2] text-white text-xs font-bold rounded-full">{stageLabel}</span>
              {property.badge && <Badge type={property.badge} label={stageLabel} />}
            </>
          }
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title + Specs */}
            <div>
              <div className="flex items-center gap-2 text-xs text-[#0D9488] font-semibold uppercase tracking-wider mb-1">
                <span>{typeLabel}</span>
                {property.parentDevelopmentSlug && (
                  <>
                    <span>·</span>
                    <Link
                      href={`/${locale}/desarrollos/${property.parentDevelopmentSlug}`}
                      className="inline-flex items-center gap-1 hover:text-[#5CE0D2] underline underline-offset-2"
                    >
                      <ArrowLeft size={12} />
                      {tProp('viewDevelopment')}
                      {property.parentDevelopmentName && `: ${property.parentDevelopmentName}`}
                    </Link>
                  </>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#2C2C2C]">{property.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-gray-500">
                <MapPin size={18} />
                <span className="text-base">
                  {property.location.address || `${property.location.zone}, ${property.location.city}, ${property.location.state}`}
                </span>
              </div>

              {/* Price + Share */}
              <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
                {property.price.mxn > 0 && (
                  <div className="flex items-baseline gap-4">
                    <div className="text-4xl font-extrabold text-[#2C2C2C]">{formatPrice(property.price.mxn)}</div>
                    {property.specs.area > 0 && (
                      <div className="text-sm text-gray-500">
                        {formatPrice(Math.round(property.price.mxn / property.specs.area))}/m²
                      </div>
                    )}
                  </div>
                )}
                <ShareDownloadModal data={shareData} locale={locale} />
              </div>

              {/* Specs chips */}
              <div className="flex flex-wrap gap-2 mt-4">
                {property.specs.bedrooms > 0 && (
                  <SpecChip icon={<Bed size={16} />} label={`${property.specs.bedrooms} ${tProp('bedShort', { count: property.specs.bedrooms })}`} />
                )}
                {property.specs.bathrooms > 0 && (
                  <SpecChip icon={<Bath size={16} />} label={`${property.specs.bathrooms} ${tProp('bathShort', { count: property.specs.bathrooms })}`} />
                )}
                {property.specs.area > 0 && (
                  <SpecChip icon={<Square size={16} />} label={`${property.specs.area} m²`} />
                )}
                {row.parking && row.parking > 0 && (
                  <SpecChip icon={<Car size={16} />} label={`${row.parking} ${tProp('parkingShort')}`} />
                )}
                {row.floor != null && (
                  <SpecChip icon={<Building2 size={16} />} label={tProp('floorLabel', { n: row.floor })} />
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
                      <AmenityList locale={locale} amenities={property.amenities} />
                    </div>
                  ),
                },
                {
                  id: 'geo',
                  label: tProp('tabGeo'),
                  panel: (
                    <div className="space-y-4">
                      <div className="aspect-[16/9] bg-[#F4F6F8] rounded-xl flex flex-col items-center justify-center text-gray-400">
                        <MapPin size={40} strokeWidth={1.5} className="mb-3" />
                        <p className="text-sm font-medium">{tProp('geoMapComingSoon')}</p>
                        {property.location.lat != null && property.location.lng != null && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            {property.location.lat.toFixed(4)}, {property.location.lng.toFixed(4)}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-xs text-gray-500 mb-1">{tProp('geoAddress')}</div>
                          <div className="text-sm font-semibold text-[#2C2C2C]">
                            {property.location.address || `${property.location.zone}, ${property.location.city}`}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-xs text-gray-500 mb-1">{tProp('geoZone')}</div>
                          <div className="text-sm font-semibold text-[#2C2C2C]">
                            {property.location.zone || property.location.city}, {property.location.state}
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
                },
              ] satisfies TabItem[]}
            />

            {/* FAQ */}
            <UnitFAQs
              locale={locale}
              unitName={property.name}
              city={property.location.city}
              price={property.price.mxn}
              downPaymentMin={property.financing.downPaymentMin}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="sticky top-24 space-y-4">
              <MarketIndicator
                city={property.location.city}
                price={property.price.mxn}
                monthlyRent={monthlyRentRes || null}
                capRate={property.capRate ?? null}
                airdnaOccupancy={airdnaOccupancy}
                locale={locale}
              />

              <div id="contact-form" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 scroll-mt-24">
                <h3 className="text-base font-bold text-[#2C2C2C] mb-1">
                  {tProp('interestedUnitQuestion')}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  {tProp('responseUnder5min')}
                </p>
                <ContactForm propertyId={property.id} propertyName={property.name} />
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

function SpecChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
      <span className="text-[#5CE0D2]">{icon}</span>
      {label}
    </div>
  );
}
