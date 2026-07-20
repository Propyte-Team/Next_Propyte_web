# Slice 4 — Preventa (Hub + Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a working **Preventa** payment sub-tab to the Unit page (gated by `stage==='preventa'`) with a Hub-configured fixed plan (Mode A) or an adjustable fallback (Mode B), where the contraentrega balance generates a corrida via Hipotecario or Interno; plus a Hub JSONB config (development + unit override) with editor, and a Preventa PDF.

**Architecture:** Mirror the `esquemas_pago` end-to-end pattern. **Web-first** — Mode B works standalone before any Hub/DDL exists; Mode A lights up once the Hub `preventa` JSONB + `fin_preventa` view column land. Both modes build a single `PreventaConfig` and run it through one pure `computePreventa()` + `buildContraentregaSchedule()`, then reuse `CotizacionBloques` + `CorridaCompacta` + the cotización PDF endpoint. Hub half runs in an **isolated new worktree** off `origin/main`; DDL to prod is **additive and gated on explicit authorization**.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind, Recharts (via existing `CorridaCompacta`), `@react-pdf/renderer`, next-intl, Supabase (`oaijxdpevakashxshhvm`, schema `real_estate_hub`).

**Verification model (repo has NO vitest/tsx):** each web task's gate is `tsc --noEmit` + `next build` + (where UI/logic added) an **SSR probe page in a folder WITHOUT a leading underscore** (App Router treats `_`-prefixed folders as private → 404; and `Tabs` renders only the active panel, so charts/panels are invisible to a plain SSR of the real page). Delete the probe after. `next build` of a probe leaves `.next/types` stale → `rm -rf .next/types` before `tsc`. **i18n es/en parity is mandatory** — validated by a node script per namespace. Git author on every commit: `-c user.email=marketing@propyte.com -c user.name=Propyte-Luis`; stage **explicit paths only** (never `git add -A`). NO push without Luis's OK.

---

## File Structure

### Web (`C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades`, branch `feat/unidades-rediseno`)
- **Create** `src/lib/preventa.ts` — `PreventaConfig`/`PreventaComputed` types, `parsePreventa`, `computePreventa`, `buildContraentregaSchedule`. Pure, no React.
- **Create** `src/app/[locale]/propiedades/_components/esquemas/PreventaCalculator.tsx` — the panel (Mode A locked plan / Mode B adjustable bars + contraentrega corrida + PDF button).
- **Modify** `src/app/[locale]/propiedades/_components/EsquemasDePagoTab.tsx` — replace the Preventa `placeholder(...)` with `<PreventaCalculator .../>`; thread new props.
- **Modify** `src/types/property.ts` — add `preventa?: PreventaConfig | null` to `PropertyFinancing`.
- **Modify** `src/lib/mappers/unit-to-property.ts` — populate `financing.preventa` from `parsePreventa((row as UnitRow).fin_preventa)` (tolerant; column may not exist yet).
- **Modify** `src/app/[locale]/propiedades/_components/UnitDetailPage.tsx` — pass `preventa`, `interestRateInterno`, `mesesInterno`, `m2`, `city`, `zone`, `tipoEntrega` (some already passed) to `EsquemasDePagoTab`.
- **Modify** `src/lib/pdf/CotizacionPDFDocument.tsx` — add optional `preventa` section to `CotizacionPDFData`/`CotizacionPDFLabels` and render it.
- **Modify** `src/app/api/generate-cotizacion-pdf/route.ts` — accept `mode=preventa` + preventa plan params; build the preventa `CotizacionPDFData`.
- **Modify** `src/i18n/messages/es.json` + `en.json` — add Preventa keys under `esquemas` (and reuse `corrida`/`cotizacionPdf`).

### Hub (new worktree `C:/Users/Luis/Projects/Propyte/Propyte_hub_preventa`, branch `feat/unidades-preventa-interno-hub` off `origin/main`)
- **Create** `src/lib/preventa.ts` — `PreventaConfig` type + `parsePreventa` (mirror web) + a small `computePreventaPreview` for the editor.
- **Create** `src/components/common/fields/PreventaEditor.tsx` — repeatable-fields editor (single config object, not an array).
- **Modify** `src/components/common/FieldEditor.tsx` — add `"preventa"` to `FieldType` union + a renderer branch.
- **Modify** `src/lib/fields-config.ts` — register `preventa` in `DEVELOPMENT_FIELDS`; add `"preventa"` to the unit `__financing` composite `extraKeys`; surface in `FinancingSection`.
- **Modify** `src/components/common/fields/FinancingSection.tsx` — inherit/override for `preventa` (same `financiamiento_propio` toggle as `esquemas_pago`).
- **Modify** `src/app/(dashboard)/unidades/[id]/page.tsx` — add `fin_preventa` to the `v_units` select + parse into `inheritedFinancing`.
- **Create** `docs/superpowers/plans/2026-07-20-slice4-preventa-DDL.sql` — additive DDL (applied only after authorization).

---

## Shared data contract (identical in both repos)

```ts
export type ContraentregaVia = 'hipotecario' | 'interno';

export interface PreventaConfig {
  enganche_inicial_pct: number;    // % a la firma
  enganche_diferido_pct: number;   // % de enganche diferido (0 = enganche en 1 sola exhibición)
  enganche_diferido_meses: number; // meses para pagar el diferido (0 si no aplica)
  obra_pct: number;                // % pagado en cuotas mensuales durante obra
  obra_meses: number;              // número de cuotas durante obra
  contraentrega_pct: number;       // % a liquidar en contraentrega (genera corrida)
  contraentrega_via: ContraentregaVia;
}
```
Invariant (soft, editor warns; parser tolerates): `enganche_inicial_pct + enganche_diferido_pct + obra_pct + contraentrega_pct == 100`. All percentages are of **precio de venta con descuento** (`price`). Storage: `preventa jsonb` on `Propyte_desarrollos` + `Propyte_unidades`; effective value merged in `v_units.fin_preventa`.

---

# PART 1 — WEB (standalone; Mode B fully functional, Mode A ready)

## Task 1: Pure Preventa library

**Files:**
- Create: `src/lib/preventa.ts`

- [ ] **Step 1: Write the library**

