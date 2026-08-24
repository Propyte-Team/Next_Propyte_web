import { describe, expect, it } from 'vitest';
import { sourceToZohoPayload, type FormData, type LeadSource, type UtmData } from './field-maps';

/**
 * Regresión: el push directo a Zoho moría con INVALID_DATA porque
 * `Nombre_anuncio = data.page` mandaba la URL completa (hasta 2000 chars según
 * Zod) a un campo `text(255)`. Zoho NO trunca: rechaza el record entero, así
 * que el lead no llegaba y el cron lo rescataba hasta 58 minutos después.
 *
 * Medido en producción el 2026-08-24 sobre el módulo Leads:
 *   Nombre_anuncio de 240 chars → SUCCESS
 *   Nombre_anuncio de 330 chars → INVALID_DATA · maximum_length: 255
 *
 * Los 13 leads de `affiliate_request` que venían de la campaña de Meta
 * `120250812748380646` fallaron los 13. Los 11 sin UTMs pasaron: sus URLs
 * medían entre 32 y 239 chars.
 */

/**
 * Topes leídos de la metadata de Zoho (GET /settings/fields?module=...).
 *
 * Se declaran AQUÍ a propósito, en vez de importar ZOHO_LEAD_LIMITS: el test
 * comprueba el contrato REAL de Zoho, no la copia que tiene el código. Si
 * alguien sube un número en field-maps.ts para "arreglar" un fallo, este test
 * tiene que seguir fallando.
 */
const TOPES_ZOHO_REALES: Record<string, number> = {
  // Leads
  First_Name: 40,
  Last_Name: 80,
  Email: 100,
  Phone: 30,
  Mobile: 30,
  City: 100,
  Company: 200,
  Country: 100,
  Inmobiliaria: 120,
  Presupuesto: 255,
  Nombre_anuncio: 255,
  Nombre_del_formulario: 255,
  GCLID: 150,
  Ad_Campaign_Name: 250,
  AdGroup_Name: 250,
  QR_de_origen: 50,
  Description: 32_000,
  Mensaje: 32_000,
  // Accounts
  Account_Name: 200,
  Website: 255,
  Billing_City: 100,
  Billing_Country: 100,
};

/** URL real de tráfico de Meta hacia /unete: 359 chars. Es la que tumbaba el push. */
const URL_ANUNCIO_META =
  'https://propyte.com/es/unete?utm_source=fb&utm_medium=paid' +
  '&utm_campaign=120250812748380646&utm_content=120250853342800646' +
  '&utm_term=120250853337680646&fbclid=' +
  'IwY2xjawMdQm5leHRuA2FlbQEwAGFkaWQBqzfHQUMD5nNydGMGYXBwX2lkDzI3NTI1NDY5MjU5ODI3OQ' +
  'ABHvNZEYJBu4ldInX_9brQDLkJqbDmhuKlpqcaglqY20j1VL4dnL_UMfgdGJ7n0Xq2mBvRcAem_' +
  'PmkEJxMZFWmZ6yENfEObrQzZ#aplicar';

const TODOS_LOS_SOURCES: LeadSource[] = [
  'contact',
  'property_inquiry',
  'b2b_request',
  'developer_request',
  'broker_registration',
  'provider_form',
  'built_consultation',
  'affiliate_request',
  'newsletter',
  'lead_magnet',
  'glossary_pdf',
  'lp_lotes_pdc',
];

/** Cada campo en su máximo permitido por Zod en /api/leads. */
const FORM_DATA_AL_TOPE: FormData = {
  name: 'Maximiliano '.repeat(16).slice(0, 200).trim(),
  email: `${'a'.repeat(240)}@example.com`,
  phone: '+52 '.repeat(10).slice(0, 40).trim(),
  whatsapp: '+52 '.repeat(10).slice(0, 40).trim(),
  message: 'm'.repeat(5000),
  subject: 's'.repeat(200),
  propertyName: 'p'.repeat(200),
  investmentType: 'i'.repeat(100),
  company: 'c'.repeat(200),
  location: 'l'.repeat(200),
  city: 'ciudad '.repeat(30).slice(0, 200).trim(),
  projectType: 'pt'.repeat(50),
  unitCount: 'u'.repeat(50),
  brokerType: 'bt'.repeat(50),
  experience: 'e'.repeat(100),
  focusArea: 'f'.repeat(200),
  category: 'cat'.repeat(33),
  companyWebsite: `https://example.com/${'w'.repeat(470)}`,
  budget: 'b'.repeat(200),
  interest: 'int'.repeat(666),
  page: URL_ANUNCIO_META,
};

