/**
 * Particiones de presentación de /mercado.
 *
 * CDMX no es un mercado que Propyte comercialice: es un conjunto de comparación. Se
 * publica en su propio bloque, fuera del ranking y de los KPIs, para que un lector que
 * llega buscando Riviera Maya no lea 18 zonas de CDMX como si fueran parte de la oferta.
 *
 * El umbral de muestra NO vive aquí. El pipeline decide y lo expresa con `score = null`
 * (ver crawlers/glowing-spork/analytics/publication_gates.py en el monorepo). Un límite
 * escrito en dos capas produce fallo parcial silencioso cuando una se actualiza y la
 * otra no.
 */

/** Ciudades que se muestran como mercado de referencia, no como oferta. */
export const BENCHMARK_CITIES: ReadonlySet<string> = new Set(['CDMX']);

export function isBenchmarkCity(city: string): boolean {
  return BENCHMARK_CITIES.has(city);
}

/** Reparte las zonas en el ranking regional y el bloque de referencia. */
export function partitionByPool<T extends { city: string }>(
  zones: readonly T[],
): { ranking: T[]; benchmark: T[] } {
  const ranking: T[] = [];
  const benchmark: T[] = [];
  for (const z of zones) (isBenchmarkCity(z.city) ? benchmark : ranking).push(z);
  return { ranking, benchmark };
}

/**
 * Promedio del índice sobre las zonas que TIENEN índice.
 *
 * Contar como cero a una zona sin índice hunde el promedio: con el umbral de muestra
 * activo, 8 de 44 zonas publican `score = null`.
 */
export function averageIndex(zones: readonly { score: number | null }[]): number | null {
  const withIndex = zones.filter((z) => z.score != null);
  if (withIndex.length === 0) return null;
  return withIndex.reduce((s, z) => s + (z.score as number), 0) / withIndex.length;
}
