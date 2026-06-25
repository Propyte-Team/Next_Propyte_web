import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';
import { verifyCronSecret, verifyCronSecretHeader } from '@/lib/security/cron-auth';
import { sanitizeErrorMessage } from '@/lib/security/sanitize-error';
import { getZohoClient } from '@/lib/zoho/client';
import {
  composeDuplicateNote,
  extractDuplicateLeadId,
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
// /api/cron/zoho-retry — reintento de leads con sync fallida
// Spec: specs/web-forms-zoho-integration.md (v1.5) REQ-F-10, REQ-F-20
// Disparado por crontab Linux Hostinger cada hora (apéndice C):
//   5 * * * * curl -K /home/propyte/.zoho-retry.curlrc https://propyte.com/api/cron/zoho-retry
// ============================================================

const CRON_RATE_LIMIT = { bucket: 'cron-zoho-retry', limit: 10, windowMs: 60_000 };

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

const ORPHAN_ID_RE = /ORPHAN: zoho_id=([A-Za-z0-9]+)/;

const LOCAL_UPDATE_DELAYS_MS = [200, 600, 1500] as const;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Lead row shape — subset que el cron necesita
interface RetryLeadRow {
  id: string;
  source: string | null;
  locale: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  property_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  zoho_lead_id: string | null;
  zoho_account_id: string | null;
  zoho_sync_error: string | null;
  zoho_retry_count: number | null;
}

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
    }
  }
  return false;
}

/**
 * Reconstruye un payload Zoho desde la fila persistida en public.leads.
 * Las columnas top-level tienen lo mínimo (name/email/phone/message/property_id);
 * el resto de campos por-form (subject/company/category/etc.) NO se persistió
 * en la primera versión — el cron retry trabaja con lo que hay. Si en el
 * futuro queremos retry "perfecto", agregamos una columna `form_data jsonb`
 * con el body crudo. Por ahora, mejor 80% de leads recuperados que 0%.
 */
async function rebuildPayload(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  row: RetryLeadRow,
): Promise<{
  source: LeadSource;
  payload: { lead: ZohoLead; account?: ZohoAccount };
  locale: Locale;
  email: string | null;
  formData: FormData;
  utms: UtmData;
} | null> {
  const source = row.source;
  if (!source || !KNOWN_SOURCES.includes(source as LeadSource)) return null;

  const locale = (row.locale === 'en' ? 'en' : 'es') as Locale;

  const formData: FormData = {
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    propertyId: row.property_id,
  };

  const utms: UtmData = {
    utm_source: row.utm_source,
    utm_medium: row.utm_medium,
    utm_campaign: row.utm_campaign,
    utm_content: row.utm_content,
    utm_term: row.utm_term,
    gclid: row.gclid,
  };

  let zohoDevelopmentId: string | undefined;
  if (source === 'property_inquiry' && row.property_id) {
    const resolved = await resolveProyectoDeInteres(supabase, row.property_id);
    if (resolved) zohoDevelopmentId = resolved;
  }

  const payload = sourceToZohoPayload(
    source as LeadSource,
    formData,
    locale,
    utms,
    zohoDevelopmentId,
  );

  return { source: source as LeadSource, payload, locale, email: row.email, formData, utms };
}

