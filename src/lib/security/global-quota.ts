// ============================================================
// Quota global volumétrica — defense in depth vs DoS distribuido
// Spec: web-forms-zoho-integration.md (v1.5) §5.3 REQ-S-07
// ============================================================
//
// Rate limit per-IP (5/min) no escala contra una botnet con N IPs únicas.
// La quota global limita el TOTAL de leads procesados por proceso PM2 a
// 1000/hora — defense-in-depth. Volumen real esperado ~660/día → margen 36x.
//
// Per-process (no compartido entre workers PM2). Si PM2 corre cluster con
// N workers, la quota efectiva es 1000 × N. Aceptable; el dimensionamiento
// fino lo da getCallsToday() del cliente Zoho (cron monitor §8).

import { NextResponse, type NextRequest } from "next/server";
import { rateLimit, type RateLimitOptions } from "@/lib/rateLimit";

const GLOBAL_QUOTA: RateLimitOptions = {
  bucket: "leads-global",
  limit: 1000,
  windowMs: 60 * 60 * 1000, // 1 hora
};

/**
 * Ejecuta antes del rate limit por IP en /api/leads.
 *
 * - Si la quota global está saturada → 503 con Retry-After.
 * - 503 (no 429) porque el cliente individual NO excedió SU quota —
 *   el servidor está protegiéndose globalmente.
 *
 * @returns NextResponse a retornar (503) si excede; null si está OK.
 */
export function enforceGlobalQuota(): NextResponse | null {
  // El rate limiter agrupa por (bucket + client key). Forzamos un client key
  // único 'global' para que TODOS los requests caigan en el mismo bucket.
  const fake = new Request("http://internal/quota", {
    headers: { "x-real-ip": "global" },
  }) as unknown as NextRequest;

  const result = rateLimit(fake, GLOBAL_QUOTA);
  if (result.ok) return null;

  return NextResponse.json(
    { error: "Service temporarily at capacity. Please retry shortly." },
    {
      status: 503,
      headers: { "Retry-After": String(result.retryAfterSec) },
    },
  );
}
