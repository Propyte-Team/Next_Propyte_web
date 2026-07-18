import { NextResponse, type NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import type { DocumentProps } from '@react-pdf/renderer';
import { renderToStream } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getUnitBySlug } from '@/lib/supabase/queries';
import { mapUnitToProperty, type UnitRow } from '@/lib/mappers/unit-to-property';
import { computeInversionInicial, type Nacionalidad, type NivelAcabado } from '@/lib/inversion-inicial';
import { computeHipotecario, type PerfilHipotecario } from '@/lib/hipotecario';
import { aggregateByYear } from '@/lib/corrida-anual';
import {
  CotizacionPDFDocument, type CotizacionPDFData, type CotizacionPDFLabels,
} from '@/lib/pdf/CotizacionPDFDocument';
import { createElement, type ReactElement } from 'react';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const RL = { bucket: 'generate-cotizacion-pdf', limit: 5, windowMs: 60_000 };

const isLocale = (s: string | null): s is 'es' | 'en' => s === 'es' || s === 'en';
const isPerfil = (s: string | null): s is PerfilHipotecario => s === 'nacional' || s === 'extranjero';
const isNivel = (s: string | null): s is NivelAcabado => s === 'standard' || s === 'alto' || s === 'premium';

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, RL);
  if (limited) return limited;

  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  const perfilParam = url.searchParams.get('perfil');
  const localeParam = url.searchParams.get('locale');
  const mobParam = url.searchParams.get('mob');
  const decParam = url.searchParams.get('dec');

  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  const perfil: PerfilHipotecario = isPerfil(perfilParam) ? perfilParam : 'nacional';
  const locale: 'es' | 'en' = isLocale(localeParam) ? localeParam : 'es';
  const mobiliarioNivel: NivelAcabado = isNivel(mobParam) ? mobParam : 'alto';
  const decoracionNivel: NivelAcabado = isNivel(decParam) ? decParam : 'standard';

  const supabase = createPublicSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'no supabase' }, { status: 500 });

  try {
    let row: UnitRow | null = null;
    try {
      const { data } = await getUnitBySlug(supabase, slug);
      if (data) row = data as UnitRow;
    } catch { /* not found */ }
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const property = mapUnitToProperty(row);
    const price = property.price.mxn;
    const priceOriginal = property.priceOriginal ?? price;
    const discountPct = property.discount?.pct ?? 0;

    const hip = computeHipotecario(price, perfil, property.financing.downPaymentMin);
    const inv = computeInversionInicial({
      price,
      engancheMxn: hip.enganche,
      nacionalidad: perfil as Nacionalidad,
      m2: property.specs.area,
      city: property.location.city,
      zone: property.location.zone,
      tipoEntrega: property.specs.tipoEntrega ?? null,
      mobiliarioNivel,
      decoracionNivel,
    });
    const annual = aggregateByYear(hip.schedule.rows).map((y) => ({
      anio: y.anio, cuota: y.cuota, interes: y.interes, capital: y.capital, saldoFinal: y.saldoFinal,
    }));

    const propertyUrl = `https://propyte.com/${locale}/propiedades/${slug}`;
    const qr = await QRCode.toDataURL(propertyUrl, { margin: 1, width: 200 });

    const tE = await getTranslations({ locale, namespace: 'esquemas' });
    const tC = await getTranslations({ locale, namespace: 'cotizacionPdf' });

    const labels: CotizacionPDFLabels = {
      docType: tC('docType'),
      bloquePrecio: tE('bloquePrecio'), precio: tE('precio'), descuento: tE('descuento'), precioVenta: tE('precioVenta'),
      bloqueInversion: tE('bloqueInversion'), enganche: tE('enganche'), escrituracion: tE('escrituracion'),
      mobiliario: tE('mobiliario'), decoracion: tE('decoracion'), incluido: tE('incluido'), inversionInicial: tE('inversionInicial'),
      bloqueSaldo: tE('bloqueSaldo'), saldo: tE('saldo'), mensualidades: tE('mensualidades'), interes: tE('interes'), mensualidad: tE('mensualidad'),
      corridaTitle: tC('corridaTitle'), colYear: tC('colYear'), colPayment: tC('colPayment'),
      colInterest: tC('colInterest'), colCapital: tC('colCapital'), colBalance: tC('colBalance'),
      totalInterest: tC('totalInterest'), totalPaid: tC('totalPaid'),
      perfil: perfil === 'extranjero' ? tC('perfilExtranjero') : tC('perfilNacional'),
      tasaPlazo: tC('tasaPlazo', { rate: hip.config.tasaAnualPct, months: hip.config.meses }),
      avisoCambiario: hip.config.avisoCambiario ? tC('avisoCambiario') : null,
      disclaimer: tC('disclaimer'), generatedOn: tC('generatedOn'), scan: tC('scan'),
    };

    const data: CotizacionPDFData = {
      name: property.name,
      url: propertyUrl,
      city: property.location.city,
      zone: property.location.zone,
      state: property.location.state,
      locale,
      generatedAt: new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      precio: priceOriginal,
      descuentoPct: discountPct,
      precioVenta: price,
      enganche: inv.enganche,
      enganchePct: hip.enganchePct,
      escrituracion: inv.escrituracion,
      mobiliario: inv.mobiliario,
      decoracion: inv.decoracion,
      mobiliarioIncluido: inv.mobiliarioIncluido,
      decoracionIncluido: inv.decoracionIncluido,
      inversionTotal: inv.total,
      saldo: hip.saldo,
      mensualidades: hip.config.meses,
      interesPct: hip.config.tasaAnualPct,
      mensualidad: Math.round(hip.schedule.cuota),
      totalIntereses: Math.round(hip.schedule.totalIntereses),
      totalPagado: Math.round(hip.schedule.totalPagado),
      tieneInteres: hip.schedule.tieneInteres,
      annual,
      qrCodeDataUrl: qr,
      labels,
    };

    const doc = createElement(CotizacionPDFDocument, { data }) as unknown as ReactElement<DocumentProps>;
    const stream = await renderToStream(doc);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    const safeName = property.name.replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 60);

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="propyte-cotizacion-${safeName}-${perfil}-${locale}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('generate-cotizacion-pdf failed:', err);
    return NextResponse.json({ error: 'pdf generation failed' }, { status: 500 });
  }
}
