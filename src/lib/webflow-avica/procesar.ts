// ============================================================
// Sitio de Avica → public.leads → Zoho de Propyte
// Mismo motor que /api/leads: la fila se guarda ANTES de Zoho (audit-first),
// pushToZoho anota duplicados, y el cron rescata lo que falle.
// NO manda nada a Meta: los leads de Avica no son conversiones de Propyte.
// ============================================================

import { compactFormData } from '@/lib/leads/compact-form-data';
import { pushToZoho } from '@/lib/leads/registrar-lead';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { faltanDatosDeContacto, sourceToZohoPayload, type FormData, type UtmData } from '@/lib/zoho/field-maps';
import { resolverProyectoZoho } from '@/lib/zoho/resolve-proyecto-interes';
import type { FuenteAvica } from './envio';
import type { ResultadoProceso } from './manejador';

export type ClienteLeads = NonNullable<Awaited<ReturnType<typeof createServiceRoleClient>>>;

export interface DepsProcesar {
  cliente: () => Promise<ClienteLeads | null>;
  push: typeof pushToZoho;
  resolverProyecto: typeof resolverProyectoZoho;
  /**
   * Cuánto se espera a Zoho antes de responder a Webflow. El nginx de
   * Hostinger corta a los ~60 s sin bytes con un 502, y Webflow reintenta
   * todo lo que no sea 200: esperar de más duplicaba el lead.
   */
  limiteZohoMs: number;
  /** Eventos estructurados, sin datos personales. */
  registrar: (evento: Record<string, unknown>) => void;
}

/** El webhook de Webflow no trae UTM ni click IDs. */
const SIN_UTMS: UtmData = {};

/**
 * Solo código y mensaje: el `details` de Postgres trae la fila completa
 * («Failing row contains (…nombre, ciudad…)») y no debe llegar a los logs.
 */
function errorSinFila(error: unknown): { code?: unknown; message?: unknown } {
  if (error && typeof error === 'object') {
    const { code, message } = error as { code?: unknown; message?: unknown };
    return { code, message };
  }
  return { message: String(error) };
}

const LENTO = Symbol('zoho-lento');

export function crearProcesador(deps: DepsProcesar) {
  return async function procesar(fuente: FuenteAvica, datos: FormData): Promise<ResultadoProceso> {
    const supabase = await deps.cliente();
    if (!supabase) {
      deps.registrar({ event: 'webflow-avica.supabase-misconfigured' });
      throw new Error('supabase_sin_configurar');
    }

    const fila = {
      name: datos.name ?? null,
      email: datos.email ?? null,
      phone: datos.phone ?? null,
      message: datos.message ?? null,
      source: fuente,
      intake_status: 'nuevo',
      locale: 'es',
      form_data: compactFormData(datos),
    };

    // Misma guardia que /api/leads y el cron: un lead sin con qué contactarlo
    // se guarda como evidencia pero no se empuja a Zoho.
    const razon = faltanDatosDeContacto(fuente, datos);
    if (razon) {
      const { error } = await supabase
        .from('leads')
        .insert({ ...fila, zoho_sync_error: 'SKIPPED: sin datos de contacto' });
      if (error) {
        deps.registrar({ event: 'webflow-avica.insert.failed', source: fuente, error: errorSinFila(error) });
        throw new Error('leads.insert.failed');
      }
      // Con Webflow nadie le avisa al visitante: sin este evento, un correo
      // mal escrito apagaba el lead en silencio.
      deps.registrar({
        event: 'webflow-avica.sin-datos-de-contacto',
        source: fuente,
        razon,
        tiene_nombre: !!datos.name,
        tiene_email: !!datos.email,
        tiene_telefono: !!datos.phone,
        email_invalido: !!datos.invalidEmail,
      });
      return 'omitido';
    }

    const zohoDevelopmentId = await deps.resolverProyecto(supabase, fuente, datos);
    const payload = sourceToZohoPayload(fuente, datos, 'es', SIN_UTMS, zohoDevelopmentId);

    const { data: guardado, error } = await supabase
      .from('leads')
      .insert({
        ...fila,
        nombre_campana: payload.lead.Nombre_de_Campa_a ?? null,
        nombre_formulario: payload.lead.Nombre_del_formulario ?? null,
        zoho_sync_error: 'PENDING_SYNC',
      })
      .select('id')
      .single();
    if (error || !guardado) {
      deps.registrar({ event: 'webflow-avica.insert.failed', source: fuente, error: errorSinFila(error) });
      throw new Error('leads.insert.failed');
    }

    // Ya está guardado: ni un error ni la lentitud de Zoho llegan a Webflow
    // (su reintento duplicaría el lead). Si el push no termina a tiempo, la
    // fila sigue en PENDING_SYNC y la cierra el push en vuelo o el cron.
    let reloj: ReturnType<typeof setTimeout> | undefined;
    try {
      const resultado = await Promise.race([
        deps.push(supabase, guardado.id, fuente, payload, { data: datos, locale: 'es', utms: SIN_UTMS }),
        new Promise<typeof LENTO>((resolver) => {
          reloj = setTimeout(() => resolver(LENTO), deps.limiteZohoMs);
        }),
      ]);
      if (resultado === LENTO) {
        deps.registrar({ event: 'webflow-avica.push-zoho.lento', lead_id: guardado.id, limite_ms: deps.limiteZohoMs });
      }
    } catch (err) {
      deps.registrar({ event: 'webflow-avica.push-zoho.uncaught', lead_id: guardado.id, error: errorSinFila(err) });
    } finally {
      clearTimeout(reloj);
    }
    return 'guardado';
  };
}

export const procesarEnvioAvica = crearProcesador({
  cliente: createServiceRoleClient,
  push: pushToZoho,
  resolverProyecto: resolverProyectoZoho,
  limiteZohoMs: 10_000,
  registrar: (evento) => console.error(JSON.stringify(evento)),
});
