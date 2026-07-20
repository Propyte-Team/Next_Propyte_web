# Slice 5 — Financiamiento Interno + timings de interés (Web + Hub) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Light up the **Interno** payment sub-tab (gate `financiamiento_directo`) showing only the developer's Hub-configured schemes (reusing `CorridaFinanciera` + `CorridaCompacta` + `CotizacionBloques`), where each scheme carries an interest **timing** (`al_inicio` / `prorrateado` / `al_final`) that changes the interest/capital shape of its corrida — visible in the bars, never named in the UI.

**Architecture:** The timing lives **per scheme, inside the existing `esquemas_pago` JSONB** (decided 2026-07-20 — NO new DDL; JSONB is schemaless). Web adds two amortization formulas beside the francesa in `calculator.ts`, both keeping the **same monthly payment (cuota)** as the francesa and only redistributing interest vs capital (honors the "solo mensualidad" UI rule). `computeEsquema` picks the formula from `esquema.timing`. The Hub adds a timing `<select>` per scheme row in the existing `PaymentSchemesEditor`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind, Recharts (via `CorridaCompacta`), `@react-pdf/renderer`, next-intl, Supabase JSONB (no schema change).

**Verification model (repo has NO vitest/tsx):** per web task — `tsc --noEmit` + `next build` + SSR probe (folder WITHOUT leading underscore; delete after; `rm -rf .next/types` before tsc). i18n es/en parity via node script. Git author `-c user.email=marketing@propyte.com -c user.name=Propyte-Luis`; explicit paths only; NO push without Luis's OK.

**Amortization model (starter, adjustable — spec §9):** all three timings finance the same principal over the same months at the same nominal rate, share the **same fixed cuota and same total interest** as the francesa, and differ only in how each monthly payment splits interest vs capital:
- **prorrateado** = francesa (`buildAmortizationSchedule`): interest decreasing, capital increasing, balanced.
- **al_inicio** = interest-first: each cuota covers interest until the total interest is exhausted, then pure capital → interest front-loaded, "se pagan primero los intereses, capital al final", balance stays high early then drops.
- **al_final** = capital-first: each cuota covers capital until principal is retired, then pure interest → capital front-loaded, "el interés se concentra al final", balance drops fast early.

---

## File Structure

### Web (`C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades`, branch `feat/unidades-rediseno`)
- **Modify** `src/lib/calculator.ts` — add `TimingIntereses` type + `buildAmortizationScheduleTiming(principal, annualRatePct, months, timing)`.
- **Modify** `src/lib/esquemas-pago.ts` — add `timing?` to `EsquemaPago`; coerce it in `parseEsquemas`; make `computeEsquema` use `buildAmortizationScheduleTiming(..., e.timing ?? 'prorrateado')`.
- **Modify** `src/app/[locale]/propiedades/_components/CorridaFinanciera.tsx` — turn the reserved component into the full **Interno panel** (scheme selector + `CotizacionBloques` + `CorridaCompacta` + PDF), recomputing inversión with the selected scheme's enganche.
- **Modify** `src/app/[locale]/propiedades/_components/EsquemasDePagoTab.tsx` — replace the `interno` placeholder with `<CorridaFinanciera .../>`, passing the reserved `esquemas`/`listPrice` + inversión inputs.
- **Modify** `src/app/api/generate-cotizacion-pdf/route.ts` — add `mode=interno` (re-reads the scheme by id, timing-aware corrida).
- **Modify** `src/i18n/messages/es.json` + `en.json` — interno strings under `esquemas`/`corrida` (NO timing names).

### Hub (existing worktree `C:/Users/Luis/Projects/Propyte/Propyte_hub_preventa`, branch `feat/unidades-preventa-interno-hub`)
- **Modify** `src/lib/esquemas-pago.ts` — add `timing?` to `EsquemaPago` + coerce in `parseEsquemas`.
- **Modify** `src/components/common/fields/PaymentSchemesEditor.tsx` — add a timing `<select>` per scheme row (al inicio / prorrateado / al final).

**No DDL, no v_units change.** The timing rides inside the existing `esquemas_pago` JSONB array elements, merged by the existing `fin_esquemas_pago`.

---

## Shared contract (both repos)
`EsquemaPago` gains one optional field:
```ts
timing?: 'al_inicio' | 'prorrateado' | 'al_final'; // default 'prorrateado'
```

