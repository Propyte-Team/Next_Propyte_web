# Slice 3 — Financiamiento Hipotecario + Corrida compacta + PDF de cotización · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir a la ficha de Unidad la sub-pestaña **Financiamiento Hipotecario** (selector Nacional/Extranjero con sus tasas), una **corrida compacta reutilizable** (tabla por año expandible a meses + barras interés/capital + resumen), rellenar el **bloque 3** de la cotización en vivo, y un **PDF de cotización** espejo de los 3 bloques + corrida resumida por año.

**Architecture:** Toda la matemática vive en libs puras (`hipotecario.ts`, `corrida-anual.ts`) reutilizando `buildAmortizationSchedule` (amortización francesa ya en prod). La UI las consume en un `CorridaCompacta` genérico (usado por el nuevo `HipotecarioCalculator` y por el `CorridaFinanciera` existente) y el PDF se genera server-side **recomputando desde las mismas libs puras** (endpoint GET tipado) → paridad automática con pantalla sin confiar en números del cliente.

**Tech Stack:** Next.js 16 (App Router, RSC + client components), TypeScript, next-intl v4 (namespaces `esquemas`/`corrida`/`cotizacionPdf`), recharts v3, @react-pdf/renderer v4, qrcode, Tailwind. Sin runner de tests (vitest/tsx ausentes) → verificación = `tsc --noEmit` + smoke Node de libs puras + `next build` + probe SSR + curl al endpoint PDF.

---

## Decisiones (locked para este slice)

1. **Perfil = fuente única.** El selector Nacional/Extranjero es el **mismo estado `nacionalidad`** ya compartido (Slice 2, escrituración). Al cambiar de perfil se recalcula **todo**: escrituración (fideicomiso), enganche y corrida (spec §4.5 "al cambiar de perfil se recalcula todo"). Config global en `hipotecario.ts`:
   - **Nacional:** 10.5% anual, 240 meses (20 años), MXN, enganche `max(20%, downPaymentMin)`.
   - **Extranjero:** 9.5% anual, 360 meses (30 años), USD, enganche **35%** fijo (requisito cross-border) + aviso cambiario.
2. **Extranjero en MXN + aviso cambiario.** No se convierte a USD (no hay FX cableado en este componente). Los montos van en **MXN como referencia** con un **aviso de riesgo cambiario** claro (spec §5/§8 exige "aviso de riesgo cambiario en pantalla", no conversión). Conversión USD = fast-follow si Luis lo pide.
3. **Hipotecario reemplaza al stand-in de Slice 2.** Hoy la pestaña Hipotecario muestra la corrida de esquemas del Hub (`CorridaFinanciera`) como placeholder. Esos esquemas son financiamiento del desarrollador → conceptualmente **Interno** (Slice 5). En Slice 3, Hipotecario pasa a ser la calculadora de crédito hipotecario. `CorridaFinanciera` se conserva (refactorizado a `CorridaCompacta`) para que Slice 5 lo conecte en Interno. Sin impacto en prod (ambos tabs ocultos por `site_visibility`).
4. **PDF por GET recomputado server-side.** Endpoint nuevo `/api/generate-cotizacion-pdf` recibe `slug/locale/perfil/mob/dec`, recomputa con las libs puras y renderiza `CotizacionPDFDocument`. DRY + seguro (sin números del cliente) + paridad garantizada.

---

## File Structure

**Nuevos:**
- `src/lib/hipotecario.ts` — config global de tasas/plazos + `computeHipotecario` (puro).
- `src/lib/corrida-anual.ts` — `aggregateByYear` (puro).
- `src/app/[locale]/propiedades/_components/esquemas/CorridaCompacta.tsx` — corrida compacta genérica (barras por año + resumen + toggle año/mes + tabla por año expandible a meses).
- `src/app/[locale]/propiedades/_components/esquemas/HipotecarioCalculator.tsx` — selector perfil + chips tasa/plazo/moneda + aviso cambiario + `CotizacionBloques` (bloque3 en vivo) + `CorridaCompacta` + botón PDF.
- `src/lib/pdf/CotizacionPDFDocument.tsx` — documento react-pdf de cotización.
- `src/app/api/generate-cotizacion-pdf/route.ts` — GET recomputa + renderiza el PDF.

**Modificados:**
- `src/app/[locale]/propiedades/_components/CorridaFinanciera.tsx` — usa `CorridaCompacta` (borra su chart+tabla inline; conserva selector de esquema + header de precio + rama contado).
- `src/app/[locale]/propiedades/_components/EsquemasDePagoTab.tsx` — enganche por perfil, computa `hipotecario` + `bloque3`, renderiza `HipotecarioCalculator`, recibe/pasa `slug`+`locale`.
- `src/app/[locale]/propiedades/_components/UnitDetailPage.tsx` — pasa `slug` y `locale` a `EsquemasDePagoTab`.
- `src/i18n/messages/es.json` + `en.json` — keys nuevas en `esquemas`, `corrida` y namespace nuevo `cotizacionPdf` (paridad es/en obligatoria).

---

## Reglas de commit (todas las tareas)

- Autor: `git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "..."`.
- **Verificar rama antes de cada commit:** `git -C . rev-parse --abbrev-ref HEAD` → debe ser `feat/unidades-rediseno` (worktree compartido).
- **Stagear rutas explícitas** — NUNCA `git add -A` (hay `.env.example` sin trackear).
- Un commit al final de cada tarea. No push (Luis autoriza el deploy aparte).

---

### Task 1: Lib pura — config + corrida hipotecaria (`hipotecario.ts`)

**Files:**
- Create: `src/lib/hipotecario.ts`

- [ ] **Step 1: Crear la lib**

```ts
import { buildAmortizationSchedule, type AmortSchedule } from './calculator';

export type PerfilHipotecario = 'nacional' | 'extranjero';

export interface HipotecarioConfig {
  tasaAnualPct: number;
  meses: number;
  moneda: 'MXN' | 'USD';
  /** Enganche de arranque del perfil (Nacional usa este como piso; Extranjero es fijo). */
  enganchePct: number;
  avisoCambiario: boolean;
}

// Config global (arranque, ajustable) — spec §5.
export const HIPOTECARIO_CONFIG: Record<PerfilHipotecario, HipotecarioConfig> = {
  nacional: { tasaAnualPct: 10.5, meses: 240, moneda: 'MXN', enganchePct: 20, avisoCambiario: false },
  extranjero: { tasaAnualPct: 9.5, meses: 360, moneda: 'USD', enganchePct: 35, avisoCambiario: true },
};

export interface HipotecarioResult {
  perfil: PerfilHipotecario;
  config: HipotecarioConfig;
  enganchePct: number;
  enganche: number;
  /** Monto financiado = precioVenta − enganche. */
  saldo: number;
  schedule: AmortSchedule;
}

/**
 * Corrida hipotecaria para `precioVenta` (ya con descuento aplicado) y `perfil`.
 * Nacional: enganche = max(config, downPaymentMin) — respeta un requisito mayor de la unidad.
 * Extranjero: enganche fijo 35% (cross-border). Reusa la amortización francesa.
 */
export function computeHipotecario(
  precioVenta: number,
  perfil: PerfilHipotecario,
  downPaymentMinPct?: number,
): HipotecarioResult {
  const config = HIPOTECARIO_CONFIG[perfil];
  const precio = Math.max(0, Number(precioVenta) || 0);
  const enganchePct = perfil === 'nacional'
    ? Math.max(config.enganchePct, downPaymentMinPct ?? 0)
    : config.enganchePct;
  const enganche = Math.round(precio * enganchePct / 100);
  const saldo = Math.max(0, precio - enganche);
  const schedule = buildAmortizationSchedule(saldo, config.tasaAnualPct, config.meses);
  return { perfil, config, enganchePct, enganche, saldo, schedule };
}
```

- [ ] **Step 2: Verificar tipos**

Run: `cd "C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades" && npx tsc --noEmit`
Expected: sin errores nuevos en `hipotecario.ts` (la correctitud numérica se prueba en Task 4/6 vía render/curl — la fórmula francesa ya está probada en prod).

- [ ] **Step 3: Commit**

```bash
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(esquemas): lib pura de corrida hipotecaria (config Nac/Ext + computeHipotecario)" -- src/lib/hipotecario.ts
```

---

### Task 2: Lib pura — agregación anual (`corrida-anual.ts`)

**Files:**
- Create: `src/lib/corrida-anual.ts`

- [ ] **Step 1: Crear la lib**

