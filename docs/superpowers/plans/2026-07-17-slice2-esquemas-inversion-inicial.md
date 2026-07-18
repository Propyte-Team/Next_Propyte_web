# Slice 2 — Esquemas de pago: estructura + Inversión inicial · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Convertir el shell "Esquemas de pago" en la estructura real: calculadora superior de **Precio + Inversión inicial** (escrituración Nacional/Extranjero, Mobiliario y Decoración auto-estimados por m²) y el esqueleto de la **cotización en 3 bloques** con **3 sub-pestañas** (Preventa / Financiamiento Interno / Financiamiento Hipotecario) y sus gates. El financiamiento del saldo (corridas) y el PDF se desarrollan en Slice 3.

**Architecture:** Constantes globales + calculadora pura nueva en `src/lib/inversion-inicial.ts`. La UI vive en `EsquemasDePagoTab.tsx` (reescrito): arriba la calculadora de inversión; abajo `Tabs` (pill) con 3 sub-pestañas shell, cada una mostrando el bloque 3 (skeleton). `tipo_entrega` se cablea a `Property` pero hoy llega `null` (v_units no lo expone — decisión B: default seguro "cobra ambos"; cambio de vista + limpieza de datos = fast-follow). La `CorridaFinanciera` existente se aloja provisionalmente en la sub-pestaña Hipotecario hasta Slice 3.

**Tech Stack:** Next.js 16, React 19, next-intl 4, Tailwind, recharts (ya presente). Sin vitest (rompe build): lógica pura con `node --test` temporal (borrar antes de commit). Base = HEAD de `feat/unidades-rediseno` (== origin/main, worktree `Next_Propyte_web_unidades`, node_modules junctioned).

**Valores locked (del spec §5, arranque ajustable):**
- Escrituración Nacional **8%** flat; Extranjero = 8% + fideicomiso **$60,000 MXN** fijo.
- Mobiliario MXN/m²: Standard 3,000 · Alto 6,000 · Premium 10,000.
- Decoración MXN/m²: Standard 1,000 · Alto 2,200 · Premium 4,000.
- factorUbicación: premium 1.15 · estándar 1.00 · emergente 0.90.
- Matriz tipo_entrega → incluido: Obra gris/Con acabados/Equipada = cobra ambos · Amueblada = mobiliario incluido · Llave en mano = ambos incluidos. Valores sucios (Inmediata/Preventa/Entrega inmediata) → cobra ambos. `Equipada`/`Equipado`/`Equipada (turnkey)` normalizan a Equipada.

---

## File Structure
- **Create** `src/lib/inversion-inicial.ts` — constantes + funciones puras (escrituración, mobiliario/deco, factorUbicación, normalización tipo_entrega, `computeInversionInicial`).
- **Modify** `src/types/property.ts` — `PropertySpecs` +`tipoEntrega?: string | null`.
- **Modify** `src/lib/mappers/unit-to-property.ts` — mapear `row.tipo_entrega` (null-safe) a `specs.tipoEntrega`; añadir `tipo_entrega` al `UnitRow`.
- **Rewrite** `src/app/[locale]/propiedades/_components/EsquemasDePagoTab.tsx` — calculadora superior (Precio + Inversión inicial) + `Tabs` con 3 sub-pestañas shell + cotización 3 bloques skeleton.
- **Create** `src/app/[locale]/propiedades/_components/esquemas/InversionInicialCalculator.tsx` — la calculadora superior (Nac/Ext selector + escrituración + Mobiliario/Decoración dropdowns + total).
- **Create** `src/app/[locale]/propiedades/_components/esquemas/CotizacionBloques.tsx` — render de los 3 bloques (Precio / Inversión inicial / Financiamiento del saldo), recibe datos por props.
- **Modify** `src/app/[locale]/propiedades/_components/UnitDetailPage.tsx` — pasar `m2`, `city`, `zone`, `tipoEntrega`, `discountPct`/`priceOriginal` a `EsquemasDePagoTab` (además de lo actual).
- **Modify** `src/i18n/messages/{es,en}.json` — claves nuevas.

