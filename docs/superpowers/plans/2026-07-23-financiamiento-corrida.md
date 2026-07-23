# Etiquetado honesto + /financiamiento con corrida real — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Etiquetar honesto el Periodo de las filas supuesto/derivado en la tabla "Origen de los datos" de la ficha de unidad; (2) reemplazar la calculadora genérica de `/financiamiento` por la corrida hipotecaria real (perfiles Nacional/Extranjero + `CorridaCompacta`) y agregar una sección de ejemplos con propiedades reales del catálogo.

**Architecture:** Se reusan las libs puras existentes (`computeHipotecario`, `HIPOTECARIO_CONFIG`, `buildAmortizationSchedule` vía schedule) y el componente `CorridaCompacta` de la ficha — cero fórmulas nuevas. La selección de ejemplos es un helper puro nuevo (`pickEjemplosPorTerciles`) testeado con vitest; la página server-side trae unidades con `getUnits`, mapea con `mapUnitToProperty` y calcula enganche/mensualidad con `computeHipotecario`. Fail-closed en toda la sección de ejemplos.

**Tech Stack:** Next.js 16 App Router, next-intl, recharts (vía `CorridaCompacta`, cargado lazy), Supabase (`v_units` vía `getUnits`), vitest.

**Spec:** `docs/superpowers/specs/2026-07-23-financiamiento-corrida-design.md`
**Rama:** `feat/financiamiento-corrida` (worktree `~/Projects/Propyte/Next_Propyte_web_unidades`)

**Reglas de contexto que el implementador DEBE respetar:**
- NUNCA mostrar totales lifetime (intereses totales / total pagado) en UI de financiamiento — solo mensualidad (decisión Luis 2026-07-20).
- No tocar `HIPOTECARIO_CONFIG` ni `calculator.ts` — se leen tal cual.
- No push a `main`; commits solo en la rama.
- Todos los textos UI via i18n con paridad es/en.

---

### Task 1: Etiquetado honesto en "Origen de los datos"

**Files:**
- Modify: `src/i18n/messages/es.json` (namespace `simulator`, junto a `periodRecent` ~línea 963)
- Modify: `src/i18n/messages/en.json` (mismas keys, mismo namespace)
- Modify: `src/app/[locale]/propiedades/_components/RentabilidadTab.tsx:156-157` y `:194-195`

- [ ] **Step 1: Agregar keys i18n en es.json**

En `src/i18n/messages/es.json`, dentro del namespace `"simulator"`, inmediatamente después de la línea `"periodRecent": "análisis reciente",` agregar:

```json
    "periodAssumption": "supuesto fijo",
    "periodDerived": "derivado de los datos anteriores",
```

(minúsculas, consistente con `"últimos 12 meses"` / `"análisis reciente"`).

- [ ] **Step 2: Agregar keys i18n en en.json**

En `src/i18n/messages/en.json`, namespace `"simulator"`, después de `"periodRecent"`:

```json
    "periodAssumption": "fixed assumption",
    "periodDerived": "derived from the data above",
```

- [ ] **Step 3: Pasar `period` en las 4 filas de RentabilidadTab.tsx**

En `src/app/[locale]/propiedades/_components/RentabilidadTab.tsx`, panel Residencial (líneas 155-157), las filas quedan:

```tsx
          { label: t('rowMonthlyRent'), value: formatPrice(Math.round(grossRent)), source: t('sourcePropyte'), period: t('periodRecent') },
          { label: t('rowOccupancyAssumed'), value: `${Math.round(RES.OCCUPANCY * 100)}%`, source: t('sourceEstimate'), period: t('periodAssumption') },
          { label: t('rowYields'), value: `${formatPercentage(grossYield)} / ${formatPercentage(netYield)} / ${formatPercentage(capRate)}`, source: t('sourceCalc'), period: t('periodDerived') },
```

Panel Vacacional (líneas 192-195), las filas quedan:

```tsx
          { label: t('rowAdr'), value: adr != null ? formatPrice(adr) : '—', source: t('sourcePropyte'), period: t('period12m') },
          { label: t('rowOccupancy'), value: `${Math.round(occupancy)}%`, source: t('sourcePropyte'), period: t('period12m') },
          { label: t('rowRevpar'), value: revpar != null ? formatPrice(revpar) : '—', source: t('sourceCalc'), period: t('periodDerived') },
          { label: t('rowEstIncome'), value: formatPrice(netRent), source: t('sourceEstimate'), period: t('periodDerived') },
```

