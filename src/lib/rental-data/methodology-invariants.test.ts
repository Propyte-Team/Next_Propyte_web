import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import es from '@/i18n/messages/es.json';
import { isStale, MAX_DATA_AGE_DAYS } from './zone-metrics';
import { findForbiddenProviderNames } from '../compliance/provider-names';

/**
 * Invariantes de metodología.
 *
 * Los dos bugs de la auditoría de ago-2026 comparten forma: lo que la página
 * afirmaba no coincidía con lo que el código calculaba. Estos tests verifican
 * la coincidencia, no el cálculo.
 *
 * Corren contra datos de muestra congelados (no contra la BD viva) para que
 * sean deterministas: la BD es un entorno, no una aserción.
 */

// Fila real de zone_scores tal como la escribe el pipeline corregido.
const FILA = {
  zone: 'Bahía de Akumal',
  score: 88.1,
  occupancy_component: 92.2,
  adr_growth_component: 98.6,
  supply_pressure_component: 85.3,
  occupancy_p50_ttm: 47.435,
  data_through: '2026-02-01',
  computed_at: '2026-08-20',
};

// Último punto de la serie del submercado: el valor que se publicaba antes
// (el bug: pico de febrero mostrado como si fuera la mediana TTM).
const ULTIMO_PUNTO_DE_LA_SERIE = 72.46;

describe('ninguna cifra publicada es un punto único', () => {
  it('occupancy_p50_ttm no es el último punto de la serie', () => {
    expect(FILA.occupancy_p50_ttm).not.toBe(ULTIMO_PUNTO_DE_LA_SERIE);
  });
});

describe('data_through es independiente de computed_at', () => {
  it('la fecha del dato no es la fecha de la corrida', () => {
    expect(FILA.data_through).not.toBe(FILA.computed_at);
  });

  it('la brecha entre data_through y computed_at de esta fila excede MAX_DATA_AGE_DAYS', () => {
    // No es un detalle incidental de la fixture: es la prueba de por qué
    // `data_through` y `computed_at` deben tratarse como independientes. Esta
    // fila describe una corrida de agosto sobre datos de febrero — si el
    // código tratara "corrida reciente" como sinónimo de "dato fresco", este
    // ejemplo publicaría una cifra de 6+ meses de antigüedad como si fuera de hoy.
    const dataThrough = new Date(`${FILA.data_through}T00:00:00Z`);
    const computedAt = new Date(`${FILA.computed_at}T00:00:00Z`);
    const gapDays = (computedAt.getTime() - dataThrough.getTime()) / 86_400_000;
    expect(gapDays).toBeGreaterThan(MAX_DATA_AGE_DAYS);
    expect(isStale(FILA.data_through, computedAt)).toBe(true);
  });
});

describe('la metodología publicada coincide con las constantes del código', () => {
  const metodologia = es.methodology as Record<string, string>;

  it('los pesos del índice suman 100% y son los que la página declara', () => {
    const resumen = metodologia.summaryStr;
    // Los pesos se extraen del propio string publicado, no de una lista
    // aparte: si alguien cambia una cifra en el copy sin ajustar las demás,
    // la suma deja de dar 100 y este test lo detecta. Una lista hardcodeada
    // al lado pasaría siempre, sin importar lo que diga el string real.
    const pesos = [...resumen.matchAll(/(\d+)%/g)].map((m) => Number(m[1]));
    expect(pesos.length).toBe(4);
    expect(pesos.reduce((a, b) => a + b, 0)).toBe(100);
    expect(resumen).toContain('30%');
    expect(resumen).toContain('25%');
    expect(resumen).toContain('20%');
  });

  // Revisado 2026-08-20: en este checkout el pipeline vive en un worktree
  // hermano (`_mercado-ttm-pipeline`), no en la ruta del monorepo que asume
  // el brief original (`propyte-monorepo` existe como sibling pero es un
  // checkout viejo, de mayo, sin publication_gates.py). Se prueban ambas
  // rutas, en ese orden, y si ninguna existe el test se salta con un mensaje
  // explícito en vez de fallar o desaparecer.
  const PROJECTS_DIR = path.resolve(__dirname, '../../../..');
  const PIPELINE_CANDIDATES = [
    path.resolve(
      PROJECTS_DIR,
      '_mercado-ttm-pipeline/crawlers/glowing-spork/analytics/publication_gates.py',
    ),
    path.resolve(
      PROJECTS_DIR,
      'propyte-monorepo/crawlers/glowing-spork/analytics/publication_gates.py',
    ),
  ];
  const pipelinePath = PIPELINE_CANDIDATES.find((p) => existsSync(p));

  it.skipIf(!pipelinePath)(
    pipelinePath
      ? `el umbral de muestra que la página afirma está implementado en el pipeline (${path.relative(PROJECTS_DIR, pipelinePath!)})`
      : 'el umbral de muestra que la página afirma está implementado en el pipeline (SALTADO: no se encontró publication_gates.py en ninguna de las rutas candidatas — ni el worktree hermano _mercado-ttm-pipeline ni propyte-monorepo)',
    () => {
      const gates = readFileSync(pipelinePath!, 'utf8');
      const minIndexMatch = gates.match(/MIN_SAMPLE_INDEX\s*=\s*(\d+)/);
      const minOccupancyMatch = gates.match(/MIN_SAMPLE_OCCUPANCY\s*=\s*(\d+)/);
      expect(minIndexMatch).not.toBeNull();
      expect(minOccupancyMatch).not.toBeNull();
      const minIndex = Number(minIndexMatch![1]);
      const minOccupancy = Number(minOccupancyMatch![1]);

      // Ancla de valor: si alguien cambia el umbral en el pipeline sin
      // avisar, esto falla aunque el texto publicado no se haya tocado.
      expect(minIndex).toBe(30);
      expect(minOccupancy).toBe(15);

      // Ancla de coincidencia: el texto publicado (es.json) y la constante
      // del pipeline (publication_gates.py) son archivos distintos en
      // repos distintos. Si diverge uno sin el otro, esto falla.
      expect(metodologia.methodSample).toContain(String(minIndex));
      expect(metodologia.methodSample).toContain(String(minOccupancy));
    },
  );
});

describe('sin nombres de proveedor en texto visible', () => {
  it('los strings de mercado no nombran ninguna fuente externa', () => {
    // Reutiliza la lista canónica de `provider-names.ts` en vez de una copia
    // local: una copia local con los nombres escritos tal cual dispararía el
    // barrido de `provider-names.test.ts` sobre este mismo archivo, y una
    // segunda lista a mano es justo el tipo de duplicado que diverge sola.
    const texto = JSON.stringify([es.mercado, es.mercadoHero, es.methodology, es.mercadoMeta]);
    expect(findForbiddenProviderNames(texto, 'json')).toEqual([]);
  });
});
