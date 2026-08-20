import { describe, expect, it } from 'vitest';
import {
  MAX_DATA_AGE_DAYS,
  formatDataThroughDate,
  grossMonthlyIncome,
  isStale,
  occupancyTrend,
  oldestDataThrough,
  omissionBadge,
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

describe('formatDataThroughDate', () => {
  it('no corre el mes hacia atras en un huso UTC-6 (trampa de zona horaria)', () => {
    // Esta maquina corre en UTC-6. new Date('2026-02-01') sin anclar a
    // T00:00:00Z, formateado sin timeZone: 'UTC', cae al dia anterior en la
    // zona local: enero en vez de febrero. Esto reprodujo el bug original
    // ("Corte julio de 2026" sobre una serie que cerro en febrero).
    expect(formatDataThroughDate('2026-02-01', 'es')).toBe('febrero de 2026');
    expect(formatDataThroughDate('2026-02-01', 'en')).toBe('February 2026');
  });

  it('respeta el limite de fin de mes (2026-01-31 sigue siendo enero)', () => {
    expect(formatDataThroughDate('2026-01-31', 'es')).toBe('enero de 2026');
  });

  it('respeta el limite de fin de anio (2025-12-31 sigue siendo diciembre 2025)', () => {
    expect(formatDataThroughDate('2025-12-31', 'es')).toBe('diciembre de 2025');
  });
});

describe('occupancyTrend', () => {
  it('recalibrado a la distribucion TTM, no a la de picos de febrero', () => {
    // La distribucion TTM real de las 16 zonas va de 39.7 a 60.7, mediana ~50.
    expect(occupancyTrend(60.7)).toBe('up');    // Aqua/Cumbres, la mas alta
    expect(occupancyTrend(39.7)).toBe('down');  // Zona de Resorts, la mas baja
    expect(occupancyTrend(50)).toBe('flat');
  });

  it('con los umbrales viejos (58/40) casi todo caia a flat', () => {
    // 47.4 = Bahia de Akumal. Con >58/<40 era 'flat'; ahora informa.
    expect(occupancyTrend(47.4)).not.toBe('up');
    expect(occupancyTrend(55.5)).toBe('up');
  });

  it('sin dato es flat', () => {
    expect(occupancyTrend(null)).toBe('flat');
  });

  it('en 54 exactos ya es up (umbral no estricto >=)', () => {
    expect(occupancyTrend(54)).toBe('up');
  });

  it('en 53.9 todavia no es up', () => {
    expect(occupancyTrend(53.9)).toBe('flat');
  });

  it('en 45 exactos ya es down (umbral no estricto <=)', () => {
    expect(occupancyTrend(45)).toBe('down');
  });

  it('en 45.1 todavia no es down', () => {
    expect(occupancyTrend(45.1)).toBe('flat');
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

describe('formatDataThroughDate: fechas ilegibles', () => {
  // Sin la guarda, toLocaleDateString sobre un Date invalido devuelve el
  // literal "Invalid Date" y la pagina lo publica como si fuera el corte de los
  // datos. Mismo criterio que isStale: ante una fecha ilegible, no inventar.
  it('devuelve null con un string que no es fecha', () => {
    expect(formatDataThroughDate('no-es-fecha', 'es')).toBeNull();
    expect(formatDataThroughDate('no-es-fecha', 'en')).toBeNull();
  });

  it('devuelve null con un mes fuera de rango', () => {
    expect(formatDataThroughDate('2026-13-01', 'es')).toBeNull();
  });

  it('devuelve null con string vacio, null y undefined', () => {
    expect(formatDataThroughDate('', 'es')).toBeNull();
    expect(formatDataThroughDate(null, 'es')).toBeNull();
    expect(formatDataThroughDate(undefined, 'es')).toBeNull();
  });

  it('nunca devuelve el literal "Invalid Date"', () => {
    for (const entrada of ['', 'ayer', '0000-00-00', '2026-02-31T', 'null']) {
      expect(formatDataThroughDate(entrada, 'es') ?? '').not.toContain('Invalid');
    }
  });
});

describe('oldestDataThrough', () => {
  // El maximo dejaba que una sola zona refrescada rotulara el tablero entero y
  // apagara el aviso de rancio de las demas. La unica fecha que el conjunto
  // sostiene es la mas antigua.
  it('devuelve la fecha mas antigua, no la mas reciente', () => {
    expect(
      oldestDataThrough([
        { data_through: '2026-08-01' },
        { data_through: '2026-02-01' },
        { data_through: '2026-06-01' },
      ]),
    ).toBe('2026-02-01');
  });

  it('una sola zona refrescada NO puede rotular el conjunto', () => {
    const zonas = [{ data_through: '2026-08-01' }, ...Array(25).fill({ data_through: '2026-02-01' })];
    expect(oldestDataThrough(zonas)).toBe('2026-02-01');
    // Y con la fecha correcta el aviso de serie rancia SI se dispara.
    expect(isStale(oldestDataThrough(zonas), new Date('2026-08-20T00:00:00Z'))).toBe(true);
  });

  it('ignora las zonas sin fecha', () => {
    expect(
      oldestDataThrough([
        { data_through: null },
        { data_through: '2026-05-01' },
        { data_through: null },
      ]),
    ).toBe('2026-05-01');
  });

  it('devuelve null sin ninguna fecha y con lista vacia', () => {
    expect(oldestDataThrough([{ data_through: null }])).toBeNull();
    expect(oldestDataThrough([])).toBeNull();
  });
});

describe('omissionBadge', () => {
  it('interpola los meses observados en la etiqueta de serie incompleta', () => {
    expect(omissionBadge('thin_cycle', 4)).toEqual({
      labelKey: 'thinCycleBadge',
      titleKey: 'thinCycleTitle',
      values: { n: 4, total: 12 },
    });
  });

  it('sin meses observados usa la variante SIN numero, no un 0 inventado', () => {
    for (const n of [null, undefined, 0, -3]) {
      expect(omissionBadge('thin_cycle', n)).toEqual({
        labelKey: 'thinCycleBadgeUnknown',
        titleKey: 'thinCycleTitle',
        values: {},
      });
    }
  });

  it('un conteo que no es una serie incompleta cae a la variante sin numero', () => {
    // 12 de 12 no es una serie incompleta, y 7.5 meses no existe.
    expect(omissionBadge('thin_cycle', 12)?.labelKey).toBe('thinCycleBadgeUnknown');
    expect(omissionBadge('thin_cycle', 7.5)?.labelKey).toBe('thinCycleBadgeUnknown');
  });

  it('cada razon trae su propio tooltip, no todas "muestra baja"', () => {
    expect(omissionBadge('missing:adr', null)).toEqual({
      labelKey: 'missingAdrBadge',
      titleKey: 'missingAdrTitle',
      values: {},
    });
    expect(omissionBadge('sample_below_30', null)).toEqual({
      labelKey: 'lowSampleBadge',
      titleKey: 'lowSampleTitle',
      values: {},
    });
    expect(omissionBadge('missing:revpar', null)).toEqual({
      labelKey: 'incompleteDataBadge',
      titleKey: 'incompleteDataTitle',
      values: {},
    });
  });

  it('sin razon no hay etiqueta', () => {
    expect(omissionBadge(null, 3)).toBeNull();
  });
});
