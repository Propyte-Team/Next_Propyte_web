import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getVisibility, isVisible, VISIBILITY_KEYS } from '@/lib/visibility';
import {
  ChevronRight, MapPin, Building2, BarChart3, Globe, FileText, TrendingUp,
  Users, CheckCircle, Zap, DollarSign, Download,
} from 'lucide-react';
import ExpandableText from '@/components/ui/ExpandableText';
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
  getZoneDetail,
} from '@/lib/supabase/queries';
import { formatPrice } from '@/lib/formatters';
import { safeExternalUrl } from '@/lib/security/safeUrl';
import {
  CITY_TO_MARKET_CODE,
  RES,
  buildCashflows,
  calculateClosingCosts,
  calculateIRR,
  calculateMonthlyPayment,
  calculateRemainingBalanceActuarial,
} from '@/lib/calculator';
import { pickLang } from '@/lib/i18n/pickLang';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import SimilarListings, { type SimilarListingItem } from '@/components/shared/SimilarListings';
import ContactForm from '@/components/property/ContactForm';
import ImageGallery from '@/components/property/ImageGallery';
import MobileContactBar from '@/components/property/MobileContactBar';
import ShareDownloadModal, { type ShareDownloadData } from '@/components/property/ShareDownloadModal';
import PriceDisplay from '@/components/ui/PriceDisplay';
import PriceDisclaimer from '@/components/ui/PriceDisclaimer';
import DevelopmentKeyData from '@/components/property/DevelopmentKeyData';
import RentalEstimate from '@/components/property/RentalEstimate';
import InvestmentSummary from '@/components/property/InvestmentSummary';
import UnitModelsTable from '@/components/property/UnitModelsTable';
import AmenityList from '@/components/property/AmenityList';
import VirtualTour from '@/components/property/VirtualTour';
import VideoPlayer from '@/components/property/VideoPlayer';
import GeoAnalysis from '@/components/property/GeoAnalysis';
import DataInsights from '@/components/property/DataInsights';
import MarketSentiment, { type SentimentIndicator } from '@/components/property/MarketSentiment';
import CetesComparison from '@/components/property/CetesComparison';
import MarketIndicator from '@/app/[locale]/propiedades/_components/MarketIndicator';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import ViewItemTracker from '@/components/shared/ViewItemTracker';
import { slugify, deriveFilenameFromUrl } from '@/lib/utils';

