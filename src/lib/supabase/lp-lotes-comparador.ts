// ============================================================
// Capa de datos del comparador de lotes de Playa del Carmen.
//
// Hereda las tres reglas de `lp-lotes.ts` (gate de publicación, Camino A,
// data-gate) y añade una cuarta que solo aplica aquí:
//
//  4. TRES FUENTES DE FINANCIAMIENTO, UNA SOLA FORMA. El Hub captura las
//     condiciones de pago en TRES lugares distintos y cada desarrollo usa uno:
//
//       a) `esquemas_pago` del desarrollo — JSONB estructurado, un entry por
//          plazo, con descuento por pronto pago. La forma buena.
//       b) `ext_*` planos de la unidad — tasa + esquema en prosa + array de
//          meses. Es lo que usa el lote de esta landing.
//       c) `ext_esquema_pago` del desarrollo — UNA SOLA CADENA que describe el
//          plan entero en prosa, incluido el plazo ("60% durante obra en 36
//          meses"). Ni tasa, ni array de meses, ni JSONB: solo el texto.
//
//     Este módulo normaliza las tres a `PlazoOpcion` y todo lo de arriba
//     consume una sola forma.
//
//     El diagnóstico que llevó a esto: se asumió que los otros desarrollos
//     arrastraban el gate de herencia de `financiamiento_propio` (los `fin_*`
//     salían NULL). No era eso. El flag está en false, sí, pero las unidades
//     tampoco tienen los `ext_*` capturados: el dato vive en el DESARROLLO.
//
//     Y una segunda corrección, más cara: la fuente (c) casi se declara
//     "sin plan de pagos". Un `esquemas_pago` con un único entry de contado
//     parece un desarrollo que no financia, y solo leyendo el texto plano
//     aparece el plan a 36 meses. Contar fuentes estructuradas no es contar
//     datos: hay que mirar cada columna.
//
// EL PRECIO NO ES UN NÚMERO, ES UNA FUNCIÓN DEL PLAZO. Al menos un desarrollo
// aplica descuento por pronto pago escalonado (21.4% a 12 meses, 0% a 48). El
// `price_mxn` que publica la vista para su unidad es el precio del plazo MÁS
// CORTO, no el de lista. Calcular una mensualidad a 48 meses sobre esa base
// publica una cifra que no existe. Ver `reconstruirPrecioLista`.
// ============================================================

import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { precioDesarrollo, type FilaPrecioDesarrollo } from '@/lib/precio-moneda';

/** De dónde salieron las condiciones. Cambia cómo se cuentan los pagos. */
export type FuenteEsquema = 'ext_planos' | 'esquemas_jsonb' | 'prosa_desarrollo';

export interface PlazoOpcion {
  meses: number;
  /**
   * Mensualidades reales del plazo.
   *
   * NO siempre es `meses`. Con `ext_planos` el registro declara "59 MSI + 1
   * mensualidad final", así que en 60 meses hay 59 pagos y el último es la
   * contraentrega. Con `esquemas_jsonb` no hay ningún dato que diga lo mismo, y
   * su contraentrega suele liquidarse aparte (hipotecario), así que restar uno
   * sería inventar. Cada fuente cuenta como declara.
   */
  pagos: number;
  /** Precio de venta EN ESTE PLAZO, ya con el descuento que aplique. */
  precioMxn: number;
  /** Descuento por pronto pago de este plazo. 0 si no hay. */
  descuentoPct: number;
  engancheMxn: number;
  mensualidadMxn: number;
  contraentregaMxn: number;
  /**
   * Cómo se liquida el pago final. 'hipotecario' es materialmente distinto de
   * pagarle al desarrollador: exige calificar para un crédito. Se publica.
   */
  contraentregaVia: string | null;
}

export interface CondicionContado {
  descuentoPct: number;
  /** Precio de contado, ya con descuento aplicado. */
  precioMxn: number;
  /**
   * Qué parte se paga al firmar. No siempre es 100: hay un registro con 90% al
   * firmar y 10% contra entrega, que el Hub etiqueta "Contado" pero no lo es
   * del todo. Publicarlo como "de contado" a secas se comería un 10% diferido.
   */
  enganchePct: number;
  contraentregaPct: number;
}

