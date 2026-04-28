import { NextResponse } from 'next/server';
import type { DocumentProps } from '@react-pdf/renderer';
import { renderToStream } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import {
  getDevelopmentWithUnits,
  getUnitBySlug,
  getDeveloperById,
  getDevelopmentFinancials,
  getRentalEstimate,
} from '@/lib/supabase/queries';
import { getMockUnit } from '@/lib/mocks/unit-fixtures';
import { mapUnitToProperty, type UnitRow } from '@/lib/mappers/unit-to-property';
import {
  CITY_TO_AIRDNA,
  calculateIRR,
  buildCashflows,
  calculateRemainingBalanceActuarial,
  calculateClosingCosts,
  VAC,
  RES,
} from '@/lib/calculator';
import { PropertyPDFDocument, type PropertyPDFData, type PropertyPDFLabels } from '@/lib/pdf/PropertyPDFDocument';
import { createElement, type ReactElement } from 'react';
import { getTranslations } from 'next-intl/server';
import { pickLang } from '@/lib/i18n/pickLang';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Allow up to 60s for server render
export const maxDuration = 60;

const isLocale = (s: string | null): s is 'es' | 'en' => s === 'es' || s === 'en';
const isKind = (s: string | null): s is 'development' | 'unit' => s === 'development' || s === 'unit';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  const kindParam = url.searchParams.get('kind');
  const localeParam = url.searchParams.get('locale');

  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  if (kindParam !== null && !isKind(kindParam)) {
    return NextResponse.json({ error: 'Invalid kind (expected development|unit)' }, { status: 400 });
  }
  if (localeParam !== null && !isLocale(localeParam)) {
    return NextResponse.json({ error: 'Invalid locale (expected es|en)' }, { status: 400 });
  }
  const kind = isKind(kindParam) ? kindParam : 'development';
  const locale = isLocale(localeParam) ? localeParam : 'es';

  const supabase = createPublicSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'no supabase' }, { status: 500 });

  try {
    const data = kind === 'unit'
      ? await buildUnitPdfData(supabase, slug, locale)
      : await buildDevelopmentPdfData(supabase, slug, locale);

    if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const doc = createElement(PropertyPDFDocument, { data }) as unknown as ReactElement<DocumentProps>;
    const stream = await renderToStream(doc);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    const safeName = data.name.replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 60);
    const filename = `propyte-${kind}-${safeName}-${locale}.pdf`;

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('generate-pdf failed:', err);
    const msg = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: 'pdf generation failed', detail: msg }, { status: 500 });
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

async function buildPdfLabels(locale: 'es' | 'en', kind: 'development' | 'unit'): Promise<PropertyPDFLabels> {
  const t = await getTranslations({ locale, namespace: 'pdf' });
  return {
    snapshot: kind === 'unit' ? t('snapshotProperty') : t('snapshotDevelopment'),
    imageNotAvailable: t('imageNotAvailable'),
    priceRange: t('priceRange'),
    startingFrom: t('startingFrom'),
    projectedRoi: t('projectedRoi'),
    annual: t('annual'),
    bedrooms: t('bedrooms'),
    bathrooms: t('bathrooms'),
    area: t('area'),
    stage: t('stage'),
    irr5y: t('irr5y'),
    estRentMo: t('estRentMo'),
    overview: t('overview'),
    investmentMetrics: t('investmentMetrics'),
    amenities: t('amenities'),
    developer: t('developer'),
    disclaimer: t('disclaimer'),
    generatedOn: t('generatedOn'),
    scan: t('scan'),
  };
}

