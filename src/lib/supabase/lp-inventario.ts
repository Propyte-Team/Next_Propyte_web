// ============================================================
// Data layer compartido de las landings de inventario (familia v2).
//
// Hermano de `lp-casas.ts`, generalizado: la misma consulta a `v_units` sirve
// a cinco landings que solo cambian el FILTRO (tipo de unidad, ciudad, estado,
// tipo de vista). Hereda las tres reglas de esa familia sin excepción:
//
//  1. GATE DE PUBLICACIÓN. `approved_at IS NOT NULL AND published AND
//     deleted_at IS NULL`. `status` es disponibilidad comercial, no
//     publicación, y además se excluye `Vendida` porque sigue publicada en
//     el Hub con precio.
//  2. CAMINO A. Ni `development_name` ni `developer_name` se seleccionan.
//     Nombrar al desarrollador en pauta pagada es una decisión comercial que
//     nadie ha tomado, y el data layer no puede filtrar lo que no trae.
//  3. DATA-GATE. Toda cifra ausente viaja como `null` y la UI la marca como
//     «Confirmar». Nada se estima en silencio.
//
// DOS GATES NUEVOS, documentados porque excluyen filas publicadas:
//
//  · PRECIO FUERA DE RANGO. Dos departamentos de Tulum declaran $462,612,000
//    y $84,222,000 MXN (2 y 3 recámaras, 87 y 109 m²). No son precios: son
//    capturas erróneas del Hub (centavos, o pesos donde iban dólares). Una
//    landing cuya promesa es «precio real» no puede abrir con ellos. Se
//    excluye cualquier departamento/casa por encima de `PRECIO_MAX_MXN` y se
//    deja constancia aquí para que el hueco se arregle en el Hub, no en el
//    código.
//  · SUPERFICIE ABSURDA. Un lote declara 1 m². La fila se publica, la cifra no:
//    viaja como `null` y la ficha dice «superficie por confirmar».
// ============================================================

import { createPublicSupabaseClient } from '@/lib/supabase/public';

export interface Precio {
  monto: number;
  moneda: 'MXN' | 'USD';
}

export type EstadoComercial = 'disponible' | 'preventa' | 'entrega_inmediata';

export interface PropiedadLanding {
  id: string;
  slug: string;
  titulo: string;
  /** `Casa`, `Villa`, `Departamento`, `Estudio`, `Penthouse`, `Lote`, `Terreno`. */
  tipo: string;
  ciudad: string;
  estado: string;
  /** Colonia / zona declarada. Lo más granular que se publica. */
  zona: string | null;
  recamaras: number | null;
  banos: number | null;
  m2Construidos: number | null;
  m2Terreno: number | null;
  precio: Precio | null;
  precioM2Mxn: number | null;
  enganchePct: number | null;
  engancheMxn: number | null;
  /** Plazos declarados por el desarrollador, en meses. Vacío si no declara. */
  mesesOpciones: number[];
  estacionamientos: number | null;
  alberca: boolean;
  entrega: string | null;
  estadoComercial: EstadoComercial;
  /** `Mar`, `Mar lateral`, `Alberca`, … tal como lo declara el Hub. */
  vista: string | null;
  frenteAlMar: boolean;
  imagen: string | null;
  imagenes: string[];
  /**
   * Créditos que el desarrollador declara aceptar. `true` solo si el Hub lo
   * afirma; `null` y `false` se tratan igual: no se publica. Es el dato que
   * sostiene el gancho «con tu crédito Infonavit» de Mérida.
   */
  creditos: Creditos;
}

export interface Creditos {
  infonavit: boolean;
  fovissste: boolean;
  hipotecario: boolean;
  directo: boolean;
}

export interface FilaInventario {
  id: string;
  slug: string | null;
  title: string | null;
  unit_type: string | null;
  city: string | null;
  state: string | null;
  zone: string | null;
  neighborhood: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  built_area_m2: string | number | null;
  lot_area_m2: string | number | null;
  area_m2: string | number | null;
  price_mxn: string | number | null;
  price_usd: string | number | null;
  currency: string | null;
  down_payment_pct: string | number | null;
  down_payment_mxn: string | number | null;
  fin_enganche_pct: string | number | null;
  fin_meses_opciones: number[] | null;
  parking_spots: number | null;
  has_pool: boolean | null;
  tipo_entrega: string | null;
  is_presale: boolean | null;
  status: string | null;
  view_type: string | null;
  cover_image: string | null;
  images: string[] | null;
  /** Opcionales: las pruebas y los adaptadores viejos no los traen. */
  fin_infonavit?: boolean | null;
  fin_fovissste?: boolean | null;
  fin_hipotecario?: boolean | null;
  fin_directo?: boolean | null;
}

export interface FiltroInventario {
  tipos?: readonly string[];
  ciudades?: readonly string[];
  estados?: readonly string[];
  /** Si viene, solo pasan las filas cuyo `view_type` esté aquí. */
  vistas?: readonly string[];
}

