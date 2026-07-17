# Esquemas de Pago Múltiples — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) o superpowers:executing-plans. Steps con checkbox (`- [ ]`).

**Goal:** Capturar N esquemas de pago por desarrollo (heredables/override por unidad) y que propyte.com muestre un selector de esquema que recalcula precio efectivo (con el descuento del esquema), enganche y corrida de amortización.

**Architecture:** DDL ya aplicado (`esquemas_pago jsonb` en desarrollo+unidad; `v_units.fin_esquemas_pago` resuelto). Una lib pura por repo parsea el JSONB (tolerante) y calcula por esquema reusando `buildAmortizationSchedule` (web) / `cuotaMensual` (hub). El web evoluciona `CorridaFinanciera` a selector-de-esquemas con fallback al config plano v1; el Hub agrega un editor de lista repetible (`PaymentSchemesEditor`) en el form de Desarrollo y lo integra al override por unidad.

**Tech Stack:** Next.js (web 16 / hub 15), TypeScript, next-intl, recharts. **Web SIN runner de tests** (vitest via `npx` → verificar → BORRAR el `.test.ts`). **Hub CON vitest colocado** (`src/lib/*.test.ts` + `vitest.config.ts` include; el test se queda).

**Precondición (hecha):** `esquemas_pago jsonb` en ambas tablas; `v_units.fin_esquemas_pago` = `CASE WHEN u.financiamiento_propio OR u.id_desarrollo IS NULL THEN u.esquemas_pago ELSE d.esquemas_pago END`. `getUnitBySlug` usa `.select('*')` → `fin_esquemas_pago` llega solo.

**Forma del esquema (idéntica en ambos repos):**
```ts
interface EsquemaPago {
  id: string; label: string; enganche_pct: number; meses: number;
  tasa: number; descuento_pct: number; orden: number; destacado?: boolean;
}
```
`meses = 0` ⇒ contado (sin financiamiento). Descuento sobre precio de LISTA (no el promo).

---

# PARTE A — WEB (`Next_Propyte_web`, worktree `feat/esquemas-pago`)

⚠️ Baseline tsc: 9 errores pre-existentes ambientales (@react-pdf/renderer, sharp) en `api/*/pdf` + `lib/pdf/*` — ignorar. Para `next build` local: `npm install --no-save @react-pdf/renderer sharp`. NO commitear `.test.ts`. Git author `marketing@propyte.com`.

### Task A1: Lib de esquemas (parse + cálculo)

**Files:** Create `src/lib/esquemas-pago.ts`. Test temporal: `src/lib/esquemas-pago.test.ts`.

- [ ] **Step 1: Test temporal**
```ts
import { describe, it, expect } from 'vitest';
import { parseEsquemas, computeEsquema } from './esquemas-pago';

describe('parseEsquemas (tolerante)', () => {
  it('no-array → []', () => expect(parseEsquemas(null)).toEqual([]));
  it('ordena por orden y castea', () => {
    const r = parseEsquemas([{ id:'b', label:'B', orden:2, meses:'12' }, { id:'a', label:'A', orden:1 }]);
    expect(r.map(e => e.id)).toEqual(['a','b']);
    expect(r[1].meses).toBe(12);
  });
});

describe('computeEsquema', () => {
  it('contado (meses 0) aplica descuento, sin corrida', () => {
    const c = computeEsquema(1_000_000, { id:'c', label:'Contado', enganche_pct:0, meses:0, tasa:0, descuento_pct:15, orden:0 });
    expect(c.precioEfectivo).toBe(850_000);
    expect(c.ahorro).toBe(150_000);
    expect(c.esContado).toBe(true);
    expect(c.schedule).toBeNull();
  });
  it('financiado descuenta y amortiza sobre (efectivo − enganche)', () => {
    const c = computeEsquema(1_000_000, { id:'f', label:'12m', enganche_pct:50, meses:12, tasa:0, descuento_pct:10, orden:1 });
    expect(c.precioEfectivo).toBe(900_000);
    expect(c.enganche).toBe(450_000);
    expect(c.financiado).toBe(450_000);
    expect(c.schedule?.rows).toHaveLength(12);
    expect(c.schedule?.tieneInteres).toBe(false);
  });
});
```

