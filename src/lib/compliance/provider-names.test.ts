import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { findForbiddenProviderNames } from './provider-names';

const SRC = path.resolve(__dirname, '../..');

/** Este archivo declara la lista, así que se excluye de su propio barrido. */
const SELF = ['provider-names.ts', 'provider-names.test.ts'];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx|json)$/.test(entry) && !SELF.includes(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('nombres de proveedores de datos', () => {
  it('no aparecen en ningún archivo de src', () => {
    const offenders: string[] = [];

    for (const file of walk(SRC)) {
      const hits = findForbiddenProviderNames(readFileSync(file, 'utf8'));
      if (hits.length) {
        offenders.push(`${path.relative(SRC, file)} → ${hits.join(', ')}`);
      }
    }

    expect(offenders, `La atribución pública es "Análisis de mercado Propyte". Corregir:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('permite los identificadores internos en minúscula', () => {
    expect(findForbiddenProviderNames('const airdnaOccupancy = row.airdna_metrics')).toEqual([]);
    expect(findForbiddenProviderNames('type AirdnaMarketSummary = { occupancy: number }')).toEqual([]);
  });

  it('permite Airbnb como categoría de renta vacacional', () => {
    expect(findForbiddenProviderNames('Vacacional (Airbnb)')).toEqual([]);
  });

  it('permite el nombre del proveedor en comentarios', () => {
    expect(findForbiddenProviderNames('// Sin dato AirDNA para este market')).toEqual([]);
    expect(findForbiddenProviderNames('/** Resuelve AirDNA por zona */')).toEqual([]);
  });

  it('sí detecta el nombre en una plantilla visible', () => {
    // El bug exacto que se está arreglando.
    expect(findForbiddenProviderNames('`con datos de mercado de AirDNA`')).toEqual(['AirDNA']);
  });
});