export interface LoteComparable {
  id: string;
  /**
   * Etiqueta de la opción. Camino A: ubicación + superficie + precio desde,
   * CERO nombres comerciales. Formato acordado con Luis el 2026-08-12.
   */
  etiqueta: string;
  ciudad: string;
  superficieM2: number | null;
  /** Precio de lista: el más alto de los plazos, sin descuento. */
  precioListaMxn: number;
  /** true para el lote que protagoniza la landing. */
  esDeEstaLanding: boolean;
  fuente: FuenteEsquema;
  /** Vacío si el lote no tiene plan de mensualidades. */
  plazos: PlazoOpcion[];
  /** Presente solo si el registro declara una opción de contado. */
  contado: CondicionContado | null;
  /** Apartado que pide el desarrollador para reservar, si lo declara. */
  apartadoMxn: number | null;
  /**
   * Por qué este lote no publica mensualidades, en lenguaje de comprador.
   * null cuando sí las publica. Es un gate, no un error.
   */
  motivoSinPlan: string | null;
}

const MXN_ETIQUETA = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

const M2_ETIQUETA = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

function numeroONull(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : null;
}

const redondear2 = (n: number) => Math.round(n * 100) / 100;

/** Entry del JSONB `esquemas_pago`, con solo los campos que este módulo usa. */
interface EsquemaJsonb {
  meses: number;
  tasa: number | null;
  enganche_pct: number | null;
  contraentrega_pct: number | null;
  descuento_pct: number | null;
  contraentrega_via: string | null;
}

function leerEsquemasJsonb(raw: unknown): EsquemaJsonb[] {
  if (!Array.isArray(raw)) return [];
  const out: EsquemaJsonb[] = [];
  for (const e of raw) {
    if (!e || typeof e !== 'object') continue;
    const o = e as Record<string, unknown>;
    const meses = numeroONull(o.meses);
    if (meses === null || meses < 0) continue;
    out.push({
      meses,
      tasa: numeroONull(o.tasa),
      enganche_pct: numeroONull(o.enganche_pct),
      contraentrega_pct: numeroONull(o.contraentrega_pct),
      descuento_pct: numeroONull(o.descuento_pct),
      contraentrega_via:
        typeof o.contraentrega_via === 'string' ? o.contraentrega_via : null,
    });
  }
  return out.sort((a, z) => a.meses - z.meses);
}

/**
 * Reconstruye el precio de lista a partir del precio publicado.
 *
 * `price_mxn` viene con el descuento del plazo MÁS AGRESIVO ya aplicado (así lo
 * captura el Hub: el enganche almacenado de la unidad cuadra al centavo con ese
 * precio, no con el de lista). Para poder mostrar el precio de cada plazo hay
 * que deshacer ese descuento primero.
 *
 * La reconstrucción se VALIDA contra el mínimo declarado por el desarrollo. Si
 * las dos cifras no cuadran, algo cambió de forma y devolvemos null: la UI
 * publica el gate en vez de una tabla de precios que no podemos sostener.
 */
function reconstruirPrecioLista(
  precioPublicado: number,
  descuentoMaxPct: number,
  precioMinDesarrollo: number | null,
): number | null {
  if (descuentoMaxPct <= 0) return precioPublicado;
  if (descuentoMaxPct >= 100) return null;

  const lista = precioPublicado / (1 - descuentoMaxPct / 100);

  // Sin cifra de control no se publica una reconstrucción: es aritmética sobre
  // un supuesto, y el supuesto tiene que poder comprobarse.
  if (precioMinDesarrollo === null) return null;

  // 0.5% de tolerancia: los `descuento_pct` vienen redondeados a 4 decimales
  // (21.4286 en vez de 3/14), así que la reconstrucción no cae exacta.
  const desvio = Math.abs(lista - precioMinDesarrollo) / precioMinDesarrollo;
  if (desvio > 0.005) return null;

  // Cuadra: se publica la cifra DECLARADA, no la reconstruida.
  return precioMinDesarrollo;
}

