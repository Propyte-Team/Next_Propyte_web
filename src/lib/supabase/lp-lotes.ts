// ============================================================
// Data layer de la landing de pago de lotes (Google Ads).
// Spec: specs/lp-lotes-playa-del-carmen.md
//
// Tres reglas que gobiernan este archivo:
//
//  1. GATE DE PUBLICACIÓN. `status`/`estado_unidad` es disponibilidad
//     comercial, NO estado de publicación. El gate del sitio es
//     `approved_at IS NOT NULL AND published`. Sin él, un filtro por tipo
//     terreno devuelve ~100 registros sin aprobar y con superficie nula.
//
//  2. CAMINO A. Ningún nombre de desarrollo ni de desarrollador puede llegar
//     al DOM. `v_units` expone `development_name` y `developer_name`, y los
//     JSONB `servicios`/`costos_adicionales` traen el nombre del desarrollador
//     dentro de claves meta (`_fuente`, `_nota`). Este módulo NO selecciona los
//     primeros y hace whitelist explícita de los segundos. Nunca serialices un
//     JSONB de estos crudo hacia el cliente.
//
//  3. DATA-GATE. Toda cifra ausente se representa como `null` y la UI la
//     renderiza como chip [CONFIRMAR]. Nada de estimaciones silenciosas, nada
//     de guiones, nada de vacíos.
// ============================================================

// Cliente SIN cookies a propósito: la landing declara `revalidate = 300`, y
// `createServerSupabaseClient()` usa cookies(), lo que rompe el prerender con
// DYNAMIC_SERVER_USAGE (el mismo fallo que ya arrastra /exclusivos).
import { createPublicSupabaseClient } from '@/lib/supabase/public';

/** Estados de urbanización que el registro puede declarar por servicio. */
export type EstadoServicio = 'disponible' | 'en_proceso' | 'proyectado';

export interface ServicioUrbanizacion {
  clave: string;
  etiqueta: string;
  estado: EstadoServicio;
  /** 'YYYY-MM' declarado por el desarrollador, o null si no hay fecha. */
  fechaEstimada: string | null;
  detalle: string | null;
}

export interface CargoUnico {
  concepto: string;
  monto: string;
  momento: string;
  reembolsable: boolean | null;
}

export interface CostosAdicionales {
  /** Gastos de cierre como rango de % sobre el valor de venta. */
  cierrePctMin: number | null;
  cierrePctMax: number | null;
  cierreBase: string | null;
  cierreExcluye: string | null;
  mantenimientoMxnMin: number | null;
  mantenimientoMxnMax: number | null;
  mantenimientoPeriodicidad: string | null;
  /** true si el registro declara el monto como aún no definido. */
  mantenimientoPorDefinir: boolean;
  cargosUnicos: CargoUnico[];
}

export interface OpcionPlazo {
  /** Meses declarados en el catálogo (48, 60). */
  meses: number;
  /** Pagos mensuales reales: el último es la contraentrega, no una mensualidad. */
  pagos: number;
  mensualidadMxn: number;
}

/**
 * Plan de pagos derivado del esquema que declara el desarrollador.
 *
 * NO se capturan importes a mano: se parsean los tres porcentajes del texto de
 * `ext_esquema_pago` y todo lo demás se calcula. Si el texto cambia de forma y
 * deja de parsear, `parsearEsquema` devuelve null y la UI publica gates en vez
 * de cifras inventadas.
 */
export interface PlanPago {
  enganchePct: number;
  engancheMxn: number;
  mensualidadesPct: number;
  mensualidadesTotalMxn: number;
  contraentregaPct: number;
  contraentregaMxn: number;
  opciones: OpcionPlazo[];
  /** true solo si la tasa está declarada explícitamente en 0. */
  sinIntereses: boolean;
}

