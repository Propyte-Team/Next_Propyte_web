// ============================================================
// Webhook form_submission del sitio de Avica — decisión de la respuesta
// Spec: docs/superpowers/specs/2026-10-14-leads-avica-webflow-propyte-design.md §6
//
// Webflow reintenta (3 veces, cada 10 min) todo lo que no sea 200 y desactiva
// el webhook si los fallos se repiten. Por eso solo se responde error cuando
// un reintento puede servir: no se pudo guardar el lead.
// ============================================================

import { timingSafeEqual } from 'node:crypto';
import type { FormData } from '@/lib/zoho/field-maps';
import { aFormData, fuenteAvica, leerEnvio, motivoDescarte, type FuenteAvica } from './envio';

export type ResultadoProceso = 'guardado' | 'omitido';

export interface DepsWebhookAvica {
  /** WEBFLOW_AVICA_WEBHOOK_TOKEN. Vacío = sin configurar: no se acepta nada. */
  token: string;
  /** Guarda en public.leads y empuja a Zoho. Lanza SOLO si no se pudo guardar. */
  procesar: (fuente: FuenteAvica, datos: FormData) => Promise<ResultadoProceso>;
  /** Una línea por envío, sin datos personales. */
  registrar: (linea: string) => void;
}

const responder = (cuerpo: Record<string, string>, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * El webhook lo crea el conector MCP de Webflow, que lo firma con el secreto de
 * su app OAuth (inverificable para nosotros): se autentica con un token en la
 * URL. timingSafeEqual lanza con longitudes distintas, por eso se comparan antes.
 */
function tokenValido(recibido: string | null, esperado: string): boolean {
  if (!recibido) return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function manejarWebhookAvica(req: Request, deps: DepsWebhookAvica): Promise<Response> {
  const log = (linea: string) => deps.registrar(`[webflow-avica] ${linea}`);

  if (!deps.token) {
    log('sin_configurar');
    return responder({ resultado: 'sin_configurar' }, 503);
  }
  if (!tokenValido(new URL(req.url).searchParams.get('token'), deps.token)) {
    log('no_autorizado');
    return responder({ resultado: 'no_autorizado' }, 401);
  }

  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(await req.text());
  } catch {
    log('ignorado motivo=json');
    return responder({ resultado: 'ignorado' });
  }

  const envio = leerEnvio(cuerpo);
  if (!envio) {
    log('ignorado motivo=evento');
    return responder({ resultado: 'ignorado' });
  }
  const fuente = fuenteAvica(envio);
  if (!fuente) {
    // El nombre del formulario lo configura Avica en Webflow, no el visitante.
    log(`ignorado formulario=${envio.formulario.slice(0, 60)}`);
    return responder({ resultado: 'ignorado' });
  }

  const motivo = motivoDescarte(envio);
  if (motivo) {
    log(`descartado motivo=${motivo} fuente=${fuente}`);
    return responder({ resultado: 'descartado', motivo });
  }

  try {
    const resultado = await deps.procesar(fuente, aFormData(envio));
    log(`${resultado} fuente=${fuente}`);
    return responder({ resultado });
  } catch {
    // El detalle (sin datos personales) lo registra procesar.
    log(`error_guardado fuente=${fuente}`);
    return responder({ resultado: 'error' }, 500);
  }
}
