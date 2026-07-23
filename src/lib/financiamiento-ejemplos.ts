/**
 * Selección determinista de unidades de ejemplo para /financiamiento.
 * Del pool público (v_units ya filtrado approved/no-deleted por getUnits) se
 * queda con las filas con precio, slug e imagen; ordena por precio y elige
 * 1 por tercil (la de created_at más reciente) → hasta `count` ejemplos
 * bajo/medio/alto, en orden de precio ascendente. Fail-closed: sin filas
 * válidas retorna [].
 * De-duplica por `slug` (Set `usados`): si una fila ya fue elegida en un
 * tercil anterior, el tercil actual la descarta y NO se rellena con otra
 * fila del mismo tercil — por eso el resultado puede tener menos de
 * `count` elementos aunque el pool parezca suficiente.
 */
export interface EjemploPoolRow {
  slug?: string | null;
  price_mxn?: number | string | null;
  images?: unknown;
  created_at?: string | null;
}

function firstImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  const img = images.find((i) => typeof i === 'string' && i.length > 0);
  return typeof img === 'string' ? img : null;
}

export function pickEjemplosPorTerciles<T extends EjemploPoolRow>(rows: T[], count = 3): T[] {
  const validas = rows.filter(
    (r) => !!r.slug && Number(r.price_mxn) > 0 && firstImage(r.images) !== null,
  );
  if (validas.length === 0) return [];
  const orden = [...validas].sort((a, b) => Number(a.price_mxn) - Number(b.price_mxn));
  const n = orden.length;
  const k = Math.min(count, n);
  const usados = new Set<string>();
  const seleccion: T[] = [];
  for (let i = 0; i < k; i++) {
    const desde = Math.floor((i * n) / k);
    const hasta = Math.floor(((i + 1) * n) / k); // exclusivo
    const bucket = orden.slice(desde, hasta).filter((r) => !usados.has(r.slug as string));
    if (bucket.length === 0) continue;
    const elegida = bucket.reduce(
      (best, r) => (String(r.created_at ?? '') > String(best.created_at ?? '') ? r : best),
      bucket[0],
    );
    usados.add(elegida.slug as string);
    seleccion.push(elegida);
  }
  return seleccion;
}