/**
 * Aprovechamiento del lote, derivado de COS y CUS.
 *
 * COS y CUS no son columnas: vienen de la ficha técnica del desarrollador y ya
 * se publican como prosa en el bloque jurídico. Se declaran aquí una sola vez
 * para que la aritmética y el texto no puedan divergir.
 *
 * La consecuencia (cuántos m² se pueden construir) NO es un dato nuevo que
 * requiera fuente propia: es multiplicación sobre dos hechos ya publicados.
 */
export interface Aprovechamiento {
  cos: number;
  cus: number;
  /** Huella máxima en planta: superficie × COS. */
  huellaM2: number;
  /** Superficie máxima construible sumando niveles: superficie × CUS. */
  construibleM2: number;
  /**
   * Niveles que la relación CUS/COS permite, truncados hacia abajo. Se trunca
   * en vez de redondear: prometer un nivel que no cabe es exactamente el tipo
   * de afirmación que esta página existe para no hacer.
   */
  niveles: number;
}

/** Imagen ya curada, con su alt escrito a mano. */
export interface ImagenLanding {
  url: string;
  alt: string;
}

/**
 * Las cuatro imágenes que usa la página, por rol narrativo. Cada una es null si
 * el archivo curado ya no está en la galería del desarrollo.
 */
export interface ImagenesLanding {
  hero: ImagenLanding | null;
  /** Amenidad con gente. Sostiene el bloque "Un domingo aquí". */
  domingo: ImagenLanding | null;
  /** Amenidad distinta de la del hero y de la de `domingo`. */
  amenidades: ImagenLanding | null;
  /** Aérea real del polígono: tierra, sin urbanizar. Sostiene la sección de servicios. */
  urbanizacion: ImagenLanding | null;
}

export interface AsesorLanding {
  nombre: string;
  rol: string;
  fotoUrl: string | null;
  whatsapp: string | null;
}

export interface OficinaLanding {
  direccion: string;
  horario: string;
}

export interface LicenciaDesarrollo {
  licenciaNumero: string | null;
  licenciaFecha: string | null;
  autorizacionNumero: string | null;
  autorizacionFecha: string | null;
  /** true solo si los cuatro campos están presentes. */
  completa: boolean;
}

export interface LoteLanding {
  id: string;
  slug: string;
  /** Título de la unidad. Verificado libre de nombre comercial antes de usar. */
  titulo: string;
  ciudad: string | null;
  zona: string | null;
  superficieM2: number | null;
  precioMxn: number | null;
  /**
   * MXN/m² CALCULADO, no leído. `v_units.price_per_m2_mxn` es una columna
   * almacenada que puede quedar desincronizada del precio; el criterio de
   * aceptación pide que sea derivado.
   */
  precioM2Mxn: number | null;
  enganchePct: number | null;
  /**
   * Enganche en pesos, derivado de precio × pct.
   *
   * Vive FUERA de `plan` a propósito. `plan` es null mientras falte la tasa, y
   * cuando el hero leía el enganche desde ahí publicaba «sin dato» cuatro
   * bloques encima de una ficha que sí mostraba la cifra. El enganche no
   * depende de la tasa: no tiene por qué caerse con ella.
   */
  engancheMxn: number | null;
  /** Tasa anual de financiamiento. null ⇒ la mensualidad NO se publica. */
  tasaAnual: number | null;
  mesesOpciones: number[];
  mesesNota: string | null;
  esquemaPago: string | null;
  /** Subtipo literal del registro ("Lote semi urbanizado"), sin eufemismos. */
  subtipoLiteral: string | null;
  regimenPropiedad: string | null;
  usoSuelo: string | null;
  /** Texto crudo del registro sobre escrituración. Puede traer advertencias. */
  escrituracionNota: string | null;
  escrituraDisponibleHoy: boolean;
  rentasCortoPlazoPermitidas: boolean | null;
  imagenPortada: string | null;
  /** Selección curada a mano. Ver `IMAGENES_CURADAS`: la galería NO se itera. */
  imagenes: ImagenesLanding;
  servicios: ServicioUrbanizacion[];
  /** true si el registro declara explícitamente que hoy no hay servicios. */
  ningunServicioHoy: boolean;
  costos: CostosAdicionales | null;
  licencia: LicenciaDesarrollo;
  /** Amenidades del desarrollo desde columnas booleanas, no desde prosa. */
  amenidades: string[];
  /** Lotes totales de la privada (`unidades_totales`). */
  lotesTotalesPrivada: number | null;
  /** null si falta la superficie: sin ella no hay nada que multiplicar. */
  aprovechamiento: Aprovechamiento | null;
  /** null si falta la tasa o si el esquema de pago no parsea. */
  plan: PlanPago | null;
  asesor: AsesorLanding | null;
  oficina: OficinaLanding | null;
  /** Fecha de corte de la consulta, para el chip de disponibilidad. */
  fechaCorte: string;
}

