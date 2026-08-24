import { describe, expect, it } from 'vitest';
import { sourceToZohoPayload } from './field-maps';

/**
 * Regresión: el teléfono del Form 8 (/unete, reclutamiento de asesores) se
 * perdía cuando el lead se sincronizaba por el cron /api/cron/zoho-retry.
 *
 * El cron reconstruye el FormData desde `public.leads`, donde el whatsapp
 * capturado por el form vive en la columna `phone` — nunca en `whatsapp`.
 * Antes del fallback, ese payload llegaba a Zoho sin Mobile y sin Phone.
 */
describe('sourceToZohoPayload — Mobile en affiliate_request', () => {
  const base = { name: 'Ana Ruiz', email: 'ana@example.com' };

  it('mapea whatsapp → Mobile (ruta directa, /api/leads)', () => {
    const { lead } = sourceToZohoPayload(
      'affiliate_request',
      { ...base, whatsapp: '+529841234567' },
      'es',
      {},
    );
    expect(lead.Mobile).toBe('+529841234567');
  });

  it('cae a phone → Mobile cuando whatsapp viene vacío (ruta del cron)', () => {
    const { lead } = sourceToZohoPayload(
      'affiliate_request',
      { ...base, phone: '+529841234567' },
      'es',
      {},
    );
    expect(lead.Mobile).toBe('+529841234567');
  });

  it('no deja el lead sin ningún teléfono en la ruta del cron', () => {
    const { lead } = sourceToZohoPayload(
      'affiliate_request',
      { ...base, phone: '+529841234567' },
      'es',
      {},
    );
    expect(lead.Mobile ?? lead.Phone).toBeTruthy();
  });

  it('prefiere whatsapp sobre phone cuando llegan los dos', () => {
    const { lead } = sourceToZohoPayload(
      'affiliate_request',
      { ...base, whatsapp: '+521111111111', phone: '+522222222222' },
      'es',
      {},
    );
    expect(lead.Mobile).toBe('+521111111111');
  });

  it('otros sources siguen usando Phone, no Mobile', () => {
    const { lead } = sourceToZohoPayload(
      'contact',
      { ...base, phone: '+529841234567' },
      'es',
      {},
    );
    expect(lead.Phone).toBe('+529841234567');
    expect(lead.Mobile).toBeUndefined();
  });
});
