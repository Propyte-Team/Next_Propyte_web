# Spec: UI/UX Fixes Bundle — Filtros, Comparativa, Moneda, WhatsApp, Promociones, Contraste

> Estado: **approved (2026-05-23)** | Fecha: 2026-05-23 | Proyecto: Next_Propyte_web | Branch: `develop`

## 1. Overview

Lote de 6 arreglos de UI/UX para el sitio público `propyte.com`. Son issues funcionales y de consistencia visual detectados por Luis en una pasada sobre `dev.propyte.com`. El bundle se trabaja sobre `develop` y se promueve a `main` (Hostinger pull) solo cuando los 6 estén verificados.

Los 6 items pueden trabajarse en paralelo porque tocan superficies distintas, pero comparten una decisión transversal: **la moneda canónica de cada propiedad es la moneda en que está dada de alta**, y la conversión se muestra siempre como referencia secundaria — sin toggle global. Este cambio simplifica la cognición del usuario y elimina ambigüedad sobre qué moneda paga.

## 2. Goals

- **Filtros operativos** en `/desarrollos` y `/propiedades` (cada pill filtra, los chips se aplican).
- **Comparativa con 5 filas** orientadas a decisión de compra: precio desde, precio hasta, ubicación, # amenidades, tipo de desarrollo.
- **Eliminar `<CurrencyToggle>`** de toda la UI y unificar visualización en `PriceDisplay variant="dual"`.
- **Botón flotante de WhatsApp clickable** desde cualquier ruta donde corresponda.
- **`/promociones` muestra la única promo activa** (no esperar a tener 2+).
- **Contraste WCAG AA** del precio referencial en KeyData de unidad/desarrollo (sobre fondo `#1A2F3F`).

## 3. Non-Goals

- No se rediseña la paleta, tipografía ni layout — son fixes funcionales y de contraste, no rediseño visual (memoria `feedback_no_visual_rewrites.md`).
- No se cambia el sistema de descuentos ya deployado (commit `f5ada76` y posteriores) más allá del threshold de `/promociones`.
- No se merge a `main` en este spec — solo `develop`. La promoción a producción es una decisión separada.
- No se modifica el catálogo de Supabase (`v_units`/`v_developments`) ni mapas ni Hub.
- No se agregan features nuevos a la comparativa (drag-and-drop, persistencia, share-link).
- No se internacionaliza el comentario "El precio referencial se calcula con TC Banxico..." — queda en ES (es texto legal/aclaratorio existente).

## 4. Context y constraints

### Estado actual relevante

- **Filtros**: `useFilters(properties)` en [hooks/useFilters.ts:80-189](src/hooks/useFilters.ts) parsea URL params y filtra en cliente. Pasa `filtered` a `<PropertyList>`. La lógica luce sound; el bug reportado puede ser smoke-test específico (un pill que no aplica).
- **Mappers**: ambos mappers normalizan `stage` y `developmentType` a canónico lowercase:
  - [development-to-property.ts:131](src/lib/mappers/development-to-property.ts) `normalizeStage()` retorna `'preventa'|'construccion'|'entrega_inmediata'`.
  - [unit-to-property.ts:82-150](src/lib/mappers/unit-to-property.ts) idem.
- **CurrencyToggle** vive en [components/ui/CurrencyToggle.tsx](src/components/ui/CurrencyToggle.tsx). Único consumer activo: [FilterBar.tsx:539](src/components/marketplace/FilterBar.tsx). En `MobileHeader.tsx` y `MobileMenu.tsx` ya está removido desde 2026-05-11 (comentarios en código).
- **`useCurrency()` context** ([CurrencyContext.tsx](src/context/CurrencyContext.tsx)) expone `{ currency, toggleCurrency, convert, format, rate, rateUpdatedAt }`. Multiple consumers usan `format()` que respeta el toggle:
  - `MarketplaceCard.tsx:55` (`format`, `currency`).
  - `ComparePanel.tsx:20` (`format`).
  - Otros: grep nos dirá la lista completa.
