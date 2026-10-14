// ============================================================
// Webhook form_submission de Webflow (sitio de Avica) → datos de /api/leads
// Spec: docs/superpowers/specs/2026-10-14-leads-avica-webflow-propyte-design.md §5-6
// Portado de yaxnah-registro-brokers/src/lib/sitio/envio.ts, probado contra
// los 45 envíos reales del formulario.
// ============================================================

import { z } from 'zod';
import type { FormData, LeadSource } from '@/lib/zoho/field-maps';
import { ORIGEN_AVICA, desarrolloDePagina } from './etiquetas';

/** Honeypot del formulario «Email Footer» (mismo nombre que revisa la app de brokers). */
export const CAMPO_TRAMPA = 'campo_extra_hp';
const FORMULARIO_CONTACTO = 'Email Footer';
const FORMULARIO_NEWSLETTER = 'Email Form';

export type FuenteAvica = Extract<LeadSource, 'avica_contacto' | 'avica_broker' | 'avica_newsletter'>;

/** Un envío de un formulario del sitio de Avica, ya limpio. */
export interface EnvioAvica {
  /** Nombre del formulario en Webflow («Email Footer» o «Email Form»). */
  formulario: string;
  /** Ruta de la página donde se envió, si Webflow la manda. */
  pagina: string | null;
  nombre: string | null;
  telefono: string | null;
  correo: string | null;
  ciudad: string | null;
  /** Clave cruda del select «interes_en». */
  interes: string | null;
  /** Clave cruda del select «nos_encontro_en». */
  fuente: string | null;
  mensaje: string | null;
  /** Casilla «¿Eres broker inmobiliario?». */
  esBroker: boolean;
  trampa: string | null;
  /**
   * Lo que tecleó en «correo» cuando no es un correo válido (`ana@gmail`, que
   * el navegador sí acepta). No ocupa `correo`: Zoho rechazaría el registro.
   */
  correoInvalido: string | null;
}

export type MotivoDescarte = 'trampa' | 'enlaces';

const esquemaWebhook = z.object({
  triggerType: z.literal('form_submission'),
  payload: z.object({
    name: z.string(),
    data: z.record(z.string(), z.unknown()),
    publishedPath: z.string().optional(),
    pageUrl: z.string().optional(),
  }),
});

const correoValido = z.email();

const textoDe = (valor: unknown): string | null => {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim().replace(/\s+/g, ' ');
  return limpio === '' ? null : limpio;
};

/**
 * La URL real del visitante manda. En una ficha del CMS, `publishedPath` es la
 * ruta de la PLANTILLA: los 4 envíos reales hechos desde una ficha traían
 * «/desarrollos», nunca «/desarrollos/yaxnah» (medido el 2026-10-14).
 */
function rutaDe(publishedPath: string | undefined, pageUrl: string | undefined): string | null {
  if (pageUrl) {
    try {
      return new URL(pageUrl).pathname;
    } catch {
      // URL rota: se cae a publishedPath.
    }
  }
  return publishedPath || null;
}

/** null si el cuerpo no es un form_submission de Webflow con datos. */
export function leerEnvio(cuerpo: unknown): EnvioAvica | null {
  const analisis = esquemaWebhook.safeParse(cuerpo);
  if (!analisis.success) return null;
  const { name, data, publishedPath, pageUrl } = analisis.data.payload;
  const correo = textoDe(data.correo ?? data.correo_newsletter)?.toLowerCase() ?? null;
  const correoEsValido = correo !== null && correoValido.safeParse(correo).success;
  // Sin publicar, la casilla no tiene nombre y Webflow la manda como «Field 8».
  // Se acepta booleano por si Webflow cambia el formato del payload.
  const casilla = data.es_broker ?? data['Field 8'];
  return {
    formulario: name,
    pagina: rutaDe(publishedPath, pageUrl),
    nombre: textoDe(data.nombre),
    telefono: textoDe(data.tel),
    correo: correoEsValido ? correo : null,
    ciudad: textoDe(data.ciudad),
    interes: textoDe(data.interes_en),
    fuente: textoDe(data.nos_encontro_en),
    mensaje: textoDe(data.mensaje),
    esBroker: casilla === true || textoDe(casilla) === 'true',
    trampa: textoDe(data[CAMPO_TRAMPA]),
    correoInvalido: correo !== null && !correoEsValido ? correo : null,
  };
}

/** Medido contra los 45 envíos reales (2026-10-14): los 35 de spam traían enlaces; ninguno legítimo. */
const ENLACE_O_HTML = /https?:\/\/|www\.|\[url|<[a-z][^>]*>/i;

/**
 * Solo lo que es spam con certeza. La falta de datos de contacto NO es spam:
 * la decide faltanDatosDeContacto, igual que en /api/leads, y esa fila se
 * guarda como evidencia.
 */
export function motivoDescarte(envio: EnvioAvica): MotivoDescarte | null {
  if (envio.trampa) return 'trampa';
  if ([envio.nombre, envio.ciudad, envio.mensaje].some((t) => t && ENLACE_O_HTML.test(t))) {
    return 'enlaces';
  }
  return null;
}

/** null = formulario que no conocemos: se ignora con 200. */
export function fuenteAvica(envio: EnvioAvica): FuenteAvica | null {
  if (envio.formulario === FORMULARIO_NEWSLETTER) return 'avica_newsletter';
  if (envio.formulario !== FORMULARIO_CONTACTO) return null;
  return envio.interes === 'broker' || envio.esBroker ? 'avica_broker' : 'avica_contacto';
}

export function aFormData(envio: EnvioAvica): FormData {
  const page = `${ORIGEN_AVICA}${envio.pagina ?? '/'}`;
  return {
    name: envio.nombre,
    email: envio.correo,
    phone: envio.telefono,
    city: envio.ciudad,
    message: envio.mensaje,
    interestOption: envio.interes,
    heardFrom: envio.fuente,
    // null y no false: compactFormData no guarda nulos y la descripción solo
    // menciona la casilla cuando se marcó.
    isBroker: envio.esBroker ? true : null,
    propertyName: desarrolloDePagina(page)?.nombre ?? null,
    page,
    // Sin esto, un lead con nombre y teléfono pero el correo mal escrito
    // quedaba SKIPPED y el correo tecleado no se guardaba en ningún lado.
    invalidEmail: envio.correoInvalido,
  };
}
