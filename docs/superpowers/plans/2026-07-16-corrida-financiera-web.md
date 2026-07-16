# Corrida Financiera (web) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar en la ficha de unidad de propyte.com una corrida financiera real (tabla de amortización sistema francés: interés alto al inicio, capital alto al final) cuando el desarrollo/unidad tiene financiamiento directo cargado.

**Architecture:** La view `v_units` (ya desplegada) expone términos efectivos `fin_*` (override de la unidad o herencia del desarrollo). El mapper los vuelca a `property.financing`. Una función pura en `@/lib/calculator` arma el cuadro de amortización; un componente nuevo lo renderiza como tab dentro del `UnitInvestmentCalculator` existente, con gate por `fin_directo`.

**Tech Stack:** Next.js 16 (App Router), TypeScript, next-intl v4, recharts 3. **El repo NO tiene runner de unit tests** (vitest no es dep; `tsconfig include:**/*.ts` toma los `.test.ts` y rompe `tsc`/`next build`). Patrón obligatorio: correr el test con `npx vitest run <archivo>`, verificar, y **BORRAR** el archivo de test antes de commitear (ver changelog 2026-07-14 WebMCP/FX).

**Precondición (hecha):** DDL `v_units_financiamiento_efectivo` aplicado en prod `oaijxdpevakashxshhvm`. `v_units` ya expone: `fin_directo`, `fin_hipotecario`, `fin_infonavit`, `fin_fovissste`, `fin_enganche_pct`, `fin_meses_opciones` (int[]), `fin_meses_nota`, `fin_tasa`, `fin_esquema`.

**Contexto de datos:** `getUnitBySlug` (`src/lib/supabase/queries.ts:583`) usa `.select('*')` → los `fin_*` llegan solos; NO se toca `queries.ts`. Supabase serializa NUMERIC como string → coerción `Number()` defensiva en el mapper.

---

### Task 1: Amortización en el calc lib

**Files:**
- Modify: `src/lib/calculator.ts` (agregar exports al final, junto a `calculateMonthlyPayment`)
- Test (temporal, se borra): `src/lib/calculator.amort.test.ts`

- [ ] **Step 1: Escribir el test temporal**

```ts
// src/lib/calculator.amort.test.ts
import { describe, it, expect } from 'vitest';
import { buildAmortizationSchedule, engancheMxn, calculateMonthlyPayment } from './calculator';

describe('engancheMxn', () => {
  it('calcula enganche = precio * pct/100 redondeado', () => {
    expect(engancheMxn(3_000_000, 30)).toBe(900_000);
    expect(engancheMxn(2_500_000, 15)).toBe(375_000);
  });
});

describe('buildAmortizationSchedule (sistema francés)', () => {
  const s = buildAmortizationSchedule(1_000_000, 12, 24); // principal 1M, 12% anual, 24 meses
  it('devuelve una fila por mes', () => expect(s.rows).toHaveLength(24));
  it('cierra el saldo en 0', () => expect(s.rows[23].saldo).toBe(0));
  it('interés decrece y capital crece', () => {
    expect(s.rows[0].interes).toBeGreaterThan(s.rows[23].interes);
    expect(s.rows[0].capital).toBeLessThan(s.rows[23].capital);
  });
  it('interés inicial = saldo * i', () => {
    expect(s.rows[0].interes).toBeCloseTo(1_000_000 * (0.12 / 12), 2);
  });
  it('marca tieneInteres', () => expect(s.tieneInteres).toBe(true));
  it('cuota coincide con calculateMonthlyPayment', () => {
    // calculateMonthlyPayment(price, downPct, months, rate): principal = price*(1-downPct/100)
    const cuotaRef = calculateMonthlyPayment(1_250_000, 20, 24, 12); // principal = 1_000_000
    expect(Math.round(s.cuota)).toBe(Math.round(cuotaRef));
  });
});

describe('buildAmortizationSchedule (0% interés)', () => {
  const s = buildAmortizationSchedule(1_200_000, 0, 12);
  it('cuota = principal / meses', () => expect(s.cuota).toBeCloseTo(100_000, 2));
  it('interés = 0 en todas', () => expect(s.rows.every(r => r.interes === 0)).toBe(true));
  it('tieneInteres = false', () => expect(s.tieneInteres).toBe(false));
  it('cierra saldo en 0', () => expect(s.rows[11].saldo).toBe(0));
});
```

