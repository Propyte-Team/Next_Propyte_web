# Spec: Tier 1 Quick Wins de Optimización — Performance, Observabilidad y SEO

> Estado: **draft** | Fecha: 2026-05-13 | Proyecto: Next_Propyte_web

## 1. Overview

Adopción simultánea de 5 mejoras de bajo costo y alto impacto sobre el sitio público `propyte.com`. El objetivo es elevar la calidad de la experiencia (smooth scroll, blur placeholders), la observabilidad de errores en producción (Sentry), la salud del bundle (analyzer) y la calidad del social sharing (next/og uplift). Todas las piezas son **aditivas y reversibles**, no rediseñan UI ni cambian arquitectura de datos.

El timing es relevante porque el sitio acaba de cerrar la spec `content-audit-seo-2026` (branch pusheada esperando merge a `develop`) y está en plena transición WP → Next.js en producción. Sin observabilidad (Sentry) ni baseline de bundle (analyzer), cada release a Hostinger es un salto a ciegas.

Este bloque NO incluye Tier 2 (PostHog, Embla, TanStack Query, Magic UI), que se evaluarán en spec posterior.

## 2. Goals

- **G1.** Instalar Lenis con respeto a `prefers-reduced-motion`, integrado en `app/layout.tsx` sin romper animaciones Framer Motion existentes (`ScrollReveal.tsx`, parallax en `.propyte-hero-canvas`).
- **G2.** Configurar `@next/bundle-analyzer` y entregar **un reporte** con las 3 oportunidades top de reducción de JS shipped al cliente (candidatos: `recharts`, `@react-pdf/renderer`, `html2canvas`, barrel imports de `lucide-react`).
- **G3.** Integrar `plaiceholder` en las queries Supabase de unidades y desarrollos, exponiendo `blur_data_url` y aplicándolo a los `<Image placeholder="blur">` de cards y hero.
- **G4.** Auditar la cobertura existente de `opengraph-image.tsx` y completarla en rutas faltantes (lista en sección 6.4). Mejorar el template `OGFrame.tsx` para consumir datos reales del desarrollo/unidad (nombre, precio desde, ubicación, hero image) en vez de copy genérico.
- **G5.** Instalar Sentry para Next.js (client + server + edge) con source maps subidos en CI, captura de `onRequestError`, breadcrumbs y un `global-error.tsx` capturando errores de renderizado RSC. Tier gratis es suficiente.
- **G6.** Documentar en `task_manager.md` y en memoria del proyecto cómo verificar cada win (Lighthouse, build size diff, OG preview de cada ruta, dashboard Sentry).

## 3. Non-Goals

- **NO** se rediseña UI ni se cambia paleta. Lenis se aplica con `lerp` conservador para no alterar la sensación actual.
- **NO** se reemplaza Framer Motion 12 por motion.dev (Tier 3 backlog).
- **NO** se migra de Google Maps a MapLibre (Tier 3 backlog).
- **NO** se cambia `images.unoptimized: true` en `next.config.ts` (decisión activa por Hostinger standalone — solo se documenta como nota).
- **NO** se reemplaza GA4 + Hotjar + Meta Pixel por PostHog (Tier 2).
- **NO** se tocan templates de email (Tier 2 considera React Email).
- **NO** se modifican formularios Zoho (esa work-stream tiene branch propia `feat/zoho-forms-integration`).

## 4. Context y constraints

### 4.1 Estado actual relevante

- **Branch base recomendada:** `develop` (limpia tras merge de SEO spec). Branch nueva propuesta: `feat/perf-optimization-tier-1`.
- **Branch activa hoy:** `feat/zoho-forms-integration` (no tocar — work-stream paralela).
- **next/og parcial:** existen `src/lib/og/{OGFrame.tsx, fonts.ts}` + `opengraph-image.tsx` en `/desarrollos/[slug]`, `/blog/[slug]`, `/built`, `/metodologia`, `/aviso-legal-inversion`. Falta cobertura en otras rutas (ver 6.4).
- **`images.unoptimized: true`** en `next.config.ts` — desactiva el Image Optimizer de Next. Plaiceholder sigue funcionando (es server-side, usa Sharp directamente).
- **CSP en `next.config.ts`** está como `Content-Security-Policy-Report-Only`. Sentry necesita ampliar `connect-src` (`*.ingest.sentry.io`) y opcionalmente `script-src` (`browser.sentry-cdn.com`) si se usa CDN del SDK.
- **GA4 + Hotjar + Meta Pixel + GTM** ya cargados (líneas 89-102 de `src/app/layout.tsx` + CSP). Sentry se suma sin reemplazarlos.
- **Sharp 0.34** ya está instalado → plaiceholder lo aprovecha sin agregar dependencias nativas extra.
- **Memoria autoriza Lenis** explícitamente (`feedback_nativa_lenis_smooth_scroll.md`): "Elegir Lenis (MIT) si GSAP Club GreenSock no disponible. Respeta prefers-reduced-motion".
- **Deploy:** prod Hostinger via GitHub Actions a `main`. Staging Vercel via CLI manual a `dev.propyte.com`. Sentry source maps deben subirse en ambos pipelines.

