/**
 * Normaliza un valor crudo de BD (Zoho canonical = Capitalized, con espacios)
 * a la convención de keys en messages/*.json (lowercase, snake_case).
 *
 * Ejemplos:
 *   "Departamento"        → "departamento"
 *   "Entrega Inmediata"   → "entrega_inmediata"
 *   "Residencial Vertical"→ "residencial_vertical"
 *   "  preventa "         → "preventa"
 *
 * Uso canónico: SIEMPRE pasar valores que vienen de BD por aquí antes de
 * `tTypes(...)` / `tAvail(...)` / `tStages(...)`. Esto evita MISSING_MESSAGE
 * y mantiene las keys del JSON limpias (una sola convención lowercase).
 *
 * Ver feedback_next_intl_path_fallback + feedback_estado_unidad_canonical
 * + incidente prod 2026-05-25 (turena → 500 por MISSING_MESSAGE).
 */
export function normalizeI18nKey(raw: string | null | undefined): string {
  if (!raw) return '';
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_');
}

/**
 * Variante para el namespace `developmentTypes`, que usa kebab-case
 * (`residencial-vertical`, `torre-oficinas`) — NO snake_case como el resto de
 * namespaces (stages/types/usages). El catálogo canónico `DevelopmentType`
 * (types/property.ts) y el mapper (`normalizeDevelopmentType`) ya producen
 * kebab; pasar ese valor por `normalizeI18nKey` lo corrompía a
 * `residencial_vertical` (guion bajo) → MISSING_MESSAGE → la card mostraba
 * "DEVELOPMENTTYPES.RESIDENCIAL_VERTICAL".
 *
 * Produce kebab-case y acepta tanto el canónico (`residencial-vertical`) como
 * el enum crudo de Zoho (`RESIDENCIAL_VERTICAL`).
 */
export function normalizeDevTypeKey(raw: string | null | undefined): string {
  if (!raw) return '';
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
}
