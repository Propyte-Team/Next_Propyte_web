# Slice 7 — Nombre bilingüe de esquemas (label_en) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox steps.

**Goal:** El nombre del esquema de pago se muestra en inglés en `/en/` (con fallback al español). Español = original requerido, inglés = opcional.

**Architecture:** `EsquemaPago.label_en?` dentro del JSONB `esquemas_pago` (SIN DDL). Web elige por `locale` vía helper `esquemaLabel`. Fallbacks auto-generados en ambos idiomas. Hub: input "Nombre (EN)".

**Tech Stack:** TS, Next.js App Router (web) + Next.js admin (Hub). No test runner → `tsc`+`build`+probe SSR. Git author `-c user.email=marketing@propyte.com -c user.name=Propyte-Luis`, rutas explícitas, sin push.

**Repos:** web `Next_Propyte_web_unidades` (rama `feat/unidades-rediseno`); Hub worktree `Propyte_hub_preventa` (rama `feat/unidades-preventa-interno-hub`).

---

## Task 1: Web — `label_en` + helper (`src/lib/esquemas-pago.ts`)

- [ ] **Step 1:** Add `label_en?: string;` to `EsquemaPago` (after `label`).
- [ ] **Step 2:** In `parseEsquemas` `.map`, add: `label_en: x.label_en != null && String(x.label_en).trim() !== '' ? String(x.label_en) : undefined,`
- [ ] **Step 3:** Add helper:
```ts
export function esquemaLabel(e: EsquemaPago, locale: string): string {
  return locale === 'en' && e.label_en ? e.label_en : e.label;
}
```
- [ ] **Step 4:** `cd web && rm -rf .next/types && ./node_modules/.bin/tsc --noEmit` → clean.
- [ ] **Step 5:** Commit `src/lib/esquemas-pago.ts` — `feat(unidades): EsquemaPago.label_en + esquemaLabel(locale) helper`.

## Task 2: Web — fallbacks bilingües (`src/lib/mappers/unit-to-property.ts`)

- [ ] **Step 1:** In `buildFallbackEsquemas`, add `label_en` to both returned shapes:
```ts
return [{ id: 'v1_0', label: 'Financiamiento', label_en: 'Financing', enganche_pct: engPct, meses: 0, tasa, descuento_pct: 0, orden: 0 }];
```
```ts
return terms.map((m, i) => ({
  id: `v1_${m}`, label: `Financiamiento ${m} meses`, label_en: `Financing ${m} months`,
  enganche_pct: engPct, meses: m, tasa, descuento_pct: 0, orden: i,
}));
```
- [ ] **Step 2:** `tsc --noEmit` → clean.
- [ ] **Step 3:** Commit `src/lib/mappers/unit-to-property.ts` — `feat(unidades): nombres de fallback de esquemas en es+en`.

## Task 3: Web — render por locale (`CorridaFinanciera.tsx`)

- [ ] **Step 1:** Grep first: `grep -rn "\.label}" src/app/[locale]/propiedades src/app/api/generate-cotizacion-pdf` — find EVERY render of `esquema.label`. Expected: `CorridaFinanciera.tsx:138`. If the interno PDF route renders the scheme name, include it too (with the PDF's locale).
- [ ] **Step 2:** In `CorridaFinanciera.tsx`: import `esquemaLabel`; replace `{e.label}` (line ~138, scheme selector chips) with `{esquemaLabel(e, locale)}`. `locale` is already a prop.
- [ ] **Step 3 (probe):** Create `src/app/[locale]/bilingue-probe/page.tsx`:
```tsx
import CorridaFinanciera from '../propiedades/_components/CorridaFinanciera';
export const dynamic = 'force-dynamic';
const esquemas = [
  { id: 'a', label: 'Financiamiento 60 meses', label_en: 'Financing 60 months', enganche_pct: 20, meses: 60, tasa: 12, descuento_pct: 0, orden: 0, destacado: true },
  { id: 'b', label: 'Solo español', enganche_pct: 30, meses: 24, tasa: 10, descuento_pct: 0, orden: 1 },
];
export default function P({ params }: { params: { locale: string } }) {
  return <CorridaFinanciera listPrice={4_000_000} esquemas={esquemas} priceOriginal={4_000_000}
    nacionalidad="nacional" m2={80} city="Tulum" zone={null} tipoEntrega={null}
    mobiliarioNivel="alto" decoracionNivel="standard" slug="probe" locale={params.locale} />;
}
```
Build, curl `/en/bilingue-probe` → chip "Financing 60 months" (esquema b sin label_en → "Solo español" en ambos); curl `/es/bilingue-probe` → "Financiamiento 60 meses". Delete probe.
- [ ] **Step 4:** `rm -rf src/app/[locale]/bilingue-probe .next/types && tsc --noEmit` clean.
- [ ] **Step 5:** Commit `CorridaFinanciera.tsx` (+ PDF route if touched) — `feat(unidades): nombre de esquema por locale (label_en con fallback)`.

## Task 4: Hub — `label_en` + input "Nombre (EN)"

**Repo:** `C:/Users/Luis/Projects/Propyte/Propyte_hub_preventa`

- [ ] **Step 1:** `src/lib/esquemas-pago.ts` (Hub): add `label_en?: string;` to `EsquemaPago`; in `parseEsquemas` add `label_en: x.label_en != null && String(x.label_en).trim() !== '' ? String(x.label_en) : undefined,`.
- [ ] **Step 2:** `src/components/common/fields/PaymentSchemesEditor.tsx`: add a text input "Nombre (EN)" bound to `e.label_en ?? ''`, writing `update(i, { label_en: ev.target.value })`, next to the existing "Nombre" (`label`) input, matching the row grid/classes. Hint: "opcional; vacío usa el nombre en español".
- [ ] **Step 3:** `cd hub && rm -rf .next/types && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/next build` → tsc clean except the 2 known pre-existing `tests/hub-to-zoho-mapper.test.ts` errors; build clean.
- [ ] **Step 4:** Commit both files — `feat(hub): nombre bilingue de esquema (label_en en editor + parse)`.
- [ ] **Step 5 (round-trip check):** set an `esquemas_pago` on a dev with a scheme carrying `label_en`, read `v_units.fin_esquemas_pago[0].label_en`, confirm it survives, revert. (Same set→select→revert pattern used for `timing`.)

## Self-Review (vs spec §4)
- label_en en ambos repos + JSONB, sin DDL ✓ · helper por locale ✓ · fallbacks es+en ✓ · Hub input ✓ · sin nombres de proveedor ✓ · único render (CorridaFinanciera) cubierto + grep para PDF ✓.
