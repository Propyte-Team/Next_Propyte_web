import { buildAmortizationSchedule, type AmortSchedule } from './calculator';

export type PerfilHipotecario = 'nacional' | 'extranjero';

export interface HipotecarioConfig {
  tasaAnualPct: number;
  meses: number;
  moneda: 'MXN' | 'USD';
  /** Enganche de arranque del perfil (Nacional usa este como piso; Extranjero es fijo). */
  enganchePct: number;
  avisoCambiario: boolean;
}

// Config global (arranque, ajustable) — spec §5.
export const HIPOTECARIO_CONFIG: Record<PerfilHipotecario, HipotecarioConfig> = {
  nacional: { tasaAnualPct: 10.5, meses: 240, moneda: 'MXN', enganchePct: 20, avisoCambiario: false },
  extranjero: { tasaAnualPct: 9.5, meses: 360, moneda: 'USD', enganchePct: 35, avisoCambiario: true },
};

export interface HipotecarioResult {
  perfil: PerfilHipotecario;
  config: HipotecarioConfig;
  enganchePct: number;
  enganche: number;
  /** Monto financiado = precioVenta − enganche. */
  saldo: number;
  schedule: AmortSchedule;
}

/**
 * Corrida hipotecaria para `precioVenta` (ya con descuento aplicado) y `perfil`.
 * Enganche FIJO por perfil: 20% nacional / 35% extranjero. NO hereda el enganche del
 * financiamiento directo de la unidad (`fin_enganche_pct`), que es del desarrollador y
 * no de un crédito bancario (decisión Luis 2026-07-21). Reusa la amortización francesa.
 * `downPaymentMinPct` se mantiene por compatibilidad de firma pero ya no se usa.
 */
export function computeHipotecario(
  precioVenta: number,
  perfil: PerfilHipotecario,
  downPaymentMinPct?: number, // eslint-disable-line @typescript-eslint/no-unused-vars -- legacy, enganche ahora es fijo por perfil
): HipotecarioResult {
  const config = HIPOTECARIO_CONFIG[perfil];
  const precio = Math.max(0, Number(precioVenta) || 0);
  const enganchePct = config.enganchePct;
  const enganche = Math.round(precio * enganchePct / 100);
  const saldo = Math.max(0, precio - enganche);
  const schedule = buildAmortizationSchedule(saldo, config.tasaAnualPct, config.meses);
  return { perfil, config, enganchePct, enganche, saldo, schedule };
}