### 4.2 Dependencias técnicas a agregar

| Paquete | Tipo | Versión objetivo |
|---|---|---|
| `lenis` | dep | `^1.3.x` (paquete oficial darkroomengineering, no el legacy `@studio-freight/lenis`) |
| `@next/bundle-analyzer` | devDep | `^16.2.x` (alineado con `next ^16.2.6`) |
| `plaiceholder` | dep | `^3.0.x` |
| `@plaiceholder/next` | dep | `^3.0.x` |
| `@sentry/nextjs` | dep | `^8.x` (versión que soporte Next 16 + React 19) |

### 4.3 Constraints de negocio

- **Performance budget:** el bundle JS shipped al cliente no debe **crecer netamente** tras este spec. Sentry agrega ~50 kB; debe compensarse identificando ≥50 kB para lazy-load o quitar.
- **Compliance / privacy:** Sentry debe configurarse con `sendDefaultPii: false` y `replaysSessionSampleRate ≤ 0.1` (10%) en prod para evitar capturar input de formularios de leads. Replay solo en error: `replaysOnErrorSampleRate: 1.0`.
- **A11y:** Lenis NO debe activarse si el usuario tiene `prefers-reduced-motion: reduce`. Validar con axe + smoke Playwright.
- **No subir secrets:** `SENTRY_AUTH_TOKEN` solo en GitHub Actions secrets + Vercel env vars (no `.env` committed).

### 4.4 Stakeholders

- **Luis Flores** — owner del producto, valida UX (smooth scroll feel) y revisa OG previews.
- Operación CRM — beneficiarios indirectos de Sentry (menos "no funciona" sin contexto).

## 5. Requirements

### 5.1 Funcionales

- [ ] **F1.** El sitio scrollea con momentum suave en cualquier ruta `/[locale]/*`. El usuario percibe transición continua, no salto de frame.
- [ ] **F2.** Cuando el navegador reporta `prefers-reduced-motion: reduce`, Lenis NO inicia y el scroll vuelve al comportamiento nativo del browser.
- [ ] **F3.** `npm run build` con `ANALYZE=true` genera `analyze/client.html`, `analyze/nodejs.html`, `analyze/edge.html` con el treemap.
- [ ] **F4.** Cada card de unidad/desarrollo renderiza con un blur placeholder tinted (color promedio real) antes de la imagen completa, eliminando el flash blanco.
- [ ] **F5.** Compartir cualquier URL de `propyte.com/[locale]/desarrollos/[slug]` en WhatsApp / Meta Ads / Twitter muestra un preview con: foto hero del desarrollo, nombre, precio desde, ubicación, logo Propyte. Equivalente para `/built/[slug]`, `/blog/[slug]`, `/propiedades/[id]`, y las rutas listadas en 6.4.
- [ ] **F6.** Cuando un error JS ocurre en client o server en producción, llega un evento a Sentry con stack trace mapeado al TypeScript original (no minified) y los breadcrumbs de la sesión.
- [ ] **F7.** Cuando un error de renderizado RSC ocurre, `app/global-error.tsx` lo reporta a Sentry y muestra una pantalla amigable (no el default de Next).
- [ ] **F8.** `instrumentation.ts` captura errores de request server con `onRequestError`.

### 5.2 No funcionales

