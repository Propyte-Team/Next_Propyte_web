import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { ubicacionDe, ubicaciones } from '@/lib/supabase/lp-inventario';
import { ESTADO_TEXTO } from './util';

// ============================================================
// Filtros de inventario compartidos por las landings v2 (30-oct-2026).
//
// El brief: «todos los formularios tienen que mantener una necesidad de
// filtrado». Cada landing declara qué filtros ofrece (ubicación, presupuesto,
// recámaras, plazo, crédito, entrega) y el MISMO estado mueve tres cosas:
//
//   1. la cuadrícula de propiedades (lo que el visitante ve),
//   2. los chips del formulario (lo que el visitante dice que busca),
//   3. el lead en Zoho (`location`, `budget`, `interestOption`), para que el
//      asesor abra la conversación con lo que la persona ya eligió.
//
// Este módulo es PURO y sin `'use client'`: lo importan las páginas servidor
// para construir las definiciones a partir del inventario real, y el hook
// `useFiltros` para aplicarlas en el navegador.
//
// REGLA DE DATOS: cada opción se construye desde el inventario y trae su
// conteo. Una opción sin propiedades no se publica; un filtro con una sola
// opción tampoco (no filtra nada y estorba). Nada se escribe a mano.
// ============================================================

export type IdFiltro = 'ubicacion' | 'presupuesto' | 'recamaras' | 'plazo' | 'credito' | 'entrega';

export interface OpcionFiltro {
  valor: string;
  etiqueta: string;
  total: number;
}

export interface FiltroDef {
  id: IdFiltro;
  etiqueta: string;
  opciones: OpcionFiltro[];
  /** Solo `ubicacion`: si el chip es la ciudad o la zona. */
  nivel?: 'ciudad' | 'zona';
}

/** `id → valor` elegido. Ausente o `undefined` = sin filtrar. */
export type Seleccion = Partial<Record<IdFiltro, string>>;

/**
 * Tipo de cambio SOLO para meter una propiedad en USD en un rango de
 * presupuesto en MXN. Nunca se imprime. Mismo criterio que el orden del
 * inventario en `lp-inventario.ts`.
 */
const FX_SOLO_RANGO = 18.5;

function montoComparable(p: PropiedadLanding): number | null {
  if (!p.precio) return null;
  return p.precio.moneda === 'USD' ? p.precio.monto * FX_SOLO_RANGO : p.precio.monto;
}

const ETIQUETA_CREDITO: Record<string, string> = {
  infonavit: 'Infonavit',
  fovissste: 'Fovissste',
  hipotecario: 'Crédito bancario',
  directo: 'Financiamiento directo',
};

/** ¿`p` pasa el valor `valor` del filtro `id`? */
export function cumple(p: PropiedadLanding, id: IdFiltro, valor: string, nivel: 'ciudad' | 'zona' = 'ciudad'): boolean {
  switch (id) {
    case 'ubicacion':
      return ubicacionDe(p, nivel) === valor;
    case 'presupuesto': {
      const monto = montoComparable(p);
      if (monto === null) return false;
      const [min, max] = valor.split('-').map((n) => (n === '' ? null : Number(n)));
      if (min !== null && monto < min) return false;
      if (max !== null && monto >= max) return false;
      return true;
    }
    case 'recamaras': {
      if (!p.recamaras) return false;
      if (valor.endsWith('+')) return p.recamaras >= Number(valor.slice(0, -1));
      return p.recamaras === Number(valor);
    }
    case 'plazo':
      return p.mesesOpciones.includes(Number(valor));
    case 'credito':
      return p.creditos[valor as keyof PropiedadLanding['creditos']] === true;
    case 'entrega':
      return p.estadoComercial === valor;
    default:
      return true;
  }
}

/** Aplica todos los filtros activos de `seleccion`. */
export function filtrar(propiedades: PropiedadLanding[], seleccion: Seleccion, defs: FiltroDef[]): PropiedadLanding[] {
  const activos = defs.filter((d) => seleccion[d.id]);
  if (activos.length === 0) return propiedades;
  return propiedades.filter((p) => activos.every((d) => cumple(p, d.id, seleccion[d.id] as string, d.nivel)));
}

function conConteo(
  propiedades: PropiedadLanding[],
  id: IdFiltro,
  candidatas: { valor: string; etiqueta: string }[],
  nivel?: 'ciudad' | 'zona',
): OpcionFiltro[] {
  return candidatas
    .map((c) => ({ ...c, total: propiedades.filter((p) => cumple(p, id, c.valor, nivel)).length }))
    .filter((c) => c.total > 0);
}

function cerrar(def: FiltroDef): FiltroDef | null {
  return def.opciones.length >= 2 ? def : null;
}

export function filtroUbicacion(
  propiedades: PropiedadLanding[],
  nivel: 'ciudad' | 'zona' = 'ciudad',
  etiqueta = 'Ubicación',
): FiltroDef | null {
  const lista = ubicaciones(propiedades, nivel);
  return cerrar({
    id: 'ubicacion',
    etiqueta,
    nivel,
    opciones: lista.map((u) => ({ valor: u.clave, etiqueta: u.nombre, total: u.total })),
  });
}

