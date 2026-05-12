// ============================================================
// PII Redaction para zoho_sync_error y logs
// Spec: web-forms-zoho-integration.md (v1.5) §5.3 REQ-S-02
// ============================================================
//
// Zoho a veces hace eco del payload en mensajes de error 4xx. Esos mensajes
// terminan en `public.leads.zoho_sync_error` y en stdout de PM2 → grepables.
// Si NO sanitizamos, la columna y los logs guardan email/teléfono/RFC/CURP
// del lead — violación LFPDPPP/GDPR.
//
// Regla operativa: TODO .update({ zoho_sync_error: X }) y TODO console.error(X)
// en code-path leads/cron pasa por sanitizeErrorMessage(X).

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /(\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;
const RFC_RE   = /\b[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}\b/gi;        // RFC (MX)
const CURP_RE  = /\b[A-Z]\d{2}[A-Z]{2}\d{2}[HM][A-Z]{5}[A-Z0-9]\d\b/g; // CURP (MX)
const NAME_KV  = /"(?:first_?name|last_?name|full_?name|nombre)"\s*:\s*"[^"]*"/gi;

/**
 * Convierte cualquier error en un string seguro para persistir.
 * Redacta email / teléfono / RFC / CURP / claves JSON con nombres.
 * Cap a 2000 chars (la columna text de Postgres no tiene límite duro,
 * pero no queremos stack traces gigantes).
 *
 * Nota: el cap final a 1KB para `zoho_sync_error` lo aplica
 * `truncateError` (en field-maps.ts). Esta función trunca a 2KB como
 * defensa adicional contra payloads patológicos.
 */
export function sanitizeErrorMessage(
  err: unknown,
  fallback = "Unknown error",
): string {
  let raw: string;
  if (err instanceof Error) {
    raw = `${err.name}: ${err.message}`;
  } else if (typeof err === "string") {
    raw = err;
  } else {
    try {
      raw = JSON.stringify(err);
    } catch {
      raw = fallback;
    }
  }

  return raw
    .replace(EMAIL_RE, "[email]")
    .replace(PHONE_RE, "[phone]")
    .replace(RFC_RE,   "[rfc]")
    .replace(CURP_RE,  "[curp]")
    .replace(NAME_KV,  (m) => m.replace(/:\s*"[^"]*"/, ': "[name]"'))
    .slice(0, 2000);
}