```ts
// src/lib/preventa.ts
import { buildAmortizationSchedule, type AmortSchedule } from './calculator';

export type ContraentregaVia = 'hipotecario' | 'interno';

export interface PreventaConfig {
  enganche_inicial_pct: number;
  enganche_diferido_pct: number;
  enganche_diferido_meses: number;
  obra_pct: number;
  obra_meses: number;
  contraentrega_pct: number;
  contraentrega_via: ContraentregaVia;
}

export interface PreventaComputed {
  precioVenta: number;
  engancheInicial: number;
  engancheInicialPct: number;
  engancheDiferido: number;
  engancheDiferidoPct: number;
  engancheDiferidoMeses: number;
  engancheDiferidoMensual: number;
  obra: number;
  obraPct: number;
  obraMeses: number;
  obraMensual: number;
  contraentrega: number;
  contraentregaPct: number;
  contraentregaVia: ContraentregaVia;
  sumaPct: number;
  balanceado: boolean;
}

const VIAS: ContraentregaVia[] = ['hipotecario', 'interno'];

/** Tolerant reader for the Hub JSONB config. Returns null when unconfigured → Mode B. */
export function parsePreventa(raw: unknown): PreventaConfig | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const x = raw as Record<string, unknown>;
  const via = VIAS.includes(x.contraentrega_via as ContraentregaVia)
    ? (x.contraentrega_via as ContraentregaVia)
    : 'hipotecario';
  const cfg: PreventaConfig = {
    enganche_inicial_pct: Number(x.enganche_inicial_pct) || 0,
    enganche_diferido_pct: Number(x.enganche_diferido_pct) || 0,
    enganche_diferido_meses: Number(x.enganche_diferido_meses) || 0,
    obra_pct: Number(x.obra_pct) || 0,
    obra_meses: Number(x.obra_meses) || 0,
    contraentrega_pct: Number(x.contraentrega_pct) || 0,
    contraentrega_via: via,
  };
  const total =
    cfg.enganche_inicial_pct + cfg.enganche_diferido_pct + cfg.obra_pct + cfg.contraentrega_pct;
  if (total <= 0) return null; // objeto vacío/basura → sin configurar
  return cfg;
}

export function computePreventa(precioVenta: number, cfg: PreventaConfig): PreventaComputed {
  const pct = (p: number) => Math.round((precioVenta * p) / 100);
  const engancheInicial = pct(cfg.enganche_inicial_pct);
  const engancheDiferido = pct(cfg.enganche_diferido_pct);
  const obra = pct(cfg.obra_pct);
  const contraentrega = pct(cfg.contraentrega_pct);
  const sumaPct =
    cfg.enganche_inicial_pct + cfg.enganche_diferido_pct + cfg.obra_pct + cfg.contraentrega_pct;
  return {
    precioVenta,
    engancheInicial,
    engancheInicialPct: cfg.enganche_inicial_pct,
    engancheDiferido,
    engancheDiferidoPct: cfg.enganche_diferido_pct,
    engancheDiferidoMeses: cfg.enganche_diferido_meses,
    engancheDiferidoMensual:
      cfg.enganche_diferido_meses > 0 ? Math.round(engancheDiferido / cfg.enganche_diferido_meses) : 0,
    obra,
    obraPct: cfg.obra_pct,
    obraMeses: cfg.obra_meses,
    obraMensual: cfg.obra_meses > 0 ? Math.round(obra / cfg.obra_meses) : 0,
    contraentrega,
    contraentregaPct: cfg.contraentrega_pct,
    contraentregaVia: cfg.contraentrega_via,
    sumaPct,
    balanceado: Math.abs(sumaPct - 100) < 0.01,
  };
}

/** El saldo de contraentrega se financia completo (el enganche ya ocurrió en preventa). */
export function buildContraentregaSchedule(
  contraentrega: number,
  via: ContraentregaVia,
  opts: {
    tasaHipotecarioPct: number;
    mesesHipotecario: number;
    tasaInternoPct: number;
    mesesInterno: number;
  },
): AmortSchedule {
  if (via === 'interno') {
    return buildAmortizationSchedule(contraentrega, opts.tasaInternoPct, opts.mesesInterno);
  }
  return buildAmortizationSchedule(contraentrega, opts.tasaHipotecarioPct, opts.mesesHipotecario);
}
```

- [ ] **Step 2: Sanity-check the math via SSR probe**

Verification for pure functions is folded into the Task 3 probe page (`app/preventa-probe/page.tsx`), which imports these functions and prints known outputs. Hand-computed expectation for `computePreventa(4_000_000, { enganche_inicial_pct:10, enganche_diferido_pct:10, enganche_diferido_meses:6, obra_pct:20, obra_meses:24, contraentrega_pct:60, contraentrega_via:'hipotecario' })`:
- engancheInicial = 400,000 · engancheDiferido = 400,000 · engancheDiferidoMensual = 66,667
- obra = 800,000 · obraMensual = 33,333 · contraentrega = 2,400,000 · sumaPct = 100 · balanceado = true

- [ ] **Step 3: `tsc` + commit**

```bash
cd C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades
rm -rf .next/types && ./node_modules/.bin/tsc --noEmit
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis add src/lib/preventa.ts
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(unidades): lib preventa (parse + compute + corrida contraentrega)"
```
Expected: `tsc` clean.

---

## Task 2: i18n strings (es + en parity)

**Files:**
- Modify: `src/i18n/messages/es.json` (namespace `esquemas`, ~line 946–988)
- Modify: `src/i18n/messages/en.json` (same block)

- [ ] **Step 1: Add keys under `esquemas` in es.json** (place next to existing `tabPreventa`/`preventaSoon`; keep `preventaSoon` — still used until Task 3 lands, then it becomes unused, safe to leave)

```jsonc
// inside "esquemas": { ... }
"preventaTitle": "Plan de preventa",
"preventaSubtitleA": "Plan configurado por el desarrollador.",
"preventaSubtitleB": "Ajusta cómo pagar tu preventa.",
"preventaEngancheInicial": "Enganche inicial",
"preventaEngancheDiferido": "Enganche diferido",
"preventaEngancheDiferidoNota": "{monto} al mes · {meses} meses",
"preventaObra": "Pagos durante obra",
"preventaObraNota": "{monto} al mes · {meses} cuotas",
"preventaContraentrega": "Contraentrega",
"preventaContraentregaVia": "Contraentrega se financia con",
"preventaViaHipotecario": "Crédito hipotecario",
"preventaViaInterno": "Financiamiento del desarrollador",
"preventaTotalPreEntrega": "Total antes de entrega",
"preventaSumaAviso": "Los porcentajes suman {suma}%. Ajusta para llegar a 100%.",
"preventaAjustaEnganche": "Enganche inicial (%)",
"preventaAjustaDiferido": "Enganche diferido (%)",
"preventaAjustaDiferidoMeses": "Meses del diferido",
"preventaAjustaObra": "Pagos durante obra (%)",
"preventaAjustaObraMeses": "Cuotas de obra",
"preventaContraentregaAuto": "Contraentrega (resto): {pct}%",
"preventaCorridaTitle": "Corrida del saldo de contraentrega"
```

- [ ] **Step 2: Add the SAME keys to en.json** (English values)

```jsonc
"preventaTitle": "Presale plan",
"preventaSubtitleA": "Plan configured by the developer.",
"preventaSubtitleB": "Adjust how to pay your presale.",
"preventaEngancheInicial": "Initial down payment",
"preventaEngancheDiferido": "Deferred down payment",
"preventaEngancheDiferidoNota": "{monto}/mo · {meses} months",
"preventaObra": "Payments during construction",
"preventaObraNota": "{monto}/mo · {meses} installments",
"preventaContraentrega": "On delivery",
"preventaContraentregaVia": "Delivery balance financed with",
"preventaViaHipotecario": "Mortgage loan",
"preventaViaInterno": "Developer financing",
"preventaTotalPreEntrega": "Total before delivery",
"preventaSumaAviso": "Percentages add up to {suma}%. Adjust to reach 100%.",
"preventaAjustaEnganche": "Initial down payment (%)",
"preventaAjustaDiferido": "Deferred down payment (%)",
"preventaAjustaDiferidoMeses": "Deferral months",
"preventaAjustaObra": "Payments during construction (%)",
"preventaAjustaObraMeses": "Construction installments",
"preventaContraentregaAuto": "On delivery (rest): {pct}%",
"preventaCorridaTitle": "Delivery-balance amortization"
```

- [ ] **Step 3: Validate es/en parity for the `esquemas` namespace**