async function retryOne(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  row: RetryLeadRow,
): Promise<'success' | 'failed' | 'skipped'> {
  const zoho = getZohoClient();

  // Rama ORPHAN: ya tenemos zoho_id en el mensaje, solo UPDATE local
  if (row.zoho_sync_error) {
    const m = row.zoho_sync_error.match(ORPHAN_ID_RE);
    if (m && m[1]) {
      const ok = await updateLeadLocal(supabase, row.id, {
        zoho_lead_id: m[1],
        zoho_synced_at: new Date().toISOString(),
        zoho_sync_error: null,
      });
      return ok ? 'success' : 'failed';
    }
  }

  const rebuilt = await rebuildPayload(supabase, row);
  if (!rebuilt) {
    await updateLeadLocal(supabase, row.id, {
      zoho_sync_error: truncateError('Cannot rebuild payload — unknown source'),
    });
    return 'skipped';
  }

  const { source, payload, email, formData, utms, locale } = rebuilt;

  // Rama PENDING_SYNC: search por email primero para evitar duplicar (REQ-F-10)
  const isPending = row.zoho_sync_error === 'PENDING_SYNC';
  if (isPending && email) {
    try {
      const existing = await zoho.findLeadByEmail(email);
      if (existing?.id) {
        const ok = await updateLeadLocal(supabase, row.id, {
          zoho_lead_id: existing.id,
          zoho_synced_at: new Date().toISOString(),
          zoho_sync_error: null,
        });
        return ok ? 'success' : 'failed';
      }
    } catch (err) {
      // Search Zoho falló — caemos a POST normal abajo (el path "otros")
      console.error(
        JSON.stringify({
          event: 'cron.find-by-email.failed',
          lead_id: row.id,
          error: sanitizeErrorMessage(err),
        }),
      );
    }
  }

  // Rama otros: POST normal a /Leads (y /Accounts si form 6)
  // Si Zoho rechaza por DUPLICATE_DATA → anexar Nota al Lead existente (Opción C).
  let zohoLeadId: string | undefined;
  let attachedAsNote = false;
  try {
    const leadResult = await zoho.createRecords('Leads', [payload.lead]);
    const detail = leadResult.data?.[0];
    if (detail && detail.status === 'success' && detail.details?.id) {
      zohoLeadId = detail.details.id;
    } else {
      const duplicateId = extractDuplicateLeadId(detail);
      if (duplicateId) {
        const note = composeDuplicateNote(source, formData, locale, utms);
        const noteResult = await zoho.createNote(duplicateId, 'Leads', note.title, note.content);
        if (noteResult) {
          zohoLeadId = duplicateId;
          attachedAsNote = true;
        } else {
          await updateLeadLocal(supabase, row.id, {
            zoho_sync_error: truncateError(`DUPLICATE_NOTE_FAILED: existing_lead_id=${duplicateId}`),
          });
          return 'failed';
        }
      } else {
        throw new Error(`Zoho Lead create non-success: ${JSON.stringify(detail)}`);
      }
    }
  } catch (err) {
    await updateLeadLocal(supabase, row.id, {
      zoho_sync_error: truncateError(sanitizeErrorMessage(err)),
    });
    return 'failed';
  }

  let zohoAccountId: string | undefined;
  let accountError: string | undefined;
  if (payload.account && !attachedAsNote) {
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

  await updateLeadLocal(supabase, row.id, {
    zoho_lead_id: zohoLeadId,
    zoho_account_id: zohoAccountId ?? null,
    zoho_synced_at: new Date().toISOString(),
    zoho_sync_error: attachedAsNote
      ? truncateError(`DUPLICATE_NOTE: anexado como Nota al Lead existente ${zohoLeadId}`)
      : accountError
      ? truncateError(accountError)
      : null,
  });
  return 'success';
}

// ============================================================
// Handler — GET /api/cron/zoho-retry
// ============================================================
export async function GET(request: NextRequest) {
  // 1. Rate limit propio (defense in depth si CRON_SECRET se filtra)
  const limit = rateLimit(request, CRON_RATE_LIMIT);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfterSec) },
      },
    );
  }

  // 2. Verify cron secret (timing-safe). Acepta Authorization: Bearer <secret>
  //    o x-cron-secret: <secret> — el segundo sobrevive al strip de Bearer del
  //    CDN de Hostinger (ver feedback_hostinger_cron_auth_header).
  const authOk =
    verifyCronSecret(request.headers.get('authorization')) ||
    verifyCronSecretHeader(request.headers.get('x-cron-secret'));
  if (!authOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3. Claim batch atómico (FOR UPDATE SKIP LOCKED vía RPC)
  const supabase = await createServiceRoleClient();
  const { data: rows, error: claimErr } = await supabase.rpc(
    'claim_zoho_retry_batch',
    { p_limit: 50 },
  );

  if (claimErr) {
    console.error(
      JSON.stringify({
        event: 'cron.claim.failed',
        error: sanitizeErrorMessage(claimErr),
      }),
    );
    return NextResponse.json({ error: 'Claim failed' }, { status: 500 });
  }

  const batch = (rows ?? []) as RetryLeadRow[];

  // 4. Procesar uno por uno (los retries serializados — bajo volumen, no vale paralelizar)
  let success = 0;
  let failed = 0;
  let skipped = 0;
  for (const row of batch) {
    const result = await retryOne(supabase, row);
    if (result === 'success') success++;
    else if (result === 'skipped') skipped++;
    else failed++;
  }

  console.log(
    JSON.stringify({
      event: 'cron.zoho-retry.completed',
      claimed: batch.length,
      success,
      failed,
      skipped,
    }),
  );

  return NextResponse.json(
    { claimed: batch.length, success, failed, skipped },
    { status: 200 },
  );
}
