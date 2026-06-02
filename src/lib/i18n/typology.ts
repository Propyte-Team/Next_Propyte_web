/**
 * Diccionario estático ES→EN para la TIPOLOGÍA de unidad (layout/recámaras).
 *
 * `ext_tipologia` (expuesto como `typology` en v_units) es una lista cerrada
 * definida en el Hub (fields-config.ts: TIPOLOGIA_OPTIONS). Se traduce aquí en
 * lugar de una columna `_en` en BD porque es un enum fijo, y con un diccionario
 * estático en vez del namespace i18n porque sus valores ("2 recámaras + estudio")
 * no son keys i18n limpias (ver feedback_next_intl_path_fallback).
 *
 * El TIPO de unidad (`tipo_unidad` / `unit_type`) NO va aquí: ya se traduce vía
 * el namespace i18n `types` en src/i18n/messages/*.json.
 *
 * Valores fuera del catálogo (legacy "2R2B", o un valor nuevo del Hub que aún
 * no se agregue aquí) se devuelven tal cual — fail-open, nunca rompen el render.
 *
 * Mantener sincronizado con Propyte_hub/src/lib/fields-config.ts (TIPOLOGIA_OPTIONS).
 */

const TYPOLOGY_EN: Record<string, string> = {
  'Estudio': 'Studio',
  'Estudio + suite': 'Studio + Suite',
  'Doble estudio': 'Double Studio',
  '1 recámara': '1 Bedroom',
  '1 recámara + estudio': '1 Bedroom + Studio',
  '2 recámaras': '2 Bedrooms',
  '2 recámaras + estudio': '2 Bedrooms + Studio',
  '3 recámaras': '3 Bedrooms',
  '4 recámaras': '4 Bedrooms',
  '5+ recámaras': '5+ Bedrooms',
};

// Lookup case-insensitive: los valores existentes (y los que llegan de Zoho)
// traen variantes de mayúsculas ("2 Recámaras", "ESTUDIO", "Estudio + Suite").
// El dropdown del Hub fija el casing canónico a futuro, pero esto cubre el
// histórico sin forzar un backfill.
const TYPOLOGY_EN_CI: Record<string, string> = Object.fromEntries(
  Object.entries(TYPOLOGY_EN).map(([es, en]) => [es.toLowerCase(), en]),
);

/** Traduce la tipología (recámaras). `en` → diccionario (case-insensitive); ES o desconocido → valor original. */
export function translateTypology(value: string | null | undefined, locale?: string): string | null | undefined {
  if (!value || locale !== 'en') return value;
  return TYPOLOGY_EN_CI[value.trim().toLowerCase()] ?? value;
}