Run this node one-liner (adjust if a project parity script already exists):
```bash
cd C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades
node -e "const es=require('./src/i18n/messages/es.json').esquemas,en=require('./src/i18n/messages/en.json').esquemas;const a=Object.keys(es).sort(),b=Object.keys(en).sort();const miss=a.filter(k=>!(k in en)).concat(b.filter(k=>!(k in es)));console.log(miss.length?('MISMATCH: '+miss.join(',')):'PARITY OK ('+a.length+' keys)')"
```
Expected: `PARITY OK`.

- [ ] **Step 4: Commit**

```bash
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis add src/i18n/messages/es.json src/i18n/messages/en.json
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "i18n(unidades): strings de preventa (es/en paridad)"
```

---

## Task 3: PreventaCalculator panel + wiring

**Files:**
- Create: `src/app/[locale]/propiedades/_components/esquemas/PreventaCalculator.tsx`
- Modify: `src/types/property.ts` (add `preventa` to `PropertyFinancing`)
- Modify: `src/lib/mappers/unit-to-property.ts` (populate `financing.preventa`)
- Modify: `src/app/[locale]/propiedades/_components/EsquemasDePagoTab.tsx` (replace placeholder, thread props)
- Modify: `src/app/[locale]/propiedades/_components/UnitDetailPage.tsx` (pass new props)
- Test (temporary): `src/app/preventa-probe/page.tsx`

- [ ] **Step 1: Extend `PropertyFinancing`** in `src/types/property.ts`

Add the import + field (inside the existing `PropertyFinancing` interface):
```ts
// top of file, near the esquemas import:
// (esquemas already imported inline; add a named import for the config type)
import type { PreventaConfig } from '@/lib/preventa';
```
```ts
export interface PropertyFinancing {
  // ...existing fields...
  esquemas?: import('@/lib/esquemas-pago').EsquemaPago[];
  preventa?: PreventaConfig | null; // Hub config (dev + unit override), null → Mode B
}
```

- [ ] **Step 2: Populate `financing.preventa`** in `src/lib/mappers/unit-to-property.ts`

At the top, add import:
```ts
import { parsePreventa } from '@/lib/preventa';
```
In the `financing` object literal (next to `esquemas: ...`), add:
```ts
    // fin_preventa aún puede no existir en v_units (llega con el DDL del Hub);
    // parsePreventa tolera undefined → null (Modo B).
    preventa: parsePreventa((row as UnitRow).fin_preventa),
```
And add `fin_preventa` as an optional field on the `UnitRow` type (find its declaration in this file or its imported types file) — add:
```ts
  /** JSONB config de preventa (merge dev/unidad en v_units). Puede no existir aún. */
  fin_preventa?: unknown;
```
> If `UnitRow` is imported from another file, add the field there. Do NOT add `fin_preventa` to any explicit `.select('...')` column list yet — the column does not exist in `v_units` until the Hub DDL is applied (Task 10). If the web unit query uses `.select('*')`, nothing else is needed; if it selects explicit columns, leave it out until Task 10.

- [ ] **Step 3: Write `PreventaCalculator.tsx`**

