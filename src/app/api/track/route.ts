// ============================================================
// /api/track — espejo server-side de los eventos de mitad de embudo
// ============================================================
//
// El navegador ya disparó el evento por Pixel con un `eventId`; aquí lo
// reenviamos por Conversions API con el MISMO id. Meta deduplica y cuenta
// una sola vez, pero se queda con la versión mejor identificada (la nuestra
// trae _fbp/_fbc/IP/user-agent) y con la que sí llega cuando el navegador
// está bloqueado por adblocker o ITP.
//
// Este endpoint NO recibe PII. El evento `Lead` va por /api/leads, que sí
// tiene email y teléfono para hashear.

import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { getBrowserContext, sendCAPIEvents, type CAPIEvent } from '@/lib/meta/capi';

export const dynamic = 'force-dynamic';

/**
 * Allowlist estricta. El endpoint es público: sin esto, cualquiera podría
 * inyectar eventos arbitrarios (incluido `Purchase`) en el pixel y envenenar
 * la optimización de las campañas.
 *
 * `Lead` NO está en la lista a propósito — se dispara desde /api/leads.
 */
const ALLOWED_EVENTS = new Set(['ViewContent', 'Contact', 'Search', 'AddToWishlist']);

/** Sólo estos params se reenvían; el resto se descarta. */
const ALLOWED_PARAMS = new Set([
  'content_ids',
  'content_type',
  'content_name',
  'content_category',
  'value',
  'currency',
  'method',
  'surface',
  'search_string',
  'num_results',
]);

function sanitizeParams(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!ALLOWED_PARAMS.has(k)) continue;
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') out[k] = v.slice(0, 200);
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (Array.isArray(v)) out[k] = v.slice(0, 20).map((x) => String(x).slice(0, 100));
  }
  return out;
}

export async function POST(request: NextRequest) {
  // Un usuario real genera pocas decenas de eventos por minuto navegando.
  const limited = enforceRateLimit(request, { bucket: 'track', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  let body: { eventName?: unknown; eventId?: unknown; params?: unknown; page?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const eventName = typeof body.eventName === 'string' ? body.eventName : '';
  if (!ALLOWED_EVENTS.has(eventName)) {
    // 200 a propósito: no le damos a un scanner señal de qué nombres existen.
    return NextResponse.json({ ok: true, skipped: 'event_not_allowed' });
  }

  const eventId = typeof body.eventId === 'string' ? body.eventId.slice(0, 100) : undefined;
  const page = typeof body.page === 'string' ? body.page.slice(0, 500) : null;
  const ctx = getBrowserContext(request, page);

  const event: CAPIEvent = {
    eventName,
    actionSource: 'website',
    eventId,
    eventSourceUrl: page ?? undefined,
    userData: {
      clientIpAddress: ctx.ip,
      clientUserAgent: ctx.userAgent,
      fbp: ctx.fbp,
      fbc: ctx.fbc,
    },
    customData: sanitizeParams(body.params),
  };

  // sendCAPIEvents no lanza; devuelve null si Meta rechazó o falta config.
  const result = await sendCAPIEvents([event]);

  return NextResponse.json({ ok: true, sent: result !== null });
}
