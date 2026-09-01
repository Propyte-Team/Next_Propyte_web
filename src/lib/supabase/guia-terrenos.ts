// ============================================================
// Capa de datos de la guía de terrenos residenciales.
//
// La diferencia con el comparador de la LP: aquí se compara PROYECTO contra
// proyecto, como en la guía de Gamma. La LP compara lotes sueltos, y un
// desarrollo con 5 unidades publicadas ocuparía 5 filas de una tabla que
// promete comparar 6 desarrollos.
//
// CAMINO A NO APLICA AQUÍ. La LP oculta nombres a propósito porque no tiene
// rutas de salida. Esta guía sí enlaza a la ficha, así que usa el TÍTULO
// EDITORIAL (`publication_title`). Sigue sin usar `nombre_desarrollo`, que es
// el dato privado: si un desarrollo no tiene título editorial, se queda fuera.
// ============================================================

import type { LoteComparable, PlazoOpcion } from './lp-lotes-comparador';

/** Ciudades de la guía. Riviera Maya, no solo Playa del Carmen. */
export const CIUDADES_GUIA = ['Playa del Carmen', 'Tulum'];

export interface DatosDesarrollo {
  id: string;
  slug: string;
  /** `publication_title`, con fallback a `meta_title`. NUNCA `name`. */
  tituloEditorial: string;
  ciudad: string;
  zona: string | null;
  amenidades: string[];
  imagenes: string[];
  totalUnidades: number | null;
  entregaTexto: string | null;
}

export interface ProyectoGuia {
  id: string;
  slug: string;
  tituloEditorial: string;
  ciudad: string;
  zona: string | null;
  amenidades: string[];
  imagenes: string[];
  totalUnidades: number | null;
  entregaTexto: string | null;
  precioDesdeMxn: number;
  superficieDesdeM2: number | null;
  /** null cuando no hay superficie utilizable. Nunca una división entre cero. */
  precioPorM2Mxn: number | null;
  plazos: PlazoOpcion[];
  /** Redactado en lenguaje de comprador cuando no hay plan de mensualidades. */
  motivoSinPlan: string | null;
}

/**
 * Colapsa las unidades en un proyecto por desarrollo.
 *
 * La unidad representativa es la MÁS BARATA: la guía publica cifras "desde",
 * igual que Gamma.
 */
export function agruparPorProyecto(
  unidades: LoteComparable[],
  desarrollos: Record<string, DatosDesarrollo>,
): ProyectoGuia[] {
  const porDesarrollo = new Map<string, LoteComparable[]>();
  for (const u of unidades) {
    if (!u.developmentId) continue;
    const lista = porDesarrollo.get(u.developmentId) ?? [];
    lista.push(u);
    porDesarrollo.set(u.developmentId, lista);
  }

  const proyectos: ProyectoGuia[] = [];

  for (const [devId, lista] of porDesarrollo) {
    const dev = desarrollos[devId];
    // Sin título editorial no hay nombre publicable. Fuera.
    if (!dev || !dev.tituloEditorial) continue;

    const representativa = lista.reduce((a, z) => (z.precioListaMxn < a.precioListaMxn ? z : a));

    // `> 0` y no `!== null`: el inventario publica superficies en 0.00, y
    // dividir entre eso da Infinity.
    const m2 = representativa.superficieM2;
    const superficieUtil = m2 !== null && m2 > 0 ? m2 : null;

    proyectos.push({
      id: devId,
      slug: dev.slug,
      tituloEditorial: dev.tituloEditorial,
      ciudad: dev.ciudad,
      zona: dev.zona,
      amenidades: dev.amenidades,
      imagenes: dev.imagenes,
      totalUnidades: dev.totalUnidades,
      entregaTexto: dev.entregaTexto,
      precioDesdeMxn: representativa.precioListaMxn,
      superficieDesdeM2: superficieUtil,
      precioPorM2Mxn:
        superficieUtil === null
          ? null
          : Math.round(representativa.precioListaMxn / superficieUtil),
      plazos: representativa.plazos,
      motivoSinPlan: representativa.motivoSinPlan,
    });
  }

  return proyectos.sort((a, z) => a.precioDesdeMxn - z.precioDesdeMxn);
}
