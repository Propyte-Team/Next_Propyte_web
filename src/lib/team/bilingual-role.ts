/**
 * El Hub no tiene un campo `role_en` separado: el equipo captura ambos
 * idiomas en el mismo campo `role` con el formato "Rol ES | Rol EN"
 * (ej. "Director Comercial | Commercial Director"). Sin "|" el valor es
 * el mismo en ambos idiomas (ej. "Team Leader", "Software").
 */
export function splitBilingualRole(role: string, locale: string): string {
  const parts = role.split('|').map((p) => p.trim());
  if (parts.length < 2 || !parts[1]) return parts[0];
  return locale === 'en' ? parts[1] : parts[0];
}

/**
 * Cargos que pueden atender un lead entrante.
 *
 * Se comparan contra CADA mitad de `role`, no contra la cadena completa: el
 * Hub guarda "Gerente de Ventas | Sales Manager", así que una igualdad exacta
 * contra "Gerente de Ventas" nunca empata. Ese era el bug — de los cuatro
 * cargos que el filtro decía aceptar solo empataba "Team Leader", y solo
 * porque ese no lleva mitad en inglés.
 *
 * Van las dos mitades para que el predicado sobreviva a que alguien capture
 * el cargo en un solo idioma, o en el orden inverso.
 */
const CARGOS_COMERCIALES = new Set([
  'gerente de ventas',
  'sales manager',
  'asesor de ventas',
  'sales advisor',
  'asesor',
  'advisor',
  'team leader',
  'lider de equipo',
]);

/** Minúsculas, sin acentos y con los espacios colapsados. */
function normalizarCargo(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * ¿Este `role` del Hub corresponde a alguien que puede atender un lead?
 *
 * Se usa para elegir el asesor de respaldo de una landing cuando la unidad no
 * trae `agent_id`. Es un predicado y no un filtro de PostgREST a propósito: la
 * tabla de equipo tiene una decena de filas, y resolverlo aquí permite empatar
 * por mitades, sin acentos y sin depender de cómo se escriba el cargo en el
 * Hub. Un cargo editorial no es una llave de lógica; mientras `role_code` siga
 * sin poblarse —hoy lo tiene 1 de 10 filas— esto es lo más cerca que se puede
 * estar de una.
 */
export function esCargoComercial(role: string | null | undefined): boolean {
  if (!role) return false;
  return role.split('|').some((mitad) => CARGOS_COMERCIALES.has(normalizarCargo(mitad)));
}
