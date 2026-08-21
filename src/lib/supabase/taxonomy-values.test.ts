import { describe, it, expect } from 'vitest';
import {
  STAGE_DB_VALUES,
  TYPE_DB_VALUES,
  OBSERVED_STAGE_VALUES,
  OBSERVED_TYPE_VALUES,
  VALUES_NOT_IN_INVENTORY,
} from './taxonomy-values';
import { STAGE_URL_SLUGS } from '@/app/[locale]/desarrollos/_components/stageConfig';
import { TYPE_SLUGS } from '@/app/[locale]/desarrollos/_components/typeConfig';
import { PRODUCT_TYPES } from '@/lib/catalog/product-types';

describe('contrato de taxonomía de facetas', () => {
  it('toda etapa expuesta en una URL resuelve a al menos una grafía del dato', () => {
    for (const canonical of Object.values(STAGE_URL_SLUGS)) {
      expect(STAGE_DB_VALUES[canonical], `falta la etapa "${canonical}"`).toBeDefined();
      expect(STAGE_DB_VALUES[canonical].length).toBeGreaterThan(0);
    }
  });

  it('todo tipo expuesto en una URL resuelve a al menos una grafía del dato', () => {
    for (const slug of TYPE_SLUGS) {
      expect(TYPE_DB_VALUES[slug], `falta el tipo "${slug}"`).toBeDefined();
      expect(TYPE_DB_VALUES[slug].length).toBeGreaterThan(0);
    }
  });

  it('ninguna grafía del mapa es un typo: o se observó en el inventario, o está declarada como ausente', () => {
    const stageAllowed = [...OBSERVED_STAGE_VALUES, ...VALUES_NOT_IN_INVENTORY];
    for (const values of Object.values(STAGE_DB_VALUES)) {
      for (const v of values) expect(stageAllowed, `"${v}" no está en el inventario ni declarada como ausente`).toContain(v);
    }

    const typeAllowed = [...OBSERVED_TYPE_VALUES, ...VALUES_NOT_IN_INVENTORY];
    for (const values of Object.values(TYPE_DB_VALUES)) {
      for (const v of values) expect(typeAllowed, `"${v}" no está en el inventario ni declarada como ausente`).toContain(v);
    }
  });

  it('toda grafía OBSERVADA del inventario está cubierta por algún canónico de TYPE_DB_VALUES', () => {
    // La prueba de arriba solo muerde en una dirección (mapa→observado): un
    // canónico que se queda CORTO — porque el Hub o Zoho empezaron a escribir
    // una grafía nueva que nadie agregó a PRODUCT_TYPE_SPELLINGS — pasaría
    // igual, porque no reclama nada que no esté declarado. Esa es la ausencia
    // silenciosa que product-types.ts advierte en su propio docblock: "si
    // alguien captura una grafía nueva en el Hub y no está aquí, ese
    // desarrollo deja de aparecer en su filtro — sin error, solo un resultado
    // menos". Esta prueba muerde en la dirección opuesta (observado→mapa).
    const allDbValues = Object.values(TYPE_DB_VALUES).flat();
    for (const observed of OBSERVED_TYPE_VALUES) {
      expect(allDbValues, `"${observed}" se observó en el inventario pero ningún canónico de TYPE_DB_VALUES la reclama`).toContain(observed);
    }
  });

  it('ningún valor del mapa es el slug crudo en minúscula', () => {
    // Exactamente el bug que se está arreglando: filtrar 'preventa' contra una
    // columna que guarda 'Preventa'. Si alguien "simplifica" el mapa poniendo
    // el slug tal cual, las facetas vuelven a cero y esto cae.
    const all = [...Object.values(STAGE_DB_VALUES), ...Object.values(TYPE_DB_VALUES)].flat();
    for (const v of all) expect(v, `"${v}" parece un slug, no una grafía del dato`).not.toBe(v.toLowerCase());
  });
});

/**
 * Las pruebas de arriba validan el mapa contra sí mismo: pasarían igual con el
 * bug presente, porque no tocan la consulta. Estas sí muerden — comprueban que
 * `getDevelopments` traduce el slug antes de filtrar.
 */
describe('getDevelopments traduce el slug antes de filtrar', () => {
  /** Registra las llamadas al query builder y devuelve un resultado vacío. */
  function spyClient() {
    const calls: Array<{ op: string; args: unknown[] }> = [];
    const builder: Record<string, unknown> = {};
    const chain = (op: string) => (...args: unknown[]) => { calls.push({ op, args }); return builder; };
    for (const op of ['select', 'not', 'is', 'eq', 'in', 'contains', 'overlaps', 'gte', 'lte', 'or', 'order', 'range', 'limit']) {
      builder[op] = chain(op);
    }
    // El await final resuelve como una promesa sin filas.
    builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve({ data: [], count: 0, error: null }).then(resolve);
    const client = {
      schema: () => ({ from: (...args: unknown[]) => { calls.push({ op: 'from', args }); return builder; } }),
    };
    return { client, calls };
  }

  it('la etapa "preventa" consulta por "Preventa", no por el slug', async () => {
    const { getDevelopments } = await import('./queries');
    const { client, calls } = spyClient();

    await getDevelopments(client as never, { stage: 'preventa' });

    const stageCall = calls.find((c) => c.args[0] === 'stage');
    expect(stageCall, 'no se filtró por stage').toBeDefined();
    expect(stageCall!.args[1], 'se filtró por el slug crudo en vez de la grafía del dato').not.toBe('preventa');
    expect(stageCall!.args[1]).toEqual(STAGE_DB_VALUES.preventa);
  });

  it('el tipo "departamento" consulta por "Departamento", no por el slug', async () => {
    const { getDevelopments } = await import('./queries');
    const { client, calls } = spyClient();

    await getDevelopments(client as never, { type: 'departamento' });

    const typeCall = calls.find((c) => c.args[0] === 'property_types');
    expect(typeCall, 'no se filtró por property_types').toBeDefined();
    expect(typeCall!.args[1], 'se filtró por el slug crudo en vez de la grafía del dato').not.toEqual(['departamento']);
    expect(typeCall!.args[1]).toEqual(TYPE_DB_VALUES.departamento);
  });

  it('el tipo "terreno" cubre todas sus grafías del inventario', async () => {
    const { getDevelopments } = await import('./queries');
    const { client, calls } = spyClient();

    await getDevelopments(client as never, { type: 'terreno' });

    const typeCall = calls.find((c) => c.args[0] === 'property_types');
    expect(typeCall!.args[1]).toEqual(TYPE_DB_VALUES.terreno);
    expect(typeCall!.args[1] as string[]).toContain('Lotes');
  });
});

describe('TYPE_DB_VALUES deriva del catálogo', () => {
  it('cubre los siete canónicos', () => {
    expect(Object.keys(TYPE_DB_VALUES).sort()).toEqual([...PRODUCT_TYPES].sort());
  });

  it('las grafías nuevas están: sin ellas la faceta se vacía en silencio', () => {
    expect(TYPE_DB_VALUES.villa).toContain('Villa');
    expect(TYPE_DB_VALUES.comercial).toContain('Local comercial');
    expect(TYPE_DB_VALUES.comercial).toContain('Oficina');
    expect(TYPE_DB_VALUES.terreno).toContain('Lotes');
  });
});
