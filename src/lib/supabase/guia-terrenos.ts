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
  /**
   * Precio de lista: el más alto, sin descuento. Se conserva disponible para
   * poder rotular más adelante la diferencia con `precioDesdeMxn` — hoy
   * ningún componente lo lee.
   */
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
   * Código traducible del motivo por el que este proyecto no publica plan de
   * mensualidades (`contado`, `contado_parcial`, `condiciones_cambiando`,
   * `tasa_por_confirmar`, o `null` con plan). `null` también cuando NO hay
   * plan pero los lotes del desarrollo no coinciden en el motivo: es un hecho
   * de una fila (la unidad representativa), y este campo solo lo publica
   * cuando también es un hecho del desarrollo entero — ver `agruparPorProyecto`.
   *
   * A propósito NO existe un campo hermano con la prosa: esta página es
   * bilingüe y traduce por código (`explicacionSinPlan` en `FichaProyecto.tsx`
   * mapea el código a la copia i18n). `LoteComparable.motivoSinPlan` sí lleva
   * la prosa en español — la usa la LP monolingüe (`ComparadorLotes.tsx`),
   * que no traduce nada. Si `ProyectoGuia` alguna vez cargara esa prosa,
   * bastaría con que un componente la renderizara sin notar el idioma para
   * filtrar español dentro de `/en`; no cargarla la vuelve imposible en vez de
   * solo prohibida por comentario.
   */
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

    // El motivo (código) solo se publica si TODOS los lotes del desarrollo
    // coinciden en él. `representativa` es el lote más barato por precio de
    // LISTA — una fila, no el desarrollo entero — y su motivo puede ser un
    // hecho de esa fila nada más: `condiciones_cambiando` es, por
    // construcción, un fallo de reconstrucción de precio de ESA unidad, y
    // `contado` generaliza "el desarrollador no publica plan" desde una sola
    // fila aunque el resto sí lo publique. Con un desacuerdo cae a `null` (la
    // clave genérica `sinPlan`, que nunca miente porque no afirma nada
    // específico).
    const motivoCoincide = lista.every(
      (l) => l.motivoSinPlanCodigo === representativa.motivoSinPlanCodigo,
    );
    const motivoSinPlanCodigo = motivoCoincide ? representativa.motivoSinPlanCodigo : null;

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
 * No hay una única puerta de calidad compuesta — son varios filtros
 * independientes, en capas distintas:
 *   - `construirComparables` (lp-lotes-comparador.ts) ya descarta cualquier
 *     fila sin precio antes de que llegue aquí.
 *   - `agruparPorProyecto` rechaza por desarrollo ausente, sin
 *     `tituloEditorial` o sin `slug` (sin nombre publicable o sin link a la
 *     ficha, fuera).
 *   - La superficie NO es puerta: nunca descarta un proyecto. Cuando no es
 *     utilizable (`null` o `<= 0`), `agruparPorProyecto` solo anula
 *     `superficieDesdeM2` y `precioPorM2Mxn` — el proyecto se publica igual,
 *     sin esas dos cifras.
 *
 * La medición del 2026-09-01 daba 6 de 7 — el único fuera era
 * `amares-riviera-maya`, por precio nulo (el filtro de `construirComparables`,
 * no una puerta compuesta aquí). En cuanto lo capturen entra solo: no hay
 * lista que mantener.
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