/**
 * Nombres comerciales que NUNCA pueden llegar al DOM (Camino A). Se usan como
 * red de seguridad en `sanitizarTexto`: si un campo editorial los contiene, el
 * campo se descarta en lugar de publicarse.
 */
const NOMBRES_PROHIBIDOS = [
  'gran coralia',
  'coralia',
  'ancestral',
  'aztro',
  'ipal',
  'serena',
  'marina',
];

/**
 * Los nombres se buscan como PALABRA COMPLETA, no como subcadena.
 *
 * Con `includes` la lista era a la vez demasiado laxa y demasiado agresiva:
 * `ipal` casa dentro de "municipal", y esta página dice "licencia municipal" y
 * "autorización de venta municipal" once veces porque el artículo 69 de la Ley
 * de Asentamientos Urbanos de Q. Roo la obliga a decirlo. Cualquier campo que
 * el Hub capturara con esa palabra —el número de licencia, el uso de suelo— se
 * habría descartado en silencio y la página habría publicado un gate encima de
 * un dato que sí existe. Hoy ningún registro cae en el caso (verificado contra
 * la base), pero el modo de fallo es invisible: no hay error, solo un dato que
 * no aparece.
 *
 * `marina` y `serena` tenían el mismo problema con palabras corrientes.
 *
 * Esto NO debilita Camino A: los límites de palabra siguen atrapando el nombre
 * suelto, entre comillas, con guiones o pegado a puntuación, que es como
 * aparece un nombre comercial en un texto editorial. Y `coralia` se añade por
 * separado para que el nombre corto también quede cubierto.
 */