async function buildUnitPdfData(supabase: any, slug: string, locale: 'es' | 'en'): Promise<PropertyPDFData | null> {
  let row: UnitRow | null = null;
  try {
    const { data } = await getUnitBySlug(supabase, slug);
    if (data) row = data as UnitRow;
  } catch { /* fall through to mock */ }
  if (!row) row = getMockUnit(slug);
  if (!row) return null;

  const property = mapUnitToProperty(row);
  const description = { es: property.description.es, en: property.description.en };
  const state = property.location.state || 'Quintana Roo';

  // Rental estimate
  let estRent: number | null = null;
  let airdnaOccupancy: number | null = null;
  try {
    const airdnaMarket = CITY_TO_AIRDNA[property.location.city] || '';
    const [res, airdna] = await Promise.all([
      getRentalEstimate(supabase, property.location.city, property.specs.type, property.specs.bedrooms, property.location.zone, 'residencial'),
      airdnaMarket ? supabase.schema('investment_analytics' as 'public').from('airdna_metrics').select('current_occupancy').eq('market', airdnaMarket).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    if (res.data) {
      const perM2 = res.data.avg_rent_per_m2;
      estRent = perM2 && perM2 > 0 && property.specs.area > 0
        ? Math.round(perM2 * property.specs.area)
        : res.data.median_rent_mxn;
    }
    if (airdna?.data) airdnaOccupancy = airdna.data.current_occupancy;
  } catch { /* tolerate */ }

  // IRR
  const price = property.price.mxn;
  const closingCosts = calculateClosingCosts(price, state);
  const downPct = property.financing.downPaymentMin || 20;
  const totalInvested = price * (downPct / 100) + closingCosts;
  const monthlyNet = estRent ? Math.round(estRent * RES.OCCUPANCY * (1 - RES.EXPENSE_RATIO)) : 0;
  const irr5y = estRent ? calculateIRR(buildCashflows({
    totalInvested,
    annualNetFlow: monthlyNet * 12,
    price,
    appreciationPct: property.roi.appreciation || 8,
    years: 5,
    remainingBalance: calculateRemainingBalanceActuarial(price, downPct, property.financing.interestRate || 9.5, property.financing.months[0] || 120, 60),
  })) : null;
  const irr10y = estRent ? calculateIRR(buildCashflows({
    totalInvested,
    annualNetFlow: monthlyNet * 12,
    price,
    appreciationPct: property.roi.appreciation || 8,
    years: 10,
    remainingBalance: calculateRemainingBalanceActuarial(price, downPct, property.financing.interestRate || 9.5, property.financing.months[0] || 120, 120),
  })) : null;

  const propertyUrl = `https://propyte.com/${locale}/propiedades/${slug}`;
  const qr = await QRCode.toDataURL(propertyUrl, { margin: 1, width: 200 });

  const tPdf = await getTranslations({ locale, namespace: 'pdf' });
  const stageLabel = property.stage === 'preventa'
    ? tPdf('stagePresale')
    : property.stage === 'construccion'
      ? tPdf('stageConstruction')
      : tPdf('stageReadyUnit');

  const labels = await buildPdfLabels(locale, 'unit');
  const descText = pickLang(locale, description.en || description.es || '', description.es || '');

  return {
    name: property.name,
    kind: 'unit',
    url: propertyUrl,
    heroImage: property.images?.[0] || null,
    city: property.location.city,
    zone: property.location.zone,
    state: property.location.state,
    address: property.location.address || null,
    price: property.price.mxn,
    priceMax: null,
    areaRange: property.specs.area > 0 ? { min: property.specs.area, max: property.specs.area } : null,
    bedroomsRange: property.specs.bedrooms > 0 ? { min: property.specs.bedrooms, max: property.specs.bedrooms } : null,
    bathroomsRange: property.specs.bathrooms > 0 ? { min: property.specs.bathrooms, max: property.specs.bathrooms } : null,
    developer: property.developer || null,
    stageLabel,
    description: descText,
    roiProjected: property.roi.projected || null,
    capRate: property.capRate ?? null,
    irr5y,
    irr10y,
    estimatedRent: estRent,
    amenities: property.amenities || [],
    qrCodeDataUrl: qr,
    locale,
    generatedAt: new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    }),
    labels,
  };
}

async function buildDevelopmentPdfData(supabase: any, slug: string, locale: 'es' | 'en'): Promise<PropertyPDFData | null> {
  const { data } = await getDevelopmentWithUnits(supabase, slug);
  if (!data) return null;

  const { units: devUnits, ...dev } = data as any;
  const property = dev as Record<string, any>;
  const units = (devUnits || []) as Array<{ bedrooms: number | null; bathrooms: number | null; area_m2: number | null; price_mxn: number | null }>;

  // Ranges
  const rangeOf = (k: 'bedrooms' | 'bathrooms' | 'area_m2' | 'price_mxn') => {
    const vals = units.map((u) => u[k]).filter((v): v is number => typeof v === 'number' && v > 0);
    if (vals.length === 0) return null;
    return { min: Math.min(...vals), max: Math.max(...vals) };
  };

  // Financials + rental
  let capRate: number | null = null;
  let roiPct: number | null = property.roi_projected ?? null;
  let estRent: number | null = null;
  try {
    const [fin, rent] = await Promise.all([
      getDevelopmentFinancials(supabase, property.id),
      getRentalEstimate(supabase, property.city, property.property_types?.[0] || 'departamento', null, property.zone, 'residencial'),
    ]);
    if (fin) {
      capRate = fin.cap_rate ?? capRate;
      roiPct = fin.roi_annual_pct ?? roiPct;
    }
    if (rent.data) estRent = rent.data.median_rent_mxn;
  } catch { /* tolerate */ }

  // Developer fallback
  let developerName: string | null = property.developer_name || null;
  if (!developerName && property.developer_id) {
    const rec = await getDeveloperById(supabase, property.developer_id);
    if (rec) developerName = rec.name;
  }

  const propertyUrl = `https://propyte.com/${locale}/desarrollos/${slug}`;
  const qr = await QRCode.toDataURL(propertyUrl, { margin: 1, width: 200 });

  const tPdf = await getTranslations({ locale, namespace: 'pdf' });
  const stageLabel = property.stage === 'preventa'
    ? tPdf('stagePresale')
    : property.stage === 'construccion'
      ? tPdf('stageConstruction')
      : tPdf('stageReadyDev');

  const labels = await buildPdfLabels(locale, 'development');
  const descText = pickLang(locale, property.description_en || '', property.description_es || '');

  return {
    name: property.name,
    kind: 'development',
    url: propertyUrl,
    heroImage: Array.isArray(property.images) && property.images[0] ? property.images[0] : null,
    city: property.city || '',
    zone: property.zone || '',
    state: property.state || '',
    address: property.address || null,
    price: property.price_min_mxn || property.price_mxn || 0,
    priceMax: property.price_max_mxn || null,
    areaRange: rangeOf('area_m2'),
    bedroomsRange: rangeOf('bedrooms'),
    bathroomsRange: rangeOf('bathrooms'),
    developer: developerName,
    stageLabel,
    description: descText,
    roiProjected: roiPct,
    capRate,
    irr5y: null,
    irr10y: null,
    estimatedRent: estRent,
    amenities: Array.isArray(property.amenities) ? property.amenities : [],
    qrCodeDataUrl: qr,
    locale,
    generatedAt: new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    }),
    labels,
  };
}