/** Construye los plazos desde el JSONB estructurado. */
function plazosDesdeJsonb(
  esquemas: EsquemaJsonb[],
  precioLista: number,
  /**
   * Precio tal como lo publica la vista. Corresponde al plazo de descuento
   * máximo y se usa TAL CUAL para ese plazo: los `descuento_pct` vienen
   * redondeados a cuatro decimales (21.4286 en lugar de 3/14), así que
   * recalcularlo desviaba el precio real en medio peso. Entre un dato guardado
   * y una multiplicación, gana el dato guardado.
   */
  precioPublicado: number,
  descuentoMaxPct: number,
): PlazoOpcion[] {
  const plazos: PlazoOpcion[] = [];

  for (const e of esquemas) {
    // meses = 0 es contado, no un plan de mensualidades.
    if (e.meses <= 0) continue;
    // Con interés la aritmética deja de ser lineal y este cálculo no aplica.
    if (e.tasa === null || e.tasa !== 0) continue;
    if (e.enganche_pct === null || e.contraentrega_pct === null) continue;

    const mensualidadesPct = 100 - e.enganche_pct - e.contraentrega_pct;
    if (mensualidadesPct <= 0) continue;

    const descuentoPct = e.descuento_pct ?? 0;
    const precio =
      descuentoPct === descuentoMaxPct && descuentoMaxPct > 0
        ? precioPublicado
        : redondear2(precioLista * (1 - descuentoPct / 100));

    plazos.push({
      meses: e.meses,
      // Ver la nota de `pagos`: esta fuente no declara pago final aparte.
      pagos: e.meses,
      precioMxn: precio,
      descuentoPct,
      engancheMxn: redondear2((precio * e.enganche_pct) / 100),
      mensualidadMxn: redondear2((precio * mensualidadesPct) / 100 / e.meses),
      contraentregaMxn: redondear2((precio * e.contraentrega_pct) / 100),
      contraentregaVia: e.contraentrega_via,
    });
  }

  return plazos;
}

/** Parsea los tres porcentajes del esquema en prosa. Igual que en `lp-lotes.ts`. */
function parsearEsquemaProsa(
  texto: string | null,
): { enganchePct: number; mensualidadesPct: number; contraentregaPct: number } | null {
  if (!texto) return null;
  const pcts = [...texto.matchAll(/(\d{1,3})\s*%/g)].map((m) => Number(m[1]));
  if (pcts.length !== 3) return null;
  const [enganchePct, mensualidadesPct, contraentregaPct] = pcts as [number, number, number];
  if (enganchePct + mensualidadesPct + contraentregaPct !== 100) return null;
  return { enganchePct, mensualidadesPct, contraentregaPct };
}

/** Construye los plazos desde los campos `ext_*` planos. */
function plazosDesdeExtPlanos(
  precio: number,
  tasa: number | null,
  esquemaTexto: string | null,
  meses: number[],
): PlazoOpcion[] {
  if (tasa === null || tasa !== 0) return [];
  const esquema = parsearEsquemaProsa(esquemaTexto);
  if (!esquema) return [];

  const mensualidadesTotal = (precio * esquema.mensualidadesPct) / 100;

  return meses
    .filter((m) => m > 1)
    .map((m) => {
      // Esta fuente SÍ declara pago final aparte: "59 MSI + 1 mensualidad final".
      const pagos = m - 1;
      return {
        meses: m,
        pagos,
        precioMxn: precio,
        descuentoPct: 0,
        engancheMxn: redondear2((precio * esquema.enganchePct) / 100),
        mensualidadMxn: redondear2(mensualidadesTotal / pagos),
        contraentregaMxn: redondear2((precio * esquema.contraentregaPct) / 100),
        contraentregaVia: null,
      };
    });
}

/**
 * Tercera fuente: el plan entero descrito en una cadena.
 *
 * Formato real que hay que leer (un solo campo, dos ofertas separadas por '·'):
 *
 *   "Preventa: apartado $25,000, enganche 20%, 60% durante obra en 36 meses,
 *    20% contra entrega · Contado: contado con 20% de descuento"
 *
 * Se parsea SOLO el tramo de preventa. El de contado se ignora aquí a
 * propósito: sus porcentajes contaminarían el conteo (el texto completo tiene
 * cuatro `%`, no tres, que es justo por lo que el parser de `lp-lotes.ts` no
 * puede con esta cadena).
 *
 * Sobre la tasa: este formato no la declara. Se infiere cero por la misma
 * comprobación ya validada para el otro lote — si enganche + mensualidades +
 * contraentrega suman EXACTAMENTE 100, el comprador paga el precio de venta y
 * nada más, así que no hay interés. Con cualquier otra suma se devuelve null y
 * la UI publica el gate.
 */