```tsx
'use client';

import { useCallback, useMemo, useState } from 'react';
import { Building2, Landmark, CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import CotizacionBloques, { type Bloque3Data } from './CotizacionBloques';
import CorridaCompacta from './CorridaCompacta';
import {
  computeInversionInicial,
  type Nacionalidad,
  type NivelAcabado,
} from '@/lib/inversion-inicial';
import { HIPOTECARIO_CONFIG } from '@/lib/hipotecario';
import {
  computePreventa,
  buildContraentregaSchedule,
  type PreventaConfig,
  type ContraentregaVia,
} from '@/lib/preventa';

interface PreventaCalculatorProps {
  priceOriginal: number;
  discountPct: number;
  price: number; // precio de venta con descuento
  config: PreventaConfig | null; // Hub config → Modo A; null → Modo B
  nacionalidad: Nacionalidad;
  onNacionalidad: (n: Nacionalidad) => void;
  interestRateInterno: number; // fin_tasa (contraentrega vía interno)
  mesesInterno: number; // plazo interno para contraentrega vía interno
  m2: number;
  city: string;
  zone: string | null;
  tipoEntrega: string | null;
  mobiliarioNivel: NivelAcabado;
  decoracionNivel: NivelAcabado;
  slug: string;
  locale: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(
    Math.round(n),
  );

export default function PreventaCalculator({
  priceOriginal,
  discountPct,
  price,
  config,
  nacionalidad,
  onNacionalidad,
  interestRateInterno,
  mesesInterno,
  m2,
  city,
  zone,
  tipoEntrega,
  mobiliarioNivel,
  decoracionNivel,
  slug,
  locale,
}: PreventaCalculatorProps) {
  const t = useTranslations('esquemas');
  const modeA = config != null;

  // --- Modo B: estado ajustable (sliders). Contraentrega = resto. ---
  const [engIni, setEngIni] = useState(20);
  const [engDif, setEngDif] = useState(0);
  const [engDifMeses, setEngDifMeses] = useState(6);
  const [obra, setObra] = useState(20);
  const [obraMeses, setObraMeses] = useState(24);
  const [viaB, setViaB] = useState<ContraentregaVia>('hipotecario');

  const contraentregaPctB = Math.max(0, 100 - engIni - engDif - obra);

  const effectiveConfig: PreventaConfig = useMemo(
    () =>
      modeA
        ? config!
        : {
            enganche_inicial_pct: engIni,
            enganche_diferido_pct: engDif,
            enganche_diferido_meses: engDifMeses,
            obra_pct: obra,
            obra_meses: obraMeses,
            contraentrega_pct: contraentregaPctB,
            contraentrega_via: viaB,
          },
    [modeA, config, engIni, engDif, engDifMeses, obra, obraMeses, contraentregaPctB, viaB],
  );

  const plan = useMemo(() => computePreventa(price, effectiveConfig), [price, effectiveConfig]);

  const perfil = nacionalidad === 'extranjero' ? 'extranjero' : 'nacional';
  const hipCfg = HIPOTECARIO_CONFIG[perfil];

  const schedule = useMemo(
    () =>
      buildContraentregaSchedule(plan.contraentrega, plan.contraentregaVia, {
        tasaHipotecarioPct: hipCfg.tasaAnualPct,
        mesesHipotecario: hipCfg.meses,
        tasaInternoPct: interestRateInterno,
        mesesInterno: mesesInterno > 0 ? mesesInterno : 60,
      }),
    [plan.contraentrega, plan.contraentregaVia, hipCfg, interestRateInterno, mesesInterno],
  );

  // Inversión inicial de preventa usa el ENGANCHE INICIAL del plan (no el del hipotecario).
  const inversion = useMemo(
    () =>
      computeInversionInicial({
        price,
        engancheMxn: plan.engancheInicial,
        nacionalidad,
        m2,
        city,
        zone,
        tipoEntrega,
        mobiliarioNivel,
        decoracionNivel,
      }),
    [price, plan.engancheInicial, nacionalidad, m2, city, zone, tipoEntrega, mobiliarioNivel, decoracionNivel],
  );

  const bloque3: Bloque3Data = {
    saldo: plan.contraentrega,
    mensualidades: schedule.rows.length,
    interesPct: plan.contraentregaVia === 'interno' ? interestRateInterno : hipCfg.tasaAnualPct,
    mensualidad: schedule.cuota,
  };

  const [pdfLoading, setPdfLoading] = useState(false);
  const handlePdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const qs = new URLSearchParams({
        slug,
        locale,
        mode: 'preventa',
        perfil: nacionalidad,
        mob: mobiliarioNivel,
        dec: decoracionNivel,
        ei: String(effectiveConfig.enganche_inicial_pct),
        ed: String(effectiveConfig.enganche_diferido_pct),
        edm: String(effectiveConfig.enganche_diferido_meses),
        ob: String(effectiveConfig.obra_pct),
        obm: String(effectiveConfig.obra_meses),
        ce: String(effectiveConfig.contraentrega_pct),
        via: effectiveConfig.contraentrega_via,
      });
      const res = await fetch('/api/generate-cotizacion-pdf?' + qs.toString());
      if (!res.ok) throw new Error('pdf');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-preventa-${slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* noop — botón vuelve a estado normal */
    } finally {
      setPdfLoading(false);
    }
  }, [slug, locale, nacionalidad, mobiliarioNivel, decoracionNivel, effectiveConfig]);

  const viaFijaLabel =
    plan.contraentregaVia === 'interno' ? t('preventaViaInterno') : t('preventaViaHipotecario');

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex items-start gap-2">
        <Building2 size={18} className="mt-0.5 text-brand-600" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{t('preventaTitle')}</h3>
          <p className="text-2xs text-gray-500">{modeA ? t('preventaSubtitleA') : t('preventaSubtitleB')}</p>
        </div>
      </div>

      {/* Perfil comprador (afecta la corrida de contraentrega vía hipotecario) */}
      <div className="flex gap-2">
        {(['nacional', 'extranjero'] as Nacionalidad[]).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onNacionalidad(n)}
            className={
              'rounded-full border px-3 py-1 text-2xs font-medium transition ' +
              (nacionalidad === n
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300')
            }
          >
            {t(n)}
          </button>
        ))}
      </div>

      {/* Etapas del plan */}
      {modeA ? (
        <PlanFijo plan={plan} t={t} viaLabel={viaFijaLabel} />
      ) : (
        <PlanAjustable
          engIni={engIni}
          setEngIni={setEngIni}
          engDif={engDif}
          setEngDif={setEngDif}
          engDifMeses={engDifMeses}
          setEngDifMeses={setEngDifMeses}
          obra={obra}
          setObra={setObra}
          obraMeses={obraMeses}
          setObraMeses={setObraMeses}
          via={viaB}
          setVia={setViaB}
          contraentregaPct={contraentregaPctB}
          plan={plan}
          t={t}
        />
      )}

      {!plan.balanceado && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-2xs text-amber-700">
          {t('preventaSumaAviso', { suma: plan.sumaPct })}
        </p>
      )}

      {/* Cotización 3 bloques — bloque3 = saldo de contraentrega */}
      <CotizacionBloques
        precio={priceOriginal}
        descuentoPct={discountPct}
        precioVenta={price}
        inversion={inversion}
        bloque3={bloque3}
      />

      {/* Corrida del saldo de contraentrega */}
      <div className="space-y-2">
        <h4 className="text-2xs font-semibold uppercase tracking-wide text-gray-500">
          {t('preventaCorridaTitle')}
        </h4>
        {hipCfg.avisoCambiario && plan.contraentregaVia === 'hipotecario' && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-2xs text-amber-700">{t('avisoCambiario')}</p>
        )}
        <CorridaCompacta schedule={schedule} currency="MXN" />
      </div>

      <button
        type="button"
        onClick={handlePdf}
        disabled={pdfLoading}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-2xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pdfLoading ? t('generandoPdf') : t('descargarCotizacion')}
      </button>
    </div>
  );
}

/* ---------- Modo A: plan fijo (solo lectura) ---------- */
function PlanFijo({
  plan,
  t,
  viaLabel,
}: {
  plan: ReturnType<typeof computePreventa>;
  t: ReturnType<typeof useTranslations>;
  viaLabel: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <StageCard label={t('preventaEngancheInicial')} monto={plan.engancheInicial} pct={plan.engancheInicialPct} />
      {plan.engancheDiferido > 0 && (
        <StageCard
          label={t('preventaEngancheDiferido')}
          monto={plan.engancheDiferido}
          pct={plan.engancheDiferidoPct}
          nota={t('preventaEngancheDiferidoNota', {
            monto: fmt(plan.engancheDiferidoMensual),
            meses: plan.engancheDiferidoMeses,
          })}
        />
      )}
      {plan.obra > 0 && (
        <StageCard
          label={t('preventaObra')}
          monto={plan.obra}
          pct={plan.obraPct}
          nota={t('preventaObraNota', { monto: fmt(plan.obraMensual), meses: plan.obraMeses })}
        />
      )}
      <StageCard
        label={t('preventaContraentrega')}
        monto={plan.contraentrega}
        pct={plan.contraentregaPct}
        nota={viaLabel}
      />
    </div>
  );
}

function StageCard({
  label,
  monto,
  pct,
  nota,
}: {
  label: string;
  monto: number;
  pct: number;
  nota?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
      <div className="flex items-baseline justify-between">
        <span className="text-2xs text-gray-500">{label}</span>
        <span className="text-2xs font-medium text-gray-400">{pct}%</span>
      </div>
      <div className="text-sm font-semibold text-gray-900">{fmt(monto)}</div>
      {nota && <div className="text-2xs text-gray-500">{nota}</div>}
    </div>
  );
}

/* ---------- Modo B: sliders ---------- */
function PlanAjustable(props: {
  engIni: number;
  setEngIni: (n: number) => void;
  engDif: number;
  setEngDif: (n: number) => void;
  engDifMeses: number;
  setEngDifMeses: (n: number) => void;
  obra: number;
  setObra: (n: number) => void;
  obraMeses: number;
  setObraMeses: (n: number) => void;
  via: ContraentregaVia;
  setVia: (v: ContraentregaVia) => void;
  contraentregaPct: number;
  plan: ReturnType<typeof computePreventa>;
  t: ReturnType<typeof useTranslations>;
}) {
  const { t } = props;
  return (
    <div className="space-y-3 rounded-lg border border-gray-100 p-3">
      <Slider label={t('preventaAjustaEnganche')} value={props.engIni} min={0} max={100} onChange={props.setEngIni} />
      <Slider label={t('preventaAjustaDiferido')} value={props.engDif} min={0} max={100} onChange={props.setEngDif} />
      {props.engDif > 0 && (
        <Slider
          label={t('preventaAjustaDiferidoMeses')}
          value={props.engDifMeses}
          min={1}
          max={36}
          onChange={props.setEngDifMeses}
        />
      )}
      <Slider label={t('preventaAjustaObra')} value={props.obra} min={0} max={100} onChange={props.setObra} />
      <Slider
        label={t('preventaAjustaObraMeses')}
        value={props.obraMeses}
        min={1}
        max={48}
        onChange={props.setObraMeses}
      />
      <div className="text-2xs font-medium text-gray-700">
        {t('preventaContraentregaAuto', { pct: props.contraentregaPct })} · {fmt(props.plan.contraentrega)}
      </div>
      <div>
        <span className="mb-1 block text-2xs text-gray-500">{t('preventaContraentregaVia')}</span>
        <div className="flex gap-2">
          {(['hipotecario', 'interno'] as ContraentregaVia[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => props.setVia(v)}
              className={
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-2xs font-medium transition ' +
                (props.via === v
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300')
              }
            >
              {v === 'interno' ? <CreditCard size={13} /> : <Landmark size={13} />}
              {v === 'interno' ? t('preventaViaInterno') : t('preventaViaHipotecario')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-2xs text-gray-500">{label}</span>
        <span className="text-2xs font-semibold text-gray-900">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-brand-600"
      />
    </label>
  );
}
```
> Visual note for the executing agent: match the exact `brand-*`/`gray-*` tokens, card radii and `text-2xs` sizing used in the sibling `HipotecarioCalculator.tsx` / `CorridaFinanciera.tsx`. Read those files and align class names (the classes above follow their conventions but confirm token names like `brand-600` exist in `tailwind.config`; if the siblings use a different accent token, use that instead).

