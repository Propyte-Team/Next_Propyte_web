# Next_Propyte_web — Task Manager

> Última actualización: 2026-05-11 (sesión migración naranja → cyan/teal-a11y)

Plan de trabajo en el sitio público `propyte.com` (Next.js 16 + i18n + Supabase reads vía anon).

---

## En progreso

_Ninguna tarea activa — esperando feedback de Luis sobre dev.propyte.com._

---

## Pendientes

### Brand Identity Oficial — siguiente vuelta

- [ ] **Validación visual de Luis en `dev.propyte.com`**: revisar cristalino + jerarquía tipográfica + contraste + nueva paleta sin naranja. Decidir qué afinar antes de promover a main.
- [ ] **Considerar glass-light en otros bloques light**: `DeveloperLogos`, sticky header sobre scroll, `MarketplaceCard`. Decisión visual con Luis.
- [ ] **Plan migración Adobe Fonts kit** (Neue Haas Display + Normalidad VF) cuando Luis tenga acceso al kit. Swap de 2 líneas en `layout.tsx` (Inter→Neue Haas, DM Sans→Normalidad). Vars `--font-display` / `--font-text` ya tienen el contrato listo.

### Sesión anterior (B.1 + visibility — pendiente de validar)

- [ ] **Validación E2E B.1 site_config en `dev.propyte.com`**:
  - Footer muestra `contacto@propyte.com` (no `info@propyte.com`)
  - Footer dirección "5ta Av., Playa del Carmen, Quintana Roo"
  - WhatsApp button preset = `"Hola Propyte, me interesa una propiedad."` cuando no hay propertyName/Id
  - `/contacto` muestra address/phone/email/hours del Hub
- [ ] **Validación visibility en `dev.propyte.com`**:
  - `/es/nosotros/estructura` retorna **404** (flag `visible_dev=false` ya en BD `site_visibility`)
  - `/es/nosotros/quienes-somos` NO muestra tab "Estructura" en `NosotrosTabs`
  - `/es/nosotros` redirige a `quienes-somos` (primer tab visible)
- [ ] **Decisión usuario**: mergear `develop → main` (lleva brand identity + B.1 + visibility a `propyte.com` prod), o validar más en staging.
- [ ] Si decide merge: `git checkout main && git merge develop && git push origin main` → Hostinger pull-on-main.
- [ ] Eventual limpieza: cuando B.1 esté validado en prod ≥30 días, eliminar fallback i18n de contact info en `messages/{es,en}.json` (Fase D speckit dynamic-content).

---

## Bloqueadas

_Nada bloqueado._

---

## Completadas recientes

- [x] **Migración acentos naranja → cyan/teal** (2026-05-11) — 8 archivos fuera del home migrados según regla dark bg → `#A2F9FF`, light bg → `#0D9488` (teal-a11y WCAG AA):
  - `Badge.tsx` / `MarketplaceCard.tsx` — badges preventa/reservado + gradient promo
  - `UnetePageContent.tsx` — 6 acentos (glows, badge top, cap annual callout, $45K stat, stars, glow CTA)
  - `destacados/page.tsx` — filtro stage preventa
  - `promociones/page.tsx` — hero accent default + glow + gradient "destacado"
  - `LegalPage.tsx` — draft badge a Tailwind amber semantic (semántico, no brand)
  - `EstructuraPageContent.tsx` — hiring label
  - `PriceTimeline.tsx` — marker futuro
  - **Preservados** (warnings semánticos / dev tools): `analytics/*`, `InvestmentDisclaimer`, `GeoAnalysis`, `MarketIndicator`, `ComparisonTable`, `RentalEstimate`, `playground/*`, `design-playground/*`, token `--color-amber` en globals.css
- [x] **Brand Identity Oficial** — tokens `#A2F9FF` + cyans/darks + glass cards Ficha 01/02 + variantes pill/light + hero overlay + jerarquía editorial en `globals.css` (2026-05-09)
- [x] **Hero home rediseñado** — eyebrow REAL ESTATE, "Riviera Maya" cyan, overlay aztec, search bubble Ficha 02 character, tabs/stats/quick-links glass-pill (2026-05-09)
- [x] **Tipografía Inter + DM Sans** vía next/font como substitutos free de Neue Haas Display Pro / Normalidad VF, vars `--font-display` / `--font-text` componiendo `--font-heading` / `--font-body` en `:root` (2026-05-09)
- [x] **Migración acentos naranja → brand cyan** en 11 componentes home + MapView empty-state (2026-05-09)
- [x] **Speckit §6.1** reescrito con paleta brand, tabla coexistencia brand/teal, Ficha 01/02 CSS literal, hero overlay, jerarquía editorial (2026-05-09)
- [x] **Deploy Vercel staging** `dev.propyte.com` (`dpl_9eGFTBJCPePqHMnHCpiNFauS5eNg`) con todos los cambios brand (2026-05-09)
- [x] B.1 site_config integration — Footer/Header/MobileMenu/WhatsAppButton/contacto consumen `getSiteConfig()` con fallback graceful (commit `5286263`, 2026-05-09)
- [x] Visibility consumers en `/nosotros/*` — 3 keys agregadas a `VISIBILITY_KEYS`, check con `notFound()` en cada page, `NosotrosTabs` filtra tabs (commit `e1b0855`, 2026-05-09)
- [x] Vercel deploy anterior `dpl_rdsY1oLkEPgsQ1FkQ4geZL2rqDsJ` con B.1 + visibility (2026-05-09)
- [x] Refactor `EstructuraPageContent.tsx` para consumir `v_org_structure` desde Supabase (2026-05-09)

---

## Notas

- ISR `/nosotros/estructura` = 600s. `getVisibility()` = 30s. `getSiteConfig()` = 300s. Para revalidate inmediato, usar tags desde Hub.
- `getVisibility` es **fail-open**: si una key no existe en BD o el endpoint falla, render incondicional. Crítico para fallback graceful pero significa que cualquier flag nuevo requiere consumidor explícito (memoria `feedback_site_visibility_consumer.md`).
- `vercel --prod` SIEMPRE con `cd <repo> &&` inline (memoria `feedback_vercel_cli_cwd.md`).
- El sitio lee con `createPublicSupabaseClient` (anon key). Cualquier vista nueva en `real_estate_hub` necesita `GRANT SELECT TO anon` antes de ser usable (memoria `feedback_supabase_schema_usage_grant.md`).
- i18n actúa como fallback si `page_content` o `site_config` no devuelven la fila — mantener ambos en sync hasta Fase D.
- **Brand identity**: regla "brand=action, teal=atmosphere". Detalle completo en `SPECKIT-METAMORFOSIS-PROPYTE.md §6.1.b` y memoria `project_next_propyte_brand_identity.md`. `#A2F9FF` no cumple WCAG AA contra blanco — usar `#0D9488` en superficies claras.
- **next/font + `:root` composing**: `--font-display` y `--font-text` (next/font) componen `--font-heading` y `--font-body` (`:root`). Si necesitas swap a Adobe Fonts, solo cambia los `Inter()` y `DM_Sans()` en `layout.tsx`. Memoria: `feedback_nextfont_root_composing.md`.