- [ ] **Step 2: Correr `npx vitest run src/lib/esquemas-pago.test.ts` → FALLA.**

- [ ] **Step 3: Implementar `src/lib/esquemas-pago.ts`**
```ts
import { buildAmortizationSchedule, type AmortSchedule } from './calculator';

export interface EsquemaPago {
  id: string;
  label: string;
  enganche_pct: number;
  meses: number;
  tasa: number;
  descuento_pct: number;
  orden: number;
  destacado?: boolean;
}

export interface EsquemaComputed {
  esquema: EsquemaPago;
  precioEfectivo: number;
  ahorro: number;
  enganche: number;
  financiado: number;
  esContado: boolean;
  schedule: AmortSchedule | null;
}

/** Parseo tolerante del JSONB de v_units.fin_esquemas_pago (descarta basura, no lanza). */
export function parseEsquemas(raw: unknown): EsquemaPago[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x, i) => ({
      id: String(x.id ?? `sch_${i}`),
      label: String(x.label ?? `Esquema ${i + 1}`),
      enganche_pct: Number(x.enganche_pct) || 0,
      meses: Number(x.meses) || 0,
      tasa: Number(x.tasa) || 0,
      descuento_pct: Number(x.descuento_pct) || 0,
      orden: Number(x.orden) || i,
      destacado: x.destacado === true,
    }))
    .sort((a, b) => a.orden - b.orden);
}

/** Cálculo de un esquema sobre el precio de LISTA de la unidad. */
export function computeEsquema(precioLista: number, e: EsquemaPago): EsquemaComputed {
  const lista = Math.max(0, Number(precioLista) || 0);
  const precioEfectivo = Math.round(lista * (1 - (e.descuento_pct || 0) / 100));
  const ahorro = Math.max(0, lista - precioEfectivo);
  const esContado = !e.meses || e.meses <= 0;
  const enganche = esContado ? precioEfectivo : Math.round(precioEfectivo * (e.enganche_pct || 0) / 100);
  const financiado = esContado ? 0 : Math.max(0, precioEfectivo - enganche);
  const schedule = esContado ? null : buildAmortizationSchedule(financiado, e.tasa || 0, e.meses);
  return { esquema: e, precioEfectivo, ahorro, enganche, financiado, esContado, schedule };
}
```

- [ ] **Step 4: `npx vitest run` → PASA. Step 5: `rm src/lib/esquemas-pago.test.ts`. Step 6: `npx tsc --noEmit` (0 nuevos) + commit** `git add src/lib/esquemas-pago.ts && git -c user.email=marketing@propyte.com commit -m "feat(esquemas): lib parse + computeEsquema"`

### Task A2: Tipo + mapper con fallback

**Files:** Modify `src/types/property.ts`, `src/lib/mappers/unit-to-property.ts`.

- [ ] **Step 1:** En `PropertyFinancing` (property.ts) agrega:
```ts
  /** Esquemas de pago (v2). Si vacío, el UI usa el fallback derivado del config plano. */
  esquemas?: import('@/lib/esquemas-pago').EsquemaPago[];
```

- [ ] **Step 2:** En `UnitRow` (unit-to-property.ts) agrega `fin_esquemas_pago: unknown;` junto a los otros `fin_*`.