(Solo cambian las filas de `sourceCalc`/`sourceEstimate`; las de `sourcePropyte` ya tenían period.) `DataSourceTable.tsx` NO se toca.

- [ ] **Step 4: Verificar tsc + paridad i18n**

```bash
npx tsc --noEmit
node -e "const es=require('./src/i18n/messages/es.json'),en=require('./src/i18n/messages/en.json');const k=o=>Object.entries(o).flatMap(([a,b])=>b&&typeof b==='object'?k(b).map(x=>a+'.'+x):[a]);const A=new Set(k(es)),B=new Set(k(en));console.log('es',A.size,'en',B.size);console.log('solo-es',[...A].filter(x=>!B.has(x)));console.log('solo-en',[...B].filter(x=>!A.has(x)));"
```

Expected: tsc exit 0; conteos es/en IGUALES; ambos arrays `solo-*` vacíos.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/messages/es.json src/i18n/messages/en.json "src/app/[locale]/propiedades/_components/RentabilidadTab.tsx"
git commit -m "fix(rentabilidad): periodo honesto en origen de datos (supuesto fijo / derivado)"
```

---

### Task 2: Helper puro `pickEjemplosPorTerciles` (TDD)

**Files:**
- Create: `src/lib/financiamiento-ejemplos.ts`
- Test: `src/lib/financiamiento-ejemplos.test.ts`

Selecciona hasta 3 unidades (1 por tercil de precio: bajo/medio/alto) del pool público. Válida = tiene `slug`, `price_mxn > 0` (coercionar `Number()` — Supabase serializa NUMERIC como string) y al menos 1 imagen string. Dentro de cada tercil gana la de `created_at` más reciente. Retorna en orden de precio ascendente.

- [ ] **Step 1: Escribir los tests (fallan)**

Crear `src/lib/financiamiento-ejemplos.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { pickEjemplosPorTerciles } from './financiamiento-ejemplos';

const row = (
  slug: string,
  price: number | string | null,
  created = '2026-01-01T00:00:00Z',
  images: unknown = ['a.jpg'],
) => ({ slug, price_mxn: price, created_at: created, images });

describe('pickEjemplosPorTerciles', () => {
  it('devuelve [] con pool vacío o sin filas válidas', () => {
    expect(pickEjemplosPorTerciles([])).toEqual([]);
    expect(pickEjemplosPorTerciles([
      row('sin-precio', 0),
      row('precio-null', null),
      row('sin-imagen', 1_000_000, '2026-01-01', []),
      row('imagen-basura', 1_000_000, '2026-01-01', [null, 42]),
    ])).toEqual([]);
  });

  it('elige 1 por tercil y retorna en orden de precio ascendente', () => {
    const picked = pickEjemplosPorTerciles([
      row('alto-1', 9_000_000), row('bajo-1', 1_000_000), row('medio-2', 4_500_000),
      row('bajo-2', 1_500_000), row('alto-2', 12_000_000), row('medio-1', 4_000_000),
    ]);
    expect(picked).toHaveLength(3);
    expect(Number(picked[0].price_mxn)).toBeLessThan(Number(picked[1].price_mxn));
    expect(Number(picked[1].price_mxn)).toBeLessThan(Number(picked[2].price_mxn));
  });

  it('dentro del tercil gana la más reciente', () => {
    const picked = pickEjemplosPorTerciles([
      row('bajo-viejo', 1_000_000, '2026-01-01T00:00:00Z'),
      row('bajo-nuevo', 1_200_000, '2026-06-01T00:00:00Z'),
      row('medio-1', 4_000_000), row('medio-2', 4_500_000),
      row('alto-1', 9_000_000), row('alto-2', 12_000_000),
    ]);
    expect(picked[0].slug).toBe('bajo-nuevo');
  });

  it('con menos de 3 válidas devuelve las que haya, sin duplicar', () => {
    expect(pickEjemplosPorTerciles([row('unica', 2_000_000)]).map((r) => r.slug)).toEqual(['unica']);
    const dos = pickEjemplosPorTerciles([row('a', 1_000_000), row('b', 8_000_000)]);
    expect(dos.map((r) => r.slug)).toEqual(['a', 'b']);
  });

  it('coerciona price_mxn string (NUMERIC de Supabase)', () => {
    const picked = pickEjemplosPorTerciles([
      row('s1', '1000000'), row('s2', '5000000'), row('s3', '9000000'),
    ]);
    expect(picked.map((r) => r.slug)).toEqual(['s1', 's2', 's3']);
  });
});
```

- [ ] **Step 2: Correr tests — deben FALLAR**

```bash
npx vitest run src/lib/financiamiento-ejemplos.test.ts
```

Expected: FAIL — `Cannot find module './financiamiento-ejemplos'` (o equivalente).

- [ ] **Step 3: Implementación mínima**

Crear `src/lib/financiamiento-ejemplos.ts`:

```ts
/**
 * Selección determinista de unidades de ejemplo para /financiamiento.
 * Del pool público (v_units ya filtrado approved/no-deleted por getUnits) se
 * queda con las filas con precio, slug e imagen; ordena por precio y elige
 * 1 por tercil (la de created_at más reciente) → hasta `count` ejemplos
 * bajo/medio/alto, en orden de precio ascendente. Fail-closed: sin filas
 * válidas retorna [].
 */
