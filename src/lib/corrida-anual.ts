import type { AmortRow } from './calculator';

export interface AnnualRow {
  anio: number;
  cuota: number;
  interes: number;
  capital: number;
  saldoFinal: number;
  meses: AmortRow[];
}

/**
 * Agrupa una corrida mensual en filas anuales (12 meses/año) para la vista compacta.
 * Espera `rows` ordenadas ascendente por `mes` (como las emite buildAmortizationSchedule);
 * `saldoFinal` toma el saldo del último mes procesado de cada año. El último año puede
 * tener menos de 12 meses si el plazo no es múltiplo de 12.
 */
export function aggregateByYear(rows: AmortRow[]): AnnualRow[] {
  const byYear = new Map<number, AnnualRow>();
  for (const r of rows) {
    if (r.mes <= 0) continue;
    const anio = Math.floor((r.mes - 1) / 12) + 1;
    let y = byYear.get(anio);
    if (!y) {
      y = { anio, cuota: 0, interes: 0, capital: 0, saldoFinal: 0, meses: [] };
      byYear.set(anio, y);
    }
    y.cuota += r.cuota;
    y.interes += r.interes;
    y.capital += r.capital;
    y.saldoFinal = r.saldo;
    y.meses.push(r);
  }
  return Array.from(byYear.values()).sort((a, b) => a.anio - b.anio);
}
