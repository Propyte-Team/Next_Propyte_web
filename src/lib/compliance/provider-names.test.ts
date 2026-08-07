import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  findForbiddenProviderNames,
  PROPYTE_ATTRIBUTION_ES,
  PROPYTE_ATTRIBUTION_ES_INLINE,
} from './provider-names';

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
      const hits = findForbiddenProviderNames(
        readFileSync(file, 'utf8'),
        file.endsWith('.json') ? 'json' : 'code',
      );
      if (hits.length) {
        offenders.push(`${path.relative(SRC, file)} → ${hits.join(', ')}`);
      }
    }

    expect(offenders, `La atribución pública es "Análisis de mercado Propyte". Corregir:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('permite los identificadores internos en minúscula', () => {
    expect(findForbiddenProviderNames('const airdnaOccupancy = row.airdna_metrics', 'code')).toEqual([]);
    expect(findForbiddenProviderNames('type AirdnaMarketSummary = { occupancy: number }', 'code')).toEqual([]);
  });

  it('permite Airbnb como categoría de renta vacacional', () => {
    expect(findForbiddenProviderNames('Vacacional (Airbnb)', 'code')).toEqual([]);
  });

  it('permite el nombre del proveedor en comentarios', () => {
    expect(findForbiddenProviderNames('// Sin dato AirDNA para este market', 'code')).toEqual([]);
    expect(findForbiddenProviderNames('/** Resuelve AirDNA por zona */', 'code')).toEqual([]);
  });

  it('sí detecta el nombre en una plantilla visible', () => {
    // El bug exacto que se está arreglando.
    expect(findForbiddenProviderNames('`con datos de mercado de AirDNA`', 'code')).toEqual(['AirDNA']);
  });

  it('en .json un "//" de URL no debe tapar lo que sigue en la misma línea', () => {
    // JSON no tiene comentarios. Tratar esta línea como código —stripComments
    // por defecto— trunca todo lo que sigue a "https://propyte.com" y
    // "AirDNA" desaparece del escaneo sin que nadie lo note.
    const line = '{"disclaimer": "Ver https://propyte.com para más detalle: AirDNA"}';
    expect(findForbiddenProviderNames(line, 'json')).toEqual(['AirDNA']);
  });
});

describe('atribución aprobada', () => {
  it('la variante de oración y la de etiqueta no se separan', () => {
    // Existen dos porque la gramática lo pide: «según el análisis de mercado
    // Propyte» en medio de una frase, «Análisis de mercado Propyte» como chip.
    // Si alguien edita una y olvida la otra, esto cae.
    expect(PROPYTE_ATTRIBUTION_ES_INLINE.toLowerCase())
      .toBe(PROPYTE_ATTRIBUTION_ES.toLowerCase());
  });

  it('la variante de oración empieza en minúscula y la de etiqueta en mayúscula', () => {
    expect(PROPYTE_ATTRIBUTION_ES_INLINE[0]).toBe('a');
    expect(PROPYTE_ATTRIBUTION_ES[0]).toBe('A');
  });
});