function parsearPreventaProsa(texto: string | null): {
  enganchePct: number;
  mensualidadesPct: number;
  meses: number;
  contraentregaPct: number;
  apartadoMxn: number | null;
} | null {
  if (!texto) return null;

  // Quedarse con el tramo de preventa: hasta el separador de ofertas.
  const tramo = texto.split('·')[0] ?? '';
  if (!/preventa/i.test(tramo)) return null;

  const enganche = /enganche\s+(\d{1,3})\s*%/i.exec(tramo);
  // `[^%]*?` y no `[^.]*?`: el comodín NO puede cruzar otro porcentaje. Con
  // `[^.]*?` el motor arrancaba en el 20% del enganche y saltaba por encima del
  // 60% hasta "en 36 meses", devolviendo 20 como porcentaje de mensualidades.
  // La suma daba 60 en vez de 100, el parser se declaraba fallido y un lote con
  // plan real a 36 meses se publicaba como "se vende de contado".
  const mensualidades = /(\d{1,3})\s*%[^%]*?en\s+(\d{1,3})\s+meses/i.exec(tramo);
  const contraentrega = /(\d{1,3})\s*%\s*contra\s*entrega/i.exec(tramo);
  if (!enganche || !mensualidades || !contraentrega) return null;

  const enganchePct = Number(enganche[1]);
  const mensualidadesPct = Number(mensualidades[1]);
  const meses = Number(mensualidades[2]);
  const contraentregaPct = Number(contraentrega[1]);

  if (!meses || meses < 1) return null;
  // Sin esta igualdad no se publica: ver la nota sobre la tasa.
  if (enganchePct + mensualidadesPct + contraentregaPct !== 100) return null;

  const apartado = /apartado\s*\$?\s*([\d,]+)/i.exec(tramo);
  const apartadoMxn = apartado ? Number(apartado[1].replace(/,/g, '')) : null;

  return {
    enganchePct,
    mensualidadesPct,
    meses,
    contraentregaPct,
    apartadoMxn: apartadoMxn !== null && Number.isFinite(apartadoMxn) ? apartadoMxn : null,
  };
}

/** Construye el único plazo que declara la fuente en prosa. */
function plazosDesdeProsa(
  precio: number,
  parsed: NonNullable<ReturnType<typeof parsearPreventaProsa>>,
): PlazoOpcion[] {
  return [
    {
      meses: parsed.meses,
      // El texto dice "60% durante obra en 36 meses" y la contraentrega va
      // aparte: son 36 mensualidades, no 35. Restar uno aquí sería copiar la
      // convención de OTRO desarrollo sobre un texto que no la declara.
      pagos: parsed.meses,
      precioMxn: precio,
      descuentoPct: 0,
      engancheMxn: redondear2((precio * parsed.enganchePct) / 100),
      mensualidadMxn: redondear2((precio * parsed.mensualidadesPct) / 100 / parsed.meses),
      contraentregaMxn: redondear2((precio * parsed.contraentregaPct) / 100),
      contraentregaVia: null,
    },
  ];
}

/** Opción de contado, si el registro la declara. */
function leerContado(esquemas: EsquemaJsonb[], precioLista: number): CondicionContado | null {
  const contado = esquemas.find((e) => e.meses === 0);
  if (!contado) return null;
  const descuentoPct = contado.descuento_pct ?? 0;
  return {
    descuentoPct,
    precioMxn: redondear2(precioLista * (1 - descuentoPct / 100)),
    enganchePct: contado.enganche_pct ?? 100,
    contraentregaPct: contado.contraentrega_pct ?? 0,
  };
}

function construirEtiqueta(
  ciudad: string,
  superficieM2: number | null,
  precioDesde: number,
): string {
  // Formato acordado: ubicación · superficie · precio desde. Sin nombres.
  //
  // Lleva «MXN» como el resto de la página: este es justo el bloque donde se
  // comparan precios entre lotes, y un `$` ambiguo aquí vale por cuatro.
  const partes = [ciudad];
  if (superficieM2 !== null) partes.push(`${M2_ETIQUETA.format(superficieM2)} m²`);
  partes.push(`desde ${MXN_ETIQUETA.format(precioDesde)} MXN`);
  return partes.join(' · ');
}