- **`PriceDisplay`** ([components/ui/PriceDisplay.tsx](src/components/ui/PriceDisplay.tsx)) ya implementa `variant='dual'` con original arriba + referencial abajo. Línea 99-102 tiene el bug de contraste:
  ```
  <span className={`${SIZE_SECONDARY[size]} text-gray-500 leading-tight`}>
  ```
- **WhatsAppButton** ([components/shared/WhatsAppButton.tsx](src/components/shared/WhatsAppButton.tsx)): `<a href="https://wa.me/...">`, `target="_blank"`, `z-50`. Visible solo después de `scrollY > 300`. CSS custom `.propyte-cta-whatsapp` en [globals.css:847](src/styles/globals.css) — solo background/color, sin pointer-events anómalo.
- **`/promociones`** ([app/[locale]/promociones/page.tsx:178](src/app/[locale]/promociones/page.tsx)): condicional `items.length < 2 ? <EmptyState/> : <grid/>` oculta la única promoción activa.
- **`ComparePanel`** ([components/marketplace/ComparePanel.tsx:209-270](src/components/marketplace/ComparePanel.tsx)): 6 filas actuales hardcoded (Precio, Superficie, ROI, CapRate, Etapa, Desarrolladora).
- **Type `Property`** ([types/property.ts](src/types/property.ts)): expone `price.mxn`, `price.currency`, `priceMax`, `priceMaxUsd`, `location.{city,zone}`, `amenities[]`, `developmentType`, `kind` ('development'|'unit').

### Dependencias técnicas

- Next.js 16, TypeScript, Tailwind 4, next-intl.
- Supabase server client (RSC). Tema/tokens en `globals.css`.
- Playwright (tests/) para smoke.

### Constraints de negocio

- Branch `develop` está 2-3 commits ahead de `main` con deuda (commit `7bae658` image proxy validado). El merge a main exige autorización explícita de Luis ([feedback_harness_blocks_prod_ddl](feedback)).
- No hacer commits hasta la aprobación del spec.
- Workstream paralelo en branches `feat/dynamic-content-a1-pulido` — confirmar branch antes de cada commit ([feedback_propyte_dual_workstream_branches](feedback)).

### Stakeholders

- Luis Flores (decision maker + verificador visual).
- Sitio público en `propyte.com` (main) y `dev.propyte.com` (develop, Vercel).

## 5. Requirements

### 5.1 Funcionales

#### A. Filtros listados (TODAS las pills fallan — bug sistémico, decisión R4)

- [ ] **A1**: Instrumentar console.log temporal en [useFilters.ts:125-168](src/hooks/useFilters.ts) — al inicio del filter callback imprimir `{filters, propertiesCount: properties.length}`. Dentro del filter, antes de cada `return false`, imprimir el `(p.id, p.location.city, filters.city)` o equivalente al field evaluado.
- [ ] **A2**: Smoke-test en `dev.propyte.com/es/desarrollos`:
  - Sin filtros — verificar `properties.length` y `filtered.length` coinciden.
  - Aplicar Ubicación = "Cancún". Observar logs: ¿`filtered.length === 0`?, ¿qué propiedades caen y por qué condicional?
  - Repetir con Etapa, Tipo, etc.
- [ ] **A3**: Hipótesis prioritaria — mismatch de casing/format:
  - `filters.city='Cancún'` (con tilde) vs `p.location.city='Cancun'` (sin tilde, lowercase de BD) → todos fallan.
  - `filters.stage='preventa'` (lowercase, ya garantizado por VALID_STAGES filter en `useFilters.ts:38`) — debería matchear.
  - `filters.type` selecciona `'departamento'` (lowercase del array `typeOptions` en FilterBar:121-127); `p.specs.type` ya es lowercase canónico en mapper. Probablemente OK.
- [ ] **A4**: Verificar también que `properties` (input al hook) NO es `undefined` o `[]` para SSR/CSR mismatch. Si Server pasa array con N items y Client ve [], filtrar siempre vacía.
- [ ] **A5**: Fix:
  - Si el bug es ciudad con/sin acento: normalizar ambos lados (mapper produce sin tilde + dropdown muestra con tilde pero envía sin tilde, o viceversa).
  - Si es lógica del hook: aplicar fix.
