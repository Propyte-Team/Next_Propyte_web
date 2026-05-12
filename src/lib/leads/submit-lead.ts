// ============================================================
// submitLead — helper client-side único para los 11 forms
// Spec: web-forms-zoho-integration.md (v1.5) REQ-F-12
// ============================================================
//
// Reemplaza:
//   - submitForm(data, formType) → /api/leads → webhook (legacy)
//   - fetch('/api/leads', {...})  inline en Form 6/11 (legacy)
//
// Firma única en el codebase: submitLead(source, data).
// El endpoint server-side (/api/leads) recibe el body y se encarga de:
//   - rate limit + honeypot + Zod validation
//   - INSERT en public.leads (audit-first)
//   - mapping a Zoho via field-maps.ts
//   - POST a Zoho /Leads (+ /Accounts si form 6)
//   - retry curva [200, 600, 1500] ms del UPDATE local

import { getCapturedUTMs } from "@/hooks/useUTMCapture";
import { trackGenerateLead } from "@/lib/analytics/track";
import type { LeadSource } from "@/lib/zoho/field-maps";

export interface SubmitLeadResult {
  ok: boolean;
  /** UUID de public.leads cuando el INSERT fue exitoso. */
  id?: string;
  /** Mensaje de error genérico para mostrar al usuario; el detalle vive server-side. */
  error?: string;
}

/**
 * submitLead(source, data)
 *
 * Envía un lead al endpoint /api/leads. NO maneja success/error UI — eso es
 * responsabilidad del componente form (toasts, redirect, etc.).
 *
 * @param source  Uno de los 11 valores LeadSource (ej. 'contact', 'broker_registration').
 * @param data    Campos del form. Honeypot `website` lo pasa cualquier form que lo tenga.
 *                UTMs se agregan automáticamente desde getCapturedUTMs().
 */
export async function submitLead(
  source: LeadSource,
  data: Record<string, unknown>,
): Promise<SubmitLeadResult> {
  const utms = getCapturedUTMs();

  const payload = {
    ...utms,
    ...data,
    source,
    page: typeof window !== "undefined" ? window.location.href : undefined,
  };

  let response: Response;
  try {
    response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, error: "Network error" };
  }

  // 429 / 503 / 4xx / 5xx — el endpoint ya devolvió mensaje genérico (REQ-S-09)
  if (!response.ok) {
    return { ok: false, error: response.statusText };
  }

  let json: { success?: boolean; id?: string };
  try {
    json = await response.json();
  } catch {
    return { ok: false, error: "Invalid response" };
  }

  if (json.success) {
    const propertyId = typeof data.propertyId === "string" ? data.propertyId : undefined;
    trackGenerateLead({ formType: source, propertyId });
    return { ok: true, id: json.id };
  }
  return { ok: false };
}
