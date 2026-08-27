// ============================================================
// Data layer de la landing de pago de casas — Riviera Maya (Google/Meta Ads).
//
// Hermana de `lp-lotes.ts`, y hereda sus tres reglas con una diferencia de
// fondo: aquí el protagonista NO es una unidad, es un INVENTARIO. La página
// existe para que alguien que busca «casas en venta en Playa del Carmen» vea
// que hay casas reales, con precio real, y deje sus datos.
//
//  1. GATE DE PUBLICACIÓN. `status` es disponibilidad comercial, NO estado de
//     publicación. El gate real del sitio es `approved_at IS NOT NULL AND
//     published AND deleted_at IS NULL`. Sin él entran ~170 casas sin aprobar,
//     muchas con precio nulo, y la landing publica inventario fantasma.
//
//  2. CAMINO A, CON SU LÍMITE DICHO. Este módulo NO selecciona
//     `development_name` ni `developer_name`, que es lo que `v_units` expone y
//     lo único que el data layer puede garantizar: nombrar al desarrollador en
//     pauta pagada es una decisión comercial que nadie ha tomado.
//
//     Lo que NO puede garantizar: el `title` es copy editorial que Propyte
//     escribe en el Hub, y uno de los once lo lleva dentro —«Casa 2 Recámaras
//     con Alberca en Amares Riviera Maya»—. No se sanea aquí a propósito. Una
//     lista negra de nombres comerciales se desactualiza en cuanto entra un
//     desarrollo nuevo, y recortar el título por heurística produce frases
//     mutiladas en la tarjeta. Si la política importa para esta campaña, el
//     arreglo es de UNA línea y va en el Hub: editar ese título. Se deja
//     escrito para que el hueco sea una decisión y no un descuido.
//
//  3. DATA-GATE. Toda cifra ausente viaja como `null` y la UI la renderiza
//     como chip [CONFIRMAR]. Nada de estimaciones silenciosas ni de guiones.
//
// UNA CIFRA ESTÁ DELIBERADAMENTE EXCLUIDA: `monthly_payment_mxn`. El registro
// declara $410,479 y $363,333 "mensuales" en dos casas de 5.7 y 10.9 millones
// — no son mensualidades, es un dato mal capturado en el Hub. El enganche sí
// cuadra contra el precio en las ocho casas que lo declaran (10% de 4,404,750
// = 440,475; 30% de 14,689,501 = 4,406,850), así que ese sí se publica.
// Publicar la mensualidad tal cual sería mentirle al prospecto en la cifra que
// más pesa en su decisión. Cuando el Hub la corrija, se añade aquí.
// ============================================================

// Cliente SIN cookies: la landing declara `revalidate`, y el cliente con
// cookies() rompe el prerender con DYNAMIC_SERVER_USAGE.
import { createPublicSupabaseClient } from '@/lib/supabase/public';

/** Ciudades que componen «Riviera Maya» para efectos de esta campaña. */
const CIUDADES = ['Playa del Carmen', 'Tulum'] as const;

/**
 * Tipos de unidad que un anuncio de «casas» puede prometer honestamente.
 * `Villa` entra porque las tres publicadas en Aldea Zamá son casas unifamiliares
 * en privada — el registro las tipifica como villa por producto, no por forma.
 */
const TIPOS = ['Casa', 'Villa'] as const;

/**
 * Tipo de cambio usado EXCLUSIVAMENTE para ordenar la lista cuando conviven
 * precios en MXN y USD. Nunca se usa para mostrar una cifra convertida: las dos
 * casas en dólares se publican en dólares. Un tipo de cambio inventado en una
 * página de conversión es una cifra que el asesor tendrá que desmentir.
 */
const FX_SOLO_ORDEN = 18.5;

export interface Precio {
  monto: number;
  moneda: 'MXN' | 'USD';
}