- [ ] **A6**: Quitar console.logs antes de commit final.
- [ ] **A7**: Smoke test exhaustivo post-fix en ambas páginas.

#### B. Comparativa

- [ ] **B1**: Reemplazar las 6 filas actuales por filas condicionales por `kind`:
  - **Para `kind='development'`** — 5 filas: Precio desde, Precio hasta, Ubicación, # Amenidades, Tipo desarrollo.
  - **Para `kind='unit'`** — 4 filas: Precio (único), Ubicación, # Amenidades, Tipo.
  - **Modal mixto** (units + developments seleccionados) — render 5 filas; units quedan con `—` en "Precio hasta" para alinear columnas.
  - Valores:
    1. **Precio desde / Precio** — `PriceDisplay variant='dual' size='sm' originalCurrency={p.price.currency} mxn={p.price.mxn}` (dual = original arriba + referencial abajo).
    2. **Precio hasta** — `PriceDisplay variant='dual' size='sm' originalCurrency={p.price.currency} mxn={p.priceMax}` cuando `p.kind==='development' && p.priceMax`. Caso contrario: "—".
    3. **Ubicación** — `${p.location.city}` + `${p.location.zone}` en línea separada si existe.
    4. **# Amenidades** — `p.amenities?.length ?? 0` (numérico). Si la prop no existe o array vacío, mostrar "0".
    5. **Tipo desarrollo / Tipo** — `kind='development'`: `tDevTypes(p.developmentType)`. `kind='unit'`: `tTypes(p.specs.type)`.
- [ ] **B2**: Añadir i18n keys en `src/i18n/messages/es.json` y `en.json` namespace `marketplace`:
  - `comparePriceFrom` ("Precio desde" / "Starting price")
  - `comparePriceTo` ("Precio hasta" / "Ceiling price")
  - `comparePrice` ("Precio" / "Price") — para units.
  - `compareLocation` ("Ubicación" / "Location")
  - `compareAmenities` ("Amenidades" / "Amenities")
  - `compareDevelopmentType` ("Tipo de desarrollo" / "Development type")
  - `compareType` ("Tipo" / "Type") — para units.
- [ ] **B3**: Mantener encabezado de cada columna (foto + nombre + ciudad + link). Sin cambios en la lógica de selección/sticky bar.

#### C. Eliminar CurrencyToggle (canónico: moneda original + referencial)

- [ ] **C1**: Eliminar `<CurrencyToggle />` de [FilterBar.tsx:538-540](src/components/marketplace/FilterBar.tsx) (incluyendo el `import`).
- [ ] **C2**: Eliminar archivo [src/components/ui/CurrencyToggle.tsx](src/components/ui/CurrencyToggle.tsx).
- [ ] **C3**: Refactor `CurrencyContext` (decisión R2):
  - **Eliminar** del valor expuesto: `currency`, `toggleCurrency`, `convert`, `format`.
  - **Mantener únicamente** `{ rate, rateUpdatedAt }` para que `PriceDisplay` lea el TC Banxico.
  - El API consumer ahora SIEMPRE pasa por `<PriceDisplay variant='dual' originalCurrency={...} mxn={...}/>` para que sea explícito qué es original y qué es referencial.
- [ ] **C4**: Reemplazar todos los `format(p.price.mxn)` por `<PriceDisplay variant='dual' originalCurrency={p.price.currency} mxn={p.price.mxn} size='md'/>`:
  - [MarketplaceCard.tsx:55,59,75,341](src/components/marketplace/MarketplaceCard.tsx) — variant `'single'` o `'dual'` según contexto card (decisión: usar `'dual'` para cards grandes, `'inline'` para chips/badges, `'single'` para `/m²`).
  - [ComparePanel.tsx:216](src/components/marketplace/ComparePanel.tsx) — ya cambia con B1.
  - Cualquier otro consumer de `format()` que grep encuentre.
- [ ] **C5**: Verificar que `originalCurrency` se propaga correctamente desde mapper a card a PriceDisplay. Mapper ya lo emite ([development-to-property.ts:263](src/lib/mappers/development-to-property.ts)).
- [ ] **C6**: Auditar cards en `Home` (`FeaturedProperties`/`RecentBlog`/etc.) y aplicar mismo cambio.

