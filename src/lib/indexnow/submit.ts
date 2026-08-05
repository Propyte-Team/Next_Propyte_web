/**
 * IndexNow — avisa a Bing y Yandex de que una URL cambió, sin esperar al recrawl.
 * -----------------------------------------------------------------------------
 * Por qué importa más allá de Bing: ChatGPT search y Copilot se apoyan en el
 * índice de Bing. Acelerar la entrada ahí es la vía más directa que tenemos para
 * que un artículo o una ficha recién publicada pueda ser citada por esos motores.
 * Google NO participa en IndexNow — para Google sigue mandando el sitemap.
 */

const ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * La key es PÚBLICA por diseño: el protocolo exige servirla en
 * `https://<host>/<key>.txt` para probar que controlas el dominio.
 *
 * Vive como constante y no en una env var a propósito: el archivo de
 * `public/` es estático y no puede leer el entorno, así que una env var
 * abriría la puerta a que ambos divergieran — e IndexNow rechaza en silencio
 * cuando la key del payload no coincide con la del archivo. El test de este
 * módulo ata las dos cosas.
 */
export const INDEXNOW_KEY = 'e0c962294509eadb47803ddc2e54d8b9';

/** Mismo fallback que robots.ts y sitemap.ts. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://propyte.com';

/** Tope del protocolo: por encima, IndexNow rechaza el lote completo. */
const MAX_URLS = 10_000;

export type IndexNowResult = {
  submitted: number;
  skipped: number;
  ok: boolean;
  status?: number;
  reason?: string;
};

/**
 * Normaliza a URLs absolutas del propio host, deduplicando.
 * Descarta lo que apunte a otro dominio: IndexNow solo acepta URLs del `host`
 * declarado y una sola URL ajena invalida el lote entero.
 */
export function toAbsoluteUrls(paths: string[], base: string = SITE_URL): string[] {
  const host = new URL(base).host;
  const out = new Set<string>();
  for (const p of paths) {
    if (typeof p !== 'string' || p.trim() === '') continue;
    let u: URL;
    try {
      u = new URL(p, base);
    } catch {
      continue;
    }
    if (u.host !== host) continue;
    out.add(u.toString());
  }
  return [...out];
}

/**
 * Envía el lote. Fail-open en todos los caminos: esto se llama desde el handler
 * de revalidación y nunca debe tumbar la respuesta que el Hub está esperando.
 */
export async function submitToIndexNow(paths: string[]): Promise<IndexNowResult> {
  const urls = toAbsoluteUrls(paths);
  if (urls.length === 0) {
    return { submitted: 0, skipped: paths.length, ok: true, reason: 'sin-urls-validas' };
  }

  // En dev y en build no se avisa a nadie: ensuciaría el índice con localhost
  // y con URLs de preview.
  if (process.env.NODE_ENV !== 'production') {
    return { submitted: 0, skipped: urls.length, ok: true, reason: 'no-production' };
  }

  const lote = urls.slice(0, MAX_URLS);
  const skipped = urls.length - lote.length;
  if (skipped > 0) {
    // Que un tope no se coma URLs en silencio.
    console.warn(`[indexnow] tope de ${MAX_URLS}: ${skipped} URLs quedaron fuera de este lote`);
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL.replace(/\/+$/, '')}/${INDEXNOW_KEY}.txt`,
        urlList: lote,
      }),
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    });

    // 200 = aceptado, 202 = aceptado con validación de key pendiente. Ambos ok.
    if (!res.ok) {
      console.warn(`[indexnow] HTTP ${res.status} enviando ${lote.length} URLs`);
      return { submitted: 0, skipped: urls.length, ok: false, status: res.status };
    }
    return { submitted: lote.length, skipped, ok: true, status: res.status };
  } catch (err) {
    console.warn('[indexnow] fallo de red:', err);
    return { submitted: 0, skipped: urls.length, ok: false, reason: String(err) };
  }
}