```ts
import type { AmortRow } from './calculator';

export interface AnnualRow {
  anio: number;
  cuota: number;
  interes: number;
  capital: number;
  saldoFinal: number;
  meses: AmortRow[];
}

/** Agrupa una corrida mensual en filas anuales (12 meses/año) para la vista compacta. */
export function aggregateByYear(rows: AmortRow[]): AnnualRow[] {
  const years: AnnualRow[] = [];
  for (const r of rows) {
    const idx = Math.floor((r.mes - 1) / 12);
    let y = years[idx];
    if (!y) {
      y = { anio: idx + 1, cuota: 0, interes: 0, capital: 0, saldoFinal: 0, meses: [] };
      years[idx] = y;
    }
    y.cuota += r.cuota;
    y.interes += r.interes;
    y.capital += r.capital;
    y.saldoFinal = r.saldo; // último mes visto = fin de año
    y.meses.push(r);
  }
  return years;
}
```

- [ ] **Step 2: Smoke Node (import type-only → carga standalone en Node v24)**

Crear `C:/Users/Luis/AppData/Local/Temp/claude/c--Users-Luis/530626fd-ff12-405a-85ae-12b7276cd355/scratchpad/check-anual.mts`:

```ts
import { aggregateByYear } from 'C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades/src/lib/corrida-anual.ts';

const rows = Array.from({ length: 24 }, (_, i) => ({
  mes: i + 1, cuota: 100, interes: 10, capital: 90, saldo: 2400 - (i + 1) * 90,
}));
const y = aggregateByYear(rows);
const ok =
  y.length === 2 &&
  y[0].anio === 1 && y[0].cuota === 1200 && y[0].interes === 120 && y[0].capital === 1080 &&
  y[0].meses.length === 12 && y[0].saldoFinal === rows[11].saldo &&
  y[1].anio === 2 && y[1].meses.length === 12 && y[1].saldoFinal === rows[23].saldo;
if (!ok) { console.error('FAIL', JSON.stringify(y, null, 2)); process.exit(1); }
console.log('PASS aggregateByYear');
```

Run: `node "C:/Users/Luis/AppData/Local/Temp/claude/c--Users-Luis/530626fd-ff12-405a-85ae-12b7276cd355/scratchpad/check-anual.mts"`
Expected: `PASS aggregateByYear` (exit 0). Si falla, corrige la lib, no el test.

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 4: Commit**

```bash
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(esquemas): lib pura aggregateByYear (corrida por año)" -- src/lib/corrida-anual.ts
```

---

### Task 3: `CorridaCompacta` genérica + refactor de `CorridaFinanciera` + i18n `corrida`

**Files:**
- Create: `src/app/[locale]/propiedades/_components/esquemas/CorridaCompacta.tsx`
- Modify: `src/app/[locale]/propiedades/_components/CorridaFinanciera.tsx`
- Modify: `src/i18n/messages/es.json`, `src/i18n/messages/en.json` (namespace `corrida`)

- [ ] **Step 1: Añadir keys i18n `corrida` (es)**

En `src/i18n/messages/es.json`, dentro del objeto `"corrida"`, añade tras `"effectivePrice": "Precio con este plan"` (agrega una coma a esa línea):

```json
    "effectivePrice": "Precio con este plan",
    "viewByYear": "Ver por año",
    "viewByMonth": "Ver por mes",
    "colYear": "Año",
    "year": "Año {n}"
```

- [ ] **Step 2: Añadir keys i18n `corrida` (en)**

En `src/i18n/messages/en.json`, dentro de `"corrida"`, en el mismo lugar:

```json
    "effectivePrice": "Price with this plan",
    "viewByYear": "By year",
    "viewByMonth": "By month",
    "colYear": "Year",
    "year": "Year {n}"
```

> Nota: usa las traducciones EN reales de las keys previas ya presentes; solo agregas las 4 nuevas + la coma. No dupliques keys.

- [ ] **Step 3: Crear `CorridaCompacta.tsx`**

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronRight } from '@/lib/icons';
import { formatPrice } from '@/lib/formatters';
import type { AmortSchedule } from '@/lib/calculator';
import { aggregateByYear, type AnnualRow } from '@/lib/corrida-anual';

const COLOR_CAPITAL = '#5CE0D2';
const COLOR_INTEREST = '#1A2F3F';

interface CorridaCompactaProps {
  schedule: AmortSchedule;
  currency?: string;
}