#### D. WhatsApp button

- [ ] **D1**: Smoke test del click en home, listing, taxonomía, detail (mobile + desktop). Reportar exactamente en qué ruta y a qué scroll falla.
- [ ] **D2**: Si `trackWhatsAppClick` lanza error, envolver en `try { trackWhatsAppClick(...) } catch {}` para no romper navegación.
- [ ] **D3**: Bajar threshold `scrollY > 300` → `> 100` (decisión R1) para que el botón aparezca antes en home + listings.
- [ ] **D4**: Verificar que no hay `pointer-events-none` heredado de algún parent (mantener listener directo en `<a>`).
- [ ] **D5**: Verificar que `phone` se compone bien con `NEXT_PUBLIC_WHATSAPP_PHONE` o fallback. En dev local `.env.local` puede ser que falte ([feedback_propyte_hub_url_env_local](feedback) análogo).

#### E. /promociones threshold

- [ ] **E1**: Cambiar [promociones/page.tsx:178](src/app/[locale]/promociones/page.tsx) `items.length < 2` → `items.length < 1`. La condición de `items.length === 0` muestra el `EmptyState`; con 1+ item muestra el grid.
- [ ] **E2**: Mantener gate del JSON-LD schema en `items.length >= 2` para evitar `CollectionPage` con un solo `ListItem` (no es semánticamente coherente).
- [ ] **E3**: Verificar que `countLabel` traduce correctamente "1 promoción activa" / "1 active promotion" en singular.

#### F. Contraste precio referencial

- [ ] **F1**: Añadir prop `tone?: 'light' | 'dark'` a `PriceDisplay` (default `'light'`).
- [ ] **F2**: En tone `'dark'`:
  - Span secundario: `text-white/75` en vez de `text-gray-500`.
  - `(Referencial)`: `text-white/55` sin `opacity-70` (combinar opacities da contraste insuficiente).
  - Nota TC Banxico (`showRateNote`): `text-white/60` (sólo visible cuando `showRateNote=true`).
- [ ] **F3**: **Auditar Playwright** (decisión R5) — script que captura screenshots de las surfaces conocidas con `PriceDisplay` y las clasifica light vs dark:
  - `/es/propiedades/<slug>` (detail unit) — FloatingKeyData
  - `/es/desarrollos/<slug>` (detail dev) — DevelopmentKeyData
  - StickyBar, MobileContactBar (al scrollear detail)
  - ShareDownloadModal (al click Share)
  - Cualquier card visible en `/`, `/desarrollos`, `/promociones` que rendrice precio
  - Reportar lista de callsites que deben recibir `tone='dark'`.
- [ ] **F4**: Propagar `tone='dark'` en todos los callsites identificados en F3. Mínimo confirmado:
  - [FloatingKeyData.tsx:83](src/components/property/FloatingKeyData.tsx) (precio post-descuento y precio normal).
  - [DevelopmentKeyData.tsx:64](src/components/property/DevelopmentKeyData.tsx) (precio).
- [ ] **F5**: Subir contraste del comentario "El precio referencial se calcula con TC Banxico..." en ambos componentes ([FloatingKeyData.tsx:157](src/components/property/FloatingKeyData.tsx) y [DevelopmentKeyData.tsx:135](src/components/property/DevelopmentKeyData.tsx)): cambiar `text-gray-500` → `text-white/65`. Verificar que `p` está dentro del scope dark — sí lo está (mismo wrap).

### 5.2 No funcionales

- **Performance**: Sin regresión en LCP/CLS. PriceDisplay variant='dual' agrega un `<span>` por precio — impacto trivial.
- **Accesibilidad**: WCAG AA contraste ≥ 4.5:1 para texto pequeño. `text-white/75` sobre `#1A2F3F` da ~6.5:1 ✓. `text-white/55` sobre `#1A2F3F` da ~4.6:1 ✓.
- **SEO**: Sin cambio en metadata, schema.org de `/promociones` mantiene gate ≥2 items.
- **i18n**: 5 nuevas keys (`compare*`) en ES + EN. Default fallback (next-intl) si falta. Verificar que `MISSING_MESSAGE` no aparezca (memoria `feedback_next_intl_path_fallback`).
- **Tests**: Playwright smoke por surface en `tests/` (existentes pueden cubrir, sino añadir tests cortos).

