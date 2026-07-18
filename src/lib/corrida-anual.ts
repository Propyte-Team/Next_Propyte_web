import type { AmortRow } from './calculator';

export interface AnnualRow {
  anio: number;
  cuota: number;
  interes: number;
  capital: number;
  saldoFinal: number;
  meses: AmortRow[];
}

/** Agrupa una corrida mensual en filas anuales (12 meses/año) para la vista compacta. */
export function aggregateByYear(rows: AmortRow[]): AnnualRow[] {
  const years: AnnualRow[] = [];
  for (const r of rows) {
    const idx = Math.floor((r.mes - 1) / 12);
    let y = years[idx];
    if (!y) {
      y = { anio: idx + 1, cuota: 0, interes: 0, capital: 0, saldoFinal: 0, meses: [] };
      years[idx] = y;
    }
    y.cuota += r.cuota;
    y.interes += r.interes;
    y.capital += r.capital;
    y.saldoFinal = r.saldo; // último mes visto = fin de año
    y.meses.push(r);
  }
  return years;
}