const PATRONES_PROHIBIDOS = NOMBRES_PROHIBIDOS.map(
  (n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
);

/**
 * Descarta un texto si contiene un nombre comercial prohibido. Devuelve null
 * en ese caso para que la UI muestre [CONFIRMAR] en vez de filtrar la marca.
 *
 * Recordatorio: esto solo lee CADENAS. No puede ver un nombre rotulado dentro
 * de un render. Por eso las imágenes van por lista blanca (`IMAGENES_CURADAS`)
 * y la galería no se itera nunca.
 */
function sanitizarTexto(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim();
  if (!limpio) return null;
  if (PATRONES_PROHIBIDOS.some((re) => re.test(limpio))) return null;
  return limpio;
}

function numeroONull(valor: unknown): number | null {
  // Los NUMERIC de Postgres llegan como string por PostgREST.
  if (valor === null || valor === undefined || valor === '') return null;
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : null;
}

/** Etiquetas legibles de las claves de servicio del registro. */
const ETIQUETA_SERVICIO: Record<string, string> = {
  agua_potable: 'Agua potable',
  drenaje: 'Drenaje sanitario',
  electricidad: 'Energía eléctrica',
  alumbrado_publico: 'Alumbrado público',
  calle: 'Vialidad',
  pluvial: 'Drenaje pluvial',
};

const ESTADOS_VALIDOS: EstadoServicio[] = ['disponible', 'en_proceso', 'proyectado'];

/**
 * Extrae los servicios del JSONB con whitelist de claves. Ignora toda clave
 * que empiece con `_` (son metadatos internos: `_fuente`, `_nota`) porque
 * contienen el nombre del desarrollador.
 */
function mapearServicios(raw: unknown): {
  servicios: ServicioUrbanizacion[];
  ningunServicioHoy: boolean;
} {
  if (!raw || typeof raw !== 'object') {
    return { servicios: [], ningunServicioHoy: false };
  }
  const obj = raw as Record<string, unknown>;

  // El registro puede declarar en su nota interna que hoy no hay servicios.
  // Leemos la señal SIN publicar el texto (nombra etapas comerciales).
  const notaInterna = typeof obj._nota === 'string' ? obj._nota.toLowerCase() : '';
  const ningunServicioHoy =
    notaInterna.includes('ningun servicio') || notaInterna.includes('ningún servicio');

  const servicios: ServicioUrbanizacion[] = [];
  for (const [clave, valor] of Object.entries(obj)) {
    if (clave.startsWith('_')) continue;
    if (!valor || typeof valor !== 'object') continue;
    const v = valor as Record<string, unknown>;
    const estadoRaw = typeof v.estado === 'string' ? v.estado : '';
    const estado = ESTADOS_VALIDOS.includes(estadoRaw as EstadoServicio)
      ? (estadoRaw as EstadoServicio)
      : 'proyectado';
    servicios.push({
      clave,
      etiqueta: ETIQUETA_SERVICIO[clave] ?? clave.replace(/_/g, ' '),
      estado,
      fechaEstimada: typeof v.fecha_estimada === 'string' ? v.fecha_estimada : null,
      detalle: sanitizarTexto(v.detalle),
    });
  }
  return { servicios, ningunServicioHoy };
}

/** Igual que `mapearServicios`: whitelist de claves, se ignoran las `_*`. */
function mapearCostos(raw: unknown): CostosAdicionales | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const cierre = (obj.costos_cierre ?? {}) as Record<string, unknown>;
  const mant = (obj.mantenimiento ?? {}) as Record<string, unknown>;
  const cargosRaw = Array.isArray(obj.cargos_unicos) ? obj.cargos_unicos : [];

  const cargosUnicos: CargoUnico[] = [];
  for (const c of cargosRaw) {
    if (!c || typeof c !== 'object') continue;
    const cc = c as Record<string, unknown>;
    const concepto = sanitizarTexto(cc.concepto);
    if (!concepto) continue;
    cargosUnicos.push({
      concepto,
      monto: sanitizarTexto(cc.monto) ?? 'por definir',
      momento: sanitizarTexto(cc.momento) ?? 'por definir',
      reembolsable: typeof cc.reembolsable === 'boolean' ? cc.reembolsable : null,
    });
  }

  return {
    cierrePctMin: numeroONull(cierre.pct_min),
    cierrePctMax: numeroONull(cierre.pct_max),
    cierreBase: sanitizarTexto(cierre.base),
    cierreExcluye: sanitizarTexto(cierre.excluye),
    mantenimientoMxnMin: numeroONull(mant.mxn_min),
    mantenimientoMxnMax: numeroONull(mant.mxn_max),
    mantenimientoPeriodicidad: sanitizarTexto(mant.periodicidad),
    mantenimientoPorDefinir: mant.estado === 'por_definir',
    cargosUnicos,
  };
}

/**
 * Extrae los tres porcentajes del esquema de pago declarado.
 *
 * El registro publica algo como "20% de enganche + 60% en mensualidades + 20%
 * contraentrega". Se parsean en orden de aparición y se exige que sumen 100:
 * si no suman, el esquema no se entendió y es mejor no publicar aritmética.
 *
 * Parsear prosa es frágil a propósito frente a la alternativa: hardcodear
 * 20/60/20 en el código haría que un cambio de condiciones del desarrollador no
 * se reflejara nunca en la página.
 */
