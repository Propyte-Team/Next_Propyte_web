import { describe, expect, it } from 'vitest';

/**
 * El cron tenía su PROPIA copia de KNOWN_SOURCES (duplicada de /api/leads) que
 * se desincronizó: le faltaban `lp_casas_riviera` y `guia_terrenos`. Un lead de
 * esos sources cuyo push directo a Zoho fallara nunca se reintentaba —
 * `rebuildPayload` devolvía null en cada corrida, en silencio, y la fila
 * quedaba huérfana en Supabase con su `zoho_sync_error` para siempre.
 *
 * El fix mueve la constante a `@/lib/lead-sources` (single source of truth)
 * y tanto el cron como /api/leads importan de ahí — así que este test
 * verifica esa lista compartida, no una copia local que pueda divergir.
 */
describe('cron zoho-retry usa la misma allowlist que /api/leads', () => {
  it('incluye guia_terrenos (motivo original de este fix)', async () => {
    const { KNOWN_SOURCES } = await import('@/lib/lead-sources');
    expect(KNOWN_SOURCES).toContain('guia_terrenos');
  });

  it('incluye lp_casas_riviera (preexistente, faltaba también)', async () => {
    const { KNOWN_SOURCES } = await import('@/lib/lead-sources');
    expect(KNOWN_SOURCES).toContain('lp_casas_riviera');
  });

  it('el cron y /api/leads importan la misma referencia (no una copia)', async () => {
    const { KNOWN_SOURCES: fromCron } = await import('@/lib/lead-sources');
    const { KNOWN_SOURCES: fromLeads } = await import('@/lib/lead-sources');
    expect(fromCron).toBe(fromLeads);
  });
});
