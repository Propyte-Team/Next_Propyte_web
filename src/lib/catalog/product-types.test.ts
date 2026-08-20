import { describe, it, expect } from 'vitest';
import { PRODUCT_TYPES, PRODUCT_TYPE_SPELLINGS, resolveProductType } from './product-types';
import type { Property } from '@/types/property';
import { normalizeUnitType } from '@/lib/mappers/unit-to-property';

describe('catálogo de tipos de producto', () => {
  it('son exactamente siete, en orden de presentación', () => {
    expect(PRODUCT_TYPES).toEqual([
      'departamento', 'penthouse', 'casa', 'villa', 'terreno', 'macrolote', 'comercial',
    ]);
  });

  it('cada canónico declara al menos una grafía', () => {
    for (const t of PRODUCT_TYPES) {
      expect(PRODUCT_TYPE_SPELLINGS[t].length, `${t} sin grafías`).toBeGreaterThan(0);
    }
  });

  it('ninguna grafía está declarada en dos canónicos', () => {
    const vistas = new Map<string, string>();
    for (const t of PRODUCT_TYPES) {
      for (const g of PRODUCT_TYPE_SPELLINGS[t]) {
        const k = g.toLowerCase();
        expect(vistas.has(k), `«${g}» está en ${vistas.get(k)} y en ${t}`).toBe(false);
        vistas.set(k, t);
      }
    }
  });
});

describe('resolveProductType', () => {
  it('resuelve las grafías que el inventario tiene hoy', () => {
    // Verificadas contra la base el 2026-08-20.
    expect(resolveProductType('Departamento')).toBe('departamento');
    expect(resolveProductType('Casa')).toBe('casa');
    expect(resolveProductType('Terreno')).toBe('terreno');
    expect(resolveProductType('Lote')).toBe('terreno');
    expect(resolveProductType('Lotes')).toBe('terreno');
    expect(resolveProductType('Terrenos')).toBe('terreno');
    expect(resolveProductType('Penthouse')).toBe('penthouse');
    expect(resolveProductType('Villa')).toBe('villa');
    expect(resolveProductType('Estudio')).toBe('departamento');
    expect(resolveProductType('2 Recámaras')).toBe('departamento');
  });

  it('Oficina y Local comercial dejan de ser «departamento»', () => {
    // El cajon silencioso: normalizeUnitType mandaba a 'departamento' todo lo
    // que no reconocia, y el comprador veia «Departamentos» sobre una oficina.
    expect(resolveProductType('Oficina')).toBe('comercial');
    expect(resolveProductType('Local comercial')).toBe('comercial');
    expect(resolveProductType('Lote comercial')).toBe('comercial');
  });

  it('Villa deja de ser «casa»', () => {
    expect(resolveProductType('Villa')).not.toBe('casa');
  });

  it('Condominio queda fuera del catálogo: es régimen, no producto', () => {
    expect(resolveProductType('Condominio')).toBeNull();
  });

  it('vacío, nulo y desconocido no inventan un tipo', () => {
    // 162 filas de unidad tienen tipo_unidad NULL. Rellenarlas con
    // «departamento» es exactamente la mentira que se está quitando.
    expect(resolveProductType(null)).toBeNull();
    expect(resolveProductType(undefined)).toBeNull();
    expect(resolveProductType('')).toBeNull();
    expect(resolveProductType('   ')).toBeNull();
    expect(resolveProductType('Nave industrial')).toBeNull();
  });

  it('tolera variantes no catalogadas por prefijo', () => {
    expect(resolveProductType('lote residencial')).toBe('terreno');
    expect(resolveProductType('CASA DE PLAYA')).toBe('casa');
    expect(resolveProductType('  Villas  ')).toBe('villa');
  });

  it('«Lote comercial» gana comercial, no terreno: el orden importa', () => {
    expect(resolveProductType('Lote comercial')).toBe('comercial');
    expect(resolveProductType('Lote')).toBe('terreno');
  });
});

describe('el union de Property se alinea al catálogo', () => {
  it('specs.type acepta los siete canónicos', () => {
    // Prueba de tipos: si el union no creció, esto no compila.
    const tipos: Array<Property['specs']['type']> = [...PRODUCT_TYPES];
    expect(tipos).toHaveLength(7);
  });
});

describe('normalizeUnitType', () => {
  it('delega en el catálogo y ya no inventa un tipo', () => {
    expect(normalizeUnitType('Oficina')).toBe('comercial');
    expect(normalizeUnitType('Villa')).toBe('villa');
    expect(normalizeUnitType(null)).toBeNull();
    expect(normalizeUnitType('Nave industrial')).toBeNull();
  });
});
