// ============================================================
// submitForm — shim hacia el nuevo submitLead (Z3.3)
// Spec: web-forms-zoho-integration.md (v1.5) REQ-F-12
// ============================================================
//
// La firma vieja era submitForm(data, formType) → POST a webhook genérico.
// Mantenemos la firma para no tocar los 8 componentes que ya la llaman,
// pero internamente redirige al nuevo /api/leads vía submitLead(source, data).
//
// Este shim vive 1+ semana en producción hasta cumplir umbral §7 (≥100 leads,
// ≥98% success en leads ≥24h, ≥1 por form). Tras eso → eliminar y migrar los
// 8 componentes a llamar submitLead() directamente.

import { submitLead } from "@/lib/leads/submit-lead";
import type { LeadSource } from "@/lib/zoho/field-maps";

/**
 * @deprecated Use `submitLead(source, data)` directly. This shim exists for
 * backwards-compatibility with the 8 components migrated from the legacy
 * webhook flow. Will be removed once cleanup threshold §7 is met.
 */
export async function submitForm(
  data: Record<string, unknown>,
  formType: string,
): Promise<{ success: boolean; error?: string }> {
  // formType en la lib vieja era el mismo set de valores que `source` ahora.
  // Mapeo 1:1 — el cast es seguro porque los 11 valores históricos están en LeadSource.
  const result = await submitLead(formType as LeadSource, data);
  return result.ok
    ? { success: true }
    : { success: false, error: result.error };
}