---

# PART 1 — WEB

## Task 1: Two new amortization formulas

**Files:**
- Modify: `src/lib/calculator.ts`

- [ ] **Step 1: Add the type + builder** (place right after `buildAmortizationSchedule`)

```ts
export type TimingIntereses = 'al_inicio' | 'prorrateado' | 'al_final';

/**
 * Corrida con timing de intereses (starter, ajustable — spec §9).
 * Las tres comparten la MISMA cuota y el MISMO total de intereses que la francesa;
 * solo cambia cómo cada mensualidad reparte interés vs capital.
 *  - prorrateado: francesa (interés decreciente, capital creciente).
 *  - al_inicio: interés primero (cada cuota cubre interés hasta agotarlo, luego capital).
 *  - al_final: capital primero (cada cuota cubre capital hasta liquidarlo, luego interés).
 */
export function buildAmortizationScheduleTiming(
  principal: number,
  annualRatePct: number,
  months: number,
  timing: TimingIntereses,
): AmortSchedule {
  const base = buildAmortizationSchedule(principal, annualRatePct, months);
  if (timing === 'prorrateado' || !base.tieneInteres || base.rows.length === 0) {
    return base;
  }
  const n = base.rows.length;
  const cuota = base.cuota;
  const p = Math.max(0, Number(principal) || 0);
  // Ancla el total de intereses al de la francesa para que las tres cuesten igual.
  const totalInteres = Math.max(0, base.totalPagado - p);

  const rows: AmortRow[] = [];
  let remInteres = totalInteres;
  let remCapital = p;

  for (let m = 1; m <= n; m++) {
    const last = m === n;
    let interes: number;
    let capital: number;

    if (timing === 'al_inicio') {
      // interés primero
      interes = last ? remInteres : Math.min(remInteres, cuota);
      capital = Math.min(remCapital, cuota - interes);
      if (last) capital = remCapital; // el último salda el capital restante
    } else {
      // al_final: capital primero
      capital = last ? remCapital : Math.min(remCapital, cuota);
      interes = Math.min(remInteres, cuota - capital);
      if (last) interes = remInteres; // el último salda el interés restante
    }

    remInteres = Math.max(0, remInteres - interes);
    remCapital = Math.max(0, remCapital - capital);
    rows.push({
      mes: m,
      cuota: Math.round(interes + capital),
      interes: Math.round(interes),
      capital: Math.round(capital),
      saldo: Math.round(remCapital),
    });
  }

  return {
    rows,
    cuota,
    totalIntereses: totalInteres,
    totalPagado: base.totalPagado,
    tieneInteres: true,
    principal: p,
  };
}
```
> Confirm `AmortRow`/`AmortSchedule` field names by reading the existing `buildAmortizationSchedule` in the same file (fields: `mes, cuota, interes, capital, saldo` on rows; `rows, cuota, totalIntereses, totalPagado, tieneInteres, principal` on schedule). Use the exact names.

