import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import {
  findForbiddenProviderNames,
  PROPYTE_ATTRIBUTION_ES,
  PROPYTE_ATTRIBUTION_ES_INLINE,
} from './provider-names';

const SRC = path.resolve(__dirname, '../..');

/** Este archivo declara la lista, así que se excluye de su propio barrido. */
const SELF = ['provider-names.ts', 'provider-names.test.ts'];

/**
 * `withFileTypes` en vez de un `statSync` por entrada: el dirent ya dice si es
 * carpeta y el barrido se ahorra ~695 syscalls. En caliente da igual, pero con
 * la caché de FS fría cada `statSync` pega al disco y esta prueba se caía por
 * timeout de forma intermitente, pareciendo una regresión que no era.
 */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx|json)$/.test(entry.name) && !SELF.includes(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Barrido único, fuera del `it`, para no pagarlo dentro del timeout. */
const FUENTES = walk(SRC).map((ruta) => ({
  ruta,
  texto: readFileSync(ruta, 'utf8'),
  tipo: (ruta.endsWith('.json') ? 'json' : 'code') as 'json' | 'code',
}));

describe('nombres de proveedores de datos', () => {
  it('encuentra archivos que revisar', () => {
    expect(FUENTES.length).toBeGreaterThan(0);
  });

  it('no aparecen en ningún archivo de src', () => {
    const offenders: string[] = [];

    for (const { ruta, texto, tipo } of FUENTES) {
      const hits = findForbiddenProviderNames(texto, tipo);
      if (hits.length) {
        offenders.push(`${path.relative(SRC, ruta)} → ${hits.join(', ')}`);
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