- [ ] **Step 4: Wire into `EsquemasDePagoTab.tsx`**

Add import:
```ts
import PreventaCalculator from './esquemas/PreventaCalculator';
```
Destructure the new/reserved props in the function signature (add `preventa`, `interestRateInterno`, `mesesInterno`, `state` stays unused ok, and make sure `m2`, `city`, `zone`, `tipoEntrega`, `financingMonths`, `interestRateDefault` are available — several are already props). Add to props interface:
```ts
  preventa: PreventaConfig | null;
  interestRateInterno: number;
  mesesInterno: number;
```
(import `PreventaConfig`: `import type { PreventaConfig } from '@/lib/preventa';`)

Replace the Preventa branch (currently `panel: placeholder(t('preventaSoon'))`) with:
```tsx
if (stage === 'preventa') {
  items.push({
    id: 'preventa',
    label: t('tabPreventa'),
    icon: <Building2 size={16} />,
    panel: (
      <PreventaCalculator
        priceOriginal={priceOriginal}
        discountPct={discountPct}
        price={price}
        config={preventa}
        nacionalidad={nacionalidad}
        onNacionalidad={setNacionalidad}
        interestRateInterno={interestRateInterno}
        mesesInterno={mesesInterno}
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
> Use the exact state variable/setter names already present in `EsquemasDePagoTab` (`nacionalidad`/`setNacionalidad`, `mobiliarioNivel`, `decoracionNivel`). Confirm by reading the file before editing.

- [ ] **Step 5: Pass new props from `UnitDetailPage.tsx`**

In the `<EsquemasDePagoTab ... />` JSX, add:
```tsx
  preventa={property.financing.preventa ?? null}
  interestRateInterno={property.financing.interestRate}
  mesesInterno={property.financing.months?.[property.financing.months.length - 1] ?? 60}
```
(`m2`, `city`, `zone`, `tipoEntrega` are already passed per the current wiring.)

- [ ] **Step 6: SSR probe page** (`Tabs` renders only the active panel, so probe the panel directly + print math)

Create `src/app/preventa-probe/page.tsx` (NO leading underscore):
```tsx
import { computePreventa, parsePreventa, buildContraentregaSchedule } from '@/lib/preventa';

export const dynamic = 'force-dynamic';

export default function PreventaProbe() {
  const cfg = parsePreventa({
    enganche_inicial_pct: 10,
    enganche_diferido_pct: 10,
    enganche_diferido_meses: 6,
    obra_pct: 20,
    obra_meses: 24,
    contraentrega_pct: 60,
    contraentrega_via: 'hipotecario',
  })!;
  const plan = computePreventa(4_000_000, cfg);
  const sched = buildContraentregaSchedule(plan.contraentrega, 'hipotecario', {
    tasaHipotecarioPct: 10.5,
    mesesHipotecario: 240,
    tasaInternoPct: 10,
    mesesInterno: 60,
  });
  return (
    <pre id="probe">
      {JSON.stringify(
        {
          engancheInicial: plan.engancheInicial,
          engancheDiferido: plan.engancheDiferido,
          engancheDiferidoMensual: plan.engancheDiferidoMensual,
          obra: plan.obra,
          obraMensual: plan.obraMensual,
          contraentrega: plan.contraentrega,
          sumaPct: plan.sumaPct,
          balanceado: plan.balanceado,
          corridaMeses: sched.rows.length,
          cuota: Math.round(sched.cuota),
        },
        null,
        2,
      )}
    </pre>
  );
}
```

- [ ] **Step 7: Build + run probe + verify numbers**

```bash
cd C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades
./node_modules/.bin/next build
# start standalone or `next start` on a free port, then:
curl -s http://localhost:3000/preventa-probe | grep -A20 '<pre'
```
Expected values: engancheInicial 400000, engancheDiferido 400000, engancheDiferidoMensual 66667, obra 800000, obraMensual 33333, contraentrega 2400000, sumaPct 100, balanceado true, corridaMeses 240, cuota ≈ 23962.

- [ ] **Step 8: Delete probe, clean stale types, tsc**

```bash
rm -rf src/app/preventa-probe
rm -rf .next/types
./node_modules/.bin/tsc --noEmit
```
Expected: `tsc` clean (the deleted probe must not linger in `.next/types`).

- [ ] **Step 9: Commit**

```bash
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis add \
  src/app/[locale]/propiedades/_components/esquemas/PreventaCalculator.tsx \
  src/app/[locale]/propiedades/_components/EsquemasDePagoTab.tsx \
  src/app/[locale]/propiedades/_components/UnitDetailPage.tsx \
  src/types/property.ts \
  src/lib/mappers/unit-to-property.ts
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(unidades): sub-pestaña Preventa (modo A config-Hub / modo B ajustable + contraentrega→corrida)"
```

---

## Task 4: Preventa PDF (extend cotización endpoint)

**Files:**
- Modify: `src/lib/pdf/CotizacionPDFDocument.tsx`
- Modify: `src/app/api/generate-cotizacion-pdf/route.ts`
- Modify: `src/i18n/messages/es.json` + `en.json` (namespace `cotizacionPdf`)

- [ ] **Step 1: Extend `CotizacionPDFData` + labels** in `CotizacionPDFDocument.tsx`

Add to `CotizacionPDFLabels`:
```ts
  // preventa
  preventaTitle: string;
  preventaEngancheInicial: string;
  preventaEngancheDiferido: string;
  preventaObra: string;
  preventaContraentrega: string;
  preventaVia: string;
```
Add to `CotizacionPDFData` (optional — absent for the hipotecario PDF):
```ts
  preventa?: {
    engancheInicial: number;
    engancheInicialPct: number;
    engancheDiferido: number;
    engancheDiferidoPct: number;
    engancheDiferidoMeses: number;
    engancheDiferidoMensual: number;
    obra: number;
    obraPct: number;
    obraMeses: number;
    obraMensual: number;
    contraentrega: number;
    contraentregaPct: number;
    viaLabel: string;
  } | null;