export default function CorridaCompacta({ schedule, currency = 'MXN' }: CorridaCompactaProps) {
  const t = useTranslations('corrida');
  const [byYear, setByYear] = useState(true);
  const [openYears, setOpenYears] = useState<Set<number>>(new Set());
  const fmt = (n: number) => formatPrice(Math.round(n), currency);

  const annual = useMemo(() => aggregateByYear(schedule.rows), [schedule]);
  const chartData = useMemo(
    () => annual.map((y) => ({
      label: t('year', { n: y.anio }),
      [t('colCapital')]: Math.round(y.capital),
      [t('colInterest')]: Math.round(y.interes),
    })),
    [annual, t],
  );

  const toggleYear = (anio: number) =>
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(anio)) next.delete(anio); else next.add(anio);
      return next;
    });

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KV label={t('monthlyPayment')} value={fmt(schedule.cuota)} highlight />
        <KV label={t('totalInterest')} value={schedule.tieneInteres ? fmt(schedule.totalIntereses) : '—'} />
        <KV label={t('totalPaid')} value={fmt(schedule.totalPagado)} />
      </div>

      {!schedule.tieneInteres && <p className="text-2xs text-gray-600">{t('noInterest')}</p>}

      {/* Barras por año */}
      {schedule.tieneInteres && (
        <div>
          <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">{t('chartTitle')}</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => formatPrice(v, currency)} tick={{ fontSize: 10 }} width={70} />
                <Tooltip formatter={(v) => formatPrice(Number(v) || 0, currency)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey={t('colCapital')} stackId="a" fill={COLOR_CAPITAL} />
                <Bar dataKey={t('colInterest')} stackId="a" fill={COLOR_INTEREST} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Toggle año/mes */}
      <div className="flex gap-2">
        <ToggleBtn active={byYear} onClick={() => setByYear(true)}>{t('viewByYear')}</ToggleBtn>
        <ToggleBtn active={!byYear} onClick={() => setByYear(false)}>{t('viewByMonth')}</ToggleBtn>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-gray-100 overflow-x-auto">
        <div className="max-h-[28rem] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 text-2xs uppercase tracking-wider text-gray-600">
                <th className="px-3 py-2 text-left">{byYear ? t('colYear') : t('colMonth')}</th>
                <th className="px-3 py-2 text-right">{t('colPayment')}</th>
                {schedule.tieneInteres && <th className="px-3 py-2 text-right">{t('colInterest')}</th>}
                <th className="px-3 py-2 text-right">{t('colCapital')}</th>
                <th className="px-3 py-2 text-right">{t('colBalance')}</th>
              </tr>
            </thead>
            <tbody>
              {byYear
                ? annual.map((y, idx) => (
                  <YearRows
                    key={y.anio}
                    y={y}
                    idx={idx}
                    open={openYears.has(y.anio)}
                    onToggle={() => toggleYear(y.anio)}
                    tieneInteres={schedule.tieneInteres}
                    fmt={fmt}
                    yearLabel={t('year', { n: y.anio })}
                  />
                ))
                : schedule.rows.map((r, idx) => (
                  <tr key={r.mes} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 text-gray-700 font-medium">{r.mes}</td>
                    <td className="px-3 py-2 text-right">{fmt(r.cuota)}</td>
                    {schedule.tieneInteres && <td className="px-3 py-2 text-right text-gray-500">{fmt(r.interes)}</td>}
                    <td className="px-3 py-2 text-right font-semibold">{fmt(r.capital)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{fmt(r.saldo)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-2xs text-gray-500 leading-relaxed">{t('disclaimer')}</p>
    </div>
  );
}

function YearRows({
  y, idx, open, onToggle, tieneInteres, fmt, yearLabel,
}: {
  y: AnnualRow; idx: number; open: boolean; onToggle: () => void;
  tieneInteres: boolean; fmt: (n: number) => string; yearLabel: string;
}) {
  const cols = tieneInteres ? 5 : 4;
  return (
    <>
      <tr className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-[#F0FDFA]`} onClick={onToggle}>
        <td className="px-3 py-2 text-gray-800 font-semibold">
          <span className="inline-flex items-center gap-1">
            <ChevronRight size={13} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
            {yearLabel}
          </span>
        </td>
        <td className="px-3 py-2 text-right">{fmt(y.cuota)}</td>
        {tieneInteres && <td className="px-3 py-2 text-right text-gray-500">{fmt(y.interes)}</td>}
        <td className="px-3 py-2 text-right font-semibold">{fmt(y.capital)}</td>
        <td className="px-3 py-2 text-right text-gray-700">{fmt(y.saldoFinal)}</td>
      </tr>
      {open && y.meses.map((r) => (
        <tr key={r.mes} className="bg-[#F8FAFB] text-2xs text-gray-600">
          <td className="pl-8 pr-3 py-1.5">{r.mes}</td>
          <td className="px-3 py-1.5 text-right">{fmt(r.cuota)}</td>
          {tieneInteres && <td className="px-3 py-1.5 text-right">{fmt(r.interes)}</td>}
          <td className="px-3 py-1.5 text-right">{fmt(r.capital)}</td>
          <td className="px-3 py-1.5 text-right">{fmt(r.saldo)}</td>
        </tr>
      ))}
      {/* padding guard: mantiene el colspan consistente si el año no tiene meses */}
      {open && y.meses.length === 0 && <tr><td colSpan={cols} /></tr>}
    </>
  );
}

function KV({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-[#0F1923] text-white' : 'bg-gray-50'}`}>
      <div className={`text-2xs uppercase tracking-wider ${highlight ? 'text-gray-400' : 'text-gray-600'}`}>{label}</div>
      <div className={`text-base font-bold ${highlight ? 'text-propyte-brand' : 'text-[#1A2F3F]'}`}>{value}</div>
    </div>
  );
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
        active ? 'bg-propyte-brand text-[#0F1923] border-propyte-brand' : 'border-gray-200 hover:border-propyte-brand text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Refactor `CorridaFinanciera.tsx` para usar `CorridaCompacta`**

Reemplaza el bloque JSX del schedule (chart + tabla inline + botón showAll, líneas ~120-172 del `<>...</>` de la rama no-contado) por `<CorridaCompacta schedule={activo.schedule!} />`, conservando el header (título/subtítulo), el selector de esquemas, el header de precio, la rama `esContado` y las KV de enganche/financiado. El archivo completo queda:

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { computeEsquema, type EsquemaPago } from '@/lib/esquemas-pago';
import { formatPrice } from '@/lib/formatters';
import CorridaCompacta from './esquemas/CorridaCompacta';

interface CorridaFinancieraProps {
  listPrice: number;
  esquemas: EsquemaPago[];
}

export default function CorridaFinanciera({ listPrice, esquemas }: CorridaFinancieraProps) {
  const t = useTranslations('corrida');
  const ordered = [...esquemas].sort((a, b) => a.orden - b.orden);
  const [selId, setSelId] = useState(ordered.find((e) => e.destacado)?.id ?? ordered[0]?.id);

  const activo = useMemo(() => {
    const e = ordered.find((x) => x.id === selId) ?? ordered[0];
    return e ? computeEsquema(listPrice, e) : null;
  }, [listPrice, selId, ordered]);

  if (ordered.length === 0 || !activo) return null;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-[#2C2C2C]">{t('title')}</h3>
        <p className="text-xs text-gray-600">{t('subtitle')}</p>
      </div>

      {ordered.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('scheme')}</label>
          <div className="flex flex-wrap gap-2">
            {ordered.map((e) => (
              <button
                key={e.id}
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

      <div className="space-y-1">
        {activo.esquema.descuento_pct > 0 ? (
          <div className="flex items-baseline gap-3 flex-wrap">
            <div>
              <div className="text-2xs uppercase tracking-wider text-gray-600">{t('listPrice')}</div>
              <div className="text-sm text-gray-500 line-through">{formatPrice(listPrice)}</div>
            </div>
            <div>
              <div className="text-2xs uppercase tracking-wider text-gray-600">{t('effectivePrice')}</div>
              <div className="text-xl font-bold text-[#1A2F3F]">{formatPrice(activo.precioEfectivo)}</div>
            </div>
            <div>
              <div className="text-2xs uppercase tracking-wider text-gray-600">{t('savings')}</div>
              <div className="text-sm font-semibold text-[#0E7490]">{formatPrice(activo.ahorro)}</div>
            </div>
          </div>
        ) : (
          <div className="text-xl font-bold text-[#1A2F3F]">{formatPrice(activo.precioEfectivo)}</div>
        )}
      </div>

      {activo.esContado ? (
        <div className="rounded-2xl p-6 bg-[#0F1923] text-white">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{t('cash')}</div>
          <div className="text-3xl font-extrabold text-propyte-brand">{formatPrice(activo.precioEfectivo)}</div>
          {activo.ahorro > 0 && (
            <div className="text-sm text-gray-400 mt-2">{t('savings')}: {formatPrice(activo.ahorro)}</div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KV label={t('downPayment')} value={formatPrice(activo.enganche)} note={`${activo.esquema.enganche_pct}%`} />
            <KV label={t('financedAmount')} value={formatPrice(activo.financiado)} />
          </div>
          <CorridaCompacta schedule={activo.schedule!} />
        </>
      )}
    </div>
  );
}

function KV({ label, value, note, highlight }: { label: string; value: string; note?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-[#0F1923] text-white' : 'bg-gray-50'}`}>
      <div className={`text-2xs uppercase tracking-wider ${highlight ? 'text-gray-400' : 'text-gray-600'}`}>{label}</div>
      <div className={`text-base font-bold ${highlight ? 'text-propyte-brand' : 'text-[#1A2F3F]'}`}>{value}</div>
      {note && <div className={`text-2xs ${highlight ? 'text-gray-400' : 'text-gray-600'}`}>{note}</div>}
    </div>
  );
}
```

> Las KV de mensualidad/total intereses se movieron a `CorridaCompacta` (resumen). Aquí quedan solo enganche/financiado.

- [ ] **Step 5: Verificar tipos + paridad i18n**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `node -e "const a=require('./src/i18n/messages/es.json').corrida, b=require('./src/i18n/messages/en.json').corrida; const ka=Object.keys(a).sort(), kb=Object.keys(b).sort(); const miss=ka.filter(k=>!kb.includes(k)).concat(kb.filter(k=>!ka.includes(k))); console.log(miss.length? 'MISMATCH '+miss.join(',') : 'PARITY OK corrida')"`
Expected: `PARITY OK corrida`

- [ ] **Step 6: Commit**

```bash
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(esquemas): CorridaCompacta (barras por año + tabla expandible) + refactor CorridaFinanciera" -- src/app/[locale]/propiedades/_components/esquemas/CorridaCompacta.tsx src/app/[locale]/propiedades/_components/CorridaFinanciera.tsx src/i18n/messages/es.json src/i18n/messages/en.json
```

---

### Task 4: `HipotecarioCalculator` + wiring en `EsquemasDePagoTab`/`UnitDetailPage` + bloque 3 en vivo + i18n `esquemas`

**Files:**
- Create: `src/app/[locale]/propiedades/_components/esquemas/HipotecarioCalculator.tsx`
- Modify: `src/app/[locale]/propiedades/_components/EsquemasDePagoTab.tsx`
- Modify: `src/app/[locale]/propiedades/_components/UnitDetailPage.tsx`
- Modify: `src/i18n/messages/es.json`, `src/i18n/messages/en.json` (namespace `esquemas`)

- [ ] **Step 1: Añadir keys i18n `esquemas` (es)**

En `src/i18n/messages/es.json`, dentro de `"esquemas"`, tras `"schemesLabel": "Esquemas de pago"` (agrega coma a esa línea):

```json
    "schemesLabel": "Esquemas de pago",
    "hipotecarioTitle": "Financiamiento hipotecario",
    "hipotecarioSubtitle": "Corrida estimada del saldo financiado con crédito hipotecario.",
    "perfilLabel": "Perfil del comprador",
    "tasaAnual": "Tasa anual",
    "plazo": "Plazo",
    "plazoAnios": "{n} años",
    "moneda": "Moneda",
    "avisoCambiario": "El crédito para compradores extranjeros se contrata en USD (cross-border). Las mensualidades se muestran en MXN como referencia; el monto real varía con el tipo de cambio.",
    "descargarCotizacion": "Descargar cotización PDF",
    "generandoPdf": "Generando…",
    "pdfError": "No se pudo generar el PDF. Intenta de nuevo."
```

- [ ] **Step 2: Añadir keys i18n `esquemas` (en)**

En `src/i18n/messages/en.json`, dentro de `"esquemas"`, mismo lugar:

```json
    "schemesLabel": "Payment schemes",
    "hipotecarioTitle": "Mortgage financing",
    "hipotecarioSubtitle": "Estimated amortization of the financed balance with a mortgage.",
    "perfilLabel": "Buyer profile",
    "tasaAnual": "Annual rate",
    "plazo": "Term",
    "plazoAnios": "{n} years",
    "moneda": "Currency",
    "avisoCambiario": "Mortgages for foreign buyers are issued in USD (cross-border). Monthly payments are shown in MXN for reference; the actual amount varies with the exchange rate.",
    "descargarCotizacion": "Download quote PDF",
    "generandoPdf": "Generating…",
    "pdfError": "Couldn't generate the PDF. Please try again."
```

- [ ] **Step 3: Crear `HipotecarioCalculator.tsx`**

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Globe, MapPin, AlertTriangle, FileDown, Loader2 } from '@/lib/icons';
import { formatPrice } from '@/lib/formatters';
import type { Nacionalidad, NivelAcabado, InversionInicialResult } from '@/lib/inversion-inicial';
import type { HipotecarioConfig } from '@/lib/hipotecario';
import type { AmortSchedule } from '@/lib/calculator';
import CotizacionBloques, { type Bloque3Data } from './CotizacionBloques';
import CorridaCompacta from './CorridaCompacta';

interface HipotecarioCalculatorProps {
  priceOriginal: number;
  discountPct: number;
  price: number;
  inversion: InversionInicialResult;
  bloque3: Bloque3Data;
  schedule: AmortSchedule;
  config: HipotecarioConfig;
  nacionalidad: Nacionalidad;
  onNacionalidad: (n: Nacionalidad) => void;
  slug: string;
  locale: string;
  mobiliarioNivel: NivelAcabado;
  decoracionNivel: NivelAcabado;
}

export default function HipotecarioCalculator({
  priceOriginal, discountPct, price, inversion, bloque3, schedule, config,
  nacionalidad, onNacionalidad, slug, locale, mobiliarioNivel, decoracionNivel,
}: HipotecarioCalculatorProps) {
  const t = useTranslations('esquemas');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const handlePdf = useCallback(async () => {
    setPdfLoading(true);
    setPdfError(false);
    try {
      const qs = new URLSearchParams({
        slug, locale, perfil: nacionalidad, mob: mobiliarioNivel, dec: decoracionNivel,
      });
      const res = await fetch(`/api/generate-cotizacion-pdf?${qs.toString()}`);
      if (!res.ok) throw new Error(`PDF ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `propyte-cotizacion-${slug}-${nacionalidad}-${locale}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('cotizacion pdf error:', e);
      setPdfError(true);
    } finally {
      setPdfLoading(false);
    }
  }, [slug, locale, nacionalidad, mobiliarioNivel, decoracionNivel]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-[#2C2C2C]">{t('hipotecarioTitle')}</h3>
        <p className="text-xs text-gray-600">{t('hipotecarioSubtitle')}</p>
      </div>

      {/* Selector perfil (mismo estado que escrituración) */}
      <div>
        <label className="block text-2xs font-medium text-gray-600 uppercase tracking-wider mb-2">{t('perfilLabel')}</label>
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => onNacionalidad('nacional')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${nacionalidad === 'nacional' ? 'bg-propyte-brand text-[#0F1923]' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <MapPin size={15} /> {t('nacional')}
          </button>
          <button
            type="button"
            onClick={() => onNacionalidad('extranjero')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${nacionalidad === 'extranjero' ? 'bg-propyte-brand text-[#0F1923]' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Globe size={15} /> {t('extranjero')}
          </button>
        </div>
      </div>

      {/* Chips tasa / plazo / moneda */}
      <div className="grid grid-cols-3 gap-3">
        <Chip label={t('tasaAnual')} value={`${config.tasaAnualPct}%`} />
        <Chip label={t('plazo')} value={t('plazoAnios', { n: Math.round(config.meses / 12) })} />
        <Chip label={t('moneda')} value={config.moneda} />
      </div>

      {config.avisoCambiario && (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-2xs text-amber-800 leading-relaxed">{t('avisoCambiario')}</p>
        </div>
      )}

      <CotizacionBloques
        precio={priceOriginal}
        descuentoPct={discountPct}
        precioVenta={price}
        inversion={inversion}
        bloque3={bloque3}
      />

      <CorridaCompacta schedule={schedule} currency="MXN" />

      <div>
        <button
          type="button"
          onClick={handlePdf}
          disabled={pdfLoading}
          className="inline-flex items-center gap-2 min-h-[44px] px-5 bg-[#0F1923] text-white text-sm font-semibold rounded-lg hover:bg-[#1A2F3F] transition-colors disabled:opacity-60"
        >
          {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          {pdfLoading ? t('generandoPdf') : t('descargarCotizacion')}
        </button>
        {pdfError && <p className="mt-2 text-2xs text-red-600">{t('pdfError')}</p>}
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 text-center">
      <div className="text-2xs uppercase tracking-wider text-gray-600">{label}</div>
      <div className="text-base font-bold text-[#1A2F3F]">{value}</div>
    </div>
  );
}
```

- [ ] **Step 4: Reescribir `EsquemasDePagoTab.tsx` (enganche por perfil + bloque3 + HipotecarioCalculator + props slug/locale)**

```tsx
'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard, Building2, Landmark } from '@/lib/icons';
import { computeInversionInicial, type Nacionalidad, type NivelAcabado } from '@/lib/inversion-inicial';
import { computeHipotecario } from '@/lib/hipotecario';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import InversionInicialCalculator from './esquemas/InversionInicialCalculator';
import CotizacionBloques, { type Bloque3Data } from './esquemas/CotizacionBloques';
import HipotecarioCalculator from './esquemas/HipotecarioCalculator';
import type { EsquemaPago } from '@/lib/esquemas-pago';

interface EsquemasDePagoTabProps {
  price: number;
  priceOriginal: number;
  discountPct: number;
  state: string;
  city: string;
  zone: string | null;
  m2: number;
  tipoEntrega: string | null;
  downPaymentMinPct: number;
  financingMonths: number[];
  interestRateDefault: number;
  esquemas: EsquemaPago[];
  listPrice: number;
  stage: string;
  directo: boolean;
  slug: string;
  locale: string;
}

export default function EsquemasDePagoTab({
  price, priceOriginal, discountPct, city, zone, m2, tipoEntrega,
  downPaymentMinPct, stage, directo, slug, locale,
}: EsquemasDePagoTabProps) {
  const t = useTranslations('esquemas');
  const [nacionalidad, setNacionalidad] = useState<Nacionalidad>('nacional');
  const [mobiliarioNivel, setMobiliarioNivel] = useState<NivelAcabado>('alto');
  const [decoracionNivel, setDecoracionNivel] = useState<NivelAcabado>('standard');

  const hipotecario = useMemo(
    () => computeHipotecario(price, nacionalidad, downPaymentMinPct),
    [price, nacionalidad, downPaymentMinPct],
  );

  const inversion = useMemo(
    () => computeInversionInicial({
      price, engancheMxn: hipotecario.enganche, nacionalidad, m2, city, zone, tipoEntrega, mobiliarioNivel, decoracionNivel,
    }),
    [price, hipotecario.enganche, nacionalidad, m2, city, zone, tipoEntrega, mobiliarioNivel, decoracionNivel],
  );

  const bloque3: Bloque3Data = {
    saldo: hipotecario.saldo,
    mensualidades: hipotecario.config.meses,
    interesPct: hipotecario.config.tasaAnualPct,
    mensualidad: Math.round(hipotecario.schedule.cuota),
  };

  const placeholder = (msg: string) => (
    <div className="space-y-4">
      <CotizacionBloques precio={priceOriginal} descuentoPct={discountPct} precioVenta={price} inversion={inversion} bloque3={null} />
      <p className="text-2xs text-gray-500">{msg}</p>
    </div>
  );

  const items: TabItem[] = [];
  if (stage === 'preventa') {
    items.push({ id: 'preventa', label: t('tabPreventa'), icon: <Building2 size={16} />, panel: placeholder(t('preventaSoon')) });
  }
  if (directo) {
    items.push({ id: 'interno', label: t('tabInterno'), icon: <CreditCard size={16} />, panel: placeholder(t('internoSoon')) });
  }
  items.push({
    id: 'hipotecario',
    label: t('tabHipotecario'),
    icon: <Landmark size={16} />,
    panel: (
      <HipotecarioCalculator
        priceOriginal={priceOriginal}
        discountPct={discountPct}
        price={price}
        inversion={inversion}
        bloque3={bloque3}
        schedule={hipotecario.schedule}
        config={hipotecario.config}
        nacionalidad={nacionalidad}
        onNacionalidad={setNacionalidad}
        slug={slug}
        locale={locale}
        mobiliarioNivel={mobiliarioNivel}
        decoracionNivel={decoracionNivel}
      />
    ),
  });

  return (
    <div className="space-y-6">
      <InversionInicialCalculator
        price={price} priceOriginal={priceOriginal} discountPct={discountPct}
        nacionalidad={nacionalidad} onNacionalidad={setNacionalidad}
        mobiliarioNivel={mobiliarioNivel} onMobiliarioNivel={setMobiliarioNivel}
        decoracionNivel={decoracionNivel} onDecoracionNivel={setDecoracionNivel}
        inversion={inversion}
      />
      <Tabs variant="pill" tablistLabel={t('schemesLabel')} items={items} />
    </div>
  );
}
```

> `state`, `financingMonths`, `interestRateDefault`, `esquemas`, `listPrice` siguen en la interface (los pasa `UnitDetailPage`) pero ya no se desestructuran aquí — igual que antes con `state`. No los borres de la interface.

- [ ] **Step 5: Pasar `slug` y `locale` desde `UnitDetailPage.tsx`**

Primero identifica los identificadores exactos: en `src/app/[locale]/propiedades/_components/UnitDetailPage.tsx`, busca cómo se obtienen el slug y el locale (grep dentro del archivo):

Run: `grep -nE "slug|locale" src/app/[locale]/propiedades/_components/UnitDetailPage.tsx | head -30`

Añade las dos props al `<EsquemasDePagoTab ... />` (bloque ~591-607), usando el identificador de slug/locale que exista en el componente (típicamente `property.slug` y la variable `locale`):

```tsx
                      stage={property.stage}
                      directo={property.financing.directo ?? false}
                      slug={property.slug}
                      locale={locale}
```

Si `property` no expone `slug`, usa el que ya se use para la URL canónica en ese archivo (revisa el grep). Ajusta el nombre exacto según el grep — no inventes.

- [ ] **Step 6: Verificar tipos + paridad i18n**

Run: `npx tsc --noEmit`
Expected: sin errores. (Si `property.slug` no existe, tsc lo marca → usa el identificador correcto del Step 5.)

Run: `node -e "const a=require('./src/i18n/messages/es.json').esquemas, b=require('./src/i18n/messages/en.json').esquemas; const ka=Object.keys(a).sort(), kb=Object.keys(b).sort(); const miss=ka.filter(k=>!kb.includes(k)).concat(kb.filter(k=>!ka.includes(k))); console.log(miss.length? 'MISMATCH '+miss.join(',') : 'PARITY OK esquemas')"`
Expected: `PARITY OK esquemas`

- [ ] **Step 7: Verificación runtime (probe SSR del panel nacional)**

`Tabs` renderiza solo el panel activo. Para SSR-renderizar Hipotecario sin data sembrada, crea un probe temporal `src/app/[locale]/_probe-esquemas/page.tsx`:

```tsx
import EsquemasDePagoTab from '../propiedades/_components/EsquemasDePagoTab';

export const dynamic = 'force-static';

export default function ProbeEsquemas() {
  return (
    <EsquemasDePagoTab
      price={5_000_000}
      priceOriginal={5_000_000}
      discountPct={0}
      state="Quintana Roo"
      city="Tulum"
      zone="Aldea Zamá"
      m2={80}
      tipoEntrega={null}
      downPaymentMinPct={20}
      financingMonths={[120]}
      interestRateDefault={9.5}
      esquemas={[]}
      listPrice={5_000_000}
      stage="entrega"
      directo={false}
      slug="probe"
      locale="es"
    />
  );
}
```

Con `stage="entrega"` y `directo=false`, el único tab es Hipotecario → activo → SSR. Perfil default = nacional (10.5%, 240 meses, enganche 20% = 1,000,000 → saldo 4,000,000).

Build (env real copiado en el worktree) y arranca:

```bash
npm run build && (npm start >/tmp/next-probe.log 2>&1 &) && sleep 6
curl -s http://localhost:3000/es/_probe-esquemas > /tmp/probe.html
```

Verifica que el HTML tenga el bloque 3 en vivo y la corrida (no placeholder). Cálculo francés esperado (saldo 4,000,000; 10.5%/12=0.00875; 240 meses): mensualidad ≈ **$39,933 MXN**.

```bash
grep -c "10.50%" /tmp/probe.html; grep -c "39,933\|39,932\|39,934" /tmp/probe.html; grep -c "bloque3Placeholder\|Se define según" /tmp/probe.html
```
Expected: primeras dos > 0 (tasa e importe presentes), la tercera = 0 (bloque 3 NO es placeholder).

Detén el server y **elimina el probe**:
```bash
pkill -f "next start" 2>/dev/null; rm -f src/app/[locale]/_probe-esquemas/page.tsx; rmdir "src/app/[locale]/_probe-esquemas" 2>/dev/null || true
```

> El probe NUNCA se comitea (stageas rutas explícitas). Confirma que se borró: `ls "src/app/[locale]/_probe-esquemas" 2>/dev/null || echo "probe removido"`.

- [ ] **Step 8: Commit**

```bash
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(esquemas): sub-pestaña Hipotecario (selector Nac/Ext + bloque 3 en vivo + corrida)" -- "src/app/[locale]/propiedades/_components/esquemas/HipotecarioCalculator.tsx" "src/app/[locale]/propiedades/_components/EsquemasDePagoTab.tsx" "src/app/[locale]/propiedades/_components/UnitDetailPage.tsx" src/i18n/messages/es.json src/i18n/messages/en.json
```

---

### Task 5: `CotizacionPDFDocument` + i18n `cotizacionPdf`

**Files:**
- Create: `src/lib/pdf/CotizacionPDFDocument.tsx`
- Modify: `src/i18n/messages/es.json`, `src/i18n/messages/en.json` (namespace nuevo `cotizacionPdf`)

- [ ] **Step 1: Añadir namespace `cotizacionPdf` (es)**

En `src/i18n/messages/es.json`, añade el namespace nuevo **justo después** del cierre de `"pdf": { ... }` (antes de `"share"`). Añade coma tras el `}` de `pdf`:

```json
  "cotizacionPdf": {
    "docType": "Cotización",
    "corridaTitle": "Corrida por año",
    "colYear": "Año",
    "colPayment": "Cuota anual",
    "colInterest": "Interés",
    "colCapital": "Capital",
    "colBalance": "Saldo",
    "totalInterest": "Total intereses",
    "totalPaid": "Total pagado",
    "perfilNacional": "Comprador nacional",
    "perfilExtranjero": "Comprador extranjero",
    "tasaPlazo": "{rate}% anual · {months} meses",
    "avisoCambiario": "Crédito en USD (cross-border). Montos en MXN como referencia; el real varía con el tipo de cambio.",
    "disclaimer": "Cotización estimada con fines informativos. No constituye oferta de crédito ni sustituye la propuesta formal del desarrollador o banco.",
    "generatedOn": "Generado",
    "scan": "Escanea para ver online"
  },
```

- [ ] **Step 2: Añadir namespace `cotizacionPdf` (en)**

En `src/i18n/messages/en.json`, mismo lugar:

```json
  "cotizacionPdf": {
    "docType": "Quote",
    "corridaTitle": "Yearly schedule",
    "colYear": "Year",
    "colPayment": "Yearly payment",
    "colInterest": "Interest",
    "colCapital": "Principal",
    "colBalance": "Balance",
    "totalInterest": "Total interest",
    "totalPaid": "Total paid",
    "perfilNacional": "National buyer",
    "perfilExtranjero": "Foreign buyer",
    "tasaPlazo": "{rate}% annual · {months} months",
    "avisoCambiario": "USD (cross-border) loan. Amounts in MXN for reference; the actual amount varies with the exchange rate.",
    "disclaimer": "Estimated quote for informational purposes. Not a credit offer and does not replace the developer's or bank's formal proposal.",
    "generatedOn": "Generated",
    "scan": "Scan to view online"
  },
```

- [ ] **Step 3: Crear `CotizacionPDFDocument.tsx`**

```tsx
import {
  Document, Page, Text, View, StyleSheet, Image, Link,
} from '@react-pdf/renderer';

export interface CotizacionPDFAnnualRow {
  anio: number;
  cuota: number;
  interes: number;
  capital: number;
  saldoFinal: number;
}

export interface CotizacionPDFLabels {
  docType: string;
  // bloques (reusados del namespace esquemas)
  bloquePrecio: string; precio: string; descuento: string; precioVenta: string;
  bloqueInversion: string; enganche: string; escrituracion: string; mobiliario: string;
  decoracion: string; incluido: string; inversionInicial: string;
  bloqueSaldo: string; saldo: string; mensualidades: string; interes: string; mensualidad: string;
  // corrida + chrome (namespace cotizacionPdf)
  corridaTitle: string; colYear: string; colPayment: string; colInterest: string; colCapital: string; colBalance: string;
  totalInterest: string; totalPaid: string;
  perfil: string;      // "Comprador nacional" / "Comprador extranjero"
  tasaPlazo: string;   // "10.5% anual · 240 meses"
  avisoCambiario: string | null;
  disclaimer: string; generatedOn: string; scan: string;
}

export interface CotizacionPDFData {
  name: string;
  url: string;
  city: string;
  zone: string;
  state: string;
  locale: 'es' | 'en';
  generatedAt: string;
  precio: number;
  descuentoPct: number;
  precioVenta: number;
  enganche: number;
  enganchePct: number;
  escrituracion: number;
  mobiliario: number;
  decoracion: number;
  mobiliarioIncluido: boolean;
  decoracionIncluido: boolean;
  inversionTotal: number;
  saldo: number;
  mensualidades: number;
  interesPct: number;
  mensualidad: number;
  totalIntereses: number;
  totalPagado: number;
  tieneInteres: boolean;
  annual: CotizacionPDFAnnualRow[];
  qrCodeDataUrl: string;
  labels: CotizacionPDFLabels;
}

const C = {
  teal: '#5CE0D2', tealInk: '#0E7490', navy: '#1A2F3F', aztec: '#0F1923',
  ink: '#2C2C2C', muted: '#6B7280', faint: '#9CA3AF', hair: '#E8ECEF',
  surface: '#F4F6F8', amberBg: '#FFFBEB', amberBorder: '#FDE68A', amberInk: '#92400E',
};

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: C.ink, paddingTop: 36, paddingHorizontal: 40, paddingBottom: 64 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  brandLockup: { flexDirection: 'row', alignItems: 'center' },
  brandMark: { width: 14, height: 14, borderRadius: 4, backgroundColor: C.teal, marginRight: 7 },
  brandWord: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: C.navy, letterSpacing: 0.3 },
  docType: { fontSize: 8, color: C.faint, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1.4 },
  rule: { height: 1, backgroundColor: C.hair, marginBottom: 16 },
  h1: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 4, lineHeight: 1.15 },
  location: { fontSize: 10, color: C.muted, marginBottom: 14 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.aztec, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 14 },
  profileLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  profileMeta: { fontSize: 10, color: C.teal, fontFamily: 'Helvetica-Bold' },

  blocksRow: { flexDirection: 'row', marginBottom: 16 },
  block: { flex: 1, borderWidth: 1, borderColor: C.hair, borderRadius: 8, padding: 10, marginRight: 8 },
  blockLast: { flex: 1, borderWidth: 1, borderColor: C.hair, borderRadius: 8, padding: 10 },
  blockTitle: { fontSize: 7.5, color: C.faint, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'Helvetica-Bold', marginBottom: 7 },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  kvLabel: { fontSize: 8.5, color: C.muted },
  kvValue: { fontSize: 8.5, color: C.ink },
  kvTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: C.hair },
  kvTotalLabel: { fontSize: 9, color: C.tealInk, fontFamily: 'Helvetica-Bold' },
  kvTotalValue: { fontSize: 9, color: C.tealInk, fontFamily: 'Helvetica-Bold' },

  aviso: { flexDirection: 'row', backgroundColor: C.amberBg, borderWidth: 1, borderColor: C.amberBorder, borderRadius: 6, padding: 8, marginBottom: 14 },
  avisoText: { fontSize: 7.5, color: C.amberInk, lineHeight: 1.4 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTick: { width: 3, height: 12, borderRadius: 2, backgroundColor: C.teal, marginRight: 8 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.navy },

  summaryRow: { flexDirection: 'row', marginBottom: 12 },
  summaryCard: { flex: 1, backgroundColor: C.surface, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 11, marginRight: 8 },
  summaryCardLast: { flex: 1, backgroundColor: C.surface, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 11 },
  summaryLabel: { fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  summaryValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.tealInk },

  table: { borderWidth: 1, borderColor: C.hair, borderRadius: 8, overflow: 'hidden' },
  tHead: { flexDirection: 'row', backgroundColor: C.surface },
  tRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.hair },
  th: { fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'Helvetica-Bold', paddingVertical: 5, paddingHorizontal: 6 },
  td: { fontSize: 8, color: C.ink, paddingVertical: 4, paddingHorizontal: 6 },
  colYear: { width: '16%' },
  colNum: { width: '21%', textAlign: 'right' },

  disclaimer: { fontSize: 7, color: C.faint, lineHeight: 1.4, marginTop: 10 },
  footer: { position: 'absolute', bottom: 28, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: C.hair, paddingTop: 10 },
  footerInfo: { flex: 1, paddingRight: 16 },
  footerBrand: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 3 },
  footerLine: { fontSize: 8, color: C.muted, marginBottom: 2 },
  footerRight: { alignItems: 'center' },
  qr: { width: 58, height: 58 },
  qrLabel: { fontSize: 6.5, color: C.faint, textAlign: 'center', marginTop: 3, maxWidth: 64 },
});

const fmt = (n: number) =>
  `${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)} MXN`;

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

export function CotizacionPDFDocument({ data }: { data: CotizacionPDFData }) {
  const L = data.labels;
  return (
    <Document title={`${data.name} — ${L.docType} — Propyte`} author="Propyte" creator="Propyte" subject={L.docType}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.brandLockup}>
            <View style={styles.brandMark} />
            <Text style={styles.brandWord}>propyte</Text>
          </View>
          <Text style={styles.docType}>{L.docType}</Text>
        </View>
        <View style={styles.rule} />

        <Text style={styles.h1}>{data.name}</Text>
        <Text style={styles.location}>
          {data.zone ? `${data.zone}, ` : ''}{data.city}{data.state ? `, ${data.state}` : ''}
        </Text>

        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>{L.perfil}</Text>
          <Text style={styles.profileMeta}>{L.tasaPlazo}</Text>
        </View>

        {/* 3 bloques */}
        <View style={styles.blocksRow}>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>{L.bloquePrecio}</Text>
            <KV label={L.precio} value={fmt(data.precio)} />
            {data.descuentoPct > 0 && <KV label={L.descuento} value={`-${data.descuentoPct}%`} />}
            <View style={styles.kvTotalRow}>
              <Text style={styles.kvTotalLabel}>{L.precioVenta}</Text>
              <Text style={styles.kvTotalValue}>{fmt(data.precioVenta)}</Text>
            </View>
          </View>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>{L.bloqueInversion}</Text>
            <KV label={`${L.enganche} (${data.enganchePct}%)`} value={fmt(data.enganche)} />
            <KV label={L.escrituracion} value={fmt(data.escrituracion)} />
            <KV label={L.mobiliario} value={data.mobiliarioIncluido ? L.incluido : fmt(data.mobiliario)} />
            <KV label={L.decoracion} value={data.decoracionIncluido ? L.incluido : fmt(data.decoracion)} />
            <View style={styles.kvTotalRow}>
              <Text style={styles.kvTotalLabel}>{L.inversionInicial}</Text>
              <Text style={styles.kvTotalValue}>{fmt(data.inversionTotal)}</Text>
            </View>
          </View>
          <View style={styles.blockLast}>
            <Text style={styles.blockTitle}>{L.bloqueSaldo}</Text>
            <KV label={L.saldo} value={fmt(data.saldo)} />
            <KV label={L.mensualidades} value={String(data.mensualidades)} />
            <KV label={L.interes} value={`${data.interesPct.toFixed(2)}%`} />
            <View style={styles.kvTotalRow}>
              <Text style={styles.kvTotalLabel}>{L.mensualidad}</Text>
              <Text style={styles.kvTotalValue}>{fmt(data.mensualidad)}</Text>
            </View>
          </View>
        </View>

        {data.avisoCambiario && (
          <View style={styles.aviso}>
            <Text style={styles.avisoText}>{data.avisoCambiario}</Text>
          </View>
        )}

        {/* Resumen corrida */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{L.mensualidad}</Text>
            <Text style={styles.summaryValue}>{fmt(data.mensualidad)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{L.totalInterest}</Text>
            <Text style={styles.summaryValue}>{data.tieneInteres ? fmt(data.totalIntereses) : '—'}</Text>
          </View>
          <View style={styles.summaryCardLast}>
            <Text style={styles.summaryLabel}>{L.totalPaid}</Text>
            <Text style={styles.summaryValue}>{fmt(data.totalPagado)}</Text>
          </View>
        </View>

        {/* Corrida por año */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionTick} />
          <Text style={styles.sectionTitle}>{L.corridaTitle}</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.tHead} fixed>
            <Text style={[styles.th, styles.colYear]}>{L.colYear}</Text>
            <Text style={[styles.th, styles.colNum]}>{L.colPayment}</Text>
            <Text style={[styles.th, styles.colNum]}>{L.colInterest}</Text>
            <Text style={[styles.th, styles.colNum]}>{L.colBalance}</Text>
          </View>
          {data.annual.map((y) => (
            <View style={styles.tRow} key={y.anio} wrap={false}>
              <Text style={[styles.td, styles.colYear]}>{`${L.colYear} ${y.anio}`}</Text>
              <Text style={[styles.td, styles.colNum]}>{fmt(y.cuota)}</Text>
              <Text style={[styles.td, styles.colNum]}>{fmt(y.interes)}</Text>
              <Text style={[styles.td, styles.colNum]}>{fmt(y.saldoFinal)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>{L.disclaimer}</Text>

        <View style={styles.footer} fixed>
          <View style={styles.footerInfo}>
            <Text style={styles.footerBrand}>Propyte · Tu aliado en bienes raíces</Text>
            <Link src={data.url}><Text style={styles.footerLine}>{data.url.replace(/^https?:\/\//, '')}</Text></Link>
            <Text style={styles.footerLine}>{L.generatedOn} {data.generatedAt}</Text>
          </View>
          <View style={styles.footerRight}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image (PDF), not DOM img */}
            <Image src={data.qrCodeDataUrl} style={styles.qr} />
            <Text style={styles.qrLabel}>{L.scan}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 4: Verificar tipos + paridad i18n**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `node -e "const a=require('./src/i18n/messages/es.json').cotizacionPdf, b=require('./src/i18n/messages/en.json').cotizacionPdf; const ka=Object.keys(a).sort(), kb=Object.keys(b).sort(); const miss=ka.filter(k=>!kb.includes(k)).concat(kb.filter(k=>!ka.includes(k))); console.log(miss.length? 'MISMATCH '+miss.join(',') : 'PARITY OK cotizacionPdf')"`
Expected: `PARITY OK cotizacionPdf`

- [ ] **Step 5: Commit**

```bash
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(pdf): CotizacionPDFDocument (3 bloques + corrida por año) + i18n cotizacionPdf" -- src/lib/pdf/CotizacionPDFDocument.tsx src/i18n/messages/es.json src/i18n/messages/en.json
```

---

### Task 6: Endpoint `/api/generate-cotizacion-pdf` (recompute server-side)

**Files:**
- Create: `src/app/api/generate-cotizacion-pdf/route.ts`

- [ ] **Step 1: Crear el route**

Espeja el patrón de `src/app/api/generate-pdf/route.ts` (rate limit, supabase público, getUnitBySlug + mapUnitToProperty, QR, renderToStream). Recomputa con las libs puras.

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import type { DocumentProps } from '@react-pdf/renderer';
import { renderToStream } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getUnitBySlug } from '@/lib/supabase/queries';
import { mapUnitToProperty, type UnitRow } from '@/lib/mappers/unit-to-property';
import { computeInversionInicial, type Nacionalidad, type NivelAcabado } from '@/lib/inversion-inicial';
import { computeHipotecario, type PerfilHipotecario } from '@/lib/hipotecario';
import { aggregateByYear } from '@/lib/corrida-anual';
import {
  CotizacionPDFDocument, type CotizacionPDFData, type CotizacionPDFLabels,
} from '@/lib/pdf/CotizacionPDFDocument';
import { createElement, type ReactElement } from 'react';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const RL = { bucket: 'generate-cotizacion-pdf', limit: 5, windowMs: 60_000 };

const isLocale = (s: string | null): s is 'es' | 'en' => s === 'es' || s === 'en';
const isPerfil = (s: string | null): s is PerfilHipotecario => s === 'nacional' || s === 'extranjero';
const isNivel = (s: string | null): s is NivelAcabado => s === 'standard' || s === 'alto' || s === 'premium';

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, RL);
  if (limited) return limited;

  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  const perfilParam = url.searchParams.get('perfil');
  const localeParam = url.searchParams.get('locale');
  const mobParam = url.searchParams.get('mob');
  const decParam = url.searchParams.get('dec');

  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  const perfil: PerfilHipotecario = isPerfil(perfilParam) ? perfilParam : 'nacional';
  const locale: 'es' | 'en' = isLocale(localeParam) ? localeParam : 'es';
  const mobiliarioNivel: NivelAcabado = isNivel(mobParam) ? mobParam : 'alto';
  const decoracionNivel: NivelAcabado = isNivel(decParam) ? decParam : 'standard';

  const supabase = createPublicSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'no supabase' }, { status: 500 });

  try {
    let row: UnitRow | null = null;
    try {
      const { data } = await getUnitBySlug(supabase, slug);
      if (data) row = data as UnitRow;
    } catch { /* not found */ }
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const property = mapUnitToProperty(row);
    const price = property.price.mxn;
    const priceOriginal = property.priceOriginal ?? price;
    const discountPct = property.discount?.pct ?? 0;

    const hip = computeHipotecario(price, perfil, property.financing.downPaymentMin);
    const inv = computeInversionInicial({
      price,
      engancheMxn: hip.enganche,
      nacionalidad: perfil as Nacionalidad,
      m2: property.specs.area,
      city: property.location.city,
      zone: property.location.zone,
      tipoEntrega: property.specs.tipoEntrega ?? null,
      mobiliarioNivel,
      decoracionNivel,
    });
    const annual = aggregateByYear(hip.schedule.rows).map((y) => ({
      anio: y.anio, cuota: y.cuota, interes: y.interes, capital: y.capital, saldoFinal: y.saldoFinal,
    }));

    const propertyUrl = `https://propyte.com/${locale}/propiedades/${slug}`;
    const qr = await QRCode.toDataURL(propertyUrl, { margin: 1, width: 200 });

    const tE = await getTranslations({ locale, namespace: 'esquemas' });
    const tC = await getTranslations({ locale, namespace: 'cotizacionPdf' });

    const labels: CotizacionPDFLabels = {
      docType: tC('docType'),
      bloquePrecio: tE('bloquePrecio'), precio: tE('precio'), descuento: tE('descuento'), precioVenta: tE('precioVenta'),
      bloqueInversion: tE('bloqueInversion'), enganche: tE('enganche'), escrituracion: tE('escrituracion'),
      mobiliario: tE('mobiliario'), decoracion: tE('decoracion'), incluido: tE('incluido'), inversionInicial: tE('inversionInicial'),
      bloqueSaldo: tE('bloqueSaldo'), saldo: tE('saldo'), mensualidades: tE('mensualidades'), interes: tE('interes'), mensualidad: tE('mensualidad'),
      corridaTitle: tC('corridaTitle'), colYear: tC('colYear'), colPayment: tC('colPayment'),
      colInterest: tC('colInterest'), colCapital: tC('colCapital'), colBalance: tC('colBalance'),
      totalInterest: tC('totalInterest'), totalPaid: tC('totalPaid'),
      perfil: perfil === 'extranjero' ? tC('perfilExtranjero') : tC('perfilNacional'),
      tasaPlazo: tC('tasaPlazo', { rate: hip.config.tasaAnualPct, months: hip.config.meses }),
      avisoCambiario: hip.config.avisoCambiario ? tC('avisoCambiario') : null,
      disclaimer: tC('disclaimer'), generatedOn: tC('generatedOn'), scan: tC('scan'),
    };

    const data: CotizacionPDFData = {
      name: property.name,
      url: propertyUrl,
      city: property.location.city,
      zone: property.location.zone,
      state: property.location.state,
      locale,
      generatedAt: new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      precio: priceOriginal,
      descuentoPct: discountPct,
      precioVenta: price,
      enganche: inv.enganche,
      enganchePct: hip.enganchePct,
      escrituracion: inv.escrituracion,
      mobiliario: inv.mobiliario,
      decoracion: inv.decoracion,
      mobiliarioIncluido: inv.mobiliarioIncluido,
      decoracionIncluido: inv.decoracionIncluido,
      inversionTotal: inv.total,
      saldo: hip.saldo,
      mensualidades: hip.config.meses,
      interesPct: hip.config.tasaAnualPct,
      mensualidad: Math.round(hip.schedule.cuota),
      totalIntereses: Math.round(hip.schedule.totalIntereses),
      totalPagado: Math.round(hip.schedule.totalPagado),
      tieneInteres: hip.schedule.tieneInteres,
      annual,
      qrCodeDataUrl: qr,
      labels,
    };

    const doc = createElement(CotizacionPDFDocument, { data }) as unknown as ReactElement<DocumentProps>;
    const stream = await renderToStream(doc);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    const safeName = property.name.replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 60);

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="propyte-cotizacion-${safeName}-${perfil}-${locale}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('generate-cotizacion-pdf failed:', err);
    return NextResponse.json({ error: 'pdf generation failed' }, { status: 500 });
  }
}
```

> Antes de escribir, confirma las firmas reales: `getUnitBySlug(supabase, slug)` devuelve `{ data }` (ya usado en generate-pdf); `mapUnitToProperty(row)` expone `price.mxn`, `priceOriginal`, `discount.pct`, `financing.downPaymentMin`, `specs.area`, `specs.tipoEntrega`, `location.{city,zone,state}`, `name`. Si algún path difiere, ajústalo (revisa `src/lib/mappers/unit-to-property.ts`).

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Verificación runtime real (curl al endpoint, ambos perfiles)**

Necesita un slug de unidad real. Obtén uno:

```bash
node -e "const{createClient}=require('@supabase/supabase-js');require('dotenv').config({path:'.env'});const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.SUPABASE_ANON_KEY;const c=createClient(u,k);c.from('v_units').select('slug').limit(1).then(r=>console.log('SLUG='+(r.data?.[0]?.slug||'NONE'),r.error||''))"
```

Si no hay `.env` cargable así, obtén el slug desde el Hub/Supabase MCP o pregunta a Luis. Con `SLUG` en mano:

```bash
npm run build && (npm start >/tmp/next-cot.log 2>&1 &) && sleep 6
for P in nacional extranjero; do
  code=$(curl -s -o "/tmp/cot-$P.pdf" -w "%{http_code} %{content_type} %{size_download}" "http://localhost:3000/api/generate-cotizacion-pdf?slug=$SLUG&locale=es&perfil=$P&mob=alto&dec=standard")
  echo "$P -> $code"
  head -c4 "/tmp/cot-$P.pdf" | grep -q "%PDF" && echo "$P: PDF OK" || echo "$P: NOT A PDF"
done
pkill -f "next start" 2>/dev/null
```
Expected por perfil: `200 application/pdf <bytes>>5000` y `PDF OK`. Extranjero debe generar 360 filas mensuales → 30 filas anuales (no satura). Si algún perfil da 500, revisa `/tmp/next-cot.log`.

- [ ] **Step 4: Commit**

```bash
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(pdf): endpoint /api/generate-cotizacion-pdf (recompute server-side, espejo de pantalla)" -- src/app/api/generate-cotizacion-pdf/route.ts
```

---

### Task 7: Revisión holística + build completo + verificación final

**Files:** ninguno nuevo (solo verificación; correcciones inline si algo falla).

- [ ] **Step 1: Typecheck completo**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 2: Lint de archivos tocados**

Run: `npx eslint "src/lib/hipotecario.ts" "src/lib/corrida-anual.ts" "src/lib/pdf/CotizacionPDFDocument.tsx" "src/app/[locale]/propiedades/_components/esquemas/CorridaCompacta.tsx" "src/app/[locale]/propiedades/_components/esquemas/HipotecarioCalculator.tsx" "src/app/[locale]/propiedades/_components/EsquemasDePagoTab.tsx" "src/app/[locale]/propiedades/_components/CorridaFinanciera.tsx" "src/app/api/generate-cotizacion-pdf/route.ts"`
Expected: sin errores (warnings preexistentes tolerables).

- [ ] **Step 3: Build completo (env real)**

Run: `npm run build`
Expected: build verde; `/api/generate-cotizacion-pdf` aparece como ruta dinámica (ƒ).

- [ ] **Step 4: Paridad i18n global (los 3 namespaces)**

Run:
```bash
node -e "
const es=require('./src/i18n/messages/es.json'), en=require('./src/i18n/messages/en.json');
for (const ns of ['esquemas','corrida','cotizacionPdf']) {
  const a=Object.keys(es[ns]||{}).sort(), b=Object.keys(en[ns]||{}).sort();
  const miss=a.filter(k=>!b.includes(k)).concat(b.filter(k=>!a.includes(k)));
  console.log(ns+': '+(miss.length?'MISMATCH '+miss.join(','):'OK'));
}"
```
Expected: `esquemas: OK`, `corrida: OK`, `cotizacionPdf: OK`.

- [ ] **Step 5: Revisión holística (dead-component / imports)**

- Confirmar que `CorridaFinanciera` ya no importa recharts directamente (lo hace vía `CorridaCompacta`) y que ningún archivo importa símbolos borrados.
- Confirmar que el probe SSR (`src/app/[locale]/_probe-esquemas`) fue eliminado y no quedó trackeado: `git status --short` no debe listarlo.
- Confirmar que el enganche por perfil no rompe los tabs placeholder (preventa/interno): renderizan `CotizacionBloques` con `bloque3=null` (placeholder) — correcto.

Run: `git status --short` (debe estar limpio tras los commits de tareas previas)

- [ ] **Step 6: Reporte final (NO push)**

Resumen a Luis: qué se implementó, resultado de tsc/build/curl PDF (ambos perfiles), y recordatorio de que el deploy (`git push origin HEAD:main`) queda pendiente de su OK explícito. Ambos tabs siguen ocultos en prod por `site_visibility`.

---

## Self-Review

**1. Cobertura del spec (§4.4-4.5, §6):**
- §4.5 selector Nac/Ext con sus tasas + recalcula todo → Task 4 (perfil = `nacionalidad` compartido; enganche/escrituración/corrida recomputan). ✅
- §4.2 bloque 3 en vivo (saldo/mensualidades/interés/mensualidad) → Task 4 (`bloque3` desde `computeHipotecario`). ✅
- §6.1 corrida compacta (tabla por año expandible + barras + toggle + resumen; aplica a corrida existente) → Task 3 (`CorridaCompacta` + refactor `CorridaFinanciera`). ✅
- §6.2 PDF espejo de 3 bloques + corrida resumida por año → Tasks 5-6. ✅
- Aviso de riesgo cambiario (extranjero) → Task 4 (pantalla) + Task 5-6 (PDF). ✅

**2. Placeholders:** cada step con código muestra el código completo; comandos con expected output; sin "TBD". El único punto "confírmalo" (Task 4 Step 5 slug/locale, Task 6 Step 1 firmas del mapper) es deliberado — depende de identificadores del repo que el ejecutor debe leer, no inventar; incluye el grep exacto para resolverlo.

**3. Consistencia de tipos:** `computeHipotecario` → `{ config, enganchePct, enganche, saldo, schedule }` usado igual en Task 4 (`hipotecario.config.meses`, `.schedule.cuota`) y Task 6. `aggregateByYear` → `AnnualRow{anio,cuota,interes,capital,saldoFinal,meses}` usado en `CorridaCompacta` (Task 3) y route (Task 6, sin `meses`). `Bloque3Data` (existente) casa con lo que produce Task 4. `HipotecarioConfig` importado por `HipotecarioCalculator` y `hipotecario.ts`. Namespaces i18n: keys nuevas de `esquemas`/`corrida`/`cotizacionPdf` se usan exactamente como se declaran.

**4. Riesgos conocidos:** (a) `Tabs` solo renderiza panel activo → verificación UI vía probe SSR (nacional) + curl PDF (ambos perfiles), no grep del prerender. (b) `property.slug`/`locale` en `UnitDetailPage` — resolver con grep antes de editar. (c) enganche por perfil "contamina" los tabs placeholder preventa/interno con enganche hipotecario — aceptable (ocultos en prod; Slices 4/5 computan el suyo).