- **Perf.** Lighthouse mobile (3G simulado) en home `/es`: LCP ≤ 2.5s, CLS ≤ 0.05, TBT ≤ 200ms tras la integración de plaiceholder (medir antes/después).
- **Bundle.** El JS cliente neto (suma de chunks de `_app` + ruta más pesada) NO debe crecer >0 kB. Ganancia esperada: -50 a -200 kB por lazy-load identificado en el analyzer.
- **Observabilidad.** Sentry captura ≥95% de errores no atrapados en producción durante una semana piloto.
- **Privacy.** Sentry NO captura inputs de formularios (mask inputs, `beforeSend` filtra PII en URL params).
- **SEO.** Todas las rutas indexables en `src/app/sitemap.ts` tienen `opengraph-image.tsx` válido (validación Playwright con `expect(response.headers['content-type']).toMatch(/image/)`).
- **A11y.** Tests existentes axe-core siguen pasando (`npm run test:e2e`).

## 6. Approach / Arquitectura propuesta

### 6.1 Lenis

- Crear `src/components/providers/SmoothScrollProvider.tsx` (Client Component).
- Init de Lenis dentro de `useEffect`, con guard `if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;`.
- Config: `lerp: 0.1`, `wheelMultiplier: 1`, `smoothWheel: true`, sin overscroll.
- Loop con `requestAnimationFrame`, cleanup en unmount.
- Wrap en `src/app/[locale]/layout.tsx` (NO en root `app/layout.tsx` para evitar correr en `/admin` y `/design-playground` que pueden tener UI denso o iframes).
- Hook utilitario `useLenisAnchor()` para enlaces internos (`<a href="#section">`) — ata click → `lenis.scrollTo(target)`.
- Verificar que Framer Motion `whileInView` y `useScroll` siguen funcionando: Lenis dispara eventos `scroll` nativos, no necesitan adaptador.

### 6.2 @next/bundle-analyzer

- Instalar como devDep.
- Envolver export en `next.config.ts`:
  ```ts
  import bundleAnalyzer from '@next/bundle-analyzer';
  const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
  export default withBundleAnalyzer(withNextIntl(nextConfig));
  ```
- Agregar script `"analyze": "cross-env ANALYZE=true next build"` (o `ANALYZE=true next build` en Linux/Mac).
- Tras primer run, escribir `docs/bundle-baseline-2026-05-13.md` con: tamaño chunks pre-cambios + lista priorizada de oportunidades.
- Implementar **al menos 2** quick fixes detectados (ej. lazy-load `recharts`, lazy-load `@react-pdf/renderer` a route handler, fix barrel imports `lucide-react`).
- Segundo run del analyzer para validar la mejora; commit baseline + after.

### 6.3 plaiceholder

- Instalar `plaiceholder` + `@plaiceholder/next`.
- En `src/lib/supabase/queries.ts` (o helpers equivalentes), agregar función `withBlurDataURL<T extends { image_url?: string }>(item: T)` que llame `getPlaiceholder(item.image_url)` y retorne `{ ...item, blurDataURL: base64 }`.
- Aplicar a queries de:
  - `getDevelopers()` / `getDeveloperBySlug()` → hero image del desarrollo.
  - Listado de unidades en `/propiedades` y `/desarrollos/[slug]` → thumbnail.
  - Hero del home (si hay imagen Supabase).
- Cache en columna nueva `blur_data_url TEXT` en `Propyte_desarrolladores` y `Propyte_unidades` para evitar recomputar en cada ISR build. Trigger en Supabase (o cron en hub) regenera al subir nueva imagen.
- Para imágenes legacy sin cache, fallback computa al vuelo y se persiste (write-back).
- Cambiar `<Image>` de cards: agregar `placeholder="blur"` + `blurDataURL={unit.blurDataURL}`.

### 6.4 next/og audit + uplift

**Auditoría — rutas con OG hoy:**
- `[locale]/desarrollos/[slug]` ✅
- `[locale]/blog/[slug]` ✅
- `[locale]/built` ✅
- `[locale]/metodologia` ✅
- `[locale]/aviso-legal-inversion` ✅

**Rutas top que faltan (a confirmar en review):**
- `[locale]/page.tsx` (home) — alta prioridad
- `[locale]/desarrollos/page.tsx` (índice) — alta prioridad
- `[locale]/propiedades/[id]` o `[locale]/propiedades/page.tsx` — alta prioridad (unidades individuales reciben más share que desarrollo padre)
- `[locale]/desarrollos/etapa/[stage]`, `[locale]/desarrollos/tipo/[type]` — landing SEO
- `[locale]/desarrollos/cancun|tulum|merida|playa-del-carmen` — landing por ciudad
- `[locale]/contacto`, `[locale]/nosotros/quienes-somos`, `[locale]/nosotros/equipo-comercial`
- `[locale]/financiamiento`, `[locale]/como-comprar`, `[locale]/como-invertir`
- `[locale]/destacados`, `[locale]/promociones`, `[locale]/mercado`