export const TIPOS_CASA = ['Casa', 'Villa'] as const;
export const TIPOS_DEPTO = ['Departamento', 'Estudio', 'Penthouse'] as const;
export const TIPOS_TERRENO = ['Lote', 'Terreno'] as const;
export const VISTAS_MAR = ['Mar', 'Mar lateral'] as const;

/** Tipo de cambio SOLO para ordenar. Nunca se imprime una cifra convertida. */
const FX_SOLO_ORDEN = 18.5;

/** Por encima de esto, una casa o departamento es una captura errónea. */
const PRECIO_MAX_MXN = 80_000_000;
/** Por debajo de esto, una superficie es un error de captura, no un dato. */
const SUPERFICIE_MIN_M2 = 15;

const COLUMNAS = [
  'id', 'slug', 'title', 'unit_type', 'city', 'state', 'zone', 'neighborhood',
  'bedrooms', 'bathrooms', 'built_area_m2', 'lot_area_m2', 'area_m2',
  'price_mxn', 'price_usd', 'currency',
  'down_payment_pct', 'down_payment_mxn', 'fin_enganche_pct', 'fin_meses_opciones',
  'parking_spots', 'has_pool', 'tipo_entrega', 'is_presale', 'status', 'view_type',
  'cover_image', 'images',
  'fin_infonavit', 'fin_fovissste', 'fin_hipotecario', 'fin_directo',
].join(',');

function num(valor: string | number | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : null;
}

function superficie(valor: string | number | null | undefined): number | null {
  const n = num(valor);
  return n !== null && n >= SUPERFICIE_MIN_M2 ? n : null;
}

function resolverPrecio(fila: FilaInventario): Precio | null {
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
 * Galería de la UNIDAD primero, portada del desarrollo de respaldo.
 * `cover_image` es la misma para todas las unidades de un desarrollo; en una
 * cuadrícula produce fotos repetidas y se lee como inventario inflado.
 */
function resolverImagenes(fila: FilaInventario): { imagen: string | null; imagenes: string[] } {
  const galeria = (fila.images ?? []).filter(
    (u): u is string => typeof u === 'string' && u.startsWith('http'),
  );
  const unicas = Array.from(new Set(galeria));
  const portada = typeof fila.cover_image === 'string' ? fila.cover_image : null;
  return {
    imagen: unicas[0] ?? portada,
    imagenes: unicas.length > 0 ? unicas : portada ? [portada] : [],
  };
}

function estadoComercial(fila: FilaInventario): EstadoComercial {
  const s = (fila.status ?? '').toLowerCase();
  if (s.includes('inmediata')) return 'entrega_inmediata';
  if (s.includes('preventa') || fila.is_presale === true) return 'preventa';
  return 'disponible';
}

function esTerreno(tipo: string): boolean {
  return (TIPOS_TERRENO as readonly string[]).includes(tipo);
}

function mapear(fila: FilaInventario): PropiedadLanding | null {
  if (!fila.slug || !fila.title || !fila.unit_type) return null;
  if ((fila.status ?? '').toLowerCase() === 'vendida') return null;

  const precio = resolverPrecio(fila);
  if (!precio) return null;
  if (!esTerreno(fila.unit_type) && precio.moneda === 'MXN' && precio.monto > PRECIO_MAX_MXN) {
    return null;
  }

  const { imagen, imagenes } = resolverImagenes(fila);
  const m2Terreno =
    superficie(fila.lot_area_m2) ?? (esTerreno(fila.unit_type) ? superficie(fila.area_m2) : null);
  const m2Construidos =
    superficie(fila.built_area_m2) ?? (esTerreno(fila.unit_type) ? null : superficie(fila.area_m2));
  const base = esTerreno(fila.unit_type) ? m2Terreno : m2Construidos;
  const precioM2Mxn = precio.moneda === 'MXN' && base ? Math.round(precio.monto / base) : null;

  const vista = fila.view_type?.trim() || null;

  return {
    id: fila.id,
    slug: fila.slug,
    titulo: fila.title.trim(),
    tipo: fila.unit_type,
    ciudad: fila.city ?? '',
    estado: fila.state ?? '',
    zona: fila.zone?.trim() || fila.neighborhood?.trim() || null,
    recamaras: fila.bedrooms || null,
    banos: fila.bathrooms || null,
    m2Construidos,
    m2Terreno,
    precio,
    precioM2Mxn,
    enganchePct: num(fila.fin_enganche_pct) ?? num(fila.down_payment_pct),
    engancheMxn: num(fila.down_payment_mxn),
    mesesOpciones: (fila.fin_meses_opciones ?? []).filter((m) => Number.isFinite(m) && m > 0),
    estacionamientos: fila.parking_spots || null,
    alberca: fila.has_pool === true,
    entrega: fila.tipo_entrega?.trim() || null,
    estadoComercial: estadoComercial(fila),
    vista,
    frenteAlMar: vista !== null && (VISTAS_MAR as readonly string[]).includes(vista),
    imagen,
    imagenes,
    creditos: {
      infonavit: fila.fin_infonavit === true,
      fovissste: fila.fin_fovissste === true,
      hipotecario: fila.fin_hipotecario === true,
      directo: fila.fin_directo === true,
    },
  };
}

function valorOrden(p: PropiedadLanding): number {
  if (!p.precio) return Number.POSITIVE_INFINITY;
  return p.precio.moneda === 'USD' ? p.precio.monto * FX_SOLO_ORDEN : p.precio.monto;
}

function pasaFiltro(fila: FilaInventario, filtro: FiltroInventario): boolean {
  if (filtro.tipos && !filtro.tipos.includes(fila.unit_type ?? '')) return false;
  if (filtro.ciudades && !filtro.ciudades.includes(fila.city ?? '')) return false;
  if (filtro.estados && !filtro.estados.includes(fila.state ?? '')) return false;
  if (filtro.vistas && !filtro.vistas.includes(fila.view_type ?? '')) return false;
  return true;
}

/**
 * Transformación pura, separada de la red para poder probarla contra filas
 * reales de producción. Orden ascendente por valor comparable: la primera
 * tarjeta que ve el tráfico pagado es la entrada más accesible.
 */
export function construirInventario(
  filas: FilaInventario[],
  filtro: FiltroInventario = {},
): PropiedadLanding[] {
  return filas
    .filter((f) => pasaFiltro(f, filtro))
    .map(mapear)
    .filter((p): p is PropiedadLanding => p !== null)
    .sort((a, b) => valorOrden(a) - valorOrden(b));
}

/**
 * Inventario publicado que pasa el filtro. Tipo, ciudad, estado y vista van a
 * la consulta; el resto se resuelve en memoria.
 */
export async function getInventario(filtro: FiltroInventario = {}): Promise<PropiedadLanding[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];

  let consulta = supabase
    .schema('real_estate_hub')
    .from('v_units')
    .select(COLUMNAS)
    .not('approved_at', 'is', null)
    .eq('published', true)
    .is('deleted_at', null);

  if (filtro.tipos) consulta = consulta.in('unit_type', [...filtro.tipos]);
  if (filtro.ciudades) consulta = consulta.in('city', [...filtro.ciudades]);
  if (filtro.estados) consulta = consulta.in('state', [...filtro.estados]);
  if (filtro.vistas) consulta = consulta.in('view_type', [...filtro.vistas]);

  const { data, error } = await consulta;
  if (error || !data) return [];

  return construirInventario(data as unknown as FilaInventario[], filtro);
}

