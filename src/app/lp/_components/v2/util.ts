import type { EstadoComercial, PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { m2 } from '../format';

// Helpers de presentación compartidos. Texto, no iconos: una fila de
// pictogramas de cama y regadera es el lenguaje del portal, y estas páginas
// están en el registro opuesto.

export const ESTADO_TEXTO: Record<EstadoComercial, string> = {
  disponible: 'Disponible',
  preventa: 'Preventa',
  entrega_inmediata: 'Entrega inmediata',
};

export function specsVivienda(p: PropiedadLanding): string[] {
  const partes: string[] = [];
  if (p.recamaras) partes.push(`${p.recamaras} rec`);
  if (p.banos) partes.push(`${p.banos} ${p.banos === 1 ? 'baño' : 'baños'}`);
  if (p.m2Construidos) partes.push(`${m2(p.m2Construidos)} const.`);
  if (p.m2Terreno) partes.push(`${m2(p.m2Terreno)} terreno`);
  if (p.estacionamientos) partes.push(`${p.estacionamientos} ${p.estacionamientos === 1 ? 'auto' : 'autos'}`);
  if (p.alberca) partes.push('Alberca');
  return partes;
}

export function specsTerreno(p: PropiedadLanding): string[] {
  const partes: string[] = [];
  partes.push(p.m2Terreno ? m2(p.m2Terreno) : 'superficie por confirmar');
  if (p.mesesOpciones.length > 0) partes.push(`hasta ${Math.max(...p.mesesOpciones)} meses`);
  if (p.enganchePct) partes.push(`enganche ${p.enganchePct}%`);
  return partes;
}

export function ubicacionCorta(p: PropiedadLanding): string {
  return p.zona && p.zona !== p.ciudad ? `${p.zona}, ${p.ciudad}` : p.ciudad;
}

/** Plural simple en español para contadores derivados del inventario. */
export function plural(n: number, singular: string, pluralTxt: string): string {
  return `${n} ${n === 1 ? singular : pluralTxt}`;
}