- [ ] **Step 3:** En `mapUnitToProperty`, importa `parseEsquemas` y arma `esquemas` con fallback al config plano v1:
```ts
// import arriba:
import { parseEsquemas, type EsquemaPago } from '@/lib/esquemas-pago';

// dentro de la función, antes del return:
const esquemasReales = parseEsquemas(row.fin_esquemas_pago);
const esquemas: EsquemaPago[] = esquemasReales.length > 0
  ? esquemasReales
  : buildFallbackEsquemas(
      row.fin_directo === true,
      Number(row.fin_enganche_pct) || 0,
      Array.isArray(row.fin_meses_opciones) ? row.fin_meses_opciones : [],
      Number(row.fin_tasa) || 0,
    );
```
Y en el objeto `financing:` agrega `esquemas,`. Define el helper (arriba del mapper):
```ts
function buildFallbackEsquemas(
  directo: boolean, engPct: number, mesesOpts: number[], tasa: number,
): EsquemaPago[] {
  const terms = mesesOpts.filter((m) => Number(m) > 0);
  if (!directo && terms.length === 0 && engPct <= 0) return [];
  if (terms.length === 0) {
    return [{ id: 'v1_0', label: 'Financiamiento', enganche_pct: engPct, meses: 0, tasa, descuento_pct: 0, orden: 0 }];
  }
  return terms.map((m, i) => ({
    id: `v1_${m}`, label: `Financiamiento ${m} meses`, enganche_pct: engPct, meses: m, tasa, descuento_pct: 0, orden: i,
  }));
}
```

- [ ] **Step 4:** `npx tsc --noEmit` (0 nuevos) + commit `git add src/types/property.ts src/lib/mappers/unit-to-property.ts && git -c user.email=marketing@propyte.com commit -m "feat(esquemas): mapper fin_esquemas_pago + fallback config plano"`

### Task A3: i18n selector

**Files:** Modify `src/i18n/messages/es.json`, `src/i18n/messages/en.json` (namespace `corrida` ya existe — AGREGA keys, mantén paridad).

- [ ] **Step 1:** En `corrida` de **es.json** agrega: `"scheme": "Esquema de pago"`, `"cash": "Pago de contado"`, `"savings": "Ahorro"`, `"listPrice": "Precio de lista"`, `"effectivePrice": "Precio con este plan"`. En **en.json**: `"scheme": "Payment plan"`, `"cash": "Cash payment"`, `"savings": "Savings"`, `"listPrice": "List price"`, `"effectivePrice": "Price with this plan"`.
- [ ] **Step 2:** Verifica paridad `node -e "const es=require('./src/i18n/messages/es.json').corrida,en=require('./src/i18n/messages/en.json').corrida;console.log(Object.keys(es).sort().join()===Object.keys(en).sort().join()?'OK':'DESALINEADO')"` → `OK`. Commit `git add src/i18n/messages/es.json src/i18n/messages/en.json && git -c user.email=marketing@propyte.com commit -m "i18n(corrida): keys de selector de esquemas"`

### Task A4: CorridaFinanciera → selector de esquemas

**Files:** Modify `src/app/[locale]/propiedades/_components/CorridaFinanciera.tsx`.

Reescribe el componente para recibir `esquemas` + `listPrice` y renderizar selector + el esquema activo. Reusa la tabla/gráfica ya existentes (mueve el cuerpo actual a un sub-render que toma un `EsquemaComputed`).

- [ ] **Step 1:** Cambia la interface de props a:
```ts
interface CorridaFinancieraProps {
  listPrice: number;                 // precio de LISTA (priceOriginal ?? price.mxn)
  esquemas: import('@/lib/esquemas-pago').EsquemaPago[];
}
```
- [ ] **Step 2:** Lógica: `const ordered = [...esquemas].sort((a,b)=>a.orden-b.orden); const [sel, setSel] = useState(ordered.find(e=>e.destacado)?.id ?? ordered[0]?.id);` Si `ordered.length===0` → `return null`. `const activo = computeEsquema(listPrice, ordered.find(e=>e.id===sel) ?? ordered[0]);` (import `computeEsquema`).
- [ ] **Step 3:** Render: (a) botones selector por esquema (label; `destacado` con estilo resaltado); (b) resumen: precio de lista tachado si hay descuento + precio efectivo + ahorro (usa `t('listPrice')`/`t('effectivePrice')`/`t('savings')`); (c) si `activo.esContado` → tarjeta "Pago de contado" (`t('cash')`) con efectivo+ahorro, sin tabla; (d) si no → enganche + la tabla/gráfica de `activo.schedule` (mismo markup que la versión previa, ahora leyendo `activo.schedule` en vez de un `schedule` local). Mantén el estado `expanded` para la tabla larga.
- [ ] **Step 4:** `npx tsc --noEmit` (0 nuevos) + commit `git add "src/app/[locale]/propiedades/_components/CorridaFinanciera.tsx" && git -c user.email=marketing@propyte.com commit -m "feat(esquemas): CorridaFinanciera con selector de esquemas"`

