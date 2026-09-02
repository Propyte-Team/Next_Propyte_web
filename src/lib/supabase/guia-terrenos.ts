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
import {
  getLotesComparables,
  type CondicionContado,
  type LoteComparable,
  type PlazoOpcion,
} from './lp-lotes-comparador';

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
  /**
   * El precio MÁS BAJO alcanzable: el mínimo entre `plazos[].precioMxn`,
   * `contado?.precioMxn` y `precioListaMxn`. NO es `precioListaMxn` — ese es
   * el precio del plazo más largo, sin descuento, y por lo tanto el MÁS CARO.
   */
  precioDesdeMxn: number;
  /** Precio de lista: el más alto, sin descuento. Se conserva para poder rotular la diferencia con `precioDesdeMxn`. */
  precioListaMxn: number;
  /** De dónde salió `precioDesdeMxn`. La UI lo rotula; sin esto, dos precios distintos se leen como un error. */
  precioDesdeBase: 'contado' | 'plazo' | 'lista';
  /** Meses del plazo, cuando `precioDesdeBase` es 'plazo'. Si no, null. */
  precioDesdeMeses: number | null;
  superficieDesdeM2: number | null;
  /** null cuando no hay superficie utilizable. Nunca una división entre cero. Se calcula sobre `precioDesdeMxn`, no sobre `precioListaMxn`. */
  precioPorM2Mxn: number | null;
  plazos: PlazoOpcion[];
  /**
   * Redactado en lenguaje de comprador cuando no hay plan de mensualidades.
   * Igual que `motivoSinPlanCodigo`: es `null` salvo que TODOS los lotes del
   * desarrollo coincidan en el motivo — es un hecho de una fila (la unidad
   * representativa), y este campo solo lo publica cuando también es un hecho
   * del desarrollo. Los dos campos se colapsan JUNTOS (ver `agruparPorProyecto`)
   * para que nunca quede prosa sin su código o código sin su prosa — ese
   * desacople dejaría filtrar prosa en español, a nivel de LOTE ("este lote"),
   * dentro de una página que ya decidió traducir por código.
   */
  motivoSinPlan: string | null;
  /** El mismo motivo que `motivoSinPlan`, como código traducible. Ver `LoteComparable` y la nota de arriba. */
  motivoSinPlanCodigo: LoteComparable['motivoSinPlanCodigo'];
  /**
   * El plazo MÁS LARGO: la mensualidad más baja, con SU propio precio al lado.
   * Publicar la mensualidad sin su precio invita a sumarla al «desde», que es
   * de otro plazo. `null` si el proyecto no tiene plan de mensualidades.
   */
  mensualidad: { meses: number; mensualidadMxn: number; precioMxn: number } | null;
  /**
   * Condiciones del pago de contado, tal cual las declara el desarrollo.
   *
   * Va aquí porque la tabla publica precios «de contado» y sin esto no puede
   * decir en qué consisten. El Hub etiqueta «Contado» al menos un registro que
   * en realidad es 90% al firmar y 10% contra entrega: publicar su precio a
   * secas se comería ese 10% diferido.
   */
  contado: CondicionContado | null;
}

/** Un candidato a ser el "desde" que se publica: de dónde sale y a qué precio. */
interface CandidatoDesde {
  base: 'contado' | 'plazo' | 'lista';
  precioMxn: number;
  meses: number | null;
}

/** Orden de preferencia en empate: contado > plazo > lista. Menor = gana. */
const RANGO_BASE: Record<CandidatoDesde['base'], number> = { contado: 0, plazo: 1, lista: 2 };

/**
 * Elige el precio "desde" que se publica: el más bajo entre las tres fuentes
 * reales a las que alguien puede comprar (contado, cada plazo, lista).
 *
 * Desempate cuando dos candidatos comparten el precio mínimo: gana 'contado'
 * sobre 'plazo', y 'plazo' sobre 'lista' — el orden de `RANGO_BASE`. Si
 * empatan dos plazos entre sí, gana el de MENOS meses.
 */