```

- [ ] **Step 2: Render the preventa stages block** in `CotizacionPDFDocument`

Immediately before the existing "Precio" block, add (styles mirror existing block styles in the file):
```tsx
{data.preventa && (
  <View style={styles.block}>
    <Text style={styles.blockTitle}>{data.labels.preventaTitle}</Text>
    <Row k={`${data.labels.preventaEngancheInicial} (${data.preventa.engancheInicialPct}%)`} v={money(data.preventa.engancheInicial)} />
    {data.preventa.engancheDiferido > 0 && (
      <Row
        k={`${data.labels.preventaEngancheDiferido} (${data.preventa.engancheDiferidoPct}%) · ${data.preventa.engancheDiferidoMeses}m`}
        v={money(data.preventa.engancheDiferido)}
      />
    )}
    {data.preventa.obra > 0 && (
      <Row
        k={`${data.labels.preventaObra} (${data.preventa.obraPct}%) · ${data.preventa.obraMeses}m`}
        v={money(data.preventa.obra)}
      />
    )}
    <Row k={`${data.labels.preventaContraentrega} (${data.preventa.contraentregaPct}%) · ${data.preventa.viaLabel}`} v={money(data.preventa.contraentrega)} />
  </View>
)}
```
> Use the file's existing `Row`/`money`/`styles.block`/`styles.blockTitle` helpers (read the file; match their exact names). If `Row`/`money` are locally named differently, use those. The 3 existing blocks (Precio / Inversión / Saldo) remain — for preventa, "Financiamiento del saldo" reflects the contraentrega corrida (already fed by the route in Step 3).

- [ ] **Step 3: Handle `mode=preventa` in the route** `generate-cotizacion-pdf/route.ts`

After parsing existing params, add:
```ts
const mode = url.searchParams.get('mode') === 'preventa' ? 'preventa' : 'hipotecario';
```
Add preventa param parsing:
```ts
const num = (k: string, d = 0) => {
  const v = Number(url.searchParams.get(k));
  return Number.isFinite(v) ? v : d;
};
```
When `mode === 'preventa'`, after `mapUnitToProperty`, compute:
```ts
import { computePreventa, buildContraentregaSchedule, type ContraentregaVia } from '@/lib/preventa';
import { computeInversionInicial } from '@/lib/inversion-inicial';
import { HIPOTECARIO_CONFIG } from '@/lib/hipotecario';
import { aggregateByYear } from '@/lib/corrida-anual';
// ...
const cfg = {
  enganche_inicial_pct: num('ei'),
  enganche_diferido_pct: num('ed'),
  enganche_diferido_meses: num('edm'),
  obra_pct: num('ob'),
  obra_meses: num('obm'),
  contraentrega_pct: num('ce'),
  contraentrega_via: (url.searchParams.get('via') === 'interno' ? 'interno' : 'hipotecario') as ContraentregaVia,
};
const precioVenta = property.price.mxn;
const plan = computePreventa(precioVenta, cfg);
const hipCfg = HIPOTECARIO_CONFIG[perfil];
const mesesInterno = property.financing.months?.[property.financing.months.length - 1] ?? 60;
const schedule = buildContraentregaSchedule(plan.contraentrega, plan.contraentregaVia, {
  tasaHipotecarioPct: hipCfg.tasaAnualPct,
  mesesHipotecario: hipCfg.meses,
  tasaInternoPct: property.financing.interestRate,
  mesesInterno,
});
const inversion = computeInversionInicial({
  price: precioVenta,
  engancheMxn: plan.engancheInicial,
  nacionalidad: perfil,
  m2: property.specs.area,
  city: property.location.city,
  zone: property.location.zone,
  tipoEntrega: property.specs.tipoEntrega ?? null,
  mobiliarioNivel: mob,
  decoracionNivel: dec,
});
const annual = aggregateByYear(schedule.rows);
```
Then build `CotizacionPDFData` with `preventa: { ...plan fields..., viaLabel: tEsq('preventaVia'+...) }`, `saldo: plan.contraentrega`, `mensualidades: schedule.rows.length`, `interesPct: plan.contraentregaVia==='interno' ? property.financing.interestRate : hipCfg.tasaAnualPct`, `mensualidad: schedule.cuota`, `annual`, `enganche: plan.engancheInicial`, `enganchePct: plan.engancheInicialPct`, and the preventa `labels.*` from the `esquemas` namespace. For `mode==='hipotecario'` keep the existing code path, and set `preventa: null`.
> `viaLabel` = `tEsq('preventaViaInterno')` or `tEsq('preventaViaHipotecario')` depending on `plan.contraentregaVia` (the route already loads the `esquemas` namespace translator — reuse it; if not, add `const tEsq = await getTranslations({ locale, namespace: 'esquemas' })`).

- [ ] **Step 4: Add `cotizacionPdf` preventa labels (es + en parity)**

es.json (namespace `cotizacionPdf`):
```jsonc
"preventaTitle": "Plan de preventa",
"preventaEngancheInicial": "Enganche inicial",
"preventaEngancheDiferido": "Enganche diferido",
"preventaObra": "Pagos durante obra",
"preventaContraentrega": "Contraentrega",
"preventaVia": "Contraentrega vía"
```
en.json (same keys): "Presale plan" / "Initial down payment" / "Deferred down payment" / "Payments during construction" / "On delivery" / "Delivery financed via". Wire these into the `labels` object the route builds.

- [ ] **Step 5: Parity + build + PDF smoke**

```bash
cd C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades
node -e "const es=require('./src/i18n/messages/es.json').cotizacionPdf,en=require('./src/i18n/messages/en.json').cotizacionPdf;const a=Object.keys(es).sort(),b=Object.keys(en).sort();const m=a.filter(k=>!(k in en)).concat(b.filter(k=>!(k in es)));console.log(m.length?'MISMATCH:'+m:'PARITY OK')"
rm -rf .next/types && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/next build
# then GET a preventa PDF for a known preventa unit slug and confirm 200 + application/pdf:
curl -s -o /tmp/preventa.pdf -w "%{http_code} %{content_type}\n" "http://localhost:3000/api/generate-cotizacion-pdf?slug=<PRESALE_SLUG>&mode=preventa&ei=10&ed=10&edm=6&ob=20&obm=24&ce=60&via=hipotecario&perfil=nacional&locale=es"
```
Expected: parity OK, tsc/build clean, HTTP 200 `application/pdf`, non-empty file.
> If no presale slug is handy, ask Luis for one; do NOT invent a slug.

- [ ] **Step 6: Commit**

```bash
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis add \
  src/lib/pdf/CotizacionPDFDocument.tsx \
  src/app/api/generate-cotizacion-pdf/route.ts \
  src/i18n/messages/es.json src/i18n/messages/en.json
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(unidades): PDF de cotización de preventa (etapas + corrida contraentrega)"
```

---

## Task 5: Web slice gate + report

- [ ] **Step 1: Full green gate on rebased state**

```bash
cd C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades
git fetch origin
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis rebase origin/main   # only if Luis approves the rebase timing
rm -rf .next/types && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/next build
node -e "for (const ns of ['esquemas','corrida','cotizacionPdf']){const es=require('./src/i18n/messages/es.json')[ns],en=require('./src/i18n/messages/en.json')[ns];const a=Object.keys(es),b=Object.keys(en);const m=a.filter(k=>!(k in en)).concat(b.filter(k=>!(k in es)));console.log(ns, m.length?('MISMATCH '+m):'OK')}"
```

- [ ] **Step 2: Report web half to Luis. NO push without his OK.** Summarize commits, verification output, and that Mode A will only render once the Hub `fin_preventa` column exists (Part 2).

---

# PART 2 — HUB (gated: needs new worktree + explicit DDL authorization)

> **Authorization gate:** the DDL adds columns to prod `oaijxdpevakashxshhvm`. Per `feedback_autorizacion_explicita_infra`, the SQL must be **ready and additive** (Task 6) and applied **only** after Luis gives an explicit go naming the objective. Do not apply DDL speculatively.

## Task 6: Hub worktree + additive DDL (prepared, NOT applied)

- [ ] **Step 1: Create isolated worktree + branch off origin/main**

```bash
cd C:/Users/Luis/Projects/Propyte/Propyte_hub
git fetch origin
git worktree add -b feat/unidades-preventa-interno-hub C:/Users/Luis/Projects/Propyte/Propyte_hub_preventa origin/main
```
> Set up node_modules (junction/symlink or `npm ci`) and copy `.env*` the same way the existing Hub worktrees are wired. Confirm `git -C C:/Users/Luis/Projects/Propyte/Propyte_hub_preventa branch --show-current` → `feat/unidades-preventa-interno-hub`.

- [ ] **Step 2: Write the additive DDL doc** `docs/superpowers/plans/2026-07-20-slice4-preventa-DDL.sql`

```sql
-- Slice 4 Preventa — DDL additivo (aplicar SOLO con autorización explícita).
-- Proyecto: oaijxdpevakashxshhvm · schema real_estate_hub
ALTER TABLE real_estate_hub."Propyte_desarrollos" ADD COLUMN IF NOT EXISTS preventa jsonb;
ALTER TABLE real_estate_hub."Propyte_unidades"    ADD COLUMN IF NOT EXISTS preventa jsonb;