- [ ] **Step 2: Probe-verify math** (deferred to Task 3's probe page which imports this — or a standalone probe here). Expected for `buildAmortizationScheduleTiming(1_000_000, 10, 120, timing)` (francesa cuota ≈ 13,215; totalInteres ≈ 585,800):
  - `al_inicio`: `rows[0].interes` ≈ 13,215 (≈ full cuota, interest-first), `rows[0].capital` ≈ 0, `rows[0].saldo` ≈ 1,000,000; last rows all capital; last `saldo` = 0; sum(interes) ≈ totalInteres; sum(capital) = principal.
  - `al_final`: `rows[0].capital` ≈ 13,215 (capital-first), `rows[0].interes` ≈ 0, saldo drops immediately; final rows all interest; last `saldo` = 0.
  - `prorrateado`: identical to `buildAmortizationSchedule`.

- [ ] **Step 3: tsc + commit**
```bash
cd C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades
rm -rf .next/types && ./node_modules/.bin/tsc --noEmit
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis add src/lib/calculator.ts
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(unidades): fórmulas de amortización al_inicio/al_final (timing de intereses)"
```

---

## Task 2: `EsquemaPago.timing` + timing-aware `computeEsquema` (web)

**Files:**
- Modify: `src/lib/esquemas-pago.ts`

- [ ] **Step 1: Add `timing` to the type**
```ts
export interface EsquemaPago {
  id: string;
  label: string;
  enganche_pct: number;
  meses: number;
  tasa: number;
  descuento_pct: number;
  orden: number;
  destacado?: boolean;
  timing?: import('./calculator').TimingIntereses; // default 'prorrateado'
}
```

- [ ] **Step 2: Coerce `timing` in `parseEsquemas`** (add inside the `.map`)
```ts
      timing:
        x.timing === 'al_inicio' || x.timing === 'al_final' || x.timing === 'prorrateado'
          ? x.timing
          : 'prorrateado',
```

- [ ] **Step 3: Use the timing-aware builder in `computeEsquema`**
Replace the import and the schedule line:
```ts
import { buildAmortizationSchedule, buildAmortizationScheduleTiming, type AmortSchedule } from './calculator';
```
```ts
  const schedule = esContado
    ? null
    : buildAmortizationScheduleTiming(financiado, e.tasa || 0, e.meses, e.timing ?? 'prorrateado');
```
(everything else in `computeEsquema` unchanged.)

- [ ] **Step 4: tsc + commit**
```bash
cd C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades
rm -rf .next/types && ./node_modules/.bin/tsc --noEmit
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis add src/lib/esquemas-pago.ts
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(unidades): esquema.timing → computeEsquema elige la fórmula de amortización"
```

---

## Task 3: Interno panel (enhance CorridaFinanciera) + wiring + i18n

**Files:**
- Modify: `src/app/[locale]/propiedades/_components/CorridaFinanciera.tsx`
- Modify: `src/app/[locale]/propiedades/_components/EsquemasDePagoTab.tsx`
- Modify: `src/i18n/messages/es.json` + `en.json`
- Test (temp): `src/app/interno-probe/page.tsx`

- [ ] **Step 1: Add i18n strings under `esquemas` (es + en, NO timing names)**
es.json:
```jsonc
"internoTitle": "Financiamiento del desarrollador",
"internoSubtitle": "Planes de pago directos con el desarrollador."
```
en.json:
```jsonc
"internoTitle": "Developer financing",
"internoSubtitle": "Direct payment plans with the developer."
```
(The scheme selector / price / corrida strings already exist in the `corrida` namespace: `scheme`, `listPrice`, `effectivePrice`, `savings`, `cash`, `downPayment`, `financedAmount`, `disclaimer`, etc. Reuse them. Do NOT add any string that names a timing option.)

- [ ] **Step 2: Rewrite `CorridaFinanciera.tsx` as the full Interno panel**

```tsx
'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { computeEsquema, type EsquemaPago } from '@/lib/esquemas-pago';
import { computeInversionInicial, type Nacionalidad, type NivelAcabado } from '@/lib/inversion-inicial';
import { formatPrice } from '@/lib/formatters';
import CorridaCompacta from './esquemas/CorridaCompacta';
import CotizacionBloques, { type Bloque3Data } from './esquemas/CotizacionBloques';

interface CorridaFinancieraProps {
  listPrice: number;
  esquemas: EsquemaPago[];
  priceOriginal: number;
  nacionalidad: Nacionalidad;
  m2: number;
  city: string;
  zone: string | null;
  tipoEntrega: string | null;
  mobiliarioNivel: NivelAcabado;
  decoracionNivel: NivelAcabado;
  slug: string;
  locale: string;
}

export default function CorridaFinanciera({
  listPrice,
  esquemas,
  priceOriginal,
  nacionalidad,
  m2,
  city,
  zone,
  tipoEntrega,
  mobiliarioNivel,
  decoracionNivel,
  slug,
  locale,
}: CorridaFinancieraProps) {
  const t = useTranslations('corrida');
  const tE = useTranslations('esquemas');
  const ordered = useMemo(() => [...esquemas].sort((a, b) => a.orden - b.orden), [esquemas]);
  const [selId, setSelId] = useState(ordered.find((e) => e.destacado)?.id ?? ordered[0]?.id);

  const activo = useMemo(() => {
    const e = ordered.find((x) => x.id === selId) ?? ordered[0];
    return e ? computeEsquema(listPrice, e) : null;
  }, [listPrice, selId, ordered]);

  const inversion = useMemo(
    () =>
      activo
        ? computeInversionInicial({
            price: activo.precioEfectivo,
            engancheMxn: activo.enganche,
            nacionalidad,
            m2,
            city,
            zone,
            tipoEntrega,
            mobiliarioNivel,
            decoracionNivel,
          })
        : null,
    [activo, nacionalidad, m2, city, zone, tipoEntrega, mobiliarioNivel, decoracionNivel],
  );

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const handlePdf = useCallback(async () => {
    if (!activo) return;
    setPdfLoading(true);
    setPdfError(false);
    try {
      const qs = new URLSearchParams({
        slug,
        locale,
        mode: 'interno',
        esquema: activo.esquema.id,
        perfil: nacionalidad,
        mob: mobiliarioNivel,
        dec: decoracionNivel,
      });
      const res = await fetch('/api/generate-cotizacion-pdf?' + qs.toString());
      if (!res.ok) throw new Error('pdf');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-interno-${slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setPdfError(true);
    } finally {
      setPdfLoading(false);
    }
  }, [activo, slug, locale, nacionalidad, mobiliarioNivel, decoracionNivel]);

  if (ordered.length === 0 || !activo || !inversion) return null;

  const bloque3: Bloque3Data | null = activo.esContado
    ? null
    : {
        saldo: activo.financiado,
        mensualidades: activo.schedule!.rows.length,
        interesPct: activo.esquema.tasa,
        mensualidad: activo.schedule!.cuota,
      };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-[#2C2C2C]">{tE('internoTitle')}</h3>
        <p className="text-xs text-gray-600">{tE('internoSubtitle')}</p>
      </div>

      {ordered.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('scheme')}</label>
          <div className="flex flex-wrap gap-2">
            {ordered.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setSelId(e.id)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  selId === e.id
                    ? 'bg-propyte-brand text-[#0F1923] border-propyte-brand'
                    : 'border-gray-200 hover:border-propyte-brand text-gray-700'
                }`}
              >
                {e.destacado && '★ '}
                {e.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <CotizacionBloques
        precio={priceOriginal}
        descuentoPct={activo.esquema.descuento_pct}
        precioVenta={activo.precioEfectivo}
        inversion={inversion}
        bloque3={bloque3}
      />

      {activo.esContado ? (
        <div className="rounded-2xl p-6 bg-[#0F1923] text-white">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{t('cash')}</div>
          <div className="text-3xl font-extrabold text-propyte-brand">{formatPrice(activo.precioEfectivo)}</div>
          {activo.ahorro > 0 && (
            <div className="text-sm text-gray-400 mt-2">
              {t('savings')}: {formatPrice(activo.ahorro)}
            </div>
          )}
        </div>
      ) : (
        <CorridaCompacta schedule={activo.schedule!} currency="MXN" />
      )}

      {!activo.esContado && (
        <div>
          <button
            type="button"
            onClick={handlePdf}
            disabled={pdfLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F1923] px-4 py-2 text-2xs font-semibold text-white hover:bg-[#1A2F3F] disabled:opacity-60"
          >
            {pdfLoading ? tE('generandoPdf') : tE('descargarCotizacion')}
          </button>
          {pdfError && <p className="mt-2 text-2xs text-red-600">{tE('pdfError')}</p>}
        </div>
      )}
    </div>
  );
}
```
> Read `HipotecarioCalculator.tsx` first and match its exact accent tokens / button styling (repo uses `propyte-brand`, `#0F1923`, `#0E7490`; NOT `brand-*`) and its `descargarCotizacion`/`generandoPdf`/`pdfError` i18n keys. Confirm `CotizacionBloques` accepts `bloque3: Bloque3Data | null` (it renders a placeholder when null — fine for the esContado cash case where we hide it anyway).