export interface EjemploPoolRow {
  slug?: string | null;
  price_mxn?: number | string | null;
  images?: unknown;
  created_at?: string | null;
}

function firstImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  const img = images.find((i) => typeof i === 'string' && i.length > 0);
  return typeof img === 'string' ? img : null;
}

export function pickEjemplosPorTerciles<T extends EjemploPoolRow>(rows: T[], count = 3): T[] {
  const validas = rows.filter(
    (r) => !!r.slug && Number(r.price_mxn) > 0 && firstImage(r.images) !== null,
  );
  if (validas.length === 0) return [];
  const orden = [...validas].sort((a, b) => Number(a.price_mxn) - Number(b.price_mxn));
  const n = orden.length;
  const k = Math.min(count, n);
  const usados = new Set<string>();
  const seleccion: T[] = [];
  for (let i = 0; i < k; i++) {
    const desde = Math.floor((i * n) / k);
    const hasta = Math.floor(((i + 1) * n) / k); // exclusivo
    const bucket = orden.slice(desde, hasta).filter((r) => !usados.has(r.slug as string));
    if (bucket.length === 0) continue;
    const elegida = bucket.reduce(
      (best, r) => (String(r.created_at ?? '') > String(best.created_at ?? '') ? r : best),
      bucket[0],
    );
    usados.add(elegida.slug as string);
    seleccion.push(elegida);
  }
  return seleccion;
}
```

- [ ] **Step 4: Correr tests — deben PASAR**

```bash
npx vitest run src/lib/financiamiento-ejemplos.test.ts
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/financiamiento-ejemplos.ts src/lib/financiamiento-ejemplos.test.ts
git commit -m "feat(financiamiento): helper puro de seleccion de ejemplos por terciles (TDD)"
```

---

### Task 3: `FinanciamientoSimulator` (calculadora con perfiles + corrida)

**Files:**
- Create: `src/components/financiamiento/FinanciamientoSimulator.tsx`
- Create: `src/components/financiamiento/FinanciamientoSimulatorLazy.tsx`
- Modify: `src/i18n/messages/es.json` + `en.json` (namespace `financiamiento`: keys `calc*`)

Notas clave:
- Reusa keys del namespace `esquemas` que ya existen: `perfilLabel`, `nacional`, `extranjero`, `tasaAnual`, `plazo`, `plazoAnios` (con `{n}`), `moneda`, `avisoCambiario` — NO duplicarlas.
- `CorridaCompacta` se importa con alias: `@/app/[locale]/propiedades/_components/esquemas/CorridaCompacta` (props: `{ schedule: AmortSchedule; currency?: 'MXN' | 'USD' }`; trae sus propias keys `esquemas`).
- Mensualidad = `result.schedule.cuota`. PROHIBIDO renderizar `totalIntereses`/`totalPagado`.
- Extranjero: montos en MXN; el chip Moneda muestra `config.moneda` (USD) y `config.avisoCambiario` activa el aviso — espejo exacto de la ficha.

- [ ] **Step 1: Keys i18n `calc*` en es.json**

En `src/i18n/messages/es.json`, namespace `"financiamiento"`, después de `"banksDisclaimer"` agregar:

```json
    "calcEyebrow": "Simulador hipotecario",
    "calcTitle": "Calcula tu mensualidad real",
    "calcSubtitle": "Con las tasas y condiciones vigentes por perfil — la misma corrida que ves en cada propiedad.",
    "calcPriceLabel": "Valor de la propiedad",
    "calcDownPaymentPct": "Enganche",
    "calcMonthly": "Mensualidad estimada",
    "calcPerMonth": "por mes",
    "calcDownPaymentValue": "Enganche",
    "calcFinanced": "Monto a financiar",
    "calcCta": "Hablar con un asesor",
    "calcDisclaimer": "Cálculo referencial sin seguros, comisión por apertura ni gastos de escrituración. Las condiciones finales dependen del banco y tu perfil crediticio.",
