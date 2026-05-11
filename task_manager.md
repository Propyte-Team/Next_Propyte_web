# Next_Propyte_web — Task Manager

> Última actualización: 2026-05-11 PM (sesión cristalino: detail UX + 5 bug fixes deployados a develop)

Plan de trabajo en el sitio público `propyte.com` (Next.js 16 + i18n + Supabase reads vía anon).

---

## En progreso

_Sin tareas activas — speckit cristalino-sitio-wide cerrado y deployado. Próxima sesión: cambios de contenido (no especificados aún)._

---

## Pendientes

### Decisiones del usuario (no código)

- [ ] **Validación visual humana en `dev.propyte.com`** — develop al día con commit `97354bc`. Foco: `/propiedades/estudio-pentgarden-con-alberca-privada` (tour Matterport), CookieBanner abajo-derecha, ContactForm simplificado, sidebar detail pages reorder.
- [ ] **Hacer público el video Drive** en `estudio-pentgarden-con-alberca-privada` (Drive → Compartir → "Cualquier persona con el enlace") para que el embed cargue. El URL ya está OK en BD.
- [ ] **Merge `develop → main`** — ⚠️ NO ejecutar sin autorización explícita Luis. Dispara Hostinger pull-on-main → `propyte.com` prod.
- [ ] **Validación cluster filter "+N"** — requiere ≥2 propiedades con coords en Supabase staging para que se active el clustering. Hoy hay solo 1 con coords válidas.

### Brand Identity Oficial — extensiones futuras

- [ ] **Plan migración Adobe Fonts kit** (Neue Haas Display + Normalidad VF) cuando Luis tenga acceso al kit. Swap de 2 líneas en `layout.tsx` (Inter→Neue Haas, DM Sans→Normalidad). Vars `--font-display` / `--font-text` ya tienen el contrato listo.
- [ ] **Eventual limpieza fallback i18n** — cuando B.1 site_config esté validado en prod ≥30 días, eliminar fallback i18n de contact info en `messages/{es,en}.json` (Fase D speckit dynamic-content).
- [ ] **Considerar glass-light en otros bloques light**: `DeveloperLogos`, sticky header sobre scroll. Decisión visual con Luis (parcialmente cubierto por Pass 0/1).

### Próxima sesión (al regreso del usuario)

- [ ] **Cambios de contenido** — el usuario anunció que la próxima sesión será sobre modificaciones de contenido. Esperar instrucciones específicas.

---

## Bloqueadas

_Ninguna._

---

## Completadas recientes

- [x] **UnitModelsTable subtype fix** — Prefer `unit_subtype` sobre `tTypes(unit_type)` + detect path-fallback `types.X`. Commit `97354bc` (2026-05-11 PM)
- [x] **CookieBanner compacto + Drive auto-embed** — Banner anclado right-corner 380px + VideoPlayer transforma URLs Drive a `/preview`. Commit `6e1fbf0` (2026-05-11 PM)
- [x] **Fix 500 SSR cadena** en /propiedades/[slug] — 3 bugs: stages.Entregado MISSING_MESSAGE (mapper normalize + safeStage), property.tabTour key faltante, row.title fallback. Commits `2cba646` + `f4c7632` (2026-05-11 PM)
- [x] **Detail pages UX** — Sidebar reorder (DATOS CLAVE arriba) + ContactForm simplificado (sin Presupuesto/Mensaje, mantiene Tipo de inversión). Commit `07f07ae` (2026-05-11 PM)
- [x] **T4.5 Playwright baseline visual** — `tests/e2e/cristalino-baseline.spec.ts` con 15 rutas × 2 viewports = 30 screenshots. Commit `36cab2d` (2026-05-11)
- [x] **Pass 4 Team/legal brand sync** — 10 archivos (nosotros/*, unete glass-refactor, corredores, proveedores). Commit `ad34896` (2026-05-11)
- [x] **Pass 3 Content/editorial brand sync** — 19 archivos. Commit `6fd95e7` (2026-05-11)
- [x] **Amendment 2026-05-11: swap arquitectónico + cluster filter** — `/propiedades` con mapa + cluster "+N" filter; `/desarrollos` grid Ficha 02. Commit `9181f0f` (2026-05-11)
- [x] **Pass 2 Detail pages** — 5 detail pages glass + brand sync. Commit `ca42afb` (2026-05-11)
- [x] **Pass 1 Marketplaces** — MarketplaceContent.showMap + Ficha 02. Commits `6e38eb7` + `3d48f1f` (2026-05-11)

---

## Notas

- **Sistema de utilities cristalino en `globals.css:736-915`** — todas las clases `.propyte-*` viven ahí (regla del usuario "todo en CSS global"). Cero hex brand-cyan sueltos en `src/app/[locale]/**`.
- **Validación headless gotcha:** Playwright headless puede renderizar mal `backdrop-filter` en glass cards. Memoria: `feedback_playwright_glass_screenshots.md`. Validar con navegador real para rutas con glass crítico.
- **Deploy actual staging:** `dpl_EXv84fSZi7bfnh5yrJ1uGEawqjiK` aliased a `https://dev.propyte.com`.
- **Vercel CLI inline obligatorio:** `cd <repo> && vercel --prod` siempre en una línea. Memoria `feedback_vercel_cli_cwd.md`.
- **Brand identity rule:** `#A2F9FF` solo en dark bg; light bg → `#0D9488` (teal-a11y WCAG AA). Memoria `project_next_propyte_brand_identity.md`.
- **Naranja allowlist:** `analytics/*`, `InvestmentDisclaimer`, `GeoAnalysis`, `MarketIndicator` (semantic warnings), `playground/*`, `design-playground/*`, token `--color-amber` legacy.
- **Cluster filter mecanismo** (`/propiedades`): WeakMap `markerToIdRef` + `onClusterClickRef` (ref-mirror para evitar re-suscripción) + state `clusterFilter` en MarketplaceContent que filtra `displayed = filtered ∩ clusterFilter`. Auto-clear con cualquier filter change.
