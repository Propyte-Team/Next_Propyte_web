import { describe, expect, it } from 'vitest';
import { faltanDatosDeContacto } from './field-maps';

/**
 * Regresión: el 29-ago-2026 un clic pagado de Google Ads en inglés (campaña
 * `homes_en`, CPC $17.17 MXN) envió `lp_casas_riviera` con name/email/phone en
 * cadena vacía. El `<form>` llevaba `noValidate` —los `required` no frenaban
 * nada—, `enviar()` no comprobaba nada y el esquema Zod del endpoint tiene los
 * tres campos opcionales a propósito. Salió un 200 limpio, `parseName` puso
 * «Anónimo» de Last_Name, y el asesor recibió una ficha sin correo ni teléfono
 * con dos tareas de seguimiento que no podía cumplir.
 *
 * La regla se prueba en el PUNTO POR DONDE PASAN LAS DOS RUTAS: `/api/leads` y
 * el cron `/api/cron/zoho-retry`. El cron importa porque
 * `claim_zoho_retry_batch` reclama toda fila con `zoho_lead_id IS NULL` y
 * `zoho_sync_error IS NOT NULL` — es decir, justo las que el endpoint marca
 * como descartadas. Sin la guardia de este lado, el cron las empujaría a Zoho
 * de todos modos unos minutos después.
 *
 * 31-ago-2026 — la regla SUBE de «contactable» a «los tres datos». Todos los
 * formularios de captación piden ya nombre, correo y teléfono; el guardia deja
 * de aceptar dos de tres. `newsletter` sigue exento (solo capta email).
 */
describe('faltanDatosDeContacto', () => {
  it('rechaza el payload exacto del 29-ago: sin nombre, correo ni teléfono', () => {
    // Lo único que traía el body real, según `leads.form_data`.
    expect(
      faltanDatosDeContacto('lp_casas_riviera', {
        propertyName: 'Casa 2 Recámaras en Preventa | Comunidad Privada',
      }),
    ).toBe('sin email ni teléfono');
  });

  it('rechaza cuando hay nombre pero no hay con qué contactar', () => {
    expect(
      faltanDatosDeContacto('lp_casas_riviera', { name: 'Ana Ruiz' }),
    ).toBe('sin email ni teléfono');
  });

  it('trata los campos de solo espacios como vacíos', () => {
    expect(
      faltanDatosDeContacto('lp_casas_riviera', {
        name: '   ',
        email: '  ',
        phone: '\t',
      }),
    ).toBe('sin email ni teléfono');
  });

  it('rechaza el lead sin nombre aunque traiga correo', () => {
    expect(
      faltanDatosDeContacto('lp_casas_riviera', { email: 'ana@example.com' }),
    ).toBe('sin nombre');
  });

  it('rechaza nombre + correo sin teléfono', () => {
    expect(
      faltanDatosDeContacto('lp_casas_riviera', {
        name: 'Ana Ruiz',
        email: 'ana@example.com',
      }),
    ).toBe('sin teléfono');
  });

  it('rechaza nombre + teléfono sin correo', () => {
    expect(
      faltanDatosDeContacto('lp_casas_riviera', {
        name: 'Ana Ruiz',
        phone: '+529841234567',
      }),
    ).toBe('sin email');
  });

  it('acepta los tres datos', () => {
    expect(
      faltanDatosDeContacto('lp_casas_riviera', {
        name: 'Ana Ruiz',
        email: 'ana@example.com',
        phone: '+529841234567',
      }),
    ).toBeNull();
  });

  it('cuenta `whatsapp` como teléfono (la ruta directa lo manda ahí)', () => {
    expect(
      faltanDatosDeContacto('lp_casas_riviera', {
        name: 'Ana Ruiz',
        email: 'ana@example.com',
        whatsapp: '+529841234567',
      }),
    ).toBeNull();
  });

  it('EXIME a newsletter de nombre y teléfono: su form solo capta email', () => {
    // Si esta prueba se pone en rojo, el formulario de newsletter quedó apagado
    // por la guardia — field-maps le pone «Suscriptor» de Last_Name a propósito.
    expect(
      faltanDatosDeContacto('newsletter', { email: 'ana@example.com' }),
    ).toBeNull();
  });

  it('pero a newsletter sin email tampoco lo deja pasar', () => {
    expect(faltanDatosDeContacto('newsletter', {})).toBe('sin email ni teléfono');
  });

  it('aplica la regla de los tres datos a TODOS los sources de captación', () => {
    // Un source nuevo no debe colarse por olvido: la exención es una lista
    // cerrada de uno, no un `default` permisivo.
    const sinTelefono = { name: 'Ana Ruiz', email: 'ana@example.com' };
    for (const source of [
      'contact',
      'property_inquiry',
      'b2b_request',
      'developer_request',
      'broker_registration',
      'provider_form',
      'built_consultation',
      'affiliate_request',
      'lead_magnet',
      'glossary_pdf',
      'lp_lotes_pdc',
      'lp_casas_riviera',
    ] as const) {
      expect(faltanDatosDeContacto(source, sinTelefono)).toBe('sin teléfono');
    }
  });
});
