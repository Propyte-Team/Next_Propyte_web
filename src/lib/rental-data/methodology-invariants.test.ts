import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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
 *
 * Fix round 1 (revisión de código): las dos primeras versiones de "ninguna
 * cifra publicada es un punto único" y "data_through es independiente de
 * computed_at" comparaban dos literales hardcodeados dentro de FILA, sin
 * importar nada de producción — pasaban con o sin el bug. Se retiraron.
 * Quedan reemplazadas por el escaneo de columnas deprecadas más abajo, que sí
 * puede fallar contra código real.
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

// Sibling worktrees donde puede vivir el pipeline Python en este entorno,
// en orden de preferencia. `_mercado-ttm-pipeline` es el checkout vigente;
// `propyte-monorepo` es el que asume el brief original, pero en este entorno
// es un checkout de mayo sin `publication_gates.py` ni el fix de
// `compute_derived.py`. Se prueban ambas rutas y, si ninguna existe, el test
// afectado se salta con un mensaje explícito en vez de fallar o desaparecer.
const PROJECTS_DIR = path.resolve(__dirname, '../../../..');
const PIPELINE_ROOTS = ['_mercado-ttm-pipeline', 'propyte-monorepo'];

function resolvePipelineFile(relativePath: string): string | undefined {
  return PIPELINE_ROOTS
    .map((root) => path.resolve(PROJECTS_DIR, root, relativePath))
    .find((p) => existsSync(p));
}

describe('data_through es independiente de computed_at', () => {
  it('la brecha entre data_through y computed_at de esta fila excede MAX_DATA_AGE_DAYS', () => {
    // No es un detalle incidental de la fixture: es la prueba de por qué
    // `data_through` y `computed_at` deben tratarse como independientes. Esta
    // fila describe una corrida de agosto sobre datos de febrero — si el
    // código tratara "corrida reciente" como sinónimo de "dato fresco", este
    // ejemplo publicaría una cifra de 6+ meses de antigüedad como si fuera de hoy.
    // A diferencia de una comparación entre dos literales de la fixture, esto
    // ejercita `isStale()` real, importada de `zone-metrics.ts`.
    const dataThrough = new Date(`${FILA.data_through}T00:00:00Z`);
    const computedAt = new Date(`${FILA.computed_at}T00:00:00Z`);
    const gapDays = (computedAt.getTime() - dataThrough.getTime()) / 86_400_000;
    expect(gapDays).toBeGreaterThan(MAX_DATA_AGE_DAYS);
    expect(isStale(FILA.data_through, computedAt)).toBe(true);
  });
});

describe('la metodología publicada coincide con las constantes del código', () => {
  const metodologia = es.methodology as Record<string, string>;

  // Revisado 2026-08-20 (fix round 1): la primera versión de este test sumaba
  // los porcentajes extraídos del propio string y comprobaba que dieran 100 —
  // pero nada los ataba a los pesos reales del pipeline. Cambiar
  // WEIGHTS['occupancy'] de 0.30 a 0.40 en compute_derived.py sin tocar el
  // texto habría dejado este test en verde: exactamente la divergencia
  // texto-vs-código que esta tarea existe para cazar. Ahora se leen los
  // cuatro pesos de WEIGHTS en compute_derived.py (worktree hermano del
  // pipeline) y se comparan contra los cuatro porcentajes publicados.
  const computeDerivedPath = resolvePipelineFile(
    'crawlers/glowing-spork/analytics/compute_derived.py',
  );

  it.skipIf(!computeDerivedPath)(
    computeDerivedPath
      ? `los pesos publicados coinciden con WEIGHTS del pipeline (${path.relative(PROJECTS_DIR, computeDerivedPath)})`
      : 'los pesos publicados coinciden con WEIGHTS del pipeline (SALTADO: no se encontró compute_derived.py en ninguna ruta candidata — ni el worktree hermano _mercado-ttm-pipeline ni propyte-monorepo)',
    () => {
      const source = readFileSync(computeDerivedPath!, 'utf8');

      // Acotado al bloque literal `WEIGHTS = { ... }` y no a la primera
      // ocurrencia de cada clave en el archivo: "revpar" y "occupancy"
      // también aparecen como claves de fila más abajo en el mismo archivo
      // (`"revpar": float(row["revpar"])`, etc.), y un match sin acotar
      // arriesga leer el valor equivocado si el orden del archivo cambia.
      const blockStart = source.indexOf('WEIGHTS = {');
      expect(blockStart).toBeGreaterThan(-1);
      const blockEnd = source.indexOf('}', blockStart);
      const weightsBlock = source.slice(blockStart, blockEnd + 1);

      const readWeight = (key: string): number => {
        const match = weightsBlock.match(new RegExp(`"${key}":\\s*([\\d.]+)`));
        expect(match, `no se encontró "${key}" en el bloque WEIGHTS`).not.toBeNull();
        return Number(match![1]);
      };

      const pipelineWeights = {
        occupancy: readWeight('occupancy'),
        adr_growth: readWeight('adr_growth'),
        revpar: readWeight('revpar'),
        competition: readWeight('competition'),
      };

      // Ancla de valor: si el pipeline cambia un peso sin avisar, esto falla
      // aunque el texto publicado no se haya tocado.
      expect(pipelineWeights).toEqual({
        occupancy: 0.30,
        adr_growth: 0.25,
        revpar: 0.25,
        competition: 0.20,
      });

      // Ancla de coincidencia: los cuatro porcentajes publicados en
      // `summaryStr` (es.json, otro repo) deben ser los mismos cuatro pesos,
      // en el mismo orden en que la página los declara: Ocupación,
      // Crecimiento de tarifa (= adr_growth), RevPAR, Competencia.
      const resumen = metodologia.summaryStr;
      const publishedPercents = [...resumen.matchAll(/(\d+)%/g)].map((m) => Number(m[1]));
      expect(publishedPercents).toEqual([
        pipelineWeights.occupancy * 100,
        pipelineWeights.adr_growth * 100,
        pipelineWeights.revpar * 100,
        pipelineWeights.competition * 100,
      ]);
    },
  );
});