- [ ] **Step 2: Correr el test — debe FALLAR (funciones no existen)**

Run: `cd ~/Projects/Propyte/Next_Propyte_web && npx vitest run src/lib/calculator.amort.test.ts`
Expected: FAIL — `buildAmortizationSchedule`/`engancheMxn` no exportados.

- [ ] **Step 3: Implementar en `src/lib/calculator.ts` (al final del archivo)**

```ts
// ── Amortización (corrida financiera, sistema francés) ──
export function engancheMxn(price: number, downPaymentPct: number): number {
  return Math.round(price * (downPaymentPct / 100));
}

export interface AmortRow {
  mes: number;
  cuota: number;
  interes: number;
  capital: number;
  saldo: number;
}
export interface AmortSchedule {
  rows: AmortRow[];
  cuota: number;
  totalIntereses: number;
  totalPagado: number;
  tieneInteres: boolean;
  principal: number;
}

/**
 * Cuadro de amortización de un principal a `months` con `annualRatePct` anual.
 * Sistema francés (cuota fija): interés = saldo·i, capital = cuota − interés.
 * Interés alto al inicio, capital alto al final. Tasa 0% → cuotas iguales de
 * puro capital (interes=0). El último período fuerza el saldo a 0 (redondeo).
 */
export function buildAmortizationSchedule(
  principal: number,
  annualRatePct: number,
  months: number,
): AmortSchedule {
  const n = Math.max(1, Math.round(months || 0));
  const p = Math.max(0, principal || 0);
  const i = annualRatePct > 0 ? annualRatePct / 100 / 12 : 0;
  const cuota = i === 0 ? p / n : (p * i) / (1 - Math.pow(1 + i, -n));

  const rows: AmortRow[] = [];
  let saldo = p;
  let totalIntereses = 0;
  for (let m = 1; m <= n; m++) {
    const interes = i === 0 ? 0 : saldo * i;
    let capital = cuota - interes;
    if (m === n) capital = saldo; // clamp: cierra saldo en 0
    saldo = Math.max(0, saldo - capital);
    totalIntereses += interes;
    rows.push({ mes: m, cuota: interes + capital, interes, capital, saldo });
  }
  return {
    rows,
    cuota,
    totalIntereses,
    totalPagado: p + totalIntereses,
    tieneInteres: i > 0,
    principal: p,
  };
}
```

- [ ] **Step 4: Correr el test — debe PASAR**

Run: `npx vitest run src/lib/calculator.amort.test.ts`
Expected: PASS (todas).

- [ ] **Step 5: BORRAR el test (obligatorio — vitest no es dep, rompe `tsc`/`build`)**

Run: `rm src/lib/calculator.amort.test.ts`

- [ ] **Step 6: Gate + commit**

Run: `npx tsc --noEmit` → 0 errores nuevos.
```bash
git add src/lib/calculator.ts
git commit -m "feat(calc): buildAmortizationSchedule + engancheMxn para corrida financiera"
```

---

### Task 2: Extender el tipo Property.financing

**Files:**
- Modify: `src/types/property.ts` (interface `Property`, campo `financing`)

- [ ] **Step 1: Localizar el bloque `financing` actual y extenderlo**

Buscar `financing:` en `src/types/property.ts`. Reemplazar por:

```ts
  financing: {
    downPaymentMin: number;   // % enganche efectivo (fin_enganche_pct)
    months: number[];         // opciones de plazo (fin_meses_opciones)
    interestRate: number;     // tasa anual efectiva (fin_tasa)
    /** true si hay financiamiento directo del desarrollador (gate de la corrida) */
    directo?: boolean;
    /** nota libre del plazo, ej. "Hasta entrega de obra" */
    mesesNota?: string;
    /** esquema de pago descriptivo */
    esquema?: string;
    aceptaHipotecario?: boolean;
    aceptaInfonavit?: boolean;
    aceptaFovissste?: boolean;
  };
```

