import { NextRequest, NextResponse } from 'next/server';
import { randomInt, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { enforceGlobalQuota } from '@/lib/security/global-quota';
import { sanitizeErrorMessage } from '@/lib/security/sanitize-error';
import { getZohoClient } from '@/lib/zoho/client';
import {
  sourceToZohoPayload,
  truncateError,
  type FormData,
  type LeadSource,
  type Locale,
  type UtmData,
} from '@/lib/zoho/field-maps';
import { resolveProyectoDeInteres } from '@/lib/zoho/resolve-proyecto-interes';
import type { ZohoLead, ZohoAccount } from '@/lib/zoho/types';

// ============================================================
// /api/leads — endpoint unificado para los 11 forms
// Spec: specs/web-forms-zoho-integration.md (v1.5)
// REQ-F-01..21 + REQ-S-01..09
// ============================================================

const LEAD_RATE_LIMIT = { bucket: 'leads', limit: 5, windowMs: 60_000 };

const KNOWN_SOURCES: ReadonlyArray<LeadSource> = [
  'contact',
  'property_inquiry',
  'b2b_request',
  'developer_request',
  'broker_registration',
  'provider_form',
  'built_consultation',
  'affiliate_request',
  'newsletter',
  'lead_magnet',
  'glossary_pdf',
];

// Regex defensivo para UTMs/gclid — bloquea injection y limita tamaño (REQ-S-08).
const UTM_REGEX = /^[A-Za-z0-9._~-]{0,200}$/;
const optionalUtm = z
  .string()
  .regex(UTM_REGEX)
  .optional()
  .nullable()
  .or(z.literal(''));

const LeadSchema = z.object({
  // Identidad
  name: z.string().trim().max(200).optional().nullable().or(z.literal('')),
  email: z.string().trim().max(254).email().optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(40).optional().nullable().or(z.literal('')),
  message: z.string().max(5000).optional().nullable().or(z.literal('')),

  // Honeypot — si viene populado, el caller es bot (REQ-F-02, REQ-S-06)
  website: z.string().max(500).optional().nullable().or(z.literal('')),

  // Source + locale
  source: z.string().max(60).optional().nullable().or(z.literal('')),
  locale: z.enum(['es', 'en']).optional().nullable().or(z.literal('')),

  // Por form (extras opcionales)
  propertyId: z.string().uuid().optional().nullable().or(z.literal('')),
  propertyName: z.string().max(200).optional().nullable().or(z.literal('')),
  subject: z.string().max(200).optional().nullable().or(z.literal('')),
  investmentType: z.string().max(100).optional().nullable().or(z.literal('')),
  company: z.string().max(200).optional().nullable().or(z.literal('')),
  location: z.string().max(200).optional().nullable().or(z.literal('')),
  city: z.string().max(200).optional().nullable().or(z.literal('')),
  projectType: z.string().max(100).optional().nullable().or(z.literal('')),
  unitCount: z.string().max(50).optional().nullable().or(z.literal('')),
  brokerType: z.string().max(100).optional().nullable().or(z.literal('')),
  experience: z.string().max(100).optional().nullable().or(z.literal('')),
  focusArea: z.string().max(200).optional().nullable().or(z.literal('')),
  category: z.string().max(100).optional().nullable().or(z.literal('')),
  budget: z.string().max(200).optional().nullable().or(z.literal('')),
  whatsapp: z.string().max(40).optional().nullable().or(z.literal('')),
  interest: z.string().max(2000).optional().nullable().or(z.literal('')),

  // UTM tracking
  utm_source: optionalUtm,
  utm_medium: optionalUtm,
  utm_campaign: optionalUtm,
  utm_content: optionalUtm,
  utm_term: optionalUtm,
  gclid: optionalUtm,
});

// Origin allowlist — extensible vía env (REQ-F-17).
function isAllowedOrigin(origin: string | null): boolean {
  // Decisión consciente (apéndice E del spec): aceptar requests sin Origin header.
  // Browsers omiten Origin en same-origin form POSTs. Rate limit + honeypot +
  // global quota cubren el caso de bots sin Origin.
  if (!origin) return true;

  const envList = (process.env.LEADS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const baseList = [
    'https://propyte.com',
    'https://www.propyte.com',
    'https://dev.propyte.com',
  ];
  const allowed = new Set([...baseList, ...envList]);
  if (allowed.has(origin)) return true;

  if (process.env.NODE_ENV !== 'production') {
    try {
      const u = new URL(origin);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;
    } catch {
      return false;
    }
  }
  return false;
}

// Retry exponencial [200, 600, 1500] ms para UPDATE local post-Zoho (REQ-F-08).
const LOCAL_UPDATE_DELAYS_MS = [200, 600, 1500] as const;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Update local con retry — si los 3 intentos fallan tras Zoho exitoso, el lead
 * queda huérfano (zoho_id en Zoho sin map local). El cron retomará por la rama
 * ORPHAN con el id loggeado en zoho_sync_error.
 */
async function updateLeadLocal(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  leadId: string,
  patch: Record<string, unknown>,
): Promise<boolean> {
  for (let i = 0; i < LOCAL_UPDATE_DELAYS_MS.length; i++) {
    const { error } = await supabase.from('leads').update(patch).eq('id', leadId);
    if (!error) return true;
    if (i < LOCAL_UPDATE_DELAYS_MS.length - 1) {
      await sleep(LOCAL_UPDATE_DELAYS_MS[i]!);
    } else {
      console.error(
        JSON.stringify({
          event: 'leads.update-local.failed',
          lead_id: leadId,
          error: sanitizeErrorMessage(error),
        }),
      );
    }
  }
  return false;
}

/**
 * Maneja la llamada a Zoho /Leads y, para provider_form, /Accounts.
 * Side effect: actualiza public.leads via updateLeadLocal.
 */
async function pushToZoho(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  leadId: string,
  source: LeadSource,
  payload: { lead: ZohoLead; account?: ZohoAccount },
): Promise<void> {
  const zoho = getZohoClient();

  let zohoLeadId: string | undefined;
  try {
    const leadResult = await zoho.createRecords('Leads', [payload.lead]);
    const detail = leadResult.data?.[0];
    if (detail && detail.status === 'success' && detail.details?.id) {
      zohoLeadId = detail.details.id;
    } else {
      throw new Error(
        `Zoho Lead create returned non-success: ${JSON.stringify(detail)}`,
      );
    }
  } catch (err) {
    await updateLeadLocal(supabase, leadId, {
      zoho_sync_error: truncateError(sanitizeErrorMessage(err)),
    });
    return;
  }

  // Form 6 Proveedores — doble llamada Lead + Account (REQ-F-06)
  let zohoAccountId: string | undefined;
  let accountError: string | undefined;
  if (source === 'provider_form' && payload.account) {
    try {
      const acctResult = await zoho.createRecords('Accounts', [payload.account]);
      const detail = acctResult.data?.[0];
      if (detail && detail.status === 'success' && detail.details?.id) {
        zohoAccountId = detail.details.id;
      } else {
        accountError = `ACCOUNT: non-success ${JSON.stringify(detail)}`;
      }
    } catch (err) {
      accountError = `ACCOUNT: ${sanitizeErrorMessage(err)}`;
    }
  }

  await updateLeadLocal(supabase, leadId, {
    zoho_lead_id: zohoLeadId,
    zoho_account_id: zohoAccountId ?? null,
    zoho_synced_at: new Date().toISOString(),
    zoho_sync_error: accountError ? truncateError(accountError) : null,
  });
}

// ============================================================
// Handler
// ============================================================
export async function POST(request: NextRequest) {
  // 1. Origin allowlist
  if (!isAllowedOrigin(request.headers.get('origin'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Global quota (defense in depth contra DoS distribuido)
  const globalResp = enforceGlobalQuota();
  if (globalResp) return globalResp;

  // 3. Per-IP rate limit
  const rateResp = enforceRateLimit(request, LEAD_RATE_LIMIT);
  if (rateResp) return rateResp;

  // 4. Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    // REQ-S-09 — no eco del payload en respuestas de error
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  const data = parsed.data;

  // 5. Honeypot constant-time (REQ-F-02, REQ-S-06)
  if (data.website) {
    // Espera jitter para que el path silencioso tenga latencia similar al real.
    // Path real (insert + Zoho): ~600-1500ms; jitter 180-420ms cubre p10-p50 — bot
    // sofisticado pierde la pista. Bot simple no analiza timing.
    await sleep(randomInt(180, 421));
    return NextResponse.json({ success: true, id: randomUUID() }, { status: 200 });
  }

  // 6. Normalizar source — debe estar en la lista canónica
  const sourceRaw = (data.source || 'form').trim();
  if (!KNOWN_SOURCES.includes(sourceRaw as LeadSource)) {
    // Source desconocido → persistir igual con source='form' pero NO empujar a Zoho.
    // Es defensivo: bots que prueban payloads no llegan al CRM, pero quedan en audit.
    const supabase = await createServiceRoleClient();
    const { data: row, error } = await supabase
      .from('leads')
      .insert({
        name: data.name || null,
        email: data.email || null,
        phone: data.phone || null,
        message: data.message || null,
        property_id: data.propertyId || null,
        source: sourceRaw.slice(0, 60),
        intake_status: 'nuevo',
        locale: data.locale || 'es',
        utm_source: data.utm_source || null,
        utm_medium: data.utm_medium || null,
        utm_campaign: data.utm_campaign || null,
        utm_content: data.utm_content || null,
        utm_term: data.utm_term || null,
        gclid: data.gclid || null,
        zoho_sync_error: 'SKIPPED: unknown source',
      })
      .select('id')
      .single();

    if (error || !row) {
      console.error(
        JSON.stringify({
          event: 'leads.insert-unknown-source.failed',
          error: sanitizeErrorMessage(error),
        }),
      );
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 });
    }
    return NextResponse.json({ success: true, id: row.id }, { status: 200 });
  }

  const source = sourceRaw as LeadSource;
  const locale = (data.locale || 'es') as Locale;

  // 7. Insert public.leads PRIMERO con marker PENDING_SYNC (REQ-F-04, REQ-F-04b)
  const supabase = await createServiceRoleClient();

  const formData: FormData = {
    name: data.name || null,
    email: data.email || null,
    phone: data.phone || null,
    message: data.message || null,
    subject: data.subject || null,
    propertyId: data.propertyId || null,
    propertyName: data.propertyName || null,
    investmentType: data.investmentType || null,
    company: data.company || null,
    location: data.location || null,
    city: data.city || null,
    projectType: data.projectType || null,
    unitCount: data.unitCount || null,
    brokerType: data.brokerType || null,
    experience: data.experience || null,
    focusArea: data.focusArea || null,
    category: data.category || null,
    budget: data.budget || null,
    whatsapp: data.whatsapp || null,
    interest: data.interest || null,
    // website NO se incluye — es honeypot, ya fue manejado arriba
  };

  const utms: UtmData = {
    utm_source: data.utm_source || null,
    utm_medium: data.utm_medium || null,
    utm_campaign: data.utm_campaign || null,
    utm_content: data.utm_content || null,
    utm_term: data.utm_term || null,
    gclid: data.gclid || null,
  };

  // Resolver Proyecto_de_Interes si form 2 (lookup unit → development → zoho_id)
  let zohoDevelopmentId: string | undefined;
  if (source === 'property_inquiry' && data.propertyId) {
    const resolved = await resolveProyectoDeInteres(supabase, data.propertyId);
    if (resolved) zohoDevelopmentId = resolved;
  }

  // Generar payload Zoho (necesitamos los identificadores para auditar en Supabase)
  const zohoPayload = sourceToZohoPayload(source, formData, locale, utms, zohoDevelopmentId);

  const { data: row, error: insertErr } = await supabase
    .from('leads')
    .insert({
      name: data.name || null,
      email: data.email || null,
      phone: data.phone || data.whatsapp || null,
      message: data.message || null,
      property_id: data.propertyId || null,
      source,
      intake_status: 'nuevo',
      locale,
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      utm_content: utms.utm_content,
      utm_term: utms.utm_term,
      gclid: utms.gclid,
      nombre_campana: zohoPayload.lead.Nombre_de_Campa_a ?? null,
      nombre_formulario: zohoPayload.lead.Nombre_del_formulario ?? null,
      zoho_sync_error: 'PENDING_SYNC',
    })
    .select('id')
    .single();

  if (insertErr || !row) {
    // REQ-F-04b — INSERT falla → 500 sin intento Zoho (audit-first invariant)
    console.error(
      JSON.stringify({
        event: 'leads.insert.failed',
        source,
        error: sanitizeErrorMessage(insertErr),
      }),
    );
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 });
  }

  // 8. Push a Zoho — fire-and-await dentro del request.
  //    Side effect: updateLeadLocal limpia 'PENDING_SYNC' o lo sobrescribe con error.
  //    Si el handler crashea entre INSERT y este punto, el cron retomará la fila
  //    por created_at < now() - 5min con marker PENDING_SYNC todavía presente.
  try {
    await pushToZoho(supabase, row.id, source, zohoPayload);
  } catch (err) {
    // Solo entra acá si updateLeadLocal lanza algo no atrapado — defensivo.
    console.error(
      JSON.stringify({
        event: 'leads.push-zoho.uncaught',
        lead_id: row.id,
        source,
        error: sanitizeErrorMessage(err),
      }),
    );
  }

  // 9. Return success siempre que Supabase haya persistido (REQ-F-09)
  return NextResponse.json({ success: true, id: row.id }, { status: 200 });
}