const UTMS_AL_TOPE: UtmData = {
  utm_source: 'u'.repeat(200),
  utm_medium: 'm'.repeat(200),
  utm_campaign: 'c'.repeat(200),
  utm_content: 'co'.repeat(100),
  utm_term: 't'.repeat(200),
  gclid: 'g'.repeat(200),
  fbclid: 'f'.repeat(200),
  wbraid: 'w'.repeat(200),
  qr: 'q'.repeat(200),
};

function violaciones(payload: Record<string, unknown>): string[] {
  return Object.entries(payload)
    .filter(([campo, valor]) => {
      const tope = TOPES_ZOHO_REALES[campo];
      return tope !== undefined && typeof valor === 'string' && valor.length > tope;
    })
    .map(([campo, valor]) => `${campo}: ${(valor as string).length} > ${TOPES_ZOHO_REALES[campo]}`);
}

describe('sourceToZohoPayload — ningún campo excede el tope de Zoho', () => {
  it('la URL de un anuncio de Meta cabe en Nombre_anuncio (el bug)', () => {
    expect(URL_ANUNCIO_META.length).toBeGreaterThan(255); // el fixture es realista
    const { lead } = sourceToZohoPayload(
      'affiliate_request',
      { name: 'Ana Ruiz', email: 'ana@example.com', page: URL_ANUNCIO_META },
      'es',
      {},
    );
    expect(lead.Nombre_anuncio!.length).toBeLessThanOrEqual(255);
  });

  it('Nombre_anuncio conserva la página, no un recorte a media URL', () => {
    const { lead } = sourceToZohoPayload(
      'affiliate_request',
      { name: 'Ana Ruiz', page: URL_ANUNCIO_META },
      'es',
      {},
    );
    // Sigue identificando QUÉ página, que es para lo que existe el campo.
    expect(lead.Nombre_anuncio).toBe('https://propyte.com/es/unete');
  });

  it('no toca las URLs que ya cabían (no rompemos lo que funcionaba)', () => {
    const corta = 'https://propyte.com/es/unete';
    const { lead } = sourceToZohoPayload('affiliate_request', { name: 'Ana', page: corta }, 'es', {});
    expect(lead.Nombre_anuncio).toBe(corta);
  });

  it.each(TODOS_LOS_SOURCES)('ningún campo del Lead se pasa del tope — %s', (source) => {
    const { lead } = sourceToZohoPayload(source, FORM_DATA_AL_TOPE, 'es', UTMS_AL_TOPE);
    expect(violaciones(lead as Record<string, unknown>)).toEqual([]);
  });

  it.each(TODOS_LOS_SOURCES)('ningún campo del Account se pasa del tope — %s', (source) => {
    const { account } = sourceToZohoPayload(source, FORM_DATA_AL_TOPE, 'es', UTMS_AL_TOPE);
    if (!account) return;
    expect(violaciones(account as unknown as Record<string, unknown>)).toEqual([]);
  });

  it('omite el email que no cabe en vez de mandar uno falso', () => {
    const { lead } = sourceToZohoPayload(
      'contact',
      { name: 'Ana Ruiz', email: `${'a'.repeat(240)}@example.com` },
      'es',
      {},
    );
    // Un email recortado le escribiría a un desconocido.
    expect(lead.Email).toBeUndefined();
  });

  it('omite el teléfono que no cabe en vez de mandar uno truncado', () => {
    const { lead } = sourceToZohoPayload(
      'affiliate_request',
      { name: 'Ana Ruiz', whatsapp: '+521234567890123456789012345678901234567' },
      'es',
      {},
    );
    expect(lead.Mobile).toBeUndefined();
  });

  it('conserva email y teléfono normales', () => {
    const { lead } = sourceToZohoPayload(
      'affiliate_request',
      { name: 'Ana Ruiz', email: 'ana@example.com', whatsapp: '+529841234567' },
      'es',
      {},
    );
    expect(lead.Email).toBe('ana@example.com');
    expect(lead.Mobile).toBe('+529841234567');
  });
});