```

- [ ] **Step 2: Keys i18n `calc*` en en.json**

Mismo lugar en `en.json`:

```json
    "calcEyebrow": "Mortgage simulator",
    "calcTitle": "Calculate your real monthly payment",
    "calcSubtitle": "With current rates and terms by buyer profile — the same schedule you see on each property.",
    "calcPriceLabel": "Property value",
    "calcDownPaymentPct": "Down payment",
    "calcMonthly": "Estimated monthly payment",
    "calcPerMonth": "per month",
    "calcDownPaymentValue": "Down payment",
    "calcFinanced": "Amount financed",
    "calcCta": "Talk to an advisor",
    "calcDisclaimer": "Reference calculation excluding insurance, origination fees and closing costs. Final terms depend on the bank and your credit profile.",
```

- [ ] **Step 3: Crear `FinanciamientoSimulator.tsx`**

Crear `src/components/financiamiento/FinanciamientoSimulator.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Calculator, MapPin, Globe, AlertTriangle, ArrowRight } from '@/lib/icons';
import { computeHipotecario, type PerfilHipotecario } from '@/lib/hipotecario';
import { formatPrice } from '@/lib/formatters';
import CorridaCompacta from '@/app/[locale]/propiedades/_components/esquemas/CorridaCompacta';

const PRICE_MIN = 500_000;
const PRICE_MAX = 30_000_000;
const PRICE_STEP = 100_000;
const PRICE_DEFAULT = 4_000_000;