## 6. Approach / Arquitectura propuesta

### Orden de ejecución

1. **F (contraste)** primero — cambio aislado en `PriceDisplay` + 2 callsites. Bajo riesgo, alto impacto visual. Permite verificar `tone` API antes de cascadas mayores.
2. **E (promociones)** segundo — 2 líneas de código, valor inmediato visible.
3. **C (currency)** tercero — refactor más amplio. Toca múltiples componentes. Debe hacerse antes de B para evitar repasar ComparePanel dos veces.
4. **B (comparativa)** cuarto — depende de C (PriceDisplay sin currency toggle).
5. **D (WhatsApp)** quinto — diagnóstico smoke test → fix puntual.
6. **A (filtros)** último — requiere smoke test multi-pill para identificar qué falla exactamente; puede ser zero-code-change si solo es ajuste i18n o solo un caso.

### Decisiones clave

- **Por qué eliminar el toggle**: simplifica cognición — el usuario ve "MXN $X (Referencial USD $Y)" sin necesidad de cambiar, sabe cuál paga, sabe cuál es estimado. Elimina edge cases del toggle (e.g., en cards de Home con desarrollos USD y unidades MXN mezclados).
- **Por qué tone prop en PriceDisplay (no auto-detect)**: detección por `className.includes('text-white')` es frágil; prop explícita es más mantenible.
- **Por qué mantener `useCurrency()`**: PriceDisplay sigue necesitando `rate` y `rateUpdatedAt` para conversión + label TC Banxico.
- **Por qué no merge a main en este spec**: la deuda develop→main ya es considerable; queremos verificar todo el bundle en `dev.propyte.com` antes de promoción.

### Archivos a tocar (estimado)

```
src/
  components/
    ui/
      PriceDisplay.tsx           (F: prop tone, conditional classes)
      CurrencyToggle.tsx         (C: eliminar archivo)
    marketplace/
      ComparePanel.tsx           (B: nuevas 5 filas; C: quitar useCurrency)
      FilterBar.tsx              (C: quitar import + render)
      MarketplaceCard.tsx        (C: format() → PriceDisplay)
    property/
      FloatingKeyData.tsx        (F: tone='dark')
      DevelopmentKeyData.tsx     (F: tone='dark')
    shared/
      WhatsAppButton.tsx         (D: try/catch + threshold opt)
    home/
      FeaturedProperties.tsx     (C: si usa format)
  context/
    CurrencyContext.tsx          (C: API slim)
  app/
    [locale]/
      promociones/page.tsx       (E: threshold ≥1)
  i18n/messages/
    es.json                      (B: 5 keys)
    en.json                      (B: 5 keys)
  lib/mappers/
    development-to-property.ts   (A: only if mismatch detected)
    unit-to-property.ts          (A: only if mismatch detected)
```

## 7. Acceptance Criteria

- [ ] Smoke test en `dev.propyte.com/es/desarrollos`: cada pill (Ubicación, Precio, Tipo, Recámaras, Etapa, Tipo desarrollo, ROI) cambia el `resultCount` y los cards visibles. Idem en `/es/propiedades`.
- [ ] Modal Comparativa abre desde sticky bar y muestra exactamente 5 filas: Precio desde, Precio hasta, Ubicación, # Amenidades, Tipo desarrollo. Cada celda con valor real (sin "undefined" ni "—" donde haya dato).
- [ ] No existe `<CurrencyToggle>` en el DOM de ninguna página (verificar via Playwright `expect(...).toHaveCount(0)`).
- [ ] Cards Home, /desarrollos, /propiedades, /promociones muestran precio en formato "MXN $X,XXX,XXX" arriba y "(USD $YYY,YYY) (Referencial)" abajo (o inverso si la unidad es USD nativa).
- [ ] Click en el botón flotante de WhatsApp abre `https://wa.me/...` en nueva pestaña con preset correcto. Smoke en home, listing, detail.
- [ ] `/promociones` con 1 promoción activa muestra el grid de 1 card (no el EmptyState).
- [ ] En unit/development detail, el precio referencial es legible sobre el fondo oscuro (subjetivo + axe/Lighthouse contraste ≥ AA).
- [ ] `npm run build` pasa sin errores TS ni eslint.
- [ ] Playwright suite sigue verde (o solo fallos pre-existentes documentados).
- [ ] No hay commits a `main`; trabajo en `develop`.