### Task A5: Wiring en UnitInvestmentCalculator + UnitDetailPage

**Files:** Modify `src/app/[locale]/propiedades/_components/UnitInvestmentCalculator.tsx`, `.../UnitDetailPage.tsx`.

- [ ] **Step 1:** En `UnitInvestmentCalculatorProps` reemplaza las props que hoy alimentan el tab corrida (`financingDirecto`, `esquemaPago`) por: `esquemas: import('@/lib/esquemas-pago').EsquemaPago[]` y `listPrice: number`. Ajusta la desestructuración.
- [ ] **Step 2:** El tab `corrida` ahora: gate `esquemas.length > 0`; panel `<CorridaFinanciera listPrice={listPrice} esquemas={esquemas} />`. Quita el paso de `price/downPaymentPct/months/annualRate` al corrida (esos siguen alimentando el tab 'financiamiento' interactivo, que NO se toca).
- [ ] **Step 3:** En `UnitDetailPage.tsx`, donde se renderiza `<UnitInvestmentCalculator>`, cambia las props: `esquemas={property.financing.esquemas ?? []}` y `listPrice={property.priceOriginal ?? property.price.mxn}`.
- [ ] **Step 4:** `npx tsc --noEmit` (0 nuevos) + `npm install --no-save @react-pdf/renderer sharp` + `npx next build` (verde). Commit `git add "src/app/[locale]/propiedades/_components/UnitInvestmentCalculator.tsx" "src/app/[locale]/propiedades/_components/UnitDetailPage.tsx" && git -c user.email=marketing@propyte.com commit -m "feat(esquemas): wiring selector en ficha de unidad"`

---

# PARTE B — HUB (`Propyte_hub`, worktree `feat/esquemas-pago`)

⚠️ Baseline tsc: 2 errores pre-existentes en `tests/hub-to-zoho-mapper.test.ts` — ignorar. NO `npm run lint`. Vitest colocado (test se queda). Git author `marketing@propyte.com`.

### Task B1: Lib de esquemas (Hub) + test

**Files:** Create `src/lib/esquemas-pago.ts` + `src/lib/esquemas-pago.test.ts` (+ agregar al `vitest.config.ts` include).

- [ ] **Step 1: Test**
```ts
import { describe, it, expect } from 'vitest';
import { parseEsquemas, computeEsquemaMontos } from '@/lib/esquemas-pago';

describe('parseEsquemas', () => {
  it('no-array → []', () => expect(parseEsquemas(undefined)).toEqual([]));
  it('castea y ordena', () => {
    const r = parseEsquemas([{ id:'b', orden:2 }, { id:'a', orden:1, enganche_pct:'30' }]);
    expect(r[0].id).toBe('a'); expect(r[0].enganche_pct).toBe(30);
  });
});
describe('computeEsquemaMontos', () => {
  it('contado', () => {
    const m = computeEsquemaMontos(1_000_000, { id:'c', label:'C', enganche_pct:0, meses:0, tasa:0, descuento_pct:15, orden:0 });
    expect(m.precioEfectivo).toBe(850_000); expect(m.mensualidad).toBe(0);
  });
  it('financiado', () => {
    const m = computeEsquemaMontos(1_000_000, { id:'f', label:'F', enganche_pct:50, meses:12, tasa:0, descuento_pct:10, orden:1 });
    expect(m.enganche).toBe(450_000); expect(m.mensualidad).toBe(37_500); // 450000/12
  });
});
```