- [ ] **Step 3: Wire the Interno branch in `EsquemasDePagoTab.tsx`**
- Import: `import CorridaFinanciera from './CorridaFinanciera';`
- The tab already declares reserved props `esquemas: EsquemaPago[]` and `listPrice: number` (and `directo`). Destructure them if not already.
- Replace the interno branch `panel: placeholder(t('internoSoon'))` with:
```tsx
if (directo) {
  items.push({
    id: 'interno',
    label: t('tabInterno'),
    icon: <CreditCard size={16} />,
    panel: (
      <CorridaFinanciera
        listPrice={listPrice}
        esquemas={esquemas}
        priceOriginal={priceOriginal}
        nacionalidad={nacionalidad}
        m2={m2}
        city={city}
        zone={zone}
        tipoEntrega={tipoEntrega}
        mobiliarioNivel={mobiliarioNivel}
        decoracionNivel={decoracionNivel}
        slug={slug}
        locale={locale}
      />
    ),
  });
}
```
Use the exact shared state names (`nacionalidad`, `mobiliarioNivel`, `decoracionNivel`) and confirm `CreditCard` is imported (it was, for the placeholder). `esquemas`/`listPrice` come from `UnitDetailPage` already (reserved props) — no `UnitDetailPage` change needed.

- [ ] **Step 4: SSR probe** (`Tabs` renders only active panel). Create `src/app/interno-probe/page.tsx`:
```tsx
import { buildAmortizationScheduleTiming } from '@/lib/calculator';
export const dynamic = 'force-dynamic';
export default function InternoProbe() {
  const mk = (timing: 'al_inicio' | 'prorrateado' | 'al_final') => {
    const s = buildAmortizationScheduleTiming(1_000_000, 10, 120, timing);
    const sumI = s.rows.reduce((a, r) => a + r.interes, 0);
    const sumC = s.rows.reduce((a, r) => a + r.capital, 0);
    return { timing, cuota: Math.round(s.cuota), r0i: s.rows[0].interes, r0c: s.rows[0].capital, r0saldo: s.rows[0].saldo, lastSaldo: s.rows[s.rows.length - 1].saldo, sumI, sumC };
  };
  return <pre id="probe">{JSON.stringify([mk('prorrateado'), mk('al_inicio'), mk('al_final')], null, 2)}</pre>;
}
```