---

## Task 1: `inversion-inicial.ts` — constantes + calculadora pura (TDD)

**Files:** Create `src/lib/inversion-inicial.ts`. Temp test `src/lib/inversion-inicial.test.mts` (borrar antes de commit).

- [ ] **Step 1: Test rojo** — crear `src/lib/inversion-inicial.test.mts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escrituracion, estimadoAcabado, tipoEntregaIncluidos, computeInversionInicial } from './inversion-inicial.ts';

test('escrituracion nacional = 8% del precio', () => {
  assert.equal(escrituracion(3_500_000, 'nacional'), 280_000);
});
test('escrituracion extranjero = 8% + fideicomiso 60k', () => {
  assert.equal(escrituracion(3_500_000, 'extranjero'), 280_000 + 60_000);
});
test('estimadoAcabado = m2 * tarifa * factor', () => {
  assert.equal(estimadoAcabado(85, 6_000, 1.15), Math.round(85 * 6_000 * 1.15)); // 586500
});
test('tipoEntregaIncluidos: Amueblada => mobiliario incluido, deco no', () => {
  assert.deepEqual(tipoEntregaIncluidos('Amueblada'), { mobiliario: true, decoracion: false });
});
test('tipoEntregaIncluidos: Llave en mano => ambos', () => {
  assert.deepEqual(tipoEntregaIncluidos('Llave en mano'), { mobiliario: true, decoracion: true });
});
test('tipoEntregaIncluidos: null/Equipada/basura => cobra ambos', () => {
  assert.deepEqual(tipoEntregaIncluidos(null), { mobiliario: false, decoracion: false });
  assert.deepEqual(tipoEntregaIncluidos('Equipada (turnkey)'), { mobiliario: false, decoracion: false });
  assert.deepEqual(tipoEntregaIncluidos('Preventa'), { mobiliario: false, decoracion: false });
});
test('computeInversionInicial suma enganche + escrituracion + acabados (no incluidos)', () => {
  const r = computeInversionInicial({
    price: 3_500_000, engancheMxn: 1_050_000, nacionalidad: 'nacional',
    m2: 85, city: 'Tulum', zone: null, tipoEntrega: null,
    mobiliarioNivel: 'alto', decoracionNivel: 'premium',
  });
  // escritura 280000 + mob 85*6000*1.15=586500 + deco 85*4000*1.15=391000 + enganche 1050000
  assert.equal(r.escrituracion, 280_000);
  assert.equal(r.mobiliario, 586_500);
  assert.equal(r.decoracion, 391_000);
  assert.equal(r.total, 1_050_000 + 280_000 + 586_500 + 391_000);
  assert.equal(r.mobiliarioIncluido, false);
});
```

- [ ] **Step 2: Correr → FALLA** (`cd` worktree; `node --test src/lib/inversion-inicial.test.mts`). Node 24 resuelve `./inversion-inicial.ts` con type-stripping (igual que Slice 1 Task 3). Expected: falla (módulo no existe).

