import { calculateRevPAR, VAC } from '@/lib/calculator';

export interface ZoneAirdnaRow {
  zone: string;
  submarket: string;
  occupancy: number | null; // 0-100
  adr: number | null;       // MXN
}

/** precio/m² de una sola unidad. null si falta área o precio (o son <= 0). */
export function unitPricePerM2(priceMxn: number | null, areaM2: number | null): number | null {
  if (!priceMxn || priceMxn <= 0 || !areaM2 || areaM2 <= 0) return null;
  return priceMxn / areaM2;
}

/** precio/m² de un desarrollo = promedio de (precio/m²) de sus unidades con área>0. */
export function developmentPricePerM2(
  units: Array<{ priceMxn: number | null; areaM2: number | null }>
): number | null {
  const values = units
    .map((u) => unitPricePerM2(u.priceMxn, u.areaM2))
    .filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Normaliza para comparar: quita diacríticos, espacios extremos y a minúsculas. */
function normalizeZone(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

/** Resuelve ocupación/ADR de la zona del item; fallback a nivel market. */
export function resolveZoneAirdna(
  itemZone: string | null,
  zones: ZoneAirdnaRow[],
  marketFallback: { occupancy: number | null; adr: number | null }
): { occupancy: number | null; adr: number | null } {
  if (itemZone) {
    const normItemZone = normalizeZone(itemZone);
    const match = zones.find((z) => normalizeZone(z.zone) === normItemZone);
    if (match && (match.occupancy !== null || match.adr !== null)) {
      return { occupancy: match.occupancy, adr: match.adr };
    }
  }
  return marketFallback;
}

/**
 * ROI vacacional all-cash (comparabilidad justa, sin apalancamiento).
 * netYieldPct = (RevPAR*365*(1-opCost)) / precio * 100
 * opCost usa VAC.TOTAL_COST_RATIO (gastos + comisión plataforma + admin, 0.53)
 * para ser consistente con el simulador de la ficha de propiedad.
 */
export function projectedVacationRoi(params: {
  priceMxn: number | null;
  adr: number | null;
  occupancyPct: number | null; // 0-100
}): number | null {
  const { priceMxn, adr, occupancyPct } = params;
  if (!priceMxn || priceMxn <= 0 || !adr || occupancyPct === null) return null;
  const revpar = calculateRevPAR(adr, occupancyPct / 100); // MXN/noche
  const grossAnnual = revpar * 365;
  const opCostRate = VAC.TOTAL_COST_RATIO;
  const netAnnual = grossAnnual * (1 - opCostRate);
  return (netAnnual / priceMxn) * 100;
}
