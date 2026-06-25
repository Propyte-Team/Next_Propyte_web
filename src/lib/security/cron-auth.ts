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
//
// Dos transportes aceptados (el llamador prueba ambos):
//   1. `Authorization: Bearer <secret>` — verifyCronSecret()
//   2. `x-cron-secret: <secret>`        — verifyCronSecretHeader()
// El header `x-cron-secret` existe porque el CDN de Hostinger (hcdn) stripea
// `Authorization: Bearer` en requests entrantes — un crontab que pega a
// https://propyte.com/... perdería el Bearer y siempre daría 401. Un header
// custom no se stripea. Ver feedback_hostinger_cron_auth_header.

import { timingSafeEqual } from "node:crypto";

/**
 * Núcleo timing-safe: compara el secret crudo provisto contra CRON_SECRET.
 *
 * - Fail-closed si `CRON_SECRET` env no está seteado (logueamos error).
 * - Fail-closed si el secret tiene < 32 chars (configuración débil).
 * - Comparación tiempo-constante con buffers de longitud igualada.
 */
function compareToExpected(provided: string | null | undefined): boolean {
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

/**
 * Verifica el header `Authorization: Bearer <secret>`.
 *
 * @returns true si el header matchea exactamente; false en cualquier otro caso.
 */
export function verifyCronSecret(authHeader: string | null | undefined): boolean {
  const prefix = "Bearer ";
  if (!authHeader || !authHeader.startsWith(prefix)) return false;
  return compareToExpected(authHeader.slice(prefix.length).trim());
}

/**
 * Verifica el header custom `x-cron-secret: <secret>` (sin prefijo Bearer).
 * Usado cuando el CDN stripea Authorization. El valor es el secret crudo.
 *
 * @returns true si el header matchea exactamente; false en cualquier otro caso.
 */
export function verifyCronSecretHeader(headerValue: string | null | undefined): boolean {
  if (!headerValue) return false;
  return compareToExpected(headerValue.trim());
}
