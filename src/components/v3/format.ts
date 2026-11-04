// Formatos compartidos por las páginas v3 (listado, ficha, tarjetas).

/** Por debajo de esto el precio capturado es un error de captura, no un precio
 *  (p. ej. LOSANTOS a $35,000): no se publica. */
const MIN_REAL_PRICE = { MXN: 100_000, USD: 10_000 } as const;

/**
 * Precio corto para tarjetas: "$4.85 M", "$850 mil", "US$450 mil".
 * Devuelve null si no hay precio creíble — la tarjeta entonces no muestra "Desde".
 */
export function compactMoney(amount: number | null | undefined, currency: 'MXN' | 'USD', locale: string): string | null {
  if (!amount || amount < MIN_REAL_PRICE[currency]) return null;
  const prefix = currency === 'USD' ? 'US$' : '$';
  if (amount >= 1_000_000) {
    const v = (Math.round((amount / 1_000_000) * 100) / 100).toString();
    return `${prefix}${v} M`;
  }
  const k = Math.round(amount / 1000);
  return locale === 'en' ? `${prefix}${k}K` : `${prefix}${k} mil`;
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** "Zona, Ciudad" sin repetir la ciudad cuando la zona ya la incluye. */
export function placeLabel(zone: string | null | undefined, city: string | null | undefined): string {
  const c = city ?? '';
  if (!zone) return c;
  if (!c) return zone;
  return norm(zone).includes(norm(c)) ? zone : `${zone}, ${c}`;
}