function elegirDesde(lote: LoteComparable): CandidatoDesde {
  const candidatos: CandidatoDesde[] = [];
  if (lote.contado) candidatos.push({ base: 'contado', precioMxn: lote.contado.precioMxn, meses: null });
  for (const p of lote.plazos) candidatos.push({ base: 'plazo', precioMxn: p.precioMxn, meses: p.meses });
  // Siempre hay al menos este candidato: nunca se devuelve un array vacío.
  candidatos.push({ base: 'lista', precioMxn: lote.precioListaMxn, meses: null });

  return candidatos.reduce((mejor, actual) => {
    if (actual.precioMxn < mejor.precioMxn) return actual;
    if (actual.precioMxn > mejor.precioMxn) return mejor;
    if (RANGO_BASE[actual.base] < RANGO_BASE[mejor.base]) return actual;
    if (RANGO_BASE[actual.base] > RANGO_BASE[mejor.base]) return mejor;
    // Mismo precio, misma base: solo puede pasar entre dos plazos. Gana el de
    // menos meses (comprar más barato y más rápido siempre es mejor "desde").
    if (actual.base === 'plazo' && (actual.meses ?? Infinity) < (mejor.meses ?? Infinity)) {
      return actual;
    }
    return mejor;
  });
}

/**
 * Colapsa las unidades en un proyecto por desarrollo.
 *
 * La unidad representativa es la MÁS BARATA por precio de lista: la guía
 * publica cifras "desde", igual que Gamma. Pero el precio que se publica de
 * esa unidad NO es su `precioListaMxn` (el más caro, sin descuento) sino el
 * mínimo real alcanzable — ver `elegirDesde`. Representatividad y precio
 * publicado son dos decisiones distintas.
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
    // Sin título editorial no hay nombre publicable, y sin slug el enlace a la
    // ficha sale roto: en ambos casos, fuera.
    if (!dev || !dev.tituloEditorial || !dev.slug) continue;

    // El criterio de representatividad NO cambia con esta enmienda: sigue
    // siendo la unidad más barata por precio de LISTA. Lo que cambia es qué
    // precio de ESA unidad se publica como "desde" (ver `elegirDesde`).
    const representativa = lista.reduce((a, z) => (z.precioListaMxn < a.precioListaMxn ? z : a));

    // `> 0` y no `!== null`: el inventario publica superficies en 0.00, y
    // dividir entre eso da Infinity.
    const m2 = representativa.superficieM2;
    const superficieUtil = m2 !== null && m2 > 0 ? m2 : null;

    const desde = elegirDesde(representativa);

    // El motivo (código Y prosa) solo se publica si TODOS los lotes del
    // desarrollo coinciden en él. `representativa` es el lote más barato por
    // precio de LISTA — una fila, no el desarrollo entero — y su motivo puede
    // ser un hecho de esa fila nada más: `condiciones_cambiando` es, por
    // construcción, un fallo de reconstrucción de precio de ESA unidad, y
    // `contado` generaliza "el desarrollador no publica plan" desde una sola
    // fila aunque el resto sí lo publique. Con un desacuerdo, los DOS caen a
    // `null` (la clave genérica `sinPlan`, que nunca miente porque no afirma
    // nada específico) — nunca uno sin el otro: un `motivoSinPlan` que
    // sobreviviera solo a él filtraría prosa en español, a nivel de LOTE
    // ("este lote"), dentro de una página que traduce por código.
    const motivoCoincide = lista.every(
      (l) => l.motivoSinPlanCodigo === representativa.motivoSinPlanCodigo,
    );
    const motivoSinPlanCodigo = motivoCoincide ? representativa.motivoSinPlanCodigo : null;
    const motivoSinPlan = motivoCoincide ? representativa.motivoSinPlan : null;

    // El plazo más largo: la mensualidad más baja. Se publica con SU propio
    // precio (`desde.precioMxn` sería el de OTRO plazo si `desde.base` es
    // 'plazo' con menos meses, o directamente no aplica si es 'contado'/'lista').
    const plazoMasLargo =
      representativa.plazos.length > 0
        ? representativa.plazos.reduce((a, z) => (z.meses > a.meses ? z : a))
        : null;

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
      precioDesdeMxn: desde.precioMxn,
      precioListaMxn: representativa.precioListaMxn,
      precioDesdeBase: desde.base,
      precioDesdeMeses: desde.base === 'plazo' ? desde.meses : null,
      superficieDesdeM2: superficieUtil,
      precioPorM2Mxn: superficieUtil === null ? null : Math.round(desde.precioMxn / superficieUtil),
      plazos: representativa.plazos,
      motivoSinPlan,
      motivoSinPlanCodigo,
      contado: representativa.contado,
      mensualidad:
        plazoMasLargo === null
          ? null
          : {
              meses: plazoMasLargo.meses,
              mensualidadMxn: plazoMasLargo.mensualidadMxn,
              precioMxn: plazoMasLargo.precioMxn,
            },
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
  //
  // El `error` de esta consulta se descarta a propósito (fallo cerrado): si
  // falla, `devs` queda `null` y la guía sale vacía en vez de publicar los
  // proyectos sin haber podido verificar sus nombres/slugs.
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