- [ ] **Step 3: Implementar `src/lib/inversion-inicial.ts`:**
```ts
// ── Inversión inicial: escrituración + mobiliario/decoración (config global, ajustable) ──

export type Nacionalidad = 'nacional' | 'extranjero';
export type NivelAcabado = 'standard' | 'alto' | 'premium';

export const ESCRITURACION_NACIONAL_PCT = 0.08;          // 8% del precio
export const FIDEICOMISO_EXTRANJERO_MXN = 60_000;         // constitución + permiso SRE (extranjero)

export const MOBILIARIO_TARIFA_M2: Record<NivelAcabado, number> = { standard: 3_000, alto: 6_000, premium: 10_000 };
export const DECORACION_TARIFA_M2: Record<NivelAcabado, number> = { standard: 1_000, alto: 2_200, premium: 4_000 };

// Zonas/ciudades premium → factor 1.15; emergentes → 0.90; resto 1.00. Ajustable.
const UBICACION_PREMIUM = /tulum|playa del carmen|puerto cancun|zona hotelera|aldea zama|region 15|riviera/i;
const UBICACION_EMERGENTE = /bacalar|chetumal|valladolid|jose maria morelos|felipe carrillo/i;

export function factorUbicacion(city: string | null | undefined, zone: string | null | undefined): number {
  const hay = `${city ?? ''} ${zone ?? ''}`;
  if (UBICACION_PREMIUM.test(hay)) return 1.15;
  if (UBICACION_EMERGENTE.test(hay)) return 0.90;
  return 1.0;
}

export function escrituracion(price: number, nac: Nacionalidad): number {
  const base = Math.round(price * ESCRITURACION_NACIONAL_PCT);
  return nac === 'extranjero' ? base + FIDEICOMISO_EXTRANJERO_MXN : base;
}

export function estimadoAcabado(m2: number, tarifaM2: number, factor: number): number {
  if (m2 <= 0) return 0;
  return Math.round(m2 * tarifaM2 * factor);
}

/** Normaliza el tipo_entrega (sucio/nullable) a qué acabados vienen incluidos. Default: cobra ambos. */
export function tipoEntregaIncluidos(raw: string | null | undefined): { mobiliario: boolean; decoracion: boolean } {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'llave en mano') return { mobiliario: true, decoracion: true };
  if (v === 'amueblada' || v === 'amueblado') return { mobiliario: true, decoracion: false };
  // Obra gris / Con acabados / Equipada(*) / valores de etapa (Inmediata/Preventa/...) / null → cobra ambos
  return { mobiliario: false, decoracion: false };
}

export interface InversionInicialInput {
  price: number;
  engancheMxn: number;
  nacionalidad: Nacionalidad;
  m2: number;
  city: string | null;
  zone: string | null;
  tipoEntrega: string | null;
  mobiliarioNivel: NivelAcabado;
  decoracionNivel: NivelAcabado;
}
export interface InversionInicialResult {
  escrituracion: number;
  mobiliario: number;
  decoracion: number;
  mobiliarioIncluido: boolean;
  decoracionIncluido: boolean;
  enganche: number;
  total: number;
}

export function computeInversionInicial(i: InversionInicialInput): InversionInicialResult {
  const incl = tipoEntregaIncluidos(i.tipoEntrega);
  const factor = factorUbicacion(i.city, i.zone);
  const esc = escrituracion(i.price, i.nacionalidad);
  const mobiliario = incl.mobiliario ? 0 : estimadoAcabado(i.m2, MOBILIARIO_TARIFA_M2[i.mobiliarioNivel], factor);
  const decoracion = incl.decoracion ? 0 : estimadoAcabado(i.m2, DECORACION_TARIFA_M2[i.decoracionNivel], factor);
  return {
    escrituracion: esc,
    mobiliario, decoracion,
    mobiliarioIncluido: incl.mobiliario,
    decoracionIncluido: incl.decoracion,
    enganche: i.engancheMxn,
    total: i.engancheMxn + esc + mobiliario + decoracion,
  };
}
```

- [ ] **Step 4: Correr → PASA.**
- [ ] **Step 5: Borrar test temporal** (`rm src/lib/inversion-inicial.test.mts`).
- [ ] **Step 6: `npx tsc --noEmit` → 0 errores.**
- [ ] **Step 7: Commit:**
```bash
git add src/lib/inversion-inicial.ts
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(esquemas): calculadora pura de inversión inicial (escrituración Nac/Ext + mobiliario/deco por m²)"
```

---

## Task 2: Plumbing de `tipoEntrega` a Property (null-safe)

**Files:** Modify `src/types/property.ts`, `src/lib/mappers/unit-to-property.ts`.

