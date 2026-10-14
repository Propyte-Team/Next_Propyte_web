// ============================================================
// Sitio de Avica (avicainmobiliaria.com.mx, Webflow) — etiquetas y desarrollos
// Spec: docs/superpowers/specs/2026-10-14-leads-avica-webflow-propyte-design.md §5
// ============================================================

export const DOMINIO_AVICA = 'avicainmobiliaria.com.mx';
export const ORIGEN_AVICA = `https://www.${DOMINIO_AVICA}`;

/**
 * Lo que vio el visitante en los selects del formulario «Email Footer».
 * Copiadas de yaxnah-registro-brokers/src/lib/sitio/mapeo.ts: el mismo
 * formulario alimentó al Zoho de Yaxnáh hasta el 2026-10-14.
 */
export const INTERES_AVICA: Record<string, string> = {
  asesor: 'Ser contactado por un asesor',
  casa: 'Comprar una casa',
  departamento: 'Invertir en un departamento',
  broker: 'Soy Broker',
};

export const FUENTE_AVICA: Record<string, string> = {
  busqueda_google: 'Búsqueda en Google',
  publicidad_meta: 'Publicidad en redes sociales',
  referencias: 'Referencias',
  medio_impreso: 'Medio impreso',
};

/** Una clave desconocida se escribe tal cual: una opción nueva en Webflow no debe perder el dato. */
export function etiquetaAvica(
  mapa: Record<string, string>,
  clave: string | null | undefined,
): string | null {
  if (!clave) return null;
  return mapa[clave] ?? clave;
}

interface DesarrolloAvica {
  nombre: string;
  /** `Propyte_desarrollos.id`; null si el desarrollo no existe en el Hub. */
  hubId: string | null;
}

const YAXNAH_CAUCEL = '76dfb7d5-78a7-47cd-b316-faadd97f4c9e';
const NATIVA_TULUM = '5c171eb4-ef42-444c-9a81-6d61a5b20813';

/** Fichas `/desarrollos/<slug>` del CMS de Webflow (medido el 2026-10-14). */
const DESARROLLOS_AVICA: Record<string, DesarrolloAvica> = {
  yaxnah: { nombre: 'Yaxnáh', hubId: YAXNAH_CAUCEL },
  'nativa-tulum': { nombre: 'Nativa Tulum', hubId: NATIVA_TULUM },
  // No existe en el Hub: se nombra en la descripción, sin Proyecto_de_Interes.
  'real-caucel': { nombre: 'Real Caucel', hubId: null },
};

/**
 * Fuera de una ficha, el interés decide (decisión de diseño 2026-10-14):
 * Nativa Tulum es el único desarrollo de departamentos publicado en Avica.
 */
const HUB_POR_INTERES: Record<string, string> = {
  casa: YAXNAH_CAUCEL,
  departamento: NATIVA_TULUM,
};

export function desarrolloDePagina(page: string | null | undefined): DesarrolloAvica | null {
  if (!page) return null;
  let ruta: string;
  try {
    ruta = new URL(page, ORIGEN_AVICA).pathname;
  } catch {
    return null;
  }
  const coincide = /^\/desarrollos\/([^/]+)\/?$/.exec(ruta);
  return coincide ? (DESARROLLOS_AVICA[coincide[1]] ?? null) : null;
}

/**
 * Desarrollo del Hub para `Proyecto_de_Interes`. La página manda sobre el
 * interés: quien escribe desde la ficha de Real Caucel no quiere Yaxnáh
 * aunque haya elegido «Comprar una casa».
 */
export function hubIdAvica(
  page: string | null | undefined,
  interestOption: string | null | undefined,
): string | null {
  const desarrollo = desarrolloDePagina(page);
  if (desarrollo) return desarrollo.hubId;
  return interestOption ? (HUB_POR_INTERES[interestOption] ?? null) : null;
}
