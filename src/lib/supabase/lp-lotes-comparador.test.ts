import { describe, expect, it } from 'vitest';
import { construirComparables, type FilaComparador } from './lp-lotes-comparador';

// Fixture REAL de producción (2026-09-01), recortado a las columnas que el
// módulo selecciona. Real y no sintético porque los casos que rompen la página
// son rarezas de ESTOS datos: un lote sin precio, uno con superficie 0.00, y
// uno cuyo plan de pagos solo existe en prosa.
const ARRECIFES: FilaComparador = {
  id: '74173087-68fb-4b65-af17-898870941e1a',
  development_id: 'b6dd225a-2338-476d-8e6f-478e9a7cfa88',
  city: 'Playa del Carmen',
  area_m2: 180,
  price_mxn: 1457121.6,
  unit_type: 'Lote',
  fin_tasa: null,
  fin_esquema: null,
  fin_meses_opciones: null,
  fin_esquemas_pago: [
    { id: 'sch_0_32572', meses: 12, tasa: 0, enganche_pct: 20, descuento_pct: 21.4286, contraentrega_pct: 40, contraentrega_via: 'hipotecario', label: '12 Meses', label_en: '12 Months', orden: 0, timing: 'prorrateado', destacado: false, enganche_pagos: 0 },
    { id: 'sch_1_17113', meses: 24, tasa: 0, enganche_pct: 20, descuento_pct: 17.8571, contraentrega_pct: 40, contraentrega_via: 'hipotecario', label: '24 Meses', label_en: '24 Months', orden: 1, timing: 'prorrateado', destacado: false, enganche_pagos: 0 },
    { id: 'sch_2_2601', meses: 36, tasa: 0, enganche_pct: 20, descuento_pct: 10.7143, contraentrega_pct: 40, contraentrega_via: 'hipotecario', label: '36 Meses', label_en: '36 Months', orden: 2, timing: 'prorrateado', destacado: false, enganche_pagos: 0 },
    { id: 'sch_3_47752', meses: 48, tasa: 0, enganche_pct: 20, descuento_pct: 0, contraentrega_pct: 40, contraentrega_via: 'hipotecario', label: '48 Meses', label_en: '48 Months', orden: 3, timing: 'prorrateado', destacado: false, enganche_pagos: 0 },
  ],
};

const SIN_PRECIO: FilaComparador = {
  id: '656d84c0-32bb-4366-9754-865612dc28c4',
  development_id: '06ea760e-e0cf-45fc-a774-81efe5728a9d',
  city: 'Playa del Carmen',
  area_m2: 665.28,
  price_mxn: null,
  unit_type: 'Lote',
  fin_tasa: null,
  fin_esquema: 'Preguntar por planes de financiamiento.',
  fin_meses_opciones: null,
  fin_esquemas_pago: [
    { id: 'sch_0_43382', meses: 0, tasa: 0, enganche_pct: 90, descuento_pct: 0, contraentrega_pct: 10, contraentrega_via: 'hipotecario', label: 'Contado', label_en: 'Cash', orden: 0, timing: 'prorrateado', destacado: false, enganche_pagos: 0 },
  ],
};

describe('construirComparables', () => {
  it('calcula la mensualidad de 48 meses que publica la guía de Gamma', () => {
    // Control externo: la guía de Gamma publica $15,454.32 para este lote a 48
    // meses. Sale de precio de LISTA (1,854,518, no el publicado de 1,457,121.60
    // que ya trae el descuento de 12 meses) x (1 - 20% - 40%) / 48.
    const [lote] = construirComparables(
      [ARRECIFES],
      new Map(),
      new Map([['b6dd225a-2338-476d-8e6f-478e9a7cfa88', 1854518]]),
    );

    const plazo48 = lote.plazos.find((p) => p.meses === 48);
    expect(plazo48).toBeDefined();
    expect(plazo48!.mensualidadMxn).toBeCloseTo(15454.32, 1);
  });

  it('descarta la fila sin precio en vez de publicar un lote sin cifra', () => {
    expect(construirComparables([SIN_PRECIO], new Map(), new Map())).toHaveLength(0);
  });
});
