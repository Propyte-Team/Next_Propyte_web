import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getRankedDevelopmentFinancials,
  getDevelopmentsForRanking,
  getActiveRentalComparables,
} from '@/lib/supabase/queries';
import type { AnalysisData } from './analysis-types';

/**
 * Lectores de un `Record<string, unknown>` de PostgREST.
 *
 * No validan: afirman. Existen para que la afirmación esté escrita en un solo lugar y
 * se vea, en vez de repartida en diez `as string` o —peor— escondida detrás del
 * boundary JSON, donde `res.json(): any` la hacía invisible para tsc.
 */
const str = (v: unknown): string => v as string;
const nul = (v: unknown): string | null => (v ?? null) as string | null;
const num = (v: unknown): number | null => (v ?? null) as number | null;

// ── Data cleaning constants (mirrors Python pipeline) ──
const RENT_MIN = 2_000;
const RENT_MAX = 500_000;
const AREA_MIN = 15;
const AREA_MAX = 800;
const RENT_PER_M2_MIN = 20;
const RENT_PER_M2_MAX = 2_000;
const BEDROOMS_MAX = 10;
const IQR_MULTIPLIER = 2.5;

interface RawComparable {
  city: string;
  zone: string | null;
  property_type: string;
  bedrooms: number | null;
  monthly_rent_mxn: number;
  area_m2: number | null;
  rental_type: string;
  is_furnished: boolean | null;
  source_portal: string;
  scraped_at: string;
}