export default function FinanciamientoSimulator() {
  const t = useTranslations('financiamiento');
  const tE = useTranslations('esquemas');
  const locale = useLocale();
  const [precio, setPrecio] = useState(PRICE_DEFAULT);
  const [perfil, setPerfil] = useState<PerfilHipotecario>('nacional');
  // Texto libre mientras el campo tiene foco; null = mostrar precio formateado.
  const [inputText, setInputText] = useState<string | null>(null);

  const result = useMemo(() => computeHipotecario(precio, perfil), [precio, perfil]);
  const { config, enganche, saldo, schedule } = result;

  const clamp = (v: number) => Math.min(PRICE_MAX, Math.max(PRICE_MIN, v));
  const commitInput = () => {
    if (inputText == null) return;
    const digits = Number(inputText.replace(/[^\d]/g, ''));
    if (digits > 0) setPrecio(clamp(digits));
    setInputText(null);
  };

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#5CE0D2]/10 rounded-full mb-3">
            <Calculator size={14} className="text-[#0E7490]" />
            <span className="text-[#0E7490] text-xs font-semibold uppercase tracking-wide">{t('calcEyebrow')}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-2">{t('calcTitle')}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{t('calcSubtitle')}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Inputs */}
          <div className="bg-[#F4F6F8] rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="fin-sim-precio" className="text-sm font-semibold text-[#1A2F3F]">{t('calcPriceLabel')}</label>
              </div>
              <input
                id="fin-sim-precio"
                type="text"
                inputMode="numeric"
                value={inputText ?? formatPrice(precio)}
                onFocus={() => setInputText(String(precio))}
                onChange={(e) => setInputText(e.target.value)}
                onBlur={commitInput}
                onKeyDown={(e) => { if (e.key === 'Enter') commitInput(); }}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-[#1A2F3F] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5CE0D2]"
              />
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={precio}
                onChange={(e) => { setInputText(null); setPrecio(Number(e.target.value)); }}
                className="mt-3 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#5CE0D2]"
                aria-label={t('calcPriceLabel')}
              />
            </div>

            {/* Perfil (mismo patrón visual de la ficha) */}
            <div>
              <label className="block text-2xs font-medium text-gray-600 uppercase tracking-wider mb-2">{tE('perfilLabel')}</label>
              <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPerfil('nacional')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${perfil === 'nacional' ? 'bg-propyte-brand text-[#0F1923]' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <MapPin size={15} /> {tE('nacional')}
                </button>
                <button
                  type="button"
                  onClick={() => setPerfil('extranjero')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${perfil === 'extranjero' ? 'bg-propyte-brand text-[#0F1923]' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Globe size={15} /> {tE('extranjero')}
                </button>
              </div>
            </div>

            {/* Chips de condiciones (solo lectura, desde HIPOTECARIO_CONFIG) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Chip label={tE('tasaAnual')} value={`${config.tasaAnualPct}%`} />
              <Chip label={tE('plazo')} value={tE('plazoAnios', { n: Math.round(config.meses / 12) })} />
              <Chip label={t('calcDownPaymentPct')} value={`${config.enganchePct}%`} />
              <Chip label={tE('moneda')} value={config.moneda} />
            </div>

            {config.avisoCambiario && (
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-2xs text-amber-800 leading-relaxed">{tE('avisoCambiario')}</p>
              </div>
            )}
          </div>

          {/* Output — SOLO mensualidad + enganche + saldo. NUNCA totales lifetime. */}
          <div className="bg-gradient-to-br from-[#0F1923] to-[#1A2F3F] rounded-2xl p-6 md:p-8 text-white flex flex-col">
            <div className="text-center mb-6">
              <div className="text-xs uppercase tracking-wider text-[#5CE0D2] mb-1">{t('calcMonthly')}</div>
              <div className="text-4xl md:text-5xl font-bold tabular-nums">{formatPrice(Math.round(schedule.cuota))}</div>
              <div className="text-xs text-white/75 mt-1">{t('calcPerMonth')}</div>
            </div>
            <div className="space-y-2 text-sm">
              <OutputRow label={`${t('calcDownPaymentValue')} (${config.enganchePct}%)`} value={formatPrice(enganche)} />
              <OutputRow label={t('calcFinanced')} value={formatPrice(saldo)} />
            </div>
            <Link
              href={`/${locale}/contacto?asunto=financiamiento`}
              className="mt-auto w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold rounded-xl transition-colors"
            >
              {t('calcCta')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Corrida por año (barras interés/capital + tabla expandible) */}
        <div className="max-w-5xl mx-auto mt-8">
          <CorridaCompacta schedule={schedule} currency="MXN" />
        </div>

        <p className="text-xs text-gray-600 text-center mt-8 max-w-2xl mx-auto">{t('calcDisclaimer')}</p>
      </div>
    </section>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 text-center">
      <div className="text-2xs uppercase tracking-wider text-gray-600">{label}</div>
      <div className="text-base font-bold text-[#1A2F3F]">{value}</div>
    </div>
  );
}

function OutputRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-white/65">{label}</span>
      <span className="tabular-nums text-white font-semibold">{value}</span>
    </div>
  );
}
```

Nota: el CTA usa `mt-auto` para pegarse al fondo del panel oscuro; si queda muy pegado a los OutputRow en móvil, cambiar el contenedor `space-y-2` por `space-y-2 mb-6`.

- [ ] **Step 4: Crear `FinanciamientoSimulatorLazy.tsx`**

Crear `src/components/financiamiento/FinanciamientoSimulatorLazy.tsx` (mismo patrón que el lazy viejo — recharts vive dentro de `CorridaCompacta`):

```tsx
'use client';

import dynamic from 'next/dynamic';

// financiamiento/page.tsx es un Server Component — `ssr: false` no está
// permitido ahí, por eso el boundary vive en este wrapper 'use client'.
// El simulador monta recharts (~340KB) vía CorridaCompacta; se carga en el
// cliente tras la hidratación. El placeholder reserva la altura aproximada
// de la sección (header + grid inputs/output + corrida) para evitar CLS.
const FinanciamientoSimulator = dynamic(() => import('./FinanciamientoSimulator'), {
  ssr: false,
  loading: () => (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="min-h-[1500px] lg:min-h-[1150px] rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    </section>
  ),
});

export default FinanciamientoSimulator;
```

- [ ] **Step 5: Verificar tsc + eslint + paridad**

```bash
npx tsc --noEmit
npx eslint src/components/financiamiento/FinanciamientoSimulator.tsx src/components/financiamiento/FinanciamientoSimulatorLazy.tsx
node -e "const es=require('./src/i18n/messages/es.json'),en=require('./src/i18n/messages/en.json');const k=o=>Object.entries(o).flatMap(([a,b])=>b&&typeof b==='object'?k(b).map(x=>a+'.'+x):[a]);const A=new Set(k(es)),B=new Set(k(en));console.log('es',A.size,'en',B.size);console.log('solo-es',[...A].filter(x=>!B.has(x)));console.log('solo-en',[...B].filter(x=>!A.has(x)));"
```

Expected: tsc 0, eslint 0 errores, paridad OK. (El componente aún no se usa — el warning de unused no aplica a archivos nuevos completos.)

- [ ] **Step 6: Commit**

```bash
git add src/components/financiamiento/FinanciamientoSimulator.tsx src/components/financiamiento/FinanciamientoSimulatorLazy.tsx src/i18n/messages/es.json src/i18n/messages/en.json
git commit -m "feat(financiamiento): simulador hipotecario con perfiles Nac/Ext + CorridaCompacta"
```

---

### Task 4: Sección "Ejemplos con propiedades reales" + integración en la página

**Files:**
- Create: `src/components/financiamiento/EjemplosPropiedades.tsx`
- Modify: `src/app/[locale]/financiamiento/page.tsx` (imports, fetch server-side, swap calculadora, render sección)
- Modify: `src/i18n/messages/es.json` + `en.json` (namespace `financiamiento`: keys `examples*`)

- [ ] **Step 1: Keys i18n `examples*` en es.json**

Namespace `"financiamiento"`, después de `"calcDisclaimer"`:

```json
    "examplesTitle": "Ejemplos con propiedades reales",
    "examplesSubtitle": "Unidades del catálogo con su enganche y mensualidad estimada para perfil nacional.",
    "examplesBedrooms": "{n} rec",
    "examplesDownPayment": "Enganche ({pct}%)",
    "examplesMonthly": "Mensualidad",
    "examplesCta": "Ver corrida completa",
    "examplesNote": "Cifras informativas con perfil nacional, sujetas a aprobación bancaria. Consulta la corrida completa en cada propiedad.",
```

- [ ] **Step 2: Keys i18n `examples*` en en.json**

```json
    "examplesTitle": "Real property examples",
    "examplesSubtitle": "Catalog units with their down payment and estimated monthly payment for a national-buyer profile.",
    "examplesBedrooms": "{n} BR",
    "examplesDownPayment": "Down payment ({pct}%)",
    "examplesMonthly": "Monthly payment",
    "examplesCta": "See full schedule",
    "examplesNote": "Informative figures for a national-buyer profile, subject to bank approval. See the full schedule on each property.",
```

- [ ] **Step 3: Crear `EjemplosPropiedades.tsx` (server component presentacional)**

Crear `src/components/financiamiento/EjemplosPropiedades.tsx`:

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from '@/lib/icons';
import { formatPrice } from '@/lib/formatters';

export interface EjemploCard {
  slug: string;
  name: string;
  image: string;
  city: string;
  bedrooms: number;
  areaM2: number;
  priceMxn: number;
  enganchePct: number;
  engancheMxn: number;
  mensualidadMxn: number;
}

/** Fail-closed: sin ejemplos válidos la sección no se renderiza. */
export default async function EjemplosPropiedades({ locale, ejemplos }: { locale: string; ejemplos: EjemploCard[] }) {
  if (ejemplos.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'financiamiento' });
  return (
    <section className="py-16 md:py-20 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-2 text-center">{t('examplesTitle')}</h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">{t('examplesSubtitle')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ejemplos.map((e) => (
            <article key={e.slug} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              <div className="relative aspect-[4/3]">
                <Image src={e.image} alt={e.name} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div>
                  <h3 className="text-base font-bold text-[#1A2F3F] leading-snug">{e.name}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {[
                      e.city || null,
                      e.bedrooms > 0 ? t('examplesBedrooms', { n: e.bedrooms }) : null,
                      e.areaM2 > 0 ? `${Math.round(e.areaM2)} m²` : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="text-xl font-bold text-[#1A2F3F] tabular-nums">{formatPrice(e.priceMxn)}</div>
                <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 rounded-lg p-3">
                  <div>
                    <div className="text-2xs text-gray-600 uppercase">{t('examplesDownPayment', { pct: e.enganchePct })}</div>
                    <div className="font-bold text-gray-900 tabular-nums">{formatPrice(e.engancheMxn)}</div>
                  </div>
                  <div>
                    <div className="text-2xs text-gray-600 uppercase">{t('examplesMonthly')}</div>
                    <div className="font-bold text-[#0E7490] tabular-nums">{formatPrice(e.mensualidadMxn)}</div>
                  </div>
                </div>
                <Link
                  href={`/${locale}/propiedades/${e.slug}`}
                  className="mt-auto inline-flex items-center gap-1.5 min-h-[44px] md:min-h-0 text-sm font-semibold text-[#0E7490] hover:underline"
                >
                  {t('examplesCta')} <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="text-xs text-gray-600 text-center mt-6">{t('examplesNote')}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Integrar en `financiamiento/page.tsx`**

En `src/app/[locale]/financiamiento/page.tsx`:

(a) Reemplazar el import de la calculadora vieja (línea 10) y agregar los nuevos:

```tsx
import MortgageCalculator from '@/components/financiamiento/MortgageCalculatorLazy';
```

pasa a:

```tsx
import FinanciamientoSimulator from '@/components/financiamiento/FinanciamientoSimulatorLazy';
import EjemplosPropiedades, { type EjemploCard } from '@/components/financiamiento/EjemplosPropiedades';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUnits } from '@/lib/supabase/queries';
import { pickEjemplosPorTerciles } from '@/lib/financiamiento-ejemplos';
import { mapUnitToProperty, type UnitRow } from '@/lib/mappers/unit-to-property';
import { computeHipotecario } from '@/lib/hipotecario';
```

(b) Dentro de `FinanciamientoPage`, después de la construcción de `methods` (línea ~71), agregar el fetch fail-closed:

```tsx
  // Ejemplos con propiedades reales (fail-closed: cualquier error → sección oculta)
  let ejemplos: EjemploCard[] = [];
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await getUnits(supabase, { orderBy: 'newest', limit: 30 });
    ejemplos = pickEjemplosPorTerciles((data ?? []) as unknown as UnitRow[])
      .map((row) => {
        const p = mapUnitToProperty(row, locale);
        const hip = computeHipotecario(p.price.mxn, 'nacional');
        return {
          slug: p.slug,
          name: p.name,
          image: p.images[0] ?? '',
          city: p.location.city ?? '',
          bedrooms: p.specs.bedrooms || 0,
          areaM2: p.specs.area || 0,
          priceMxn: p.price.mxn,
          enganchePct: hip.enganchePct,
          engancheMxn: hip.enganche,
          mensualidadMxn: Math.round(hip.schedule.cuota),
        };
      })
      .filter((e) => e.priceMxn > 0 && e.image !== '');
  } catch {
    ejemplos = [];
  }
