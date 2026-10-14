// ============================================================
// Motor compartido de captación: push a Zoho con nota en duplicados y
// UPDATE local con reintento. Lo usan /api/leads y el webhook del sitio de
// Avica. Movido de src/app/api/leads/route.ts sin cambios de conducta.
// ============================================================

import type { createServiceRoleClient } from '@/lib/supabase/server';
import { sanitizeErrorMessage } from '@/lib/security/sanitize-error';
import { getZohoClient } from '@/lib/zoho/client';
import {
  composeDuplicateNote,
  extractDuplicateLeadId,
  truncateError,
  type FormData,
  type LeadSource,
  type Locale,
  type UtmData,
} from '@/lib/zoho/field-maps';
import type { ZohoAccount, ZohoLead } from '@/lib/zoho/types';

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
export async function updateLeadLocal(
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
 * Si Zoho rechaza por DUPLICATE_DATA, anexa una Nota al Lead existente (Opción C).
 * Side effect: actualiza public.leads via updateLeadLocal.
 */
export async function pushToZoho(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  leadId: string,
  source: LeadSource,
  payload: { lead: ZohoLead; account?: ZohoAccount },
  noteContext: { data: FormData; locale: Locale; utms: UtmData },
): Promise<void> {
  const zoho = getZohoClient();

  let zohoLeadId: string | undefined;
  let attachedAsNote = false;

  const leadResult = await zoho.createRecords('Leads', [payload.lead]).catch((err) => err);

  if (leadResult instanceof Error) {
    await updateLeadLocal(supabase, leadId, {
      zoho_sync_error: truncateError(sanitizeErrorMessage(leadResult)),
    });
    return;
  }

  const detail = leadResult.data?.[0];
  if (detail && detail.status === 'success' && detail.details?.id) {
    zohoLeadId = detail.details.id;
  } else {
    // DUPLICATE_DATA → Opción C: anexar Nota al Lead existente
    const duplicateId = extractDuplicateLeadId(detail);
    if (duplicateId) {
      const note = composeDuplicateNote(source, noteContext.data, noteContext.locale, noteContext.utms);
      try {
        const noteResult = await zoho.createNote(duplicateId, 'Leads', note.title, note.content);
        if (noteResult) {
          zohoLeadId = duplicateId;
          attachedAsNote = true;
        } else {
          await updateLeadLocal(supabase, leadId, {
            zoho_sync_error: truncateError(`DUPLICATE_NOTE_FAILED: existing_lead_id=${duplicateId}`),
          });
          return;
        }
      } catch (err) {
        await updateLeadLocal(supabase, leadId, {
          zoho_sync_error: truncateError(
            `DUPLICATE_NOTE_FAILED: existing_lead_id=${duplicateId} — ${sanitizeErrorMessage(err)}`,
          ),
        });
        return;
      }
    } else {
      await updateLeadLocal(supabase, leadId, {
        zoho_sync_error: truncateError(
          sanitizeErrorMessage(
            new Error(`Zoho Lead create returned non-success: ${JSON.stringify(detail)}`),
          ),
        ),
      });
      return;
    }
  }

  // Forms con Account asociado (F6 Proveedor, F3/F4 Desarrolladora) — doble llamada Lead + Account (REQ-F-06)
  // Si el Lead se anexó como Nota a un duplicado, NO creamos Account nuevo
  // (el Account existente del duplicado se usa).
  let zohoAccountId: string | undefined;
  let accountError: string | undefined;
  if (payload.account && !attachedAsNote) {
    try {
      const acctResult = await zoho.createRecords('Accounts', [payload.account]);
      const acctDetail = acctResult.data?.[0];
      if (acctDetail && acctDetail.status === 'success' && acctDetail.details?.id) {
        zohoAccountId = acctDetail.details.id;
      } else {
        accountError = `ACCOUNT: non-success ${JSON.stringify(acctDetail)}`;
      }
    } catch (err) {
      accountError = `ACCOUNT: ${sanitizeErrorMessage(err)}`;
    }
  }

  await updateLeadLocal(supabase, leadId, {
    zoho_lead_id: zohoLeadId,
    zoho_account_id: zohoAccountId ?? null,
    zoho_synced_at: new Date().toISOString(),
    zoho_sync_error: attachedAsNote
      ? truncateError(`DUPLICATE_NOTE: anexado como Nota al Lead existente ${zohoLeadId}`)
      : accountError
      ? truncateError(accountError)
      : null,
  });
}