-- v_units: agregar fin_preventa con el MISMO merge que fin_esquemas_pago (append; no reordenar columnas).
-- Reusar la definición vigente de v_units y añadir:
--   CASE WHEN u.financiamiento_propio OR u.id_desarrollo IS NULL
--        THEN u.preventa ELSE d.preventa END AS fin_preventa
-- (obtener la definición actual con: select pg_get_viewdef('real_estate_hub.v_units', true); y re-CREATE OR REPLACE)
```
> The full `CREATE OR REPLACE VIEW v_units` must be reconstructed from the live definition (`pg_get_viewdef`) with the one new expression appended in the SELECT list, mirroring exactly how `fin_esquemas_pago` was added (see Hub design doc `2026-07-17-esquemas-pago-multiples-design.md §3.1`). Prepare that full statement in this file before applying.

- [ ] **Step 3: Commit the DDL doc**

```bash
cd C:/Users/Luis/Projects/Propyte/Propyte_hub_preventa
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis add docs/superpowers/plans/2026-07-20-slice4-preventa-DDL.sql
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "docs(preventa): DDL additivo preparado (sin aplicar)"
```

---

## Task 7: Hub preventa lib

**Files:**
- Create: `src/lib/preventa.ts` (Hub)

- [ ] **Step 1: Write it** — `PreventaConfig` type + `parsePreventa` (copy the web parser verbatim EXCEPT drop the `buildAmortizationSchedule` import — the Hub only needs parse + a preview). Add a tiny preview helper used by the editor:

```ts
// src/lib/preventa.ts (Hub)
export type ContraentregaVia = 'hipotecario' | 'interno';

export interface PreventaConfig {
  enganche_inicial_pct: number;
  enganche_diferido_pct: number;
  enganche_diferido_meses: number;
  obra_pct: number;
  obra_meses: number;
  contraentrega_pct: number;
  contraentrega_via: ContraentregaVia;
}

const VIAS: ContraentregaVia[] = ['hipotecario', 'interno'];

export function parsePreventa(raw: unknown): PreventaConfig | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const x = raw as Record<string, unknown>;
  const via = VIAS.includes(x.contraentrega_via as ContraentregaVia)
    ? (x.contraentrega_via as ContraentregaVia)
    : 'hipotecario';
  const cfg: PreventaConfig = {
    enganche_inicial_pct: Number(x.enganche_inicial_pct) || 0,
    enganche_diferido_pct: Number(x.enganche_diferido_pct) || 0,
    enganche_diferido_meses: Number(x.enganche_diferido_meses) || 0,
    obra_pct: Number(x.obra_pct) || 0,
    obra_meses: Number(x.obra_meses) || 0,
    contraentrega_pct: Number(x.contraentrega_pct) || 0,
    contraentrega_via: via,
  };
  const total =
    cfg.enganche_inicial_pct + cfg.enganche_diferido_pct + cfg.obra_pct + cfg.contraentrega_pct;
  if (total <= 0) return null;
  return cfg;
}

export function sumaPreventaPct(cfg: PreventaConfig): number {
  return cfg.enganche_inicial_pct + cfg.enganche_diferido_pct + cfg.obra_pct + cfg.contraentrega_pct;
}

export function blankPreventa(): PreventaConfig {
  return {
    enganche_inicial_pct: 0,
    enganche_diferido_pct: 0,
    enganche_diferido_meses: 0,
    obra_pct: 0,
    obra_meses: 0,
    contraentrega_pct: 0,
    contraentrega_via: 'hipotecario',
  };
}
```

- [ ] **Step 2: tsc + commit**

```bash
cd C:/Users/Luis/Projects/Propyte/Propyte_hub_preventa
rm -rf .next/types && ./node_modules/.bin/tsc --noEmit
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis add src/lib/preventa.ts
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(hub): lib preventa (parse + helpers)"
```

---

## Task 8: Hub PreventaEditor + field registration

**Files:**
- Create: `src/components/common/fields/PreventaEditor.tsx`
- Modify: `src/components/common/FieldEditor.tsx` (add `"preventa"` FieldType + renderer branch)
- Modify: `src/lib/fields-config.ts` (register in `DEVELOPMENT_FIELDS`; add to unit `__financing` `extraKeys`)
- Modify: `src/components/common/fields/FinancingSection.tsx` (inherit/override for `preventa`)

- [ ] **Step 1: Write `PreventaEditor.tsx`** — single-object editor (not an array). Mirror `PaymentSchemesEditor.tsx` (`values`/`setValue`/`fieldKey` interface, live suma warning).

```tsx
'use client';
import { parsePreventa, sumaPreventaPct, blankPreventa, type PreventaConfig } from '@/lib/preventa';

interface Props {
  label: string;
  info?: string;
  fieldKey: string;
  values: Record<string, unknown>;
  setValue: (key: string, v: unknown) => void;
  readOnly?: boolean;
}

const NUM_FIELDS: { key: keyof PreventaConfig; label: string }[] = [
  { key: 'enganche_inicial_pct', label: 'Enganche inicial %' },
  { key: 'enganche_diferido_pct', label: 'Enganche diferido %' },
  { key: 'enganche_diferido_meses', label: 'Meses del diferido' },
  { key: 'obra_pct', label: 'Obra %' },
  { key: 'obra_meses', label: 'Cuotas de obra' },
  { key: 'contraentrega_pct', label: 'Contraentrega %' },
];

