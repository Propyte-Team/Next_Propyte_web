export type Locale = 'es' | 'en';

/**
 * Selecciona el valor según locale para campos bilingües que vienen de DB.
 * Centraliza el patrón `locale === 'en' ? row.field_en : row.field_es`.
 *
 * @example
 * const desc = pickLang(locale, property.description_en, property.description_es);
 */
export function pickLang<T>(locale: Locale | string, en: T, es: T): T {
  return locale === 'en' ? en : es;
}

/**
 * Versión que toma un objeto + nombre de campo y retorna `field_en` o `field_es`.
 *
 * @example
 * const title = pickField(locale, property, 'title'); // → property.title_en || property.title_es
 */
export function pickField<T extends Record<string, unknown>>(
  locale: Locale | string,
  obj: T | null | undefined,
  fieldBase: string
): unknown {
  if (!obj) return undefined;
  const suffix = locale === 'en' ? '_en' : '_es';
  return obj[`${fieldBase}${suffix}`];
}
