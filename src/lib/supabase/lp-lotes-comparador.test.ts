import { describe, expect, it } from 'vitest';
import { construirComparables, type FilaComparador } from './lp-lotes-comparador';

// Fixtures REALES de producción (2026-09-01), recortadas a las columnas que el
// módulo selecciona. Reales y no sintéticas porque los casos que rompen la
// página son rarezas de ESTOS datos: un lote sin precio, uno con superficie
// 0.00, uno cuyo plan de pagos solo existe en prosa, y uno que solo declara
// los `ext_*` planos de la unidad (fuente b) — entre las cinco cubren las
// TRES fuentes de financiamiento que el módulo normaliza.

/** Fuente (a): JSONB `esquemas_pago`, con descuento por pronto pago escalonado. */
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

/**
 * Fuente (b): `ext_*` planos de la unidad — tasa + esquema en prosa + array de
 * meses, sin JSONB. Es además el lote que protagoniza esta landing: su
 * `development_id` es el que marca `esDeEstaLanding`.
 */
const EXT_PLANOS: FilaComparador = {
  id: 'ca6fffe4-3a0d-4ab2-82f7-5789fcb8bdc7',
  development_id: '025943d7-c7f1-482c-a489-09a28bb2328a',
  city: 'Playa del Carmen',
  area_m2: 129.6,
  price_mxn: 1010880,
  unit_type: 'Lote',
  fin_tasa: '0.00',
  fin_esquema: '20% de enganche + 60% en mensualidades + 20% contraentrega',
  fin_meses_opciones: [48, 60],
  fin_esquemas_pago: null,
};

/** Fuente (c): el plan entero descrito en una sola cadena, sin JSONB ni array de meses. */
const PROSA_DESARROLLO: FilaComparador = {
  id: '6ded606e-4f89-496c-a836-a0779234efbe',
  development_id: 'e539ee7c-4a7e-4b0b-b26c-2bc73260593a',
  city: 'Playa del Carmen',
  area_m2: 200,
  price_mxn: 1599840,
  unit_type: 'Lote',
  fin_tasa: null,
  fin_esquema:
    'Preventa: apartado $25,000, enganche 20%, 60% durante obra en 36 meses, 20% contra entrega · Contado: contado con 20% de descuento',
  fin_meses_opciones: [],
  fin_esquemas_pago: [
    { id: 'intake-1', meses: 0, tasa: 0, enganche_pct: 100, descuento_pct: 20, contraentrega_pct: 0, contraentrega_via: 'hipotecario', label: 'Contado', label_en: 'Cash', orden: 1, timing: 'prorrateado', destacado: false, enganche_pagos: 0 },
  ],
};

/**
 * Superficie 0.00: `numeroONull('0.00')` da 0, y el `??` de la línea del
 * fallback no cae con 0 (solo con null/undefined). El resultado de HOY es que
 * esta fila nunca rescata `superficieBase`, tenga o no dato la tabla base.
 * Documentado, no corregido — ver el reporte de esta tarea.
 */
const SUPERFICIE_CERO: FilaComparador = {
  id: '54329b45-c60b-48af-b479-a95015d3c33c',
  development_id: '09d27fcb-bbaf-4bb5-a7de-6d07a6575ec0',
  city: 'Playa del Carmen',
  area_m2: '0.00',
  price_mxn: 1720094,
  unit_type: 'Lote',
  fin_tasa: null,
  fin_esquema:
    'Esquema Financiero:\n\nOpcion1: 20% enganche, 20% a 24 meses, 60% a la entrega\n\nOpcion2: 30% enganche, 40% a 24 meses, 30% a la entrega (3% off)\n\nOpcion3: 90% enganche, 10% a la entrega (6% off)\n\n',
  fin_meses_opciones: [24],
  fin_esquemas_pago: [
    { id: 'sch_0_20922', meses: 0, tasa: 0, enganche_pct: 90, descuento_pct: 6, contraentrega_pct: 10, contraentrega_via: 'contado', label: 'Contado', label_en: 'Cash', orden: 0, timing: 'prorrateado', destacado: false, enganche_pagos: 0 },
  ],
};