```

(c) En el JSX, reemplazar `<MortgageCalculator />` (línea 133) por:

```tsx
      {/* Simulador hipotecario (perfiles Nac/Ext + corrida) */}
      <FinanciamientoSimulator />

      {/* Ejemplos con propiedades reales (fail-closed) */}
      <EjemplosPropiedades locale={locale} ejemplos={ejemplos} />
```

El resto de la página (hero, BankLogos, methods, tabla, CTAs, JSON-LD, `assertPageVisible`) NO se toca.

- [ ] **Step 5: Verificar tsc + eslint + paridad**

```bash
npx tsc --noEmit
npx eslint "src/app/[locale]/financiamiento/page.tsx" src/components/financiamiento/EjemplosPropiedades.tsx
node -e "const es=require('./src/i18n/messages/es.json'),en=require('./src/i18n/messages/en.json');const k=o=>Object.entries(o).flatMap(([a,b])=>b&&typeof b==='object'?k(b).map(x=>a+'.'+x):[a]);const A=new Set(k(es)),B=new Set(k(en));console.log('es',A.size,'en',B.size);console.log('solo-es',[...A].filter(x=>!B.has(x)));console.log('solo-en',[...B].filter(x=>!A.has(x)));"
```

Expected: tsc 0, eslint 0 errores, paridad OK.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/financiamiento/page.tsx" src/components/financiamiento/EjemplosPropiedades.tsx src/i18n/messages/es.json src/i18n/messages/en.json
git commit -m "feat(financiamiento): seccion ejemplos con propiedades reales + swap a simulador nuevo"
```

