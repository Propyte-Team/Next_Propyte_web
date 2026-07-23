# Lead Magnet "Top 10 Oportunidades" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el lead magnet incumplible del Home por un PDF real "Top 10 Oportunidades" (edición mensual pre-generada, es/en) entregado por descarga directa (URL firmada) tras el submit.

**Architecture:** Un cron mensual (`/api/cron/lead-magnet-edition`, protegido con `x-cron-secret`) computa un ranking score-compuesto sobre `real_estate_hub.v_units`, renderiza el PDF con `@react-pdf/renderer` (patrón de `CotizacionPDFDocument`), lo sube a un bucket privado de Supabase Storage y registra la edición como `pending` en `real_estate_hub.lead_magnet_editions`. Luis aprueba (función SQL atómica) → `active`. `/api/leads` con `source=lead_magnet` devuelve además una URL firmada (~10 min) de la edición activa; el frontend muestra botón de descarga.

**Tech Stack:** Next.js 16 App Router · `@react-pdf/renderer` (ya instalado) · `qrcode` (ya instalado) · Supabase (service role + Storage) · vitest (NUEVO, unit tests) · next-intl (mensajes UI).

**Spec:** `docs/superpowers/specs/2026-07-23-lead-magnet-top10-design.md`

**Repo/worktree:** `C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades` (rama `fix/cotizacion-pendientes`). Gates de calidad: `npx tsc --noEmit` + `npm run lint` + `npm run build` (vitest NO typechea).

## Hechos del repo que este plan asume (verificados 2026-07-23)