**Uplift template `OGFrame.tsx`:**
- Variante actual: muy probablemente título + bg simple. Confirmar al iniciar Tarea 4.
- Variante objetivo:
  - Foto hero del desarrollo/unidad como bg con overlay aztec `#0F1923` 60%.
  - H1 (Space Grotesk Bold 64-72px) con título.
  - Sub-línea con precio desde (Jet Brains Mono) + ubicación (Space Grotesk Regular).
  - Logo Propyte top-left.
  - URL `propyte.com` bottom-right.
- Variante para rutas sin entidad (home, /nosotros): bg degradado teal→aztec + título + tagline.

### 6.5 Sentry

- `npx @sentry/wizard -i nextjs` con DSN del proyecto Propyte (a crear en Sentry).
- Genera: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`, `app/global-error.tsx`. Wrapper `withSentryConfig` aplicado a `next.config.ts`.
- Config crítica:
  - `tracesSampleRate: 0.1` en prod (10%), `1.0` en dev.
  - `replaysSessionSampleRate: 0.05`, `replaysOnErrorSampleRate: 1.0`.
  - `sendDefaultPii: false`.
  - `beforeSend(event)` filtra `query`/`headers.cookie` por seguridad.
  - `ignoreErrors: ['ChunkLoadError', 'ResizeObserver loop limit exceeded', ...]` para ruido conocido.
- Source maps:
  - Subir en CI Hostinger (`.github/workflows/deploy.yml`): paso `sentry-cli releases files ... upload-sourcemaps`.
  - Subir en Vercel: el plugin `withSentryConfig` lo hace automático si `SENTRY_AUTH_TOKEN` está en env.
- CSP update:
  - `connect-src` agregar `https://*.ingest.sentry.io`.
  - Validar en staging que reportes lleguen.

### 6.6 Decisiones clave / alternativas descartadas

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Lenis | GSAP ScrollSmoother | Requiere Club GreenSock ($$$). Lenis MIT, memoria ya lo autoriza. |
| Lenis | Locomotive Scroll | Más pesado, peor compat React 19. Lenis es referencia de awwwards 2026. |
| Sentry | LogRocket / Highlight | Sentry tier free generoso + integración Next 16 oficial + replay nativo. |
| Sentry | Bugsnag | Comunidad y docs Sentry para Next 16 son superiores. |
| plaiceholder | blurhash | blurhash requiere canvas (no SSR-friendly), no produce base64 directo para `blurDataURL`. |
| next/og uplift | Generación al build con script externo | Generación on-demand cachea en CDN, NO añade tiempo de build, escala con catálogo. |
| Bundle analyzer | webpack-bundle-analyzer manual | `@next/bundle-analyzer` es el wrapper oficial — alineado con Next 16. |

## 7. Acceptance Criteria

- [ ] **AC1.** `npm run dev` y `npm run build` corren sin warnings nuevos. Type-check (`tsc --noEmit`) limpio.
- [ ] **AC2.** Scroll en `/es`, `/es/desarrollos`, `/es/desarrollos/[slug]` se siente continuo. Toggle DevTools "Emulate prefers-reduced-motion: reduce" → scroll vuelve a nativo.
- [ ] **AC3.** `ANALYZE=true npm run build` genera `analyze/*.html`. `docs/bundle-baseline-2026-05-13.md` existe con before/after.
- [ ] **AC4.** Bundle JS shipped al cliente (suma de chunks de la ruta más pesada) **NO crece** versus baseline pre-spec.
- [ ] **AC5.** Lighthouse mobile 3G en `/es` y `/es/desarrollos/[slug]`: LCP ≤ 2.5s, CLS ≤ 0.05 (medido con Playwright lighthouse-runner o run manual).
- [ ] **AC6.** Card de unidad muestra blur tinted antes de imagen real (visualmente verificado en Playwright screenshot diff o manual).
- [ ] **AC7.** Las rutas listadas en 6.4 (auditoría OG) tienen `opengraph-image.tsx` y devuelven `Content-Type: image/png|jpeg`. Playwright tests cubren al menos las top-5.
- [ ] **AC8.** Compartir `propyte.com/es/desarrollos/[un-slug-real]` en WhatsApp Desktop muestra preview con foto + nombre + precio desde + ubicación.
- [ ] **AC9.** Sentry dashboard recibe ≥1 evento desde dev.propyte.com (forzar error de prueba con un click handler temporal).
- [ ] **AC10.** Source maps en Sentry funcionan: stack trace de error de prueba apunta a `.tsx` original.
- [ ] **AC11.** Tests `npm run test:e2e` siguen pasando (no regresiones a11y).
- [ ] **AC12.** Memoria actualizada: `project_next_propyte_web_estado.md` refleja Tier 1 completado.

