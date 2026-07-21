import { NextResponse, type NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import type { DocumentProps } from '@react-pdf/renderer';
import { renderToStream } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getUnitBySlug } from '@/lib/supabase/queries';
import { mapUnitToProperty, type UnitRow } from '@/lib/mappers/unit-to-property';
import { computeInversionInicial, type Nacionalidad, type NivelAcabado } from '@/lib/inversion-inicial';
import { computeHipotecario, HIPOTECARIO_CONFIG, type PerfilHipotecario } from '@/lib/hipotecario';
import { computePreventa, buildContraentregaSchedule, type ContraentregaVia } from '@/lib/preventa';
import { computeEsquema } from '@/lib/esquemas-pago';
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
  const modeParam = url.searchParams.get('mode');
  const mode = modeParam === 'preventa' ? 'preventa' : modeParam === 'interno' ? 'interno' : 'hipotecario';
  const esquemaId = url.searchParams.get('esquema');
  const num = (k: string, d = 0) => {
    const v = Number(url.searchParams.get(k));
    return Number.isFinite(v) ? v : d;
  };

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

    const property = mapUnitToProperty(row, locale);
    const price = property.price.mxn;
    const priceOriginal = property.priceOriginal ?? price;
    const discountPct = property.discount?.pct ?? 0;
    const hipCfg = HIPOTECARIO_CONFIG[perfil];

    const tE = await getTranslations({ locale, namespace: 'esquemas' });
    const tC = await getTranslations({ locale, namespace: 'cotizacionPdf' });

    let inv: ReturnType<typeof computeInversionInicial>;
    let annual: CotizacionPDFData['annual'];
    let enganche: number;
    let enganchePct: number;
    let saldo: number;
    let mensualidades: number;
    let interesPct: number;
    let mensualidad: number;
    let totalIntereses: number;
    let totalPagado: number;
    let tieneInteres: boolean;
    let tasaPlazoLabel: string;
    // El aviso cambiario (crédito USD cross-border) SOLO aplica cuando el saldo se financia
    // vía crédito hipotecario para un extranjero — NO en financiamiento interno del desarrollador
    // (100% MXN) ni en preventa con contraentrega vía interno. Espeja la condición de la UI.
    let mostrarAvisoCambiario = false;
    let preventaBlock: CotizacionPDFData['preventa'] = null;
    let precioBloque1 = priceOriginal;
    let descuentoPctBloque1 = discountPct;
    let precioVentaBloque1 = price;

    if (mode === 'preventa') {
      const cfg = {
        enganche_inicial_pct: num('ei'),
        enganche_diferido_pct: num('ed'),
        enganche_diferido_meses: num('edm'),
        obra_pct: num('ob'),
        obra_meses: num('obm'),
        contraentrega_pct: num('ce'),
        // via=interno solo si la unidad realmente ofrece financiamiento del desarrollador;
        // si no, cae a hipotecario (no inventar una corrida interna 0% inexistente).
        contraentrega_via: (url.searchParams.get('via') === 'interno' && property.financing.directo
          ? 'interno' : 'hipotecario') as ContraentregaVia,
      };
      const plan = computePreventa(price, cfg);
      // Los porcentajes deben sumar 100% (espeja el gate del botón PDF en la UI).
      if (!plan.balanceado) {
        return NextResponse.json({ error: 'preventa percentages must sum to 100%' }, { status: 400 });
      }
      const mesesInternoRaw = property.financing.months?.[property.financing.months.length - 1];
      const mesesInterno = mesesInternoRaw && mesesInternoRaw > 0 ? mesesInternoRaw : 60;
      const schedule = buildContraentregaSchedule(plan.contraentrega, plan.contraentregaVia, {
        tasaHipotecarioPct: hipCfg.tasaAnualPct,
        mesesHipotecario: hipCfg.meses,
        tasaInternoPct: property.financing.interestRate,
        mesesInterno,
      });
      inv = computeInversionInicial({
        price,
        engancheMxn: plan.engancheInicial,
        nacionalidad: perfil as Nacionalidad,
        m2: property.specs.area,
        city: property.location.city,
        zone: property.location.zone,
        tipoEntrega: property.specs.tipoEntrega ?? null,
        mobiliarioNivel,
        decoracionNivel,
      });
      annual = aggregateByYear(schedule.rows).map((y) => ({
        anio: y.anio, cuota: y.cuota, interes: y.interes, capital: y.capital, saldoFinal: y.saldoFinal,
      }));
      enganche = plan.engancheInicial;
      enganchePct = plan.engancheInicialPct;
      saldo = plan.contraentrega;
      mensualidades = schedule.rows.length;
      interesPct = plan.contraentregaVia === 'interno' ? property.financing.interestRate : hipCfg.tasaAnualPct;
      mensualidad = Math.round(schedule.cuota);
      totalIntereses = Math.round(schedule.totalIntereses);
      totalPagado = Math.round(schedule.totalPagado);
      tieneInteres = schedule.tieneInteres;
      // La corrida de contraentrega usa la tasa/plazo segun `via` (interno u hipotecario) —
      // el banner debe reflejar EXACTAMENTE esos mismos valores, no siempre los del hipotecario.
      tasaPlazoLabel = tC('tasaPlazo', { rate: interesPct, months: schedule.rows.length });
      // Solo hipotecario extranjero: la contraentrega vía interno es MXN, sin aviso cambiario.
      mostrarAvisoCambiario = hipCfg.avisoCambiario && plan.contraentregaVia === 'hipotecario';
      const viaLabel = plan.contraentregaVia === 'interno' ? tE('preventaViaInterno') : tE('preventaViaHipotecario');
      preventaBlock = {
        engancheInicial: plan.engancheInicial,
        engancheInicialPct: plan.engancheInicialPct,
        engancheDiferido: plan.engancheDiferido,
        engancheDiferidoPct: plan.engancheDiferidoPct,
        engancheDiferidoMeses: plan.engancheDiferidoMeses,
        engancheDiferidoMensual: plan.engancheDiferidoMensual,
        obra: plan.obra,
        obraPct: plan.obraPct,
        obraMeses: plan.obraMeses,
        obraMensual: plan.obraMensual,
        contraentrega: plan.contraentrega,
        contraentregaPct: plan.contraentregaPct,
        viaLabel,
      };
    } else if (mode === 'interno') {
      // Esquema del Hub (fin_esquemas_pago / fallback fin_directo) — independiente del
      // descuento comercial de `property.discount`. Usa siempre el precio de LISTA
      // (priceOriginal, sin el descuento comercial) como base, igual que CorridaFinanciera.tsx
      // (`listPrice = property.priceOriginal ?? property.price.mxn`).
      const listaInterno = property.priceOriginal ?? property.price.mxn;
      const esquemaSel = (property.financing.esquemas ?? []).find((e) => e.id === esquemaId);
      if (!esquemaSel) return NextResponse.json({ error: 'esquema not found' }, { status: 404 });
      const computed = computeEsquema(listaInterno, esquemaSel);
      inv = computeInversionInicial({
        price: computed.precioEfectivo,
        engancheMxn: computed.enganche,
        nacionalidad: perfil as Nacionalidad,
        m2: property.specs.area,
        city: property.location.city,
        zone: property.location.zone,
        tipoEntrega: property.specs.tipoEntrega ?? null,
        mobiliarioNivel,
        decoracionNivel,
      });
      precioBloque1 = listaInterno;
      descuentoPctBloque1 = esquemaSel.descuento_pct;
      precioVentaBloque1 = computed.precioEfectivo;
      if (computed.esContado) {
        // La UI (CorridaFinanciera.tsx) nunca ofrece el botón de PDF para un esquema de
        // contado (`{!activo.esContado && (...)}`) — esto es defensivo ante una URL manual.
        // No hay corrida que mostrar; el banner usa la misma etiqueta "Pago de contado"
        // que el tab interno usa para el caso de contado.
        const tCorrida = await getTranslations({ locale, namespace: 'corrida' });
        annual = [];
        enganche = computed.enganche;
        enganchePct = esquemaSel.enganche_pct;
        saldo = 0;
        mensualidades = 0;
        interesPct = 0;
        mensualidad = 0;
        totalIntereses = 0;
        totalPagado = computed.precioEfectivo;
        tieneInteres = false;
        tasaPlazoLabel = tCorrida('cash');
      } else {
        annual = aggregateByYear(computed.schedule!.rows).map((y) => ({
          anio: y.anio, cuota: y.cuota, interes: y.interes, capital: y.capital, saldoFinal: y.saldoFinal,
        }));
        enganche = computed.enganche;
        enganchePct = esquemaSel.enganche_pct;
        saldo = computed.financiado;
        mensualidades = computed.schedule!.rows.length;
        interesPct = esquemaSel.tasa;
        mensualidad = Math.round(computed.schedule!.cuota);
        totalIntereses = Math.round(computed.schedule!.totalIntereses);
        totalPagado = Math.round(computed.schedule!.totalPagado);
        tieneInteres = computed.schedule!.tieneInteres;
        // La corrida usa la tasa/plazo del esquema seleccionado (timing-aware vía
        // computeEsquema) — el banner debe reflejar EXACTAMENTE esos mismos valores.
        tasaPlazoLabel = tC('tasaPlazo', { rate: esquemaSel.tasa, months: computed.schedule!.rows.length });
      }
    } else {
      const hip = computeHipotecario(price, perfil, property.financing.downPaymentMin);
      inv = computeInversionInicial({
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
      annual = aggregateByYear(hip.schedule.rows).map((y) => ({
        anio: y.anio, cuota: y.cuota, interes: y.interes, capital: y.capital, saldoFinal: y.saldoFinal,
      }));
      enganche = inv.enganche;
      enganchePct = hip.enganchePct;
      saldo = hip.saldo;
      mensualidades = hip.config.meses;
      interesPct = hip.config.tasaAnualPct;
      mensualidad = Math.round(hip.schedule.cuota);
      totalIntereses = Math.round(hip.schedule.totalIntereses);
      totalPagado = Math.round(hip.schedule.totalPagado);
      tieneInteres = hip.schedule.tieneInteres;
      tasaPlazoLabel = tC('tasaPlazo', { rate: hipCfg.tasaAnualPct, months: hipCfg.meses });
      mostrarAvisoCambiario = hipCfg.avisoCambiario;
    }

    const propertyUrl = `https://propyte.com/${locale}/propiedades/${slug}`;
    const qr = await QRCode.toDataURL(propertyUrl, { margin: 1, width: 200 });

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
      tasaPlazo: tasaPlazoLabel,
      avisoCambiario: mostrarAvisoCambiario ? tC('avisoCambiario') : null,
      disclaimer: tC('disclaimer'), generatedOn: tC('generatedOn'), scan: tC('scan'),
      preventaTitle: tC('preventaTitle'),
      preventaEngancheInicial: tC('preventaEngancheInicial'),
      preventaEngancheDiferido: tC('preventaEngancheDiferido'),
      preventaObra: tC('preventaObra'),
      preventaContraentrega: tC('preventaContraentrega'),
    };

    const data: CotizacionPDFData = {
      name: property.name,
      url: propertyUrl,
      city: property.location.city,
      zone: property.location.zone,
      state: property.location.state,
      locale,
      generatedAt: new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      precio: precioBloque1,
      descuentoPct: descuentoPctBloque1,
      precioVenta: precioVentaBloque1,
      enganche,
      enganchePct,
      escrituracion: inv.escrituracion,
      mobiliario: inv.mobiliario,
      decoracion: inv.decoracion,
      mobiliarioIncluido: inv.mobiliarioIncluido,
      decoracionIncluido: inv.decoracionIncluido,
      inversionTotal: inv.total,
      saldo,
      mensualidades,
      interesPct,
      mensualidad,
      totalIntereses,
      totalPagado,
      tieneInteres,
      annual,
      qrCodeDataUrl: qr,
      labels,
      preventa: preventaBlock,
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