function parsearEsquema(
  texto: string | null,
): { enganchePct: number; mensualidadesPct: number; contraentregaPct: number } | null {
  if (!texto) return null;
  const pcts = [...texto.matchAll(/(\d{1,3})\s*%/g)].map((m) => Number(m[1]));
  if (pcts.length !== 3) return null;
  const [enganchePct, mensualidadesPct, contraentregaPct] = pcts as [number, number, number];
  if (enganchePct + mensualidadesPct + contraentregaPct !== 100) return null;
  return { enganchePct, mensualidadesPct, contraentregaPct };
}

/**
 * Construye el plan de pagos. Devuelve null si falta cualquier pieza, y en ese
 * caso la UI publica gates.
 *
 * Sobre el número de pagos: el registro declara "47 MSI + 1 mensualidad final"
 * y "59 MSI + 1 mensualidad final". Es decir, en un plazo de 60 meses hay 59
 * mensualidades y un pago final de contraentrega. Dividir el saldo entre 60
 * daría una mensualidad más baja que la real.
 */
function construirPlan(
  precioMxn: number | null,
  tasaAnual: number | null,
  esquemaTexto: string | null,
  mesesOpciones: number[],
): PlanPago | null {
  // Sin tasa declarada no se publica mensualidad. `0` es un valor válido y
  // significativo (sin intereses); `null` significa "no sabemos".
  if (precioMxn === null || tasaAnual === null) return null;
  // Con intereses la aritmética deja de ser lineal y este cálculo no aplica.
  if (tasaAnual !== 0) return null;

  const esquema = parsearEsquema(esquemaTexto);
  if (!esquema) return null;
  if (mesesOpciones.length === 0) return null;

  const engancheMxn = (precioMxn * esquema.enganchePct) / 100;
  const mensualidadesTotalMxn = (precioMxn * esquema.mensualidadesPct) / 100;
  const contraentregaMxn = (precioMxn * esquema.contraentregaPct) / 100;

  const opciones: OpcionPlazo[] = mesesOpciones
    .filter((m) => m > 1)
    .map((meses) => {
      const pagos = meses - 1; // el último mes es la contraentrega
      return {
        meses,
        pagos,
        mensualidadMxn: Math.round((mensualidadesTotalMxn / pagos) * 100) / 100,
      };
    });

  return {
    ...esquema,
    engancheMxn,
    mensualidadesTotalMxn,
    contraentregaMxn,
    opciones,
    sinIntereses: true,
  };
}

/**
 * Selección curada de imágenes, por nombre de archivo.
 *
 * LISTA BLANCA, NO LISTA NEGRA, y esto es Camino A en su forma más literal:
 * `fotos_desarrollo` contiene renders donde el nombre comercial del desarrollo
 * aparece ROTULADO dentro de la imagen (el monumento de acceso, la señalética
 * de los locales). `sanitizarTexto` no puede verlos: sólo lee cadenas.
 *
 * Por eso la página nunca itera la galería. Cada archivo que se publica se
 * revisó a ojo y se dio de alta aquí con su alt escrito a mano. Un archivo
 * nuevo en el Hub no aparece solo: hay que mirarlo y añadirlo.
 */
const IMAGENES_CURADAS: Record<keyof ImagenesLanding, { archivo: string; alt: string }> = {
  hero: {
    archivo: '1782488140188-rd7fp2.webp',
    alt: 'Render aéreo de la privada residencial: calles arboladas, casas de dos niveles y la zona de albercas al centro',
  },
  domingo: {
    archivo: '1782488140710-ioqoqf.webp',
    alt: 'Alberca comunitaria con camastros y palapas, y la casa club al fondo, con residentes usándola',
  },
  amenidades: {
    archivo: '1782488141250-usa71a.webp',
    alt: 'Canchas de pádel y pickleball entre árboles, con vecinos jugando y otros sentados en las bancas',
  },
  urbanizacion: {
    archivo: '1782496845888-h9idmq.webp',
    alt: 'Vista aérea real del polígono: las vialidades y los lotes delimitados todavía sin construir ni urbanizar',
  },
};