export interface CasaLanding {
  id: string;
  slug: string;
  titulo: string;
  ciudad: string;
  /** Colonia/zona declarada. Es lo más granular que la landing publica. */
  zona: string | null;
  recamaras: number | null;
  banos: number | null;
  /** Superficie construida. Es la que el comprador de casa compara. */
  m2Construidos: number | null;
  m2Terreno: number | null;
  precio: Precio | null;
  enganchePct: number | null;
  engancheMxn: number | null;
  estacionamientos: number | null;
  alberca: boolean;
  /** 'Equipada', 'Turnkey (llave en mano)', etc. null ⇒ gate. */
  entrega: string | null;
  preventa: boolean;
  /** Foto principal. Prioriza foto de la UNIDAD sobre portada del desarrollo. */
  imagen: string | null;
  /** Galería completa, ya deduplicada. */
  imagenes: string[];
}

/** Fila cruda de `v_units`. Solo las columnas que este módulo selecciona. */
export interface FilaUnidad {
  id: string;
  slug: string | null;
  title: string | null;
  city: string | null;
  zone: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  built_area_m2: string | number | null;
  lot_area_m2: string | number | null;
  price_mxn: string | number | null;
  price_usd: string | number | null;
  currency: string | null;
  down_payment_pct: string | number | null;
  down_payment_mxn: string | number | null;
  fin_enganche_pct: string | number | null;
  parking_spots: number | null;
  has_pool: boolean | null;
  tipo_entrega: string | null;
  is_presale: boolean | null;
  cover_image: string | null;
  images: string[] | null;
}

/** `numeric` de Postgres llega como string por el SDK. Null-safe. */
function num(valor: string | number | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : null;
}

/**
 * Resuelve el precio respetando la moneda declarada.
 *
 * El registro guarda `price_mxn` Y `price_usd` como columnas separadas y solo
 * puebla la que corresponde. `currency` es la que manda; si falta, se infiere
 * de cuál columna trae valor. Un fallback al revés publicaría 419,800 con
 * signo de peso en una casa de medio millón de dólares.
 */
function resolverPrecio(fila: FilaUnidad): Precio | null {
  const mxn = num(fila.price_mxn);
  const usd = num(fila.price_usd);
  const declarada = fila.currency === 'USD' ? 'USD' : fila.currency === 'MXN' ? 'MXN' : null;

  if (declarada === 'USD' && usd && usd > 0) return { monto: usd, moneda: 'USD' };
  if (declarada === 'MXN' && mxn && mxn > 0) return { monto: mxn, moneda: 'MXN' };
  if (mxn && mxn > 0) return { monto: mxn, moneda: 'MXN' };
  if (usd && usd > 0) return { monto: usd, moneda: 'USD' };
  return null;
}

/**
 * Foto principal: primero la galería de la UNIDAD, luego la portada.
 *
 * `cover_image` apunta a `/property-images/desarrollo/...` — es la portada del
 * DESARROLLO, la misma para todas sus unidades. En una cuadrícula de once
 * casas eso produce fotos repetidas (las tres de Anthar saldrían idénticas) y
 * el visitante lee «inventario inflado». `images[]` sí cuelga de
 * `/property-images/unidad/...` y es distinta por casa.
 */
function resolverImagenes(fila: FilaUnidad): { imagen: string | null; imagenes: string[] } {
  const galeria = (fila.images ?? []).filter(
    (u): u is string => typeof u === 'string' && u.startsWith('http'),
  );
  const unicas = Array.from(new Set(galeria));
  const portada = typeof fila.cover_image === 'string' ? fila.cover_image : null;
  return { imagen: unicas[0] ?? portada, imagenes: unicas.length > 0 ? unicas : portada ? [portada] : [] };
}

function mapear(fila: FilaUnidad): CasaLanding | null {
  // Sin slug o sin título no hay ficha que referenciar en el CRM ni titular que
  // imprimir. Se descarta en vez de renderizar una tarjeta anónima.
  if (!fila.slug || !fila.title) return null;

  const { imagen, imagenes } = resolverImagenes(fila);
  const precio = resolverPrecio(fila);

  // `fin_enganche_pct` y `down_payment_pct` declaran lo mismo por dos rutas de
  // captura distintas del Hub. Coinciden donde ambas existen; se prefiere la
  // del bloque financiero por ser la que el desarrollador edita.
  const enganchePct = num(fila.fin_enganche_pct) ?? num(fila.down_payment_pct);

  return {
    id: fila.id,
    slug: fila.slug,
    titulo: fila.title.trim(),
    ciudad: fila.city ?? '',
    zona: fila.zone?.trim() || null,
    recamaras: fila.bedrooms ?? null,
    banos: fila.bathrooms ?? null,
    m2Construidos: num(fila.built_area_m2),
    m2Terreno: num(fila.lot_area_m2),
    precio,
    enganchePct,
    engancheMxn: num(fila.down_payment_mxn),
    estacionamientos: fila.parking_spots ?? null,
    alberca: fila.has_pool === true,
    entrega: fila.tipo_entrega?.trim() || null,
    preventa: fila.is_presale === true,
    imagen,
    imagenes,
  };
}