## 8. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Cambio en API `useCurrency()` rompe consumers no detectados por grep | M | M | Hacer grep multi-pattern (`useCurrency`, `format(`, `currency`, `convert`); ESLint + TS build atrapa importes rotos. |
| Filtros: el bug es específico de v_units que devuelve `specs.type` legacy → fix mapper afecta otras superficies | L | M | Si toca mapper, verificar pages que usan `p.specs.type`: detail page, card badges, schemas. |
| Comparativa: `priceMax` no existe para developments con 0 unidades aprobadas → `priceMax === undefined` | M | L | Renderizar "—" cuando undefined. Documentar en B1. |
| WhatsApp threshold scrollY > 100 puede solaparse con CookieBanner mobile | L | L | El CookieBanner ya tiene su z-index — verificar visualmente en `dev.propyte.com`. |
| `/promociones` con 1 item: SEO podría preferir noindex hasta tener ≥2 | L | L | Mantener `<meta robots="index">` (default). Schema gate ≥2 evita pollution. |
| Refactor C dispara ISR re-cache largo en Vercel | M | L | Aceptable; el changeset es claro y trivialmente revertible commit-a-commit. |
| Removal de toggle puede sorprender usuarios acostumbrados al MXN/USD switch | L | M | Posicionamiento dual (`$MXN ... (USD ref.)`) suple el caso de uso original. Decisión del usuario (Luis). |

## 9. Resolved Decisions (2026-05-23 — respuestas Luis)

- **R1 (D3)**: WhatsApp threshold baja a `scrollY > 100`. Mejor descubrimiento en home + listings antes de scroll largo.
- **R2 (C3)**: La UI debe dejar **siempre claro cuál es original y cuál es referencial** según el tipo de cambio. Decisión: **forzar `<PriceDisplay variant='dual' originalCurrency={p.price.currency}/>` en todos los callsites de precio**. El label "(Referencial)" ya marca el secundario; el primario es la moneda nativa (BD). Eliminar `format()` del API de `useCurrency()`; sólo exponer `{rate, rateUpdatedAt}`.
- **R3 (B1)**: Para `kind='unit'`: **solo fila "Precio"** (precio único). Para `kind='development'`: fila "Precio desde" + fila "Precio hasta". Cuando el modal mezcla units y developments, ambas filas se muestran y units quedan con "—" en "Precio hasta" (renderizado consistente para alinear columnas).
- **R4 (A2)**: El bug reportado es **TODAS las pills fallan** — al aplicar cualquier filtro la lista se vacía (no muestra los items que ya estaban listados sin filtro). Esto sugiere bug sistémico en el pipeline. Plan diagnóstico:
  - Console-log temporal en [useFilters.ts:125-168](src/hooks/useFilters.ts) imprimiendo `(p.id, condition, filterValue, pValue)` por cada propiedad descartada.
  - Hipótesis prioritaria: mismatch de casing en `city`/`zone`/`type`/`stage`/`developmentType` entre lo que el dropdown envía (`'Cancun'`, `'preventa'`) y lo que el mapper produce (`'cancun'`, `'Capitalized'`).
  - Reproducir en `dev.propyte.com/es/desarrollos`: aplicar un solo pill conocido (e.g. Ubicación → "Cancún" sabiendo que hay listings de Cancún) y capturar el repro.
- **R5 (F3)**: **Auditar via Playwright todas las surfaces dark que rendericen `PriceDisplay`**. Capturar screenshots en cada surface y propagar `tone='dark'` donde aplique. Candidatos conocidos: FloatingKeyData, DevelopmentKeyData, StickyBar, MobileContactBar, ShareDownloadModal. El audit Playwright genera la lista exhaustiva.