/**
 * Resuelve la lista blanca contra la galería real del desarrollo. Compara por
 * nombre de archivo y no por URL completa para que un cambio de bucket o de
 * dominio de storage no vacíe la página en silencio.
 */
function curarImagenes(galeria: unknown): ImagenesLanding {
  const urls = Array.isArray(galeria)
    ? galeria.filter((u): u is string => typeof u === 'string')
    : [];

  const buscar = (archivo: string) => urls.find((u) => u.endsWith(`/${archivo}`)) ?? null;

  const resolver = (clave: keyof ImagenesLanding): ImagenLanding | null => {
    const { archivo, alt } = IMAGENES_CURADAS[clave];
    const url = buscar(archivo);
    return url ? { url, alt } : null;
  };

  return {
    hero: resolver('hero'),
    domingo: resolver('domingo'),
    amenidades: resolver('amenidades'),
    urbanizacion: resolver('urbanizacion'),
  };
}

/**
 * COS y CUS declarados en la ficha técnica del desarrollador para este uso de
 * suelo. Constantes y no columnas porque no existen como campo en el Hub; el
 * día que existan, este es el único punto que cambia.
 */
const COS = 0.55;
const CUS = 1.6;

function construirAprovechamiento(superficieM2: number | null): Aprovechamiento | null {
  if (superficieM2 === null || superficieM2 <= 0) return null;
  const redondear = (n: number) => Math.round(n * 100) / 100;
  return {
    cos: COS,
    cus: CUS,
    huellaM2: redondear(superficieM2 * COS),
    construibleM2: redondear(superficieM2 * CUS),
    niveles: Math.floor(CUS / COS),
  };
}

/**
 * Asesor a mostrar. Patrón de adopción: si la unidad tiene agente asignado, ese;
 * si no, el primer contacto de ventas de la ciudad por `sort_order` del Hub.
 * Así la elección la fija el Hub y no queda un nombre hardcodeado en el código:
 * para cambiarlo basta asignar `id_agente` en la unidad.
 */
async function getAsesor(agentIdUnidad: string | null): Promise<AsesorLanding | null> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;
  const hub = supabase.schema('real_estate_hub' as 'public');

  const seleccion = 'name, role, photo_url, whatsapp';

  if (agentIdUnidad) {
    const { data } = await hub
      .from('v_team_members')
      .select(seleccion)
      .eq('id', agentIdUnidad)
      .maybeSingle();
    if (data) return mapearAsesor(data as Record<string, unknown>);
  }

  const { data } = await hub
    .from('v_team_members')
    .select(seleccion)
    .eq('show_in_team_page', true)
    .eq('is_vacant', false)
    .eq('city', 'Playa del Carmen')
    .not('whatsapp', 'is', null)
    .in('role', ['Gerente de Ventas', 'Asesor de Ventas', 'Asesor', 'Team Leader'])
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  return data ? mapearAsesor(data as Record<string, unknown>) : null;
}

function mapearAsesor(d: Record<string, unknown>): AsesorLanding | null {
  const nombre = sanitizarTexto(d.name);
  const rol = sanitizarTexto(d.role);
  if (!nombre || !rol) return null;
  return {
    nombre,
    rol,
    fotoUrl: typeof d.photo_url === 'string' ? d.photo_url : null,
    whatsapp: typeof d.whatsapp === 'string' ? d.whatsapp : null,
  };
}

/** Dirección y horario canónicos del Hub (`Propyte_site_config`). */
async function getOficina(): Promise<OficinaLanding | null> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .schema('real_estate_hub' as 'public')
    .from('Propyte_site_config')
    .select('key, value')
    .in('key', ['contact.address_es', 'contact.hours_es']);

  if (!data) return null;
  const mapa = new Map(
    (data as { key: string; value: string }[]).map((r) => [r.key, r.value]),
  );
  const direccion = sanitizarTexto(mapa.get('contact.address_es'));
  const horario = sanitizarTexto(mapa.get('contact.hours_es'));
  if (!direccion || !horario) return null;
  return { direccion, horario };
}