---

### Task 5: Borrar calculadora vieja + namespace `mortgageCalc`

**Files:**
- Delete: `src/components/financiamiento/MortgageCalculator.tsx`
- Delete: `src/components/financiamiento/MortgageCalculatorLazy.tsx`
- Modify: `src/i18n/messages/es.json` + `en.json` (remover el namespace `"mortgageCalc"` completo en ambos)

Borrado aprobado por Luis en el spec review (2026-07-23). `mortgageCalc` solo lo usaba `MortgageCalculator.tsx` (verificado por grep).

- [ ] **Step 1: Verificar que no quedan importadores**

```bash
grep -rn "MortgageCalculator" src --include="*.tsx" --include="*.ts" | grep -v "components/financiamiento/MortgageCalculator"
```

Expected: sin resultados (la página ya importa `FinanciamientoSimulatorLazy`).

- [ ] **Step 2: Borrar componentes**

```bash
git rm src/components/financiamiento/MortgageCalculator.tsx src/components/financiamiento/MortgageCalculatorLazy.tsx
```

- [ ] **Step 3: Remover namespace `mortgageCalc` de ambos JSON**

En `src/i18n/messages/es.json` y `src/i18n/messages/en.json`, eliminar el bloque completo `"mortgageCalc": { ... },` (en es.json arranca ~línea 2322 — el rango exacto puede haberse corrido por las keys nuevas; localizarlo con grep).

