import { buildAmortizationScheduleTiming, type AmortSchedule } from './calculator';

export interface EsquemaPago {
  id: string;
  label: string;
  enganche_pct: number;
  meses: number;
  tasa: number;
  descuento_pct: number;
  orden: number;
  destacado?: boolean;
  timing?: import('./calculator').TimingIntereses; // default 'prorrateado'
}

export interface EsquemaComputed {
  esquema: EsquemaPago;
  precioEfectivo: number;
  ahorro: number;
  enganche: number;
  financiado: number;
  esContado: boolean;
  schedule: AmortSchedule | null;
}

export function parseEsquemas(raw: unknown): EsquemaPago[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x, i) => ({
      id: String(x.id ?? `sch_${i}`),
      label: String(x.label ?? `Esquema ${i + 1}`),
      enganche_pct: Number(x.enganche_pct) || 0,
      meses: Number(x.meses) || 0,
      tasa: Number(x.tasa) || 0,
      descuento_pct: Number(x.descuento_pct) || 0,
      orden: Number(x.orden) || i,
      destacado: x.destacado === true,
      timing: (
        x.timing === 'al_inicio' || x.timing === 'al_final' || x.timing === 'prorrateado'
          ? x.timing
          : 'prorrateado'
      ) as import('./calculator').TimingIntereses,
    }))
    .sort((a, b) => a.orden - b.orden);
}

export function computeEsquema(precioLista: number, e: EsquemaPago): EsquemaComputed {
  const lista = Math.max(0, Number(precioLista) || 0);
  const precioEfectivo = Math.round(lista * (1 - (e.descuento_pct || 0) / 100));
  const ahorro = Math.max(0, lista - precioEfectivo);
  const esContado = !e.meses || e.meses <= 0;
  const enganche = esContado ? precioEfectivo : Math.round(precioEfectivo * (e.enganche_pct || 0) / 100);
  const financiado = esContado ? 0 : Math.max(0, precioEfectivo - enganche);
  const schedule = esContado
    ? null
    : buildAmortizationScheduleTiming(financiado, e.tasa || 0, e.meses, e.timing ?? 'prorrateado');
  return { esquema: e, precioEfectivo, ahorro, enganche, financiado, esContado, schedule };
}