- [ ] **Step 5: build + probe + verify shapes**
```bash
cd C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades
./node_modules/.bin/next build
# standalone server on a free port, then:
curl -s http://localhost:3100/interno-probe
```
Expected: all three same `cuota`; `al_inicio` has `r0i ≈ cuota` and `r0c ≈ 0` and `r0saldo ≈ 1000000`; `al_final` has `r0c ≈ cuota` and `r0i ≈ 0`; every timing `lastSaldo === 0`; every timing `sumC ≈ 1000000` and `sumI` roughly equal across the three (±rounding).

- [ ] **Step 6: cleanup + parity + tsc**
```bash
rm -rf src/app/interno-probe && rm -rf .next/types
./node_modules/.bin/tsc --noEmit
node -e "for (const ns of ['esquemas','corrida']){const es=require('./src/i18n/messages/es.json')[ns],en=require('./src/i18n/messages/en.json')[ns];const a=Object.keys(es),b=Object.keys(en);const m=a.filter(k=>!(k in en)).concat(b.filter(k=>!(k in es)));console.log(ns, m.length?('MISMATCH '+m):'OK')}"
```
Expected: tsc clean, parity OK.

- [ ] **Step 7: commit**
```bash
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis add \
  "src/app/[locale]/propiedades/_components/CorridaFinanciera.tsx" \
  "src/app/[locale]/propiedades/_components/EsquemasDePagoTab.tsx" \
  src/i18n/messages/es.json src/i18n/messages/en.json
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(unidades): sub-pestaña Interno (esquemas del Hub + timing en barras, sin nombrar la opción)"
```

---

## Task 4: PDF `mode=interno`

**Files:**
- Modify: `src/app/api/generate-cotizacion-pdf/route.ts`