- [ ] **Step 2:** `npx vitest run src/lib/esquemas-pago.test.ts` → FALLA.

- [ ] **Step 3: Implementar `src/lib/esquemas-pago.ts`** (reusa `cuotaMensual` de finance.ts):
```ts
import { cuotaMensual } from '@/lib/finance';

export interface EsquemaPago {
  id: string; label: string; enganche_pct: number; meses: number;
  tasa: number; descuento_pct: number; orden: number; destacado?: boolean;
}

export function parseEsquemas(raw: unknown): EsquemaPago[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x, i) => ({
      id: String(x.id ?? `sch_${i}`),
      label: String(x.label ?? `Esquema ${i + 1}`),
      enganche_pct: Number(x.enganche_pct) || 0,
      meses: Number(x.meses) || 0,
      tasa: Number(x.tasa) || 0,
      descuento_pct: Number(x.descuento_pct) || 0,
      orden: Number(x.orden) || i,
      destacado: x.destacado === true,
    }))
    .sort((a, b) => a.orden - b.orden);
}

export function computeEsquemaMontos(precioLista: number, e: EsquemaPago) {
  const lista = Math.max(0, Number(precioLista) || 0);
  const precioEfectivo = Math.round(lista * (1 - (e.descuento_pct || 0) / 100));
  const esContado = !e.meses || e.meses <= 0;
  const enganche = esContado ? precioEfectivo : Math.round(precioEfectivo * (e.enganche_pct || 0) / 100);
  const financiado = esContado ? 0 : Math.max(0, precioEfectivo - enganche);
  const mensualidad = esContado ? 0 : Math.round(cuotaMensual(financiado, e.tasa || 0, e.meses));
  return { precioEfectivo, enganche, financiado, mensualidad, esContado };
}
```

- [ ] **Step 4:** agrega `"src/lib/esquemas-pago.test.ts"` al array `include` de `vitest.config.ts`. `npx vitest run src/lib/esquemas-pago.test.ts` → PASA. `npx tsc --noEmit` (2 baseline). Commit `git add src/lib/esquemas-pago.ts src/lib/esquemas-pago.test.ts vitest.config.ts && git -c user.email=marketing@propyte.com commit -m "feat(esquemas): lib parse + computeEsquemaMontos (hub)"`

### Task B2: PaymentSchemesEditor + tipo de campo

**Files:** Create `src/components/common/fields/PaymentSchemesEditor.tsx`. Modify `src/components/common/FieldEditor.tsx`.

