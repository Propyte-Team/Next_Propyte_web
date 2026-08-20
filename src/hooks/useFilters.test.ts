import { describe, it, expect } from 'vitest';
import { passesRoiMin, matchesProductType, projectForProductType } from './useFilters';
import type { Property } from '@/types/property';

/** Property mínima para probar el predicado de tipo. Solo los campos que
 *  `matchesProductType` lee; el resto no interviene. */
function devWith(specType: string, unitTypes?: string[]): Property {
  return {
    kind: 'development',
    specs: { type: specType },
    unitTypes,
  } as unknown as Property;
}

describe('passesRoiMin', () => {
  it('una unidad sin dato de ROI NO pasa un filtro de ROI mínimo', () => {
    // `null < 5` es true en JS por coerción a 0: sin guard explícito, las
    // unidades sin dato colaban en un filtro que pide rendimiento mínimo.
    expect(passesRoiMin(null, 5)).toBe(false);
  });

  it('sin filtro activo, todas pasan', () => {
    expect(passesRoiMin(null, 0)).toBe(true);
    expect(passesRoiMin(3, 0)).toBe(true);
  });

  it('compara normal cuando hay dato', () => {
    expect(passesRoiMin(7, 5)).toBe(true);
    expect(passesRoiMin(5, 5)).toBe(true);
    expect(passesRoiMin(3, 5)).toBe(false);
  });
});

describe('matchesProductType', () => {
  it('sin filtro activo, todo pasa', () => {
    expect(matchesProductType(devWith('departamento'), '')).toBe(true);
  });

  it('un desarrollo con lotes Y casas aparece bajo AMBOS filtros', () => {
    // El caso que motivó el cambio: la tarjeta ya mostraba «LOTES · CASAS»
    // pero el desarrollo desaparecía al filtrar por Casa, porque el predicado
    // comparaba contra specs.type — un escalar, el primero del array.
    const mixto = devWith('terreno', ['terreno', 'casa']);
    expect(matchesProductType(mixto, 'terreno')).toBe(true);
    expect(matchesProductType(mixto, 'casa')).toBe(true);
  });

  it('un desarrollo de un solo producto no aparece bajo otro', () => {
    const soloDepas = devWith('departamento', ['departamento']);
    expect(matchesProductType(soloDepas, 'casa')).toBe(false);
  });

  it('sin property_types resoluble, cae a specs.type', () => {
    // El fallback dispara cuando `property_types` no resuelve ningún tipo
    // canónico (null, vacío, o solo grafías no catalogadas) — no cuando el
    // desarrollo carece de unidades cargadas (eso ya no es la causa: tras la
    // migración, 0 de los 22 desarrollos visibles caen en este fallback). La
    // ruta de código sigue viva para el día que aparezca una grafía nueva sin
    // catalogar en `product-types.ts`.
    expect(matchesProductType(devWith('terreno'), 'terreno')).toBe(true);
    expect(matchesProductType(devWith('terreno'), 'casa')).toBe(false);
  });

  it('un array vacío no se toma como «no tiene tipos»: cae a specs.type', () => {
    expect(matchesProductType(devWith('casa', []), 'casa')).toBe(true);
  });

  it('para unidades sueltas sigue mandando specs.type', () => {
    const unidad = { kind: 'unit', specs: { type: 'penthouse' } } as unknown as Property;
    expect(matchesProductType(unidad, 'penthouse')).toBe(true);
    expect(matchesProductType(unidad, 'casa')).toBe(false);
  });
});

function devMixto(): Property {
  return {
    kind: 'development',
    specs: { type: 'terreno' },
    unitTypes: ['casa', 'terreno'],
    price: { mxn: 1_000_000 },
    areaMin: 200,
    unitTypeStats: {
      terreno: { priceMin: 1_000_000, areaMin: 200 },
      casa: { priceMin: 5_000_000, areaMin: 150 },
    },
  } as unknown as Property;
}