describe('el umbral de muestra publicado coincide con el pipeline', () => {
  const metodologia = es.methodology as Record<string, string>;

  const gatesPath = resolvePipelineFile(
    'crawlers/glowing-spork/analytics/publication_gates.py',
  );

  it.skipIf(!gatesPath)(
    gatesPath
      ? `el umbral de muestra que la página afirma está implementado en el pipeline (${path.relative(PROJECTS_DIR, gatesPath)})`
      : 'el umbral de muestra que la página afirma está implementado en el pipeline (SALTADO: no se encontró publication_gates.py en ninguna de las rutas candidatas — ni el worktree hermano _mercado-ttm-pipeline ni propyte-monorepo)',
    () => {
      const gates = readFileSync(gatesPath!, 'utf8');
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

describe('las columnas deprecadas no se leen fuera de los carve-outs conocidos', () => {
  // median_occupancy/median_adr son las columnas del bug de ago-2026: un
  // punto único publicado como si fuera la mediana TTM. queries.ts las
  // mantiene vivas a propósito para el tipo angosto `CityStrBenchmark`, con
  // dos carve-outs conocidos que las leen. Cualquier otro archivo que las lea
  // es el camino exacto por el que alguien reintroduce la cifra inflada en un
  // componente nuevo.
  const SRC_ROOT = path.resolve(__dirname, '../..');
  const DEPRECATED_COLUMNS = ['median_occupancy', 'median_adr'];
  const ALLOWED_RELATIVE_PATHS = new Set([
    'lib/supabase/queries.ts',
    'app/[locale]/zonas/[slug]/page.tsx',
    'lib/pdf/LeadMagnetPDFDocument.tsx',
  ]);

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full, out);
      } else if (/\.tsx?$/.test(entry)) {
        out.push(full);
      }
    }
    return out;
  }

  it('median_occupancy y median_adr solo aparecen en queries.ts, los dos carve-outs de CityStrBenchmark, o en tests', () => {
    const offenders: string[] = [];

    for (const file of walk(SRC_ROOT)) {
      const relPath = path.relative(SRC_ROOT, file).split(path.sep).join('/');
      if (ALLOWED_RELATIVE_PATHS.has(relPath)) continue;
      if (/\.test\.tsx?$/.test(relPath)) continue;

      const contents = readFileSync(file, 'utf8');
      const hits = DEPRECATED_COLUMNS.filter((col) => contents.includes(col));
      if (hits.length) {
        offenders.push(`${relPath} → ${hits.join(', ')}`);
      }
    }

    expect(
      offenders,
      'median_occupancy/median_adr son columnas deprecadas (el bug de "punto único ' +
        'publicado como mediana"). Solo se leen en src/lib/supabase/queries.ts, en los ' +
        'dos carve-outs de CityStrBenchmark (zonas/[slug]/page.tsx y ' +
        'LeadMagnetPDFDocument.tsx), o en archivos de test. Archivo(s) que las ' +
        `reintrodujeron fuera de esos lugares:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});

describe('invariantes del pipeline aún no corregidos (Python)', () => {
  // No hay intérprete de Python en este entorno para ejecutar el pipeline, así
  // que estos dos hechos quedan documentados pero sin ejercitar de forma
  // activa. Hoy (2026-08-20), en compute_derived.py AMBOS siguen siendo el
  // comportamiento viejo:
  //   - fetch_airdna_occupancy() SIGUE llamando drop_duplicates("submarket")
  //     (línea 223): toma el último punto por submercado, no una mediana TTM.
  //   - build_zone_score_rows() SIGUE escribiendo "median_occupancy" (línea 648).
  // BLOQUEADO por Task 2R: es quien corrige compute_derived.py. Cuando esa
  // tarea cierre, quitar el `.skip` — las aserciones ya están escritas para
  // el estado correcto y deberían pasar solas si el fix es completo.
  const computeDerivedPath = resolvePipelineFile(
    'crawlers/glowing-spork/analytics/compute_derived.py',
  );

  it.skip(
    'fetch_airdna_occupancy ya no llama drop_duplicates y build_zone_score_rows ya no escribe median_occupancy (BLOQUEADO por Task 2R — ver nota arriba del describe)',
    () => {
      expect(computeDerivedPath, 'no se encontró compute_derived.py en ninguna ruta candidata').toBeTruthy();
      const source = readFileSync(computeDerivedPath!, 'utf8');

      const fetchStart = source.indexOf('def fetch_airdna_occupancy');
      const fetchEnd = source.indexOf('\ndef ', fetchStart + 1);
      const fetchBody = source.slice(fetchStart, fetchEnd === -1 ? undefined : fetchEnd);
      expect(fetchBody).not.toContain('drop_duplicates');

      const buildStart = source.indexOf('def build_zone_score_rows');
      const buildEnd = source.indexOf('\ndef ', buildStart + 1);
      const buildBody = source.slice(buildStart, buildEnd === -1 ? undefined : buildEnd);
      expect(buildBody).not.toContain('"median_occupancy"');
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
