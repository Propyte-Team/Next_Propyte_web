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
