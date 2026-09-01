import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import es from '@/i18n/messages/es.json';
import en from '@/i18n/messages/en.json';
import { isStale, MAX_DATA_AGE_DAYS } from './zone-metrics';
import {
  MIN_SAMPLE_INDEX,
  MIN_SAMPLE_OCCUPANCY,
  PIPELINE_INDEX_WEIGHTS,
  PIPELINE_INDEX_WEIGHT_ORDER,
} from './pipeline-contract';
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

/**
 * Las dos invariantes cruzadas resolvían el pipeline por worktrees hermanos, así
 * que en CI (o en cualquier máquina sin ese checkout al lado) SE SALTABAN las
 * dos. Una guardia que no corre donde se aprueban los merges no protege nada.
 *
 * Ahora se asevera en dos capas:
 *   Capa 1 — texto publicado contra `pipeline-contract.ts` (copia versionada en
 *            este repo). Corre SIEMPRE, en cualquier máquina.
 *   Capa 2 — `pipeline-contract.ts` contra el archivo Python real. Se salta
 *            cuando el repo del pipeline no está presente; cuando sí lo está,
 *            detecta que la copia se quedó atrás.
 * Editar solo la copia para poner la capa 1 en verde rompe la capa 2.
 */
describe('la metodología publicada coincide con el contrato del pipeline (capa 1: siempre corre)', () => {
  const metodologiaEs = es.methodology as Record<string, string>;
  const metodologiaEn = en.methodology as Record<string, string>;
  const zonasEs = es.zonas as Record<string, string>;
  const zonasEn = en.zonas as Record<string, string>;

  const pesosEsperados = PIPELINE_INDEX_WEIGHT_ORDER.map(
    (k) => PIPELINE_INDEX_WEIGHTS[k] * 100,
  );

  it('los cuatro pesos del contrato suman 1', () => {
    const suma = PIPELINE_INDEX_WEIGHT_ORDER.reduce(
      (acc, k) => acc + PIPELINE_INDEX_WEIGHTS[k],
      0,
    );
    expect(suma).toBeCloseTo(1, 10);
  });

  it.each([
    ['es methodology.summaryStr', () => metodologiaEs.summaryStr],
    ['en methodology.summaryStr', () => metodologiaEn.summaryStr],
    // /zonas publicaba CINCO componentes ponderados, uno de ellos inexistente
    // ("liquidez de mercado (10%)"), con pesos que no coincidían con ningún
    // código. Misma clase de divergencia texto-vs-código que summaryStr.
    ['es zonas.methodologyText', () => zonasEs.methodologyText],
    ['en zonas.methodologyText', () => zonasEn.methodologyText],
  ])('%s declara exactamente los cuatro pesos del contrato, en orden', (_label, getter) => {
    const publicados = [...getter().matchAll(/(\d+)%/g)].map((m) => Number(m[1]));
    expect(publicados).toEqual(pesosEsperados);
  });

  it('los umbrales de muestra publicados son los del contrato, en ambos locales', () => {
    for (const metodologia of [metodologiaEs, metodologiaEn]) {
      expect(metodologia.methodSample).toContain(String(MIN_SAMPLE_INDEX));
      expect(metodologia.methodSample).toContain(String(MIN_SAMPLE_OCCUPANCY));
    }
  });

  it('ningún texto de mercado afirma una frecuencia de actualización que el dataset no sostiene', () => {
    // Solo 1,045 de 15,472 comparables (6.8%) tienen menos de 30 días, y la
    // ventana es de 12 meses: "diariamente" / "semanalmente" eran afirmaciones
    // sin dato detrás.
    // Acotado a la FRECUENCIA, no a la palabra "diaria" sola: "Tarifa Diaria
    // Promedio" / "Average daily rate" son nombres de métrica, no promesas de
    // actualización, y prohibirlos dejaría el test en rojo por un falso positivo.
    const prohibido = [
      /diariamente/i,
      /semanalmente/i,
      /actualizaci[oó]n\s+(diaria|semanal)/i,
      /se\s+actualiza\w*\s+(diaria|semanal)/i,
      /recopilaci[oó]n\s+(diaria|semanal)/i,
      /\b(daily|weekly)\s+(updates?|collection|refresh\w*)/i,
      /\b(updated|refreshed|collected)\s+(daily|weekly)/i,
      /\bdata is refreshed\b/i,
    ];
    const superficies: [string, unknown][] = [
      ['es.methodology', es.methodology],
      ['en.methodology', en.methodology],
      ['es.zonas', es.zonas],
      ['en.zonas', en.zonas],
      ['es.mercadoMeta', es.mercadoMeta],
      ['en.mercadoMeta', en.mercadoMeta],
      ['es.mercadoHero', es.mercadoHero],
      ['en.mercadoHero', en.mercadoHero],
    ];
    const ofensores = superficies
      .filter(([, valor]) => {
        const texto = JSON.stringify(valor);
        return prohibido.some((re) => re.test(texto));
      })
      .map(([nombre]) => nombre);
    expect(ofensores).toEqual([]);
  });
});

