# Spec: Cristalino sitio-wide — Brand Identity rollout en dev.propyte.com

> Estado: **draft** | Fecha: 2026-05-11 | Proyecto: Next_Propyte_web

## 1. Overview

El home de `propyte.com` ya tiene aplicada la **Brand Identity Oficial 2026** (commit `c629b70`): glass cards Ficha 01/02 oscuras y claras, brand cyan `#A2F9FF` como acento primario, paleta sin naranja, jerarquía editorial. El resto del sitio (37 rutas públicas) sigue con estructura visual pre-brand o parcial.

Esta spec define el **rollout sitio-wide** del lenguaje visual cristalino + brand sin naranja, página por página, reusando las utilities ya tokenizadas en `globals.css`. Incluye un **rediseño específico de `/propiedades`** que elimina el mapa (split 2-col map+list → grid full-width estilo Ficha 02 home) — el mapa queda exclusivamente en `/desarrollos`.

Después del rollout, se ejecutan auditorías visuales Playwright para validar coherencia entre rutas y catch regresiones.

---

## 2. Goals

- **G1 — Cobertura cristalino:** 100% de las rutas públicas (`src/app/[locale]/**`) usan glass cards + brand cyan + paleta sin naranja al cerrar el speckit.
- **G2 — Layout layer coherente:** Header, Sidebar, Footer y Breadcrumbs reciben tratamiento cristalino antes que las páginas (afecta todo el sitio en una sola pasada).
- **G3 — /propiedades sin mapa:** Layout pasa de 2-col (map+list) a full-width grid Ficha 02. Solo `/desarrollos` mantiene `MapView`.
- **G4 — Reuso de tokens:** No se introducen colores hex sueltos ni utilities ad-hoc. Todo viene de las clases `propyte-card-glass*`, `propyte-glass-pill`, `propyte-hero-overlay` definidas en `globals.css:736–900` y tokens `--propyte-brand` / `--propyte-cyan-*` / `--propyte-dark-*` del `@theme`.
- **G5 — Auditoría visual reproducible:** Snapshot Playwright de las 38 rutas (mobile + tablet + desktop) sirve como baseline visual antes del merge a `main`.

---

## 3. Non-Goals

- **NO** se redefine la paleta brand (`#A2F9FF` + cyans/teals/darks) — ya está cerrada en `project_next_propyte_brand_identity.md` y §6.1 del SPECKIT-METAMORFOSIS.
- **NO** se migra la tipografía a Adobe Fonts kit (Neue Haas + Normalidad VF) — bloqueado por acceso del cliente.
- **NO** se rediseñan los flujos funcionales de las páginas (filtros, formularios, lead capture). Solo capa visual.
- **NO** se modifican rutas API, schemas Supabase, ni queries.
- **NO** se aborda `/design-playground` ni `design-playground/*` — son dev tools internos.
- **NO** se reescriben copys ni se cambian estructuras de información — solo se aplican glass + tokens.
- **NO** se cambia el comportamiento del compare panel, favorites, ni mobile bottom sheet — solo skin visual.

---

## 4. Context y constraints

### Estado actual del cristalino

| Bucket | Rutas | Estado |
|---|---|---|
| ✅ Migrada | `/` (home) | Glass cards Ficha 01/02, brand cyan, sin naranja. Cerrada en `c629b70` + migración naranja `2c7a638`. |
| 🟡 Parcial | `/propiedades`, `/desarrollos`, `/destacados`, `/promociones`, `/built`, `/mercado`, `/zonas`, `/blog/[slug]` | Algunos cyan accents o utilities, pero estructura visual marketplace/legacy. |
| 🔴 Sin migrar | 29 rutas restantes (content, legal, team, taxonomy, detail pages) | Paleta corporativa teal/navy sin glass. |

### Utilities ya disponibles en `globals.css:736–900`