/**
 * Lote de Playa del Carmen para la landing de pago.
 *
 * Devuelve null si el registro no pasa el gate de publicación o si desaparece
 * del inventario. La página trata ese null como estado "agotado", no como
 * error: con un inventario de una unidad, esa transición es probable.
 */
export async function getLotePlayaDelCarmen(): Promise<LoteLanding | null> {
  const supabase = createPublicSupabaseClient();
  // createPublicSupabaseClient() devuelve null si faltan las envs. Sin datos la
  // página renderiza el estado "ya no está disponible", no un 500 en una ruta
  // que recibe tráfico pagado.
  if (!supabase) return null;
  const hub = supabase.schema('real_estate_hub' as 'public');

  // OJO: no se seleccionan `development_name` ni `developer_name` (Camino A).
  const { data: unidad, error } = await hub
    .from('v_units')
    .select(
      [
        'id',
        'slug',
        'title',
        'city',
        'zone',
        'area_m2',
        'price_mxn',
        'unit_type',
        'unit_subtype',
        'status',
        'fin_enganche_pct',
        'fin_tasa',
        'fin_meses_opciones',
        'fin_meses_nota',
        'fin_esquema',
        'cover_image',
        'development_id',
        'agent_id',
      ].join(', '),
    )
    .eq('slug', 'lote-residencial-en-comunidad-privada')
    // Gate de publicación: nunca `status`, que es disponibilidad comercial.
    .not('approved_at', 'is', null)
    .eq('published', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !unidad) return null;

  const u = unidad as unknown as Record<string, unknown>;

  // Campos que solo viven en la tabla base (no expuestos por v_units).
  const { data: base } = await hub
    .from('Propyte_unidades')
    .select(
      [
        'servicios',
        'costos_adicionales',
        'fecha_escrituracion_estimada',
        'escritura_disponible',
        'regimen_propiedad',
        'uso_suelo_unidad',
        'rentas_corto_plazo_permitidas',
      ].join(', '),
    )
    .eq('id', u.id as string)
    .maybeSingle();

  const b = (base ?? {}) as unknown as Record<string, unknown>;

  const devId = u.development_id as string | null;

  // Amenidades y total de lotes desde `v_developments`: `amenities` es un array
  // derivado de columnas booleanas, no de prosa, y `total_units` es campo real.
  // OJO: no se seleccionan `name` ni `developer_name` (Camino A).
  const { data: dev } = devId
    ? await hub
        .from('v_developments')
        .select('amenities, total_units, images')
        .eq('id', devId)
        .maybeSingle()
    : { data: null };
  const d = (dev ?? {}) as unknown as Record<string, unknown>;
  const amenidades = Array.isArray(d.amenities)
    ? (d.amenities as unknown[])
        .map((a) => sanitizarTexto(a))
        .filter((a): a is string => a !== null)
    : [];

  const [licencia, asesor, oficina] = await Promise.all([
    getLicenciaDesarrollo(devId),
    getAsesor((u.agent_id as string | null) ?? null),
    getOficina(),
  ]);

  const superficieM2 = numeroONull(u.area_m2);
  const precioMxn = numeroONull(u.price_mxn);
  // Calculado, no leído de la columna almacenada.
  const precioM2Mxn =
    superficieM2 && precioMxn && superficieM2 > 0
      ? Math.round((precioMxn / superficieM2) * 100) / 100
      : null;

  const enganchePct = numeroONull(u.fin_enganche_pct);

  const { servicios, ningunServicioHoy } = mapearServicios(b.servicios);

  const mesesRaw = Array.isArray(u.fin_meses_opciones) ? u.fin_meses_opciones : [];
  const mesesOpciones = mesesRaw
    .map((m) => numeroONull(m))
    .filter((m): m is number => m !== null)
    .sort((a, z) => a - z);

  return {
    id: u.id as string,
    slug: u.slug as string,
    titulo: sanitizarTexto(u.title) ?? 'Lote residencial en privada',
    ciudad: sanitizarTexto(u.city),
    zona: sanitizarTexto(u.zone),
    superficieM2,
    precioMxn,
    precioM2Mxn,
    enganchePct,
    engancheMxn:
      enganchePct !== null && precioMxn !== null
        ? Math.round(((precioMxn * enganchePct) / 100) * 100) / 100
        : null,
    tasaAnual: numeroONull(u.fin_tasa),
    mesesOpciones,
    mesesNota: sanitizarTexto(u.fin_meses_nota),
    esquemaPago: sanitizarTexto(u.fin_esquema),
    // El subtipo trae espacio final en algunos registros.
    subtipoLiteral: sanitizarTexto(u.unit_subtype),
    regimenPropiedad: sanitizarTexto(b.regimen_propiedad),
    usoSuelo: sanitizarTexto(b.uso_suelo_unidad),
    escrituracionNota: sanitizarTexto(b.fecha_escrituracion_estimada),
    escrituraDisponibleHoy: b.escritura_disponible === true,
    rentasCortoPlazoPermitidas:
      typeof b.rentas_corto_plazo_permitidas === 'boolean'
        ? b.rentas_corto_plazo_permitidas
        : null,
    imagenPortada: typeof u.cover_image === 'string' ? u.cover_image : null,
    imagenes: curarImagenes(d.images),
    servicios,
    ningunServicioHoy,
    costos: mapearCostos(b.costos_adicionales),
    licencia,
    amenidades,
    lotesTotalesPrivada: numeroONull(d.total_units),
    aprovechamiento: construirAprovechamiento(superficieM2),
    plan: construirPlan(
      precioMxn,
      numeroONull(u.fin_tasa),
      sanitizarTexto(u.fin_esquema),
      mesesOpciones,
    ),
    asesor,
    oficina,
    fechaCorte: new Date().toISOString().slice(0, 10),
  };
}