/** Etiqueta compacta de un corte en MXN: 2500000 → «$2.5 M». */
function corteTexto(n: number): string {
  if (n < 1_000_000) return `$${Math.round(n / 1000)} K`;
  return `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')} M`;
}

/**
 * Rangos de presupuesto en MXN a partir de cortes ascendentes:
 * [2.5M, 4M] → «Hasta $2.5 M», «$2.5 M a $4 M», «Más de $4 M».
 */
export function filtroPresupuesto(
  propiedades: PropiedadLanding[],
  cortes: number[],
  etiqueta = 'Presupuesto',
): FiltroDef | null {
  const ordenados = [...cortes].sort((a, b) => a - b);
  const candidatas: { valor: string; etiqueta: string }[] = [];
  ordenados.forEach((corte, i) => {
    const anterior = i === 0 ? null : ordenados[i - 1];
    candidatas.push({
      valor: `${anterior ?? ''}-${corte}`,
      etiqueta: anterior === null ? `Hasta ${corteTexto(corte)}` : `${corteTexto(anterior)} a ${corteTexto(corte)}`,
    });
  });
  const ultimo = ordenados[ordenados.length - 1];
  if (ultimo !== undefined) candidatas.push({ valor: `${ultimo}-`, etiqueta: `Más de ${corteTexto(ultimo)}` });
  return cerrar({ id: 'presupuesto', etiqueta, opciones: conConteo(propiedades, 'presupuesto', candidatas) });
}

export function filtroRecamaras(propiedades: PropiedadLanding[], etiqueta = 'Recámaras'): FiltroDef | null {
  const max = Math.max(0, ...propiedades.map((p) => p.recamaras ?? 0));
  const tope = Math.min(max, 4);
  const candidatas: { valor: string; etiqueta: string }[] = [];
  for (let n = 1; n <= tope; n++) {
    const esUltimo = n === 4 && max > 4;
    candidatas.push({ valor: esUltimo ? '4+' : String(n), etiqueta: esUltimo ? '4 o más' : String(n) });
  }
  return cerrar({ id: 'recamaras', etiqueta, opciones: conConteo(propiedades, 'recamaras', candidatas) });
}

/** Plazos declarados por los desarrolladores, en meses, de menor a mayor. */
export function filtroPlazo(propiedades: PropiedadLanding[], etiqueta = 'Plazo'): FiltroDef | null {
  const meses = [...new Set(propiedades.flatMap((p) => p.mesesOpciones))].sort((a, b) => a - b);
  const candidatas = meses.map((m) => ({ valor: String(m), etiqueta: `${m} meses` }));
  return cerrar({ id: 'plazo', etiqueta, opciones: conConteo(propiedades, 'plazo', candidatas) });
}

export function filtroCredito(propiedades: PropiedadLanding[], etiqueta = 'Cómo quieres pagar'): FiltroDef | null {
  const candidatas = Object.entries(ETIQUETA_CREDITO).map(([valor, etiq]) => ({ valor, etiqueta: etiq }));
  // Aquí basta UNA opción: «Infonavit» solo ya le dice al visitante algo que
  // no sabía, y al asesor, que la persona lo eligió.
  const opciones = conConteo(propiedades, 'credito', candidatas);
  return opciones.length > 0 ? { id: 'credito', etiqueta, opciones } : null;
}

export function filtroEntrega(propiedades: PropiedadLanding[], etiqueta = 'Entrega'): FiltroDef | null {
  const candidatas = (Object.keys(ESTADO_TEXTO) as (keyof typeof ESTADO_TEXTO)[]).map((k) => ({
    valor: k,
    etiqueta: ESTADO_TEXTO[k],
  }));
  return cerrar({ id: 'entrega', etiqueta, opciones: conConteo(propiedades, 'entrega', candidatas) });
}

/** Quita los `null` y conserva el orden declarado. */
export function filtros(...defs: (FiltroDef | null)[]): FiltroDef[] {
  return defs.filter((d): d is FiltroDef => d !== null);
}

export function etiquetaDe(defs: FiltroDef[], id: IdFiltro, valor: string | undefined): string | null {
  if (!valor) return null;
  return defs.find((d) => d.id === id)?.opciones.find((o) => o.valor === valor)?.etiqueta ?? null;
}

/**
 * Lo que viaja en el lead. Ubicación y presupuesto tienen campo propio en
 * Zoho; el resto se junta en `interestOption` como texto legible.
 */
export function textoLead(defs: FiltroDef[], seleccion: Seleccion): {
  location?: string;
  budget?: string;
  interestOption?: string;
} {
  const location = etiquetaDe(defs, 'ubicacion', seleccion.ubicacion) ?? undefined;
  const budget = etiquetaDe(defs, 'presupuesto', seleccion.presupuesto) ?? undefined;
  const resto = defs
    .filter((d) => d.id !== 'ubicacion' && d.id !== 'presupuesto')
    .map((d) => {
      const etiq = etiquetaDe(defs, d.id, seleccion[d.id]);
      if (!etiq) return null;
      if (d.id === 'recamaras') return `${etiq} ${etiq === '1' ? 'recámara' : 'recámaras'}`;
      return etiq;
    })
    .filter((t): t is string => t !== null);
  return {
    location,
    budget,
    interestOption: resto.length > 0 ? resto.join(', ') : undefined,
  };
}