- [ ] **Step 2: Gate — `npx tsc --noEmit`**

Expected: errores SOLO en el mapper (aún no llena los campos nuevos, pero son opcionales → no debería romper). Si hay errores, anotarlos para Task 3.

- [ ] **Step 3: Commit**

```bash
git add src/types/property.ts
git commit -m "feat(types): Property.financing con directo/esquema/mesesNota/creditos"
```

---

### Task 3: Mapear fin_* en unit-to-property

**Files:**
- Modify: `src/lib/mappers/unit-to-property.ts` (interface `UnitRow` + `mapUnitToProperty`)

- [ ] **Step 1: Agregar los campos a `UnitRow`** (después de `financing_interest`, línea ~71)

```ts
  // Financiamiento efectivo (override unidad o herencia del desarrollo) — v_units fin_*
  fin_directo: boolean | null;
  fin_hipotecario: boolean | null;
  fin_infonavit: boolean | null;
  fin_fovissste: boolean | null;
  fin_enganche_pct: number | string | null;
  fin_meses_opciones: number[] | null;
  fin_meses_nota: string | null;
  fin_tasa: number | string | null;
  fin_esquema: string | null;
```

- [ ] **Step 2: Poblar `property.financing` en `mapUnitToProperty`** (reemplazar el objeto `financing:` actual, línea ~300)

```ts
    financing: {
      downPaymentMin: Number(row.fin_enganche_pct) || row.financing_down_payment || 0,
      months:
        Array.isArray(row.fin_meses_opciones) && row.fin_meses_opciones.length > 0
          ? row.fin_meses_opciones
          : row.financing_months || [60, 120, 180, 240],
      interestRate: Number(row.fin_tasa) || row.financing_interest || 0,
      directo: row.fin_directo === true,
      mesesNota: row.fin_meses_nota || undefined,
      esquema: row.fin_esquema || undefined,
      aceptaHipotecario: row.fin_hipotecario === true,
      aceptaInfonavit: row.fin_infonavit === true,
      aceptaFovissste: row.fin_fovissste === true,
    },
```

- [ ] **Step 3: Gate — `npx tsc --noEmit`** → 0 errores nuevos.

- [ ] **Step 4: Verificar datos reales llegan** (script temporal, se borra)

Crear `scripts/_tmp-check-fin.mjs` que consulte `v_units` por un slug con financiamiento y loguee `fin_*`. Correr con `node`. Confirmar que `fin_directo`/`fin_enganche_pct`/`fin_meses_opciones`/`fin_tasa` traen datos. Borrar el script.

Alternativa sin script: `execute_sql` (MCP Supabase) `SELECT slug, fin_directo, fin_enganche_pct, fin_meses_opciones, fin_tasa FROM real_estate_hub.v_units WHERE fin_directo IS TRUE AND approved_at IS NOT NULL LIMIT 5;`

- [ ] **Step 5: Commit**

```bash
git add src/lib/mappers/unit-to-property.ts
git commit -m "feat(mapper): volcar términos de financiamiento efectivos (fin_*) a property.financing"
```

---

### Task 4: Claves i18n de la corrida

**Files:**
- Modify: `messages/es.json`, `messages/en.json` (paridad obligatoria — mismo set de keys)

- [ ] **Step 1: Agregar bloque `corrida` en `es.json`**

```json
"corrida": {
  "tab": "Corrida financiera",
  "title": "Plan de pagos del desarrollador",
  "subtitle": "Amortización estimada del saldo financiado (sistema francés).",
  "term": "Plazo",
  "months": "{m} meses",
  "downPayment": "Enganche",
  "financedAmount": "Monto a financiar",
  "monthlyPayment": "Mensualidad",
  "colMonth": "Mes",
  "colPayment": "Cuota",
  "colInterest": "Interés",
  "colCapital": "Capital",
  "colBalance": "Saldo",
  "totalInterest": "Total intereses",
  "totalPaid": "Total pagado",
  "noInterest": "Sin intereses — cuotas iguales de capital.",
  "showAll": "Ver los {n} meses",
  "showLess": "Ver menos",
  "chartTitle": "Interés vs. capital por período",
  "disclaimer": "Cálculo estimado con fines informativos. No constituye una oferta de crédito ni sustituye la propuesta formal del desarrollador."
}
```