export interface Ubicacion {
  /** Clave estable para chips y hash: `playa-del-carmen`. */
  clave: string;
  nombre: string;
  total: number;
}

export function claveUbicacion(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Ubicaciones con inventario, en orden de volumen. `nivel` decide si el chip
 * es la ciudad (varias ciudades en juego) o la zona (una sola ciudad, donde
 * filtrar por ciudad no filtra nada).
 */
export function ubicaciones(
  propiedades: PropiedadLanding[],
  nivel: 'ciudad' | 'zona' = 'ciudad',
): Ubicacion[] {
  const conteo = new Map<string, number>();
  for (const p of propiedades) {
    const nombre = nivel === 'ciudad' ? p.ciudad : (p.zona ?? p.ciudad);
    if (!nombre) continue;
    conteo.set(nombre, (conteo.get(nombre) ?? 0) + 1);
  }
  return [...conteo.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .map(([nombre, total]) => ({ clave: claveUbicacion(nombre), nombre, total }));
}

export function ubicacionDe(p: PropiedadLanding, nivel: 'ciudad' | 'zona' = 'ciudad'): string {
  return claveUbicacion(nivel === 'ciudad' ? p.ciudad : (p.zona ?? p.ciudad));
}

export interface ResumenInventario {
  total: number;
  desde: Precio | null;
  hasta: Precio | null;
  engancheMinimoPct: number | null;
  ciudades: string[];
}

/** Cifras de encabezado derivadas del inventario, nunca escritas a mano. */
export function resumenInventario(propiedades: PropiedadLanding[]): ResumenInventario {
  const enganches = propiedades
    .map((p) => p.enganchePct)
    .filter((p): p is number => p !== null && p > 0);
  return {
    total: propiedades.length,
    desde: propiedades[0]?.precio ?? null,
    hasta: propiedades[propiedades.length - 1]?.precio ?? null,
    engancheMinimoPct: enganches.length > 0 ? Math.min(...enganches) : null,
    ciudades: ubicaciones(propiedades, 'ciudad').map((u) => u.nombre),
  };
}
