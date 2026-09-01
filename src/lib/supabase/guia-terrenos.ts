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

import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getLotesComparables, type LoteComparable, type PlazoOpcion } from './lp-lotes-comparador';

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

  // Desempate por slug: PostgREST no garantiza orden de filas sin `.order()`
  // (y `getLotesComparables` no lo lleva), así que dos proyectos al mismo
  // precio no pueden quedar en el orden arbitrario que da `sort` estable sobre
  // la inserción del Map — la tabla se reordenaría sola entre revalidaciones.
  return proyectos.sort(
    (a, z) => a.precioDesdeMxn - z.precioDesdeMxn || a.slug.localeCompare(z.slug),
  );
}

/**
 * Los terrenos publicados de Riviera Maya, listos para la guía.
 *
 * PUERTA DE CALIDAD: entra el proyecto que tenga precio, superficie utilizable
 * y título editorial. La medición del 2026-09-01 daba 6 de 7 — el único fuera
 * era `amares-riviera-maya`, por no tener precio capturado. En cuanto se lo
 * capturen entra solo: no hay lista que mantener.
 */
export async function getTerrenosGuia(): Promise<ProyectoGuia[]> {
  const unidades = await getLotesComparables(CIUDADES_GUIA);
  if (unidades.length === 0) return [];

  const devIds = [...new Set(unidades.map((u) => u.developmentId).filter(Boolean))] as string[];
  if (devIds.length === 0) return [];

  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];
  const hub = supabase.schema('real_estate_hub' as 'public');

  // OJO: `name` es `nombre_desarrollo` y NO se selecciona. El título sale de
  // `publication_title`, con `meta_title` de respaldo. El dato privado no llega
  // ni a esta capa.
  const { data: devs } = await hub
    .from('v_developments')
    .select(
      'id, slug, publication_title, meta_title, city, zone, amenities, images, total_units, delivery_text',
    )
    .in('id', devIds)
    .not('approved_at', 'is', null)
    .is('deleted_at', null);

  const desarrollos: Record<string, DatosDesarrollo> = {};
  for (const d of (devs ?? []) as unknown as Record<string, unknown>[]) {
    const id = d.id as string;
    desarrollos[id] = {
      id,
      slug: (d.slug as string) ?? '',
      tituloEditorial: ((d.publication_title as string) || (d.meta_title as string) || '').trim(),
      ciudad: (d.city as string) ?? '',
      zona: (d.zone as string) ?? null,
      amenidades: Array.isArray(d.amenities) ? (d.amenities as string[]) : [],
      imagenes: Array.isArray(d.images) ? (d.images as string[]) : [],
      totalUnidades: d.total_units === null ? null : Number(d.total_units),
      entregaTexto: (d.delivery_text as string) ?? null,
    };
  }

  return agruparPorProyecto(unidades, desarrollos);
}