describe('el contrato versionado coincide con el pipeline (capa 2: se salta sin el repo)', () => {
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

      // Contra el contrato versionado, no contra literales sueltos: la capa 1 ya
      // ató el texto publicado (los dos locales, /mercado y /zonas) a ese
      // contrato, así que aquí basta cerrar el eslabón contrato-vs-Python.
      expect(pipelineWeights).toEqual({
        occupancy: PIPELINE_INDEX_WEIGHTS.occupancy,
        adr_growth: PIPELINE_INDEX_WEIGHTS.adr_growth,
        revpar: PIPELINE_INDEX_WEIGHTS.revpar,
        competition: PIPELINE_INDEX_WEIGHTS.competition,
      });
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

      // Contra el contrato versionado. La capa 1 ya ató el texto publicado a
      // esas mismas constantes en ambos locales.
      expect(minIndex).toBe(MIN_SAMPLE_INDEX);
      expect(minOccupancy).toBe(MIN_SAMPLE_OCCUPANCY);
      expect(metodologia.methodSample).toContain(String(minIndex));
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

  // El recorrido completo de src/ (cientos de archivos, lectura sincrónica) se
  // pasaba de los 5000 ms por defecto en una corrida en frío y el test fallaba
  // por timeout, no por un hallazgo. Timeout holgado y explícito: esta guardia
  // debe fallar solo cuando alguien reintroduce la columna.
  it('median_occupancy y median_adr solo aparecen en queries.ts, los dos carve-outs de CityStrBenchmark, o en tests', { timeout: 60_000 }, () => {
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

describe('es.json y en.json tienen exactamente las mismas claves', () => {
  // Los dos archivos son TODO el solapamiento de merge de esta rama con
  // origin/main. Nada atrapaba un hunk mal resuelto que borrara una clave de un
  // solo locale: next-intl responde con la clave cruda o revienta en runtime,
  // según la superficie, y ninguna de las dos cosas la ve un test.
  function rutasDeClaves(valor: unknown, prefijo = ''): string[] {
    if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) return [prefijo];
    const rutas: string[] = [];
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      rutas.push(...rutasDeClaves(v, prefijo ? `${prefijo}.${k}` : k));
    }
    return rutas;
  }

  const rutasEs = rutasDeClaves(es).sort();
  const rutasEn = rutasDeClaves(en).sort();

  it('ninguna clave existe solo en es.json', () => {
    const soloEs = rutasEs.filter((r) => !rutasEn.includes(r));
    expect(
      soloEs,
      `claves presentes en es.json y ausentes en en.json:\n${soloEs.join('\n')}`,
    ).toEqual([]);
  });

  it('ninguna clave existe solo en en.json', () => {
    const soloEn = rutasEn.filter((r) => !rutasEs.includes(r));
    expect(
      soloEn,
      `claves presentes en en.json y ausentes en es.json:\n${soloEn.join('\n')}`,
    ).toEqual([]);
  });
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