- [ ] **Step 1: Crear el editor** (lista repetible; lee `values[fieldKey]` como array, escribe con `setValue`; preview de montos con `precioEjemplo`):
```tsx
"use client";
import { InfoTooltip } from "../InfoTooltip";
import { parseEsquemas, computeEsquemaMontos, type EsquemaPago } from "@/lib/esquemas-pago";

function fmtMxn(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}
const blank = (orden: number): EsquemaPago => ({ id: `sch_${orden}_${Date.now() % 100000}`, label: "", enganche_pct: 0, meses: 0, tasa: 0, descuento_pct: 0, orden });

export function PaymentSchemesEditor({
  label, info, fieldKey, values, setValue, precioEjemplo, readOnly,
}: {
  label: string; info?: string; fieldKey: string;
  values: Record<string, unknown>; setValue: (k: string, v: unknown) => void;
  precioEjemplo: number; readOnly?: boolean;
}) {
  const list = parseEsquemas(values[fieldKey]);
  const update = (i: number, patch: Partial<EsquemaPago>) => {
    const next = list.map((e, j) => (j === i ? { ...e, ...patch } : e));
    setValue(fieldKey, next);
  };
  const add = () => setValue(fieldKey, [...list, blank(list.length)]);
  const remove = (i: number) => setValue(fieldKey, list.filter((_, j) => j !== i).map((e, k) => ({ ...e, orden: k })));

  return (
    <div className="md:col-span-2 space-y-3">
      <span className="text-xs font-medium text-slate-600 inline-flex items-center gap-1.5">
        {label}{info && <InfoTooltip text={info} />}
      </span>
      {list.length === 0 && <div className="text-[11px] text-slate-500">Sin esquemas — se usa el financiamiento simple de abajo.</div>}
      {list.map((e, i) => {
        const m = computeEsquemaMontos(precioEjemplo, e);
        return (
          <div key={e.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
            <div className="flex gap-2 items-center">
              <input value={e.label} onChange={(ev) => update(i, { label: ev.target.value })} placeholder="Nombre del esquema" disabled={readOnly} className="flex-1 h-8 px-2 rounded-lg border border-slate-200 text-sm" />
              {!readOnly && <button type="button" onClick={() => remove(i)} className="text-slate-400 hover:text-red-500 text-sm">Quitar</button>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <NumCell label="Enganche %" v={e.enganche_pct} on={(n) => update(i, { enganche_pct: n })} ro={readOnly} />
              <NumCell label="Meses (0=contado)" v={e.meses} on={(n) => update(i, { meses: n })} ro={readOnly} />
              <NumCell label="Tasa %" v={e.tasa} on={(n) => update(i, { tasa: n })} ro={readOnly} />
              <NumCell label="Descuento %" v={e.descuento_pct} on={(n) => update(i, { descuento_pct: n })} ro={readOnly} />
              <label className="flex items-end gap-1 text-xs text-slate-600 pb-1"><input type="checkbox" checked={e.destacado === true} onChange={(ev) => update(i, { destacado: ev.target.checked })} disabled={readOnly} /> Destacado</label>
            </div>
            <div className="text-[11px] text-slate-500">Ej. con {fmtMxn(precioEjemplo)}: precio {fmtMxn(m.precioEfectivo)} · enganche {fmtMxn(m.enganche)} · {m.esContado ? "contado" : `mensualidad ${fmtMxn(m.mensualidad)}`}</div>
          </div>
        );
      })}
      {!readOnly && <button type="button" onClick={add} className="text-sm font-medium text-[#0D9488] hover:underline">+ Agregar esquema</button>}
    </div>
  );
}

function NumCell({ label, v, on, ro }: { label: string; v: number; on: (n: number) => void; ro?: boolean }) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
      <input type="number" value={Number.isFinite(v) ? v : 0} onChange={(e) => on(e.target.value === "" ? 0 : Number(e.target.value))} disabled={ro} className="w-full h-8 px-2 rounded-lg border border-slate-200 text-sm" />
    </div>
  );
}
```

- [ ] **Step 2: Registrar en FieldEditor**: `FieldType` += `"payment-schemes"`; import; en `renderField`:
```tsx
  if (f.type === "payment-schemes") {
    return (
      <PaymentSchemesEditor key={f.key} label={f.label} info={f.info} fieldKey={f.key}
        values={values} setValue={setValue}
        precioEjemplo={Number(values.precio_mxn) || Number(values.ext_precio_min_mxn) || 1_000_000}
        readOnly={f.readOnly} />
    );
  }
```
(`payment-schemes` es tipo normal para `allKeys`: su `key` = columna real `esquemas_pago`.)

- [ ] **Step 3:** `npx tsc --noEmit` (2 baseline) + commit `git add src/components/common/fields/PaymentSchemesEditor.tsx src/components/common/FieldEditor.tsx && git -c user.email=marketing@propyte.com commit -m "feat(hub): PaymentSchemesEditor + tipo payment-schemes"`

### Task B3: Campo esquemas en el form de Desarrollo

**Files:** Modify `src/lib/fields-config.ts` (DEVELOPMENT_FIELDS).