/** UUID del lote que protagoniza la landing, para marcarlo en el comparador. */
const ID_DESARROLLO_DE_ESTA_LANDING = '025943d7-c7f1-482c-a489-09a28bb2328a';

/** Las columnas de `v_units` que consume el comparador. */
export interface FilaComparador {
  id: string;
  development_id: string | null;
  city: string | null;
  area_m2: number | string | null;
  price_mxn: number | string | null;
  unit_type?: string | null;
  fin_tasa: number | string | null;
  fin_esquema: string | null;
  fin_meses_opciones: unknown;
  fin_esquemas_pago: unknown;
}

/**
 * Construye los comparables a partir de filas ya consultadas.
 *
 * Separada de la consulta para poder testearla con un fixture real, mismo
 * patrón que `construirInventario` en `lp-casas.ts`.
 *
 * @param superficieBase  id de unidad → `superficie_terreno_m2` de la tabla base
 * @param precioMinDev    id de desarrollo → precio mínimo EN PESOS, o null
 */
export function construirComparables(
  filas: FilaComparador[],
  superficieBase: Map<string, number | null>,
  precioMinDev: Map<string, number | null>,
): LoteComparable[] {
  const lotes: LoteComparable[] = [];

  for (const f of filas) {
    const precioPublicado = numeroONull(f.price_mxn);
    const ciudad = typeof f.city === 'string' ? f.city : null;
    if (precioPublicado === null || !ciudad) continue;

    const id = f.id;
    const devId = f.development_id;
    const superficieM2 = numeroONull(f.area_m2) ?? superficieBase.get(id) ?? null;

    const esquemas = leerEsquemasJsonb(f.fin_esquemas_pago);
    const conPlazo = esquemas.filter((e) => e.meses > 0);

    let fuente: FuenteEsquema;
    let precioLista: number | null;
    let plazos: PlazoOpcion[];
    let contado: CondicionContado | null = null;
    let apartadoMxn: number | null = null;

    if (conPlazo.length > 0) {
      fuente = 'esquemas_jsonb';
      const descuentoMax = Math.max(0, ...esquemas.map((e) => e.descuento_pct ?? 0));
      precioLista = reconstruirPrecioLista(
        precioPublicado,
        descuentoMax,
        devId ? precioMinDev.get(devId) ?? null : null,
      );
      plazos =
        precioLista === null
          ? []
          : plazosDesdeJsonb(esquemas, precioLista, precioPublicado, descuentoMax);
      contado = precioLista === null ? null : leerContado(esquemas, precioLista);
    } else {
      precioLista = precioPublicado;
      const esquemaTexto = typeof f.fin_esquema === 'string' ? f.fin_esquema : null;

      const mesesRaw = Array.isArray(f.fin_meses_opciones) ? f.fin_meses_opciones : [];
      const meses = mesesRaw
        .map((m) => numeroONull(m))
        .filter((m): m is number => m !== null)
        .sort((a, z) => a - z);

      // Fuente (b): los `ext_*` planos de la unidad.
      fuente = 'ext_planos';
      plazos = plazosDesdeExtPlanos(
        precioPublicado,
        numeroONull(f.fin_tasa),
        esquemaTexto,
        meses,
      );

      // Fuente (c): el plan descrito en prosa. Último recurso, y por eso mismo
      // el que más falta hacía: sin esto, un desarrollo con plan real a 36
      // meses se publicaba como "no financia".
      if (plazos.length === 0) {
        const enProsa = parsearPreventaProsa(esquemaTexto);
        if (enProsa) {
          fuente = 'prosa_desarrollo';
          plazos = plazosDesdeProsa(precioPublicado, enProsa);
          apartadoMxn = enProsa.apartadoMxn;
        }
      }

      contado = leerContado(esquemas, precioPublicado);
    }

    // El gate, en lenguaje de comprador. Nunca "faltan datos en el sistema".
    let motivoSinPlan: string | null = null;
    if (plazos.length === 0) {
      if (contado && contado.contraentregaPct > 0) {
        // El caso 90/10: describir los dos pagos, porque "de contado" a secas
        // haría creer que se liquida todo al firmar.
        motivoSinPlan =
          `Este lote se paga ${contado.enganchePct}% al firmar y ` +
          `${contado.contraentregaPct}% contra entrega. El desarrollador no ` +
          'publica plan de mensualidades.';
      } else if (contado) {
        motivoSinPlan =
          'Este lote se vende de contado. El desarrollador no publica plan de mensualidades.';
      } else if (precioLista === null) {
        motivoSinPlan =
          'Las condiciones de pago de este lote cambiaron y las estamos confirmando antes de publicarlas.';
      } else {
        motivoSinPlan =
          'Todavía no publicamos las mensualidades de este lote porque falta confirmar la tasa.';
      }
    }

    lotes.push({
      id,
      etiqueta: construirEtiqueta(ciudad, superficieM2, precioLista ?? precioPublicado),
      ciudad,
      superficieM2,
      precioListaMxn: precioLista ?? precioPublicado,
      esDeEstaLanding: devId === ID_DESARROLLO_DE_ESTA_LANDING,
      fuente,
      plazos,
      contado,
      apartadoMxn,
      motivoSinPlan,
    });
  }

  // El lote de la landing primero; el resto por precio ascendente. Quien llegó
  // por este anuncio debe encontrar primero el lote del anuncio.
  return lotes.sort((a, z) => {
    if (a.esDeEstaLanding !== z.esDeEstaLanding) return a.esDeEstaLanding ? -1 : 1;
    return a.precioListaMxn - z.precioListaMxn;
  });
}

