/**
 * Fetcher del tipo de cambio USD/MXN desde Banxico SIE API.
 *
 * Serie SF43718: "Tipo de cambio para solventar obligaciones denominadas en
 * moneda extranjera pagaderas en la República Mexicana" (FIX rate, banco
 * central de referencia).
 *
 * ⚠ La API EXIGE `Bmx-Token` (sin token responde 400 — verificado 2026-07-14;
 * la nota previa "público sin token" era falsa). Sin BANXICO_TOKEN en env, el
 * sitio queda clavado en el FALLBACK. Token gratuito en banxico.org.mx/SieAPIRest.
 * Cache `revalidate=43200` (12h) → ~2 req/día.
 *
 * Fallback hardcoded: si el fetch falla, usamos el último rate conocido para
 * no romper la UI. Se actualiza manualmente con cada deploy si Banxico cambia
 * significativamente — solo es safety net.
 */

export interface UsdMxnRate {
  /** MXN por 1 USD. Multiplicar montos USD por este número para obtener MXN. */
  rate: number;
  /** Fecha del rate en ISO YYYY-MM-DD. */
  date: string;
  /** Indica si vino del API (true) o del fallback hardcoded (false). */
  fresh: boolean;
}

const FALLBACK: UsdMxnRate = {
  rate: 17.24,
  date: '2026-04-01',
  fresh: false,
};

const BANXICO_URL =
  'https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno';

/**
 * Banxico response shape (simplificada al subset que usamos).
 */
interface BanxicoResponse {
  bmx?: {
    series?: Array<{
      idSerie?: string;
      datos?: Array<{ fecha?: string; dato?: string }>;
    }>;
  };
}

/**
 * Parsea fecha "DD/MM/YYYY" de Banxico → ISO "YYYY-MM-DD".
 */
function parseBanxicoDate(ddmmyyyy: string): string | null {
  const m = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

export async function fetchUsdMxnRate(): Promise<UsdMxnRate> {
  try {
    const token = process.env.BANXICO_TOKEN;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Bmx-Token'] = token;

    const res = await fetch(BANXICO_URL, {
      headers,
      // ISR-friendly: cache server-side por 12h. La revalidación la hace Next.
      next: { revalidate: 43200, tags: ['exchange-rate'] },
    });

    if (!res.ok) {
      console.warn('[banxico] non-200 response:', res.status);
      return FALLBACK;
    }

    const json = (await res.json()) as BanxicoResponse;
    const datum = json.bmx?.series?.[0]?.datos?.[0];
    if (!datum?.dato || !datum?.fecha) {
      console.warn('[banxico] empty response shape', JSON.stringify(json).slice(0, 200));
      return FALLBACK;
    }

    const rate = Number.parseFloat(datum.dato);
    const date = parseBanxicoDate(datum.fecha);
    if (!Number.isFinite(rate) || rate <= 0 || !date) {
      console.warn('[banxico] invalid datum:', datum);
      return FALLBACK;
    }

    return { rate, date, fresh: true };
  } catch (err) {
    console.error('[banxico] fetch failed:', err);
    return FALLBACK;
  }
}