## 10. Plan de tareas (preliminar)

### Bloque F — Contraste PriceDisplay (1 sesión)
- [ ] F.1 — Añadir prop `tone?: 'light'|'dark'` a [PriceDisplay.tsx](src/components/ui/PriceDisplay.tsx). Conditional classes.
- [ ] F.2 — Propagar `tone='dark'` en [FloatingKeyData.tsx](src/components/property/FloatingKeyData.tsx) y [DevelopmentKeyData.tsx](src/components/property/DevelopmentKeyData.tsx).
- [ ] F.3 — Subir contraste del nota TC Banxico (`text-gray-500 → text-white/65`) en ambos componentes.
- [ ] F.4 — Playwright smoke: screenshots de unit detail + dev detail, verificar visual.

### Bloque E — Promociones threshold (15 min)
- [ ] E.1 — Editar [promociones/page.tsx:178](src/app/[locale]/promociones/page.tsx) threshold ≥1; mantener schema gate ≥2.
- [ ] E.2 — Verificar singular i18n `countLabel` ES + EN.
- [ ] E.3 — Smoke en `dev.propyte.com/es/promociones`.

### Bloque C — Eliminar CurrencyToggle (2-3 sesiones)
- [ ] C.1 — Grep exhaustivo `useCurrency|CurrencyToggle|format\(`. Listar todos los callsites.
- [ ] C.2 — Refactor [CurrencyContext.tsx](src/context/CurrencyContext.tsx): API slim `{rate, rateUpdatedAt, formatMxn?}`.
- [ ] C.3 — Reemplazar `format(p.price.mxn)` por `<PriceDisplay/>` en cada callsite identificado.
- [ ] C.4 — Eliminar [FilterBar.tsx:538-540](src/components/marketplace/FilterBar.tsx) `<CurrencyToggle/>`.
- [ ] C.5 — Eliminar archivo [CurrencyToggle.tsx](src/components/ui/CurrencyToggle.tsx).
- [ ] C.6 — `npm run build` + ESLint clean.
- [ ] C.7 — Playwright smoke en `/`, `/desarrollos`, `/propiedades`, `/promociones`, detail unit, detail dev.

### Bloque B — ComparePanel 5 filas (1 sesión)
- [ ] B.1 — Editar [ComparePanel.tsx:209-270](src/components/marketplace/ComparePanel.tsx) — nuevas 5 filas con switch por `kind`.
- [ ] B.2 — Añadir 5 i18n keys en `es.json` + `en.json` namespace `marketplace`.
- [ ] B.3 — Playwright smoke: abrir modal con 2 devs + 2 units mezclados, verificar filas.

### Bloque D — WhatsApp diagnóstico (1 sesión)
- [ ] D.1 — Smoke manual con DevTools open en cada surface (home, listing, taxonomía, detail, mobile + desktop). Reportar.
- [ ] D.2 — Aplicar try/catch en `trackWhatsAppClick`.
- [ ] D.3 — Bajar threshold a 100 si Luis aprueba (Q1).
- [ ] D.4 — Verificar `NEXT_PUBLIC_WHATSAPP_PHONE` en `.env.local`.

### Bloque A — Filtros (variable)
- [ ] A.1 — Smoke test exhaustivo cada pill en `dev.propyte.com/es/{desarrollos,propiedades}`.
- [ ] A.2 — Identificar pill(s) rotas, capturar repro exacto.
- [ ] A.3 — Si es mismatch mapper: normalizar y agregar test en `useFilters.test.ts`. Si es lógica: fix en hook.
- [ ] A.4 — Verificar `usage` filter (AdvancedFilters).

### Bloque final — Integración + verificación
- [ ] Z.1 — Build + lint + typecheck final en `develop`.
- [ ] Z.2 — Playwright suite completa.
- [ ] Z.3 — Visual regression manual en `dev.propyte.com` (Vercel auto-deploy de develop).
- [ ] Z.4 — Listo para autorización Luis → merge develop→main → Hostinger pull.