- [ ] **Step 2: Agregar el MISMO bloque traducido en `en.json`**

```json
"corrida": {
  "tab": "Payment schedule",
  "title": "Developer payment plan",
  "subtitle": "Estimated amortization of the financed balance (French system).",
  "term": "Term",
  "months": "{m} months",
  "downPayment": "Down payment",
  "financedAmount": "Amount financed",
  "monthlyPayment": "Monthly payment",
  "colMonth": "Month",
  "colPayment": "Payment",
  "colInterest": "Interest",
  "colCapital": "Principal",
  "colBalance": "Balance",
  "totalInterest": "Total interest",
  "totalPaid": "Total paid",
  "noInterest": "Interest-free — equal principal installments.",
  "showAll": "Show all {n} months",
  "showLess": "Show less",
  "chartTitle": "Interest vs. principal per period",
  "disclaimer": "Estimated figures for informational purposes only. Not a credit offer and does not replace the developer's formal proposal."
}
```

- [ ] **Step 3: Verificar paridad de keys** (mismo número de keys en ambos)

Run: `node -e "const es=require('./messages/es.json').corrida,en=require('./messages/en.json').corrida;const a=Object.keys(es).sort().join(),b=Object.keys(en).sort().join();console.log(a===b?'PARIDAD OK':'DESALINEADO')"`
Expected: `PARIDAD OK`

- [ ] **Step 4: Commit**

```bash
git add messages/es.json messages/en.json
git commit -m "i18n(corrida): claves es/en de la corrida financiera"
```

---

### Task 5: Componente CorridaFinanciera