- `/api/leads` valida body con Zod; el body incluye `source`, `locale ('es'|'en')`, `website` (honeypot). Honeypot → responde `{success:true, id:randomUUID()}` sin persistir (líneas ~294-301). Éxito real → `NextResponse.json({ success: true, id: row.id }, { status: 200 })` (línea ~481).
- `submitLead` en `src/lib/leads/submit-lead.ts:57` → `Promise<SubmitLeadResult>` con `SubmitLeadResult = { ok: boolean; id?: string; error?: string }` (líneas 22-28). `submitForm` (`src/lib/submitForm.ts`) es shim deprecado.
- Cron auth: `src/lib/security/cron-auth.ts` exporta `verifyCronSecret` (Bearer) y `verifyCronSecretHeader` (`x-cron-secret`), env `CRON_SECRET`. Patrón de uso en `src/app/api/cron/zoho-retry/route.ts:284-289`.
- PDF: `src/app/api/generate-cotizacion-pdf/route.ts` usa `renderToStream` → concat Buffer; `export const dynamic='force-dynamic'; export const runtime='nodejs'; export const maxDuration=60;` y `enforceRateLimit`. `CotizacionPDFDocument.tsx`: sin `Font.register` (Helvetica/Helvetica-Bold), `StyleSheet.create`, 1 `<Page size="A4">` con wrap, footer `position:absolute bottom:28` + `fixed` y `page.paddingBottom:120`.
- Queries en `src/lib/supabase/queries.ts` (NO existe `src/lib/queries.ts`): helper `hub(client)` = `.schema('real_estate_hub')`; `coerceNumericFields(row, keys)` es privado (líneas ~1574-1586) — hay que exportarlo; `getDiscountedUnits` (línea 755) muestra el gate canónico: `.not('approved_at','is',null).is('deleted_at',null)`; `getZoneScores` (línea 1941) devuelve `ZoneScore[]` deduplicado por (city,zone) con coerción; `getCityStrBenchmark` (línea 2038) lee `zone_scores` con `zone='_ciudad'` por ciudad EXACTA (por eso agregamos variante plural); `getActiveRentalComparables` (línea 546) pagina `investment_analytics.rental_comparables` activos ≤12m.
- Columnas reales de `v_units` (via `src/lib/mappers/unit-to-property.ts:12-98`): `price_mxn, discount_price_mxn, discount_pct, is_discount_active, roi_annual, estimated_rent_mxn, appreciation_annual, bedrooms, area_m2, city, zone, slug, development_id, development_name, development_slug, approved_at, deleted_at` (todas las NUMERIC llegan como string → coercionar).
- Supabase clients: `createServiceRoleClient()` YA existe en `src/lib/supabase/server.ts:50-60` (envs `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, retorna `null` si faltan). Storage NO se usa en ningún lado aún.
- Migraciones viven en `supabase/migrations/` (ejemplo de bucket: `013_blog_images_bucket.sql`). Se aplican manualmente (SQL Editor / MCP), NO por CLI automática.
- Testing: NO hay vitest ni ningún unit test framework (solo Playwright e2e). Tarea 1 lo agrega mínimo.
- i18n: `src/i18n/messages/{es,en}.json`, namespace `leadMagnet` (es.json:2893). Mantener paridad de claves es/en.
- WebMCP: el form del Home tiene `toolname="descargar_guia_inversion"` — NO tocar esos atributos ni duplicar toolnames.

---

### Task 1: Infra mínima de unit tests (vitest)

**Files:**
- Modify: `package.json` (devDependency + script)
- Create: `vitest.config.mts`

- [ ] **Step 1: Instalar vitest**

```bash
cd "C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades"
npm install -D vitest
```

- [ ] **Step 2: Crear `vitest.config.mts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Agregar script a `package.json`**

En `"scripts"`, junto a los scripts `test:e2e*` existentes:

```json
"test:unit": "vitest run",
```

- [ ] **Step 4: Verificar que corre (0 tests es OK)**

Run: `npm run test:unit`
Expected: exit 0 o "No test files found" (sin crash de config).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.mts
git commit -m "chore: vitest mínimo para unit tests (test:unit)"
```

---

### Task 2: Lib de scoring `score.ts` (TDD)

Lib pura, sin I/O. Recibe filas ya coercionadas a number.

**Files:**
- Create: `src/lib/lead-magnet/score.ts`
- Test: `src/lib/lead-magnet/score.test.ts`

**Reglas de negocio (del spec §2):**
- Elegibilidad: precio efectivo > 0 y `estimated_rent_mxn` > 0. (El gate `approved_at`/`deleted_at` viene en la query, Task 3.)
- Precio efectivo: `is_discount_active && discount_price_mxn > 0 ? discount_price_mxn : price_mxn`.
- Componentes (cada uno normalizado min-max 0-100 sobre el pool elegible; pool constante → 50):
  - yield: `(estimated_rent_mxn × 12 / precioEfectivo) × 100`
  - roi: `roi_annual` si no es null; fallback `grossYieldPct + (appreciation_annual ?? 8)`
  - discount: `is_discount_active ? (discount_pct ?? 0) : 0`
  - zone: `score` de `zone_scores` matcheado por clave normalizada (lowercase, sin acentos, trim) `city|zone`; sin match → **50 neutral** (no penalizar zonas sin datos)
- Pesos: yield 0.35 · roi 0.30 · discount 0.20 · zone 0.15.
- Selección (dos pasadas): (1) rankear ciudades por su mejor unidad y tomar la mejor unidad de cada una de las top-3 ciudades (si hay ≥3 ciudades en el pool); (2) llenar hasta 10 por score global respetando máx 2 unidades por `development_id`. Orden final: score desc.

- [ ] **Step 1: Escribir tests que fallan**

```ts
// src/lib/lead-magnet/score.test.ts
import { describe, it, expect } from 'vitest';
import {
  selectTopUnits, computeComponents, normalizeKey,
  SCORE_WEIGHTS, type LeadMagnetUnitInput,
} from './score';

function unit(over: Partial<LeadMagnetUnitInput> = {}): LeadMagnetUnitInput {
  return {
    id: over.id ?? 'u1', slug: over.slug ?? 'unidad-1',
    development_id: 'd1', development_name: 'Dev Uno', development_slug: 'dev-uno',
    city: 'Tulum', zone: 'Aldea Zama', bedrooms: 2, area_m2: 80,
    price_mxn: 4_000_000, discount_price_mxn: null, discount_pct: null,
    is_discount_active: false, roi_annual: 12, estimated_rent_mxn: 25_000,
    appreciation_annual: 8,
    ...over,
  };
}

describe('computeComponents', () => {
  it('usa discount_price_mxn como precio efectivo cuando el descuento está activo', () => {
    const c = computeComponents(unit({ is_discount_active: true, discount_price_mxn: 3_600_000 }));
    expect(c.effectivePrice).toBe(3_600_000);
    expect(c.grossYieldPct).toBeCloseTo((25_000 * 12 / 3_600_000) * 100, 5);
  });
  it('roi cae a yield + appreciation (default 8) cuando roi_annual es null', () => {
    const c = computeComponents(unit({ roi_annual: null, appreciation_annual: null }));
    expect(c.roiPct).toBeCloseTo(c.grossYieldPct + 8, 5);
  });
  it('descuento inactivo aporta 0 aunque discount_pct tenga valor', () => {
    const c = computeComponents(unit({ is_discount_active: false, discount_pct: 15 }));
    expect(c.discountPct).toBe(0);
  });
});

describe('normalizeKey', () => {
  it('quita acentos, lowercasea y trimea', () => {
    expect(normalizeKey('Cancún', ' Puerto Cancún ')).toBe('cancun|puerto cancun');
  });
});

describe('selectTopUnits', () => {
  it('excluye unidades sin precio o sin renta estimada', () => {
    const picked = selectTopUnits(
      [unit({ id: 'a', price_mxn: null }), unit({ id: 'b', estimated_rent_mxn: null }), unit({ id: 'c' })],
      [],
    );
    expect(picked.map((u) => u.id)).toEqual(['c']);
  });
  it('respeta máx 2 unidades por desarrollo', () => {
    const pool = Array.from({ length: 6 }, (_, i) =>
      unit({ id: `u${i}`, slug: `u${i}`, roi_annual: 20 - i }));
    // mismo development_id 'd1' en todas → solo 2 pueden entrar
    const picked = selectTopUnits(pool, []);
    expect(picked.length).toBe(2);
  });
  it('garantiza ≥3 ciudades cuando el pool las tiene', () => {
    const pool = [
      ...Array.from({ length: 8 }, (_, i) =>
        unit({ id: `t${i}`, development_id: `dt${i}`, city: 'Tulum', roi_annual: 30 - i })),
      unit({ id: 'c1', development_id: 'dc1', city: 'Cancún', roi_annual: 5 }),
      unit({ id: 'p1', development_id: 'dp1', city: 'Playa del Carmen', roi_annual: 4 }),
    ];
    const picked = selectTopUnits(pool, []);
    const cities = new Set(picked.map((u) => u.city));
    expect(cities.size).toBeGreaterThanOrEqual(3);
    expect(picked.length).toBe(10);
  });
  it('sin match de zona el componente zone es 50 neutral', () => {
    const picked = selectTopUnits([unit({ zone: 'Zona Inexistente' })], []);
    expect(picked[0].zoneComponent).toBe(50);
  });
  it('usa el score de zone_scores cuando matchea (con acentos distintos)', () => {
    const picked = selectTopUnits(
      [unit({ city: 'Cancún', zone: 'Puerto Cancun' }), unit({ id: 'u2', development_id: 'd2', city: 'Cancún', zone: 'Otra' })],
      [{ city: 'Cancun', zone: 'Puerto Cancún', score: 90 }],
    );
    const conZona = picked.find((u) => u.id === 'u1')!;
    const sinZona = picked.find((u) => u.id === 'u2')!;
    // min-max sobre el pool {90 (match), 50 (neutral)} → 100 vs 0
    expect(conZona.zoneComponent).toBe(100);
    expect(sinZona.zoneComponent).toBe(0);
  });
  it('los pesos suman 1', () => {
    const sum = SCORE_WEIGHTS.yield + SCORE_WEIGHTS.roi + SCORE_WEIGHTS.discount + SCORE_WEIGHTS.zone;
    expect(sum).toBeCloseTo(1, 10);
  });
  it('ordena por score desc y devuelve máx `count`', () => {
    const pool = Array.from({ length: 15 }, (_, i) =>
      unit({ id: `u${i}`, development_id: `d${i}`, city: `Ciudad${i % 4}`, roi_annual: 30 - i }));
    const picked = selectTopUnits(pool, []);
    expect(picked.length).toBe(10);
    const scores = picked.map((u) => u.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npm run test:unit`
Expected: FAIL — `Cannot find module './score'` (o equivalente).

- [ ] **Step 3: Implementar `score.ts`**

```ts
// src/lib/lead-magnet/score.ts
// Ranking score-compuesto para el lead magnet "Top 10 Oportunidades".
// Lib pura: recibe filas YA coercionadas a number (ver edition-data.ts).
// Spec: docs/superpowers/specs/2026-07-23-lead-magnet-top10-design.md §2

export interface LeadMagnetUnitInput {
  id: string;
  slug: string;
  development_id: string | null;
  development_name: string | null;
  development_slug: string | null;
  city: string | null;
  zone: string | null;
  bedrooms: number | null;
  area_m2: number | null;
  price_mxn: number | null;
  discount_price_mxn: number | null;
  discount_pct: number | null;
  is_discount_active: boolean | null;
  roi_annual: number | null;
  estimated_rent_mxn: number | null;
  appreciation_annual: number | null;
}

export interface ZoneScoreInput {
  city: string;
  zone: string;
  score: number | null;
}

export interface ScoredUnit extends LeadMagnetUnitInput {
  effectivePrice: number;
  grossYieldPct: number;
  roiPct: number;
  discountPct: number;
  yieldComponent: number;
  roiComponent: number;
  discountComponent: number;
  zoneComponent: number;
  score: number;
}

export const SCORE_WEIGHTS = { yield: 0.35, roi: 0.3, discount: 0.2, zone: 0.15 } as const;
export const DEFAULT_APPRECIATION_PCT = 8;
const NEUTRAL_ZONE = 50;

/** Clave de matching city|zone tolerante a acentos/caso. */
export function normalizeKey(city: string | null | undefined, zone: string | null | undefined): string {
  const norm = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return `${norm(city ?? '')}|${norm(zone ?? '')}`;
}

export function computeComponents(u: LeadMagnetUnitInput): {
  effectivePrice: number; grossYieldPct: number; roiPct: number; discountPct: number;
} {
  const effectivePrice =
    u.is_discount_active && u.discount_price_mxn != null && u.discount_price_mxn > 0
      ? u.discount_price_mxn
      : (u.price_mxn ?? 0);
  const rent = u.estimated_rent_mxn ?? 0;
  const grossYieldPct = effectivePrice > 0 ? (rent * 12 / effectivePrice) * 100 : 0;
  const roiPct = u.roi_annual ?? grossYieldPct + (u.appreciation_annual ?? DEFAULT_APPRECIATION_PCT);
  const discountPct = u.is_discount_active ? (u.discount_pct ?? 0) : 0;
  return { effectivePrice, grossYieldPct, roiPct, discountPct };
}

/** min-max → 0-100; pool constante o vacío → 50. */
function normalizePool(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!values.length || max === min) return values.map(() => 50);
  return values.map((v) => ((v - min) / (max - min)) * 100);
}

export interface SelectOptions {
  count?: number;
  maxPerDevelopment?: number;
  minCities?: number;
}

export function selectTopUnits(
  units: LeadMagnetUnitInput[],
  zoneScores: ZoneScoreInput[],
  opts: SelectOptions = {},
): ScoredUnit[] {
  const count = opts.count ?? 10;
  const maxPerDev = opts.maxPerDevelopment ?? 2;
  const minCities = opts.minCities ?? 3;

  const zoneByKey = new Map<string, number>();
  for (const z of zoneScores) {
    if (z.score != null) zoneByKey.set(normalizeKey(z.city, z.zone), z.score);
  }

  // 1. Elegibilidad + componentes crudos
  const eligible = units
    .map((u) => ({ u, c: computeComponents(u) }))
    .filter(({ c, u }) => c.effectivePrice > 0 && (u.estimated_rent_mxn ?? 0) > 0);
  if (!eligible.length) return [];

  // 2. Normalización min-max por componente sobre el pool
  const yieldN = normalizePool(eligible.map(({ c }) => c.grossYieldPct));
  const roiN = normalizePool(eligible.map(({ c }) => c.roiPct));
  const discN = normalizePool(eligible.map(({ c }) => c.discountPct));
  const zoneRaw = eligible.map(({ u }) => zoneByKey.get(normalizeKey(u.city, u.zone)) ?? NEUTRAL_ZONE);
  const zoneN = normalizePool(zoneRaw);

  const scored: ScoredUnit[] = eligible.map(({ u, c }, i) => ({
    ...u,
    ...c,
    yieldComponent: Math.round(yieldN[i] * 10) / 10,
    roiComponent: Math.round(roiN[i] * 10) / 10,
    discountComponent: Math.round(discN[i] * 10) / 10,
    zoneComponent: Math.round(zoneN[i] * 10) / 10,
    score: Math.round(
      (yieldN[i] * SCORE_WEIGHTS.yield +
        roiN[i] * SCORE_WEIGHTS.roi +
        discN[i] * SCORE_WEIGHTS.discount +
        zoneN[i] * SCORE_WEIGHTS.zone) * 10,
    ) / 10,
  }));
  scored.sort((a, b) => b.score - a.score);

  // 3. Selección con diversidad
  const picked: ScoredUnit[] = [];
  const perDev = new Map<string, number>();
  const canPick = (u: ScoredUnit) => {
    const dev = u.development_id ?? u.id;
    return (perDev.get(dev) ?? 0) < maxPerDev && !picked.some((p) => p.id === u.id);
  };
  const take = (u: ScoredUnit) => {
    const dev = u.development_id ?? u.id;
    perDev.set(dev, (perDev.get(dev) ?? 0) + 1);
    picked.push(u);
  };

  // Pasada 1: mejor unidad de cada una de las top-minCities ciudades (si existen)
  const byCity = new Map<string, ScoredUnit[]>();
  for (const s of scored) {
    const city = s.city ?? '_sin_ciudad';
    if (!byCity.has(city)) byCity.set(city, []);
    byCity.get(city)!.push(s); // scored ya viene desc → [0] es la mejor
  }
  const topCities = [...byCity.entries()]
    .sort((a, b) => b[1][0].score - a[1][0].score)
    .slice(0, minCities);
  for (const [, cityUnits] of topCities) {
    const best = cityUnits.find(canPick);
    if (best) take(best);
  }

  // Pasada 2: llenar por score global
  for (const s of scored) {
    if (picked.length >= count) break;
    if (canPick(s)) take(s);
  }

  picked.sort((a, b) => b.score - a.score);
  return picked.slice(0, count);
}
```

- [ ] **Step 4: Correr tests**

Run: `npm run test:unit`
Expected: PASS (9 tests).

- [ ] **Step 5: Gate de tipos y commit**

```bash
npx tsc --noEmit
git add src/lib/lead-magnet/score.ts src/lib/lead-magnet/score.test.ts
git commit -m "feat(lead-magnet): lib de scoring compuesto con diversidad (TDD)"
```

---

### Task 3: Queries + ensamblado de datos de edición (TDD parcial)

**Files:**
- Modify: `src/lib/supabase/queries.ts` (exportar `coerceNumericFields`; agregar `getUnitsForLeadMagnet` y `getCityStrBenchmarks`)
- Create: `src/lib/lead-magnet/edition-data.ts`
- Test: `src/lib/lead-magnet/edition-data.test.ts`

- [ ] **Step 1: Tests de los helpers puros (fallan)**

```ts
// src/lib/lead-magnet/edition-data.test.ts
import { describe, it, expect } from 'vitest';
import { computeEditionId, median, ltrMediansByCity } from './edition-data';

describe('computeEditionId', () => {
  it('devuelve YYYY-MM en zona America/Cancun', () => {
    // 2026-08-01T04:30Z = 2026-07-31 23:30 en Cancún (UTC-5) → edición 2026-07
    expect(computeEditionId(new Date('2026-08-01T04:30:00Z'))).toBe('2026-07');
    expect(computeEditionId(new Date('2026-08-01T06:30:00Z'))).toBe('2026-08');
  });
});

describe('median', () => {
  it('impar toma el central, par promedia', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe('ltrMediansByCity', () => {
  it('agrupa por ciudad, exige muestra mínima y ordena por muestra desc', () => {
    const rows = [
      ...Array.from({ length: 25 }, (_, i) => ({ city: 'Cancun', monthly_rent_mxn: 10_000 + i })),
      ...Array.from({ length: 5 }, () => ({ city: 'Tulum', monthly_rent_mxn: 30_000 })),
    ];
    const out = ltrMediansByCity(rows, 20);
    expect(out).toEqual([{ city: 'Cancun', medianRent: 10_012, sample: 25 }]);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npm run test:unit`
Expected: FAIL — `Cannot find module './edition-data'`.

- [ ] **Step 3: Exportar `coerceNumericFields` en `queries.ts`**

En `src/lib/supabase/queries.ts` (~línea 1574), cambiar `function coerceNumericFields(` por `export function coerceNumericFields(`. No cambiar la firma.

- [ ] **Step 4: Agregar 2 queries nuevas en `queries.ts`**

Pegar junto a `getDiscountedUnits` (después de la línea ~765):

```ts
/** Pool de candidatas para el lead magnet Top 10. Mismo gate público que el
 *  listado (approved_at + deleted_at). El filtro fino (precio/renta) lo hace
 *  score.ts; aquí solo pedimos lo mínimo para no traer 1400 filas inútiles. */
export async function getUnitsForLeadMagnet(client: Client) {
  return hub(client)
    .from('v_units')
    .select(
      'id, slug, development_id, development_name, development_slug, city, zone, ' +
      'bedrooms, area_m2, price_mxn, discount_price_mxn, discount_pct, ' +
      'is_discount_active, roi_annual, estimated_rent_mxn, appreciation_annual',
    )
    .not('approved_at', 'is', null)
    .is('deleted_at', null)
    .not('price_mxn', 'is', null)
    .not('estimated_rent_mxn', 'is', null);
}

/** Benchmarks STR de TODAS las ciudades (filas zone='_ciudad'), última por ciudad.
 *  Variante plural de getCityStrBenchmark: evita adivinar strings de ciudad. */
export async function getCityStrBenchmarks(client: Client): Promise<CityStrBenchmark[]> {
  const { data, error } = await client
    .from('zone_scores')
    .select('city, median_occupancy, median_adr, revpar, active_listings, computed_at')
    .eq('zone', '_ciudad')
    .order('computed_at', { ascending: false });
  if (error || !data) return [];
  const seen = new Set<string>();
  const out: CityStrBenchmark[] = [];
  for (const row of data) {
    if (seen.has(row.city)) continue;
    seen.add(row.city);
    out.push(coerceNumericFields(row as Record<string, unknown>, ZONE_SCORE_NUMERIC_KEYS) as unknown as CityStrBenchmark);
  }
  return out;
}
```

- [ ] **Step 5: Implementar `edition-data.ts`**

```ts
// src/lib/lead-magnet/edition-data.ts
// Ensambla los datos de una edición del lead magnet (server-only, cron).
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getUnitsForLeadMagnet, getCityStrBenchmarks, getZoneScores,
  getActiveRentalComparables, coerceNumericFields,
  type CityStrBenchmark, type ZoneScore,
} from '@/lib/supabase/queries';
import { selectTopUnits, type LeadMagnetUnitInput, type ScoredUnit } from './score';

type Client = SupabaseClient<any, any, any>;

const UNIT_NUMERIC_KEYS = [
  'price_mxn', 'discount_price_mxn', 'discount_pct', 'roi_annual',
  'estimated_rent_mxn', 'appreciation_annual', 'bedrooms', 'area_m2',
] as const;

export interface LtrCityMedian { city: string; medianRent: number; sample: number }

export interface EditionData {
  edition: string;              // 'YYYY-MM'
  generatedAt: string;          // ISO
  topUnits: ScoredUnit[];
  cityBenchmarks: CityStrBenchmark[];
  ltrByCity: LtrCityMedian[];
  topZones: Pick<ZoneScore, 'city' | 'zone' | 'score' | 'median_occupancy' | 'median_adr'>[];
}

/** 'YYYY-MM' con corte en America/Cancun (regla de reportes Propyte). */
export function computeEditionId(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Cancun', year: 'numeric', month: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  return `${y}-${m}`;
}

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function ltrMediansByCity(
  rows: Array<{ city: string | null; monthly_rent_mxn: number | null }>,
  minSample: number,
): LtrCityMedian[] {
  const byCity = new Map<string, number[]>();
  for (const r of rows) {
    if (!r.city || r.monthly_rent_mxn == null) continue;
    if (!byCity.has(r.city)) byCity.set(r.city, []);
    byCity.get(r.city)!.push(Number(r.monthly_rent_mxn));
  }
  return [...byCity.entries()]
    .filter(([, rents]) => rents.length >= minSample)
    .map(([city, rents]) => ({ city, medianRent: Math.round(median(rents)), sample: rents.length }))
    .sort((a, b) => b.sample - a.sample);
}

export async function buildEditionData(client: Client, now = new Date()): Promise<EditionData> {
  const [unitsRes, benchmarks, zoneScores, ltrRows] = await Promise.all([
    getUnitsForLeadMagnet(client),
    getCityStrBenchmarks(client),
    getZoneScores(client),
    getActiveRentalComparables(client),
  ]);

  const rawUnits = (unitsRes.data ?? []) as Record<string, unknown>[];
  const units = rawUnits.map(
    (r) => coerceNumericFields(r, UNIT_NUMERIC_KEYS) as unknown as LeadMagnetUnitInput,
  );

  const topUnits = selectTopUnits(
    units,
    zoneScores.map((z) => ({ city: z.city, zone: z.zone, score: z.score })),
  );

  const topZones = zoneScores
    .filter((z) => z.score != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5)
    .map(({ city, zone, score, median_occupancy, median_adr }) =>
      ({ city, zone, score, median_occupancy, median_adr }));

  return {
    edition: computeEditionId(now),
    generatedAt: now.toISOString(),
    topUnits,
    cityBenchmarks: benchmarks,
    ltrByCity: ltrMediansByCity(ltrRows, 20),
    topZones,
  };
}
```

- [ ] **Step 6: Correr tests + tipos**

Run: `npm run test:unit && npx tsc --noEmit`
Expected: PASS (12 tests) y tsc 0 errores.

- [ ] **Step 7: Commit**

```bash
git add src/lib/supabase/queries.ts src/lib/lead-magnet/edition-data.ts src/lib/lead-magnet/edition-data.test.ts
git commit -m "feat(lead-magnet): queries del pool + ensamblado de datos de edición"
```

---

### Task 4: Migración SQL (tabla + bucket + función de aprobación)

**Files:**
- Create: `supabase/migrations/20260723_lead_magnet_editions.sql`

⚠️ **GATE:** crear el ARCHIVO es libre; APLICARLO a `oaijxdpevakashxshhvm` requiere frase de autorización explícita de Luis con objetivo nombrado (regla `feedback_autorizacion_explicita_infra`). El código de Tasks 5-8 es fail-soft sin la tabla (todo cae al comportamiento actual), así que el orden no bloquea.

- [ ] **Step 1: Escribir la migración**

```sql
-- Migration: lead magnet Top 10 — ediciones mensuales + bucket privado
-- Aplicar en Supabase (proyecto oaijxdpevakashxshhvm) SQL Editor o MCP.
-- Spec: docs/superpowers/specs/2026-07-23-lead-magnet-top10-design.md §3

create table if not exists real_estate_hub.lead_magnet_editions (
  id uuid primary key default gen_random_uuid(),
  edition text not null,              -- 'YYYY-MM'
  locale text not null check (locale in ('es','en')),
  storage_path text not null,         -- p.ej. 'editions/2026-08-es.pdf'
  status text not null default 'pending' check (status in ('pending','active','archived')),
  units jsonb,                        -- snapshot del top 10 (auditoría)
  generated_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (edition, locale)
);

-- Solo service_role lee/escribe (RLS on, sin policies → anon/authenticated bloqueados).
alter table real_estate_hub.lead_magnet_editions enable row level security;

-- Consulta rápida de la edición activa por locale.
create index if not exists idx_lme_active
  on real_estate_hub.lead_magnet_editions (locale, status);

-- Bucket PRIVADO (public=false; sin policy de SELECT en storage.objects →
-- solo el service role puede leer/firmar). Patrón: 013_blog_images_bucket.sql.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lead-magnets', 'lead-magnets', false, 3145728, array['application/pdf'])
on conflict (id) do nothing;

-- Aprobación atómica: archiva la activa del locale y activa la edición dada.
-- Luis la corre desde el SQL Editor (interim) o el Hub la llamará (fase 2):
--   select real_estate_hub.approve_lead_magnet_edition('2026-08', 'es');
create or replace function real_estate_hub.approve_lead_magnet_edition(
  p_edition text, p_locale text
) returns void language plpgsql as $$
begin
  update real_estate_hub.lead_magnet_editions
     set status = 'archived'
   where locale = p_locale and status = 'active';
  update real_estate_hub.lead_magnet_editions
     set status = 'active', approved_at = now()
   where edition = p_edition and locale = p_locale;
  if not found then
    raise exception 'No existe edición % (%)', p_edition, p_locale;
  end if;
end;
$$;
```

- [ ] **Step 2: Commit del archivo**

```bash
git add supabase/migrations/20260723_lead_magnet_editions.sql
git commit -m "feat(lead-magnet): migración ediciones + bucket privado + approve fn (aplicar con autorización)"
```

- [ ] **Step 3: CHECKPOINT — pedir a Luis la frase de autorización y aplicar la migración** (MCP `apply_migration` o que Luis la corra en SQL Editor). Verificar: `select * from real_estate_hub.lead_magnet_editions limit 1;` (0 filas, sin error) y `select id, public from storage.buckets where id='lead-magnets';` → `public=false`.

---

### Task 5: Helpers de ediciones (Storage + tabla)

**Files:**
- Create: `src/lib/lead-magnet/editions.ts`

Server-only. Todo vía service-role client (bypassa RLS; el bucket es privado).

- [ ] **Step 1: Implementar `editions.ts`**

```ts
// src/lib/lead-magnet/editions.ts
// Persistencia de ediciones del lead magnet (tabla + Storage). Server-only.
import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any, any, any>;
const BUCKET = 'lead-magnets';
const TABLE = 'lead_magnet_editions';
const hub = (c: Client) => c.schema('real_estate_hub' as 'public');

export interface EditionRow {
  id: string;
  edition: string;
  locale: 'es' | 'en';
  storage_path: string;
  status: 'pending' | 'active' | 'archived';
  generated_at: string;
  approved_at: string | null;
}

export function editionStoragePath(edition: string, locale: string): string {
  return `editions/${edition}-${locale}.pdf`;
}

export async function uploadEditionPdf(
  client: Client, path: string, pdf: Buffer,
): Promise<{ error: string | null }> {
  const { error } = await client.storage.from(BUCKET).upload(path, pdf, {
    contentType: 'application/pdf',
    upsert: true,
  });
  return { error: error ? error.message : null };
}

/** Upsert de edición → SIEMPRE termina en 'pending' (spec §3 Regeneración).
 *  Si la fila (edition,locale) existente estaba 'active', se demota a pending
 *  y se restaura como 'active' la archivada más reciente del locale (para no
 *  dejar hueco en la descarga mientras Luis re-aprueba). */
export async function upsertEditionPending(
  client: Client,
  args: { edition: string; locale: 'es' | 'en'; storagePath: string; units: unknown },
): Promise<{ error: string | null }> {
  const { data: existing } = await hub(client)
    .from(TABLE)
    .select('id, status')
    .eq('edition', args.edition)
    .eq('locale', args.locale)
    .maybeSingle();

  const wasActive = existing?.status === 'active';

  const { error } = await hub(client)
    .from(TABLE)
    .upsert(
      {
        edition: args.edition,
        locale: args.locale,
        storage_path: args.storagePath,
        status: 'pending',
        units: args.units,
        generated_at: new Date().toISOString(),
        approved_at: null,
      },
      { onConflict: 'edition,locale' },
    );
  if (error) return { error: error.message };

  if (wasActive) {
    const { data: lastArchived } = await hub(client)
      .from(TABLE)
      .select('id')
      .eq('locale', args.locale)
      .eq('status', 'archived')
      .neq('edition', args.edition)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastArchived) {
      await hub(client).from(TABLE).update({ status: 'active' }).eq('id', lastArchived.id);
    }
  }
  return { error: null };
}

export async function getActiveEdition(
  client: Client, locale: 'es' | 'en',
): Promise<EditionRow | null> {
  const { data, error } = await hub(client)
    .from(TABLE)
    .select('id, edition, locale, storage_path, status, generated_at, approved_at')
    .eq('locale', locale)
    .eq('status', 'active')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as EditionRow;
}

/** URL firmada de descarga (~10 min). null si falla (fail-soft). */
export async function signEditionUrl(
  client: Client, storagePath: string,
): Promise<string | null> {
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 600, {
      download: 'propyte-top10-oportunidades.pdf',
    });
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
```

- [ ] **Step 2: Gate de tipos y commit**

```bash
npx tsc --noEmit
git add src/lib/lead-magnet/editions.ts
git commit -m "feat(lead-magnet): helpers de ediciones (storage + tabla, upsert pending)"
```

---

### Task 6: Documento PDF `LeadMagnetPDFDocument.tsx`

**Files:**
- Create: `src/lib/pdf/LeadMagnetPDFDocument.tsx`

Sigue los patrones de `CotizacionPDFDocument.tsx`: Helvetica (SIN `Font.register`), `StyleSheet.create`, una `<Page size="A4">` con wrap automático, tarjetas `wrap={false}`, footer `fixed` + `page.paddingBottom: 120` (lección A1: el footer se encima sin ese padding). **Sin fotos en v1** (PDF chico y robusto; decisión del plan). Labels bilingües inline (el cron no tiene request context). Atribución: "Análisis de mercado Propyte" — PROHIBIDO nombrar proveedores de datos.

- [ ] **Step 1: Implementar el componente**

```tsx
// src/lib/pdf/LeadMagnetPDFDocument.tsx
// PDF "Top 10 Oportunidades" (lead magnet, edición mensual es/en).
// Patrones heredados de CotizacionPDFDocument: Helvetica, footer fixed +
// paddingBottom 120, tarjetas wrap={false}. Sin fotos (v1: <1.5MB garantizado).
import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';
import type { ScoredUnit } from '@/lib/lead-magnet/score';
import type { EditionData } from '@/lib/lead-magnet/edition-data';

const C = {
  navy: '#1A2F3F', aztec: '#0F1923', teal: '#5CE0D2', ice: '#A2F9FF',
  text: '#1F2937', sub: '#6B7280', line: '#E5E7EB', bg: '#F8FAFC', white: '#FFFFFF',
};

const LABELS = {
  es: {
    docTitle: 'Top 10 Oportunidades de Inversión',
    region: 'Caribe Mexicano', edition: 'Edición',
    intro: 'Selección mensual de las unidades con mejor combinación de rentabilidad estimada, descuento vigente y desempeño de zona, según el análisis de mercado Propyte.',
    rank: '#', price: 'Precio', discount: 'Descuento', rent: 'Renta est./mes',
    yieldLbl: 'Yield bruto est.', roi: 'ROI proyectado', perYear: 'anual',
    bd: 'rec', seeUnit: 'Ver ficha completa',
    marketTitle: 'Panorama de mercado', strTitle: 'Renta vacacional — nivel ciudad',
    occupancy: 'Ocupación', adr: 'Tarifa/noche (ADR)', revpar: 'RevPAR',
    ltrTitle: 'Renta larga — mediana mensual', sample: 'muestra',
    zonesTitle: 'Top 5 zonas por desempeño', zoneScore: 'Score',
    methodTitle: 'Metodología', method:
      'Ranking por score compuesto (yield de renta 35%, ROI proyectado 30%, descuento 20%, desempeño de zona 15%) sobre el inventario público de propyte.com. Cifras en MXN. Fuente: Análisis de mercado Propyte.',
    disclaimer:
      'Estimaciones referenciales, no constituyen asesoría financiera ni garantía de rendimiento. Precios y disponibilidad sujetos a cambio sin previo aviso.',
    scan: 'Escanea para explorar', brand: 'Propyte · Tu aliado en bienes raíces',
    generatedOn: 'Generado el',
  },
  en: {
    docTitle: 'Top 10 Investment Opportunities',
    region: 'Mexican Caribbean', edition: 'Edition',
    intro: 'Monthly selection of the units with the best combination of estimated returns, active discounts and zone performance, according to Propyte market analysis.',
    rank: '#', price: 'Price', discount: 'Discount', rent: 'Est. rent/mo',
    yieldLbl: 'Est. gross yield', roi: 'Projected ROI', perYear: 'per year',
    bd: 'bd', seeUnit: 'View full listing',
    marketTitle: 'Market overview', strTitle: 'Vacation rental — city level',
    occupancy: 'Occupancy', adr: 'Nightly rate (ADR)', revpar: 'RevPAR',
    ltrTitle: 'Long-term rent — monthly median', sample: 'sample',
    zonesTitle: 'Top 5 zones by performance', zoneScore: 'Score',
    methodTitle: 'Methodology', method:
      'Composite-score ranking (rental yield 35%, projected ROI 30%, discount 20%, zone performance 15%) over propyte.com public inventory. Figures in MXN. Source: Propyte market analysis.',
    disclaimer:
      'Referential estimates; not financial advice nor a performance guarantee. Prices and availability subject to change without notice.',
    scan: 'Scan to explore', brand: 'Propyte · Your real estate ally',
    generatedOn: 'Generated on',
  },
} as const;

export interface LeadMagnetPDFData {
  locale: 'es' | 'en';
  editionLabel: string;      // 'Agosto 2026' / 'August 2026'
  generatedAt: string;       // fecha legible
  data: EditionData;
  siteUrl: string;           // https://propyte.com
  qrCodeDataUrl: string;     // QR a {siteUrl}/{locale}/propiedades
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', fontSize: 9, color: C.text,
    paddingTop: 36, paddingHorizontal: 40, paddingBottom: 120, backgroundColor: C.white,
  },
  cover: { backgroundColor: C.aztec, borderRadius: 8, padding: 24, marginBottom: 16 },
  eyebrow: { color: C.ice, fontSize: 8, letterSpacing: 2, marginBottom: 6 },
  h1: { color: C.white, fontSize: 20, fontFamily: 'Helvetica-Bold' },
  coverSub: { color: C.teal, fontSize: 11, marginTop: 4 },
  intro: { color: '#D1D5DB', fontSize: 9, marginTop: 10, lineHeight: 1.5 },
  sectionTitle: {
    fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.navy,
    marginTop: 14, marginBottom: 8, paddingBottom: 4,
    borderBottomWidth: 1.5, borderBottomColor: C.teal,
  },
  card: {
    flexDirection: 'row', borderWidth: 1, borderColor: C.line, borderRadius: 6,
    padding: 10, marginBottom: 8, backgroundColor: C.bg,
  },
  rankBox: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: C.navy,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  rankText: { color: C.ice, fontSize: 11, fontFamily: 'Helvetica-Bold' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: C.navy },
  cardSub: { fontSize: 8, color: C.sub, marginTop: 2 },
  metricsRow: { flexDirection: 'row', marginTop: 6, gap: 0 },
  metric: { marginRight: 16 },
  metricLabel: { fontSize: 7, color: C.sub },
  metricValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.text, marginTop: 1 },
  discountBadge: { color: '#B91C1C', fontFamily: 'Helvetica-Bold' },
  unitLink: { fontSize: 8, color: '#0E7490', marginTop: 5, textDecoration: 'underline' },
  table: { borderWidth: 1, borderColor: C.line, borderRadius: 6, overflow: 'hidden' },
  tHead: { flexDirection: 'row', backgroundColor: C.navy, paddingVertical: 5, paddingHorizontal: 8 },
  tHeadCell: { color: C.white, fontSize: 8, fontFamily: 'Helvetica-Bold', flex: 1 },
  tRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: C.line },
  tCell: { fontSize: 8.5, flex: 1 },
  smallNote: { fontSize: 7.5, color: C.sub, marginTop: 6, lineHeight: 1.4 },
  footer: {
    position: 'absolute', bottom: 28, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8,
  },
  footerBrand: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy },
  footerLine: { fontSize: 7, color: C.sub, marginTop: 2 },
  footerRight: { alignItems: 'center' },
  qr: { width: 58, height: 58 },
  qrLabel: { fontSize: 6.5, color: C.sub, marginTop: 2 },
});

const fmtMoney = (n: number | null | undefined) =>
  n == null ? '—' : `$${Math.round(n).toLocaleString('en-US')}`;
const fmtPct = (n: number | null | undefined, d = 1) =>
  n == null ? '—' : `${n.toFixed(d)}%`;

function UnitCard({ u, i, L, siteUrl, locale }: {
  u: ScoredUnit; i: number; L: (typeof LABELS)['es']; siteUrl: string; locale: string;
}) {
  const href = `${siteUrl}/${locale}/propiedades/${u.slug}`;
  return (
    <View style={styles.card} wrap={false}>
      <View style={styles.rankBox}><Text style={styles.rankText}>{i + 1}</Text></View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{u.development_name ?? u.slug}</Text>
        <Text style={styles.cardSub}>
          {[u.city, u.zone].filter(Boolean).join(' · ')}
          {u.bedrooms != null ? `  ·  ${u.bedrooms} ${L.bd}` : ''}
          {u.area_m2 != null ? `  ·  ${Math.round(u.area_m2)} m²` : ''}
        </Text>
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>{L.price}</Text>
            <Text style={styles.metricValue}>{fmtMoney(u.effectivePrice)} MXN</Text>
          </View>
          {u.discountPct > 0 && (
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{L.discount}</Text>
              <Text style={[styles.metricValue, styles.discountBadge]}>-{fmtPct(u.discountPct, 0)}</Text>
            </View>
          )}
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>{L.rent}</Text>
            <Text style={styles.metricValue}>{fmtMoney(u.estimated_rent_mxn)}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>{L.yieldLbl}</Text>
            <Text style={styles.metricValue}>{fmtPct(u.grossYieldPct)}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>{L.roi} *</Text>
            <Text style={styles.metricValue}>{fmtPct(u.roiPct)} {L.perYear}</Text>
          </View>
        </View>
        <Link src={href}><Text style={styles.unitLink}>{L.seeUnit} →</Text></Link>
      </View>
    </View>
  );
}

export default function LeadMagnetPDFDocument({ locale, editionLabel, generatedAt, data, siteUrl, qrCodeDataUrl }: LeadMagnetPDFData) {
  const L = LABELS[locale];
  return (
    <Document title={`${L.docTitle} — ${editionLabel}`} author="Propyte">
      <Page size="A4" style={styles.page}>
        {/* Portada compacta */}
        <View style={styles.cover}>
          <Text style={styles.eyebrow}>PROPYTE · {L.region.toUpperCase()}</Text>
          <Text style={styles.h1}>{L.docTitle}</Text>
          <Text style={styles.coverSub}>{L.edition} {editionLabel}</Text>
          <Text style={styles.intro}>{L.intro}</Text>
        </View>

        {/* Top 10 */}
        {data.topUnits.map((u, i) => (
          <UnitCard key={u.id} u={u} i={i} L={L} siteUrl={siteUrl} locale={locale} />
        ))}
        <Text style={styles.smallNote}>* {L.disclaimer}</Text>

        {/* Panorama de mercado */}
        <Text style={styles.sectionTitle} break>{L.marketTitle}</Text>

        <Text style={[styles.cardTitle, { marginBottom: 6 }]}>{L.strTitle}</Text>
        <View style={styles.table}>
          <View style={styles.tHead}>
            <Text style={styles.tHeadCell}>—</Text>
            <Text style={styles.tHeadCell}>{L.occupancy}</Text>
            <Text style={styles.tHeadCell}>{L.adr}</Text>
            <Text style={styles.tHeadCell}>{L.revpar}</Text>
          </View>
          {data.cityBenchmarks.map((b) => (
            <View style={styles.tRow} key={b.city} wrap={false}>
              <Text style={[styles.tCell, { fontFamily: 'Helvetica-Bold' }]}>{b.city}</Text>
              <Text style={styles.tCell}>{fmtPct(b.median_occupancy, 0)}</Text>
              <Text style={styles.tCell}>{fmtMoney(b.median_adr)}</Text>
              <Text style={styles.tCell}>{fmtMoney(b.revpar)}</Text>
            </View>
          ))}
        </View>

        {data.ltrByCity.length > 0 && (
          <>
            <Text style={[styles.cardTitle, { marginTop: 12, marginBottom: 6 }]}>{L.ltrTitle}</Text>
            <View style={styles.table}>
              {data.ltrByCity.map((r) => (
                <View style={styles.tRow} key={r.city} wrap={false}>
                  <Text style={[styles.tCell, { fontFamily: 'Helvetica-Bold' }]}>{r.city}</Text>
                  <Text style={styles.tCell}>{fmtMoney(r.medianRent)} MXN</Text>
                  <Text style={styles.tCell}>{L.sample}: {r.sample}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {data.topZones.length > 0 && (
          <>
            <Text style={[styles.cardTitle, { marginTop: 12, marginBottom: 6 }]}>{L.zonesTitle}</Text>
            <View style={styles.table}>
              {data.topZones.map((z) => (
                <View style={styles.tRow} key={`${z.city}-${z.zone}`} wrap={false}>
                  <Text style={[styles.tCell, { fontFamily: 'Helvetica-Bold', flex: 2 }]}>{z.zone} · {z.city}</Text>
                  <Text style={styles.tCell}>{L.zoneScore}: {z.score == null ? '—' : Math.round(z.score)}</Text>
                  <Text style={styles.tCell}>{L.occupancy}: {fmtPct(z.median_occupancy, 0)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Metodología + disclaimer */}
        <Text style={styles.sectionTitle}>{L.methodTitle}</Text>
        <Text style={styles.smallNote}>{L.method}</Text>
        <Text style={styles.smallNote}>{L.disclaimer}</Text>

        {/* Footer fijo (paddingBottom:120 lo protege — lección cotización A1) */}
        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerBrand}>{L.brand}</Text>
            <Link src={siteUrl}><Text style={styles.footerLine}>{siteUrl.replace(/^https?:\/\//, '')}</Text></Link>
            <Text style={styles.footerLine}>{L.generatedOn} {generatedAt}</Text>
          </View>
          <View style={styles.footerRight}>
            <Image src={qrCodeDataUrl} style={styles.qr} />
            <Text style={styles.qrLabel}>{L.scan}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Gate de tipos y commit**

```bash
npx tsc --noEmit
git add src/lib/pdf/LeadMagnetPDFDocument.tsx
git commit -m "feat(lead-magnet): documento PDF Top 10 + panorama de mercado (es/en)"
```

---

### Task 7: Cron route `/api/cron/lead-magnet-edition`

**Files:**
- Create: `src/app/api/cron/lead-magnet-edition/route.ts`

- [ ] **Step 1: Implementar la ruta**

```ts
// src/app/api/cron/lead-magnet-edition/route.ts
// Genera la edición mensual del lead magnet (PDF es+en) → Storage + tabla (pending).
// Invocación: cron Hostinger mensual o manual, header x-cron-secret (o Bearer).
// GET para paridad con zoho-retry (los crons de Hostinger hacen GET).
import { NextResponse } from 'next/server';
import { createElement } from 'react';
import { renderToStream } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { verifyCronSecret, verifyCronSecretHeader } from '@/lib/security/cron-auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { buildEditionData } from '@/lib/lead-magnet/edition-data';
import { editionStoragePath, uploadEditionPdf, upsertEditionPending } from '@/lib/lead-magnet/editions';
import LeadMagnetPDFDocument from '@/lib/pdf/LeadMagnetPDFDocument';
import type { DocumentProps } from '@react-pdf/renderer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const LOCALES = ['es', 'en'] as const;
const MAX_PDF_BYTES = 1_572_864; // 1.5MB objetivo del spec

function editionLabel(edition: string, locale: 'es' | 'en'): string {
  const [y, m] = edition.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, 15));
  const s = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function GET(request: Request) {
  const authOk =
    verifyCronSecret(request.headers.get('authorization')) ||
    verifyCronSecretHeader(request.headers.get('x-cron-secret'));
  if (!authOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service role client unavailable' }, { status: 503 });
  }

  const data = await buildEditionData(supabase);
  if (data.topUnits.length < 10) {
    // Fail-closed: un "Top 7" rompe la promesa del título. No publicar.
    return NextResponse.json(
      { error: `Pool insuficiente: ${data.topUnits.length}/10 unidades elegibles` },
      { status: 422 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://propyte.com';
  const generatedAtLegible = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long', timeZone: 'America/Cancun',
  }).format(new Date());

  const results: Array<{ locale: string; path: string; bytes: number }> = [];
  for (const locale of LOCALES) {
    const qrCodeDataUrl = await QRCode.toDataURL(`${siteUrl}/${locale}/propiedades`);
    const doc = createElement(LeadMagnetPDFDocument, {
      locale,
      editionLabel: editionLabel(data.edition, locale),
      generatedAt: generatedAtLegible,
      data,
      siteUrl,
      qrCodeDataUrl,
    }) as React.ReactElement<DocumentProps>;

    const stream = await renderToStream(doc);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    if (buffer.length > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: `PDF ${locale} excede 1.5MB (${buffer.length} bytes)` },
        { status: 422 },
      );
    }

    const path = editionStoragePath(data.edition, locale);
    const up = await uploadEditionPdf(supabase, path, buffer);
    if (up.error) {
      return NextResponse.json({ error: `Storage upload ${locale}: ${up.error}` }, { status: 500 });
    }
    const row = await upsertEditionPending(supabase, {
      edition: data.edition, locale, storagePath: path,
      units: data.topUnits.map((u) => ({
        id: u.id, slug: u.slug, development: u.development_name,
        city: u.city, score: u.score, price: u.effectivePrice,
      })),
    });
    if (row.error) {
      return NextResponse.json({ error: `DB upsert ${locale}: ${row.error}` }, { status: 500 });
    }
    results.push({ locale, path, bytes: buffer.length });
  }

  return NextResponse.json({
    ok: true, edition: data.edition, status: 'pending', results,
    note: `Aprobar con: select real_estate_hub.approve_lead_magnet_edition('${data.edition}','es'); (y 'en')`,
  });
}
```

- [ ] **Step 2: Gate de tipos + build**

Run: `npx tsc --noEmit && npm run lint`
Expected: 0 errores (warnings pre-existentes OK).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/lead-magnet-edition/route.ts
git commit -m "feat(lead-magnet): cron route genera edición mensual es/en → storage + pending"
```

---

### Task 8: `downloadUrl` en `/api/leads` + passthrough en `submitLead`

**Files:**
- Modify: `src/app/api/leads/route.ts` (respuesta de éxito, ~línea 481)
- Modify: `src/lib/leads/submit-lead.ts` (tipo `SubmitLeadResult` ~líneas 22-28 y el parse de respuesta)
- Modify: `src/lib/submitForm.ts` (passthrough en el shim)

- [ ] **Step 1: Helper + respuesta en `/api/leads`**

En `src/app/api/leads/route.ts`, agregar imports arriba:

```ts
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getActiveEdition, signEditionUrl } from '@/lib/lead-magnet/editions';
```

Agregar esta función a nivel de módulo (junto a los otros helpers del archivo):

```ts
/** URL firmada de la edición activa del lead magnet. Fail-soft: cualquier
 *  fallo (sin tabla, sin edición activa, sin service key) → null y el
 *  submit responde igual que siempre. */
async function leadMagnetDownloadUrl(locale: 'es' | 'en'): Promise<string | null> {
  try {
    const svc = await createServiceRoleClient();
    if (!svc) return null;
    const edition = await getActiveEdition(svc, locale);
    if (!edition) return null;
    return await signEditionUrl(svc, edition.storage_path);
  } catch {
    return null;
  }
}
```

Reemplazar la respuesta de éxito (línea ~481):

```ts
return NextResponse.json({ success: true, id: row.id }, { status: 200 });
```

por:

```ts
let downloadUrl: string | null = null;
if (data.source === 'lead_magnet') {
  downloadUrl = await leadMagnetDownloadUrl(data.locale === 'en' ? 'en' : 'es');
}
return NextResponse.json(
  { success: true, id: row.id, ...(downloadUrl ? { downloadUrl } : {}) },
  { status: 200 },
);
```

**NO tocar** la rama del honeypot (~294-301: bots no reciben URL) ni la rama unknown-source (~341).

- [ ] **Step 2: Passthrough en `submit-lead.ts`**

En `SubmitLeadResult` (líneas 22-28) agregar el campo:

```ts
export interface SubmitLeadResult {
  ok: boolean;
  id?: string;
  error?: string;
  /** URL firmada de descarga del lead magnet (solo source=lead_magnet con edición activa). */
  downloadUrl?: string;
}
```

En el cuerpo de `submitLead` hay 2 cambios exactos:

(a) El tipo local del JSON parseado (actualmente `let json: { success?: boolean; id?: string };`) pasa a:

```ts
let json: { success?: boolean; id?: string; downloadUrl?: string };
```

(b) El retorno de éxito (actualmente `return { ok: true, id: json.id };`) pasa a:

```ts
return { ok: true, id: json.id, downloadUrl: json.downloadUrl };
```

- [ ] **Step 3: Passthrough en el shim `submitForm.ts`**

Ajustar el tipo de retorno y el mapeo (líneas 22-32):

```ts
export async function submitForm(
  data: Record<string, unknown>,
  formType: string,
): Promise<{ success: boolean; error?: string; downloadUrl?: string }> {
  const result = await submitLead(formType as LeadSource, data);
  return { success: result.ok, error: result.error, downloadUrl: result.downloadUrl };
}
```

(Conservar cualquier lógica existente del shim; solo se agrega el passthrough.)

- [ ] **Step 4: Gates + commit**

```bash
npx tsc --noEmit && npm run lint
git add src/app/api/leads/route.ts src/lib/leads/submit-lead.ts src/lib/submitForm.ts
git commit -m "feat(lead-magnet): /api/leads devuelve downloadUrl firmada (fail-soft)"
```

---

### Task 9: Frontend — success UI con descarga + i18n

**Files:**
- Modify: `src/components/home/LeadMagnet.tsx`
- Modify: `src/components/blog/BlogSidebarLeadForm.tsx`
- Modify: `src/i18n/messages/es.json` (namespace `leadMagnet`)
- Modify: `src/i18n/messages/en.json` (namespace `leadMagnet`)

- [ ] **Step 1: Claves i18n**

En `es.json` namespace `leadMagnet` (línea ~2893): ELIMINAR `checkEmail` y `checkEmailDesc`; AGREGAR:

```json
"reportReady": "¡Tu reporte está listo!",
"reportReadyDesc": "Descárgalo ahora. El enlace expira en 10 minutos.",
"downloadNow": "Descargar mi reporte",
"successGeneric": "¡Gracias por tu interés!",
"successGenericDesc": "Un asesor de Propyte te contactará muy pronto."
```

En `en.json` (mismas posiciones):

```json
"reportReady": "Your report is ready!",
"reportReadyDesc": "Download it now. The link expires in 10 minutes.",
"downloadNow": "Download my report",
"successGeneric": "Thanks for your interest!",
"successGenericDesc": "A Propyte advisor will contact you shortly."
```

⚠️ Mantener PARIDAD exacta de claves es/en (gate del repo). Verifica que `checkEmail`/`checkEmailDesc` no queden referenciadas en ningún otro componente: `rg -n "checkEmail" src/` debe devolver 0 tras el Step 2/3.

- [ ] **Step 2: `LeadMagnet.tsx` — migrar a `submitLead` + success con descarga**

Cambios sobre `src/components/home/LeadMagnet.tsx`:

(a) Reemplazar el import del shim (`import { submitForm } from '@/lib/submitForm';`) por:

```ts
import { submitLead } from '@/lib/leads/submit-lead';
```

(El ícono del botón de descarga reusa `FileDown`, ya importado en el componente.)

(b) Nuevo estado y submit:

```ts
const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!name.trim() || !email.trim()) return;
  setStatus('sending');
  const result = await submitLead('lead_magnet', { name, email, website });
  if (result.ok) {
    setDownloadUrl(result.downloadUrl ?? null);
    setStatus('success');
  } else {
    setStatus('error');
  }
}
```

(c) Reemplazar el bloque de éxito (actual líneas 53-58) por:

```tsx
{status === 'success' ? (
  <div className="text-center py-6">
    <CheckCircle size={48} className="mx-auto text-[#22C55E] mb-4" />
    {downloadUrl ? (
      <>
        <h3 className="text-xl font-bold text-white mb-2">{t('reportReady')}</h3>
        <p className="text-white/75 text-sm mb-4">{t('reportReadyDesc')}</p>
        <a
          href={downloadUrl}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#A2F9FF] hover:bg-[#81EAF1] text-[#0B1C1E] font-bold rounded-lg transition-colors"
        >
          <FileDown size={18} />
          {t('downloadNow')}
        </a>
      </>
    ) : (
      <>
        <h3 className="text-xl font-bold text-white mb-2">{t('successGeneric')}</h3>
        <p className="text-white/75 text-sm">{t('successGenericDesc')}</p>
      </>
    )}
  </div>
) : (
```

**NO tocar** los atributos WebMCP del form (`toolname`, `tooldescription`, `toolparamdescription`) ni el honeypot.

- [ ] **Step 3: `BlogSidebarLeadForm.tsx` — mismo tratamiento compacto**

El submit ya usa `submitLead` (línea 28). Agregar el estado junto a los existentes:

```ts
const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
```

y en `handleSubmit`, reemplazar `setStatus(result.ok ? 'success' : 'error');` por:

```ts
if (result.ok) setDownloadUrl(result.downloadUrl ?? null);
setStatus(result.ok ? 'success' : 'error');
```

**NO tocar** la lógica `registerTool`/`agentToolAttrs` (WebMCP: la copia móvil con `registerTool=false` debe seguir invisible — gotcha del renderer). Reemplazar el bloque de éxito (líneas 55-60) por:

```tsx
{status === 'success' ? (
  <div className="text-center py-4">
    <CheckCircle size={36} className="mx-auto text-[#22C55E] mb-3" />
    {downloadUrl ? (
      <>
        <h4 className="text-sm font-bold text-white mb-1">{tlm('reportReady')}</h4>
        <a href={downloadUrl} className="text-xs font-bold text-[#A2F9FF] underline">
          {tlm('downloadNow')}
        </a>
      </>
    ) : (
      <>
        <h4 className="text-sm font-bold text-white mb-1">{tlm('successGeneric')}</h4>
        <p className="text-white/75 text-xs">{tlm('successGenericDesc')}</p>
      </>
    )}
  </div>
) : ( /* form igual */ )}
```

- [ ] **Step 4: Gates completos + commit**

```bash
rg -n "checkEmail" src/   # debe devolver 0 resultados
npx tsc --noEmit && npm run lint && npm run build
git add src/components/home/LeadMagnet.tsx src/components/blog/BlogSidebarLeadForm.tsx src/i18n/messages/es.json src/i18n/messages/en.json
git commit -m "feat(lead-magnet): success UI con descarga directa + i18n (es/en)"
```

---

### Task 10: Verificación integral (local, contra prod DB read-only + tabla nueva)

Requiere: migración de Task 4 APLICADA y `.env.local` con `SUPABASE_SERVICE_ROLE_KEY` + `CRON_SECRET`.

- [ ] **Step 1: Suite completa de gates**

Run: `npm run test:unit && npx tsc --noEmit && npm run lint && npm run build`
Expected: todo verde.

- [ ] **Step 2: Generar edición real en local**

```bash
npm run build && node .next/standalone/server.js &   # o npm run dev si el standalone no toma .env.local
curl -s -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/lead-magnet-edition | python -m json.tool
```

Expected: `{"ok": true, "edition": "2026-07", "status": "pending", "results": [{es...}, {en...}]}` con `bytes < 1572864`.

- [ ] **Step 3: Auditar el PDF POR RENDER (no por HTTP 200)**

Descargar ambos PDFs del bucket (Supabase Studio o URL firmada) y renderizarlos a PNG con pymupdf (lección `feedback_pdf_audit_render_not_curl`):

```bash
python -c "
import fitz, sys
doc = fitz.open('top10-es.pdf')
for i, page in enumerate(doc):
    page.get_pixmap(dpi=110).save(f'top10-es-p{i}.png')
print(f'{doc.page_count} páginas')"
```

Checklist visual (ver los PNG): 10 tarjetas numeradas 1-10, footer NO encimado sobre contenido, tabla STR con ciudades, sin nombres de proveedores de datos, es Y en, ≥3 ciudades en el top, máx 2 unidades por desarrollo (cotejar contra el JSON `units` de la tabla).

- [ ] **Step 4: Aprobar la edición y probar el flujo E2E**

En SQL Editor (o MCP con autorización):

```sql
select real_estate_hub.approve_lead_magnet_edition('2026-07', 'es');
select real_estate_hub.approve_lead_magnet_edition('2026-07', 'en');
```

Luego contra el server local:

```bash
# Submit válido → debe traer downloadUrl
curl -s -X POST http://localhost:3000/api/leads -H "Content-Type: application/json" \
  -d '{"name":"Test Plan","email":"test-plan@propyte.com","source":"lead_magnet","locale":"es"}' | python -m json.tool
# Honeypot → success fake SIN downloadUrl
curl -s -X POST http://localhost:3000/api/leads -H "Content-Type: application/json" \
  -d '{"name":"Bot","email":"bot@x.com","website":"spam","source":"lead_magnet","locale":"es"}' | python -m json.tool
```

Expected: primer curl con `downloadUrl` (y la URL descarga un PDF válido); segundo curl `{success:true, id}` SIN `downloadUrl`. ⚠️ El primer curl crea un lead real en Zoho — usar nombre "Test Plan" y avisarle a Luis para borrarlo, o correrlo con Zoho env vars vacíos en local.

- [ ] **Step 5: Descarga sin firma debe fallar**

```bash
curl -s -o /dev/null -w "%{http_code}" "https://oaijxdpevakashxshhvm.supabase.co/storage/v1/object/public/lead-magnets/editions/2026-07-es.pdf"
```

Expected: `400` o `404` (bucket privado — NUNCA 200).

- [ ] **Step 6: Commit final de ajustes de la verificación (si los hubo)**

```bash
git add -A && git commit -m "test(lead-magnet): ajustes de verificación integral"
```

---

### Task 11: Rollout (gates de Luis — NO automatizar)

Orden del spec §8. Cada paso requiere confirmación de Luis:

- [ ] **Step 1:** Migración aplicada (Task 4 Step 3) — si no se hizo antes.
- [ ] **Step 2:** Merge/push de la rama a `main` (Hostinger auto-deploy ~15-25 min). Verificar `CRON_SECRET` y `SUPABASE_SERVICE_ROLE_KEY` presentes en el env de prod (ya los usa zoho-retry / server.ts).
- [ ] **Step 3:** Generar la primera edición EN PROD: `curl -H "x-cron-secret: ***" https://propyte.com/api/cron/lead-magnet-edition`. Auditar el PDF por render. Luis aprueba con la función SQL.
- [ ] **Step 4:** Verificar en vivo el Home: submit real → botón de descarga → PDF. (Click-through lo hace Luis — regla `feedback_classifier_blocks_prod_write_e2e`.)
- [ ] **Step 5:** Programar el cron mensual en hPanel (Hostinger): día 1 de cada mes, 06:00, `curl -H "x-cron-secret: ***" https://propyte.com/api/cron/lead-magnet-edition`. ⚠️ Recordar el gotcha CDN hcdn: los route handlers pueden cachearse — este cron responde `force-dynamic`, pero verificar el header `x-hcdn-cache-status` en la primera corrida.
- [ ] **Step 6 (opcional, datos):** Actualizar el copy del CTA `home_lead_magnet` en el Hub para mencionar la edición vigente.

**Fase 2 (fuera de este plan):** vista de aprobación en Propyte_hub; re-envío de ediciones a leads históricos; tracking de descarga.