function cleanComparables(raw: RawComparable[]): { cleaned: RawComparable[]; removed: Record<string, number> } {
  const removed: Record<string, number> = {};
  let data = [...raw];

  const filter = (fn: (r: RawComparable) => boolean, reason: string) => {
    const before = data.length;
    data = data.filter(fn);
    const n = before - data.length;
    if (n > 0) removed[reason] = n;
  };

  // Stage 1: Rent bounds
  filter(r => r.monthly_rent_mxn >= RENT_MIN, `rent < $${RENT_MIN.toLocaleString()}`);
  filter(r => r.monthly_rent_mxn <= RENT_MAX, `rent > $${RENT_MAX.toLocaleString()} (sale price)`);

  // Stage 2: Area bounds (only filter if area exists)
  filter(r => !r.area_m2 || r.area_m2 >= AREA_MIN, `area < ${AREA_MIN}m²`);
  filter(r => !r.area_m2 || r.area_m2 <= AREA_MAX, `area > ${AREA_MAX}m²`);

  // Stage 3: Rent/m² bounds
  filter(r => {
    if (!r.area_m2 || r.area_m2 < AREA_MIN) return true; // no area = keep
    const rpm2 = r.monthly_rent_mxn / r.area_m2;
    return rpm2 >= RENT_PER_M2_MIN && rpm2 <= RENT_PER_M2_MAX;
  }, 'rent/m² out of range');

  // Stage 4: Bedrooms
  filter(r => !r.bedrooms || r.bedrooms <= BEDROOMS_MAX, `bedrooms > ${BEDROOMS_MAX}`);

  // Stage 5: Zone-level IQR outlier removal
  const byZone = new Map<string, RawComparable[]>();
  for (const r of data) {
    const key = `${r.city}::${r.zone || ''}`;
    if (!byZone.has(key)) byZone.set(key, []);
    byZone.get(key)!.push(r);
  }

  const outlierIds = new Set<number>();
  for (const group of byZone.values()) {
    if (group.length < 5) continue;
    const rents = group.map(r => r.monthly_rent_mxn).sort((a, b) => a - b);
    const q1 = rents[Math.floor(rents.length * 0.25)];
    const q3 = rents[Math.floor(rents.length * 0.75)];
    const iqr = q3 - q1;
    if (iqr === 0) continue;
    const lower = q1 - IQR_MULTIPLIER * iqr;
    const upper = q3 + IQR_MULTIPLIER * iqr;
    for (let i = 0; i < group.length; i++) {
      if (group[i].monthly_rent_mxn < lower || group[i].monthly_rent_mxn > upper) {
        outlierIds.add(data.indexOf(group[i]));
      }
    }
  }
  if (outlierIds.size > 0) {
    removed['zone IQR outlier'] = outlierIds.size;
    data = data.filter((_, i) => !outlierIds.has(i));
  }

  // Stage 6: Dedup (same city+zone+rent+area+beds+type)
  const seen = new Set<string>();
  const beforeDedup = data.length;
  data = data.filter(r => {
    const key = `${r.city}|${r.zone}|${r.monthly_rent_mxn}|${r.area_m2}|${r.bedrooms}|${r.property_type}|${r.rental_type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const nDedup = beforeDedup - data.length;
  if (nDedup > 0) removed['duplicates'] = nDedup;

  return { cleaned: data, removed };
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Arma el análisis de renta tradicional.
 *
 * Vive fuera de la ruta API porque /mercado lo necesita en el server component: la tabla
 * de esa pestaña ES el contenido de la página, y si sólo se pinta con un fetch de cliente
 * el activo más citable de Propyte es invisible para el rastreo (auditoría jul-2026, P-8).
 * La ruta API se conserva para el refetch interactivo tras la hidratación, y es la única
 * que aplica rate limit: el server component no pasa por ahí y no debe hacerlo.
 *
 * Devuelve null si el cliente de Supabase no está disponible o la consulta falla, para
 * que la página degrade sin reventar.
 */
export async function getRentalAnalysis(city: string | null = null): Promise<AnalysisData | null> {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Financials (investment_analytics) + developments (real_estate_hub v_developments).
    //    Se resuelven por separado y se unen en JS: no hay FK ni embed cross-schema
    //    en PostgREST. Solo entran developments públicos; filtro por ciudad en memoria.
    const financialsRaw = await getRankedDevelopmentFinancials(supabase);
    const devIds = [...new Set(
      financialsRaw.map((f) => f.development_id as string).filter(Boolean),
    )];
    const devs = await getDevelopmentsForRanking(supabase, devIds);
    const devById = new Map(
      devs.map((d) => [(d as { id: string }).id, d as Record<string, unknown>]),
    );
    const financials = financialsRaw
      .map((f) => ({ f, dev: devById.get(f.development_id as string) }))
      .filter(({ dev }) => dev && (!city || dev.city === city))
      .slice(0, 100);

    // 2. Comparables de renta activos de los últimos 12 meses (investment_analytics).
    const allComparables: RawComparable[] = await getActiveRentalComparables(supabase);

    // 3. Clean data (same 6-stage pipeline as Python)
    const { cleaned: comparables, removed } = cleanComparables(allComparables);

    // Fecha del registro más reciente. El desglose por portal ya no se emite:
    // la atribución pública es agregada ("Análisis de mercado Propyte"), así que
    // los nombres de proveedor no deben salir del servidor ni en el JSON.
    let latestScraped = '';
    for (const r of comparables) {
      if (r.scraped_at && r.scraped_at > latestScraped) latestScraped = r.scraped_at;
    }

    // Aggregate comparables by city
    const cityGroups: Record<string, RawComparable[]> = {};
    for (const r of comparables) {
      if (!cityGroups[r.city]) cityGroups[r.city] = [];
      cityGroups[r.city].push(r);
    }

    const cityStats = Object.entries(cityGroups).map(([cityName, rows]) => {
      const rents = rows.map(r => r.monthly_rent_mxn);
      const areasWithM2 = rows.filter(r => r.area_m2 && r.area_m2 >= AREA_MIN);
      const rentPerM2 = areasWithM2.map(r => r.monthly_rent_mxn / r.area_m2!);

      // By type
      const byType: Record<string, { count: number; avg_rent: number; median_rent: number }> = {};
      for (const r of rows) {
        const pt = r.property_type || 'otro';
        if (!byType[pt]) byType[pt] = { count: 0, avg_rent: 0, median_rent: 0 };
        byType[pt].count++;
      }
      for (const [pt, stats] of Object.entries(byType)) {
        const typeRents = rows.filter(r => (r.property_type || 'otro') === pt).map(r => r.monthly_rent_mxn);
        stats.median_rent = median(typeRents);
        stats.avg_rent = Math.round(typeRents.reduce((a, b) => a + b, 0) / typeRents.length);
      }

      // By bedrooms
      const byBedrooms: Record<string, { count: number; avg_rent: number; median_rent: number }> = {};
      for (const r of rows) {
        const beds = String(r.bedrooms ?? 'N/A');
        if (!byBedrooms[beds]) byBedrooms[beds] = { count: 0, avg_rent: 0, median_rent: 0 };
        byBedrooms[beds].count++;
      }
      for (const [beds, stats] of Object.entries(byBedrooms)) {
        const bedRents = rows.filter(r => String(r.bedrooms ?? 'N/A') === beds).map(r => r.monthly_rent_mxn);
        stats.median_rent = median(bedRents);
        stats.avg_rent = Math.round(bedRents.reduce((a, b) => a + b, 0) / bedRents.length);
      }

      return {
        city: cityName,
        count: rows.length,
        avg_rent: Math.round(rents.reduce((a, b) => a + b, 0) / rents.length),
        median_rent: median(rents),
        min_rent: Math.min(...rents),
        max_rent: Math.max(...rents),
        avg_rent_m2: rentPerM2.length > 0
          ? Math.round(rentPerM2.reduce((a, b) => a + b, 0) / rentPerM2.length * 100) / 100
          : null,
        median_rent_m2: rentPerM2.length > 0
          ? Math.round(median(rentPerM2) * 100) / 100
          : null,
        by_type: byType,
        by_bedrooms: byBedrooms,
      };
    }).sort((a, b) => b.count - a.count);

    // Model summary
    const modelInfo = financials.length > 0
      ? { version: str(financials[0].f.model_version), last_computed: str(financials[0].f.last_computed) }
      : null;

    return {
      comparables: comparables.map(r => ({
        city: r.city,
        zone: r.zone,
        pt: r.property_type,
        beds: r.bedrooms,
        rent: r.monthly_rent_mxn,
        m2: r.area_m2,
        rt: r.rental_type,
        fur: r.is_furnished,
      })),
      developments: financials.map(({ f, dev }) => {
        const d = dev as Record<string, unknown>;
        return {
          // `d` es un Record<string, unknown> que viene de PostgREST, asi que estos
          // campos NO estan verificados: se afirman aqui. Antes la afirmacion estaba
          // implicita y escondida por el boundary JSON (res.json() devuelve any, y el
          // cliente los declaraba string sin que nadie lo comprobara). Al pasar los
          // datos por props, tsc lo destapo. La afirmacion queda en un solo lugar.
          id: f.development_id as string,
          slug: str(d.slug),
          name: str(d.name),
          city: str(d.city),
          zone: nul(d.zone),
          stage: str(d.stage),
          price_min: num(d.price_min_mxn),
          price_max: num(d.price_max_mxn),
          image: (d.images as string[])?.[0] || null,
          roi_annual_pct: num(f.roi_annual_pct),
          irr_5yr: num(f.irr_5yr),
          irr_10yr: num(f.irr_10yr),
          cash_on_cash_pct: num(f.cash_on_cash_pct),
          breakeven_months: num(f.breakeven_months),
          monthly_net_flow: num(f.monthly_net_flow),
          cap_rate: num(f.cap_rate),
          rent_yield_gross: num(f.rent_yield_gross),
          rent_yield_net: num(f.rent_yield_net),
          estimated_rent: num(f.estimated_rent_residencial),
          estimated_rent_vac: num(f.estimated_rent_vacacional),
          roi_annual_pct_vac: num(f.roi_annual_pct_vac),
          irr_5yr_vac: num(f.irr_5yr_vac),
          cap_rate_vac: num(f.cap_rate_vac),
          rent_yield_gross_vac: num(f.rent_yield_gross_vac),
          rent_yield_net_vac: num(f.rent_yield_net_vac),
          monthly_net_flow_vac: num(f.monthly_net_flow_vac),
          occupancy_rate_vac: num(f.occupancy_rate_vac),
        };
      }),
      city_stats: cityStats,
      data_freshness: latestScraped || null,
      data_quality: {
        raw_count: allComparables.length,
        clean_count: comparables.length,
        removed_count: allComparables.length - comparables.length,
        removed_pct: Math.round((allComparables.length - comparables.length) / allComparables.length * 100),
        removed_reasons: removed,
      },
      model: modelInfo,
      total_comparables: comparables.length,
    };
  } catch (error) {
    console.error('[getRentalAnalysis]', error);
    return null;
  }
}