describe('projectForProductType', () => {
  it('sin filtro activo devuelve la misma property, sin copiar', () => {
    const p = devMixto();
    expect(projectForProductType(p, '')).toBe(p);
  });

  it('con filtro activo el «desde» pasa a ser el del producto filtrado', () => {
    const casa = projectForProductType(devMixto(), 'casa');
    expect(casa.price.mxn).toBe(5_000_000);
    expect(casa.areaMin).toBe(150);
  });

  it('no muta la property original', () => {
    const p = devMixto();
    projectForProductType(p, 'casa');
    expect(p.price.mxn).toBe(1_000_000);
  });

  it('sin agregado para ese tipo, deja los números del desarrollo', () => {
    const p = devMixto();
    const ph = projectForProductType(p, 'penthouse');
    expect(ph.price.mxn).toBe(1_000_000);
    expect(ph.areaMin).toBe(200);
  });

  it('un precio nulo en el agregado no borra el del desarrollo', () => {
    const p = {
      ...devMixto(),
      unitTypeStats: { villa: { priceMin: null, areaMin: 180 } },
      unitTypes: ['villa'],
    } as unknown as Property;
    const v = projectForProductType(p, 'villa');
    expect(v.price.mxn).toBe(1_000_000);
    expect(v.areaMin).toBe(180);
  });

  it('a una unidad suelta no le toca nada', () => {
    const u = { kind: 'unit', specs: { type: 'casa' }, price: { mxn: 3_000_000 } } as unknown as Property;
    expect(projectForProductType(u, 'casa')).toBe(u);
  });
});

describe('filtered: proyectar antes de filtrar (Important 2, revisión final de rama 2026-08-20)', () => {
  // Caso real ef05cd3a-fc1e-41de-a16b-b5f129c833cd: mínimo de DESARROLLO
  // 2,630,000; mínimo de CASA 5,211,926. El memo `filtered` de useFilters.ts
  // filtraba por precio sobre el array crudo y proyectaba después — el
  // predicado probaba el mínimo del desarrollo mientras la card, ya
  // proyectada, mostraba el de casa. Este helper replica el orden CORRECTO
  // (proyectar todo el catálogo primero, filtrar el array ya proyectado
  // después) tal como quedó el memo tras el fix.
  function devConMinimosDivergentes(): Property {
    return {
      kind: 'development',
      specs: { type: 'terreno' },
      unitTypes: ['casa', 'terreno'],
      price: { mxn: 2_630_000 },
      areaMin: 300,
      unitTypeStats: {
        terreno: { priceMin: 2_630_000, areaMin: 300 },
        casa: { priceMin: 5_211_926, areaMin: 180 },
      },
    } as unknown as Property;
  }

  function projectThenFilterByPrice(
    properties: Property[],
    filterType: string,
    priceMin: number,
    priceMax: number,
  ): Property[] {
    return properties
      .map((p) => projectForProductType(p, filterType))
      .filter((p) => p.price.mxn >= priceMin && p.price.mxn <= priceMax);
  }

  it('un desarrollo cuyo mínimo de TIPO está por encima del techo queda excluido, aunque el mínimo del desarrollo entre', () => {
    const dev = devConMinimosDivergentes();
    // El mínimo de desarrollo (2.63M) SÍ entraría en un rango 0–3M; el de casa
    // (5.21M) no. Con type=casa, debe excluirse.
    const result = projectThenFilterByPrice([dev], 'casa', 0, 3_000_000);
    expect(result).toHaveLength(0);
  });

  it('un desarrollo cuyo mínimo de TIPO cae dentro de un rango que el mínimo del desarrollo deja afuera queda incluido', () => {
    const dev = devConMinimosDivergentes();
    // El mínimo de desarrollo (2.63M) NO entra con un piso de 4M; el de casa
    // (5.21M) sí. Con type=casa y priceMin=4M, debe incluirse.
    const result = projectThenFilterByPrice([dev], 'casa', 4_000_000, Number.MAX_SAFE_INTEGER);
    expect(result).toHaveLength(1);
    expect(result[0].price.mxn).toBe(5_211_926);
  });

  it('documenta el defecto: filtrar con el precio crudo y proyectar después deja pasar el desarrollo con un precio proyectado fuera del rango', () => {
    const dev = devConMinimosDivergentes();
    const filteredByRawPriceFirst = [dev].filter((p) => p.price.mxn >= 0 && p.price.mxn <= 3_000_000);
    const projectedAfterFilter = filteredByRawPriceFirst.map((p) => projectForProductType(p, 'casa'));
    // El defecto: pasa el filtro (mínimo de desarrollo 2.63M ≤ 3M) y la card
    // termina mostrando «desde $5,211,926» — por encima del techo pedido.
    expect(projectedAfterFilter).toHaveLength(1);
    expect(projectedAfterFilter[0].price.mxn).toBe(5_211_926);
  });
});
