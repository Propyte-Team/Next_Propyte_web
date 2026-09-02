import { describe, expect, it } from 'vitest';
import { sourceToZohoPayload } from './field-maps';

/**
 * `guia_terrenos` — source del formulario de captura al final de la guía
 * comparativa de terrenos residenciales (/guias/terrenos-residenciales).
 *
 * Un source que no está en `KNOWN_SOURCES` (src/app/api/leads/route.ts) NO
 * produce ningún error: el endpoint lo persiste en `public.leads` con
 * `zoho_sync_error: 'SKIPPED: unknown source'` y responde 200. El lead entra
 * a la base y nunca llega a Zoho — en silencio. Por eso este test cubre las
 * DOS mitades del contrato: el payload de Zoho (campaignSlug/formDescription
 * vía sourceToZohoPayload) y la allowlist del endpoint (KNOWN_SOURCES).
 */
describe('guia_terrenos', () => {
  it('produce un lead de Zoho con campaña propia', () => {
    const { lead } = sourceToZohoPayload(
      'guia_terrenos',
      { name: 'Ana Ruiz', email: 'ana@example.com', phone: '+529841234567' },
      'es',
      {},
    );
    expect(lead.Nombre_de_Campa_a).toContain('guias/terrenos-residenciales');
    expect(lead.Nombre_de_Campa_a).toContain('[LEADS]');
    expect(lead.Nombre_del_formulario).toContain('Guía de terrenos');
    expect(lead.Lead_Source).toBe('Sitio web');
  });

  it('usa Tipo_de_Contacto "Lead" (cae en el default, no en una regla especial)', () => {
    const { lead } = sourceToZohoPayload(
      'guia_terrenos',
      { name: 'Ana Ruiz', email: 'ana@example.com', phone: '+529841234567' },
      'es',
      {},
    );
    expect(lead.Tipo_de_Contacto).toBe('Lead');
  });

  it('no agrega subtag entre paréntesis (cae en el default de campaignSubtag)', () => {
    const { lead } = sourceToZohoPayload(
      'guia_terrenos',
      { name: 'Ana Ruiz', email: 'ana@example.com', phone: '+529841234567' },
      'es',
      {},
    );
    // Nombre_de_Campa_a = "Propyte web - <slug> - [LEADS]", sin "(...)" al final.
    expect(lead.Nombre_de_Campa_a).not.toMatch(/\(/);
  });

  it('no genera Description: el form solo pide identidad, sin contexto estructurado', () => {
    const { lead } = sourceToZohoPayload(
      'guia_terrenos',
      { name: 'Ana Ruiz', email: 'ana@example.com', phone: '+529841234567' },
      'es',
      {},
    );
    expect(lead.Description).toBeUndefined();
  });

  it('no crea Account (no está en la lista de sources con Account asociado)', () => {
    const { account } = sourceToZohoPayload(
      'guia_terrenos',
      { name: 'Ana Ruiz', email: 'ana@example.com', phone: '+529841234567' },
      'es',
      {},
    );
    expect(account).toBeUndefined();
  });

  it('respeta el idioma en Nombre_del_formulario (EN)', () => {
    const { lead } = sourceToZohoPayload(
      'guia_terrenos',
      { name: 'Ana Ruiz', email: 'ana@example.com', phone: '+529841234567' },
      'en',
      {},
    );
    expect(lead.Nombre_del_formulario).toContain('EN');
    expect(lead.Nombre_del_formulario).toContain('Guía de terrenos');
  });
});

/**
 * Cubre el fallo silencioso real, no solo el tipo: `sourceToZohoPayload` puede
 * estar perfectamente implementado y el lead SIGUE sin llegar a Zoho si
 * `guia_terrenos` no está en `KNOWN_SOURCES` del endpoint — son dos listas
 * independientes y TypeScript no las cruza.
 */
describe('guia_terrenos está en la allowlist del endpoint', () => {
  it('aparece en KNOWN_SOURCES (src/app/api/leads/route.ts)', async () => {
    const { KNOWN_SOURCES } = await import('@/app/api/leads/route');
    expect(KNOWN_SOURCES).toContain('guia_terrenos');
  });
});