- [ ] **Step 1: Add the interno branch** (mirror the existing hipotecario/preventa branches)
Parse `mode` (already parses 'preventa'; extend to accept `'interno'`) and `const esquemaId = url.searchParams.get('esquema');`. When `mode === 'interno'`:
```ts
import { computeEsquema } from '@/lib/esquemas-pago';
// ...
const esquema = (property.financing.esquemas ?? []).find((e) => e.id === esquemaId);
if (!esquema) return new Response('esquema not found', { status: 404 });
const computed = computeEsquema(property.priceOriginal ?? property.price.mxn, esquema);
const inversion = computeInversionInicial({
  price: computed.precioEfectivo,
  engancheMxn: computed.enganche,
  nacionalidad: perfil,
  m2: property.specs.area,
  city: property.location.city,
  zone: property.location.zone,
  tipoEntrega: property.specs.tipoEntrega ?? null,
  mobiliarioNivel: mob,
  decoracionNivel: dec,
});
const annual = computed.esContado ? [] : aggregateByYear(computed.schedule!.rows);
```
Then build `CotizacionPDFData` with `preventa: null`, block-1 `precio: property.priceOriginal ?? property.price.mxn`, `descuentoPct: esquema.descuento_pct`, `precioVenta: computed.precioEfectivo`; block-2 from `inversion` (`enganche: computed.enganche`, `enganchePct: esquema.enganche_pct`); block-3 `saldo: computed.financiado`, `mensualidades: computed.schedule?.rows.length ?? 0`, `interesPct: esquema.tasa`, `mensualidad: computed.schedule?.cuota ?? 0`, `totalIntereses: computed.schedule?.totalIntereses ?? 0`, `totalPagado: computed.schedule?.totalPagado ?? 0`, `tieneInteres: computed.schedule?.tieneInteres ?? false`, `annual`. Reuse the existing `labels` build (no preventa labels needed; the timing is NOT named in the PDF either — it only shows in the per-year corrida numbers).
> The timing already shaped `computed.schedule` via `computeEsquema` → `buildAmortizationScheduleTiming`, so `aggregateByYear` reflects it automatically. No PDF-document change needed (reuses the 3-block + annual layout).

- [ ] **Step 2: build + PDF smoke** (need a `financiamiento_directo` unit slug — ASK Luis if unknown; do NOT invent)
```bash
cd C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades
rm -rf .next/types && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/next build
# with a real directo unit slug + a real scheme id:
curl -s -o /tmp/interno.pdf -w "%{http_code} %{content_type} %{size_download}\n" "http://localhost:3100/api/generate-cotizacion-pdf?slug=<DIRECTO_SLUG>&mode=interno&esquema=<SCHEME_ID>&perfil=nacional&locale=es"
```
Expected: 200 application/pdf, non-empty. If no directo unit/scheme exists in data, report that the runtime smoke needs a fixture and confirm the branch compiles.

- [ ] **Step 3: commit**
```bash
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis add src/app/api/generate-cotizacion-pdf/route.ts
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(unidades): PDF de cotización interno (esquema del Hub + corrida timing)"
```

---

## Task 5: Web gate + report

- [ ] **Step 1: full green gate**
```bash
cd C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades
rm -rf .next/types && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/next build
node -e "for (const ns of ['esquemas','corrida','cotizacionPdf']){const es=require('./src/i18n/messages/es.json')[ns],en=require('./src/i18n/messages/en.json')[ns];const a=Object.keys(es),b=Object.keys(en);const m=a.filter(k=>!(k in en)).concat(b.filter(k=>!(k in es)));console.log(ns, m.length?('MISMATCH '+m):'OK')}"
```
- [ ] **Step 2: report web half to Luis. NO push without OK.**

---

# PART 2 — HUB (same worktree, NO DDL)

## Task 6: `EsquemaPago.timing` (Hub)

**Files:**
- Modify: `src/lib/esquemas-pago.ts` (Hub)

- [ ] **Step 1: Add `timing` to the Hub `EsquemaPago` + coerce in the Hub `parseEsquemas`**
Add field:
```ts
  timing?: 'al_inicio' | 'prorrateado' | 'al_final'; // default 'prorrateado'
```
Coerce in `parseEsquemas` map (mirror the web coercion):
```ts
      timing:
        x.timing === 'al_inicio' || x.timing === 'al_final' || x.timing === 'prorrateado'
          ? x.timing
          : 'prorrateado',
```
> The Hub uses its OWN `'al_inicio'|'prorrateado'|'al_final'` string-literal type (do NOT import from a web calculator — the Hub has no `calculator.ts`). `computeEsquemaMontos` needs NO change (it only previews montos, not the full corrida).

- [ ] **Step 2: tsc + build + commit**
```bash
cd C:/Users/Luis/Projects/Propyte/Propyte_hub_preventa
rm -rf .next/types && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/next build
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis add src/lib/esquemas-pago.ts
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(hub): esquema.timing en el tipo + parseEsquemas (sin DDL, JSONB)"
```
(tsc clean except the 2 known pre-existing `tests/hub-to-zoho-mapper.test.ts` errors.)

---

## Task 7: timing selector in `PaymentSchemesEditor` (Hub)

**Files:**
- Modify: `src/components/common/fields/PaymentSchemesEditor.tsx`