/**
 * Lotes de Playa del Carmen para el comparador.
 *
 * La consulta es dinámica a propósito (no una lista de UUIDs): si el Hub
 * aprueba otro lote de PdC, entra solo. Tulum queda fuera por el filtro de
 * ciudad, que es exactamente la decisión de negocio — la LP es campaña de
 * Playa del Carmen.
 *
 * OJO Camino A: no se selecciona `development_name` ni `developer_name`.
 */
export async function getLotesComparables(): Promise<LoteComparable[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];
  const hub = supabase.schema('real_estate_hub' as 'public');

  const { data, error } = await hub
    .from('v_units')
    .select(
      [
        'id',
        'development_id',
        'city',
        'area_m2',
        'price_mxn',
        'unit_type',
        'fin_tasa',
        'fin_esquema',
        'fin_meses_opciones',
        'fin_esquemas_pago',
      ].join(', '),
    )
    .eq('city', 'Playa del Carmen')
    .in('unit_type', ['Lote', 'Terreno'])
    .not('approved_at', 'is', null)
    .eq('published', true)
    .is('deleted_at', null);

  if (error || !data) return [];

  const filas = data as unknown as FilaComparador[];
  if (filas.length === 0) return [];

  // `v_units.area_m2` mapea a `superficie_total_m2`, que en algún registro está
  // vacío aunque `superficie_terreno_m2` sí tenga el dato. Sin superficie no se
  // puede construir la etiqueta acordada, así que se rescata de la tabla base.
  const ids = filas.map((f) => f.id);
  const { data: bases } = await hub
    .from('Propyte_unidades')
    .select('id, superficie_terreno_m2')
    .in('id', ids);
  const superficieBase = new Map(
    ((bases ?? []) as unknown as Record<string, unknown>[]).map((b) => [
      b.id as string,
      numeroONull(b.superficie_terreno_m2),
    ]),
  );

  // Precio mínimo declarado por cada desarrollo: la cifra de control que valida
  // la reconstrucción del precio de lista.
  const devIds = [...new Set(filas.map((f) => f.development_id).filter(Boolean))] as string[];
  const { data: devs } = devIds.length
    ? await hub
        .from('Propyte_desarrollos')
        .select('id, ext_moneda, ext_precio_min_mxn, ext_precio_min_usd')
        .in('id', devIds)
    : { data: null };
  // La cifra de control se compara contra precios de lista EN PESOS, así que sólo
  // sirve si el desarrollo cotiza en pesos. Un desarrollo en USD daría un control
  // de 145,000 contra lotes de millones y marcaría todo como discrepante; se deja
  // en null (sin control) antes que validar contra una moneda distinta.
  const precioMinDev = new Map(
    ((devs ?? []) as unknown as Record<string, unknown>[]).map((d) => {
      const precio = precioDesarrollo(d as FilaPrecioDesarrollo);
      return [d.id as string, precio.moneda === 'MXN' ? precio.min : null] as const;
    }),
  );

  return construirComparables(filas, superficieBase, precioMinDev);
}