/**
 * Transformación pura de filas crudas a inventario publicable.
 *
 * Separada de `getCasasRivieraMaya` para poder probarla contra filas REALES de
 * producción sin tocar la red. Toda la lógica que puede publicar una cifra
 * equivocada —moneda, enganche, elección de foto, descarte por falta de
 * precio— vive aquí y está cubierta en `lp-casas.test.ts`.
 */
export function construirInventario(filas: FilaUnidad[]): CasaLanding[] {
  return filas
    .map(mapear)
    .filter((c): c is CasaLanding => c !== null)
    // Una casa sin precio no puede aparecer en una landing cuya promesa es
    // «precios reales». Se cae aquí, no en la UI.
    .filter((c) => c.precio !== null)
    .sort((a, b) => valorOrden(a) - valorOrden(b));
}

/** Valor comparable en MXN. Solo para ordenar — nunca se imprime. */
function valorOrden(casa: CasaLanding): number {
  if (!casa.precio) return Number.POSITIVE_INFINITY;
  return casa.precio.moneda === 'USD' ? casa.precio.monto * FX_SOLO_ORDEN : casa.precio.monto;
}

/**
 * Inventario publicado de casas en la Riviera Maya, de menor a mayor precio.
 *
 * Ascendente a propósito: la primera tarjeta que ve alguien que llegó por
 * «casas en venta en Playa del Carmen» debe ser la de entrada más accesible.
 * Abrir con la casa de 14.7 millones descalifica al 90% del tráfico pagado
 * antes de que llegue al formulario.
 */
export async function getCasasRivieraMaya(): Promise<CasaLanding[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .schema('real_estate_hub')
    .from('v_units')
    .select(
      [
        'id', 'slug', 'title', 'city', 'zone',
        'bedrooms', 'bathrooms', 'built_area_m2', 'lot_area_m2',
        'price_mxn', 'price_usd', 'currency',
        'down_payment_pct', 'down_payment_mxn', 'fin_enganche_pct',
        'parking_spots', 'has_pool', 'tipo_entrega', 'is_presale',
        'cover_image', 'images',
      ].join(','),
    )
    .in('unit_type', TIPOS as unknown as string[])
    .in('city', CIUDADES as unknown as string[])
    .not('approved_at', 'is', null)
    .eq('published', true)
    .is('deleted_at', null);

  if (error || !data) return [];

  return construirInventario(data as unknown as FilaUnidad[]);
}

export interface ResumenInventario {
  total: number;
  /** Precio más bajo del inventario, en su moneda original. */
  desde: Precio | null;
  /** Ciudades con inventario, en orden de volumen. */
  ciudades: string[];
  /** Enganche mínimo declarado, en %. null si ninguna casa lo declara. */
  engancheMinimoPct: number | null;
}

/**
 * Cifras de encabezado derivadas del inventario, nunca escritas a mano.
 *
 * Existe para que el titular («Once casas desde X») no pueda desincronizarse
 * del listado que hay debajo. Si mañana se venden dos casas, el titular cambia
 * solo en la siguiente revalidación.
 */
export function resumenInventario(casas: CasaLanding[]): ResumenInventario {
  const conteo = new Map<string, number>();
  for (const casa of casas) {
    if (casa.ciudad) conteo.set(casa.ciudad, (conteo.get(casa.ciudad) ?? 0) + 1);
  }

  const enganches = casas
    .map((c) => c.enganchePct)
    .filter((p): p is number => p !== null && p > 0);

  return {
    total: casas.length,
    // La lista ya viene ordenada ascendente por valor comparable.
    desde: casas[0]?.precio ?? null,
    ciudades: [...conteo.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c),
    engancheMinimoPct: enganches.length > 0 ? Math.min(...enganches) : null,
  };
}
