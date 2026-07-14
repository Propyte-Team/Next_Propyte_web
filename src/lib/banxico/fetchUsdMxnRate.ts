/**
 * Fetcher del tipo de cambio USD/MXN desde Banxico SIE API.
 *
 * Serie SF43718: "Tipo de cambio para solventar obligaciones denominadas en
 * moneda extranjera pagaderas en la República Mexicana" (FIX rate, banco
 * central de referencia).
 *
 * ⚠ La API EXIGE `Bmx-Token` (sin token responde 400 — verificado 2026-07-14;
 * la nota previa "público sin token" era falsa). Sin BANXICO_TOKEN en env, el
 * sitio recae al fallback de Supabase o al hardcode. Token gratuito en
 * banxico.org.mx/SieAPIRest. Cache `revalidate=43200` (12h) → ~2 req/día.
 *
 * Orden de resolución:
 *  1. Banxico en vivo (si responde OK y el payload parsea) → fresh:true.
 *  2. `public.fx_rates` en Supabase (fila más reciente para pair='USD/MXN'),
 *     escrita por un job de VPS (Fase 0) — safety net durable si Banxico
 *     está caído o sin token. fresh:false.
 *  3. Fallback hardcoded — último recurso si ni Banxico ni Supabase responden.
 *     Se actualiza manualmente con cada deploy si Banxico cambia
 *     significativamente.
 */

import { createPublicSupabaseClient } from '@/lib/supabase/public';

export interface UsdMxnRate {
  /** MXN por 1 USD. Multiplicar montos USD por este número para obtener MXN. */
  rate: number;
  /** Fecha del rate en ISO YYYY-MM-DD. */
  date: string;
  /** Indica si vino del API (true) o de un fallback — Supabase u hardcode (false). */
  fresh: boolean;
}

export const FALLBACK: UsdMxnRate = {
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

/**
 * Parsea el payload crudo de Banxico → { rate, date } o null si el shape
 * es inesperado o los valores no son válidos. Función pura, sin I/O.
 */
export function parseBanxicoPayload(json: BanxicoResponse): { rate: number; date: string } | null {
  const datum = json?.bmx?.series?.[0]?.datos?.[0];
  if (!datum?.dato || !datum?.fecha) {
    return null;
  }

  const rate = Number.parseFloat(datum.dato);
  const date = parseBanxicoDate(datum.fecha);
  if (!Number.isFinite(rate) || rate <= 0 || !date) {
    return null;
  }

  return { rate, date };
}

/**
 * Lee la fila más reciente de `public.fx_rates` para pair='USD/MXN'.
 * Escrita por el job de VPS (Fase 0). Devuelve null en cualquier error
 * o si no hay datos — el caller decide el siguiente fallback.
 */
async function getStoredUsdMxnRate(): Promise<UsdMxnRate | null> {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('fx_rates')
      .select('rate, date')
      .eq('pair', 'USD/MXN')
      .order('date', { ascending: false })
      .limit(1);

    if (error) {
      console.warn('[fx_rates] query error:', error);
      return null;
    }

    const row = data?.[0];
    if (!row) return null;

    const rate = Number(row.rate);
    const date = row.date;
    if (!Number.isFinite(rate) || rate <= 0 || !date) {
      console.warn('[fx_rates] invalid stored row:', row);
      return null;
    }

    return { rate, date, fresh: false };
  } catch (err) {
    console.error('[fx_rates] read failed:', err);
    return null;
  }
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

    if (res.ok) {
      const json = (await res.json()) as BanxicoResponse;
      const parsed = parseBanxicoPayload(json);
      if (parsed) {
        return { ...parsed, fresh: true };
      }
      console.warn('[banxico] unparseable response shape', JSON.stringify(json).slice(0, 200));
    } else {
      console.warn('[banxico] non-200 response:', res.status);
    }
  } catch (err) {
    console.error('[banxico] fetch failed:', err);
  }

  const stored = await getStoredUsdMxnRate();
  if (stored) return stored;

  return FALLBACK;
}
