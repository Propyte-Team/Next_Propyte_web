# Next_Propyte_web — Task Manager

> Última actualización: 2026-05-15 (Hero atmosphere + parallax + Q11 migrations deployadas a dev.propyte.com. SEO 100/100 en 4 rutas. Esperando feedback estético de Luis antes del merge develop→main.)

Plan de trabajo en el sitio público `propyte.com` (Next.js 16 + i18n + Supabase reads vía anon).

---

## En progreso

- [ ] **`feat/dynamic-content-a1-pulido`** — 2 commits ahead de develop (`78896e0` hub-content tags + `f54597f` A.1 banners home). Workstream Hub consumer.

---

## Pendientes

### Workstream Zoho — QA + pulido post-merge

- [ ] **QA manual F3/F4/F5/F10** — 8 leads no automatizados por selectores stale del Playwright spec. Pruebas manuales desde `dev.propyte.com/{es,en}/desarrolladores` (F3 hero + F4 #registro), `/corredores#registro` (F5), homepage scroll a "Descargar reporte" (F10). Validar Tipo_de_Contacto + Nombre_anuncio + Account (F3/F4 → Desarrollador + Industry=Desarrolladora; F5 → Broker; F10 → Lead).
- [ ] **Arreglar selectores stale en `tests/e2e/zoho-forms.spec.ts`** (opcional, para 22/22 verde): F3 `#b2b-name` no espera carga lazy, F4 `select[name="projectType"]` strict mode dialog, F5 `select[name="brokerType"]` location below fold, F10 button "Descargar reporte" está a 9668px de scroll.
- [ ] **Cron retry no persiste `page` en BD** — si quieres `Nombre_anuncio` también en retries, requiere agregar columna `nombre_anuncio` (o `page`) a `public.leads` + actualizar INSERT en `route.ts:419` + `rebuildPayload` en cron retry. Primer intento (99%) ya funciona.

### Branches en limbo

- [ ] **Revisar branch `feat/content-audit-seo-recovery`** (local-only, commit `cac2249 wip: copy/SEO audit i18n recovered from stash`) — decidir si los cambios sobre **SOP-3.2** / "Manejo de Datos" / "Plan de Carrera" siguen aplicando. La branch original `feat/content-audit-seo-2026` fue borrada del remoto en algún punto.
- [ ] **`infografia` branch (stand by)** — Luis dejó pruebas en pausa. `stash@{0}` tiene rediseño grande de `ProcessInfographic.tsx` (+774 líneas) preservado. Retomar cuando se quiera continuar.

### Spec: Auditoría Contenido SEO 2026 + Tono Propyte — `specs/content-audit-seo-2026.md`

> Rama: `feat/content-audit-seo-2026` (desde develop). Fuentes canónicas: Manual UX/UI v1.0 (§4.1, §4.2, §6.3.2, §7.3), Playbook Comercial Mar-2026, MASTER SOP v1.0. Alcance: contenido + estructura + schema + SEO técnico. **NO** rediseño visual — screenshot diff obligatorio antes de cerrar cada bloque.

**Bloque A — Limpieza de credibilidad (~1-2 días)**

- [x] **A0.** Q1, Q6, Q8, Q9 resueltas con Luis (2026-05-11): solo 2 desarrollos reales → mostrar cifras reales tal cual; ninguna fuente comercial externa → eliminar 4 cifras del simulador. **Bloque A totalmente desbloqueado.**
- [ ] **A1.** Eliminar `FLOORS` de `Hero.tsx:23` y pasar `stats.developments/units/cities/zones` directos. Render condicional por pill (omitir si `=== 0`). `StatCounter` sin suffix `+` si `cifra < 10`. Verificar que `getGlobalStats()` filtre por `ext_publicado=true`. Sin cambio visual.
- [ ] **A2.** `whyPropyte` 6→3 features con links de evidencia (`/metodologia`, `/equipo`, `/aviso-legal-inversion`). Edita `WhyPropyte.tsx` + `src/i18n/messages/{es,en}.json`.
- [ ] **A3a.** Disclaimer YMYL canónico (Manual §6.3.2 — literal) en `roiSimulator.footnote` + Footer + `AppDownloadBanner.tsx`.
- [ ] **A3b.** Eliminar las 4 cards numéricas del `AppDownloadBanner` (12%/35%/$200K/6sem — sin sustitución por rangos hasta tener fuente verificada). Reescribir copy banner: título → `"Calcula tu rendimiento"`, subtitle → `"Simula enganche, mensualidades y rendimiento proyectado con tus propios supuestos."`. Eliminar 8 keys `roiSimulator.metric1Value..metric4Label` de ES y EN (incluir en grep A.QA).
- [ ] **A4.** Typo `"Inversiónistas"` → `"Inversionistas"` en `src/i18n/messages/es.json:~191`.
- [ ] **A5.** Eliminar vestigial keys `hero.tab_comprar/rentar/preventa` de ES y EN.
- [ ] **A6.** Eyebrow + H1 a i18n con copy canónico Manual §4.1: `hero.title` ES = `"Real estate en modo inteligente."` / EN = `"Real estate, powered by intelligence."`. `hero.eyebrow` ES = `"Bienes raíces · Riviera Maya"` / EN = `"Real Estate · Riviera Maya"`. Reemplazar string hardcoded `"REAL ESTATE"` de `Hero.tsx:95`.
- [ ] **A7.** Fix `href="#"` en `ValueProposition.tsx` (→ `/desarrolladores`) y `MarketData.tsx` CTA (→ `/blog?category=analisis-mercado`).
- [ ] **A.QA.** `npm run typecheck` + Playwright e2e + screenshot diff manual (Hero/Footer/banners sin regresión) + grep frases prohibidas (`plusvalía garantizada`, `inversión segura`, `oportunidad única`, `se vende solo`, `rendimientos asegurados`) = 0 matches.
- [ ] **A.PR.** Commit + push a `feat/content-audit-seo-2026`, Vercel preview, revisión Luis del bloque A.

**Bloque B — Reorganización mensajes (~1 semana, bloqueado por A.PR aprobado)**

- [ ] **B0.** Confirmar con Luis Q11 (destino final de `ExploreCategories`, `LeadMagnet`, `AppDownloadBanner` migrados fuera del Home).
- [ ] **B1. Home rebuild — Manual §4.2 + ampliación E-E-A-T** (decisión Luis 2026-05-11). El Manual §4.2 es base estructural pero se amplía con 4 secciones nuevas porque el Bloque A dejó el Home delgado en certidumbre. **Sin tocar paleta — solo slots por sección**. Orden final: Hero → NosotrosTeaser → FeaturedProperties → MetodologiaTeaser → ProcessInfographicPlaceholder → HowItWorks → WhyPropyte → TrendingMarket → DondeEstamos → DeveloperLogos → HomeFAQ → DeveloperBanner → JoinTeamBanner → RecentBlog (condicional). Retirar: Testimonials, LeadMagnet, ExploreCategories, AppDownloadBanner, ValueProposition.
  - [ ] **B1.1** Crear `src/components/home/NosotrosTeaser.tsx` (slot claro, 3 mini-stats verificables, CTA → /equipo).
  - [ ] **B1.2** Crear `src/components/home/MetodologiaTeaser.tsx` (slot dark, 5 criterios SOP-3.2, CTA → /metodologia).
  - [ ] **B1.3** Crear `src/components/home/ProcessInfographic.tsx` como placeholder (espacio reservado para infografía Propyte; copy de Luis pendiente próxima sesión).
  - [ ] **B1.4** Crear `src/components/home/DondeEstamos.tsx` (slot claro, Real Estate Lab + zonas cubiertas con conteo real si Supabase devuelve >0; sin mapa interactivo).
  - [ ] **B1.5** Reactivar `HowItWorks` existente (revisar copy, conectar en page.tsx).
  - [ ] **B1.6** Crear `src/components/home/HomeFAQ.tsx` con 4 Q&A + JSON-LD FAQPage (adelanto Bloque C2).
  - [ ] **B1.7** Reordenar `src/app/[locale]/page.tsx` con el orden completo arriba.
- [ ] **B2.** Microcopy CTAs: `hero.searchCta` → `"Buscar propiedad"`, `joinTeam.cta` → `"Conoce el Plan de Carrera"`, `developerBanner.cta` → `"Solicitar Propuesta Comercial"`, `roiSimulator.ctaPrimary` → `"Calcular mi rendimiento"`, `featuredProperties.cta` → `"Ver Todas las Propiedades"`. Sync ES + EN.
- [ ] **B3.** Retirar `Testimonials` del Home (Manual §7.1 — no hay casos hasta dic-2026). Migrar a `/equipo` si hay consentimiento, o archivar.
- [ ] **B4.** Crear `/metodologia` (Scorecard SOP-3.2), `/equipo` (bios + credenciales + redirect 301 desde `/nosotros/equipo-comercial`), `/aviso-legal-inversion`. Schema `WebPage` + breadcrumb. Linkear desde Footer "Legal/Transparencia".
- [ ] **B5.** H1/H2 keyword-rich (tabla en spec B5): FeaturedProperties, HowItWorks, WhyPropyte, TrendingMarket, RecentBlog.
- [ ] **B6.** Tono Propyte pass: replacements masivos según tabla B6 + Footer tagline `"Real estate en modo inteligente."` + brand cierre `"PROPYTE™ — Property + Byte. Sin humo. Sin improvisación. Sin promesas vacías."`. Re-grep frases prohibidas.
- [ ] **B7.** `RecentBlog` condicional: `posts.length >= 3` render normal; `< 3` card placeholder `"Próximamente: análisis mensual…"` + CTA newsletter. No esconder sección.
- [ ] **B.QA.** typecheck + e2e + screenshot diff + manual review `dev.propyte.com` + Lighthouse comparativo pre/post.

**Bloque C — SEO técnico profundo (~2-3 días, bloqueado por B.QA aprobado)**

- [ ] **C1.a.** `case 'website'` en `SchemaMarkup.tsx` con `potentialAction: SearchAction` → `/propiedades?search={search_term_string}`. Inyectar en `src/app/[locale]/layout.tsx`. Activa Sitelinks Search Box.
- [ ] **C1.b.** `realEstateListing` shape real (Apartment/House/Residence según `property_type`, `floorSize`, `numberOfRooms`, `price`, `priceCurrency`, `offers`, `geo`, `brand: "Nativa Tulum"` cuando aplique) en `src/app/[locale]/propiedades/[slug]/page.tsx`. Fallback: omitir si faltan campos críticos. Solo `LISTO PARA VENTA` (SOP-3.2).
- [ ] **C1.c.** `AggregateRating` + `Review` schema — **BLOQUEADA hasta dic-2026** (primer MasterBroker firmado, Manual §7.1). Tarea registrada para no perderse.
- [ ] **C1.d.** Crear `src/components/shared/Breadcrumb.tsx` (UI + JSON-LD `BreadcrumbList`). Aplicar en páginas principales.
- [ ] **C1.e.** `LocalBusiness` schema con `address: "Calle 5 Norte 95, Playa del Carmen, Q. Roo"` (Real Estate Lab — SOP Hostess §2.1), `parentOrganization: Organization`, `legalName: "Nativa Tulum"`.
- [ ] **C1.f.** `BlogPosting` schema en plantilla de blog (preparado aunque no haya posts).
- [ ] **C2.** Crear `src/components/home/HomeFAQ.tsx` con 4 Q&A (spec C2) + JSON-LD `FAQPage`. Acordeón visible. Ubicación: después de `TrendingMarket`, antes de `DeveloperBanner`.
- [ ] **C3.** Extender `src/app/[locale]/opengraph-image.tsx` con `ImageResponse` por-ruta (home + `/propiedades/[slug]` + `/zonas/[slug]` + `/blog/[slug]`). Estilo consistente.
- [ ] **C4.** Hero performance: `<link rel="preload" as="video">` + `poster` siempre. Medir LCP con `npx lighthouse https://dev.propyte.com/es --view`. Objetivo: LCP < 2.5s mobile. Sin cambio visual.
- [ ] **C5.** Validar Sitelinks Search Box en Rich Results Test.
- [ ] **C6.** Agregar `/metodologia`, `/equipo`, `/aviso-legal-inversion` a `src/app/sitemap.ts`. Verificar `hreflang` simétrico ES/EN con `x-default` ES.
- [ ] **C.QA.** Rich Results Test pasa los 7 schemas (Organization, WebSite, RealEstateListing, BreadcrumbList, FAQPage, LocalBusiness, BlogPosting). Lighthouse SEO ≥ 95 en 4 rutas principales. typecheck + e2e.

**Cierre del spec**

- [ ] PR `feat/content-audit-seo-2026` → `develop` con descripción + link a `specs/content-audit-seo-2026.md`.
- [ ] Signoff de Luis en el PR.
- [ ] Merge a `develop` → Vercel staging → validación 48h en `dev.propyte.com`.
- [ ] Merge `develop` → `main` → Hostinger prod (auto-deploy GitHub Actions).
- [ ] Actualizar `project_next_propyte_web_estado.md` con cierre del proyecto.

---

### Decisiones del usuario (no código)

- [ ] **Más ajustes estéticos pre-merge develop→main** — Luis 2026-05-15: "hay cosas que aún no me convencen, debemos mejorar". Esperando que indique cuáles componentes/secciones. El Hero ya quedó OK con HeroAtmosphere.
- [ ] **Decidir destino branch `prueba-liquid-glass`** — commit `7524c2b` (Hero + Q11) está local-only en esta rama. Posibilidades: (a) cherry-pick a develop, (b) push y mergear como PR, (c) rebase a develop. Untracked `src/components/ui/glass/` es WIP paralelo de Luis (liquid-glass experiment), NO mezclar.
- [ ] **Merge `develop → main`** — ⚠️ NO ejecutar sin autorización Luis. 320 commits ahead. Dispara Hostinger pull-on-main → `propyte.com` prod.
- [ ] **Validación cluster filter "+N"** — requiere ≥2 propiedades con coords en Supabase staging para que se active el clustering. Hoy hay solo 1 con coords válidas.
- [x] **Validación visual humana en `dev.propyte.com`** (2026-05-15) — Hero + Q11 migrations + Tier 1 Lenis validados en producción.
- [x] **Hacer público el video Drive** (2026-05-15) — Luis lo hizo público.

### Brand Identity Oficial — extensiones futuras

- [ ] **Plan migración Adobe Fonts kit** (Neue Haas Display + Normalidad VF) cuando Luis tenga acceso al kit. Swap de 2 líneas en `layout.tsx` (Inter→Neue Haas, DM Sans→Normalidad). Vars `--font-display` / `--font-text` ya tienen el contrato listo.
- [ ] **Eventual limpieza fallback i18n** — cuando B.1 site_config esté validado en prod ≥30 días, eliminar fallback i18n de contact info en `messages/{es,en}.json` (Fase D speckit dynamic-content).
- [ ] **Considerar glass-light en otros bloques light**: `DeveloperLogos`, sticky header sobre scroll. Decisión visual con Luis (parcialmente cubierto por Pass 0/1).

---

### Spec: Tier 1 Quick Wins de Optimización — `specs/tier-1-perf-optimization-quick-wins.md`

> Rama: `feat/perf-optimization-tier-1` (desde develop, post-merge Zoho). Alcance: 5 quick wins simultáneos — Lenis, bundle-analyzer, plaiceholder, next/og audit+uplift, Sentry. Aditivo, reversible, sin rediseño UI. Defaults documentados en sesión de aprobación (sección "Open Questions" del spec).
>
> **Solapamiento detectado con `content-audit-seo-2026` Bloque C3:** ambas specs tocan `opengraph-image.tsx` por ruta. **Coordinación:** si C3 se mergea antes que Tier 1, QW-5 (next/og audit + uplift) consume el trabajo de C3 y solo agrega las rutas faltantes. Si Tier 1 mergea antes, C3 se reduce a verificación.

**Bloque QW-1 — Setup y baseline**
- [ ] **QW-1.1** Crear branch `feat/perf-optimization-tier-1` desde `develop` ✅ (creada 2026-05-14).
- [ ] **QW-1.2** Documentar baseline pre-cambios → `docs/bundle-baseline-2026-05-14.md` (Lighthouse + bundle size + lista rutas con OG existente).

**Bloque QW-2 — Lenis (smooth scroll)**
- [ ] **QW-2.1** Instalar `lenis@^1.3`. Crear `src/components/providers/SmoothScrollProvider.tsx` (Client Component) con guard `prefers-reduced-motion` + env flag `NEXT_PUBLIC_LENIS=0`.
- [ ] **QW-2.2** Envolver `src/app/[locale]/layout.tsx` con el provider.
- [ ] **QW-2.3** Crear `useLenisAnchor()` y aplicar en FAQ + Glosario + footer anchors.
- [ ] **QW-2.4** Smoke Playwright `tests/e2e/smooth-scroll.spec.ts` + toggle reduced-motion.

**Bloque QW-3 — Bundle analyzer**
- [ ] **QW-3.1** Instalar `@next/bundle-analyzer` (devDep), wrapper en `next.config.ts`. Script `npm run analyze`.
- [ ] **QW-3.2** Run inicial. Top-3 oportunidades documentadas en `docs/bundle-baseline-2026-05-14.md` (candidatos: `recharts`, `@react-pdf/renderer`, `html2canvas`, `lucide-react` barrel).
- [ ] **QW-3.3** Implementar 2 quick fixes (lazy-load + tree-shake).
- [ ] **QW-3.4** Re-run analyzer. Documentar delta. AC4: bundle cliente NO crece neto.

**Bloque QW-4 — plaiceholder (blur placeholders)**
- [ ] **QW-4.1** Instalar `plaiceholder` + `@plaiceholder/next`. Helper `withBlurDataURL()` en `src/lib/supabase/`.
- [ ] **QW-4.2** **SQL entregable a Luis** (harness no ejecuta DDL prod): `ALTER TABLE Propyte_desarrolladores ADD COLUMN blur_data_url TEXT;` + idem `Propyte_unidades`.
- [ ] **QW-4.3** Aplicar `withBlurDataURL` a queries: `getDevelopers`, `getDeveloperBySlug`, `getUnits`, `getUnitById`.
- [ ] **QW-4.4** Actualizar `<Image>` cards/hero: `placeholder="blur" blurDataURL={...}`.
- [ ] **QW-4.5** Script backfill `scripts/backfill-blur-placeholders.ts` para imágenes existentes.

**Bloque QW-5 — next/og audit + uplift**
- [ ] **QW-5.1** Auditoría rutas indexables (sitemap.ts) vs rutas con `opengraph-image.tsx`. Gap → `docs/og-audit-2026-05-14.md`. **Cruzar con C3 antes de duplicar.**
- [ ] **QW-5.2** Mejorar `src/lib/og/OGFrame.tsx` con variantes: `entity` (foto hero + datos reales), `marketing` (gradient teal→aztec + título), `default`.
- [ ] **QW-5.3** Crear `opengraph-image.tsx` para top-7 faltantes (home, /desarrollos índice, /propiedades/[id], 4 ciudades). **Si C3 ya cubre alguna, skip y enfocar en uplift visual.**
- [ ] **QW-5.4** Playwright `tests/e2e/og-images.spec.ts`: validar `Content-Type: image/*` en 12+ rutas.

**Bloque QW-6 — Sentry**
- [ ] **QW-6.1** **Luis ejecuta:** crear proyecto Sentry `propyte-web` en org Propyte. Compartir DSN + auth token.
- [ ] **QW-6.2** Run `npx @sentry/wizard -i nextjs`. Revisar generados: `sentry.{client,server,edge}.config.ts`, `instrumentation.ts`, `app/global-error.tsx`, wrapper en `next.config.ts`.
- [ ] **QW-6.3** Custom config: `tracesSampleRate: 0.1` (prod), `replaysSessionSampleRate: 0.05`, `replaysOnErrorSampleRate: 1.0`, `sendDefaultPii: false`, `beforeSend` sanitiza query params, `ignoreErrors` whitelist.
- [ ] **QW-6.4** Update CSP en `next.config.ts`: `connect-src` agregar `https://*.ingest.sentry.io`.
- [ ] **QW-6.5** GitHub Actions deploy Hostinger: paso `sentry-cli releases files ... upload-sourcemaps`. Secrets: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
- [ ] **QW-6.6** Vercel env: `vercel env add SENTRY_AUTH_TOKEN` (preview + prod).
- [ ] **QW-6.7** Deploy a `dev.propyte.com`. Forzar error de prueba. Verificar evento + source map en dashboard Sentry.

**Bloque QW-7 — Cierre**
- [ ] **QW-7.1** Verificar AC1-AC12 del spec. Marcar checklist en spec.
- [ ] **QW-7.2** Actualizar `project_next_propyte_web_estado.md` con Tier 1 completado.
- [ ] **QW-7.3** PR `feat/perf-optimization-tier-1` → `develop`. Smoke staging.
- [ ] **QW-7.4** Merge a `develop` → cherry-pick/merge a `main` → deploy Hostinger.

---

## Bloqueadas

_Ninguna._

---

## Completadas recientes

- [x] **Hero atmosphere + parallax mouse sutil** (2026-05-15) — Nuevo `HeroAtmosphere.tsx` con grid blueprint + 3 glow orbs + watermark Home icon + coordenadas editoriales. Springs framer-motion `{stiffness:70, damping:22}`. Hero.tsx usa `.propyte-hero-canvas`. Fix gotcha: listener en parent `<section>` (no en div con `pointer-events-none`). Commit `7524c2b`. Memorias `feedback_pointer_events_none_listener.md` + `feedback_parallax_blur_magnitudes.md`.
- [x] **Q11 migrations** (2026-05-15) — ExploreCategories → `/propiedades` (post-breadcrumb), LeadMagnet → `/blog` (reemplaza NewsletterCTA condicionalmente), AppDownloadBanner → cierre `/propiedades` + `/desarrollos`. Home limpio. Hub connections preservadas. Commit `7524c2b`.
- [x] **F3/F4/F5/F10 QA manual** (2026-05-15) — Luis validó 8 leads manualmente en Zoho UI. Tipo_de_Contacto + Nombre_anuncio + Account correctos. Workstream Zoho 22/22 funcional.
- [x] **Validación SEO end-to-end** (2026-05-15) — 8/8 schemas C1 detectados en dev.propyte.com (Organization, WebSite+SearchAction, RealEstateListing, BreadcrumbList, FAQPage, LocalBusiness, BlogPosting, CollectionPage+ItemList). Lighthouse SEO **100/100** en `/es`, `/es/propiedades/[slug]`, `/es/desarrolladores`, `/es/nosotros/equipo-comercial`.
- [x] **Deploy 2026-05-15** — `dpl_7ctuQhFEEhorQ6srqvgC1vfsFjVn` desde branch `prueba-liquid-glass` (NO pushed a origin). Custom domain `dev.propyte.com` aliased. Rollback chain: `6QJzhfWMwoAdXxbMFSssDQkGV6b5` (Tier 1).
- [x] **Zoho web-forms integration cerrado + merged a develop** (2026-05-14) — 16 commits del workstream merged a `develop` (`00eb513`).
- [x] **Build fix `@swc/helpers` standalone** (2026-05-14) — `outputFileTracingIncludes` en `next.config.ts`. Commit `5fb7f67`.
- [x] **Tags `[XXX] (YYY)` en Nombre_de_Campa_a + doble llamada Lead+Account F3/F4/F6/F7** (2026-05-13/14) — Commit `63fb057`.
- [x] **UnitModelsTable subtype fix + CookieBanner compacto + Drive auto-embed** (2026-05-11 PM) — Commits `97354bc`, `6e1fbf0`.
- [x] **Fix 500 SSR cadena en /propiedades/[slug] + detail pages UX** (2026-05-11 PM) — Commits `2cba646`, `f4c7632`, `07f07ae`.

---

## Notas

- **Sistema de utilities cristalino en `globals.css:736-915`** — todas las clases `.propyte-*` viven ahí (regla del usuario "todo en CSS global"). Cero hex brand-cyan sueltos en `src/app/[locale]/**`.
- **Validación headless gotcha:** Playwright headless puede renderizar mal `backdrop-filter` en glass cards. Memoria: `feedback_playwright_glass_screenshots.md`. Validar con navegador real para rutas con glass crítico.
- **Deploy actual staging:** `dpl_EhFYpkBqKuYCum1VNvASsEkcuAhw` (Glass system Tanda 1 + perf WIP, 2026-05-15) aliased a `https://dev.propyte.com`. Rollback: `vercel alias set dpl_7ctuQhFEEhorQ6srqvgC1vfsFjVn dev.propyte.com` (Hero atmosphere + Q11 previo). PR abierto: https://github.com/Propyte-Team/Next_Propyte_web/pull/4 (`feat/glass-system-propagation` → `develop`).
- **Vercel CLI inline obligatorio:** `cd <repo> && vercel --prod` siempre en una línea. Memoria `feedback_vercel_cli_cwd.md`.
- **Brand identity rule:** `#A2F9FF` solo en dark bg; light bg → `#0D9488` (teal-a11y WCAG AA). Memoria `project_next_propyte_brand_identity.md`.
- **Naranja allowlist:** `analytics/*`, `InvestmentDisclaimer`, `GeoAnalysis`, `MarketIndicator` (semantic warnings), `playground/*`, `design-playground/*`, token `--color-amber` legacy.
- **Cluster filter mecanismo** (`/propiedades`): WeakMap `markerToIdRef` + `onClusterClickRef` (ref-mirror para evitar re-suscripción) + state `clusterFilter` en MarketplaceContent que filtra `displayed = filtered ∩ clusterFilter`. Auto-clear con cualquier filter change.