export default function PreventaEditor({ label, info, fieldKey, values, setValue, readOnly }: Props) {
  const cfg = parsePreventa(values[fieldKey]) ?? blankPreventa();
  const suma = sumaPreventaPct(cfg);
  const balanceado = Math.abs(suma - 100) < 0.01;

  const patch = (p: Partial<PreventaConfig>) => setValue(fieldKey, { ...cfg, ...p });

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      {info && <p className="text-xs text-gray-500">{info}</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {NUM_FIELDS.map((f) => (
          <label key={f.key} className="block text-xs">
            <span className="text-gray-500">{f.label}</span>
            <input
              type="number"
              disabled={readOnly}
              value={Number(cfg[f.key]) || 0}
              onChange={(e) => patch({ [f.key]: Number(e.target.value) } as Partial<PreventaConfig>)}
              className="mt-1 w-full rounded border px-2 py-1"
            />
          </label>
        ))}
        <label className="block text-xs">
          <span className="text-gray-500">Contraentrega vía</span>
          <select
            disabled={readOnly}
            value={cfg.contraentrega_via}
            onChange={(e) => patch({ contraentrega_via: e.target.value as PreventaConfig['contraentrega_via'] })}
            className="mt-1 w-full rounded border px-2 py-1"
          >
            <option value="hipotecario">Hipotecario</option>
            <option value="interno">Interno</option>
          </select>
        </label>
      </div>
      <p className={'text-xs ' + (balanceado ? 'text-green-600' : 'text-amber-600')}>
        Suma: {suma}% {balanceado ? '✓' : '(debe ser 100%)'}
      </p>
    </div>
  );
}
```
> Match the actual class conventions of `PaymentSchemesEditor.tsx` (read it). The `values[fieldKey]` write stores the plain object; JSONB serialization is automatic via `/api/record` (no `JSON.stringify`).

- [ ] **Step 2: Register the FieldType + renderer** in `FieldEditor.tsx`

Add `"preventa"` to the `FieldType` union. Add near the `payment-schemes` branch:
```tsx
if (f.type === 'preventa') {
  return (
    <PreventaEditor key={f.key} label={f.label} info={f.info} fieldKey={f.key}
      values={values} setValue={setValue} readOnly={f.readOnly} />
  );
}
```
(import `PreventaEditor`.)

- [ ] **Step 3: Register the field** in `fields-config.ts`

Development (near the `esquemas_pago` entry, section "Financiamiento"):
```ts
{ section: "Financiamiento", key: "preventa", label: "Preventa (plan de pagos)", type: "preventa",
  info: "Enganche inicial + diferido, pagos durante obra y contraentrega. Solo aplica a unidades en preventa." },
```
Unit `__financing` composite: add `"preventa"` to its `extraKeys` array so the diff tracks the override key.

- [ ] **Step 4: Inherit/override in `FinancingSection.tsx`**

Mirror the `esquemas_pago` inherit/override block: when `financiamiento_propio` is on, render `<PreventaEditor fieldKey="preventa" .../>`; else show a read-only preview of the inherited development preventa (from `inheritedFinancing.preventa`, parsed).

- [ ] **Step 5: tsc + build + commit**

```bash
cd C:/Users/Luis/Projects/Propyte/Propyte_hub_preventa
rm -rf .next/types && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/next build
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis add \
  src/components/common/fields/PreventaEditor.tsx \
  src/components/common/FieldEditor.tsx \
  src/lib/fields-config.ts \
  src/components/common/fields/FinancingSection.tsx
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(hub): editor de preventa (desarrollo + override unidad)"
```

---

## Task 9: Hub unit page reads inherited `fin_preventa`

**Files:**
- Modify: `src/app/(dashboard)/unidades/[id]/page.tsx`

- [ ] **Step 1: Add `fin_preventa` to the `v_units` select + parse**

In the `.select("...")` string add `, fin_preventa`. In `inheritedFinancing`, add:
```ts
  preventa: parsePreventa(vrow?.fin_preventa),
```
(import `parsePreventa` from `@/lib/preventa`.)
> This select change compiles fine now but returns null until the DDL (Task 10) creates the column — Supabase will error on an unknown column if run before the DDL. Therefore: **do this step's select edit only AFTER Task 10 applies the DDL**, OR guard the select behind the column existing. Recommended order: apply DDL (Task 10) first, then this select edit. Keep the `parsePreventa` inherit line ready.

- [ ] **Step 2: tsc + build + commit** (after Task 10)

```bash
cd C:/Users/Luis/Projects/Propyte/Propyte_hub_preventa
rm -rf .next/types && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/next build
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis add "src/app/(dashboard)/unidades/[id]/page.tsx"
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(hub): unidad hereda preventa del desarrollo (fin_preventa)"
```

---

## Task 10: Apply DDL (AUTHORIZED) + end-to-end Mode A verify

- [ ] **Step 1: Request explicit authorization from Luis**, showing the exact DDL from Task 6. Wait for a go that names the objective (e.g. "aplica el DDL de preventa a oaijxdpevakashxshhvm"). Do NOT proceed otherwise.

- [ ] **Step 2: Apply DDL** via Supabase MCP `apply_migration` (2 ALTERs + the reconstructed `CREATE OR REPLACE VIEW v_units`). Verify:
```sql
select column_name from information_schema.columns
 where table_schema='real_estate_hub' and table_name='v_units' and column_name='fin_preventa';
-- expect 1 row
```

- [ ] **Step 3: Complete Task 9 select edit** (now the column exists) + Hub tsc/build/commit.

- [ ] **Step 4: Web select (if applicable)** — if the web unit query uses an explicit column list, add `fin_preventa` to it now (in `Next_Propyte_web_unidades`), tsc/build/commit. If it uses `*`, nothing to do.

- [ ] **Step 5: End-to-end Mode A check** — set a preventa config on a test development in the Hub editor (or via a scratch SQL update on a test row), confirm the web unit page's Preventa tab renders the fixed plan (Mode A) with the configured stages. Luis does the click-through; provide him the unit slug + expected numbers.

- [ ] **Step 6: Report Hub half. NO push (web or Hub) without Luis's OK.**

---

## Self-Review (run against spec §4.3, §5, §6.2, §7 item 4)

- **§4.3 Modo A (Hub config → plan fijo: enganche inicial + diferido + obra + contraentrega):** Tasks 3 (`PlanFijo`) + 6–9 (Hub config/editor/read). ✓
- **§4.3 Modo B (fallback ajustable):** Task 3 (`PlanAjustable` sliders + auto contraentrega). ✓
- **§4.3 enganche 1 o 2 partes (inicial + diferido):** `enganche_inicial_pct` + `enganche_diferido_pct`/`_meses` in the contract + `computePreventa`. ✓
- **§4.3 contraentrega → corrida vía Hipotecario o Interno:** `buildContraentregaSchedule` + via selector (B) / config (A) + `CorridaCompacta`. ✓
- **§4.3 config por desarrollo con override por unidad (patrón esquemas_pago):** Tasks 6–9 mirror `esquemas_pago` (JSONB both tables, `v_units` merge, `FinancingSection` inherit/override). ✓
- **§5 Config Preventa vive en Hub (JSONB, desarrollo + override unidad):** DDL Task 6, editor Task 8. ✓
- **§6.2 PDF espejo (todos los esquemas se descargan en PDF):** Task 4. ✓ (corrida como resumen por año via `aggregateByYear`.)
- **§7 item 4 aceptación (con config → plan fijo; sin config → fallback; contraentrega enlaza a corrida):** Tasks 3 + 10 Step 5. ✓
- **Reuse mandate (CorridaCompacta, computeHipotecario/hipotecario.ts, buildAmortizationSchedule, CotizacionBloques/computeInversionInicial, PDF endpoint):** all reused; no duplicate calc paths. ✓
- **Placeholder scan:** no TBD/TODO; all code blocks concrete. Style-token confirmation is delegated to the executing agent (read sibling files) — flagged explicitly, not a silent gap.
- **Type consistency:** `PreventaConfig` identical across both repos; `computePreventa`/`buildContraentregaSchedule` names stable; `Bloque3Data`/`InversionInicialResult`/`AmortSchedule` reused verbatim.

## Notes / deferred
- `stage==='preventa'` derives from `is_presale===true || status==='preventa'` (mapper) — no `estado_unidad` column; the spec's "estado_unidad = Preventa" maps to `status`/`is_presale`.
- Contraentrega vía **interno** uses the francesa schedule with `fin_tasa`/`fin_meses` in Slice 4; Slice 5's timing formulas will enhance the Interno tab (and can later enrich preventa-interno).
- Extranjero corrida is shown in MXN with `avisoCambiario` (USD conversion is a separate fast-follow, per handoff).
