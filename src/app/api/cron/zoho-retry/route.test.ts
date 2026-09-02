import { describe, expect, it } from 'vitest';

/**
 * El cron tenía su PROPIA copia de KNOWN_SOURCES (duplicada de /api/leads) que
 * se desincronizó: le faltaban `lp_casas_riviera` y `guia_terrenos`. Un lead de
 * esos sources cuyo push directo a Zoho fallara nunca se reintentaba —
 * `rebuildPayload` devolvía null en cada corrida, en silencio, y la fila
 * quedaba huérfana en Supabase con su `zoho_sync_error` para siempre.
 *
 * El fix importa la MISMA constante desde /api/leads (single source of
 * truth), así que este test verifica que el cron efectivamente la use — no
 * una copia local que pueda volver a divergir.
 */
describe('cron zoho-retry usa la misma allowlist que /api/leads', () => {
  it('incluye guia_terrenos (motivo original de este fix)', async () => {
    const { KNOWN_SOURCES } = await import('./route');
    expect(KNOWN_SOURCES).toContain('guia_terrenos');
  });

  it('incluye lp_casas_riviera (preexistente, faltaba también)', async () => {
    const { KNOWN_SOURCES } = await import('./route');
    expect(KNOWN_SOURCES).toContain('lp_casas_riviera');
  });

  it('es literalmente la misma referencia que exporta /api/leads (no una copia)', async () => {
    const { KNOWN_SOURCES: fromCron } = await import('./route');
    const { KNOWN_SOURCES: fromLeads } = await import('@/app/api/leads/route');
    expect(fromCron).toBe(fromLeads);
  });
});
