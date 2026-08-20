import { describe, it, expect } from 'vitest';
import { normalizeTypeForRentalComparables } from './queries';
import { resolveSpecType } from '@/lib/mappers/development-to-property';

/** Grafías reales de `investment_analytics.rental_comparables.property_type`,
 *  confirmadas por consulta directa el 2026-08-20:
 *    SELECT DISTINCT property_type FROM investment_analytics.rental_comparables;
 *    → 'casa' (6124 filas), 'departamento' (9348 filas). Nada más. */
const COMPARABLES_PROPERTY_TYPES = new Set(['casa', 'departamento']);

describe('resolveSpecType → normalizeTypeForRentalComparables (Important 1, regresión)', () => {
  // Antes del fix, DevelopmentDetailPage/generate-pdf pasaban
  // `property.property_types?.[0]` crudo a getRentalEstimate. Para los 12
  // desarrollos sin ext_property_types, eso era 'Departamento'/'Lote'/'Casa'/
  // '2 Recámaras' — ninguno calza contra rental_comparables (que no tiene
  // mayúsculas) y las 3 consultas type-filtradas fallaban en silencio.
  it('grafías crudas típicas del catálogo resuelven a un canónico que SÍ está en rental_comparables', () => {
    expect(
      normalizeTypeForRentalComparables(resolveSpecType(['Departamento'], null)),
    ).toBe('departamento');
    expect(
      COMPARABLES_PROPERTY_TYPES.has(normalizeTypeForRentalComparables(resolveSpecType(['Casa'], null))!),
    ).toBe(true);
    // '2 Recámaras' es grafía de departamento (ver PRODUCT_TYPE_SPELLINGS).
    expect(
      normalizeTypeForRentalComparables(resolveSpecType(['2 Recámaras', 'Departamento', 'Estudio'], null)),
    ).toBe('departamento');
  });

  it('terreno/macrolote/comercial NO calzan a propósito: no rentan como vivienda', () => {
    // Estos deben degradar honestamente al bucket solo-ciudad de
    // getRentalEstimate, no fingir que hay comparables de su tipo.
    expect(
      COMPARABLES_PROPERTY_TYPES.has(normalizeTypeForRentalComparables(resolveSpecType(['Lote'], null))!),
    ).toBe(false);
    expect(
      COMPARABLES_PROPERTY_TYPES.has(normalizeTypeForRentalComparables(resolveSpecType(['Local comercial'], null))!),
    ).toBe(false);
  });

  it('villa/penthouse resuelven a un canónico propio y luego se remapean a algo que SÍ está en rental_comparables', () => {
    expect(
      COMPARABLES_PROPERTY_TYPES.has(normalizeTypeForRentalComparables(resolveSpecType(['Villa'], null))!),
    ).toBe(true);
    expect(
      COMPARABLES_PROPERTY_TYPES.has(normalizeTypeForRentalComparables(resolveSpecType(['Penthouse'], null))!),
    ).toBe(true);
  });
});

describe('normalizeTypeForRentalComparables', () => {
  it('villa busca entre los comparables de casa: rental_comparables no tiene filas de villa', () => {
    expect(normalizeTypeForRentalComparables('villa')).toBe('casa');
  });

  it('penthouse sigue buscando entre los comparables de departamento', () => {
    expect(normalizeTypeForRentalComparables('penthouse')).toBe('departamento');
  });

  it('el resto de los tipos no se toca', () => {
    expect(normalizeTypeForRentalComparables('casa')).toBe('casa');
    expect(normalizeTypeForRentalComparables('departamento')).toBe('departamento');
    expect(normalizeTypeForRentalComparables('terreno')).toBe('terreno');
    expect(normalizeTypeForRentalComparables(null)).toBeNull();
    expect(normalizeTypeForRentalComparables(undefined)).toBeUndefined();
  });
});