describe('construirComparables', () => {
  it('calcula la mensualidad de 48 meses que publica la guía de Gamma', () => {
    const lotes = construirComparables(
      [ARRECIFES],
      new Map(),
      new Map([['b6dd225a-2338-476d-8e6f-478e9a7cfa88', 1854518]]),
    );
    expect(lotes).toHaveLength(1);
    const [lote] = lotes;

    // Control externo: la guía de Gamma publica $15,454.32 para este lote a 48
    // meses. Sale de precio de LISTA (1,854,518, no el publicado de 1,457,121.60
    // que ya trae el descuento de 12 meses) x (1 - 20% - 40%) / 48.
    expect(lote.precioListaMxn).toBe(1854518);
    expect(lote.plazos).toHaveLength(4);

    // El plazo de 12 meses es justo el de descuento MÁXIMO: su precio debe ser
    // el PUBLICADO tal cual, no una multiplicación sobre el de lista (los dos
    // difieren en unos pesos porque `descuento_pct` viene redondeado a 4
    // decimales). Mata la mutación que anula la rama
    // `descuentoPct === descuentoMaxPct`.
    const plazo12 = lote.plazos.find((p) => p.meses === 12);
    expect(plazo12?.precioMxn).toBe(1457121.6);

    const plazo48 = lote.plazos.find((p) => p.meses === 48);
    expect(plazo48).toBeDefined();
    expect(plazo48!.mensualidadMxn).toBeCloseTo(15454.32, 1);
  });

  it('descarta la fila sin precio en vez de publicar un lote sin cifra', () => {
    expect(construirComparables([SIN_PRECIO], new Map(), new Map())).toHaveLength(0);
  });

  it('normaliza la fuente ext_planos y cuenta "59 MSI + 1 mensualidad final"', () => {
    const lotes = construirComparables([EXT_PLANOS], new Map(), new Map());
    expect(lotes).toHaveLength(1);
    const [lote] = lotes;

    expect(lote.fuente).toBe('ext_planos');

    // El texto declara "59 MSI + 1 mensualidad final": en 60 meses hay 59
    // pagos, el último es la contraentrega. Mata la mutación `m - 1` → `m`.
    const plazo60 = lote.plazos.find((p) => p.meses === 60);
    expect(plazo60?.pagos).toBe(59);
  });

  it('normaliza la tercera fuente: el plan que solo existe en prosa', () => {
    const lotes = construirComparables([PROSA_DESARROLLO], new Map(), new Map());
    expect(lotes).toHaveLength(1);
    const [lote] = lotes;

    expect(lote.fuente).toBe('prosa_desarrollo');
    // El apartado solo lo declara esta fuente, y solo si el regex lee el
    // tramo de preventa completo. Mata la mutación de `[^%]*?` por `[^.]*?`
    // en `parsearPreventaProsa` — la que el propio archivo documenta como la
    // corrección más cara: sin ella, este lote con plan real a 36 meses se
    // publicaba como "se vende de contado".
    expect(lote.apartadoMxn).toBe(25000);
  });

  it('documenta el comportamiento actual con superficie "0.00": no rescata la tabla base', () => {
    const lotes = construirComparables(
      [SUPERFICIE_CERO],
      new Map([[SUPERFICIE_CERO.id, 500]]),
      new Map(),
    );
    expect(lotes).toHaveLength(1);
    // `superficieBase` SÍ trae dato (500) pero `numeroONull('0.00')` ya
    // devuelve 0, y 0 no es null/undefined: el `??` no cae al fallback.
    expect(lotes[0].superficieM2).toBe(0);
  });

  it('rescata la superficie de la tabla base cuando la vista no trae area_m2', () => {
    const fila: FilaComparador = { ...ARRECIFES, area_m2: null };
    const lotes = construirComparables([fila], new Map([[fila.id, 999]]), new Map());
    expect(lotes).toHaveLength(1);
    // Mata la mutación que borra el fallback `superficieBase.get(id)`: con
    // `area_m2` null, la única fuente posible es el Map.
    expect(lotes[0].superficieM2).toBe(999);
  });

  it('ordena el lote de esta landing primero aunque sea el más caro', () => {
    // EXT_PLANOS es el único fixture real cuyo `development_id` coincide con
    // el de esta landing, pero también es el más barato de los fixtures
    // reales disponibles: emparejarlo con cualquiera de ellos daría el mismo
    // orden con o sin el criterio `esDeEstaLanding`, porque ya gana por
    // precio. Para que el test distinga de verdad, el competidor es sintético
    // y deliberadamente más barato que EXT_PLANOS.
    const competidorBarato: FilaComparador = {
      id: 'competidor-orden-test',
      development_id: 'aaaaaaaa-0000-0000-0000-000000000000',
      city: 'Playa del Carmen',
      area_m2: 100,
      price_mxn: 500000,
      unit_type: 'Lote',
      fin_tasa: null,
      fin_esquema: null,
      fin_meses_opciones: null,
      fin_esquemas_pago: null,
    };

    const lotes = construirComparables([competidorBarato, EXT_PLANOS], new Map(), new Map());
    expect(lotes.map((l) => l.id)).toEqual([EXT_PLANOS.id, competidorBarato.id]);
  });
});