## 8. Riesgos y mitigaciones

| Riesgo | Prob | Impacto | Mitigación |
|---|---|---|---|
| Lenis rompe parallax/animaciones existentes en hero | M | M | Smoke Playwright sobre hero `.propyte-hero-canvas`. Toggle env `NEXT_PUBLIC_LENIS=0` para desactivar runtime sin redeploy. |
| Lenis interfiere con anchor links / `scroll-margin-top` | M | L | Hook `useLenisAnchor()` + tests en navegación interna (FAQ, Glosario que usan anchors). |
| plaiceholder agrega tiempo de build prohibitivo | L | M | Cachear `blur_data_url` en columna Supabase. Build solo recomputa cuando cambia `image_url`. |
| Sentry agrega 50 kB al cliente sin compensar con tree-shake | M | M | El AC4 obliga a no crecer neto. Si no se compensa, lazy-load Sentry replay (`lazy: true` o dynamic init). |
| Source maps subidos públicamente exponen código | L | M | Plugin Sentry sube y borra (`hideSourceMaps: true`). Verificar que `/_next/static/chunks/*.js.map` NO sea fetchable en prod. |
| Sentry captura PII en URL params (`?email=...`) | M | M | `beforeSend` sanitiza. Tests unitarios para `beforeSend`. |
| CSP `Content-Security-Policy-Report-Only` bloquea Sentry si Luis lo flippa a enforcing antes de validar | L | H | Agregar `*.ingest.sentry.io` a `connect-src` en este spec aunque CSP siga Report-Only. |
| OG audit descubre 15+ rutas sin OG y se vuelve épica | M | L | Acotar Tarea 4 a top-5 rutas listadas en 6.4. Resto va a backlog. |
| `images.unoptimized: true` limita el ganga de plaiceholder | L | L | Plaiceholder solo aporta `blurDataURL`. La optimización de la imagen "grande" sigue limitada por la config actual — fuera de alcance de este spec. |

## 9. Open Questions

1. **Branch de trabajo.** ¿Creamos `feat/perf-optimization-tier-1` desde `develop` actual? ¿O esperamos a que `feat/zoho-forms-integration` se mergee antes para evitar conflictos en `src/lib/`?
2. **Sentry project.** ¿Reutilizamos un proyecto Sentry existente (otros proyectos Propyte) o creamos uno nuevo `propyte-web`? Free tier limita a un org.
3. **OG audit scope.** ¿Confirmamos las top-13 rutas listadas en 6.4 o priorizamos solo home + propiedades + desarrollos índice + 4 ciudades (top-7)?
4. **plaiceholder cache.** ¿Está OK agregar columna `blur_data_url TEXT` en `Propyte_desarrolladores` y `Propyte_unidades`, o preferimos cachear en Vercel KV / Redis del hub? (BD es más simple, regenera en webhook).
5. **Lenis scope.** ¿Activar Lenis en TODAS las rutas `[locale]/*` o solo en home + landings de marketing? (`/admin` y `/design-playground` ya excluidos).
6. **Bundle baseline.** ¿Comprometemos el baseline (`docs/bundle-baseline-*.md`) al repo o solo lo dejamos local? Yo recomendaría comprometer para tracking histórico.
7. **Lighthouse target.** ¿Las métricas de AC5 (LCP ≤ 2.5s, CLS ≤ 0.05) son aceptables o queremos un piso más estricto?

## 10. Plan de tareas (preliminar)

> Estas tareas se promueven a `task_manager.md` tras aprobación.

### Bloque QW-1 — Setup y branch
- [ ] **QW-1.1** Crear branch `feat/perf-optimization-tier-1` desde `develop`. Confirmar libre de conflictos con `feat/zoho-forms-integration`.
- [ ] **QW-1.2** Documentar baseline pre-cambios: Lighthouse + bundle size + lista de rutas con OG. Output: `docs/bundle-baseline-2026-05-13.md`.

