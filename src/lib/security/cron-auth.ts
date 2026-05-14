// ============================================================
// Cron secret verification (timing-safe)
// Spec: web-forms-zoho-integration.md (v1.5) §5.3 REQ-S-04
// ============================================================
//
// Por qué timing-safe: comparación con === filtra el prefijo coincidente
// (el primer caracter distinto sale más rápido). Con muchos intentos un
// atacante puede recuperar el secret byte por byte. crypto.timingSafeEqual
// compara en tiempo constante.
//
// Regla: en /api/cron/zoho-retry NUNCA usar `=== process.env.CRON_SECRET`.
// Grep CI: 0 ocurrencias permitidas.

import { timingSafeEqual } from "node:crypto";

/**
 * Verifica el header `Authorization: Bearer <secret>`.
 *
 * - Fail-closed si `CRON_SECRET` env no está seteado (logueamos error).
 * - Fail-closed si el secret tiene < 32 chars (configuración débil).
 * - Comparación tiempo-constante con buffers de longitud igualada.
 *
 * @returns true si el header matchea exactamente; false en cualquier otro caso.
 */
export function verifyCronSecret(authHeader: string | null | undefined): boolean {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    console.error(
      JSON.stringify({
        event: "cron-auth.misconfigured",
        reason: "CRON_SECRET env var not set",
      }),
    );
    return false;
  }

  if (expected.length < 32) {
    console.error(
      JSON.stringify({
        event: "cron-auth.weak-secret",
        reason: `CRON_SECRET length=${expected.length} (min 32 chars)`,
      }),
    );
    return false;
  }

  const prefix = "Bearer ";
  if (!authHeader || !authHeader.startsWith(prefix)) return false;

  const provided = authHeader.slice(prefix.length).trim();
  if (!provided) return false;

  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");

  // timingSafeEqual requires equal-length buffers. Pad to max length so the
  // comparison runs in constant time regardless of input length, then enforce
  // length equality separately. This avoids leaking the secret length.
  const len = Math.max(a.length, b.length);
  const aPad = Buffer.alloc(len, 0);
  a.copy(aPad);
  const bPad = Buffer.alloc(len, 0);
  b.copy(bPad);

  return a.length === b.length && timingSafeEqual(aPad, bPad);
}