- [ ] **Step 4: Verificar que nadie usa `mortgageCalc` + tsc + paridad**

```bash
grep -rn "mortgageCalc" src
npx tsc --noEmit
node -e "const es=require('./src/i18n/messages/es.json'),en=require('./src/i18n/messages/en.json');const k=o=>Object.entries(o).flatMap(([a,b])=>b&&typeof b==='object'?k(b).map(x=>a+'.'+x):[a]);const A=new Set(k(es)),B=new Set(k(en));console.log('es',A.size,'en',B.size);console.log('solo-es',[...A].filter(x=>!B.has(x)));console.log('solo-en',[...B].filter(x=>!A.has(x)));"
```

Expected: grep sin resultados; tsc 0; paridad OK.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/messages/es.json src/i18n/messages/en.json
git commit -m "chore(financiamiento): retirar MortgageCalculator viejo + namespace mortgageCalc (sin importadores)"
```

---

### Task 6: Gates finales + verificación visual local

**Files:** ninguno nuevo (solo fixes si un gate falla).

- [ ] **Step 1: Suite unit completa**

```bash
npx vitest run
```

Expected: los 5 tests de `financiamiento-ejemplos` pasan (única suite bajo `src/**`).

- [ ] **Step 2: Build de producción**

```bash
npx next build
```

Expected: exit 0. Si `tsc` pasa pero build falla por `.next/types` stale de un build previo: `rm -rf .next/types` y reintentar.

- [ ] **Step 3: Probe visual local**

```bash
npm run dev
```

Revisar manualmente en el navegador:
1. `http://localhost:3000/es/financiamiento` — simulador: default $4,000,000 nacional → chips 10.5% / 20 años / 20% / MXN; toggle Extranjero → chips 9.5% / 30 años / 35% / USD + aviso cambiario visible; slider y campo de texto mueven la mensualidad; corrida por año renderiza barras + tabla expandible; NO aparecen "intereses totales" ni "total pagado".
2. Sección Ejemplos: hasta 3 cards con foto/precio/enganche/mensualidad, orden precio ascendente, links a `/es/propiedades/<slug>` funcionan. (Si la DB no responde en local, la sección simplemente no aparece — eso es el fail-closed, no un bug.)
3. `http://localhost:3000/en/financiamiento` — mismos bloques en inglés, sin keys crudas (`financiamiento.calc...` visibles = key faltante).
4. Una ficha de unidad (ej. `/es/propiedades/3-recamaras-corner-con-alberca-privada`) → tab Rentabilidad → tabla "Origen de los datos": Periodo muestra "supuesto fijo" y "derivado de los datos anteriores" en vez de "—" (Residencial y Vacacional).

- [ ] **Step 4: Commit de ajustes (solo si los hubo)**

```bash
git add -A && git commit -m "fix(financiamiento): ajustes de verificacion visual"
```

**NO hacer push ni merge a main — eso lo autoriza Luis aparte.**