### Bloque QW-2 — Lenis (smooth scroll)
- [ ] **QW-2.1** Instalar `lenis`. Crear `src/components/providers/SmoothScrollProvider.tsx` con guard `prefers-reduced-motion`.
- [ ] **QW-2.2** Envolver `src/app/[locale]/layout.tsx` con el provider.
- [ ] **QW-2.3** Crear `useLenisAnchor()` y aplicarlo a navegación interna (FAQ, Glosario, anchor scroll del footer).
- [ ] **QW-2.4** Smoke Playwright: scroll en home, desarrollos, blog. Toggle reduced-motion en test.

### Bloque QW-3 — Bundle analyzer
- [ ] **QW-3.1** Instalar `@next/bundle-analyzer`, integrar en `next.config.ts`. Script `npm run analyze`.
- [ ] **QW-3.2** Run inicial. Documentar top-3 oportunidades en `docs/bundle-baseline-2026-05-13.md`.
- [ ] **QW-3.3** Implementar 2 quick fixes (candidatos: `recharts` lazy, `@react-pdf/renderer` route-only, `html2canvas` lazy, `lucide-react` barrel audit).
- [ ] **QW-3.4** Re-run analyzer, documentar delta.

### Bloque QW-4 — plaiceholder
- [ ] **QW-4.1** Instalar `plaiceholder` + `@plaiceholder/next`. Helper `withBlurDataURL()` en `src/lib/supabase/`.
- [ ] **QW-4.2** Migración Supabase: agregar columnas `blur_data_url TEXT` en `Propyte_desarrolladores`, `Propyte_unidades`. (Entregable: SQL al usuario para que lo ejecute, dado `feedback_harness_blocks_prod_ddl.md`.)
- [ ] **QW-4.3** Aplicar `withBlurDataURL` a queries: `getDevelopers`, `getDeveloperBySlug`, `getUnits`, `getUnitById`.
- [ ] **QW-4.4** Actualizar componentes card/hero: `placeholder="blur"` + `blurDataURL={...}`.
- [ ] **QW-4.5** Backfill: script one-shot que computa blur para imágenes existentes y escribe a BD.

### Bloque QW-5 — next/og audit + uplift
- [ ] **QW-5.1** Auditoría: listar rutas indexables vs rutas con `opengraph-image.tsx`. Documentar gap.
- [ ] **QW-5.2** Mejorar `OGFrame.tsx` con variantes: `entity` (foto + datos), `marketing` (gradient + título), `default`.
- [ ] **QW-5.3** Crear `opengraph-image.tsx` para top-5 rutas faltantes priorizadas en Open Question 3.
- [ ] **QW-5.4** Playwright tests: validar `Content-Type` de OG en top-5 rutas.

### Bloque QW-6 — Sentry
- [ ] **QW-6.1** Crear proyecto Sentry (decisión Open Q 2). Anotar DSN como reference memory.
- [ ] **QW-6.2** Run `npx @sentry/wizard -i nextjs`. Revisar archivos generados.
- [ ] **QW-6.3** Custom config: sample rates, `sendDefaultPii: false`, `beforeSend` PII filter, `ignoreErrors`.
- [ ] **QW-6.4** Update CSP en `next.config.ts`: agregar `https://*.ingest.sentry.io` a `connect-src`.
- [ ] **QW-6.5** GitHub Actions: agregar paso de upload source maps al deploy Hostinger. Secrets `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
- [ ] **QW-6.6** Vercel env: agregar `SENTRY_AUTH_TOKEN` en CLI (`vercel env add`).
- [ ] **QW-6.7** Deploy a staging dev.propyte.com. Forzar error de prueba, verificar evento + source map.

### Bloque QW-7 — Cierre
- [ ] **QW-7.1** Verificar todos los AC de sección 7. Marcar checklist en el spec.
- [ ] **QW-7.2** Update `project_next_propyte_web_estado.md` con Tier 1 done.
- [ ] **QW-7.3** PR `feat/perf-optimization-tier-1` → `develop`. Smoke staging.
- [ ] **QW-7.4** Merge a `develop` → cherry-pick (o merge) a `main` para deploy Hostinger.

---

**Notas para el ejecutor:**
- Cada bloque (QW-2 a QW-6) es atómico y puede mergearse independientemente si el alcance se descompone.
- Lenis y plaiceholder son los más visibles (Luis los notará). Sentry es invisible pero el más importante para operación.
- Bundle analyzer es prerequisito de Tier 2 (decidir qué tirar antes de meter PostHog/Embla).