interface DevelopmentDetailPageProps {
  locale: string;
  slug: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function DevelopmentDetailPage({ locale, slug }: DevelopmentDetailPageProps) {
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

  const [tProp, visibility] = await Promise.all([
    getTranslations({ locale, namespace: 'property' }),
    getVisibility(),
  ]);

  const citySlug = slugify(property.city);
  const description = pickLang(locale, property.description_en, property.description_es) || '';

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
  let airdnaSummary: Awaited<ReturnType<typeof getAirdnaMarketSummary>> = null;
  let zoneScore: Awaited<ReturnType<typeof getZoneDetail>>['score'] = null;
  const marketCode = CITY_TO_MARKET_CODE[property.city] || '';
  try {
    if (supabase) {
      const propType = property.property_types?.[0] || property.property_type || 'departamento';
      const [rentalResult, vacResult, financialsResult, mlEstimatesResult, airdnaResult, zoneResult] = await Promise.all([
        getRentalEstimate(supabase, property.city, propType, null, property.zone, 'residencial'),
        getRentalEstimate(supabase, property.city, propType, null, property.zone, 'vacacional'),
        getDevelopmentFinancials(supabase, property.id),
        getMlRentalEstimates(supabase, property.id),
        marketCode ? getAirdnaMarketSummary(supabase, marketCode) : Promise.resolve(null),
        property.zone ? getZoneDetail(supabase, property.city, property.zone) : Promise.resolve({ score: null, submarkets: [] }),
      ]);
      if (rentalResult.data) {
        rentalMedian = rentalResult.data.median_rent_mxn;
        rentalPerM2 = rentalResult.data.avg_rent_per_m2;
      }
      if (vacResult.data) rentalMedianVac = vacResult.data.median_rent_mxn;
      devFinancials = financialsResult;
      mlEstimates = mlEstimatesResult;
      airdnaSummary = airdnaResult;
      if (airdnaResult) airdnaOccupancy = airdnaResult.current_occupancy;
      zoneScore = zoneResult.score;
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
    description: pickLang(locale, developerRecord?.descriptionEn, developerRecord?.descriptionEs)
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
  const _priceRange = rangeOf('price_mxn'); void _priceRange;
  const availableCount = unitList.filter((u) => u.availability_status === 'disponible').length;
  const totalUnits = property.total_units || unitList.length || null;
  const derivedAvailable = property.available_units ?? (availableCount > 0 ? availableCount : null);

  // ── Delivery display ──
  const deliveryDisplay = property.delivery_text
    || property.estimated_delivery
    || (property.construction_progress != null
        ? tProp('progressComplete', { n: property.construction_progress })
        : null);

  // ── Starting price $/m² (computed for potential future display) ──
  const _pricePerM2 = propertyPrice > 0 && representativeArea && representativeArea > 0
    ? Math.round(propertyPrice / representativeArea)
    : null;
  void _pricePerM2;

  // ── ROI projection from financials ──
  const roiDisplay = devFinancials?.roi_annual_pct ?? property.roi_projected ?? null;

  // ── IRR 5yr + 10yr for CetesComparison ──
  // Prefer precomputed financials. Fall back to in-line calc matching unit/PDF model.
  const appreciationPct = (property.roi_appreciation as number | null) ?? 8;
  const DOWN_PCT = 30;
  const RATE_PCT = 12;
  const LOAN_MONTHS = 120;
  const effectiveRent = rentalPerM2 && representativeArea && representativeArea > 0
    ? Math.round(rentalPerM2 * representativeArea)
    : rentalMedian;
  let irr5y: number | null = devFinancials?.irr_5yr ?? null;
  let irr10y: number | null = devFinancials?.irr_10yr ?? null;
  if ((irr5y == null || irr10y == null) && propertyPrice > 0 && effectiveRent && effectiveRent > 0) {
    const closing = calculateClosingCosts(propertyPrice, propertyState);
    const totalInvested = propertyPrice * (DOWN_PCT / 100) + closing;
    const monthlyNet = Math.round(effectiveRent * RES.OCCUPANCY * (1 - RES.EXPENSE_RATIO));
    const monthlyPmt = calculateMonthlyPayment(propertyPrice, DOWN_PCT, LOAN_MONTHS, RATE_PCT);
    const annualNetFlow = monthlyNet * 12 - monthlyPmt * 12;
    if (irr5y == null) {
      irr5y = calculateIRR(buildCashflows({
        totalInvested, annualNetFlow, price: propertyPrice,
        appreciationPct, years: 5,
        remainingBalance: calculateRemainingBalanceActuarial(propertyPrice, DOWN_PCT, RATE_PCT, LOAN_MONTHS, 60),
      }));
    }
    if (irr10y == null) {
      irr10y = calculateIRR(buildCashflows({
        totalInvested, annualNetFlow, price: propertyPrice,
        appreciationPct, years: 10,
        remainingBalance: calculateRemainingBalanceActuarial(propertyPrice, DOWN_PCT, RATE_PCT, LOAN_MONTHS, 120),
      }));
    }
  }

  // ── Market sentiment indicators ──
  const sentimentIndicators: SentimentIndicator[] = [];
  // (a) Appreciation signal
  if (appreciationPct != null) {
    const dir: 'bullish' | 'neutral' | 'bearish' = appreciationPct >= 8
      ? 'bullish' : appreciationPct >= 5 ? 'neutral' : 'bearish';
    sentimentIndicators.push({
      id: 'appreciation',
      label: tProp('sentimentAppreciation'),
      direction: dir,
      value: `${appreciationPct.toFixed(1)}%`,
      rationale: tProp(
        dir === 'bullish' ? 'sentimentApprBullish'
          : dir === 'neutral' ? 'sentimentApprNeutral'
            : 'sentimentApprBearish'
      ),
    });
  }
  // (b) Occupancy demand (market data trend last 3 vs first 3). Values come in percent scale (0-100).
  if (airdnaSummary?.occupancy_trend && airdnaSummary.occupancy_trend.length >= 6) {
    const trend = airdnaSummary.occupancy_trend;
    const early = trend.slice(0, 3).reduce((s, p) => s + p.value, 0) / 3;
    const late = trend.slice(-3).reduce((s, p) => s + p.value, 0) / 3;
    const delta = late - early;
    const dir: 'bullish' | 'neutral' | 'bearish' = delta > 3 ? 'bullish' : delta < -3 ? 'bearish' : 'neutral';
    sentimentIndicators.push({
      id: 'occupancy',
      label: tProp('sentimentDemand'),
      direction: dir,
      value: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pp`,
      rationale: tProp(
        dir === 'bullish' ? 'sentimentDemBullish'
          : dir === 'bearish' ? 'sentimentDemBearish'
            : 'sentimentDemNeutral'
      ),
    });
  }
  // (c) Supply pressure from zone score
  if (zoneScore?.supply_pressure_component != null) {
    const sp = zoneScore.supply_pressure_component;
    // Higher supply_pressure_component = LESS pressure (better for investor)
    const dir: 'bullish' | 'neutral' | 'bearish' = sp >= 70 ? 'bullish' : sp >= 40 ? 'neutral' : 'bearish';
    sentimentIndicators.push({
      id: 'supply',
      label: tProp('sentimentSupply'),
      direction: dir,
      value: `${Math.round(sp)}/100`,
      rationale: tProp(
        dir === 'bullish' ? 'sentimentSupBullish'
          : dir === 'bearish' ? 'sentimentSupBearish'
            : 'sentimentSupNeutral'
      ),
    });
  }

  const stageLabel =
    property.stage === 'preventa' ? tProp('stagePresale')
      : property.stage === 'construccion' ? tProp('stageConstruction')
        : tProp('stageReady');

  const mainType = property.property_types?.[0] || property.property_type || 'departamento';
  const typeLabel =
    mainType === 'departamento' ? tProp('typeApartments')
      : mainType === 'terreno' ? tProp('typeLand')
        : mainType === 'casa' ? tProp('typeHouses')
          : mainType === 'penthouse' ? 'Penthouse'
            : mainType;

  // ── Share/Download modal data ──
  const shareSpecs: ShareDownloadData['specs'] = [];
  if (bedRange) shareSpecs.push({ label: tProp('bedrooms'), value: bedRange.min === bedRange.max ? String(bedRange.min) : `${bedRange.min}–${bedRange.max}` });
  if (bathRange) shareSpecs.push({ label: tProp('bathrooms'), value: bathRange.min === bathRange.max ? String(bathRange.min) : `${bathRange.min}–${bathRange.max}` });
  if (areaRange) shareSpecs.push({ label: 'Área', value: areaRange.min === areaRange.max ? `${areaRange.min} m²` : `${areaRange.min}–${areaRange.max} m²` });
  if (totalUnits) shareSpecs.push({ label: tProp('units'), value: String(totalUnits) });
  const shareData: ShareDownloadData = {
    title: property.name,
    price: propertyPrice > 0 ? formatPrice(propertyPrice) : '—',
    location: [property.zone && property.zone !== property.city ? property.zone : null, property.city, propertyState].filter(Boolean).join(', '),
    img: property.images?.[0] || '',
    url: `https://propyte.com/${locale}/desarrollos/${slug}`,
    wa: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '529843235354',
    etapa: stageLabel,
    specs: shareSpecs,
    desc: description || undefined,
    amenidades: property.amenities || undefined,
    dev_name: developerDisplay.name || undefined,
    delivery: deliveryDisplay || undefined,
    roi: roiDisplay ? `${roiDisplay}% anual` : undefined,
    prop_type: typeLabel,
  };

  return (
    <>
      <ViewItemTracker
        itemId={property.id}
        itemName={property.name}
        itemKind="development"
        city={property.city || undefined}
        zone={property.zone || undefined}
        priceMxn={property.price_min_mxn || property.price_mxn || undefined}
      />
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
            { '@type': 'ListItem', position: 1, name: tProp('breadcrumbHome'), item: `https://propyte.com/${locale}` },
            { '@type': 'ListItem', position: 2, name: tProp('breadcrumbDevelopments'), item: `https://propyte.com/${locale}/desarrollos` },
            { '@type': 'ListItem', position: 3, name: property.city, item: `https://propyte.com/${locale}/desarrollos/${citySlug}` },
            { '@type': 'ListItem', position: 4, name: property.name },
          ],
        }}
      />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4 pb-24 md:pb-6">
        <nav aria-label={tProp('breadcrumbAriaLabel')} className="flex items-center gap-1 text-xs text-gray-600 mb-6">
          <Link href={`/${locale}`} className="hover:text-[#0F766E]">{tProp('breadcrumbHome')}</Link>
          <ChevronRight size={12} />
          <Link href={`/${locale}/desarrollos`} className="hover:text-[#0F766E]">{tProp('breadcrumbDevelopments')}</Link>
          <ChevronRight size={12} />
          <Link href={`/${locale}/desarrollos/${citySlug}`} className="hover:text-[#0F766E]">{property.city}</Link>
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
                <span className="px-3 py-1.5 bg-propyte-brand text-[#0F1923] text-sm font-bold rounded-full">{stageLabel}</span>
              }
            />

            {/* Title & Location */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{property.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <MapPin size={18} />
                <span className="text-lg">
                  {property.zone !== property.city ? `${property.zone}, ` : ''}
                  {property.city}, {property.state}
                </span>
              </div>
              <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
                {(property.price_min_mxn || property.price_mxn) > 0 ? (
                  <div>
                    <span className="text-sm text-gray-600">{tProp('startingFrom')}</span>
                    {/* Precio dual MXN/USD con TC ref Banxico debajo.
                        Desarrollos cotizan en MXN por default (no exponen
                        moneda_principal a nivel agregado). */}
                    <PriceDisplay
                      mxn={property.price_min_mxn || property.price_mxn}
                      variant="dual"
                      size="xl"
                      showRateNote
                    />
                  </div>
                ) : <div />}
                <ShareDownloadModal data={shareData} locale={locale} />
              </div>
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
                      {/* ── Descripción (expandable, max 120px) ── */}
                      {description && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-3">
                            {tProp('aboutTitle')}
                          </h2>
                          <ExpandableText
                            maxHeight={120}
                            moreLabel={tProp('readMore')}
                            lessLabel={tProp('readLess')}
                            className="text-gray-600 leading-relaxed text-sm md:text-base whitespace-pre-line"
                          >
                            {description}
                          </ExpandableText>
                        </div>
                      )}

                      {/* ── Unit type chips (individual units) ── */}
                      <UnitModelsTable units={units} mlEstimates={mlEstimates} locale={locale} />

                      {/* ── 4 metric cards: tipo / etapa / zona / estado ── */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard
                          icon={<Building2 size={22} />}
                          label={tProp('type')}
                          value={typeLabel || '—'}
                        />
                        <MetricCard
                          icon={<BarChart3 size={22} />}
                          label={tProp('stage')}
                          value={stageLabel}
                        />
                        <MetricCard
                          icon={<MapPin size={22} />}
                          label={tProp('zone')}
                          value={property.zone || property.city || '—'}
                        />
                        <MetricCard
                          icon={<Globe size={22} />}
                          label={tProp('stateLabel')}
                          value={property.state || 'Quintana Roo'}
                        />
                      </div>

                      {/* ── Metrics row: total / available / delivery / progress / commission ── */}
                      {(totalUnits || derivedAvailable != null || deliveryDisplay || (property.construction_progress != null && property.construction_progress > 0) || ((property as any).commission_rate != null && (property as any).commission_rate > 0)) && (
                        <div className="flex flex-wrap gap-3">
                          {totalUnits && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-sm">
                              <Users size={16} className="text-gray-600" />
                              <span className="text-gray-600">{totalUnits} {tProp('totalProperties')}</span>
                            </div>
                          )}
                          {derivedAvailable != null && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-propyte-cyan-100 rounded-xl text-sm">
                              <CheckCircle size={16} className="text-[#0F766E]" />
                              <span className="text-[#0F766E] font-semibold">{derivedAvailable} {tProp('available')}</span>
                            </div>
                          )}
                          {deliveryDisplay && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-sm">
                              <TrendingUp size={16} className="text-gray-600" />
                              <span className="text-gray-600">{tProp('delivery')} {deliveryDisplay}</span>
                            </div>
                          )}
                          {property.construction_progress != null && property.construction_progress > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-sm">
                              <Zap size={16} className="text-gray-600" />
                              <span className="text-gray-600">{tProp('progress')} {property.construction_progress}%</span>
                            </div>
                          )}
                          {(property as any).commission_rate != null && (property as any).commission_rate > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-sm">
                              <DollarSign size={16} className="text-gray-600" />
                              <span className="text-gray-600">{tProp('commission')} {(property as any).commission_rate}%</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Virtual Tour + Video */}
                      {(property.virtual_tour_url || property.video_url) && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {tProp('exploreTitle')}
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

                      <AmenityList locale={locale} amenities={property.amenities || undefined} />

                      {(() => {
                        const safeBrochureUrl = safeExternalUrl(property.brochure_url);
                        if (!safeBrochureUrl) return null;
                        return (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-3">
                            {tProp('documentsTitle')}
                          </h2>
                          <a
                            href={safeBrochureUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-colors"
                          >
                            <div className="w-12 h-12 rounded-lg bg-[#1A2F3F] flex items-center justify-center shrink-0">
                              <FileText size={22} className="text-[#0F766E]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-900 truncate">
                                {tProp('brochure')}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {deriveFilenameFromUrl(safeBrochureUrl, 'brochure.pdf')}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] group-hover:text-[#0F766E] shrink-0">
                              <Download size={16} />
                              {tProp('download')}
                            </div>
                          </a>
                        </div>
                        );
                      })()}

                      {developerDisplay.name && (
                        <div className="propyte-card-glass-light p-6">
                          <h2 className="text-lg font-bold text-gray-900 mb-4">
                            {tProp('developerTitle')}
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
                                <span className="text-xl font-extrabold text-[#0F766E] tracking-tight">
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
                                  <span className="px-2 py-0.5 text-2xs font-bold text-[#0F766E] bg-propyte-cyan-100 rounded-full uppercase tracking-wider">
                                    {tProp('verified')}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-2 flex-wrap">
                                {developerProjects > 0 && (
                                  <span>{tProp('projectsCount', { count: developerProjects })}</span>
                                )}
                                {developerDisplay.yearsExperience != null && developerDisplay.yearsExperience > 0 && (
                                  <span>
                                    · {developerDisplay.yearsExperience} {tProp('yearsExperience')}
                                  </span>
                                )}
                                {developerDisplay.unitsDelivered != null && developerDisplay.unitsDelivered > 0 && (
                                  <span>
                                    · {developerDisplay.unitsDelivered.toLocaleString()} {tProp('unitsDelivered')}
                                  </span>
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
                ...(isVisible(visibility, VISIBILITY_KEYS.DESARROLLOS_DETAIL_GEO) ? [{
                  id: 'geo',
                  label: tProp('tabGeo'),
                  panel: (
                    <div className="space-y-8">
                      <GeoAnalysis
                        lat={property.lat ?? null}
                        lng={property.lng ?? null}
                        address={property.address || null}
                        city={property.city}
                        zone={property.zone || null}
                        state={property.state || null}
                        zoneScore={zoneScore}
                        locale={locale}
                      />
                      {airdnaSummary && marketCode && (
                        <DataInsights
                          data={airdnaSummary}
                          locale={locale}
                          market={marketCode}
                        />
                      )}
                    </div>
                  ),
                }] as TabItem[] : []),
                ...(isVisible(visibility, VISIBILITY_KEYS.DESARROLLOS_DETAIL_RENTABILIDAD) ? [{
                  id: 'rentabilidad',
                  label: tProp('tabRentabilidad'),
                  panel: (
                    <div className="space-y-8">
                      <MarketIndicator
                        city={property.city}
                        price={propertyPrice > 0 ? propertyPrice : 0}
                        monthlyRent={rentalMedian ?? null}
                        capRate={devFinancials?.cap_rate ?? null}
                        airdnaOccupancy={airdnaOccupancy ?? null}
                        locale={locale}
                      />
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
                      {sentimentIndicators.length > 0 && (
                        <MarketSentiment indicators={sentimentIndicators} locale={locale} />
                      )}
                      {propertyPrice > 0 && (irr5y != null || irr10y != null) && (
                        <CetesComparison
                          initialInvestment={propertyPrice}
                          irr5y={irr5y}
                          irr10y={irr10y}
                          locale={locale}
                        />
                      )}
                    </div>
                  ),
                }] as TabItem[] : []),
              ] satisfies TabItem[]}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
            {/* Datos clave (cuadro azul) — variante específica para desarrollos:
                muestra unidades / tipo / ubicación (zona+estado) en lugar de
                bedrooms/bathrooms del cuadrito de unidades. Client component
                completo (los iconos LucideIcon no cruzan server→client). */}
            <DevelopmentKeyData
              priceMxn={propertyPrice > 0 ? propertyPrice : null}
              areaM2={areaRange ? areaRange.min : representativeArea ?? null}
              totalUnits={totalUnits ?? null}
              mainType={mainType}
              zone={property.zone}
              state={property.state}
              labels={{
                title: locale === 'es' ? 'Datos clave' : 'Key data',
                price: locale === 'es' ? 'Precio desde' : 'Price from',
                area: 'Área',
                units: locale === 'es' ? 'Unidades' : 'Units',
                type: locale === 'es' ? 'Tipo' : 'Type',
                location: locale === 'es' ? 'Ubicación' : 'Location',
              }}
            />

            <div id="contact-form" className="propyte-card-glass-light p-6 scroll-mt-24">
              {property.contact_name && (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-propyte-brand to-[#1A2F3F] flex items-center justify-center text-white font-bold text-sm">
                    {property.contact_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{property.contact_name}</div>
                    <div className="text-xs text-gray-600">{tProp('verifiedAdvisor')}</div>
                  </div>
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {tProp('interestedDevQuestion')}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {tProp('getPricingDescription')}
              </p>
              <ContactForm propertyId={property.id} propertyName={property.name} />

              {property.contact_phone && (
                <a
                  href={`https://wa.me/${property.contact_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    tProp('whatsappInterestText', { name: property.name })
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-12 mt-3 bg-[#25D366] hover:bg-[#1EBE57] text-[#0F1923] font-semibold rounded-lg transition-colors"
                >
                  WhatsApp {property.contact_name ? `· ${property.contact_name.split(' ')[0]}` : ''}
                </a>
              )}
            </div>
            </div>
          </div>
        </div>

        <SimilarListings items={similar} kind="development" locale={locale} />

        {/* Aviso legal sobre TC referencial — al final del contenido principal. */}
        <PriceDisclaimer />
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

function MetricCard({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="propyte-card-glass-light-sm p-4 text-center">
      <span className="flex justify-center text-[#0F766E] mb-2">{icon}</span>
      <div className="text-sm font-bold text-gray-900 leading-tight truncate">{value}</div>
      <div className="text-xs text-gray-600 mt-0.5">{label}</div>
    </div>
  );
}