- [ ] **Step 1:** Al inicio de la sección "Financiamiento" de `DEVELOPMENT_FIELDS` (antes de los flags), agrega:
```ts
  { section: "Financiamiento", key: "esquemas_pago", label: "Esquemas de pago", type: "payment-schemes", info: "Planes de pago del desarrollo (contado, 12m, 24m, 60m…). Cada uno con su enganche, plazo (0=contado), tasa y descuento sobre precio de lista. La web muestra un selector. Si dejas esto vacío, se usa el financiamiento simple de abajo." },
```
Deja los campos planos existentes (enganche/plazos/tasa/esquema) como fallback debajo.

- [ ] **Step 2:** `npx tsc --noEmit` (2 baseline) + commit `git add src/lib/fields-config.ts && git -c user.email=marketing@propyte.com commit -m "feat(hub): campo esquemas_pago en form de Desarrollo"`

### Task B4: Override de esquemas en la Unidad (FinancingSection + inheritedFinancing + page)

**Files:** Modify `src/components/common/fields/FinancingSection.tsx`, `src/components/common/FieldEditor.tsx` (extraKeys + InheritedFinancing), `src/app/(dashboard)/unidades/[id]/page.tsx`.

- [ ] **Step 1:** `InheritedFinancing` (en FinancingSection.tsx) += `esquemas?: EsquemaPago[] | null;` (import `EsquemaPago` de `@/lib/esquemas-pago`).
- [ ] **Step 2:** En `FinancingSection`, dentro del bloque, renderiza los esquemas:
  - Modo herencia (`!propio`): si `inherited.esquemas?.length`, lista read-only de sus labels + montos (usa `computeEsquemaMontos(precioMxn, e)`); si no, muestra la nota de que hereda el financiamiento simple (comportamiento actual).
  - Modo override (`propio`): incluye `<PaymentSchemesEditor label="Esquemas de pago" fieldKey="esquemas_pago" values={values} setValue={setValue} precioEjemplo={precioMxn} />` (import el editor).
- [ ] **Step 3:** Agrega `"esquemas_pago"` al array `extraKeys` del campo `__financing` en `UNIT_FIELDS` (`src/lib/fields-config.ts`) para que entre al diff/patch.
- [ ] **Step 4:** En `unidades/[id]/page.tsx`, agrega `fin_esquemas_pago` al `.select(...)` de v_units y al objeto `inheritedFinancing`: `esquemas: parseEsquemas(vrow?.fin_esquemas_pago)` (import `parseEsquemas`).
- [ ] **Step 5:** `npx tsc --noEmit` (2 baseline) + `npm run build` (verde). Commit `git add src/components/common/fields/FinancingSection.tsx src/components/common/FieldEditor.tsx src/lib/fields-config.ts "src/app/(dashboard)/unidades/[id]/page.tsx" && git -c user.email=marketing@propyte.com commit -m "feat(hub): override de esquemas de pago por unidad + herencia"`

---

## Self-review (cobertura del spec)
- JSONB array + forma EsquemaPago → A1/B1. ✓
- Fallback config plano → A2 (buildFallbackEsquemas). ✓
- Descuento sobre lista, contado sin corrida → A1/B1 (computeEsquema/Montos). ✓
- Selector web → A4/A5. ✓
- Editor Hub desarrollo → B2/B3; override unidad → B4. ✓
- Herencia v_units fin_esquemas_pago → A2 (mapper), B4 (page). ✓
- Zoho no toca esquemas → sin task (correcto). ✓
- i18n → A3. ✓

## Notas
- **Precio de lista en web:** A5 pasa `priceOriginal ?? price.mxn` (lista, no el promo-descuento) → consistente con D3.
- **Fallback siempre ≥ intención v1:** una unidad con financiamiento v1 pero sin esquemas sigue mostrando corrida (esquemas derivados). El gate del tab usa `esquemas.length>0`.
- **Deploy:** web y hub por separado, push `origin HEAD:main`. Validar web en standalone; hub `npm run build`. E2E interactivo del form → Luis.