/**
 * Licencia del desarrollo y autorización de venta municipal.
 *
 * Requisito legal para publicidad de lotes: Ley de Asentamientos Urbanos de
 * Q. Roo, art. 69, último párrafo. Si falta cualquiera de los cuatro campos,
 * `completa` es false y la UI renderiza [CONFIRMAR].
 */
async function getLicenciaDesarrollo(developmentId: string | null): Promise<LicenciaDesarrollo> {
  const vacia: LicenciaDesarrollo = {
    licenciaNumero: null,
    licenciaFecha: null,
    autorizacionNumero: null,
    autorizacionFecha: null,
    completa: false,
  };
  if (!developmentId) return vacia;

  const supabase = createPublicSupabaseClient();
  if (!supabase) return vacia;
  const { data } = await supabase
    .schema('real_estate_hub' as 'public')
    .from('v_development_licencias')
    .select('licencia_numero, licencia_fecha, autorizacion_numero, autorizacion_fecha')
    .eq('development_id', developmentId)
    .maybeSingle();

  if (!data) return vacia;
  const d = data as unknown as Record<string, unknown>;

  const licenciaNumero = sanitizarTexto(d.licencia_numero);
  const licenciaFecha = typeof d.licencia_fecha === 'string' ? d.licencia_fecha : null;
  const autorizacionNumero = sanitizarTexto(d.autorizacion_numero);
  const autorizacionFecha =
    typeof d.autorizacion_fecha === 'string' ? d.autorizacion_fecha : null;

  return {
    licenciaNumero,
    licenciaFecha,
    autorizacionNumero,
    autorizacionFecha,
    completa: Boolean(
      licenciaNumero && licenciaFecha && autorizacionNumero && autorizacionFecha,
    ),
  };
}
