import { describe, it, expect } from 'vitest';
import { accumulateUnitStats } from './development-aggregates';

describe('accumulateUnitStats', () => {
  it('separa el mínimo de precio y área por tipo de producto', () => {
    // El caso que motiva D7: lotes baratos y casas caras en el mismo
    // desarrollo. Filtrar Casa y ver el precio del lote es la falla.
    const stats = accumulateUnitStats([
      { unit_type: 'Lote', price_mxn: 1_000_000, area_m2: null, lot_area_m2: 200 },
      { unit_type: 'Lote', price_mxn: 1_200_000, area_m2: null, lot_area_m2: 240 },
      { unit_type: 'Casa', price_mxn: 5_000_000, area_m2: 150, lot_area_m2: 300 },
    ]);
    expect(stats.terreno).toEqual({ priceMin: 1_000_000, areaMin: 200 });
    expect(stats.casa).toEqual({ priceMin: 5_000_000, areaMin: 150 });
  });

  it('las unidades sin tipo reconocible no crean una entrada', () => {
    const stats = accumulateUnitStats([
      { unit_type: null, price_mxn: 900_000, area_m2: 50, lot_area_m2: null },
      { unit_type: 'Nave industrial', price_mxn: 800_000, area_m2: 60, lot_area_m2: null },
    ]);
    expect(Object.keys(stats)).toHaveLength(0);
  });

  it('un precio ausente no borra el tipo, solo deja el precio en null', () => {
    const stats = accumulateUnitStats([
      { unit_type: 'Villa', price_mxn: null, area_m2: 180, lot_area_m2: null },
    ]);
    expect(stats.villa).toEqual({ priceMin: null, areaMin: 180 });
  });

  it('Supabase manda NUMERIC como string y no debe romper el mínimo', () => {
    const stats = accumulateUnitStats([
      { unit_type: 'Casa', price_mxn: '5000000', area_m2: '150.50', lot_area_m2: null },
      { unit_type: 'Casa', price_mxn: '4000000', area_m2: '140.00', lot_area_m2: null },
    ]);
    expect(stats.casa).toEqual({ priceMin: 4_000_000, areaMin: 140 });
  });
});
