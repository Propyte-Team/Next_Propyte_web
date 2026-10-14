// ============================================================
// Sitio de Avica → public.leads → Zoho de Propyte
// Mismo motor que /api/leads: la fila se guarda ANTES de Zoho (audit-first),
// pushToZoho anota duplicados, y el cron rescata lo que falle.
// NO manda nada a Meta: los leads de Avica no son conversiones de Propyte.
// ============================================================

import { compactFormData } from '@/lib/leads/compact-form-data';
import { pushToZoho } from '@/lib/leads/registrar-lead';
import { sanitizeErrorMessage } from '@/lib/security/sanitize-error';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { faltanDatosDeContacto, sourceToZohoPayload, type FormData, type UtmData } from '@/lib/zoho/field-maps';
import { resolverProyectoZoho } from '@/lib/zoho/resolve-proyecto-interes';
import type { FuenteAvica } from './envio';
import type { ResultadoProceso } from './manejador';

/** El webhook de Webflow no trae UTM ni click IDs. */
const SIN_UTMS: UtmData = {};

export async function procesarEnvioAvica(fuente: FuenteAvica, datos: FormData): Promise<ResultadoProceso> {
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.error(JSON.stringify({ event: 'webflow-avica.supabase-misconfigured' }));
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
  if (faltanDatosDeContacto(fuente, datos)) {
    const { error } = await supabase
      .from('leads')
      .insert({ ...fila, zoho_sync_error: 'SKIPPED: sin datos de contacto' });
    if (error) {
      console.error(JSON.stringify({ event: 'webflow-avica.insert.failed', source: fuente, error: sanitizeErrorMessage(error) }));
      throw new Error('leads.insert.failed');
    }
    return 'omitido';
  }

  const zohoDevelopmentId = await resolverProyectoZoho(supabase, fuente, datos);
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
    console.error(JSON.stringify({ event: 'webflow-avica.insert.failed', source: fuente, error: sanitizeErrorMessage(error) }));
    throw new Error('leads.insert.failed');
  }

  // Ya está guardado: si Zoho falla, el cron lo rescata y a Webflow se le
  // responde 200 (un reintento suyo solo duplicaría la fila).
  try {
    await pushToZoho(supabase, guardado.id, fuente, payload, { data: datos, locale: 'es', utms: SIN_UTMS });
  } catch (err) {
    console.error(JSON.stringify({ event: 'webflow-avica.push-zoho.uncaught', lead_id: guardado.id, error: sanitizeErrorMessage(err) }));
  }
  return 'guardado';
}
