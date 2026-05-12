# Next_Propyte_web — Task Manager

> Última actualización: 2026-05-12 noche (audit a11y AA sitio-wide completo + equipo merge a /nosotros/equipo-comercial + MarketplaceHero brand-aligned + spec Zoho v1.5 aprobado)

Plan de trabajo en el sitio público `propyte.com` (Next.js 16 + i18n + Supabase reads vía anon).

---

## En progreso

_Sin tareas activas — 2 specs aprobados esperando arranque:_
- _`content-audit-seo-2026` v2.1 — rama `feat/content-audit-seo-2026` ya creada. Próximo: A0 (Q1+Q8 con Luis)._
- _`web-forms-zoho-integration` v1.5 — rama `feat/zoho-forms-integration` pendiente de crear. Próximo: Z0.1-Z0.6 (setup Zoho + Assignment Rule + env vars + branch)._

---

## Pendientes

### Security pass Cyber Neo — validación + flip CSP

> 3 commits ya en `develop` + pusheados + deployed a `dev.propyte.com` (build `dpl_AJBbXiqo1uWhhxFZCg84T6eHjKaA`). 21 de 25 findings cerrados, risk score 76 → ~6 (Low). **NO** mergear `develop → main` hasta cerrar validación + flip CSP.

- [ ] **SEC-V1.** Abrir `https://dev.propyte.com` en navegador real (no headless). DevTools → Network → request del documento HTML. Verificar headers presentes: `Content-Security-Policy-Report-Only`, `Strict-Transport-Security`, `Permissions-Policy`, `X-Frame-Options`, `Referrer-Policy`.
- [ ] **SEC-V2.** Recorrer home + 1 desarrollo + 1 propiedad + glosario + (si hay posts) blog. Consola del browser DEBE estar limpia de `[Report Only] Refused to load...`. Si aparece alguna violación, ajustar CSP en [next.config.ts:63-78](next.config.ts#L63-L78) y redeploy.
- [ ] **SEC-V3.** Smoke test formularios desde `dev.propyte.com`:
  - `/es/proveedores` (Form 6) → submit con datos válidos. Esperar `200 { success: true, id: ... }`.
  - `/es/glosario` con lead gate (Form 11) → submit. Esperar `200`.
  - Validar que `403 Forbidden` aparece SOLO si Origin no whitelisted (el Origin del propio `dev.propyte.com` SÍ está en allowlist).
- [ ] **SEC-V4.** Si tienes posts en `blog_posts`, abrir `/es/blog/[slug]` y verificar que el contenido se renderiza igual visualmente (DOMPurify allow-list cubre rich-text estándar).
- [ ] **SEC-V5.** Después de 24-48h con consola limpia, flippear CSP a enforcing: en [next.config.ts:89](next.config.ts#L89) cambiar `Content-Security-Policy-Report-Only` → `Content-Security-Policy`. Redeploy con `cd <repo> && vercel --prod --yes`.
- [ ] **SEC-V6.** Una vez `develop` validado en staging, autorizar merge `develop → main` para que Hostinger pull-on-main propague la mejora a `propyte.com` prod.

**Notas técnicas heredadas del security pass:**
- Reporte completo: `~/Desktop/cyber-neo-report-Next_Propyte_web-2026-05-12.md`
- 3 nuevos helpers en `src/lib/security/` (`compareSecret.ts`, `safeUrl.ts`, `sanitizeHtml.ts`) — disponibles para el spec Zoho (Z3.1 puede reutilizar `sanitizeRichHtml` si Description recibe HTML del usuario).
- `enforceRateLimit()` helper en [src/lib/rateLimit.ts](src/lib/rateLimit.ts) — usado por las 8 rutas públicas + `/api/leads`. Z3.1 lo reutiliza.
- XFF parsing toma el último hop (configurable via `RATE_LIMIT_TRUSTED_PROXY_HOPS`, default 1). Prefiere `x-vercel-forwarded-for` cuando existe.
- `/api/leads` actualmente hardcodea Origins (propyte.com + www + dev). Si Z3.1 introduce `LEADS_ALLOWED_ORIGINS` env var, reemplazar el set hardcoded.
- npm audit residual: 2 moderate (postcss bundleado dentro de Next.js — solo se resuelve cuando Next 16.3+ ship).

---

### Spec: Web Forms → Zoho CRM Integration — `specs/web-forms-zoho-integration.md`

> Rama: `feat/zoho-forms-integration` (desde develop). **Estado:** v1.5 aprobado tras 4 vueltas de audit (estructura + security hardening + correctness + scope reduction). Q5/Q6 abiertas pero NO bloquean inicio (Z0.4 resuelve Q5; Q6 se decide antes de Z3.1). Alcance: unificar 11 forms → endpoint server-side `/api/leads` → Zoho CRM con fallback Supabase + cron retry. **NO** se toca UI visual.

**Bloque 0 — Setup (pre-código)**

- [x] **Z0.1.** ✅ Luis: Assignment Rule "Web Leads — Propyte" creada en Zoho (2026-05-12, Opción B 3 entries).

  **Pasos exactos en Zoho UI:**
  1. **Setup → Automation → Assignment Rules → Leads**
  2. **Create Rule** → Nombre: `"Web Leads — Propyte"`
  3. Marcar **Active** ✅
  4. Marcar **"Apply this rule to records created or edited via API"** ✅ (crítico — sin esto la rule no dispara desde nuestro endpoint)
  5. **Add Rule Entry** (×3, evaluadas en orden):

  **Entry 1 — Brokers & Proveedores (Luis filtra antes)**
  - Criteria: `Lead_Source equals "Sitio web"` **AND** `Tipo_de_Contacto` in `[Broker, Proveedor]`
  - Assign to: **Luis Flores** (user fijo)

  **Entry 2 — Desarrolladores B2B**
  - Criteria: `Lead_Source equals "Sitio web"` **AND** `Nombre_de_Campa_a contains "desarrolladores"`
  - Assign to: **Felipe Luksic** (user fijo) — o Round Robin [Felipe, Conrad Alvarado] si el plan lo soporta

  **Entry 3 — Catch-all residencial (rotación comercial)**
  - Criteria: `Lead_Source equals "Sitio web"` (sin filtros adicionales — última en orden recoge todo lo que no matchó arriba)
  - Assign to: **Round Robin** [Alejandro Zamudio, Maricela Diaz, Filiberto Arias, Sonia Cervantes]
  - Si plan **no soporta** Round Robin (Standard/Professional): asignar fijo a Alejandro y rotar manual cada semana editando

  6. **Save** — la Rule queda activa inmediatamente.

  **Verificación:** crear lead de prueba desde Zoho UI con `Lead_Source="Sitio web"`, `Tipo_de_Contacto="Broker"` → debe asignarse a Luis automáticamente. Cambiar a `Tipo_de_Contacto="Lead"` → debe rotar entre comerciales.

  **Caveat plan:** si en Zoho aparece la opción **Round Robin** disponible en el dropdown de Assign, plan es Enterprise+. Si solo permite user fijo, ajustar Entry 3 con un user único.

  **Pendiente confirmación pre-setup:**
  - Plan Zoho de Propyte (¿Standard / Professional / Enterprise / Ultimate?)
  - Lista final de comerciales activos en rotación Entry 3 (los 4 propuestos son los top owners por volumen 2026-05; Luis confirma)
- [x] **Z0.2.** ✅ Luis: picklist `Industry` (Sector) confirmado con los 13 valores (2026-05-12).
- [x] **Z0.3.** ✅ Env vars puestas en Hostinger Next_Propyte_web (2026-05-12): 8 vars Zoho + CRON_SECRET + LEADS_ALLOWED_ORIGINS.
- [ ] **Z0.4.** Luis: responder Q5 (¿`NEXT_PUBLIC_WEBHOOK_URL` activo? ¿leads recientes a Zoho desde web?). _No bloquea inicio, solo cleanup final Z7.7._
- [x] **Z0.5.** ✅ Branch `feat/zoho-forms-integration` creado (commit `b0dce63` 2026-05-12).
- [x] **Z0.6.** ✅ Luis: valores picklist `Idioma` = `"Español"` y `"Ingles"` (sin tilde, capitalización correcta) confirmados 2026-05-12.

**Bloque A — Cliente Zoho + tipos (1 día)**

- [x] **Z1.1.** ✅ `src/lib/zoho/client.ts` copiado de propyte-crm (commit `b0dce63`).
- [x] **Z1.2.** ✅ `src/lib/zoho/types.ts` copiado (commit `b0dce63`).
- [x] **Z1.3.** ✅ `src/lib/zoho/field-maps.ts` con `sourceToZohoPayload`, `CATEGORY_TO_INDUSTRY`, `parseName`, `parseFirstNameFromEmail`, `truncateDescription`, `truncateError` (commit `b0dce63`).
- [x] **Z1.4.** ✅ `src/lib/zoho/resolve-proyecto-interes.ts` con JOIN v_units + Propyte_zoho_id_map (commit `b0dce63`).
- [ ] **Z1.5.** Tests unit pendientes — recomendable pero no bloquea staging.

**Bloque B — Migración Supabase (Luis ejecuta SQL)**

- [x] **Z2.1.** ✅ SQL `supabase/migrations/20260512_leads_zoho_columns.sql` con los 6 pasos (commit `b0dce63`).
- [x] **Z2.2.** ✅ Aplicado vía MCP `apply_migration` con autorización explícita de Luis (2026-05-12). Migration name: `leads_zoho_columns`.
- [x] **Z2.3.** ✅ Verificado via MCP `execute_sql`: 23 columnas en `public.leads` (9 originales + 14 nuevas), `property_id` nullable=YES, `idx_leads_zoho_retry` creado, `claim_zoho_retry_batch` con `prosecdef=true` + `proconfig=["search_path=pg_catalog, public"]`, ejecución `claim_zoho_retry_batch(0)` retorna 0 filas (clamp OK).

**Bloque C — Refactor endpoint `/api/leads` (1-2 días)**

- [x] **Z3.1.** ✅ Refactor `/api/leads/route.ts` completo (commit `5fd3293`): enforceRateLimit + enforceGlobalQuota + allowlist env + Zod estricto (UUID, regex UTMs) + honeypot constant-time + INSERT primero con PENDING_SYNC + parseName + resolveProyectoDeInteres + doble llamada Form 6 + UPDATE retry `[200, 600, 1500] ms` + sanitize+truncate.
- [x] **Z3.2.** ✅ `src/lib/leads/submit-lead.ts` con firma única (commit `b0dce63`).
- [x] **Z3.3.** ✅ `submitForm.ts` convertido en shim (commit `b0dce63`).

**Bloque D — Refactor forms client-side (1.5 días)**

- [x] **Z4.1.** ✅ Form 6 Proveedores: payload top-level + `companyWebsite` renombrado para no colisionar con honeypot `website` (commit `245c861`).
- [x] **Z4.2.** ✅ Form 11 Glosario: usa `submitLead('glossary_pdf', data)` (commit `245c861`).
- [x] **Z4.3.** ✅ Form 8 Únete: RHF + Zod, mock eliminado, `submitLead('affiliate_request', data)` (commit `245c861`).
- [x] **Z4.4.** ✅ Honeypot agregado a Forms 2, 3, 7, 10 (commit `155feb3`). Cobertura final: 11/11 forms.
- [x] **Z4.5.** ✅ Typecheck limpio en los 5 forms con RHF + Zod tras migración.

**Bloque E — Cron de reintento Hostinger (medio día)**

- [x] **Z5.0.** ✅ Wrapper `findLeadByEmail` en client.ts (commit `b0dce63`).
- [x] **Z5.1.** ✅ `src/app/api/cron/zoho-retry/route.ts` con verifyCronSecret + rate limit propio + retry diferenciado PENDING_SYNC/ORPHAN/otros (commit `245c861`).
- [ ] **Z5.2.** Luis: configurar crontab en Hostinger VPS — `5 * * * * /usr/bin/curl -K /home/propyte/.zoho-retry.curlrc https://propyte.com/api/cron/zoho-retry >> /home/propyte/logs/zoho-retry.log 2>&1` + crear `.curlrc` perms 600 con header `"Authorization: Bearer $CRON_SECRET"`.
- [ ] **Z5.3.** Test manual cron tras deploy.

**Bloque F — Tests Playwright (1 día)**

- [ ] **Z6.1.** Crear `tests/api/leads-zoho.spec.ts` con 11 sub-tests (1 por source).
- [ ] **Z6.2.** Mock endpoint Zoho.
- [ ] **Z6.3.** Test rate limit (6 submits → 429).
- [ ] **Z6.4.** Test honeypot (200 silencioso, 0 rows).
- [ ] **Z6.5.** Test fallback Supabase (Zoho 500 → `zoho_sync_error`).
- [ ] **Z6.6.** Test Proyecto_de_Interes (match con development real conocido + no-match con UUID `00000000-...`).
- [ ] **Z6.7.** Test whitelist Industry (10 slugs).

**Bloque G — Rollout (1+ semana validación)**

- [ ] **Z7.1.** Push `feat/zoho-forms-integration` → Vercel preview staging.
- [ ] **Z7.2.** Submit 1 lead desde cada uno de los 11 forms en staging.
- [ ] **Z7.2b.** **Regression test antiduplicado:** forzar `PENDING_SYNC` + crear Lead manual en Zoho con mismo email + correr cron 2x → 1 solo Lead en Zoho.
- [ ] **Z7.3.** Verificar en Zoho UI: 11 Leads + 1 Account + identificadores correctos + owner asignado por Rule.
- [ ] **Z7.4.** Merge `feat/zoho-forms-integration` → `develop`.
- [ ] **Z7.5.** Push `develop` → `main` (Hostinger auto-deploy).
- [ ] **Z7.6.** Monitor 1 semana dashboard manual (tasa `zoho_lead_id NOT NULL` + frecuencia `zoho_sync_error`).
- [ ] **Z7.7.** Cleanup `submitForm.ts` SOLO cuando: ≥100 leads + ≥98% success en leads ≥24h + ≥1 por form. PR separado.

**Bloque H' — Security hardening (paralelo a A-F, integra antes de Z7)**

- [ ] **ZS.1.** Crear `src/lib/security/sanitize-error.ts` con `sanitizeErrorMessage` + tests (4 patrones PII + unicode + cap 2KB).
- [ ] **ZS.2.** Crear `src/lib/security/cron-auth.ts` con `verifyCronSecret` (`crypto.timingSafeEqual` + fail-closed sin secret + fail-closed < 32 chars).
- [ ] **ZS.3.** Crear `src/lib/security/global-quota.ts` con `enforceGlobalQuota` (1000/h/proceso, bucket `leads-global`). Test 1001 IPs → 503.
- [ ] **ZS.4.** Aplicar `sanitizeErrorMessage` en `/api/leads` y `/api/cron/zoho-retry` (grep CI: 0 ocurrencias de `update({ zoho_sync_error:` sin sanitize).
- [ ] **ZS.5.** Aplicar `verifyCronSecret` en cron handler (grep CI: 0 ocurrencias de `=== process.env.CRON_SECRET`).
- [ ] **ZS.6.** Aplicar `enforceGlobalQuota` antes del rate limit por IP en `/api/leads`.
- [ ] **ZS.7.** Aplicar `crypto.randomInt(180, 421)` ms en honeypot path (timing constant anti-fingerprinting).
- [ ] **ZS.8.** Zod estricto: `propertyId.uuid()` + regex `^[A-Za-z0-9._~-]{0,200}$` en `gclid`/`utm_*`. Test rechazo string no-UUID → 400.
- [ ] **ZS.9.** Migración SQL con clamp 1..500 + `SET search_path` + `REVOKE...GRANT` + `COMMENT ON COLUMN`. Verificar `prosecdef, proconfig`.
- [ ] **ZS.10.** Crontab Hostinger usa `-K /home/propyte/.zoho-retry.curlrc` perms 600. `grep -r Bearer ~/.bash_history` vacío.
- [ ] **ZS.11.** 8 forms con honeypot nuevo tienen `autocomplete="off"` (REQ-F-14 ampliado).
- [ ] **ZS.12.** Tests Playwright: payload email único no aparece en respuesta error + cron sin auth → 401 + cron 11 requests rápidas → 429.

**Bloque H — Rollback plan (si >10% `zoho_sync_error` en prod)**

- [ ] **Z8.1.** Revert commits Bloque C.
- [ ] **Z8.2.** Restore `submitForm.ts` con env webhook fallback.
- [ ] **Z8.3.** Reprocesar manualmente leads con `zoho_sync_error`.
- [ ] **Z8.4.** Columnas SQL se mantienen (additive).

**Open Questions activas (no bloquean código pero sí rollout final)**

- [ ] **Q5.** ¿Está activo `NEXT_PUBLIC_WEBHOOK_URL` en Hostinger? ¿Llegaron leads a Zoho desde la web en últimas 2 semanas? (Pre Z7.7 cleanup)
- [ ] **Q6.** Form 8 `Tipo_de_Contacto` — `Lead` / `Broker` / nuevo `"Afiliado"`. (Pre Z3.1)

---

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

- [ ] **Validación visual humana en `dev.propyte.com`** — develop al día con commit `97354bc`. Foco: `/propiedades/estudio-pentgarden-con-alberca-privada` (tour Matterport), CookieBanner abajo-derecha, ContactForm simplificado, sidebar detail pages reorder.
- [ ] **Hacer público el video Drive** en `estudio-pentgarden-con-alberca-privada` (Drive → Compartir → "Cualquier persona con el enlace") para que el embed cargue. El URL ya está OK en BD.
- [ ] **Merge `develop → main`** — ⚠️ NO ejecutar sin autorización explícita Luis. Dispara Hostinger pull-on-main → `propyte.com` prod.
- [ ] **Validación cluster filter "+N"** — requiere ≥2 propiedades con coords en Supabase staging para que se active el clustering. Hoy hay solo 1 con coords válidas.

### Brand Identity Oficial — extensiones futuras

- [ ] **Plan migración Adobe Fonts kit** (Neue Haas Display + Normalidad VF) cuando Luis tenga acceso al kit. Swap de 2 líneas en `layout.tsx` (Inter→Neue Haas, DM Sans→Normalidad). Vars `--font-display` / `--font-text` ya tienen el contrato listo.
- [ ] **Eventual limpieza fallback i18n** — cuando B.1 site_config esté validado en prod ≥30 días, eliminar fallback i18n de contact info en `messages/{es,en}.json` (Fase D speckit dynamic-content).
- [ ] **Considerar glass-light en otros bloques light**: `DeveloperLogos`, sticky header sobre scroll. Decisión visual con Luis (parcialmente cubierto por Pass 0/1).

---

## Bloqueadas

_Ninguna._

---

## Completadas recientes

- [x] **MarketplaceHero brand-aligned** — `<MarketplaceHero>` reutilizable en `/desarrollos` + `/propiedades`: 2 orbs brand/15+brand/8 + pill eyebrow brand glow ("Bienes raíces · Riviera Maya") + H1 fluido con última palabra accent `#0F766E` + subtitle max-w-2xl. i18n `marketplace.heroEyebrow` ES+EN. Commit `588276d` (2026-05-12)
- [x] **A11y audit WCAG AA sitio-wide** — `tests/e2e/a11y-contrast-audit.spec.ts` persistido. 23 rutas, 0 violaciones reales. 6 commits develop: `b3c8218` (orbs + opacities) + `67c9634` (9 hero pills) + `5d71c94` (pills/CTAs/numbers/eyebrows axe-driven) + `827fdf3` (legal-prose + bg-white explícito + test e2e) + `d2f1f65` (FAQContent) + `5b47a63` (iconos bento + WhatsApp 14 archivos text-[#0F1923]). Decisión: WhatsApp cumple AA sobre brand book. Memorias `feedback_propyte_a11y_pills_pattern.md` + `feedback_axe_section_bg_false_positive.md`. (2026-05-12)
- [x] **Hero /quienes-somos tipografía canónica Propyte** — Removido `accent-serif` (Fraunces italic) en "Propyte" del H1 y tagline → Inter heading + cyan brand color. Detalles editoriales (coordenadas, watermark, axis dots, stats mono) PRESERVADOS. Commit `12a4793` (2026-05-12)
- [x] **Equipo merge a /nosotros/equipo-comercial** — Decisión Luis: subpágina de Nosotros (NO top-level /equipo). 2 commits: `417e377` primer merge en /equipo + reintegración slots Hub al Home (ExploreCategories/Testimonials/LeadMagnet con auto-hide); `feb4e77` inversión a /nosotros/equipo-comercial con NosotrosTabs restaurado, redirect 301 /equipo → /nosotros/equipo-comercial. Memoria `feedback_propyte_equipo_canonical_route.md`. (2026-05-12)
- [x] **Spec web-forms-zoho-integration audit 4 vueltas** — v1.0 → v1.5. Como auditor externo del spec (no implementación). Hallazgos verificados contra código: `searchRecords` ya existe → `findLeadByEmail` 5 líneas; `enforceRateLimit` ya existe; `Propyte_zoho_id_map` tiene 103 rows development (feature Form 2 funcional). v1.5 APROBADO. (2026-05-12)
- [x] **Security pass Cyber Neo** — audit completo (35 findings, score 76) + 3 commits `develop`: `27c323d` (deps) + `72aa5f4` (CI hardening) + `acfa670` (app hardening). 21 de 25 findings cerrados. Risk 76 → ~6. (2026-05-12 PM)
- [x] **UnitModelsTable subtype fix** — Prefer `unit_subtype` sobre `tTypes(unit_type)` + detect path-fallback `types.X`. Commit `97354bc` (2026-05-11 PM)
- [x] **CookieBanner compacto + Drive auto-embed** — Banner anclado right-corner 380px + VideoPlayer transforma URLs Drive a `/preview`. Commit `6e1fbf0` (2026-05-11 PM)
- [x] **Fix 500 SSR cadena** en /propiedades/[slug] — 3 bugs: stages.Entregado MISSING_MESSAGE, property.tabTour key faltante, row.title fallback. Commits `2cba646` + `f4c7632` (2026-05-11 PM)
- [x] **Detail pages UX** — Sidebar reorder (DATOS CLAVE arriba) + ContactForm simplificado. Commit `07f07ae` (2026-05-11 PM)

---

## Notas

- **Sistema de utilities cristalino en `globals.css:736-915`** — todas las clases `.propyte-*` viven ahí (regla del usuario "todo en CSS global"). Cero hex brand-cyan sueltos en `src/app/[locale]/**`.
- **Validación headless gotcha:** Playwright headless puede renderizar mal `backdrop-filter` en glass cards. Memoria: `feedback_playwright_glass_screenshots.md`. Validar con navegador real para rutas con glass crítico.
- **Deploy actual staging:** `dpl_EXv84fSZi7bfnh5yrJ1uGEawqjiK` aliased a `https://dev.propyte.com`.
- **Vercel CLI inline obligatorio:** `cd <repo> && vercel --prod` siempre en una línea. Memoria `feedback_vercel_cli_cwd.md`.
- **Brand identity rule:** `#A2F9FF` solo en dark bg; light bg → `#0D9488` (teal-a11y WCAG AA). Memoria `project_next_propyte_brand_identity.md`.
- **Naranja allowlist:** `analytics/*`, `InvestmentDisclaimer`, `GeoAnalysis`, `MarketIndicator` (semantic warnings), `playground/*`, `design-playground/*`, token `--color-amber` legacy.
- **Cluster filter mecanismo** (`/propiedades`): WeakMap `markerToIdRef` + `onClusterClickRef` (ref-mirror para evitar re-suscripción) + state `clusterFilter` en MarketplaceContent que filtra `displayed = filtered ∩ clusterFilter`. Auto-clear con cualquier filter change.