- [ ] **Step 1:** En `src/types/property.ts`, `PropertySpecs` (interface con `bedrooms/bathrooms/area/type`) → añadir `tipoEntrega?: string | null;`.
- [ ] **Step 2:** En `src/lib/mappers/unit-to-property.ts`: añadir `tipo_entrega?: string | null;` al `UnitRow` interface; en el armado de `specs` (donde asigna `area`/`type`) añadir `tipoEntrega: row.tipo_entrega ?? null`. (Hoy `v_units` no lo expone → llega `undefined` → `null`. Esto es esperado, decisión B.)
- [ ] **Step 3:** `npx tsc --noEmit` → 0.
- [ ] **Step 4: Commit:**
```bash
git add src/types/property.ts src/lib/mappers/unit-to-property.ts
git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit -m "feat(esquemas): cablea specs.tipoEntrega (null-safe; v_units aún no lo expone)"
```

---

## Task 3: `InversionInicialCalculator.tsx` (calculadora superior)

**Files:** Create `src/app/[locale]/propiedades/_components/esquemas/InversionInicialCalculator.tsx`.

- [ ] **Step 1:** Crear el componente. Props: `{ price: number; priceOriginal: number; discountPct: number; m2: number; state: string; city: string; zone: string | null; tipoEntrega: string | null; engancheMxn: number; onTotal?: (n: number) => void }`. Estado local: `nacionalidad: 'nacional'|'extranjero'` (default nacional), `mobiliarioNivel: NivelAcabado` (default 'alto'), `decoracionNivel: NivelAcabado` (default 'standard'). Usa `computeInversionInicial(...)` (useMemo). Render:
  - **Bloque Precio:** priceOriginal tachado si `discountPct>0`, precio de venta, descuento %.
  - **Selector Nacional/Extranjero** (segmented, 2 botones) — al cambiar, recalcula.
  - **Escrituración** (muestra el monto; nota fideicomiso si extranjero).
  - **Mobiliario** `<select>` (Standard/Alto/Premium) + monto; si `mobiliarioIncluido` → `<select disabled>` + "Incluido".
  - **Decoración** idem.
  - **Enganche** (viene por prop, read-only aquí).
  - **Inversión inicial (total)** destacado.
  Reusa el patrón `<select>` nativo + `selectClass` (ver `BrokersPageContent.tsx`). Copy vía `useTranslations('esquemas')` (namespace nuevo). Colores/estilo calcan `EsquemasDePagoTab` actual. Llama `onTotal?.(result.total)` en un `useEffect` si se provee.
  (Código completo: el implementador lo escribe siguiendo esta spec; usa `formatPrice` de `@/lib/formatters` y los tipos/función de `@/lib/inversion-inicial`.)

- [ ] **Step 2:** `npx tsc --noEmit` → 0.
- [ ] **Step 3: Commit** `git add ...InversionInicialCalculator.tsx && git -c user.email=... commit -m "feat(esquemas): calculadora de Inversión inicial (Nac/Ext + mobiliario/deco dropdowns)"`.

---

## Task 4: Reestructurar `EsquemasDePagoTab` — calc superior + 3 sub-pestañas + cotización skeleton

**Files:** Rewrite `EsquemasDePagoTab.tsx`; Create `esquemas/CotizacionBloques.tsx`; Modify `UnitDetailPage.tsx`.