- `.propyte-card-glass` — radius 52px, blur 20px, fondo `rgba(72,115,121,0.40)` (dark surfaces)
- `.propyte-card-glass-lg` — radius 40px, blur 52px, 2-layer shadow + cyan border (dark, hero-adjacent)
- `.propyte-card-glass-light` — radius 24px, blur 18px, fondo `rgba(255,255,255,0.65)` (light surfaces, WCAG-friendly)
- `.propyte-glass-pill` — pill chip variant, hover → cyan border + brand glow
- `.propyte-search-bubble` — input wrapper con pulse animado (focus-within)
- `.propyte-hero-overlay` — overlay aztec gradiente para heros con foto
- Tokens `@theme`: `--color-propyte-brand` (#A2F9FF), `--color-propyte-cyan-{50,100,200,300}`, `--color-propyte-dark-{600,700,800,900}`

### Componentes compartidos (estado)

| Componente | Estado | Notas |
|---|---|---|
| `Header.tsx` | 🔴 Sin migrar | Sidebar oscuro `#0F1923`, sin glass |
| `Sidebar.tsx` | 🔴 Sin migrar | 72px ancho fijo |
| `SearchBubble.tsx` | ✅ Migrada | `.propyte-search-bubble` con pulse cyan |
| `ActionsPill.tsx` | 🟡 Parcial | Botón teal `#5CE0D2`, sin glass |
| `Footer.tsx` | 🔴 Sin migrar | Stripe `#1A2F3F` plain |
| `Breadcrumbs.tsx` | 🟡 Parcial | Plain text links |
| `MarketplaceCard.tsx` | 🟡 Parcial | Naranja migrado a teal en `2c7a638`, pero sin glass |
| `MapView.tsx` | 🟡 Parcial | Empty-state ya cyan; el componente se queda solo en `/desarrollos` |
| `FilterBar.tsx` | 🔴 Sin migrar | Inputs plain, sin glass |

### Constraints

- **Vercel staging es la única visualización pre-prod.** Validación visual sucede en `dev.propyte.com` después de cada deploy CLI.
- **Deploy topology:** `cd <repo> && vercel --prod` inline (memoria `feedback_vercel_cli_cwd.md`). Sin git-connected.
- **i18n fallback:** Cualquier override visual debe respetar el fallback i18n/Hub vigente — no se rompen claves de `messages/{es,en}.json`.
- **ISR:** Páginas con `getVisibility()`, `getSiteConfig()`, `getCta()` ya tienen revalidates configurados; no cambiar tags.
- **A11y WCAG AA:** `#A2F9FF` solo en dark surfaces. Sobre blanco/clarito siempre `#0D9488` (teal-a11y). Memoria `feedback_seo_guidelines.md`.
- **next/font:** `--font-display`/`--font-text` viven en `<html>` className. No cambiar layout.tsx — memoria `feedback_nextfont_html_scope.md`.

### Stakeholders

- **Luis Flores** — validación visual final en `dev.propyte.com` antes de merge a `main`.

---

## 5. Requirements

### 5.1 Funcionales

- [ ] Cada ruta pública migrada usa al menos una de las utilities `.propyte-card-glass*` o `.propyte-glass-pill` en sus secciones visuales principales (cards, callouts, hero overlays).
- [ ] Toda referencia a `#F5A623`, `bg-amber-*`, `from-[#FF8C00]`, `text-orange-*` queda eliminada en rutas migradas, **excepto** warnings semánticos legítimos (`analytics/*`, `InvestmentDisclaimer`, `GeoAnalysis` heatmap, `RentalEstimate` fallback) y dev tools (`playground/*`).
- [ ] Acentos brand siguen la regla: dark bg → `#A2F9FF`, light bg → `#0D9488` (teal-a11y para WCAG AA).
- [ ] `/propiedades` ya no renderiza `MapView` ni `.split-2col`. Layout pasa a grid full-width Ficha 02.
- [ ] `/desarrollos` mantiene `MapView` (split 2-col) — solo recibe skin cristalino sobre sus cards y filtros.
- [ ] Header, Sidebar, Footer y Breadcrumbs usan glass + brand tokens consistentemente (ver §6 approach).

### 5.2 No funcionales

- **Performance:** Sin nuevos imports pesados. `backdrop-filter: blur()` ya está en uso; no se añade ningún polyfill ni librería. Bundle size +0% / dentro del jitter normal.
- **A11y:** Contrast ratio AA en toda la migración. Auditar con Lighthouse / axe en cada deploy.
- **SEO:** No tocar `<head>`, JSON-LD, `metadata` ni Schema.org. Solo capa visual.
- **i18n:** Sin cambios en claves de traducción.
- **Tests:** Playwright smoke `test:e2e:smoke` debe seguir verde. Nuevos snapshots visuales son additive, no reemplazan smoke.

---

## 6. Approach / Arquitectura propuesta

### 6.1 Estructura por **passes** (no por página)

Se ejecuta en 5 passes (P0–P4), de capa más-ancha (afecta todo) a más-estrecha (rutas individuales). Cada pass es un commit (o set de commits) + 1 deploy a staging + validación visual.

| Pass | Scope | Por qué este orden |
|---|---|---|
| **P0** | Layout layer (Header, Sidebar, Footer, Breadcrumbs, ActionsPill) | Afecta todo el sitio. Hacerlo primero evita re-renders visuales en cada página. |
| **P1** | Marketplaces (`/propiedades` + `/desarrollos` + sus subtipos taxonomy) | Alto tráfico + el rediseño de `/propiedades` (sin mapa) es el cambio funcional. |
| **P2** | Detail pages (`/desarrollos/[slug]`, `/propiedades/[slug]`, `/desarrolladores/[slug]`, `/zonas/[slug]`, `/blog/[slug]`) | Heavy en componentes compartidos (ImageGallery, FinancialSimulator, ContactForm); reusan cards. |
| **P3** | Content/editorial (`/mercado`, `/built`, `/destacados`, `/promociones`, `/blog`, `/zonas`, `/desarrolladores`, `/contacto`, `/como-comprar`, `/como-invertir`, `/financiamiento`, `/rentas`, `/faq`, `/glosario`) | Páginas con secciones-bloque; pattern repetitivo. |
| **P4** | Team/legal/utility (`/nosotros/*`, `/unete`, `/corredores`, `/proveedores`, `/privacidad`, `/terminos`, `/cookies`) + auditoría Playwright | Páginas planas. Cierre + baseline visual. |

### 6.2 P0 — Layout layer (detalle)

**Componentes a tocar:**
- `src/components/layout/Header.tsx` — añadir glass strip en scroll (light variant: `.propyte-card-glass-light` con `border-radius: 0`), brand pulse en logo.
- `src/components/layout/Sidebar.tsx` — fondo gradiente dark `--propyte-dark-900 → --propyte-dark-800`, hover items con `.propyte-glass-pill`.
- `src/components/layout/Footer.tsx` — sección superior con `.propyte-card-glass-lg` invertido (subtle), brand cyan en accent links.
- `src/components/layout/ActionsPill.tsx` — botón principal cambia de teal `#5CE0D2` a glass-pill con border cyan brand.
- `src/components/shared/Breadcrumbs.tsx` — chips `.propyte-glass-pill` light, separador chevron cyan.

**Criterio:** Capturar el screenshot del home antes y después de P0 para verificar que se ve idéntico salvo en estas zonas.

### 6.3 P1 — Marketplaces (detalle)

**`/propiedades` — REDISEÑO COMPLETO:**

Componente afectado: `src/components/marketplace/MarketplaceContent.tsx` (client).

Cambios:
1. Eliminar `<MapView>` del JSX render. **No borrar el archivo** — sigue usándose en `/desarrollos`.
2. Eliminar la prop `showMap` o flag equivalente y dejar `/desarrollos` como único caller con map.
3. Pasar layout de 2-col grid (`grid-cols-[2fr_3fr]` o similar) a single-col centrada con `max-w-[1280px]`.
4. Refactor `<PropertyList>` para mostrar grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`.
5. **Refactor `<MarketplaceCard />`** a Ficha 02 style:
   - Wrapper `.propyte-card-glass-light` (radius 24px, blur 18px, white/65 bg)
   - Image area 16:10 con `border-radius: 16px 16px 0 0`
   - Specs row con `.propyte-glass-pill` chips (bedrooms, bathrooms, m²)
   - Stage badge ya en `bg-[#0D9488] text-white` (migrado en `2c7a638`)
   - Price + price/m² en eyebrow tipográfico
   - Hover: subtle lift + cyan glow `box-shadow: 0 12px 32px rgba(162,249,255,0.18)`

6. `<FilterBar>` y `<AdvancedFilters>` reciben skin glass-light: inputs con bg semi-transparente, dropdown con `.propyte-card-glass-light`.
7. `<MobileBottomSheet>` keep functionality pero panel glass dark con header pill.
8. `<ComparePanel>` (right sidebar 2–4 items) → `.propyte-card-glass-light` sticky.

**`/desarrollos` — SKIN ONLY:**

- `<MapView>` se queda como está (empty-state ya cyan).
- `<MarketplaceCard>` recibe el mismo refactor que en `/propiedades`.
- Filtros reciben el mismo skin.

**Taxonomy pages** (`/desarrollos/cancun`, `/tipo/[type]`, `/etapa/[stage]`, `/zonas/[slug]`): reutilizan `MarketplaceContent` → reciben los cambios automáticamente. Solo verificar headers y empty-states.

### 6.4 P2–P4 — Pattern repetitivo

Para cada ruta de P2/P3/P4 el patrón es:
1. Identificar la(s) sección(es) hero, cards y CTA.
2. Reemplazar containers blancos planos por `.propyte-card-glass-light`.
3. Reemplazar containers oscuros planos por `.propyte-card-glass` o `.propyte-card-glass-lg`.
4. Reemplazar dividers + section heads por brand cyan eyebrows + tipografía display.
5. Mover cualquier accent residual naranja a `#A2F9FF`/`#0D9488` siguiendo la regla.
6. Smoke run + visual diff en dev.propyte.com.

### 6.5 Auditoría visual final (cierra P4)

- Playwright script `tests/qa-visual/all-routes.spec.ts` (nuevo o extender `tests/qa-uiux-home/`):
  - Itera las 38 rutas con `locale=es`.
  - Captura screenshot mobile (375px), tablet (768px), desktop (1280px).
  - Output a `tests/qa-visual/screenshots/<route>_<viewport>.png`.
- Commit con baseline. Próximas PRs comparan contra esta baseline.

### 6.6 Alternativas descartadas

- **Migrar todo en un solo commit gigante:** descartado — review imposible, rollback granular imposible, alto riesgo de regresión.
- **Empezar por las páginas más simples (legal, FAQ):** descartado — Layout layer primero rinde mejor visualmente y evita doble trabajo cuando Header/Footer cambien.
- **Crear nuevas utilities glass por página:** descartado — viola G4 (reuso de tokens). Si una página necesita variación, se agrega un modifier a las utilities existentes en `globals.css`, no clases ad-hoc.

---

## 7. Acceptance Criteria

### Por pass

**P0 — Layout:**
- [ ] Header con scroll glass strip activo en todas las rutas
- [ ] Sidebar items hover usan `.propyte-glass-pill`
- [ ] Footer accent links en `#A2F9FF`
- [ ] Breadcrumbs como pills glass-light
- [ ] Screenshot home pre/post-P0 idéntico fuera de estos componentes

**P1 — Marketplaces:**
- [ ] `/propiedades` NO renderiza `<MapView>`
- [ ] `/desarrollos` SÍ renderiza `<MapView>`
- [ ] `MarketplaceCard` refactorizado a Ficha 02
- [ ] FilterBar y AdvancedFilters con skin glass-light
- [ ] Taxonomy pages heredan el refactor sin cambios extras

**P2–P4:**
- [ ] Cada ruta pasa: `grep -r '#F5A623' src/app/[locale]/<ruta>/` → no matches (con excepción de warnings semánticos documentados).
- [ ] Cada ruta tiene al menos una utility `.propyte-*` aplicada.
- [ ] Lighthouse a11y ≥ 95 en mobile + desktop.

**Cierre:**
- [ ] Auditoría visual Playwright completa con baseline en `tests/qa-visual/`.
- [ ] Typecheck `npx tsc --noEmit` exit 0.
- [ ] `npm run test:e2e:smoke` pasa.
- [ ] Luis valida `dev.propyte.com` y aprueba merge `develop → main`.

---

## 8. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Refactor `MarketplaceContent` rompe compare panel / favorites / filtros | M | H | Hacer el cambio en branch separado, smoke run + manual click-through antes de merge a develop. |
| `backdrop-filter` causa jank en mobile Safari | L | M | Las utilities ya están en uso en home sin reportes; sigue siendo low risk. Monitor en validación visual. |
| Página con override visual hub (page_content) entra en conflicto con nueva clase glass | M | M | Validar cada página con Hub data poblada (mercado, destacados, promociones) + fallback i18n vacío. |
| El refactor accidentalmente cambia padding/spacing y desalinea SearchBubble en Header | M | M | Snapshot home antes/después de P0 (criterio explícito). |
| Naranja residual queda en componentes no listados en inventario | M | L | Repetir `grep "F5A623\|amber-\|orange-" src/` después de cada pass. |
| Cards Ficha 02 se ven mal sobre fotos oscuras de propiedades | M | M | A/B con MarketplaceCard.tsx en dev — si conflict, usar `.propyte-card-glass` (dark variant) en lugar de glass-light. |
| Auditoría Playwright tarda demasiado (38 rutas × 3 viewports = 114 shots) | M | L | Run en background; aceptar 5–10 min total. |

---

## 9. Open Questions — RESUELTAS (2026-05-11)

1. **`/built`** sin mapa. ✓
2. **Draft badge legales** se mantiene como warning semántico (amber Tailwind palette). Sin migración brand. ✓
3. **`/promociones` heroAccent`** — Hub actualizó `accent_color` de `#F5A623` → `#A2F9FF` via MCP el 2026-05-11. Cerrado. ✓
4. **Mapa `/zonas/[slug]`** — se conserva. ✓
5. **`/unete`** — recibe glass-refactor completo (no solo cleanup). Sobrescribe la excepción HERO-SITE del SPECKIT-METAMORFOSIS §0. ✓
6. **Header glass strip** — solo desktop scroll. Mobile sin strip. ✓

## 9.b — Amendment arquitectónico 2026-05-11 (post-Pass 1)

**Decisión Luis (revierte T1.1 original):**
- `/desarrollos` → **grid full-width sin mapa** (estilo Ficha 02). Mapa removido. Taxonomies (`/desarrollos/cancun`, `/tipo/[type]`, `/etapa/[stage]`) heredan grid.
- `/propiedades` → **split map+list con mapa** (recupera la vista que originalmente quitamos en T1.1).
- **Nuevo feature: cluster pin "+N" en `/propiedades`** — cuando ≥2 unidades coinciden o son cercanas en el mapa, mostrar pin con count "+N". Click en cluster → filtra el listado a solo esas unidades + chip "Mostrando N unidades en este punto · [×]" para limpiar.

**Racional:** Los desarrollos son entidades editorial/feature (1 punto cada uno) — el mapa aporta poco valor. Las unidades individuales son densas en zonas/edificios — el mapa con cluster filter es la mejor herramienta de navegación.

**Tareas derivadas:**
- T1.1b — Swap `showMap` entre `/propiedades` (true) y `/desarrollos` + taxonomies (false).
- T1.8 — MapView: bajar CLUSTER_THRESHOLD, renderer "+N", `onClusterClick(ids)` callback.
- T1.9 — MarketplaceContent: state `clusterFilter`, chip "limpiar", filter `filtered` por IDs.

---

## 10. Plan de tareas (preliminar)

Tareas que se promoverán al `task_manager.md` después de la revisión.

### Pass 0 — Layout layer
- [ ] T0.1 — Header.tsx + scroll glass strip
- [ ] T0.2 — Sidebar.tsx hover/active items con `.propyte-glass-pill`
- [ ] T0.3 — Footer.tsx accents brand cyan + glass divider
- [ ] T0.4 — ActionsPill.tsx → glass-pill con border cyan
- [ ] T0.5 — Breadcrumbs.tsx → pills glass-light
- [ ] T0.6 — Deploy + screenshot diff home

### Pass 1 — Marketplaces
- [ ] T1.1 — `MarketplaceContent.tsx`: condicional `showMap` (default `false`), quitar `<MapView>` en `/propiedades`
- [ ] T1.2 — Refactor `MarketplaceCard.tsx` a Ficha 02 (glass-light + glass-pill specs)
- [ ] T1.3 — `FilterBar.tsx` + `AdvancedFilters.tsx` skin glass-light
- [ ] T1.4 — `MobileBottomSheet.tsx` skin glass dark + header pill
- [ ] T1.5 — `ComparePanel.tsx` skin glass-light sticky
- [ ] T1.6 — Verificar taxonomy pages (`/desarrollos/cancun`, `/tipo/[type]`, etc.)
- [ ] T1.7 — Deploy + click-through manual completo (favorites, compare, filters)

### Pass 2 — Detail pages
- [ ] T2.1 — `/desarrollos/[slug]` hero + secciones glass
- [ ] T2.2 — `/propiedades/[slug]` hero + secciones glass
- [ ] T2.3 — `/desarrolladores/[slug]` cards glass-light
- [ ] T2.4 — `/zonas/[slug]` hero + map (si aplica) + cards glass
- [ ] T2.5 — `/blog/[slug]` hero + prose container glass-light

### Pass 3 — Content/editorial
- [ ] T3.1 — `/mercado` (intelligence dashboard)
- [ ] T3.2 — `/built` (portfolio)
- [ ] T3.3 — `/destacados` (featured)
- [ ] T3.4 — `/promociones` (subir glass + decidir Q3)
- [ ] T3.5 — `/blog` (listing)
- [ ] T3.6 — `/zonas` (listing)
- [ ] T3.7 — `/desarrolladores` (directory)
- [ ] T3.8 — `/contacto` (form + map embed)
- [ ] T3.9 — `/como-comprar`, `/como-invertir`, `/financiamiento`, `/rentas`, `/faq`, `/glosario`

### Pass 4 — Team/legal + auditoría
- [ ] T4.1 — `/nosotros/quienes-somos`, `/nosotros/estructura`, `/nosotros/equipo-comercial`
- [ ] T4.2 — `/unete` glass-refactor completo (sobrescribe excepción HERO-SITE — ver Q5)
- [ ] T4.3 — `/corredores`, `/proveedores`
- [ ] T4.4 — `/privacidad`, `/terminos`, `/cookies`
- [ ] T4.5 — Playwright `tests/qa-visual/all-routes.spec.ts` (nueva baseline)
- [ ] T4.6 — Typecheck + smoke run final
- [ ] T4.7 — Validación Luis + merge `develop → main`

---

## Notas de ejecución

- **Cadencia de commits:** uno por tarea T*.X salvo cuando una sola edición toca varios archivos del mismo subsistema (entonces commit por subsistema).
- **Cadencia de deploys:** uno por pass cerrado a Vercel staging (`cd <repo> && vercel --prod`).
- **Naranja residual permitido:** `analytics/*`, `InvestmentDisclaimer`, `GeoAnalysis`, `MarketIndicator`, `ComparisonTable`, `RentalEstimate` fallback, `playground/*`, `design-playground/*`, token `--color-amber` en globals.css. Cualquier match fuera de ese set en `grep` es bug.
- **Brand consistency check:** `grep -rn "F5A623\|FF8C00\|orange-\|amber-" src/app/[locale]/` después de cada pass y cotejar contra el allowlist.
