import { describe, expect, it } from 'vitest';
import {
  MAX_DATA_AGE_DAYS,
  grossMonthlyIncome,
  isStale,
  omissionLabelKey,
} from '@/lib/rental-data/zone-metrics';

describe('grossMonthlyIncome', () => {
  it('multiplica ADR por ocupacion por 30', () => {
    // Bahia de Akumal con la mediana TTM real: 5261 * 0.474 * 30
    expect(grossMonthlyIncome(5261, 47.4)).toBe(74811);
  });

  it('el valor honesto es muy inferior al que se publicaba con el pico de febrero', () => {
    const conPicoFebrero = grossMonthlyIncome(5261, 72.46)!;
    const conMedianaTtm = grossMonthlyIncome(5261, 47.4)!;
    expect(conPicoFebrero).toBeGreaterThan(conMedianaTtm * 1.5);
  });

  it('devuelve null, nunca 0, cuando falta un insumo', () => {
    expect(grossMonthlyIncome(null, 47.4)).toBeNull();
    expect(grossMonthlyIncome(5261, null)).toBeNull();
    expect(grossMonthlyIncome(null, null)).toBeNull();
  });

  it('trata el 0 y los negativos como ausentes', () => {
    expect(grossMonthlyIncome(0, 47.4)).toBeNull();
    expect(grossMonthlyIncome(5261, 0)).toBeNull();
    expect(grossMonthlyIncome(-100, 47.4)).toBeNull();
  });
});

describe('isStale', () => {
  const hoy = new Date('2026-08-20T00:00:00Z');

  it('marca rancia una serie que cerro en febrero', () => {
    expect(isStale('2026-02-01', hoy)).toBe(true);
  });

  it('no marca rancia una serie dentro del umbral', () => {
    expect(isStale('2026-08-01', hoy)).toBe(false);
  });

  it('sin fecha se considera rancia', () => {
    expect(isStale(null, hoy)).toBe(true);
  });

  it('el umbral es el mismo que usa pipeline_health', () => {
    expect(MAX_DATA_AGE_DAYS).toBe(35);
  });

  it('a los 35 dias exactos todavia NO es rancia (umbral estricto >)', () => {
    // 2026-01-01 + 35 dias = 2026-02-05, calculado a mano (no con aritmetica
    // de fechas dentro del test, para no heredar el bug que esto detecta).
    expect(isStale('2026-01-01', new Date('2026-02-05T00:00:00Z'))).toBe(false);
  });

  it('a los 36 dias ya es rancia', () => {
    // 2026-01-01 + 36 dias = 2026-02-06, calculado a mano.
    expect(isStale('2026-01-01', new Date('2026-02-06T00:00:00Z'))).toBe(true);
  });

  it('una fecha no parseable se considera rancia', () => {
    expect(isStale('no-es-fecha', hoy)).toBe(true);
  });

  it('un string vacio se considera rancio', () => {
    expect(isStale('', hoy)).toBe(true);
  });
});

describe('omissionLabelKey', () => {
  it('distingue muestra chica de tarifa ausente', () => {
    expect(omissionLabelKey('sample_below_30')).toBe('lowSampleBadge');
    expect(omissionLabelKey('missing:adr')).toBe('missingAdrBadge');
    expect(omissionLabelKey('thin_cycle')).toBe('thinCycleBadge');
  });

  it('los otros tres missing:* colapsan a incompleteDataBadge', () => {
    // occupancy, adr_growth_pct y revpar no traen etiqueta propia: al lector
    // no le hace falta saber cual componente interno falto.
    expect(omissionLabelKey('missing:occupancy')).toBe('incompleteDataBadge');
    expect(omissionLabelKey('missing:adr_growth_pct')).toBe('incompleteDataBadge');
    expect(omissionLabelKey('missing:revpar')).toBe('incompleteDataBadge');
  });

  it('sin razon no hay etiqueta', () => {
    expect(omissionLabelKey(null)).toBeNull();
  });
});
