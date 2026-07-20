// src/lib/preventa.ts
import { buildAmortizationSchedule, type AmortSchedule } from './calculator';

export type ContraentregaVia = 'hipotecario' | 'interno';

export interface PreventaConfig {
  enganche_inicial_pct: number;
  enganche_diferido_pct: number;
  enganche_diferido_meses: number;
  obra_pct: number;
  obra_meses: number;
  contraentrega_pct: number;
  contraentrega_via: ContraentregaVia;
}

export interface PreventaComputed {
  precioVenta: number;
  engancheInicial: number;
  engancheInicialPct: number;
  engancheDiferido: number;
  engancheDiferidoPct: number;
  engancheDiferidoMeses: number;
  engancheDiferidoMensual: number;
  obra: number;
  obraPct: number;
  obraMeses: number;
  obraMensual: number;
  contraentrega: number;
  contraentregaPct: number;
  contraentregaVia: ContraentregaVia;
  sumaPct: number;
  balanceado: boolean;
}

const VIAS: ContraentregaVia[] = ['hipotecario', 'interno'];

/** Tolerant reader for the Hub JSONB config. Returns null when unconfigured -> Mode B. */
export function parsePreventa(raw: unknown): PreventaConfig | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const x = raw as Record<string, unknown>;
  const via = VIAS.includes(x.contraentrega_via as ContraentregaVia)
    ? (x.contraentrega_via as ContraentregaVia)
    : 'hipotecario';
  const cfg: PreventaConfig = {
    enganche_inicial_pct: Number(x.enganche_inicial_pct) || 0,
    enganche_diferido_pct: Number(x.enganche_diferido_pct) || 0,
    enganche_diferido_meses: Number(x.enganche_diferido_meses) || 0,
    obra_pct: Number(x.obra_pct) || 0,
    obra_meses: Number(x.obra_meses) || 0,
    contraentrega_pct: Number(x.contraentrega_pct) || 0,
    contraentrega_via: via,
  };
  const total =
    cfg.enganche_inicial_pct + cfg.enganche_diferido_pct + cfg.obra_pct + cfg.contraentrega_pct;
  if (total <= 0) return null; // objeto vacio/basura -> sin configurar
  return cfg;
}

export function computePreventa(precioVenta: number, cfg: PreventaConfig): PreventaComputed {
  const pct = (p: number) => Math.round((precioVenta * p) / 100);
  const engancheInicial = pct(cfg.enganche_inicial_pct);
  const engancheDiferido = pct(cfg.enganche_diferido_pct);
  const obra = pct(cfg.obra_pct);
  const contraentrega = pct(cfg.contraentrega_pct);
  const sumaPct =
    cfg.enganche_inicial_pct + cfg.enganche_diferido_pct + cfg.obra_pct + cfg.contraentrega_pct;
  return {
    precioVenta,
    engancheInicial,
    engancheInicialPct: cfg.enganche_inicial_pct,
    engancheDiferido,
    engancheDiferidoPct: cfg.enganche_diferido_pct,
    engancheDiferidoMeses: cfg.enganche_diferido_meses,
    engancheDiferidoMensual:
      cfg.enganche_diferido_meses > 0 ? Math.round(engancheDiferido / cfg.enganche_diferido_meses) : 0,
    obra,
    obraPct: cfg.obra_pct,
    obraMeses: cfg.obra_meses,
    obraMensual: cfg.obra_meses > 0 ? Math.round(obra / cfg.obra_meses) : 0,
    contraentrega,
    contraentregaPct: cfg.contraentrega_pct,
    contraentregaVia: cfg.contraentrega_via,
    sumaPct,
    balanceado: Math.abs(sumaPct - 100) < 0.01,
  };
}

/** El saldo de contraentrega se financia completo (el enganche ya ocurrio en preventa). */
export function buildContraentregaSchedule(
  contraentrega: number,
  via: ContraentregaVia,
  opts: {
    tasaHipotecarioPct: number;
    mesesHipotecario: number;
    tasaInternoPct: number;
    mesesInterno: number;
  },
): AmortSchedule {
  if (via === 'interno') {
    return buildAmortizationSchedule(contraentrega, opts.tasaInternoPct, opts.mesesInterno);
  }
  return buildAmortizationSchedule(contraentrega, opts.tasaHipotecarioPct, opts.mesesHipotecario);
}
