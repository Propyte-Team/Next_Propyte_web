import { notFound } from 'next/navigation';
import { getVisibility, isVisible, VISIBILITY_KEYS } from '@/lib/visibility';
import Link from 'next/link';
import { FileText, Download } from '@/lib/icons';
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
import { buildRichContent, normalizeStage, resolveSpecType } from '@/lib/mappers/development-to-property';
import { getSiteConfig } from '@/lib/hub-content';
import { resolveSiteContact } from '@/lib/site-contact';
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
import { translateDateWords } from '@/lib/i18n/translate-date-words';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import DevCardV3, { type DevCardV3Data } from '@/components/v3/DevCardV3';
import GalleryV3 from '@/components/developments/v3/GalleryV3';
import { compactMoney, placeLabel } from '@/components/v3/format';
import ContactForm from '@/components/property/ContactForm';
import MobileContactBar from '@/components/property/MobileContactBar';
import ShareDownloadModal, { type ShareDownloadData } from '@/components/property/ShareDownloadModal';
import PriceDisplay from '@/components/ui/PriceDisplay';
import { precioDesarrollo, type FilaPrecioDesarrollo } from '@/lib/precio-moneda';
import { fetchUsdMxnRate } from '@/lib/banxico/fetchUsdMxnRate';
import PriceDisclaimer from '@/components/ui/PriceDisclaimer';
import DiscountBadge from '@/components/ui/DiscountBadge';
import RentalEstimate from '@/components/property/RentalEstimate';
import InvestmentSummary from '@/components/property/InvestmentSummary';
import UnitModelsTable from '@/components/property/UnitModelsTable';
import AmenityList from '@/components/property/AmenityList';
import RichContentSections from '@/components/property/RichContentSections';
import { MarkdownContent } from '@/components/common/MarkdownContent';
import VirtualTour from '@/components/property/VirtualTour';
import VideoPlayer from '@/components/property/VideoPlayer';
import GeoAnalysis from '@/components/property/GeoAnalysis';
import DataInsights from '@/components/property/DataInsights';
import MarketSentiment, { type SentimentIndicator } from '@/components/property/MarketSentiment';
import CetesComparison from '@/components/property/CetesComparison';
import MarketIndicator from '@/app/[locale]/propiedades/_components/MarketIndicator';
import ViewItemTracker from '@/components/shared/ViewItemTracker';
import { slugify, deriveFilenameFromUrl } from '@/lib/utils';
import { resolveStage } from './stageConfig';

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

  if (!property) {
    // La redirección de slugs retirados YA OCURRIÓ en el middleware, que es el
    // único lugar donde el status se puede fijar. Aquí vivía un
    // permanentRedirect() que no emitía un 3xx: con la cadena de loading.tsx el
    // 200 se compromete antes de que este componente corra, así que el visitante
    // aterrizaba bien por navegación de cliente pero el crawler veía 200 sin
    // header Location. Medido sobre cuatro desarrollos el 29-jul.
    // Si llegamos hasta acá, el slug no tiene fila de redirección: es un 404.
    notFound();
  }

  // El detalle usa el row crudo de v_developments (no pasa por
  // mapDevelopmentToProperty como sí lo hace UnitDetailPage), así que
  // property.richContent venía siempre undefined y RichContentSections nunca
  // renderizaba la descripción editorial (descripcion_editorial_*_md). La
  // construimos aquí desde el row para que el editorial (prioridad) aparezca.
  property.richContent = buildRichContent(property);

  // resolveSpecType cae a development_type ("Lotes", "Residencial horizontal")
  // cuando property_types viene null — la mayoría del catálogo. Hoisted aquí
  // (antes se recalculaba en la línea ~420) porque getRentalEstimate también
  // lo necesita: property.property_types?.[0] es la grafía CRUDA de la vista
  // ("Departamento", "Lote", "2 Recámaras"), y rental_comparables.property_type
  // solo guarda 'departamento'/'casa' en minúsculas. Pasar la grafía cruda hacía
  // fallar las tres consultas type-filtradas de getRentalEstimate para los 12
  // desarrollos sin ext_property_types, cayendo al bucket solo-ciudad sin que
  // nadie lo notara (isFallback se descartaba en el destructuring de abajo).
  // Ver Important 1, revisión final de rama 2026-08-20.
  const mainType = resolveSpecType(property.property_types ?? property.property_type, property.development_type);

  const [tProp, tTypes, visibility] = await Promise.all([
    getTranslations({ locale, namespace: 'property' }),
    getTranslations({ locale, namespace: 'types' }),
    getVisibility(),
  ]);

  const citySlug = slugify(property.city);
  const description = pickLang(locale, property.description_en, property.description_es) || '';
  // Editorial-first (estricto por idioma): si existe editorial en el locale
  // actual, ocultamos el bloque SEO "Acerca de" y mostramos solo el editorial.
  const hasEditorial = !!(locale === 'en'
    ? property.richContent?.editorial?.en
    : property.richContent?.editorial?.es);

  // ── Similar developments (4-level fallback) ──
  let similar: DevCardV3Data[] = [];
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
       
      const tStagesV3 = await getTranslations({ locale, namespace: 'developmentsV3.stages' });
      similar = (data as any[]).map((d) => {
        const p = precioDesarrollo(d as FilaPrecioDesarrollo);
        const st = normalizeStage(d.stage);
        return {
          id: d.id,
          href: `/${locale}/desarrollos/${d.slug}`,
          name: d.name,
          place: placeLabel(d.zone, d.city),
          image: d.images?.[0] ?? null,
          stageLabel: st ? tStagesV3(st) : null,
          presale: st === 'preventa',
          priceLabel: compactMoney(p.min, p.moneda, locale),
          meta: [],
        };
      });
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
      const [rentalResult, vacResult, financialsResult, mlEstimatesResult, airdnaResult, zoneResult] = await Promise.all([
        getRentalEstimate(supabase, property.city, mainType, null, property.zone, 'residencial'),
        getRentalEstimate(supabase, property.city, mainType, null, property.zone, 'vacacional'),
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

  // En inglés, prefiere el título de publicación EN (v_developments
  // .publication_title_en) para H1, breadcrumb, schema y compartir. Aditivo:
  // si no hay EN, conserva el título ES ya resuelto. No afecta el sitio ES.
  if (locale === 'en' && property?.publication_title_en) {
    property.name = property.publication_title_en;
  }

  // ── Regla "Relación CRM = Exclusivo" ──────────────────────────────────────
  // Solo los desarrollos exclusivos (crm_relationship ~ /exclusiv/i) muestran:
  //   1. El nombre interno del desarrollo como H1 (property.exclusive_name,
  //      preservado en applyExclusiveOverlay). En el resto del sitio el H1
  //      SIEMPRE es el título público — nunca el nombre interno.
  //   2. El título de publicación (property.name) como subtítulo bajo el H1.
  //   3. La sección de Documentos (brochure).
  //   4. La tarjeta de Desarrollador.
  // v_developments expone brochure_url/developer para TODOS los desarrollos
  // (no hay gate de datos), así que estos guards son la única cosa que los
  // oculta en no-exclusivos. SEO/schema/breadcrumb/share NO cambian (siempre
  // título público).
  const isExclusive = typeof property.crm_relationship === 'string'
    && /exclusiv/i.test(property.crm_relationship);
  const h1Title = isExclusive && property.exclusive_name
    ? property.exclusive_name
    : property.name;
  const publicationSubtitle = isExclusive && property.name && property.name !== h1Title
    ? property.name
    : null;

  const propertyState = property.state || 'Quintana Roo';

  // Precio cotizado: la moneda del desarrollo decide qué columna se lee. Antes
  // esto era `price_min_mxn || price_mxn`, que para un desarrollo en USD tomaba
  // dólares de una columna de pesos y los publicaba como "$145,000 MXN".
  const precio = precioDesarrollo(property as FilaPrecioDesarrollo);

  // Los modelos financieros de más abajo (gastos de cierre e ISR por estado,
  // mensualidad, TIR) están denominados en PESOS. Para un desarrollo en dólares se
  // convierte SÓLO para alimentarlos — lo que se muestra sigue siendo lo cotizado.
  const tcUsdMxn = precio.moneda === 'USD' ? (await fetchUsdMxnRate()).rate : 1;
  const propertyPrice = precio.min != null ? Math.round(precio.min * tcUsdMxn) : 0;
  const representativeArea = property.area_m2 || property.area_min || null;

  // ── Discount rollup desde units ─────────────────────────────────────────
  // v_units.is_discount_active y v_units.discount_pct vienen filtrados por
  // vigencia + monto válido. Calculamos el max pct para el badge "hasta -N%".
  const unitsWithDiscount = (units as Array<{ is_discount_active?: boolean | null; discount_pct?: number | string | null }>)
    .filter((u) => u.is_discount_active === true);
  const hasUnitsWithDiscount = unitsWithDiscount.length > 0;
  const maxDiscountPct = hasUnitsWithDiscount
    ? Math.round(Math.max(...unitsWithDiscount.map((u) => Number(u.discount_pct) || 0)))
    : 0;

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
  const totalUnits = property.total_units || unitList.length || null;

  // ── Delivery display ──
  const rawDeliveryText = property.delivery_text || property.estimated_delivery;
  const deliveryDisplay = rawDeliveryText
    ? translateDateWords(rawDeliveryText, locale)
    : (property.construction_progress != null
        ? tProp('progressComplete', { n: property.construction_progress })
        : null);

  // ── Starting price $/m² (computed for potential future display) ──
  const _pricePerM2 = propertyPrice > 0 && representativeArea && representativeArea > 0
    ? Math.round(propertyPrice / representativeArea)
    : null;
  void _pricePerM2;

  // ── ROI projection from financials ──
  // Number(): campos NUMERIC de v_developments llegan como string; sin coerción
  // roiPct llega string a los componentes (riesgo .toFixed) y el template pinta
  // decimales crudos.
  // devFinancials.roi_annual_pct queda FUERA: 2 valores distintos en 197 filas
  // (0 en 182 devs, 8.84 constante en 15). Ver DevFinancialsSlice en
  // lib/investment/resolve.ts. Solo se publica el ROI capturado en el Hub.
  const roiDisplay = property.roi_projected != null ? Number(property.roi_projected) : null;

  // ── IRR 5yr + 10yr for CetesComparison ──
  // Prefer precomputed financials. Fall back to in-line calc matching unit/PDF model.
  // Number() + guard null: roi_appreciation es NUMERIC (string). Sin esto,
  // appreciationPct.toFixed() (más abajo) truena el render y la aritmética de IRR
  // concatena. null → fallback 8 (preserva la semántica ?? 8; un 0 real se conserva).
  const roiAppNum = property.roi_appreciation != null ? Number(property.roi_appreciation) : null;
  const appreciationPct = (roiAppNum != null && Number.isFinite(roiAppNum)) ? roiAppNum : 8;
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

  const stage = resolveStage(property.stage);
  const stageLabel = stage ? (locale === 'en' ? stage.nameEn : stage.nameEs) : null;

  // mainType hoisted arriba (justo tras buildRichContent) para que
  // getRentalEstimate reciba el canónico en vez de la grafía cruda.
  const typeLabel = tTypes(mainType);

  // ── Share/Download modal data ──
  const shareSpecs: ShareDownloadData['specs'] = [];
  if (bedRange) shareSpecs.push({ label: tProp('bedrooms'), value: bedRange.min === bedRange.max ? String(bedRange.min) : `${bedRange.min}–${bedRange.max}` });
  if (bathRange) shareSpecs.push({ label: tProp('bathrooms'), value: bathRange.min === bathRange.max ? String(bathRange.min) : `${bathRange.min}–${bathRange.max}` });
  if (areaRange) shareSpecs.push({ label: tProp('area'), value: areaRange.min === areaRange.max ? `${areaRange.min} m²` : `${areaRange.min}–${areaRange.max} m²` });
  if (totalUnits) shareSpecs.push({ label: tProp('units'), value: String(totalUnits) });
  // Número de contacto desde el Hub (fuente única). getSiteConfig se dedupea por request.
  const waNumber = resolveSiteContact(await getSiteConfig()).whatsapp;
  const shareData: ShareDownloadData = {
    title: property.name,
    price: propertyPrice > 0 ? formatPrice(propertyPrice) : '—',
    location: [property.zone && property.zone !== property.city ? property.zone : null, property.city, propertyState].filter(Boolean).join(', '),
    img: property.images?.[0] || '',
    url: `https://propyte.com/${locale}/desarrollos/${slug}`,
    wa: waNumber,
    etapa: stageLabel ?? undefined,
    specs: shareSpecs,
    desc: description || undefined,
    amenidades: property.amenities || undefined,
    dev_name: developerDisplay.name || undefined,
    delivery: deliveryDisplay || undefined,
    roi: roiDisplay ? `${roiDisplay}% anual` : undefined,
    prop_type: typeLabel,
  };

  const tV3 = await getTranslations({ locale, namespace: 'developmentDetailV3' });
  const galleryImages = (property.images || []).filter((x: unknown): x is string => typeof x === 'string' && x.length > 0);
  const placeLine = [placeLabel(property.zone, property.city), propertyState].filter(Boolean).join(', ');
  const showGeo = isVisible(visibility, VISIBILITY_KEYS.DESARROLLOS_DETAIL_GEO);
  const showReturns = isVisible(visibility, VISIBILITY_KEYS.DESARROLLOS_DETAIL_RENTABILIDAD);
  const progress = typeof property.construction_progress === 'number' && property.construction_progress > 0 && property.construction_progress < 100
    ? property.construction_progress
    : null;
  const deliveryText = stage?.slug !== 'entrega_inmediata' && rawDeliveryText ? translateDateWords(rawDeliveryText, locale) : null;

  // Franja de datos (banda oscura). Solo datos capturados: sin dato, no hay celda.
  // La etapa sale de la misma resolución que el badge de la foto y el <title>,
  // así ya no conviven "Entrega inmediata" y "En construcción" en la misma ficha.
  const facts: Array<{ label: string; value: string }> = [];
  const priceShort = compactMoney(precio.min, precio.moneda, locale);
  if (priceShort) facts.push({ label: tV3('facts.from'), value: priceShort });
  if (stageLabel) facts.push({ label: tV3('facts.stage'), value: stageLabel });
  if (deliveryText) facts.push({ label: tV3('facts.delivery'), value: deliveryText });
  if (progress != null) facts.push({ label: tV3('facts.progress'), value: `${progress}%` });
  if (totalUnits) facts.push({ label: tV3('facts.units'), value: String(totalUnits) });
  if (typeLabel) facts.push({ label: tV3('facts.type'), value: typeLabel });
  if (areaRange) facts.push({ label: tV3('facts.area'), value: `${areaRange.min.toLocaleString(locale === 'en' ? 'en-US' : 'es-MX')} m²` });

  const safeBrochureUrl = isExclusive ? safeExternalUrl(property.brochure_url) : null;
  const navItems = [
    { id: 'descripcion', label: tV3('nav.description') },
    ...(units.length > 0 ? [{ id: 'modelos', label: tV3('nav.models') }] : []),
    ...(property.amenities?.length ? [{ id: 'amenidades', label: tV3('nav.amenities') }] : []),
    ...(showGeo ? [{ id: 'ubicacion', label: tV3('nav.location') }] : []),
    ...(showReturns ? [{ id: 'rentabilidad', label: tV3('nav.returns') }] : []),
  ];
  // Encabezados de los bloques compartidos (modelos, amenidades) al estilo v3
  // sin tocar esos componentes, que también usa la ficha de unidad.
  const sectionCls = 'pt-10 lg:pt-14 mt-10 lg:mt-14 border-t border-black/10 first:mt-0 first:pt-0 first:border-t-0 empty:hidden scroll-mt-28 [&_h2]:font-display [&_h2]:font-semibold [&_h2]:tracking-[-0.03em] [&_h2]:text-[28px] lg:[&_h2]:text-[36px] [&_h2]:leading-[1.08] [&_h2]:text-[#13222C] [&_h2]:mb-6';

  return (
    <>
      <ViewItemTracker
        itemId={property.id}
        itemName={property.name}
        itemKind="development"
        city={property.city || undefined}
        zone={property.zone || undefined}
        priceMxn={precio.moneda === 'MXN' ? (precio.min ?? undefined) : (propertyPrice > 0 ? propertyPrice : undefined)}
      />
      <SchemaMarkup
        type="realEstateListing"
        data={{
          name: property.name,
          description,
          url: `https://propyte.com/${locale}/desarrollos/${slug}`,
          image: property.images?.[0] || undefined,
          datePosted: property.created_at,
          ...(developerDisplay.name && {
            brand: { '@type': 'Organization', name: developerDisplay.name },
          }),
          ...(precio.min != null && {
            offers: {
              '@type': 'Offer',
              // La moneda sale del dato: un priceCurrency fijo en 'MXN' publicaba
              // 145,000 dolares como 145,000 pesos en el dato estructurado.
              price: precio.min,
              priceCurrency: precio.moneda,
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

      <Breadcrumbs
        locale={locale}
        homeLabel={tProp('breadcrumbHome')}
        ariaLabel={tProp('breadcrumbAriaLabel')}
        items={[
          { label: tProp('breadcrumbDevelopments'), href: `/${locale}/desarrollos` },
          { label: property.city, href: `/${locale}/desarrollos/${citySlug}` },
          { label: property.name },
        ]}
      />

      <div className="bg-white text-[#13222C] pb-24 md:pb-0">
        {/* ── Encabezado ── */}
        <header className="px-4 lg:px-10 pt-6 lg:pt-10 pb-6 lg:pb-10 lg:flex lg:items-end lg:justify-between lg:gap-12">
          <div className="min-w-0">
            <p className="text-[14px] lg:text-[15px] text-[#5B6B74]">{placeLine}</p>
            <h1 className="mt-3 font-display text-[38px] sm:text-[48px] lg:text-[clamp(52px,5.6vw,92px)] leading-[0.98] font-semibold tracking-[-0.04em] max-w-[18ch] text-balance">
              {h1Title}
            </h1>
            {publicationSubtitle && (
              <p className="mt-3 text-[18px] lg:text-[22px] leading-snug text-[#5B6B74] max-w-[40ch]">{publicationSubtitle}</p>
            )}
          </div>
          <div className="mt-6 lg:mt-0 flex flex-col items-start sm:flex-row sm:items-end sm:justify-between lg:justify-end gap-5 sm:gap-6 shrink-0">
            {precio.min != null && (
              <div>
                <span className="block text-[13px] text-[#5B6B74] mb-1">{tProp('startingFrom')}</span>
                <div className="flex items-center gap-3 flex-wrap">
                  <PriceDisplay amount={precio.min} currency={precio.moneda} variant="dual" size="xl" showRateNote />
                  {hasUnitsWithDiscount && <DiscountBadge variant="inline" pct={maxDiscountPct} />}
                </div>
              </div>
            )}
            <ShareDownloadModal data={shareData} locale={locale} />
          </div>
        </header>

        {/* ── Fotos ── */}
        <div className="px-4 lg:px-10">
          <GalleryV3
            images={galleryImages}
            alt={property.name}
            badge={stageLabel ? (
              <span className={`text-xs lg:text-[13px] font-semibold px-2.5 py-1.5 lg:px-3 lg:py-[7px] rounded ${stage?.slug === 'preventa' ? 'bg-propyte-brand text-[#0F1923]' : 'bg-[#0F1923] text-white'}`}>{stageLabel}</span>
            ) : null}
          />
        </div>

        {/* ── Franja de datos: filetes de 1 px con el truco de gap sobre fondo claro ── */}
        {facts.length > 0 && (
          <dl className="mt-6 lg:mt-10 mx-4 lg:mx-10 rounded-md overflow-hidden gap-px grid grid-cols-2 lg:grid-flow-col lg:auto-cols-fr [background-color:#2A3A45] max-lg:[&>div:last-child:nth-child(odd)]:col-span-2">
            {facts.map((f) => (
              <div key={f.label} className="bg-[#0F1923] text-white px-5 py-5 lg:px-7 lg:py-7">
                <dt className="text-[12px] lg:text-[13px] text-white/60">{f.label}</dt>
                <dd className="mt-1.5 font-display text-[20px] lg:text-[26px] leading-[1.1] font-semibold tracking-[-0.02em]">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* ── Índice de la ficha ── */}
        {navItems.length > 1 && (
          <nav aria-label={tV3('nav.aria')} className="mt-8 lg:mt-12 px-4 lg:px-10 border-b border-black/10">
            <ul className="flex gap-6 lg:gap-9 overflow-x-auto [scrollbar-width:none]">
              {navItems.map((n) => (
                <li key={n.id} className="shrink-0">
                  <a href={`#${n.id}`} className="block py-4 text-[15px] font-medium text-[#5B6B74] hover:text-[#13222C] transition-colors">{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="px-4 lg:px-10 pt-10 lg:pt-14 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-12 lg:gap-16 items-start">
          <div className="min-w-0">
            <section id="descripcion" className={sectionCls}>
              {!hasEditorial && description && (
                <div>
                  <h2>{tV3('headings.description')}</h2>
                  <div className="text-[16px] lg:text-[17px] leading-[1.65] text-[#2C3A42] max-w-[68ch]">
                    <ExpandableText maxHeight={220} moreLabel={tProp('readMore')} lessLabel={tProp('readLess')}>
                      <MarkdownContent markdown={description} />
                    </ExpandableText>
                  </div>
                </div>
              )}
              {property.richContent && (
                <div className="max-w-[68ch]">
                  <RichContentSections richContent={property.richContent} locale={locale} moreLabel={tProp('readMore')} lessLabel={tProp('readLess')} />
                </div>
              )}
            </section>

            <section id="modelos" className={sectionCls}>
              <UnitModelsTable units={units} mlEstimates={mlEstimates} locale={locale} />
            </section>

            {(property.virtual_tour_url || property.video_url) && (
              <section id="recorrido" className={sectionCls}>
                <h2>{tProp('exploreTitle')}</h2>
                <div className={`grid gap-4 ${property.virtual_tour_url && property.video_url ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {property.virtual_tour_url && <VirtualTour url={property.virtual_tour_url} propertyName={property.name} />}
                  {property.video_url && <VideoPlayer url={property.video_url} propertyName={property.name} thumbnail={property.images?.[0]} />}
                </div>
              </section>
            )}

            <section id="amenidades" className={sectionCls}>
              <AmenityList locale={locale} amenities={property.amenities || undefined} />
            </section>

            {/* Regla 3: Documentos solo en exclusivos. */}
            {safeBrochureUrl && (
              <section className={sectionCls}>
                <h2>{tProp('documentsTitle')}</h2>
                <a href={safeBrochureUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 py-5 border-y border-black/10 hover:text-[#0E7490] transition-colors">
                  <FileText size={22} aria-hidden="true" className="shrink-0 text-[#5B6B74]" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold">{tProp('brochure')}</span>
                    <span className="block text-[13px] text-[#5B6B74] truncate">{deriveFilenameFromUrl(safeBrochureUrl, 'brochure.pdf')}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold shrink-0"><Download size={16} aria-hidden="true" /> {tProp('download')}</span>
                </a>
              </section>
            )}

            {/* Regla 4: Desarrollador solo en exclusivos. */}
            {isExclusive && developerDisplay.name && (
              <section className={sectionCls}>
                <h2>{tProp('developerTitle')}</h2>
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-md border border-black/10 flex items-center justify-center shrink-0 overflow-hidden bg-white">
                    {developerDisplay.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={developerDisplay.logoUrl} alt={developerDisplay.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-display text-xl font-semibold">{developerInitials}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-[22px] font-semibold tracking-[-0.02em]">{developerDisplay.name}</p>
                    <p className="text-[14px] text-[#5B6B74] mt-0.5">
                      {[
                        developerProjects > 0 ? tProp('projectsCount', { count: developerProjects }) : null,
                        developerDisplay.yearsExperience ? `${developerDisplay.yearsExperience} ${tProp('yearsExperience')}` : null,
                        developerDisplay.unitsDelivered ? `${developerDisplay.unitsDelivered.toLocaleString()} ${tProp('unitsDelivered')}` : null,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                {developerDisplay.description && (
                  <p className="mt-5 text-[16px] leading-[1.6] text-[#2C3A42] max-w-[68ch]">{developerDisplay.description}</p>
                )}
              </section>
            )}

            {showGeo && (
              <section id="ubicacion" className={sectionCls}>
                <h2>{tV3('headings.location')}</h2>
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
                  {airdnaSummary && marketCode && <DataInsights data={airdnaSummary} locale={locale} market={marketCode} />}
                </div>
              </section>
            )}

            {showReturns && (
              <section id="rentabilidad" className={sectionCls}>
                <h2>{tV3('headings.returns')}</h2>
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
                    propertyType={mainType}
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
                      estimatedRent={rentalPerM2 && representativeArea ? Math.round(rentalPerM2 * representativeArea) : rentalMedian}
                      estimatedRentVac={rentalMedianVac}
                      airdnaOccupancy={airdnaOccupancy}
                    />
                  )}
                  {sentimentIndicators.length > 0 && <MarketSentiment indicators={sentimentIndicators} locale={locale} />}
                  {propertyPrice > 0 && (irr5y != null || irr10y != null) && (
                    <CetesComparison initialInvestment={propertyPrice} irr5y={irr5y} irr10y={irr10y} locale={locale} />
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ── Contacto ── */}
          <aside id="contact-form" className="lg:sticky lg:top-28 scroll-mt-28 border-t lg:border-t-0 border-black/10 pt-10 lg:pt-0">
            <div className="lg:border-l lg:border-black/10 lg:pl-10">
              <h2 className="font-display text-[26px] lg:text-[30px] leading-[1.08] font-semibold tracking-[-0.03em]">
                {tV3('contactTitle', { name: h1Title })}
              </h2>
              <p className="mt-3 text-[15px] text-[#5B6B74]">{tProp('getPricingDescription')}</p>
              <div className="mt-6">
                <ContactForm
                  propertyId={property.id}
                  propertyName={property.name}
                  whatsappUrl={`https://wa.me/${waNumber}?text=${encodeURIComponent(tProp('whatsappInterestText', { name: property.name }))}`}
                  whatsappLabel="WhatsApp"
                />
              </div>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section aria-labelledby="similar-title" className="mt-20 lg:mt-32 px-4 lg:px-10 pt-12 lg:pt-16 border-t border-black/10">
            <div className="flex items-end justify-between gap-6">
              <h2 id="similar-title" className="font-display text-[32px] lg:text-[clamp(34px,4vw,56px)] leading-[1.02] font-semibold tracking-[-0.035em]">{tV3('similarTitle')}</h2>
              <Link href={`/${locale}/desarrollos`} className="hidden sm:inline font-semibold text-[15px] whitespace-nowrap">{tV3('similarAll')} →</Link>
            </div>
            <div className="mt-8 lg:mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
              {similar.slice(0, 3).map((d) => <DevCardV3 key={d.id} d={d} fromLabel={tProp('startingFrom')} />)}
            </div>
          </section>
        )}

        <div className="px-4 lg:px-10 pt-12 pb-16 lg:pb-24">
          <PriceDisclaimer />
        </div>
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