- [ ] **Step 1: Add a timing `<select>` per scheme row**
Read the file first. Each row already has inputs for label / enganche_pct / meses / tasa / descuento_pct / destacado, updated via the existing `update(i, patch)` helper. Add a `<select>` bound to `e.timing ?? 'prorrateado'` writing `update(i, { timing: value })`:
```tsx
<label className="block text-xs">
  <span className="text-gray-500">Timing de intereses</span>
  <select
    value={e.timing ?? 'prorrateado'}
    onChange={(ev) => update(i, { timing: ev.target.value as 'al_inicio' | 'prorrateado' | 'al_final' })}
    className="mt-1 w-full rounded border px-2 py-1"
  >
    <option value="prorrateado">Prorrateado (francesa)</option>
    <option value="al_inicio">Al inicio</option>
    <option value="al_final">Al final</option>
  </select>
</label>
```
> Match the exact row layout / input classes already in `PaymentSchemesEditor.tsx` (grid columns, label style). The `EsquemaPago` type already includes `timing?` (Task 6), so `update(i, {timing})` type-checks. The value persists inside the `esquemas_pago` JSONB array via the existing `setValue` → `/api/record` PATCH — no DDL, no API change.

- [ ] **Step 2: tsc + build + commit**
```bash
cd C:/Users/Luis/Projects/Propyte/Propyte_hub_preventa
rm -rf .next/types && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/next build
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis add src/components/common/fields/PaymentSchemesEditor.tsx
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(hub): selector de timing de intereses por esquema de pago"
```

- [ ] **Step 3: (optional) end-to-end check** — set a `timing` on a scheme of a directo development via the Hub editor (or a scratch SQL update on `esquemas_pago`), confirm the web Interno tab's bars change shape. Luis does the click-through; provide the slug + which scheme.

---

## Self-Review (against spec §4.4, §5 timing, §6.2, §7 item 5, §9 decision)

- **§4.4 Interno muestra solo opciones del Hub (sin barras ajustables), reusando corridas:** Task 3 (CorridaFinanciera lists Hub esquemas, no adjustable bars, reuses computeEsquema + CorridaCompacta + CotizacionBloques). ✓
- **§4.4 / §5 timing (al inicio / prorrateado / al final), decidido en Hub, web NO nombra la opción:** Hub selector Task 7; web reads `esquema.timing` and shows it only via the corrida bars — no timing string in any web/PDF copy. ✓
- **§4.4 2 fórmulas nuevas además de la francesa, en calculator.ts:** Task 1 (`buildAmortizationScheduleTiming`: al_inicio, al_final; prorrateado = existing francesa). ✓
- **§4.4 mecánicas: al_inicio interés primero/capital al final; al_final capital primero/interés al final:** implemented exactly. ✓
- **§9 decisión "timing por esquema vs desarrollo":** resolved per-scheme (inside esquemas_pago JSONB) — documented; NO DDL. ✓
- **§6.2 PDF para todos los esquemas:** Task 4 (`mode=interno`, timing-aware corrida). ✓
- **§7 item 5 aceptación (3 mecánicas producen corridas distintas visibles en barras; web no nombra la opción):** Task 1 probe + Task 3 rendering. ✓
- **Reuse mandate (CorridaFinanciera + CorridaCompacta):** CorridaFinanciera finally used (was reserved); no duplicate corrida renderer. ✓
- **Placeholder scan:** no TBD/TODO; style-token/real-signature confirmation delegated to the executing agent (flagged, not silent). PDF interno smoke needs a directo fixture — flagged to ask Luis, not invent.
- **Type consistency:** `TimingIntereses` (web) and the Hub string-literal are the same 3 values; `EsquemaPago.timing` optional in both; `computeEsquema`/`buildAmortizationScheduleTiming` signatures stable.

## Notes / deferred
- Amortization curve is a defensible **starter** (spec §9 "arranque puesto, se ajustan después"); the same-cuota / same-total-interest / redistribute-split model can be refined later without touching the Interno tab or the Hub editor.
- Interno is developer financing in MXN — no Nacional/Extranjero rate toggle (that's Hipotecario-only); the shared nacionalidad still affects escrituración in the inversión block, consistent with the other tabs.
- Contraentrega-vía-interno in Preventa (Slice 4) currently uses the francesa; it can later adopt a per-development interno timing if desired (out of scope here).
