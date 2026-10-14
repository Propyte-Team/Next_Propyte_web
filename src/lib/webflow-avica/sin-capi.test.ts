import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Luis, 2026-10-14: los leads de Avica NO cuentan como conversiones de
 * Propyte. Del lado de Zoho, la regla «Enviar Lead a Meta CAPI» ya excluye
 * «Sitio Avica»; este lado no debe mandarlos por su cuenta.
 */
const ARCHIVOS = [
  'src/app/api/webhooks/webflow-avica/route.ts',
  'src/lib/webflow-avica/manejador.ts',
  'src/lib/webflow-avica/procesar.ts',
  'src/lib/webflow-avica/envio.ts',
  'src/lib/leads/registrar-lead.ts',
];

describe('el camino del sitio de Avica no usa la Conversions API de Meta', () => {
  it.each(ARCHIVOS)('%s existe y no importa @/lib/meta/capi', (archivo) => {
    expect(existsSync(archivo)).toBe(true);
    expect(readFileSync(archivo, 'utf8')).not.toMatch(/meta\/capi|sendCAPIEvents/);
  });
});