- [ ] **Step 1:** `CotizacionBloques.tsx` — componente presentacional que recibe `{ bloque1: {precio, descuentoPct, precioVenta}, bloque2: InversionInicialResult, bloque3: {saldo, mensualidades, interesPct, mensualidad} | null }` y renderiza los 3 bloques en grid (Precio / Inversión inicial / Financiamiento del saldo). Si `bloque3` es null muestra placeholder "Se define en el esquema" (Slice 3-5). i18n `esquemas`.
- [ ] **Step 2:** Rewrite `EsquemasDePagoTab.tsx`:
  - Props ampliadas: añadir `priceOriginal, discountPct, m2, city, zone, tipoEntrega` a las existentes.
  - Arriba: `<InversionInicialCalculator .../>` (comparte enganche = `price * downPaymentMin/100` como default, o el enganche del esquema destacado).
  - Abajo: `<Tabs variant="pill">` con 3 items:
    - `preventa` (gate: `stage === 'preventa'`) — shell: `<CotizacionBloques bloque3={null} .../>` + nota "Preventa (Slice 4)".
    - `interno` (gate: `financing.directo`) — shell + nota "Financiamiento interno (Slice 5)".
    - `hipotecario` (siempre) — por ahora aloja la `<CorridaFinanciera listPrice esquemas />` existente (interim hasta Slice 3) + `<CotizacionBloques .../>`.
  - Gates de sub-pestaña: si un gate es false, no incluir ese item (patrón de Slice 1). Hipotecario siempre presente.
  - El `stage` y `financing.directo` llegan por props nuevas (`stage`, `directo`).
- [ ] **Step 3:** `UnitDetailPage.tsx` — ampliar el `<EsquemasDePagoTab>` con `priceOriginal={property.priceOriginal ?? property.price.mxn}`, `discountPct={property.discount?.pct ?? 0}`, `m2={property.specs.area}`, `city={property.location.city}`, `zone={property.location.zone}`, `tipoEntrega={property.specs.tipoEntrega ?? null}`, `stage={property.stage}`, `directo={property.financing.directo ?? false}`.
- [ ] **Step 4:** `npx tsc --noEmit` + `npm run build` → 0.
- [ ] **Step 5: Commit.**

---

## Task 5: i18n (namespace `esquemas`)

**Files:** `src/i18n/messages/{es,en}.json`.
- [ ] **Step 1:** Añadir namespace `esquemas` con las claves usadas en Tasks 3-4 (precio, precioVenta, descuento, nacional, extranjero, escrituracion, fideicomisoNota, mobiliario, decoracion, standard, alto, premium, incluido, inversionInicial, enganche, saldo, mensualidades, interes, mensualidad, bloque3Placeholder, tabPreventa, tabInterno, tabHipotecario, preventaSoon, internoSoon…) — es + en, en paridad. (El implementador lista los `t('...')` reales de los componentes y crea la clave faltante en ambos idiomas.)
- [ ] **Step 2:** Verificar paridad (script de conteo de Slice 1) + `tsc` + `build`.
- [ ] **Step 3: Commit.**

---

## Task 6: Verificación runtime + reporte

- [ ] **Step 1:** `npm run build` exit 0; grep del HTML prerenderizado de una unidad: presencia de "Inversión inicial", selector Nacional/Extranjero, dropdowns Mobiliario/Decoración, 3 sub-pestañas; ausencia de `MISSING_MESSAGE`.
- [ ] **Step 2:** (NO push) Reportar a Luis: Slice 2 lista; el tab Esquemas sigue oculto en prod (`propiedades.detail.esquemas=false`) — se muestra cuando esté completo (Slice 3). Recordar fast-follow: exponer `tipo_entrega` en `v_units` + limpieza de datos para activar "incluido".

## Self-Review (cobertura spec §4.1-4.2)
- §4.1 calculadora superior (escrituración + mobiliario/deco separados) → Tasks 1,3. ✓
- §4.1 3 sub-pestañas + gates (Preventa=estado/stage, Interno=directo, Hipotecario=siempre) → Task 4. ✓
- §4.2 cotización 3 bloques → Task 4 (`CotizacionBloques`, bloque 3 skeleton). ✓
- §5 constantes + matriz tipo_entrega (decisión B: default seguro) → Task 1. ✓
- Bloque 3 real (corridas) + PDF → **Slice 3** (fuera de alcance aquí).
- **Fast-follow:** `tipo_entrega` en v_units + limpieza de datos (98% NULL) para que "incluido" active.