**Files:**
- Create: `src/app/[locale]/propiedades/_components/CorridaFinanciera.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { buildAmortizationSchedule, engancheMxn } from '@/lib/calculator';
import { formatPrice } from '@/lib/formatters';

const COLOR_CAPITAL = '#5CE0D2';
const COLOR_INTEREST = '#1A2F3F';
const PREVIEW_ROWS = 12;

interface CorridaFinancieraProps {
  price: number;              // precio efectivo (con descuento aplicado)
  downPaymentPct: number;     // fin_enganche_pct
  months: number[];           // fin_meses_opciones
  annualRate: number;         // fin_tasa
  esquema?: string;
}

export default function CorridaFinanciera({
  price, downPaymentPct, months, annualRate, esquema,
}: CorridaFinancieraProps) {
  const t = useTranslations('corrida');
  const termOptions = months.length > 0 ? months : [12];
  const [term, setTerm] = useState(termOptions[0]);
  const [expanded, setExpanded] = useState(false);

  const down = engancheMxn(price, downPaymentPct);
  const principal = Math.max(0, price - down);
  const schedule = useMemo(
    () => buildAmortizationSchedule(principal, annualRate, term),
    [principal, annualRate, term],
  );

  const chartData = useMemo(
    () => schedule.rows.map((r) => ({
      mes: r.mes,
      [t('colCapital')]: Math.round(r.capital),
      [t('colInterest')]: Math.round(r.interes),
    })),
    [schedule, t],
  );

  const visibleRows = expanded ? schedule.rows : schedule.rows.slice(0, PREVIEW_ROWS);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-[#2C2C2C]">{t('title')}</h3>
        <p className="text-xs text-gray-600">{t('subtitle')}</p>
      </div>

      {/* Plazo */}
      {termOptions.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('term')}</label>
          <div className="flex flex-wrap gap-2">
            {termOptions.map((m) => (
              <button
                key={m}
                onClick={() => { setTerm(m); setExpanded(false); }}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  term === m
                    ? 'bg-propyte-brand text-[#0F1923] border-propyte-brand'
                    : 'border-gray-200 hover:border-propyte-brand text-gray-700'
                }`}
              >
                {t('months', { m })}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KV label={t('downPayment')} value={formatPrice(down)} note={`${downPaymentPct}%`} />
        <KV label={t('financedAmount')} value={formatPrice(principal)} />
        <KV label={t('monthlyPayment')} value={formatPrice(Math.round(schedule.cuota))} highlight />
        <KV label={t('totalInterest')} value={schedule.tieneInteres ? formatPrice(Math.round(schedule.totalIntereses)) : '—'} />
      </div>

      {!schedule.tieneInteres && (
        <p className="text-2xs text-gray-600">{t('noInterest')}</p>
      )}

      {/* Gráfica interés vs capital */}
      {schedule.tieneInteres && (
        <div>
          <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">{t('chartTitle')}</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => formatPrice(v)} tick={{ fontSize: 10 }} width={70} />
                <Tooltip formatter={(v) => formatPrice(Number(v) || 0)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey={t('colCapital')} stackId="a" fill={COLOR_CAPITAL} />
                <Bar dataKey={t('colInterest')} stackId="a" fill={COLOR_INTEREST} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-2xs uppercase tracking-wider text-gray-600">
              <th className="px-3 py-2 text-left">{t('colMonth')}</th>
              <th className="px-3 py-2 text-right">{t('colPayment')}</th>
              {schedule.tieneInteres && <th className="px-3 py-2 text-right">{t('colInterest')}</th>}
              <th className="px-3 py-2 text-right">{t('colCapital')}</th>
              <th className="px-3 py-2 text-right">{t('colBalance')}</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r, idx) => (
              <tr key={r.mes} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 text-gray-700 font-medium">{r.mes}</td>
                <td className="px-3 py-2 text-right">{formatPrice(Math.round(r.cuota))}</td>
                {schedule.tieneInteres && (
                  <td className="px-3 py-2 text-right text-gray-500">{formatPrice(Math.round(r.interes))}</td>
                )}
                <td className="px-3 py-2 text-right font-semibold">{formatPrice(Math.round(r.capital))}</td>
                <td className="px-3 py-2 text-right text-gray-700">{formatPrice(Math.round(r.saldo))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {schedule.rows.length > PREVIEW_ROWS && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-sm font-semibold text-[#0E7490] hover:underline"
        >
          {expanded ? t('showLess') : t('showAll', { n: schedule.rows.length })}
        </button>
      )}

      {esquema && <p className="text-2xs text-gray-600 leading-relaxed">{esquema}</p>}
      <p className="text-2xs text-gray-500 leading-relaxed">{t('disclaimer')}</p>
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

- [ ] **Step 2: Gate — `npx tsc --noEmit`** → 0 errores. Verificar que `formatPrice` existe en `@/lib/formatters` (usado por los otros calculadores).

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/propiedades/_components/CorridaFinanciera.tsx"
git commit -m "feat(corrida): componente CorridaFinanciera (tabla + gráfica interés/capital)"
```

---

### Task 6: Integrar la corrida como tab en UnitInvestmentCalculator (con gate)

**Files:**
- Modify: `src/app/[locale]/propiedades/_components/UnitInvestmentCalculator.tsx`
- Verify: `src/app/[locale]/propiedades/_components/UnitDetailPage.tsx` (quién pasa props al calculador)

- [ ] **Step 1: Confirmar el componente vivo y de dónde salen sus props**

Run: `grep -rn "UnitInvestmentCalculator\|FinancialSimulator" "src/app/[locale]/propiedades/_components/UnitDetailPage.tsx"`
Confirmar que `UnitInvestmentCalculator` es el que se monta (no `FinancialSimulator`, posible superseded — regla anti-componente-muerto). Anotar cómo se le pasan `price`, `financingMonths`, etc.

- [ ] **Step 2: Extender props de `UnitInvestmentCalculator`**

En la interface `UnitInvestmentCalculatorProps` agregar:

```ts
  financingDirecto: boolean;
  esquemaPago?: string;
```

Y en la desestructuración del componente agregarlos.

- [ ] **Step 3: Agregar el tab "Corrida" al arreglo `items` de `<Tabs>`** (condicional al gate)

Importar arriba: `import CorridaFinanciera from './CorridaFinanciera';`

Construir el array de items de forma condicional (antes del `return`, o inline con filter). Insertar, después del tab `financiamiento`:

```tsx
            ...(financingDirecto && financingMonths.length > 0 && (downPaymentMinPct || 0) > 0
              ? [{
                  id: 'corrida',
                  label: t('corrida.tab'),
                  icon: <Calculator size={16} />,
                  panel: (
                    <CorridaFinanciera
                      price={price}
                      downPaymentPct={downPaymentMinPct}
                      months={financingMonths}
                      annualRate={interestRateDefault}
                      esquema={esquemaPago}
                    />
                  ),
                }]
              : []),
```

> Nota: `t` aquí es `useTranslations('simulator')`. Para la key `corrida.tab` usar un segundo hook `const tc = useTranslations('corrida')` y `tc('tab')`, o llamar `useTranslations()` raíz. Elegir el que respete el namespace (agregar `const tCorrida = useTranslations('corrida')` y usar `tCorrida('tab')`).

- [ ] **Step 4: Pasar las props nuevas desde `UnitDetailPage.tsx`**

Donde se renderiza `<UnitInvestmentCalculator ... />`, agregar:

```tsx
  financingDirecto={property.financing.directo ?? false}
  esquemaPago={property.financing.esquema}
```

(`property.financing.months`/`downPaymentMin`/`interestRate` ya deberían mapearse a `financingMonths`/`downPaymentMinPct`/`interestRateDefault` — confirmar los nombres exactos en el punto de montaje y reutilizar.)

- [ ] **Step 5: Gate — `npx tsc --noEmit` + `next build`**

Run: `npx tsc --noEmit && npx next build`
Expected: 0 errores; build OK (standalone).

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/propiedades/_components/UnitInvestmentCalculator.tsx" "src/app/[locale]/propiedades/_components/UnitDetailPage.tsx"
git commit -m "feat(corrida): tab de corrida en la ficha de unidad con gate por financiamiento directo"
```

---

### Task 7: Verificación runtime en standalone (build verde ≠ runtime-safe)

**Files:** ninguno (verificación)

- [ ] **Step 1: Construir y correr el standalone local**

Seguir el patrón del changelog (copiar `.next/static` + `public/.` + `.env*` al standalone; `PORT=3200 node server.js`). Windows: matar el proceso con `taskkill //PID` por puerto.

- [ ] **Step 2: Abrir una unidad con financiamiento directo (es/en)**

- El tab "Corrida financiera" aparece SOLO si la unidad/desarrollo tiene `fin_directo=true` + plazos + enganche%.
- La tabla muestra interés decreciente y capital creciente; saldo cierra en 0.
- Cambiar de plazo recalcula.
- Una unidad SIN financiamiento directo NO muestra el tab.
- Verificar en incógnito (evita bundle cacheado; gotcha del changelog).

- [ ] **Step 3: Confirmar 0 errores de runtime** (revisar stderr del standalone — sin `DYNAMIC_SERVER_USAGE` ni 500 en `/propiedades/[slug]`).

---

## Self-review (cobertura del spec)

- Corrida sistema francés, interés-primero → Task 1 + 5. ✓
- Base = precio − enganche → Task 5 (`principal`). ✓
- Tasa 0% sin columna de interés → Task 1 (tieneInteres) + Task 5 (render condicional). ✓
- Solo ficha de unidad → Task 6. ✓
- Gate por financiamiento cargado → Task 6 (condición del tab). ✓
- Términos efectivos (override/herencia) → Task 3 (fin_*). ✓
- i18n es/en → Task 4. ✓
- Precio efectivo con descuento → el `price` que ya recibe el calculador es el efectivo (mapper aplica descuento a `price.mxn`); confirmar en Task 6 Step 4 que se pasa `price.mxn` (post-descuento). ✓

## Notas / riesgos
- **Descuento:** el mapper ya reescribe `price.mxn` al precio con descuento; el calculador usa ese `price` → la corrida sale sobre el precio efectivo, consistente con el comparador. Verificar en Task 6.
- **recharts** ya está en el bundle de la ficha (ZoneAnalytics/simulador) → sin peso nuevo relevante. Si `/propiedades/[slug]` no lo tuviera, considerar `next/dynamic` (patrón del repo).
- **Deploy:** push a `main` → Hostinger auto-deploy. Validar 2 pasadas ~1min post-deploy (500 transitorios del swap, no confundir con regresión).
