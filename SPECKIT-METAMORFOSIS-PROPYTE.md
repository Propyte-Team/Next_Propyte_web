# SPECKIT METAMORFOSIS PROPYTE
## WordPress → Next.js + Hub Backend

> **Versión:** 3.0 | **Fecha:** 2026-04-17 | **Revisión:** 2026-04-17  
> **Tipo:** Documento de Especificación Completa — Activo  
> **Objetivo:** Migrar propyte.com de WordPress a Next.js con calca exacta del diseño y funcionalidad, consolidando el backend del plugin y el sistema de aprobación del CRM en hub.propyte.com  
> **Deploy:** Producción en Hostinger (standalone) · Staging en Vercel  
> **Repos:** `Next_Propyte_web` (frontend público) · `Propyte_hub` (backend admin) — repos separados  
> **Base:** Scaffold desde HERO-SITE-ZILLOW, diseño canónico de WordPress actual

### Estrategia de Scaffold: HERO-SITE-ZILLOW → Next_Propyte_web

El repositorio `HERO-SITE-ZILLOW-/` es un proyecto Next.js 16 con ~87 componentes, Supabase queries, i18n, y 30+ rutas. **Se usará como punto de partida** para `Next_Propyte_web`, tomando:

**Se toma de HERO-SITE:**
- Estructura Next.js 16 App Router + configuración base
- Supabase client/server setup (`lib/supabase/`)
- Queries existentes (`getDevelopments`, `getRentalEstimate`, etc.)
- i18n con next-intl (estructura de routing `[locale]/`)
- React Hook Form + Zod (validación de formularios)
- Supabase migrations (8 archivos SQL — revisar compatibilidad)
- Hooks: `useFilters`, `useMediaQuery`
- Context: `CurrencyContext` (MXN/USD toggle)
- Componentes reutilizables: `PropertyCard`, `FilterBar`, `ContactForm`, `ImageGallery`, `FinancialSimulator`, `MapView` (se adapta a Google Maps), `SchemaMarkup`

**NO se toma de HERO-SITE (se reemplaza con WP canónico):**
- Paleta de colores → usar WP (`#5CE0D2`, `#1A2F3F`, `#0F1923`)
- Mapbox GL → reemplazar con Google Maps (`@vis.gl/react-google-maps`)
- Tipografía tokens → usar definiciones de `input.css` de WP
- Layout (header/sidebar/footer) → replicar pixel-perfect de WP
- AI Search conversacional → excluido del MVP
- Admin panel (login, import, leads) → va al repo `Propyte_hub` separado
- Data mock (`src/data/properties.ts`, `src/data/desarrollos.ts`) → no se necesita
- Framer Motion permanece como librería de animaciones (ya incluida en HERO-SITE)

**Excepción de diseño — se conserva el look de HERO-SITE:**
- **Página de Reclutamiento (`/reclutamiento`)** — Decisión Luis, 2026-04-18: La versión de HERO-SITE es superior a la de WP (hero dark + grid de beneficios + CTA de aplicación). Es la ÚNICA página del sitio que mantiene su diseño original de HERO-SITE. Todas las demás páginas siguen WP canónico sin excepción.

**Mejoras intencionales sobre WP (NO son bugs, son especificación):**

Durante el QA pixel-perfect pueden aparecer diferencias visuales entre `dev.propyte.com` y `propyte.com` (WP). Las siguientes son mejoras deliberadas — no deben "corregirse" para matchear WP:

| # | Área | WP (anterior) | Next (nuevo) | Razón |
|---|------|---------------|--------------|-------|
| 1 | H1 homepage | "Encuentra tu inversión ideal…" | "Invierte con datos. Decide con confianza." | Nueva voz de marca 2026 (decide + data-driven) |
| 2 | Hero tabs | Sin tabs | Tabs **COMPRAR / PREVENTA** | Mejora definida en Speckit Sección 18 |
| 3 | Layout navegación | Topbar horizontal | Sidebar vertical 72px | Speckit v3.0 pide rediseño explícito a sidebar |
| 4 | Hero stats | No existen | Pills: "170+ Desarrollos / 500+ Unidades / 5 Ciudades / 30+ Zonas" | Mejora de prueba social, live counts desde Supabase |

Cualquier otra diferencia visual con WP sí cuenta como bug/pendiente de revisión.

**Se construye nuevo (no existe en ninguno):**
- Blog completo (listing + detail + categories) con AI generator en hub
- Share/Download modal (PDF + redes sociales)
- Dual-mode Investment Calculator (residencial + vacacional con IRR solver)
- Rental histogram (distribución de precios)
- Agent profiles
- Slug generator con 301 redirects históricos

---

## ÍNDICE

1. [Visión General de la Arquitectura](#1-visión-general-de-la-arquitectura)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura de Repositorios](#3-estructura-de-repositorios)
4. [MÓDULO A — propyte.com (Frontend Next.js)](#4-módulo-a--propytecom-frontend-nextjs)
5. [MÓDULO B — hub.propyte.com (Backend Hub)](#5-módulo-b--hubpropytecom-backend-hub)
6. [Design System — Calca Exacta](#6-design-system--calca-exacta)
7. [Mapa de Rutas Completo](#7-mapa-de-rutas-completo)
8. [Componentes — Inventario Pixel-Perfect](#8-componentes--inventario-pixel-perfect)
9. [Data Layer — Supabase Integration](#9-data-layer--supabase-integration)
10. [Sistema de Sync Bidireccional](#10-sistema-de-sync-bidireccional)
11. [Sistema de Aprobación (Migrado del CRM)](#11-sistema-de-aprobación-migrado-del-crm)
12. [SEO & Schema.org](#12-seo--schemaorg)
13. [Internacionalización (i18n)](#13-internacionalización-i18n)
14. [Formularios & Lead Capture](#14-formularios--lead-capture)
15. [Generación de PDFs](#15-generación-de-pdfs)
16. [Generación de Blog con IA](#16-generación-de-blog-con-ia)
17. [Analytics & Tracking](#17-analytics--tracking)
18. [Animaciones & Interacciones](#18-animaciones--interacciones)
19. [Mapas & Geolocalización](#19-mapas--geolocalización)
20. [Cálculos Financieros & Market Intelligence](#20-cálculos-financieros--market-intelligence)
21. [Autenticación & RBAC](#21-autenticación--rbac)
22. [Variables de Entorno](#22-variables-de-entorno)
23. [Infraestructura & Deploy](#23-infraestructura--deploy)
24. [Plan de Migración por Fases](#24-plan-de-migración-por-fases)
25. [Riesgos & Mitigación + Rollback Plan](#25-riesgos--mitigación--rollback-plan)
26. [Checklist de Paridad de Features](#26-checklist-de-paridad-de-features)
27. [Share/Download Modal — Especificación Completa](#27-sharedownload-modal--especificación-completa)
28. [Lógica JS Completa — Investment Calculator](#28-lógica-js-completa--investment-calculator)
29. [Lógica JS Completa — Rental Analysis](#29-lógica-js-completa--rental-analysis)
30. [Mapeo de Iconos SVG → Lucide React](#30-mapeo-de-iconos-svg--lucide-react)
31. [Playwright Test Migration](#31-playwright-test-migration)

---

## 1. VISIÓN GENERAL DE LA ARQUITECTURA

### Estado Actual (WordPress)

```
┌──────────────────────────────────────────────────────────────┐
│ propyte.com (WordPress + Hostinger)                          │
│ ├─ Theme Custom (Tailwind 4.2 + PHP templates)              │
│ ├─ Plugin: Propyte Real Estate v2.1.0                       │
│ │   ├─ 4 CPTs (desarrollador, desarrollo, unidad, lead)     │
│ │   ├─ 5 taxonomías custom                                  │
│ │   ├─ Sync bidireccional Supabase ↔ WP                     │
│ │   ├─ AJAX handlers (leads, contacto, PDF)                 │
│ │   ├─ Blog AI (Claude API)                                 │
│ │   ├─ Cron jobs (sync cada 6-24h)                          │
│ │   └─ Change log (auditoría precios)                       │
│ └─ WP Database (posts, meta, taxonomies, custom table)      │
├──────────────────────────────────────────────────────────────┤
│ crm.propyte.com (Next.js 14 + Prisma + Neon)                │
│ ├─ Sistema de Aprobación (ZohoApprovalsClient)              │
│ ├─ Pipeline leads + deals                                    │
│ ├─ Meta Ads dashboard                                        │
│ ├─ Twilio integrations                                       │
│ ├─ Commission engine                                         │
│ └─ 53 API routes                                             │
├──────────────────────────────────────────────────────────────┤
│ Supabase (oaijxdpevakashxshhvm)                              │
│ ├─ real_estate_hub schema (source of truth)                  │
│ ├─ investment_analytics schema                               │
│ ├─ public schema (web data)                                  │
│ ├─ propyte_crm schema (CRM data)                             │
│ └─ Storage: property-images bucket                           │
└──────────────────────────────────────────────────────────────┘
```

### Estado Futuro (Next.js + Hub)

```
┌──────────────────────────────────────────────────────────────┐
│ propyte.com (Next.js 16 — Frontend Público)                  │
│ ├─ App Router + RSC (React Server Components)               │
│ ├─ Tailwind CSS 4.2 (mismos design tokens)                  │
│ ├─ ISR/SSG para páginas de propiedades                      │
│ ├─ Framer Motion animations (calca exacta de triggers WP)   │
│ ├─ Google Maps JavaScript API                                │
│ ├─ i18n (ES/EN con 1,231 strings)                           │
│ ├─ Schema.org JSON-LD (@graph)                               │
│ ├─ Lead forms → hub.propyte.com API                          │
│ └─ PDF generation (server-side)                              │
├──────────────────────────────────────────────────────────────┤
│ hub.propyte.com (Next.js 16 — Backend Administrativo)        │
│ ├─ Sistema de Aprobación (migrado del CRM)                   │
│ │   ├─ Developers, Developments, Units approval              │
│ │   ├─ Completeness scoring                                  │
│ │   ├─ Field editing con whitelist                            │
│ │   └─ Image upload & optimization                           │
│ ├─ Sync Engine (reemplaza plugin WP)                         │
│ │   ├─ Supabase ↔ propyte.com (via revalidation)            │
│ │   ├─ Push/Pull bidireccional                               │
│ │   ├─ Quality filters                                       │
│ │   └─ Image sync (Sharp optimization)                       │
│ ├─ Blog AI Generator (Claude API)                            │
│ ├─ Change Log / Auditoría                                    │
│ ├─ Team Management                                           │
│ ├─ Settings & Configuration                                  │
│ ├─ CRM Webhook receiver                                      │
│ └─ API Routes para propyte.com                               │
├──────────────────────────────────────────────────────────────┤
│ crm.propyte.com (Next.js 14 — Se mantiene)                   │
│ ├─ ELIMINA: ZohoApprovals (→ hub.propyte.com)               │
│ ├─ MANTIENE: Pipeline leads, deals, Meta Ads                 │
│ ├─ MANTIENE: Twilio, commissions, walk-ins                   │
│ └─ CONECTA: Leads webhook → hub.propyte.com                  │
├──────────────────────────────────────────────────────────────┤
│ Supabase (misma instancia — sin cambios en schemas)          │
│ ├─ real_estate_hub (source of truth — sin cambios)           │
│ ├─ investment_analytics (read-only — sin cambios)            │
│ ├─ public (web data — sin cambios)                           │
│ ├─ propyte_crm (CRM data — sin cambios)                     │
│ └─ Storage: property-images (sin cambios)                    │
└──────────────────────────────────────────────────────────────┘
```

### Flujo de Datos Post-Migración

```
                    ┌─────────────────────┐
                    │    Supabase DB      │
                    │  (Source of Truth)   │
                    └──────┬──────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
     ┌────────────┐ ┌───────────┐ ┌──────────┐
     │ hub.propyte│ │ propyte   │ │ crm      │
     │ .com       │ │ .com      │ │ .propyte │
     │ (Admin)    │ │ (Public)  │ │ .com     │
     │            │ │           │ │ (CRM)    │
     │ • Aprueba  │ │ • Muestra │ │ • Leads  │
     │ • Edita    │ │ • Captura │ │ • Deals  │
     │ • Sincr.   │ │ • SEO     │ │ • Meta   │
     │ • Blog AI  │ │ • PDF     │ │ • Twilio │
     └────┬───────┘ └─────┬─────┘ └────┬─────┘
          │               │            │
          │  revalidateTag│            │
          │◄──────────────┘            │
          │     (on-demand ISR)        │
          │                            │
          │   webhook leads            │
          │────────────────────────────▶│
          │                            │
```

---

## 2. STACK TECNOLÓGICO

### propyte.com (Frontend)

| Componente | Tecnología | Justificación |
|-----------|-----------|---------------|
| Framework | Next.js 16 (App Router) | RSC, ISR, Image Optimization nativo |
| Runtime | Node.js 22 LTS | Soporte de Next.js 16 |
| Lenguaje | TypeScript 5.8+ | Type safety end-to-end |
| CSS | Tailwind CSS 4.2 | Misma versión que WP actual (calca) |
| Fuente | Space Grotesk (Google Fonts) | `next/font/google` optimized |
| Animaciones | Framer Motion 12.x | Declarativo, React-native; replica triggers/timings exactos de WP |
| Mapas | @vis.gl/react-google-maps | React wrapper oficial Google Maps (obligatorio por indexación) |
| Charts | Recharts 3.x | React-native, ya en HERO-SITE; reemplaza Chart.js del WP |
| i18n | next-intl 4.x | Routing i18n con App Router |
| Iconos | Lucide React | Reemplazo 1:1 de los SVGs custom actuales |
| Imágenes | next/image + Supabase Storage | Optimización automática |
| PDF | @react-pdf/renderer | Server-side PDF generation |
| Forms | React Hook Form + Zod | Validación type-safe |
| Data Fetching | Supabase JS SDK 2.x | Directo a Supabase (no middleware) |
| SEO | next/metadata + JSON-LD | Schema.org @graph |
| Linting | ESLint + Prettier | Standard |
| Testing | Playwright (e2e) + Vitest (unit) | Continuidad con tests existentes |

### hub.propyte.com (Backend Hub)

| Componente | Tecnología | Justificación |
|-----------|-----------|---------------|
| Framework | Next.js 16 (App Router) | Misma base que frontend |
| Auth | NextAuth.js 5 (Auth.js) | JWT sessions, RBAC |
| DB Access | Supabase JS SDK 2.x | Directo a schemas |
| Image Processing | Sharp | Resize, WebP, optimize |
| Storage | Supabase Storage | Bucket existente |
| AI | Anthropic SDK (@anthropic-ai/sdk) | Blog generation |
| Email | Nodemailer + SMTP Hostinger | Notificaciones (NO Resend) |
| Cron | Vercel Cron / GitHub Actions | Scheduled sync |
| UI | Radix UI + Tailwind | Panel admin |
| File Upload | presigned URLs + Sharp pipeline | Image optimization |

---

## 3. ESTRUCTURA DE REPOSITORIOS

### Arquitectura: Repos Separados

Dos repositorios independientes. El código compartido (types, constants, utils) se duplica en ambos repos con un `shared/` folder interno — si crece mucho, se puede extraer a un paquete npm privado después.

### Repo 1: `Next_Propyte_web` — propyte.com (Frontend Público)

> **Origen:** Fork limpio de `HERO-SITE-ZILLOW-/`, adaptado con diseño canónico de WP  
> **GitHub:** Propyte-Team/Next_Propyte_web

```
Next_Propyte_web/
├── src/
│   ├── app/
│   │   ├── [locale]/                 # i18n routing (es/en)
│   │   │   ├── (main)/              # Layout principal con sidebar
│   │   │   │   ├── page.tsx                    # Homepage
│   │   │   │   ├── desarrollos/
│   │   │   │   │   ├── page.tsx                # Archive (map+list)
│   │   │   │   │   └── [slug]/page.tsx         # Detail
│   │   │   │   ├── propiedades/
│   │   │   │   │   ├── page.tsx                # Archive (list+filters)
│   │   │   │   │   └── [slug]/page.tsx         # Detail
│   │   │   │   ├── desarrolladores/
│   │   │   │   │   ├── page.tsx                # Archive
│   │   │   │   │   └── [slug]/page.tsx         # Detail
│   │   │   │   ├── mercado/page.tsx            # Market Intelligence
│   │   │   │   ├── built/page.tsx              # Portfolio Built
│   │   │   │   ├── blog/
│   │   │   │   │   ├── page.tsx                # Blog listing (categories, featured, pagination)
│   │   │   │   │   └── [slug]/page.tsx         # Blog post (reading time, author, related)
│   │   │   │   ├── contacto/page.tsx
│   │   │   │   ├── nosotros/
│   │   │   │   │   ├── page.tsx                # Landing/redirect
│   │   │   │   │   ├── quienes-somos/page.tsx  # Company story + mission
│   │   │   │   │   ├── estructura/page.tsx     # Organization structure
│   │   │   │   │   └── equipo/page.tsx         # Team bios + photos
│   │   │   │   ├── como-comprar/page.tsx
│   │   │   │   ├── como-invertir/page.tsx
│   │   │   │   ├── financiamiento/page.tsx
│   │   │   │   ├── destacados/page.tsx
│   │   │   │   ├── faq/page.tsx
│   │   │   │   ├── glosario/page.tsx
│   │   │   │   ├── zonas/page.tsx
│   │   │   │   ├── promociones/page.tsx
│   │   │   │   ├── brokers/page.tsx
│   │   │   │   ├── proveedores/page.tsx
│   │   │   │   ├── reclutamiento/page.tsx
│   │   │   │   ├── privacidad/page.tsx
│   │   │   │   └── terminos/page.tsx
│   │   │   └── ciudad/[city]/page.tsx          # Taxonomy
│   │   ├── api/
│   │   │   ├── leads/route.ts                  # Lead capture
│   │   │   ├── contact/route.ts                # Contact form
│   │   │   ├── supplier/route.ts               # Proveedor form
│   │   │   ├── pdf/[id]/route.ts               # PDF generation
│   │   │   ├── revalidate/route.ts             # On-demand ISR (from hub)
│   │   │   └── search/route.ts                 # Search API
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   └── layout.tsx                          # Root layout
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx                     # Desktop 72px sidebar nav
│   │   │   ├── MobileHeader.tsx                # Mobile header (gradient)
│   │   │   ├── SearchBubble.tsx                # Frosted glass search
│   │   │   ├── Footer.tsx                      # 6-col + CTA strip
│   │   │   └── WhatsAppFloat.tsx               # Floating WA button
│   │   ├── home/
│   │   │   ├── Hero.tsx                        # Video/image BG + search tabs
│   │   │   ├── ExploreCategories.tsx
│   │   │   ├── FeaturedProperties.tsx
│   │   │   ├── TrendingMarket.tsx
│   │   │   ├── WhyPropyte.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   ├── AppDownloadBanner.tsx
│   │   │   └── JoinTeamBanner.tsx
│   │   ├── property/
│   │   │   ├── PropertyCard.tsx                # Reusable card (from HERO, restyle)
│   │   │   ├── ImageGallery.tsx                # Gallery + carousel
│   │   │   ├── FinancingSimulator.tsx          # Dual-mode calculator
│   │   │   ├── InvestmentAnalysis.tsx          # Residencial + Vacacional tabs
│   │   │   ├── ROIProjection.tsx               # Projection chart (Recharts)
│   │   │   ├── MarketIndicator.tsx             # 100-point score badge
│   │   │   ├── ContactSidebar.tsx              # Sticky form
│   │   │   ├── MobileFloatingBar.tsx           # Bottom bar
│   │   │   ├── ShareDownloadModal.tsx          # Share/PDF modal (668 lines WP)
│   │   │   ├── SimilarListings.tsx             # Fallback algorithm
│   │   │   ├── UnitChips.tsx                   # Unit type chips
│   │   │   ├── AmenityList.tsx                 # 20 amenities display
│   │   │   └── UnitFAQs.tsx                    # Property-specific Q&A
│   │   ├── archive/
│   │   │   ├── FilterBar.tsx                   # Desktop 5 dropdowns
│   │   │   ├── MobileFilters.tsx               # Fullscreen chip-based modal
│   │   │   ├── MapView.tsx                     # Google Maps (migrado de Mapbox)
│   │   │   ├── ListView.tsx                    # Card grid
│   │   │   └── SortDropdown.tsx                # Sort control
│   │   ├── mercado/
│   │   │   ├── MercadoHero.tsx
│   │   │   ├── TabBar.tsx                      # Tradicional / Vacacional
│   │   │   ├── VacacionalTab.tsx               # AirDNA data, occupancy
│   │   │   ├── TradicionalTab.tsx              # Rental histogram, stats
│   │   │   └── AdvisorCTA.tsx
│   │   ├── blog/
│   │   │   ├── BlogCard.tsx                    # Blog post card
│   │   │   ├── BlogList.tsx                    # Listing with pagination
│   │   │   ├── BlogPost.tsx                    # Article content + schema
│   │   │   ├── CategoryFilter.tsx              # Category chips
│   │   │   └── RelatedPosts.tsx                # Related articles
│   │   ├── built/
│   │   │   ├── BuiltHero.tsx
│   │   │   ├── ServicesGrid.tsx
│   │   │   ├── PortfolioShowcase.tsx
│   │   │   ├── ProcessTimeline.tsx
│   │   │   ├── TeamExpertise.tsx
│   │   │   └── ConsultationForm.tsx
│   │   ├── ui/
│   │   │   ├── TabSystem.tsx                   # Generic tabs
│   │   │   ├── Carousel.tsx                    # Image carousel
│   │   │   ├── SaveButton.tsx                  # Heart/favorite (localStorage)
│   │   │   ├── CurrencyToggle.tsx              # MXN/USD (CurrencyContext)
│   │   │   ├── LanguageToggle.tsx              # ES/EN
│   │   │   ├── ScrollReveal.tsx                # Framer Motion wrapper
│   │   │   ├── CounterAnimation.tsx            # Number counter
│   │   │   ├── Breadcrumbs.tsx
│   │   │   ├── StageBadge.tsx                  # Stage color badge
│   │   │   └── PriceDisplay.tsx                # Formatted price
│   │   └── forms/
│   │       ├── LeadForm.tsx                    # Property inquiry
│   │       ├── ContactForm.tsx                 # General contact
│   │       ├── SupplierForm.tsx                # Proveedor
│   │       └── BuiltForm.tsx                   # Built consultation
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                       # Browser client (from HERO)
│   │   │   ├── server.ts                       # Server client (from HERO)
│   │   │   ├── developments.ts                 # Queries
│   │   │   ├── units.ts
│   │   │   ├── developers.ts
│   │   │   ├── zone-data.ts                    # Zone scores
│   │   │   ├── rental-data.ts                  # Rental estimates
│   │   │   ├── investment-data.ts              # Financials
│   │   │   └── market-indicator.ts             # Score calc
│   │   ├── helpers/
│   │   │   ├── format-price.ts
│   │   │   ├── stage-labels.ts
│   │   │   ├── type-labels.ts
│   │   │   ├── similar-listings.ts             # 4-level fallback
│   │   │   ├── video-utils.ts                  # YouTube/Vimeo/Drive ID
│   │   │   ├── currency.ts                     # MXN/USD conversion
│   │   │   └── slug-generator.ts               # SEO slug + 301 history
│   │   ├── calculator/
│   │   │   ├── financial.ts                    # ROI, IRR, Cap Rate, CoC
│   │   │   ├── irr-solver.ts                   # Newton-Raphson iterativo
│   │   │   ├── residential-model.ts            # 95% occ, 20% expense
│   │   │   └── vacation-model.ts               # AirDNA occ, 53% expense
│   │   ├── schema/
│   │   │   ├── website.ts                      # WebSite + SearchAction
│   │   │   ├── listing.ts                      # RealEstateListing
│   │   │   ├── item-list.ts                    # ItemList
│   │   │   ├── breadcrumb.ts                   # BreadcrumbList
│   │   │   └── organization.ts                 # RealEstateAgent
│   │   ├── pdf/
│   │   │   └── property-sheet.tsx              # PDF template
│   │   └── constants.ts                        # Design tokens, meta keys, taxonomies
│   ├── hooks/
│   │   ├── useFilters.ts                       # From HERO
│   │   ├── useMediaQuery.ts                    # From HERO
│   │   └── useUTMCapture.ts                    # UTM → sessionStorage
│   ├── context/
│   │   └── CurrencyContext.tsx                  # From HERO (MXN/USD)
│   ├── shared/
│   │   ├── types/                              # TypeScript types
│   │   │   ├── development.ts
│   │   │   ├── unit.ts
│   │   │   ├── developer.ts
│   │   │   ├── lead.ts
│   │   │   └── supabase.ts                     # Generated types
│   │   └── constants/
│   │       ├── meta-keys.ts                    # 70+ meta key mappings
│   │       ├── taxonomies.ts
│   │       ├── pipeline-statuses.ts
│   │       └── amenities.ts
│   ├── messages/
│   │   ├── es.json                             # Spanish (primary)
│   │   └── en.json                             # English (1,231 strings)
│   └── styles/
│       └── globals.css                         # Tailwind input (WP tokens)
├── public/
│   ├── images/                                 # Static images (5 logos)
│   └── fonts/                                  # If self-hosting
├── next.config.ts
├── tailwind.config.ts
├── middleware.ts                                # next-intl middleware
├── package.json
├── CLAUDE.md
└── .github/
    └── workflows/
        └── deploy.yml                          # Push main→prod (Hostinger)
```

### Repo 2: `Propyte_hub` — hub.propyte.com (Backend Admin)

> **GitHub:** Propyte-Team/Propyte_hub  
> **Se desarrolla en fase posterior** — después de que `Next_Propyte_web` esté en producción

```
Propyte_hub/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                        # Dashboard
│   │   │   ├── approvals/                      # Sistema aprobación
│   │   │   ├── sync/                           # Sync engine UI
│   │   │   ├── blog/                           # Blog AI generator
│   │   │   ├── change-log/                     # Auditoría
│   │   │   ├── team/                           # Equipo
│   │   │   ├── agents/                         # Agentes
│   │   │   └── settings/                       # Configuración
│   │   └── api/                                # 17 API routes
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── auth/
│   │   ├── sync/
│   │   ├── blog/
│   │   └── change-log.ts
│   ├── shared/                                 # Duplicado de Next_Propyte_web/shared
│   │   ├── types/
│   │   └── constants/
│   └── middleware.ts
├── package.json
├── CLAUDE.md
└── .github/
    └── workflows/
        ├── deploy.yml
        └── sync-cron.yml
```

### Comunicación entre repos

```
Next_Propyte_web                    Propyte_hub
─────────────────                   ───────────────
POST /api/revalidate  ◄──────────  revalidateTag() trigger
POST /api/leads       ──────────►  POST /api/leads/webhook
                                   POST /api/leads (forward → CRM)
```

La comunicación es via HTTP con `REVALIDATION_SECRET` compartido. No hay dependencia de código entre repos.

---

## 4. MÓDULO A — propyte.com (Frontend Next.js)

### 4.1 Páginas a Replicar (Calca Exacta)

Cada página debe ser un **clon pixel-perfect** del WordPress actual. La estructura HTML, los breakpoints responsive, las animaciones y la funcionalidad interactiva deben ser idénticos.

#### 4.1.1 Homepage (`/`)

**Secciones en orden exacto:**

| # | Sección | Componente | Data Source |
|---|---------|-----------|-------------|
| 1 | Hero con video/imagen BG + search tabs | `Hero.tsx` | Static + counts from Supabase |
| 2 | Explorar Categorías (5 cols) | `ExploreCategories.tsx` | Counts from Supabase aggregation |
| 3 | Propiedades Destacadas (6 cards) | `FeaturedProperties.tsx` | `v_developments` WHERE featured=true |
| 4 | Trending Market (4 KPIs + top zones) | `TrendingMarket.tsx` | Cached aggregation query |
| 5 | App Download Banner | `AppDownloadBanner.tsx` | Static |
| 6 | Why Propyte (3 audience + 6 feature cards) | `WhyPropyte.tsx` | Static |
| 7 | Propyte en Números (4 stats + portfolio) | `Testimonials.tsx` | Live counts from Supabase |
| 8 | Join Team Banner | `JoinTeamBanner.tsx` | Static |

**Rendering:** ISR con revalidación cada 1 hora. Las stats se refrescan con el revalidation.

**Hero Específico:**
- Background: Video o imagen de fondo con overlay gradient
- Search form tabulado: "Desarrollos" / "Propiedades" — cambia action URL + placeholder
- Stats pills: Counts dinámicos (desarrollos, propiedades, ciudades)
- Quick links: 4 filtros rápidos hardcoded
- Altura mínima: `min-h-[calc(520px+80px)] md:min-h-[calc(600px+80px)] lg:min-h-[calc(680px+80px)]`

#### 4.1.2 Detalle Desarrollo (`/desarrollos/[slug]`)

**Layout:** 2/3 main + 1/3 sidebar sticky (desktop) / 1 col + floating bar (mobile)

**Secciones Main:**

| # | Sección | Data Source |
|---|---------|-------------|
| 1 | Breadcrumbs | Generated from taxonomy |
| 2 | Image Gallery (hero 16:9 + thumbnails) | `propyte_images` / `galeria_ids` |
| 3 | Title + Location + Price | Post meta |
| 4 | Share/Download modal trigger | — |
| 5 | **Tab: Descripción** | |
| 5a | Description text (expandable, max 120px) | `post_content` |
| 5b | Unit type chips (links) | Child units query |
| 5c | 4 metric cards (tipo, etapa, zona, estado) | Meta fields |
| 5d | Metrics row (total/available/delivery/progress/commission) | Meta fields |
| 5e | Tour 360° card (toggle iframe) | `_propyte_tour_virtual_desarrollo` |
| 5f | Video card (toggle embed) | `_propyte_video_desarrollo` |
| 5g | Additional videos grid | `_desarrollo_videos_youtube[]` |
| 5h | Amenities list | 20× `amenidad_*` flags |
| 5i | Developer card (if destacado) | `_propyte_desarrollador_id` → post |
| 5j | Brochure link | `_propyte_url_brochure` |
| 6 | **Tab: Análisis Geográfico** | |
| 6a | Map embed (Google Maps) | `propyte_lat/lng` |
| 6b | Zone scores grid (6 cols max) | `Propyte_Zone_Data` |
| 6c | AirDNA metrics (occupancy, ADR) | `Propyte_Investment_Data` |
| 7 | **Tab: Análisis de Rentabilidad** | |
| 7a | ROI analysis text + sentiment | `Propyte_Market_Indicator` |
| 7b | Investment metrics (3 cols: ROI, Cap Rate, CoC) | `development_financials` |
| 7c | Comparison grid (vs CETES, vs bank) | Calculated |
| 8 | Similar Developments (3 cols) | `propyte_get_similar_listings()` |

**Sidebar (sticky top-28):**
- Contact form (name, phone, email, message)
- WhatsApp CTA button
- Mobile: floating bar fixed bottom (price + WA + contact buttons)

**Rendering:** ISR con `generateStaticParams` + revalidación on-demand desde hub.

#### 4.1.3 Detalle Unidad (`/propiedades/[slug]`)

**Estructura similar a Desarrollo con estas diferencias:**
- Gallery: imágenes de la unidad, fallback a parent desarrollo
- Specs: recámaras, baños, estacionamientos, superficie, subtipo, piso
- Availability badge: disponible (green) / reservado (amber) / vendido (red)
- Tab adicional: Simulador de Financiamiento (sliders + cálculo)
- Parent development link con card
- Slug generation: `{titulo}-{tipo}-{ciudad}-{precio}mxn`
- 301 redirects para slugs anteriores (`_unidad_slugs_anteriores`)

#### 4.1.4 Archive Desarrollos (`/desarrollos`)

**Layout:** Map + List Split (60/40 desktop, toggle mobile)

| Componente | Comportamiento |
|-----------|----------------|
| Action row | Anuncia + Language toggle + Contact (hidden mobile) |
| Filter bar | Logo + Search pill + 5 filter dropdowns + "Más filtros" + Sort |
| "Más filtros" modal | Stage radios + Uso checkboxes + Clear/Apply |
| Mobile filters | Fullscreen modal (mismos filtros) |
| Map container (60%) | Google Maps JS API + markers + info windows |
| List container (40%) | Grid 1→2 cols + PropertyCard × N |
| Empty state | Mensaje cuando no hay resultados |

**Filtros:**
- Búsqueda texto (title search)
- Ciudad (taxonomy `propyte_city`)
- Precio (rango: Hasta $3M, $3M-$5M, $5M-$10M, $10M+)
- Tipo (taxonomy `propyte_type`)
- ROI (meta query >=)
- Etapa (taxonomy `propyte_stage` via modal)
- Uso (meta `propyte_usage` via modal checkboxes)
- Destacados (meta `_propyte_destacado`)

**Sort options:** Recientes, Precio ↑, Precio ↓

**Query:** max 60 resultados, con paginación si se necesita.

**Map data:** Array `{id, title, lat, lng, price, slug}` — solo entries con coordenadas válidas.

#### 4.1.5 Archive Unidades (`/propiedades`)

**Idéntico a Archive Desarrollos excepto:**
- Post type: `unidad`
- Filtros: Ciudad, Recámaras, Precio, Tipo, Área (modal), Solo disponibles (toggle)
- Cards muestran: price, beds, baths, area, developer, status badge
- No map split por default (list-only)

#### 4.1.6 Market Intelligence (`/mercado`)

- Hero con KPIs dinámicos
- 2 tabs: Vacacional / Tradicional
- Contenido por tab: zone scores, charts, comparables
- Currency toggle (MXN/USD localStorage)
- Data: `Propyte_Zone_Data`, `Propyte_Rental_Data`, AirDNA

#### 4.1.7 Portfolio Built (`/built`)

**8 secciones exactas:**
1. Hero dark (3 animated words: Diseña. Construye. Habita.)
2. Philosophy blockquote
3. Services grid (3×2)
4. Portfolio showcase (filter tabs + 3-col grid + hover overlay)
5. Process timeline (5 steps, horizontal desktop / vertical mobile)
6. Team expertise (3 cards)
7. Consultation form (2/5 info + 3/5 form)
8. Final CTA dark

#### 4.1.8 Páginas Estáticas (Content Pages)

| Ruta | Tipo | Notas |
|------|------|-------|
| `/contacto` | Form + info | AJAX contact form |
| `/nosotros` | Layout + redirect | Landing page redirige a `/nosotros/quienes-somos` |
| `/nosotros/quienes-somos` | Content | Company story, misión, valores |
| `/nosotros/estructura` | Content | Organigrama + estructura comercial |
| `/nosotros/equipo` | Dynamic | Team bios, fotos, agent profiles desde hub API |
| `/como-comprar` | Content | Guía paso a paso |
| `/como-invertir` | Content | Guía de inversión |
| `/financiamiento` | Content | Info financiera |
| `/destacados` | Dynamic | Featured properties (dark hero) |
| `/faq` | Content | Accordion FAQ |
| `/glosario` | Content | Términos inmobiliarios |
| `/zonas` | Dynamic | Zone explorer con datos Supabase |
| `/promociones` | Content | Ofertas vigentes |
| `/brokers` | Content | Info para brokers |
| `/proveedores` | Form + info | Supplier registration |
| `/reclutamiento` | Content | Job openings |
| `/privacidad` | Content | Privacy policy |
| `/terminos` | Content | Terms of service |
| `/blog` | Dynamic | Blog listing (category filter, featured, pagination, reading time) |
| `/blog/[slug]` | Dynamic | Blog post (article schema, author, related posts, social share) |

#### 4.1.9 Taxonomy Pages (`/ciudad/[city]`, `/tipo/[type]`, `/zona/[zone]`, `/etapa/[stage]`)

- Reusan el componente de archive con filtro pre-aplicado
- SEO: metadata dinámica por taxonomía
- Schema: ItemList con items filtrados

---

## 5. MÓDULO B — hub.propyte.com (Backend Hub)

### 5.1 Funcionalidades Migradas del Plugin WordPress

| Funcionalidad WP Plugin | → Hub Equivalente |
|--------------------------|-------------------|
| `Propyte_Sync_Manager` (877 líneas) | `lib/sync/sync-engine.ts` |
| `Propyte_Push_Sync` (300+ líneas) | `lib/sync/push-engine.ts` |
| `Propyte_Image_Sync` (200+ líneas) | `lib/sync/image-sync.ts` |
| `Propyte_Admin` (1,069 líneas) | Dashboard pages + API routes |
| `Propyte_Settings` (250 líneas) | `/settings` page + `api/settings` |
| `Propyte_Team_Settings` | `/team` page + `api/team` |
| `Propyte_Change_Log` (250+ líneas) | `lib/change-log.ts` + Supabase table |
| `Propyte_Blog_Generator` (250 líneas) | `lib/blog/ai-generator.ts` |
| `Propyte_CRM` (81 líneas) | `api/leads/webhook` route |
| `Propyte_Workflow` (107 líneas) | En approval system |
| `Propyte_Agent_Profile` (421 líneas) | `/agents` page + `api/agents` |
| `Propyte_Ajax` (247 líneas) | → propyte.com API routes |
| `Propyte_PDF_Generator` | → propyte.com server-side |
| `Propyte_Slug_Generator` (226 líneas) | `lib/helpers/slug-generator.ts` |

### 5.2 Funcionalidades Migradas del CRM

| Funcionalidad CRM | → Hub Equivalente |
|--------------------|-------------------|
| `ZohoApprovalsClient` (2,000+ líneas) | `/approvals` page + components |
| `GET /api/zoho/approvals` | `GET /api/approvals` |
| `PATCH /api/zoho/approvals` | `PATCH /api/approvals` |
| `PATCH /api/zoho/approvals/edit` | `PATCH /api/approvals/edit` |
| `POST /api/zoho/approvals/upload-image` | `POST /api/approvals/upload-image` |
| `POST /api/zoho/approvals/delete-image` | `POST /api/approvals/delete-image` |
| `POST /api/zoho/approvals/duplicate` | `POST /api/approvals/duplicate` |
| Completeness scoring logic | Shared en `shared/constants/` |
| Field whitelisting | Shared en `shared/constants/` |
| Zoho sync engine (`lib/zoho/sync-engine.ts`) | `api/sync` routes |

### 5.3 Funcionalidades NUEVAS del Hub

| Feature | Descripción |
|---------|-------------|
| On-demand ISR trigger | `POST /api/revalidate` → llama `revalidateTag()` en propyte.com |
| Unified settings panel | Todas las opciones del plugin WP en una UI |
| Real-time sync dashboard | Logs, errores, timestamps, progreso |
| Image pipeline visual | Ver estado de optimización de imágenes |
| Content preview | Preview de cómo se ve en propyte.com antes de publicar |

---

## 6. DESIGN SYSTEM — CALCA EXACTA

### 6.1 Paleta de Colores

```typescript
// shared/constants/colors.ts
export const colors = {
  // Brand
  teal:       '#5CE0D2',  // Primary CTA
  tealDark:   '#4BCEC0',  // Hover state
  tealA11y:   '#0D9488',  // WCAG AA text on white (4.5:1+)
  aquaBright: '#99FFFF',  // Accent
  navy:       '#1A2F3F',  // Primary text
  graphite:   '#2C2C2C',  // Body text
  aztec:      '#0F1923',  // Dark backgrounds
  deepOnyx:   '#1A1A2E',  // Darker backgrounds

  // Functional
  amber:      '#F5A623',  // Warning/highlight
  lightGray:  '#F4F6F8',  // Backgrounds
  success:    '#22C55E',  // Positive states
  error:      '#EF4444',  // Error states
  whatsapp:   '#25D366',  // WhatsApp button

  // Social
  instagram:  '#E1306C',
  facebook:   '#1877F2',
} as const;
```

### 6.2 Tipografía

```typescript
// src/app/layout.tsx
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
});
```

### 6.3 Tailwind Config (Calca de input.css)

```typescript
// tailwind.config.ts (Next_Propyte_web root)
export default {
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: '#5CE0D2', dark: '#4BCEC0', a11y: '#0D9488' },
        navy: '#1A2F3F',
        graphite: '#2C2C2C',
        aztec: '#0F1923',
        'deep-onyx': '#1A1A2E',
        amber: '#F5A623',
        'light-gray': '#F4F6F8',
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        badge: '4px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)',
      },
      backdropBlur: {
        bubble: '16px',
      },
    },
  },
};
```

### 6.4 Layout Global

| Elemento | Medida | Notas |
|----------|--------|-------|
| Sidebar width | 72px | Solo desktop (lg:) |
| Content margin-left | 72px | `lg:ml-[72px]` |
| Max container | 1280px | `max-w-[1280px] mx-auto` |
| Container padding | 16px / 24px | `px-4 md:px-6` |
| Section padding | 48px / 64px | `py-12 md:py-16` |
| Mobile header height | 44px | `h-11` |
| Search bubble height | 52px / 42px | Desktop / Mobile |

### 6.5 Componentes Clave de Layout

#### Sidebar (Desktop — Fixed Left)
- Width: 72px, bg: `#0F1923`
- Nav items vertically centered con iconos Lucide
- Items: Home, Desarrollos (building-2), Propiedades (key), Nosotros (globe), Mercado (store)
- "Más" dropdown at bottom: Desarrolladores, Brokers, Proveedores, Reclutamiento, Blog
- Active state: teal accent line left

#### Mobile Header (Fixed Top)
- Row 1: Logo | Language toggle | Hamburger
- Row 2: Search bubble (42px)
- Gradient bg: `rgba(255,255,255,0.97)` → transparent
- Menu: Dark slide-from-left panel, items + WA CTA

#### Search Bubble (Floating)
- Max-width: 600px, height: 52px (desktop)
- Bg: `rgba(255,255,255,0.92)` + `backdrop-filter: blur(16px)`
- Border: `1px solid rgba(0,0,0,0.08)`
- Shadow: `0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)`
- Focus-within: teal border glow 3px ring
- On dark hero (before scroll): `rgba(255,255,255,0.12)` frosted glass, white text

#### Footer
- CTA Strip: Navy bg, "¿Listo para encontrar tu próxima inversión?"
- Main: Aztec bg (#0F1923), 6-col grid (2→3→6 responsive)
- Columns: Brand+social, Properties, Company, Guides, Contact
- Bottom: Copyright + Privacy + Terms
- WhatsApp float: 60×60, green, bottom-right, shows after scroll > 300px

---

## 7. MAPA DE RUTAS COMPLETO

### propyte.com Routes

```
/                                    → Homepage (ISR 1h)
/desarrollos                         → Archive developments (ISR 5min)
/desarrollos/[slug]                  → Development detail (ISR on-demand)
/propiedades                         → Archive units (ISR 5min)
/propiedades/[slug]                  → Unit detail (ISR on-demand)
/desarrolladores                     → Archive developers (ISR 1h)
/desarrolladores/[slug]              → Developer detail (ISR on-demand)
/ciudad/[city]                       → Taxonomy: city filter (ISR 1h)
/tipo/[type]                         → Taxonomy: type filter (ISR 1h)
/zona/[zone]                         → Taxonomy: zone filter (ISR 1h)
/etapa/[stage]                       → Taxonomy: stage filter (ISR 1h)
/mercado                             → Market intelligence (ISR 1h)
/built                               → Portfolio (ISR 24h)
/blog                                → Blog listing (ISR 1h)
/blog/[slug]                         → Blog post (ISR on-demand)
/contacto                            → Contact page (static)
/nosotros                            → About landing/redirect
/nosotros/quienes-somos              → Company story + mission (ISR 6h)
/nosotros/estructura                 → Organization structure (ISR 6h)
/nosotros/equipo                     → Team bios + photos (ISR 6h)
/como-comprar                        → Buying guide (static)
/como-invertir                       → Investment guide (static)
/financiamiento                      → Financing info (static)
/destacados                          → Featured (ISR 1h)
/faq                                 → FAQ (static)
/glosario                            → Glossary (static)
/zonas                               → Zone explorer (ISR 1h)
/promociones                         → Promotions (static)
/brokers                             → Broker info (static)
/proveedores                         → Supplier page (static)
/reclutamiento                       → Recruitment (static)
/privacidad                          → Privacy policy (static)
/terminos                            → Terms of service (static)

# API Routes
/api/leads                           → POST lead submission
/api/contact                         → POST contact form
/api/supplier                        → POST supplier form
/api/pdf/[id]                        → GET property PDF
/api/revalidate                      → POST on-demand ISR (from hub)
/api/search                          → GET search results

# i18n (duplica todas las rutas bajo /en/)
/en/...                              → English versions
```

### hub.propyte.com Routes

```
/login                               → Auth page

# Dashboard
/                                    → Dashboard (sync status, stats, recent)
/approvals                           → Approval system (3 tabs)
/sync                                → Sync engine dashboard
/blog                                → Blog AI generator
/change-log                          → Audit trail
/team                                → Team management
/agents                              → Agent profiles
/settings                            → Configuration

# API Routes
/api/approvals                       → GET/PATCH approvals
/api/approvals/edit                  → PATCH field editing
/api/approvals/upload-image          → POST image upload
/api/approvals/delete-image          → POST image removal
/api/approvals/duplicate             → POST record clone
/api/sync                            → POST manual sync
/api/sync/cron                       → POST scheduled sync
/api/sync/status                     → GET sync status
/api/leads                           → POST receive leads
/api/leads/webhook                   → POST forward to CRM
/api/blog/generate                   → POST AI generation
/api/blog/cron                       → POST scheduled generation
/api/revalidate                      → POST trigger propyte.com ISR
/api/change-log                      → GET/POST audit entries
/api/team                            → GET/POST/PATCH team
/api/agents                          → GET/POST/PATCH agents
/api/settings                        → GET/PATCH configuration
```

---

## 8. COMPONENTES — INVENTARIO PIXEL-PERFECT

### 8.1 PropertyCard (Marketplace Card)

**Réplica exacta de `template-parts/marketplace/card.php`:**

```
┌────────────────────────────────────┐
│ ┌────────────────────────────────┐ │
│ │          IMAGE CAROUSEL        │ │ ← aspect-[16/10]
│ │  ◄                          ►  │ │ ← Arrows visible on hover
│ │  [PREVENTA]      [📷 4]       │ │ ← Stage badge + photo count
│ │             ● ● ● ○           │ │ ← Dot indicators
│ │                         [♡]   │ │ ← Save button (localStorage)
│ └────────────────────────────────┘ │
│ $5,500,000 MXN                     │ ← Bold, navy
│ ~~$6,200,000~~ -11%               │ ← Strikethrough + discount badge
│ 🛏 3  |  🚿 2  |  📐 185 m²      │ ← Icons + specs inline
│ Nativa Tulum                       │ ← Title (1 line, truncate)
│ Tulum, Quintana Roo               │ ← Location
│ ROI 8.5% · Cap 6.2% · $12k/mo    │ ← Financial badges (if data)
│ Developer Name · Entrega: 2027    │ ← Developer + delivery
│ [Promo banner si aplica]           │ ← Optional bottom banner
└────────────────────────────────────┘
```

**Estados:**
- Normal: `shadow-sm`
- Hover: `shadow-lg`, slight lift
- Vendido/Reservado: `opacity-60`

**Carousel lógica:**
- Track: `translateX(-${current * (100/count)}%)`
- Touch/swipe: threshold 40px
- Dots: max 5 visible

### 8.2 Image Gallery (Detail Pages)

```
┌──────────────────────────────────────────┐
│                                          │
│              HERO IMAGE                  │ ← aspect-[16/9]
│              (click to expand)           │
│                                          │
├──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──────────┤
│t1│t2│t3│t4│t5│t6│t7│t8│t9│..│ scroll → │ ← w-20 h-14 thumbnails
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──────────┘
```

### 8.3 Contact Sidebar (Sticky)

```
┌─────────────────────────┐
│  ¿Te interesa esta      │ ← Headline
│  propiedad?             │
│                         │
│  ┌───────────────────┐  │
│  │ Nombre completo   │  │ ← Input
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ WhatsApp          │  │ ← Input (phone)
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ Email             │  │ ← Input
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ Mensaje           │  │ ← Textarea
│  │                   │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │   ENVIAR MENSAJE  │  │ ← Teal button
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ 📱 WhatsApp       │  │ ← Green WA button
│  └───────────────────┘  │
└─────────────────────────┘
```

### 8.4 Financing Simulator

```
┌──────────────────────────────────────┐
│  Simulador de Financiamiento         │
│                                      │
│  Enganche: [====●==========] 20%    │ ← Slider 10-100%
│  Tasa anual: [=====●========] 9.5%  │ ← Slider 0-20%
│  Apreciación: [===●=========] 5%    │ ← Slider 0-20%
│                                      │
│  Plazo:  [6m] [12m] [18m] [●24m]   │ ← Button group
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Pago mensual estimado      │   │
│  │  $45,833 MXN                │   │ ← Calculated
│  └──────────────────────────────┘   │
│                                      │
│  Enganche: $1,100,000              │
│  Monto a financiar: $4,400,000     │
│  Costo total: $5,720,000           │
└──────────────────────────────────────┘
```

### 8.5 Filter Bar (Archives)

```
Desktop:
┌─────────────────────────────────────────────────────────────────┐
│ [🔍 Buscar...] [Ciudad ▼] [Precio ▼] [Tipo ▼] [ROI ▼]        │
│ [+ Más filtros]                          [Ordenar ▼] 42 result │
│ [×Ciudad: Tulum] [×Precio: $3M-$5M]              ← Active     │
└─────────────────────────────────────────────────────────────────┘

Mobile (fullscreen modal):
┌─────────────────────────────────┐
│  ← Filtros                      │
│                                  │
│  Ciudad                          │
│  [Tulum] [Cancún] [PDC] [...]   │ ← Chip toggles
│                                  │
│  Precio                          │
│  [<$3M] [$3-5M] [$5-10M] [>10M]│
│                                  │
│  Tipo                            │
│  [Depto] [PH] [Casa] [Terreno] │
│                                  │
│  ─────────────────────────────── │
│  [Limpiar]     [Ver 42 result.] │ ← Sticky footer
└─────────────────────────────────┘
```

---

## 9. DATA LAYER — SUPABASE INTEGRATION

### 9.1 Tablas y Vistas Utilizadas

#### Schema: `real_estate_hub` (Read/Write)

| Tabla/Vista | Uso | Operaciones |
|-------------|-----|-------------|
| `v_developments` | Pull developments | READ (sync + frontend) |
| `v_units` | Pull units | READ (sync + frontend) |
| `v_developers` | Pull developers | READ (sync + frontend) |
| `Propyte_desarrollos` | Push developments | WRITE (upsert/patch) |
| `Propyte_unidades` | Push units | WRITE (upsert/patch) |
| `Propyte_desarrolladores` | Push developers | WRITE (upsert/patch) |

#### Schema: `investment_analytics` (Read Only)

| Tabla | Uso |
|-------|-----|
| `development_financials` | ROI, IRR, cap rate, yields |
| `rental_estimates` | Median/avg rents por zona |
| `rental_comparables` | Listings activos para comparar |
| `airdna_metrics` | Occupancy %, ADR por market |
| `zone_scores` | Zone performance scores |

#### Schema: `public` (Read — frontend direct queries)

| Tabla | Uso |
|-------|-----|
| Developments data | Frontend queries directas |
| Units data | Frontend queries directas |
| Blog posts | AI-generated content |

### 9.2 Queries Clave (TypeScript)

```typescript
// lib/supabase/developments.ts

// Fetch all published developments for archive
export async function getDevelopments(filters?: DevelopmentFilters) {
  let query = supabase
    .schema('real_estate_hub')
    .from('v_developments')
    .select('*')
    .eq('published', true)
    .not('approved_at', 'is', null)
    .in('zoho_pipeline_status', ['aprobado', 'listo']);

  if (filters?.city) query = query.ilike('city', filters.city);
  if (filters?.type) query = query.eq('property_type', filters.type);
  if (filters?.priceMin) query = query.gte('price_mxn', filters.priceMin);
  if (filters?.priceMax) query = query.lte('price_mxn', filters.priceMax);
  if (filters?.stage) query = query.eq('stage', filters.stage);

  return query.order('updated_at', { ascending: false }).limit(60);
}

// Fetch single development by slug
export async function getDevelopmentBySlug(slug: string) {
  return supabase
    .schema('real_estate_hub')
    .from('v_developments')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();
}

// Fetch development financials
export async function getDevelopmentFinancials(devId: string) {
  return supabase
    .schema('investment_analytics')
    .from('development_financials')
    .select('*')
    .eq('development_id', devId)
    .single();
}
```

### 9.3 Caching Strategy

| Query | TTL | Método Next.js |
|-------|-----|---------------|
| Development list | 5 min | ISR `revalidate: 300` |
| Development detail | On-demand | `revalidateTag('dev-{slug}')` |
| Unit list | 5 min | ISR `revalidate: 300` |
| Unit detail | On-demand | `revalidateTag('unit-{slug}')` |
| Zone scores | 1 hour | `unstable_cache` with 3600s |
| Rental data | 1 hour | `unstable_cache` with 3600s |
| Investment data | 1 hour | `unstable_cache` with 3600s |
| AirDNA | 1 hour | `unstable_cache` with 3600s |
| Market stats (home) | 1 hour | ISR `revalidate: 3600` |
| Blog posts | On-demand | `revalidateTag('blog')` |
| Team data | 6 hours | ISR `revalidate: 21600` |

### 9.4 On-Demand Revalidation Flow

```
Hub admin edits/approves development
  → hub.propyte.com saves to Supabase
  → hub calls POST propyte.com/api/revalidate
    → body: { tag: 'dev-nativa-tulum', secret: REVALIDATION_SECRET }
    → propyte.com runs revalidateTag('dev-nativa-tulum')
    → Next request to /desarrollos/nativa-tulum serves fresh data
```

---

## 10. SISTEMA DE SYNC BIDIRECCIONAL

### 10.1 Pull Sync (Supabase → propyte.com cache)

**Migrado de:** `class-propyte-sync-manager.php` (877 líneas)

**Trigger:** Cron (configurable: 15min / 6h / 24h) + Manual desde hub dashboard

**Lógica:**
```
1. Fetch records from v_developments WHERE updated_at >= last_sync_time
   - Batch: 500 records per request (incremental)
   - Full sync: 2000 records (manual trigger)

2. Apply Quality Filters:
   - REJECT if: no name, no city, no images, all Unsplash images
   - REJECT if: published != true OR approved_at is null
   - REJECT if: zoho_pipeline_status NOT IN ('aprobado', 'listo')

3. For each passing record:
   - Check if exists in propyte_web cache (by supabase_id)
   - If exists + edited_locally → mark as 'conflict'
   - If exists + synced → update
   - If new → create

4. Image Sync:
   - Download images from Supabase Storage
   - Optimize with Sharp (WebP, resize)
   - Store optimized versions

5. Trigger on-demand ISR for affected pages:
   - revalidateTag('dev-{slug}') for each updated development
   - revalidateTag('developments-archive') for list pages

6. Update last_sync_time
7. Log results to change_log
```

### 10.2 Push Sync (hub.propyte.com → Supabase)

**Migrado de:** `class-propyte-push-sync.php` (300+ líneas)

**Trigger:** On save in approval system (field edit, status change)

**Lógica:**
```
1. Guard checks:
   - Skip if currently pulling (anti-loop)
   - Skip if auto-save
   - Validate user permissions (ADMIN/DIRECTOR/GERENTE)

2. Build payload from edited fields
   - Map hub field names → Supabase column names

3. If has supabase_id → PATCH
   Else → UPSERT (POST with Prefer: resolution=merge-duplicates)

4. On success:
   - Save returned ID if new
   - Mark sync_status = 'synced'
   - Trigger ISR revalidation on propyte.com

5. On failure:
   - Store error in sync_error field
   - Mark sync_status = 'push_failed'
   - Log to change_log
```

### 10.3 Quality Filters (TypeScript)

```typescript
// lib/sync/quality-filters.ts
export function passesQualityCheck(data: RawDevelopment): QualityResult {
  const errors: string[] = [];

  if (!data.name?.trim()) errors.push('no name');
  if (!data.city?.trim()) errors.push('no city');
  if (!data.published) errors.push('not published');
  if (!data.approved_at) errors.push('not approved');

  const status = data.zoho_pipeline_status?.toLowerCase().trim();
  if (!['aprobado', 'listo'].includes(status ?? '')) {
    errors.push(`invalid pipeline status: ${status}`);
  }

  const images = data.images?.filter(Boolean) ?? [];
  const realImages = images.filter(url => !url.includes('unsplash.com'));
  if (realImages.length === 0) errors.push('no real images (only unsplash/empty)');

  return {
    passes: errors.length === 0,
    errors,
  };
}
```

---

## 11. SISTEMA DE APROBACIÓN (MIGRADO DEL CRM)

### 11.1 Pipeline Status States

```
discovery → analisis → presentacion → aprobado → listo
                                         ↓
                                       pausa
                                         ↓
                                     descartado
```

### 11.2 API Endpoints (Migrados)

| Endpoint Actual (CRM) | → Hub Nuevo | Método |
|------------------------|-------------|--------|
| `/api/zoho/approvals?tab=...` | `/api/approvals?tab=...` | GET |
| `/api/zoho/approvals` (bulk) | `/api/approvals` | PATCH |
| `/api/zoho/approvals?action=toggle_web` | `/api/approvals?action=toggle_web` | PATCH |
| `/api/zoho/approvals/edit` | `/api/approvals/edit` | PATCH |
| `/api/zoho/approvals/upload-image` | `/api/approvals/upload-image` | POST |
| `/api/zoho/approvals/delete-image` | `/api/approvals/delete-image` | POST |
| `/api/zoho/approvals/duplicate` | `/api/approvals/duplicate` | POST |

### 11.3 Completeness Scoring

**Developer (10 fields, weighted):**
- nombre_desarrollador (weight: 2)
- logo, sitio_web, telefono, email, descripcion, ext_descripcion_en, ext_ciudad, ext_estado, ext_slug (weight: 1 each)

**Development (20 fields, weighted):**
- Price range, photos, description (high weight)
- Amenities, dimensions, financing details (medium weight)

**Unit (13 fields):**
- Unit number, type, surface, price (high weight)
- Photos, description (medium weight)

**Color coding:**
- ≥75%: GREEN `#22C55E`
- ≥50%: AMBER `#F5A623`
- ≥25%: ORANGE `#F97316`
- <25%: RED `#EF4444`

### 11.4 Field Whitelist (por entity_type)

**Developer (17 fields):** nombre_desarrollador, logo, sitio_web, email, phone, city, description_es/en, verified, etc.

**Development (40+ fields):** name, city, price range, amenities, ROI fields, descriptions, dates, fotos, tour, video, etc.

**Unit (13 fields):** unit_number, type, bedrooms, bathrooms, area, price, status, photos, plano, etc.

### 11.5 Adición: Trigger ISR en Aprobación

Cuando un record cambia a `aprobado` o `listo`:
1. Actualizar en Supabase
2. Si `ext_publicado = true` → llamar `POST propyte.com/api/revalidate`
3. Notificar al admin que la página se actualizó

---

## 12. SEO & SCHEMA.ORG

### 12.1 Schema.org @graph (Calca exacta)

**Siempre incluidos:**
- `WebSite` con `SearchAction` (potentialAction)
- `RealEstateAgent` (Organization): Propyte info, address, geo, social

**Condicionales:**
- `RealEstateListing`: En single desarrollo/unidad
- `ItemList`: En archives y search
- `BreadcrumbList`: En todas las páginas
- `ImageGallery`: En singles con imágenes

```typescript
// lib/schema/listing.ts
export function generateListingSchema(dev: Development): JsonLd {
  return {
    '@type': 'RealEstateListing',
    name: dev.name,
    description: dev.description,
    url: `https://propyte.com/desarrollos/${dev.slug}`,
    image: dev.images?.[0],
    address: {
      '@type': 'PostalAddress',
      addressLocality: dev.city,
      addressRegion: dev.state,
      addressCountry: 'MX',
    },
    geo: dev.lat && dev.lng ? {
      '@type': 'GeoCoordinates',
      latitude: dev.lat,
      longitude: dev.lng,
    } : undefined,
    offers: dev.available_units > 0 ? {
      '@type': 'AggregateOffer',
      lowPrice: dev.price_from,
      highPrice: dev.price_to,
      priceCurrency: dev.currency || 'MXN',
      offerCount: dev.available_units,
      availability: 'https://schema.org/InStock',
    } : {
      '@type': 'Offer',
      availability: 'https://schema.org/SoldOut',
    },
    amenityFeature: dev.amenities?.map(a => ({
      '@type': 'LocationFeatureSpecification',
      name: a,
    })),
    numberOfRooms: dev.bedrooms,
    floorSize: dev.area_m2 ? {
      '@type': 'QuantitativeValue',
      value: dev.area_m2,
      unitCode: 'MTK',
    } : undefined,
  };
}
```

### 12.2 Meta Tags (next/metadata)

```typescript
// app/[locale]/desarrollos/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const dev = await getDevelopmentBySlug(params.slug);
  return {
    title: `${dev.name} — Inversión en ${dev.city} | Propyte`,
    description: dev.excerpt || `${dev.name} en ${dev.city}. Desde $${formatPrice(dev.price_from)} MXN.`,
    openGraph: {
      title: dev.name,
      description: dev.excerpt,
      images: [{ url: dev.images?.[0], width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
    alternates: {
      canonical: `https://propyte.com/desarrollos/${dev.slug}`,
      languages: { en: `/en/developments/${dev.slug}` },
    },
  };
}
```

### 12.3 Sitemap Dinámico

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const developments = await getAllDevelopmentSlugs();
  const units = await getAllUnitSlugs();
  const pages = ['', 'desarrollos', 'propiedades', 'mercado', 'contacto', ...];

  return [
    ...pages.map(p => ({
      url: `https://propyte.com/${p}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: p === '' ? 1 : 0.8,
    })),
    ...developments.map(d => ({
      url: `https://propyte.com/desarrollos/${d.slug}`,
      lastModified: d.updated_at,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
    ...units.map(u => ({
      url: `https://propyte.com/propiedades/${u.slug}`,
      lastModified: u.updated_at,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ];
}
```

---

## 13. INTERNACIONALIZACIÓN (i18n)

### 13.1 Setup con next-intl

**Locales soportados:** `es` (primary), `en`
**Default locale:** `es`
**Total strings a migrar:** 1,231 (del .po existente)

### 13.2 Routing

```
propyte.com/                      → Spanish (default, no prefix)
propyte.com/en/                   → English
propyte.com/desarrollos/...       → Spanish
propyte.com/en/developments/...   → English
```

### 13.3 Categorías de Traducción

| Categoría | Count | Ejemplo |
|-----------|-------|---------|
| UI Labels | ~200 | "Buscar" → "Search" |
| Property Types | ~15 | "Departamento" → "Apartment" |
| Financial Terms | ~50 | "Enganche" → "Down payment" |
| Status/Stage | ~10 | "Preventa" → "Pre-sale" |
| Locations | ~30 | "Cancún" → "Cancun" |
| CTAs | ~40 | "Contactar por WhatsApp" → "Contact via WhatsApp" |
| Filters | ~30 | "Hasta $3M" → "Up to $3M" |
| Market | ~20 | "Plusvalía de zona" → "Zone appreciation" |
| Misc | ~836 | Everything else |

### 13.4 Currency i18n

- MXN ↔ USD toggle persisted in localStorage (`propyte_currency`)
- Exchange rate: `data-usd-rate` attribute (default 17.5)
- `propyteApplyCurrency()` function replica en React state

---

## 14. FORMULARIOS & LEAD CAPTURE

### 14.1 Lead Form (Property Inquiry)

**Trigger:** Sidebar en single desarrollo/unidad

**Campos:**
| Campo | Tipo | Validación |
|-------|------|-----------|
| `name` | text | Required |
| `phone` | tel | Required (or email) |
| `email` | email | Required (or phone) |
| `message` | textarea | Optional |
| `property_id` | hidden | Auto from page |
| `property_name` | hidden | Auto from page |
| `source` | hidden | `form` / `whatsapp` / `phone` |
| `utm_source` | hidden | From sessionStorage |
| `utm_medium` | hidden | From sessionStorage |
| `utm_campaign` | hidden | From sessionStorage |

**Flow:**
```
Frontend form → POST propyte.com/api/leads
  → Validate with Zod
  → Forward to hub.propyte.com/api/leads
    → Save to Supabase (leads table)
    → Forward to crm.propyte.com/api/leads (webhook)
    → Return { success: true, leadId }
```

### 14.2 Contact Form (General)

**Trigger:** `/contacto` page

**Campos adicionales:** `subject` (text)

**Flow:** Same as lead pero source='contacto'

### 14.3 Supplier Form (Proveedores)

**Trigger:** `/proveedores` page

**Campos adicionales:** `empresa`, `tipo_proveedor` (select), `ciudad`, `sitio_web`

**Flow:** Same as lead pero source='proveedor'

### 14.4 Built Consultation Form

**Trigger:** `/built` page, section 7

**Campos:** nombre, email, telefono, empresa, tipo_proyecto (select), presupuesto (select), ubicacion, mensaje

**Flow:** POST propyte.com/api/leads con source='built'

---

## 15. GENERACIÓN DE PDFs

### 15.1 Migración de DOMPDF → @react-pdf/renderer

**Template equivalente server-side:**

```typescript
// lib/pdf/property-sheet.tsx (React PDF component)
const PropertySheet = ({ data }: { data: PropertyPDFData }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      {/* Header: Dark navy #1A2F3F + teal accent #5CE0D2 */}
      <View style={styles.header}>
        <Text style={styles.sub}>PROPYTE — {data.location}</Text>
        <Text style={styles.h1}>{data.title}</Text>
        <View style={styles.badge}><Text>{data.stage}</Text></View>
      </View>

      {/* Price */}
      <Text style={styles.price}>${formatPrice(data.priceMxn)} MXN</Text>
      {data.priceUsd && <Text style={styles.priceUsd}>USD ${formatPrice(data.priceUsd)}</Text>}

      {/* Image Grid 2×2 (max 4) */}
      <View style={styles.imageGrid}>
        {data.images.slice(0, 4).map((url, i) => (
          <Image key={i} src={url} style={styles.gridImage} />
        ))}
      </View>

      {/* Ficha Técnica */}
      <View style={styles.section}>
        <Text style={styles.h2}>Ficha Técnica</Text>
        <SpecsTable data={data.specs} />
      </View>

      {/* Descripción (max 800 chars) */}
      <View style={styles.section}>
        <Text style={styles.h2}>Descripción</Text>
        <Text style={styles.desc}>{data.description?.slice(0, 800)}</Text>
      </View>

      {/* ROI Analysis (if data) */}
      {data.roi && (
        <View style={styles.roiBox}>
          <Text style={styles.h2}>Análisis de Rentabilidad</Text>
          <ROITable roi={data.roi} />
        </View>
      )}

      {/* Financing Options */}
      {data.financing && (
        <View style={styles.finBox}>
          <Text style={styles.h2}>Opciones de Financiamiento</Text>
          <FinancingBadges financing={data.financing} />
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Propyte — Tu aliado en bienes raíces</Text>
        <Text>contacto@propyte.com • +52 984 323 5354 • propyte.com</Text>
      </View>
    </Page>
  </Document>
);
```

**Nota:** `@react-pdf/renderer` no soporta CSS `gap`. Usar `marginRight`/`marginBottom` en su lugar.

### 15.2 API Route

```typescript
// app/api/pdf/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const dev = await getDevelopmentById(params.id);
  if (!dev) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const pdfData = mapToPDFData(dev);
  const stream = await renderToStream(<PropertySheet data={pdfData} />);

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${dev.slug}-propyte.pdf"`,
    },
  });
}
```

---

## 16. GENERACIÓN DE BLOG CON IA

### 16.1 Migración del Plugin

**Actual:** `class-propyte-blog-generator.php` → Claude API

**Nuevo:** `hub.propyte.com/lib/blog/ai-generator.ts`

```typescript
// lib/blog/ai-generator.ts
import Anthropic from '@anthropic-ai/sdk';

export async function generateBlogPost(topic: string, context: BlogContext) {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: buildBlogPrompt(topic, context),
    }],
  });

  return {
    title: extractTitle(response),
    content: extractContent(response),
    excerpt: extractExcerpt(response),
    seoTitle: extractSEOTitle(response),
    seoDescription: extractSEODescription(response),
    status: 'draft', // Never auto-publish
  };
}
```

### 16.2 Cron Schedule

- **Frecuencia:** Configurable (daily, weekly, etc.)
- **Trigger:** `POST hub.propyte.com/api/blog/cron` (con CRON_SECRET)
- **Moderación:** Siempre crea como `draft`, requiere aprobación manual

---

## 17. ANALYTICS & TRACKING

### 17.1 Scripts a Migrar

| Tracker | Implementación Next.js |
|---------|----------------------|
| Google Analytics 4 | `@next/third-parties/google` → `GoogleAnalytics` component |
| Meta Pixel (Facebook) | Custom Script component con `next/script` (afterInteractive) |
| Hotjar | Custom Script component con `next/script` (afterInteractive) |

### 17.2 Event Tracking (Calca del main.js)

| Evento | GA4 Event | Meta Pixel Event |
|--------|-----------|-----------------|
| WhatsApp click | `whatsapp_click` | `Contact` |
| Property view | `view_item` | `ViewContent` |
| Search submit | `search` | `Search` |
| Contact form submit | `generate_lead` | `Lead` |
| Property card click | `select_content` | — |
| PDF download | `file_download` | — |
| Save/favorite | `add_to_wishlist` | — |

### 17.3 UTM Capture

```typescript
// hooks/useUTMCapture.ts
export function useUTMCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    utmKeys.forEach(key => {
      const val = params.get(key);
      if (val) sessionStorage.setItem(key, val);
    });
  }, []);
}
```

---

## 18. ANIMACIONES & INTERACCIONES

### 18.1 Framer Motion Setup (Reemplaza GSAP — mismos triggers)

**Librería:** `framer-motion` 12.x (ya incluida en HERO-SITE scaffold)

```typescript
// components/ui/ScrollReveal.tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';

// Respects prefers-reduced-motion automáticamente
// Framer Motion lo detecta nativamente via useReducedMotion()
```

**Equivalencias GSAP → Framer Motion:**
- `power3.out` → `[0.33, 1, 0.68, 1]` (cubic-bezier)
- `power2.out` → `[0.25, 1, 0.5, 1]` (cubic-bezier)
- `ScrollTrigger` → `whileInView` + `viewport={{ once: true, amount: 0.12 }}`
- `stagger` → `transition.staggerChildren`
- `delay -=0.6` → `transition.delayChildren` negativo en parent

### 18.2 Animaciones Definidas (mismos valores que WP gsap-animations.js)

| Target | initial | animate | Duration | Ease | Trigger |
|--------|---------|---------|----------|------|---------|
| Hero H1 | `{opacity:0, y:44}` | `{opacity:1, y:0}` | 0.9s | `[0.33,1,0.68,1]` | On mount |
| Hero P | `{opacity:0, y:24}` | `{opacity:1, y:0}` | 0.7s | `[0.33,1,0.68,1]` | delay 0.3s |
| Hero Tabs | `{opacity:0, y:16}` | `{opacity:1, y:0}` | 0.45s | `[0.33,1,0.68,1]` | staggerChildren: 0.1s |
| Hero Form | `{opacity:0, y:18, scale:0.98}` | `{opacity:1, y:0, scale:1}` | 0.55s | `[0.33,1,0.68,1]` | delay 0.55s |
| Hero Stats | `{opacity:0, y:16}` | `{opacity:1, y:0}` | 0.45s | `[0.33,1,0.68,1]` | staggerChildren: 0.1s |
| Section Headings | `{opacity:0, x:-22}` | `{opacity:1, x:0}` | 0.65s | `[0.25,1,0.5,1]` | `whileInView`, amount: 0.12 |
| Cards | `{opacity:0, y:36}` | `{opacity:1, y:0}` | 0.6s | `[0.25,1,0.5,1]` | `whileInView`, stagger `(i%3)*0.09` |
| Counter Numbers | `{count: 0}` → target | — | 1.4s | `[0.25,1,0.5,1]` | `whileInView`, amount: 0.1 |

### 18.3 Scroll Behaviors

| Behavior | Implementation |
|----------|---------------|
| Scroll reveal | `motion.div` + `whileInView` + `viewport={{ once: true, amount: 0.12 }}` |
| Header transparent → solid | `useScroll()` hook: homepage 55% hero height, dark-hero 80px |
| Header shadow | `useMotionValueEvent(scrollY)`: add `shadow-md` on > 10px |
| WhatsApp float show | `useScroll()` + `useTransform()`: opacity 0→1 after 300px |
| Sticky sidebar | CSS `position: sticky; top: 112px` (no animation needed) |
| Hero grain texture | CSS `:after` pseudo-element with SVG turbulence (0.04 opacity) |

### 18.4 Header Scroll State Machine (calca de gsap-animations.js)

```typescript
// hooks/useHeaderScroll.ts
'use client';
import { useScroll, useMotionValueEvent } from 'framer-motion';

export function useHeaderScroll(variant: 'home' | 'dark' | 'default') {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (variant === 'home') {
      // Homepage: trigger at 55% of hero height
      const heroEl = document.querySelector('[data-hero]');
      const threshold = heroEl ? heroEl.offsetHeight * 0.55 : 400;
      setIsScrolled(latest > threshold);
    } else if (variant === 'dark') {
      // Dark-hero pages (destacados, nosotros, built, mercado): trigger at 80px
      setIsScrolled(latest > 80);
    } else {
      // Default: always solid
      setIsScrolled(latest > 10);
    }
  });

  return isScrolled;
}
```

---

## 19. MAPAS & GEOLOCALIZACIÓN

### 19.1 Google Maps Implementation

**Librería:** `@vis.gl/react-google-maps` (React wrapper oficial)

**Usos:**

| Página | Modo | Features |
|--------|------|----------|
| Archive Desarrollos | JavaScript API | Multi-markers + InfoWindow + fit bounds |
| Archive Unidades | JavaScript API | Multi-markers + InfoWindow |
| Single Desarrollo (Tab 2) | JavaScript API | Center on coords, zoom 14, "Cómo llegar" button |
| **Single Unidad (Tab Ubicación)** | **JavaScript API** | **Center on coords del parent desarrollo (o propias si tiene), zoom 14, "Cómo llegar" button, nearby POI si disponible** |

> **NOTA v2.0:** La v1.0 omitía el mapa en Single Unidad. Las unidades heredan coordenadas del desarrollo padre (`_unidad_desarrollo_id` → `propyte_lat/lng`). Si la unidad tiene coordenadas propias, se usan esas. El mapa se renderiza en un tab "Ubicación" idéntico al de desarrollos.

### 19.2 Marker Styling

- Custom pin: Navy (#1A2F3F) con label de precio
- InfoWindow: nombre, precio, link
- Clustering: si > 20 markers

### 19.3 Fallback

Si no hay API key o error de auth:
- Placeholder gris con icono de mapa
- Texto: "Mapa no disponible"
- Botón: "Ver en Google Maps" (link externo)

---

## 20. CÁLCULOS FINANCIEROS & MARKET INTELLIGENCE

### 20.1 Market Indicator (100-point scoring)

```typescript
// lib/supabase/market-indicator.ts
export function calculateMarketScore(data: MarketScoreInput): MarketScore {
  let score = 0;
  const factors: Factor[] = [];

  // Factor 1: Zone Appreciation (25 pts)
  const zoneScore = data.avgZoneScore; // 0-100
  const zonePts = Math.round((zoneScore / 100) * 25);
  score += zonePts;
  factors.push({ name: 'Plusvalía de zona', points: zonePts, max: 25 });

  // Factor 2: Demand & Occupancy (25 pts)
  const occPts = Math.round((data.airdnaOccupancy / 100) * 25);
  score += occPts;
  factors.push({ name: 'Demanda y ocupación', points: occPts, max: 25 });

  // Factor 3: Price vs Average (25 pts)
  const yieldPct = (data.rentPerM2 * 12) / data.pricePerM2 * 100;
  const pricePts = Math.min(25, Math.round(yieldPct * 3));
  score += pricePts;
  factors.push({ name: 'Precio vs promedio', points: pricePts, max: 25 });

  // Factor 4: ROI + Stage Bonus (25 pts)
  const roiPts = Math.min(20, Math.round(data.roiPct * 2));
  const stageBonus = data.stage === 'preventa' ? 5 : 0;
  score += roiPts + stageBonus;
  factors.push({ name: 'ROI y etapa', points: roiPts + stageBonus, max: 25 });

  const label = score >= 75 ? 'Excelente momento'
              : score >= 50 ? 'Buen momento'
              : 'Momento moderado';

  const color = score >= 75 ? '#22C55E'
              : score >= 50 ? '#F59E0B'
              : '#EF4444';

  return { score, label, color, factors };
}
```

### 20.2 Rental Estimate Cascade

```typescript
// lib/supabase/rental-data.ts
export async function getRentalEstimate(
  city: string, propertyType: string, bedrooms?: number,
  zone?: string, rentalType: string = 'residencial'
): Promise<RentalEstimate | null> {
  // Level 1: zone + type + beds + rental_type
  // Level 2: city + type + beds + rental_type
  // Level 3: city + type + rental_type
  // Level 4: city + rental_type
  // Return first match
}
```

### 20.3 Similar Listings Algorithm

```typescript
// lib/helpers/similar-listings.ts
export async function getSimilarListings(
  postId: string, type: 'desarrollo' | 'unidad', count: number = 5
): Promise<string[]> {
  // Progressive fallback (4 levels for unidad, 3 for desarrollo):
  // L1: Same city + same type/stage + price ±30%
  // L2: Same city + same type/stage
  // L3: Same city only
  // L4: Same type/stage anywhere
}
```

---

## 21. AUTENTICACIÓN & RBAC

### 21.1 Hub Authentication

**Provider:** Auth.js (NextAuth v5) con Credentials

**Roles:**
| Rol | Acceso Hub |
|-----|-----------|
| ADMIN | Full access |
| DIRECTOR | Full access |
| GERENTE | Approvals + Sync + Blog |
| MARKETING | Blog + Team (read-only) |

**Session:** JWT, 8h maxAge

### 21.2 Frontend (propyte.com)

**No auth requerido.** Todas las páginas son públicas.

Los API routes de leads usan rate limiting (por IP) en lugar de auth.

---

## 22. VARIABLES DE ENTORNO

### propyte.com (.env)

```bash
# Supabase (read-only)
NEXT_PUBLIC_SUPABASE_URL=https://oaijxdpevakashxshhvm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # Server-side only

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Revalidation
REVALIDATION_SECRET=...                 # Shared with hub

# Analytics
NEXT_PUBLIC_GA4_ID=G-XXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=XXXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=XXXXXXX

# WhatsApp
NEXT_PUBLIC_WHATSAPP_PHONE=5219843235354

# Hub connection
HUB_API_URL=https://hub.propyte.com
HUB_API_KEY=...

# Email (Nodemailer)
SMTP_HOST=mail.propyte.com
SMTP_PORT=465
SMTP_USER=contacto@propyte.com
SMTP_PASS=...
```

### hub.propyte.com (.env)

```bash
# Supabase (read-write)
NEXT_PUBLIC_SUPABASE_URL=https://oaijxdpevakashxshhvm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Auth
NEXTAUTH_URL=https://hub.propyte.com
NEXTAUTH_SECRET=...

# AI Blog
ANTHROPIC_API_KEY=sk-ant-...

# CRM webhook
CRM_WEBHOOK_URL=https://crm.propyte.com/api/leads
CRM_API_KEY=...

# propyte.com revalidation
PROPYTE_WEB_URL=https://propyte.com
REVALIDATION_SECRET=...

# Cron security
CRON_SECRET=...

# Image processing
STORAGE_BUCKET=property-images

# Email (Nodemailer)
SMTP_HOST=mail.propyte.com
SMTP_PORT=465
SMTP_USER=notificaciones@propyte.com
SMTP_PASS=...
```

---

## 23. INFRAESTRUCTURA & DEPLOY

### 23.1 Hosting

| App | Entorno | Host | Justificación |
|-----|---------|------|---------------|
| propyte.com | **Producción** | **Hostinger VPS** | Control total, sin vendor lock-in, output `standalone` de Next.js |
| propyte.com | **Staging** | **Vercel** | Preview deployments, ISR nativo, fácil QA |
| hub.propyte.com | **Producción** | **Hostinger VPS** | Mismo servidor, reducir costos |
| hub.propyte.com | **Staging** | **Vercel** | Preview deployments |
| crm.propyte.com | Ambos | Se mantiene | Sin cambios |
| Supabase | — | Supabase Cloud | Ya existente, sin migrar |

**Next.js Standalone Build (Hostinger):**
```javascript
// next.config.ts (root del repo Next_Propyte_web)
export default {
  output: 'standalone',   // OBLIGATORIO para Hostinger
  // NO usar experimental Turbopack en build (solo dev)
};
```

**Hostinger Deploy Requirements:**
- Node.js 22 LTS via nvm
- PM2 para process management (`pm2 start ecosystem.config.js`)
- Nginx reverse proxy (port 3000 → 443)
- `next build` genera `.next/standalone/` con server.js
- Copiar `.next/static/` y `public/` al standalone
- SSL via Let's Encrypt (auto-renew)
- CDN: Hostinger CDN activado (purgar después de deploy)

**IMPORTANTE:** `next/image` optimization requiere Sharp instalado en el server. Sin Vercel Image Optimization API, las imágenes se optimizan localmente con Sharp o se sirven desde Supabase Storage CDN.

### 23.2 DNS

```
propyte.com            → Hostinger VPS IP (A record) [PRODUCCIÓN]
staging.propyte.com    → Vercel (CNAME) [STAGING]
hub.propyte.com        → Hostinger VPS IP (A record) [PRODUCCIÓN]
hub-staging.propyte.com → Vercel (CNAME) [STAGING]
crm.propyte.com        → Se mantiene como está
```

### 23.3 CI/CD

```yaml
# .github/workflows/deploy.yml (repo: Next_Propyte_web)
name: Deploy propyte.com
on:
  push:
    branches:
      - main      # → Producción (Hostinger via SCP)
      - develop   # → Staging (Vercel auto-deploy)

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm run build
      # Tailwind build integrado en next build

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: build
    # Vercel auto-deploys from branch (configured in Vercel dashboard)

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: build
    steps:
      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.HOSTINGER_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
      - name: Build standalone
        run: |
          npm run build
          cp -r public .next/standalone/public
          cp -r .next/static .next/standalone/.next/static
      - name: Deploy via SCP
        run: |
          scp -i ~/.ssh/deploy_key -r .next/standalone/* \
            ${{ secrets.HOSTINGER_USER }}@${{ secrets.HOSTINGER_HOST }}:${{ secrets.DEPLOY_PATH }}/
      - name: Restart PM2
        run: |
          ssh -i ~/.ssh/deploy_key ${{ secrets.HOSTINGER_USER }}@${{ secrets.HOSTINGER_HOST }} \
            "cd ${{ secrets.DEPLOY_PATH }} && pm2 restart propyte-web"
      - name: Purge CDN
        run: |
          # Hostinger CDN purge API call
      - name: Smoke test
        run: |
          npx playwright test --grep @smoke
      - name: Cleanup SSH
        if: always()
        run: rm -f ~/.ssh/deploy_key
```

```yaml
# (repo: Propyte_hub — .github/workflows/deploy.yml — misma estructura, diferente DEPLOY_PATH)
# (repo: Propyte_hub — .github/workflows/sync-cron.yml)
name: Sync Cron
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
```

**NOTA:** Se usa SCP directo en vez de rsync porque Hostinger tiene problemas con SSH commands + banner (ver feedback_hostgator_deploy.md). El patrón está probado.

### 23.4 Nuevo Sistema de Slugs Programáticos

**CAMBIO v2.0:** Los slugs dejan de ser planos y pasan a ser jerárquicos con ciudad y tipo.

**Formato nuevo:**
```
Desarrollos: /desarrollos/{ciudad}/{tipo}/{titulo}
Unidades:    /propiedades/{ciudad}/{tipo}/{titulo}

Ejemplos:
  /desarrollos/tulum/departamento/nativa-tulum
  /desarrollos/playa-del-carmen/penthouse/the-fives
  /propiedades/cancun/casa/villa-marina-3rec
```

**Generación del slug:**
```typescript
// lib/helpers/slug-generator.ts
export function generateDevelopmentSlug(dev: { city: string; type: string; title: string }): string {
  const city = slugify(dev.city);        // 'Playa del Carmen' → 'playa-del-carmen'
  const type = slugify(dev.type);        // 'departamento' → 'departamento'
  const title = slugify(dev.title);      // 'Nativa Tulum' → 'nativa-tulum'
  return `${city}/${type}/${title}`;
}

export function generateUnitSlug(unit: {
  city: string; type: string; title: string;
  price?: number;
}): string {
  const city = slugify(unit.city);
  const type = slugify(unit.type);
  let title = slugify(unit.title);
  if (unit.price) title += `-${Math.round(unit.price / 1000)}k-mxn`;
  return `${city}/${type}/${title}`;
}
```

**Next.js Route Structure:**
```
src/app/[locale]/(main)/
  desarrollos/
    page.tsx                              # Archive (listing)
    [city]/
      page.tsx                            # Filter by city
      [type]/
        page.tsx                          # Filter by city+type
        [slug]/
          page.tsx                        # Development detail
  propiedades/
    page.tsx                              # Archive (listing)
    [city]/
      page.tsx                            # Filter by city
      [type]/
        page.tsx                          # Filter by city+type
        [slug]/
          page.tsx                        # Unit detail
```

### 23.5 Redirects (SEO Migration)

```typescript
// next.config.ts (Next_Propyte_web root)
export default {
  async redirects() {
    return [
      // WordPress flat slugs → new hierarchical slugs
      // Generated dynamically from Supabase slug history
      // Example: /desarrollos/nativa-tulum → /desarrollos/tulum/departamento/nativa-tulum
      { source: '/unidades/:slug*', destination: '/propiedades/:slug*', permanent: true },
      { source: '/desarrollador/:slug*', destination: '/desarrolladores/:slug*', permanent: true },
    ];
  },
  async rewrites() {
    return [
      // Backward compatibility: flat slug still works via rewrite
      // Supabase lookup by old slug → redirect to new canonical
    ];
  },
};
```

**301 Redirect Strategy:**
1. Al migrar, generar tabla de mapeo: `old_slug → new_hierarchical_slug` para TODOS los desarrollos/unidades
2. Almacenar en Supabase tabla `slug_redirects` (old_path, new_path, created_at)
3. Next.js middleware intercepta requests con slug plano → lookup en tabla → 301 redirect
4. Monitorear Google Search Console por 404s durante 90 días post-migración
5. Mantener historial de `_unidad_slugs_anteriores` para redirects de unidades renombradas

---

## 24. PLAN DE MIGRACIÓN POR FASES

> **CAMBIO v3.0:** Se usa HERO-SITE-ZILLOW como scaffold (ahorra ~6 semanas). Repos separados. Hub se desarrolla después del frontend MVP. Framer Motion en lugar de GSAP. Google Maps. Recharts.

### Fase 0: Scaffold + Setup (3-5 días)

- [ ] Crear repo `Next_Propyte_web` en GitHub (Propyte-Team)
- [ ] Fork limpio de HERO-SITE-ZILLOW (copiar src/, configuración base)
- [ ] **Limpiar HERO-SITE:** eliminar AI Search, admin panel, mock data, Mapbox
- [ ] Reemplazar paleta de colores → WP canónico (`#5CE0D2`, `#1A2F3F`, `#0F1923`)
- [ ] Actualizar `tailwind.config.ts` con tokens de `input.css` de WP
- [ ] Verificar Supabase client apunta a instancia correcta (`oaijxdpevakashxshhvm`)
- [ ] Revisar/adaptar migraciones SQL de HERO-SITE vs schema actual de Supabase
- [ ] Configurar next-intl (ya existe en HERO, fusionar strings: HERO 49KB + WP 1,231)
- [ ] Setup CI/CD: Vercel staging (develop branch), Hostinger prod (main branch)
- [ ] Configurar slug_redirects table en Supabase
- [ ] Instalar Google Maps (`@vis.gl/react-google-maps`) en lugar de Mapbox
- [ ] Verificar Framer Motion ya instalado (viene de HERO-SITE)
- [ ] CLAUDE.md del nuevo repo

### Fase 1: Design System & Layout (1 semana)

> HERO-SITE ya tiene Header/Footer/Logo — pero el diseño WP es diferente. Se reescribe layout completo.

- [x] Sidebar desktop (72px, bg `#0F1923`, 5 items + "Más" popup — calca WP header.php)
- [x] Mobile header (gradient `rgba(255,255,255,0.97)`, burger + search bubble 42px)
- [x] Search bubble (frosted glass: `backdrop-filter: blur(16px)`, dark variant para hero)
- [x] Search type toggle (Desarrollos ↔ Propiedades — synced desktop + mobile)
- [x] Footer (6 cols, CTA strip navy, WhatsApp float 60×60 after 300px scroll)
- [x] Framer Motion scroll reveal setup (`whileInView`, viewport threshold 0.12)
- [x] Header scroll state machine (home/dark/default variants — ver Sección 18.4)
- [x] Icon system (Lucide icons, imports on demand per componente)
- [x] Hero grain texture (SVG noise `:after`, opacity 0.04)
- [ ] Typography + color verification pixel-perfect vs WP prod (QA visual pendiente)

### Fase 2: Homepage (1 semana)

> Reutilizar componentes de HERO-SITE (Hero, FeaturedProperties, etc.) pero restylear al diseño WP.

- [x] Hero con video/image BG + 3-tier fallback (video → poster → gradient) — env vars NEXT_PUBLIC_HERO_VIDEO_URL + NEXT_PUBLIC_HERO_IMAGE_URL
- [x] Hero search tabs (Desarrollos/Propiedades) + stats pills con counter animation (StatCounter con IntersectionObserver + easing)
- [x] Hero quick links (4 filtros hardcoded: PDC, Tulum, Beachfront, < $3M)
- [x] Explore Categories (5 cards — incluye Preventa — con badge counts desde Supabase)
- [x] Featured Properties (6 cards, fetch via getFeaturedDevelopments() desde Supabase)
- [x] Trending Market (4 KPIs + top zones ranking — usa AirDNA data)
- [ ] App Download Banner (iOS/Android links + features) — existe, verificar copy vs WP
- [x] Why Propyte (3 audience cards + 6 features, copy calca WP)
- [ ] Testimonials / "Propyte en Números" (carousel + live counts) — existe, pendiente de refinar
- [x] Join Team Banner (creado + integrado en home)
- [ ] Framer Motion animation timing verification vs WP gsap-animations.js — ScrollReveal util disponible, pendiente de aplicar section por section

### Fase 3: Property Cards & Archives (2 semanas)

> PropertyCard de HERO-SITE se reutiliza, se le agrega carousel/badges del WP.

- [x] PropertyCard — `MarketplaceCard.tsx` con carousel (touch/swipe), stage badge, photo count dots, save heart, price, specs, ROI/Cap badges
- [x] FilterBar — 5 pill dropdowns (Location, Price, Type, ROI) + "Más filtros" button → AdvancedFilters modal
- [x] MobileFilters — `AdvancedFilters.tsx` modal fullscreen chip-based
- [x] MapView — Google Maps JS API (`@vis.gl/react-google-maps`), navy pins con precio corto (`$1.5M MXN`), InfoWindow al click con nombre+zone+price
- [x] ListView — grid 1→2 cols responsive en `PropertyList.tsx`
- [x] SortDropdown — 5 opciones (relevance, price asc/desc, ROI, date) en PropertyList header
- [x] Archive Desarrollos — MarketplaceContent con split 60/40 desktop + toggle mobile map↔list
- [ ] Archive Unidades separado — BLOQUEADO (v_units vacía en Supabase; /propiedades y /desarrollos usan la misma v_developments por ahora)
- [ ] Archive Desarrolladores restyle — existe `/desarrolladores/DevelopersPageContent.tsx` pero con diseño WP-style, no con FilterBar
- [ ] Taxonomy pages (ciudad, tipo, zona, etapa) — pendiente, requiere rutas `/desarrollos/[slug-taxonomy]`
- [x] Empty states — `PropertyList.tsx` renderiza `noResults + noResultsSuggestion` cuando filtered=[]
- [x] Slug redirects middleware (old flat → new hierarchical) — hecho en Fase 0
- [x] Active filter chips (removable) — `MarketplaceContent.tsx` líneas 27-32 con `FilterChip` + botón "clear all"

**Pendientes bloqueadas por data:**
- Archive Unidades: `v_units` vacía (0 filas en Supabase). Requiere sync desde WP.
- Map pins: `lat`/`lng` null en los 42 desarrollos aprobados. Requiere llenar coords en Supabase.

### Fase 4: Detail Pages (2 semanas)

- [ ] Image Gallery (hero 16:9 + thumbnails horizontal scroll, click to expand)
- [ ] Tab system (3 tabs: Descripción, Análisis Geográfico, Rentabilidad)
- [ ] Contact Sidebar (sticky top-28, form React Hook Form + Zod)
- [ ] Mobile floating bar (fixed bottom: price + WA + contact buttons)
- [x] Share/Download modal (PDF + email + WhatsApp + social — ver Sección 27) ✅ commits 352d35a+6df8f40 (2026-04-22)
- [x] **Single Desarrollo Tab Descripción — parcial** (description expandable ✅, unit chips ✅, 4 metric cards ✅, metrics row ✅ — commits 352d35a+6df8f40 | pendiente: tour 360°, video, developer card destacado, brochure)
- [ ] **Single Desarrollo Tab Análisis Geográfico** (Google Maps embed + zone scores grid + AirDNA metrics)
- [ ] **Single Desarrollo Tab Rentabilidad** (ROI analysis + sentiment + investment metrics 3-col + comparison vs CETES/bank)
- [ ] **Single Unidad** (specs, availability badge, parent dev link, inherited location map)
- [ ] **Single Unidad — Dual Investment Calculator** (4 tabs: residencial, vacacional, financiamiento, proyección ROI — ver Sección 28)
- [ ] Financing Simulator (3 sliders + button group + cálculos — calca investment-calculator.js)
- [ ] Investment Analysis panel (Residencial: 95% occ, 20% exp | Vacacional: AirDNA occ, 53% exp)
- [ ] IRR Solver (Newton-Raphson — port exacto de `propyteIRR()`)
- [ ] Market Indicator badge (4-factor 100-point scoring)
- [ ] Similar Listings (4-level fallback algorithm)
- [ ] Unit chips + Amenity list (20 amenidades)
- [ ] Unit FAQs (property-specific Q&A)

### Fase 5: Content Pages (1 semana)

- [ ] Contacto (form + info + map embed)
- [ ] Nosotros — 3 sub-páginas:
  - [ ] `/nosotros/quienes-somos` (company story, misión, valores)
  - [ ] `/nosotros/estructura` (organigrama, estructura comercial)
  - [ ] `/nosotros/equipo` (team bios, fotos, agent profiles)
- [ ] Como Comprar (step-by-step accordion)
- [ ] Como Invertir (opportunity types, ROI scenarios)
- [ ] Financiamiento (calculator, bank partners, terms)
- [ ] Destacados (dark hero + featured grid)
- [ ] FAQ (accordion)
- [ ] Glosario (terms + definitions)
- [ ] Zonas (explorer + Supabase zone_scores data, sortable, filterable)
- [ ] Promociones (offers grid)
- [ ] Brokers (agent cards, contact links)
- [ ] Proveedores (form: empresa, tipo, ciudad, sitio_web)
- [ ] Reclutamiento (job listings) — **EXCEPCIÓN DE DISEÑO:** Esta es la única página que conserva el diseño de HERO-SITE-ZILLOW en lugar del canónico WP. Decisión (2026-04-18, Luis): La versión de HERO-SITE es superior (hero con fondo dark, grid de beneficios, CTA de aplicación). Todas las demás páginas siguen WP canónico.
- [ ] Privacidad / Términos

### Fase 6: Built Portfolio — ~~(1 semana)~~ **SKIPPED — decisión Luis 2026-04-20**

> **Estado:** Fase retirada del alcance de la migración actual. No se implementa el módulo Built Portfolio (Diseña/Construye/Habita, services grid, portfolio showcase, process timeline, consultation form). El sitio público Propyte no requiere esta sección en el scope de lanzamiento. Si se reincorpora más adelante, volver a abrir esta fase con su backlog original preservado en git history.

~~- [ ] Built Hero (3 animated words: Diseña. Construye. Habita.)~~
~~- [ ] Philosophy blockquote~~
~~- [ ] Services grid (3×2)~~
~~- [ ] Portfolio showcase (filter tabs + 3-col grid + hover overlay)~~
~~- [ ] Process timeline (5 steps, horizontal desktop / vertical mobile)~~
~~- [ ] Team expertise (3 cards)~~
~~- [ ] Consultation form (Built-specific fields)~~
~~- [ ] Final CTA dark~~

### Fase 7: Blog Completo (1 semana) ✅ CERRADA — commits 0826902+665aeb9+0612af5+d35d95c+67978c4 (2026-04-22)

- [x] Blog listing page — rediseñado per WP reference: dark hero #0F1923 + split 2 columnas (Para Asesores / Para Inversionistas) + featured BlogCard + compact list por columna; con ?categoria=X muestra grid paginado bg-white
- [x] Blog post detail (article schema, reading time calc, author byline, social share, related posts)
- [x] BlogCard component (thumbnail, title, excerpt, date, category badge)
- [x] BlogHero component (badge, H1 bicolor, descripción, 2 CTAs con active state diferenciado)
- [x] RelatedPosts component (same category, max 3)

> Extras entregados: BlogPagination, BlogShareBar (WhatsApp+copy), OG image co-located blog/[slug], RecentBlog en homepage, migración SQL public.blog_posts + RLS, 9 queries, i18n 22 keys ES+EN (14 original + 8 hero/cols), blog en sitemap, format-date helper. Auditoría Playwright: 20/21 checks OK (1 falso positivo regex). **Nit cerrado (commit 429847e, 2026-04-22):** BlogShareBar aria-label internacionalizado vía prop whatsappLabel + key blog.shareWhatsapp en es/en.json.

### Fase 8: SEO & Performance (1 semana)

- [ ] Schema.org @graph (WebSite, RealEstateAgent, RealEstateListing, ItemList, BreadcrumbList, ImageGallery)
- [ ] Dynamic sitemap (all routes × 2 locales + development slugs + unit slugs)
- [ ] robots.txt (disallow 7 filter params, disallow /api/)
- [ ] Meta tags (OG, Twitter, product pricing for listings)
- [ ] hreflang tags (es-MX, en-US, x-default)
- [ ] Geo meta tags (20.63, -87.08 — Riviera Maya)
- [ ] PDF generation route (@react-pdf/renderer — ver Sección 15)
- [ ] Image optimization (Sharp en Hostinger + Supabase Storage CDN)
- [ ] Core Web Vitals audit (target Lighthouse 90+)
- [ ] 301 redirects (slug_redirects table + middleware)
- [ ] canonical URLs

### Fase 9: Analytics, Forms & i18n (1 semana)

- [ ] GA4 integration (`@next/third-parties/google`)
- [ ] Meta Pixel integration (`next/script` afterInteractive)
- [ ] Hotjar integration (`next/script` afterInteractive)
- [ ] 7 event types tracked (whatsapp_click, view_item, search, generate_lead, select_content, file_download, add_to_wishlist)
- [ ] UTM capture hook (sessionStorage, auto-fill hidden form fields)
- [ ] All 4 form types (lead, contact, supplier, built) → hub API → CRM webhook
- [ ] Rate limiting on form endpoints (by IP)
- [ ] Currency toggle (CurrencyContext, localStorage, data-usd-rate attribute)
- [ ] i18n verification (1,231 strings ES/EN)

### Fase 10: Testing & QA (2 semanas)

- [ ] Migrar Playwright test suite (ver Sección 31)
- [ ] Visual regression testing (screenshots comparativos WP vs Next.js)
- [ ] Mobile responsive testing (sm 640, md 768, lg 1024)
- [ ] i18n verification (ES/EN switch en todas las páginas)
- [ ] Form submission testing (4 forms × success + error)
- [ ] PDF generation testing
- [ ] Investment calculator verification (formulas vs WP originals — IRR, ROI, Cap Rate)
- [ ] Rental analysis verification (histogram, breakdowns, rankings)
- [ ] SEO audit (schema, meta, sitemap, redirects)
- [ ] Performance audit (Lighthouse 90+ on Hostinger standalone)
- [ ] Accessibility audit (WCAG AA, contrast ratios)
- [ ] Slug redirect testing (ALL old WP URLs → 301 → new URLs)

### Fase 11: Migration & Cutover (1 semana)

- [ ] DNS TTL bajar a 300s (5 min) 48h antes
- [ ] Deploy propyte.com (Next.js) a Hostinger producción
- [ ] Deploy staging a Vercel
- [ ] DNS switch (propyte.com A record → Hostinger VPS IP)
- [ ] 301 redirects active (verificar con curl)
- [ ] Monitor 48h (Search Console, GA4, error logs)
- [ ] **Periodo de convivencia 30 días (WP accesible en dev.propyte.com como fallback)**
- [ ] Decommission WordPress (mantener backup completo en archive)

### Fase Hub (paralela o posterior): `Propyte_hub` repo

> Se puede iniciar en paralelo desde Fase 4 en adelante, o después del cutover de web.

- [x] Fase H1: Auth + Dashboard + Approvals (2 semanas) — ✅ NextAuth v5, RBAC, 3 tabs, completeness, image upload
- [x] Fase H2: Sync Engine (2 semanas) — ✅ ingest connectors, cron Hostinger, ISR trigger; falta conflict detection completa
- [~] Fase H3: Blog AI + Change Log + Team + Agents + Settings (1 semana) — Blog AI, change log, team, settings ✅. Falta: blog scheduling cron, agent profiles 11 fields, Built Settings admin
- [ ] Fase H4: Testing + Cutover del hub (1 semana) — pendiente
- [+] Fase H5 (no estaba en plan original): Reports Module — calculadores ✅, UI ✅, CSV+XLSX+PDF ✅, Email distribution ✅. Falta: WhatsApp, Drive backup, alertas agregadas

**Total estimado Next_Propyte_web: ~14 semanas (~3.5 meses)** — ahorro de ~6 semanas vs plan original gracias al scaffold de HERO-SITE  
**Total estimado Propyte_hub: ~6 semanas adicionales** (puede correr en paralelo)  
**Total global: ~14-20 semanas** dependiendo de paralelismo

---

## 25. RIESGOS & MITIGACIÓN + ROLLBACK PLAN

### 25.1 Tabla de Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Pérdida de SEO rankings | Alto | 301 redirects completos (slug_redirects table), schema.org idéntico, sitemap con nuevas rutas, monitorear Search Console 90 días |
| Sync data loss | Alto | Mantener WP como fallback 30 días en dev.propyte.com, verificar sync counts, change log audit |
| Design inconsistency | Medio | Visual regression tests, screenshots comparativos con WP actual (Playwright) |
| ISR no disponible en Hostinger | **Alto** | **Sin Vercel ISR nativo: usar `revalidatePath()` con cache handler custom o `stale-while-revalidate` headers + Nginx microcache** |
| Framer Motion vs WP animations | Bajo | Mismos timings/easing; test visual comparativo contra WP gsap-animations.js |
| i18n strings missing | Bajo | Importar 1,231 strings del .po, automated check |
| Google Maps quota | Bajo | Rate limiting, caching tiles, fallback placeholder |
| PDF rendering differences | **Medio** | **@react-pdf/renderer y DOMPDF son engines MUY diferentes. Plan: Generar PDF con ambos engines, comparar visualmente. Si gap grande → usar Puppeteer/Playwright PDF en server como alternativa** |
| CRM webhook disruption | Medio | Dual-write durante transición (hub + WP ambos envían a CRM), retry mechanism |
| Supabase rate limits | Bajo | Caching, batched queries, connection pooling |
| Downtime durante DNS switch | **Medio** | **Blue/green: WP en dev.propyte.com sigue vivo. Bajar TTL a 300s 48h antes. DNS switch es atómico. Si falla → revertir A record a Hostinger WP IP** |
| WP database como backup | Medio | **Exportar full WP DB dump + wp-content/ tar antes de cutover. Guardar 90 días en Supabase Storage bucket `backups/`** |
| Dependencia de Vercel (staging) | Bajo | Solo staging usa Vercel. Producción en Hostinger = control total. Si Vercel falla, staging se cae pero producción no |
| Image optimization delta | Medio | **WP usa WP media library + Hostinger CDN. Next.js sin Vercel Image Opt → usar Sharp middleware custom o servir desde Supabase Storage CDN directamente. Benchmark tiempos de carga pre/post** |
| next/image en standalone | Medio | **`next/image` requiere Sharp como dependency. Instalar Sharp en Hostinger VPS. Fallback: `<img>` con Supabase Storage transforms** |

### 25.2 ROLLBACK PLAN — Qué pasa si Next.js falla en producción

```
ESCENARIO: Next.js en Hostinger tiene problemas críticos post-cutover
TIEMPO DE RESPUESTA: < 15 minutos para rollback

PASO 1 — Detección (automática o manual)
  • PM2 health checks detectan crash loops
  • Uptime monitor (UptimeRobot/Better Uptime) alerta en Slack
  • Google Search Console reporta spike de 5xx

PASO 2 — Evaluación rápida (5 min)
  • ¿Es un bug fixeable en < 2 horas? → Fix + deploy
  • ¿Es un problema de infraestructura? → Rollback

PASO 3 — Rollback a WordPress (10 min)
  ┌────────────────────────────────────────────────────────┐
  │ 1. DNS: Cambiar A record de propyte.com               │
  │    → De: IP del VPS Next.js                            │
  │    → A:  IP del VPS WordPress (dev.propyte.com)        │
  │    TTL ya está en 300s = propagación en 5 min          │
  │                                                        │
  │ 2. WordPress ya está corriendo en dev.propyte.com      │
  │    Solo necesita que el DNS apunte a él                 │
  │                                                        │
  │ 3. hub.propyte.com sigue funcionando                   │
  │    (approval system independiente del frontend)         │
  │                                                        │
  │ 4. Supabase sin cambios (source of truth intacta)      │
  │                                                        │
  │ 5. Notificar equipo en Slack:                          │
  │    "Rollback temporal a WP. Next.js en debug."         │
  └────────────────────────────────────────────────────────┘

PASO 4 — Debug y fix (horas/días)
  • Diagnosticar en staging (Vercel)
  • Fix + test + re-deploy a Hostinger
  • Re-switch DNS cuando esté listo

PASO 5 — Post-mortem
  • Documentar qué falló y por qué
  • Agregar test que cubra el escenario
```

**Periodo de convivencia (30 días post-cutover):**
- WordPress SIGUE corriendo en `dev.propyte.com` con sync activo
- Si algo falla en Next.js → rollback DNS en 5 min
- Después de 30 días sin incidentes → apagar WordPress definitivamente
- Backup final: full DB dump + wp-content/ tar → Supabase Storage

**Datos seguros en TODO momento:**
- Supabase es la source of truth — no se modifica por el deploy
- Leads siguen llegando (hub.propyte.com los recibe independientemente)
- CRM webhook sigue activo (hub forwarding funciona)

---

## 26. CHECKLIST DE PARIDAD DE FEATURES

### Frontend (propyte.com) — 0/104

**Layout & Navigation:**
- [ ] Sidebar desktop (72px, 5 items + "Más" dropdown)
- [ ] Mobile header (gradient, burger)
- [ ] Search bubble (frosted glass, 2 modes)
- [ ] Dark hero variant (transparent header)
- [ ] Footer (6-col, CTA strip)
- [ ] WhatsApp floating button (show after 300px)
- [ ] Sticky header shadow on scroll
- [ ] Breadcrumbs

**Homepage (11 sections):**
- [ ] Hero video/image BG
- [ ] Hero search tabs (Desarrollos/Propiedades)
- [ ] Hero stats pills (live counts)
- [ ] Hero quick links
- [ ] Explore Categories (5 cols, counts, hover scale)
- [ ] Featured Properties (6 cards, featured flag)
- [ ] Trending Market (4 KPIs + top zones)
- [ ] App Download Banner
- [ ] Why Propyte (3 audience + 6 features)
- [ ] Propyte en Números (4 stats + portfolio value)
- [ ] Join Team Banner

**Archives:**
- [ ] Development archive (map + list 60/40)
- [ ] Unit archive (list + filters)
- [ ] Developer archive
- [ ] Taxonomy pages (city, type, zone, stage)
- [ ] Filter bar (5 dropdowns)
- [ ] "Más filtros" modal (stage + uso)
- [ ] Mobile fullscreen filters
- [ ] Map with markers + info windows
- [ ] Sort dropdown (3 options)
- [ ] Active filter chips (removable)
- [ ] Result count display
- [ ] Empty state
- [ ] Mobile map/list toggle

**Property Cards:**
- [ ] Image carousel (arrows, dots, touch)
- [ ] Stage badge (color-coded)
- [ ] Photo count badge
- [ ] Save/heart toggle (localStorage)
- [ ] Price display (with strikethrough + discount)
- [ ] Specs inline (beds, baths, area with icons)
- [ ] Title (1 line truncate)
- [ ] Location
- [ ] Financial badges (ROI, cap rate, revenue)
- [ ] Developer + delivery date
- [ ] Promo banner (optional)
- [ ] Sold/reserved opacity state

**Detail Pages — Desarrollos:**
- [ ] Image gallery (hero + thumbnails scroll)
- [ ] Tab system (3 tabs)
- [x] Description (expandable, max 120px) ✅ commit 352d35a
- [x] Unit type chips ✅ pre-existente
- [x] 4 metric cards ✅ commit 352d35a (Tipo/Etapa/Zona/Estado)
- [x] Metrics row (5 values) ✅ commit 352d35a
- [ ] Tour 360° toggle (iframe)
- [ ] Video toggle (embed)
- [ ] Additional videos grid
- [ ] Amenities list (chips)
- [ ] Developer card (if destacado)
- [ ] Brochure download link
- [ ] Map JS API (with "Cómo llegar" button)
- [ ] Zone scores grid
- [ ] AirDNA metrics display
- [ ] ROI analysis text + sentiment
- [ ] Investment metrics (3 cols)
- [ ] Comparison grid (vs CETES, vs bank)
- [ ] Financing simulator (10 funciones financieras exactas — Sección 28)
- [ ] Similar listings (4-level fallback)
- [ ] Contact sidebar (sticky)
- [ ] Mobile floating bar (price + 2 buttons)
- [x] Share/Download modal (3 formatos: Stories/Square/Letter — Sección 27) ✅ commits 352d35a+6df8f40
- [ ] Price history (if available)

**Detail Pages — Unidades:**
- [ ] Unit availability badge (disponible/reservado/vendido)
- [ ] Unit parent development link + card
- [ ] **Unit map tab (hereda coords del parent o propias)**
- [ ] Unit specs (recámaras, baños, estacionamientos, superficie, piso, orientación)
- [ ] Unit price display (MXN + USD + discount strikethrough)
- [ ] Unit financing simulator (same calculator, unit-specific data)
- [ ] Slug redirect middleware (slugs_anteriores → 301)

**Content Pages (17):**
- [ ] Contacto, Nosotros, Como Comprar, Como Invertir
- [ ] Financiamiento, Destacados, FAQ, Glosario
- [ ] Zonas, Promociones, Brokers, Proveedores
- [ ] Reclutamiento, Privacidad, Términos
- [ ] Blog listing, Blog post detail

**Built Portfolio (8 sections):**
- [ ] Hero (3 animated words)
- [ ] Philosophy blockquote
- [ ] Services grid (3×2)
- [ ] Portfolio showcase (filter tabs + grid + overlay)
- [ ] Process timeline (5 steps)
- [ ] Team expertise (3 cards)
- [ ] Consultation form
- [ ] Final CTA

**SEO:**
- [ ] Schema.org WebSite with SearchAction
- [ ] Schema.org RealEstateAgent (Organization)
- [ ] Schema.org RealEstateListing (singles)
- [ ] Schema.org ItemList (archives)
- [ ] Schema.org BreadcrumbList
- [ ] Schema.org ImageGallery
- [ ] Dynamic sitemap (all routes)
- [ ] robots.txt
- [ ] Meta tags (title, description, OG, Twitter)
- [ ] Canonical URLs
- [ ] hreflang (es/en)
- [ ] 301 redirects (WP → Next.js)

**i18n:**
- [ ] 1,231 translation strings imported
- [ ] ES/EN language toggle
- [ ] URL routing (/en/ prefix)
- [ ] Currency toggle (MXN/USD + localStorage)

**Forms & Leads:**
- [ ] Lead form (property sidebar)
- [ ] Contact form (contacto page)
- [ ] Supplier form (proveedores page)
- [ ] Built consultation form
- [ ] UTM capture (sessionStorage)
- [ ] Webhook to hub → CRM
- [ ] Success/error messages

**Analytics:**
- [ ] GA4 tracking
- [ ] Meta Pixel tracking
- [ ] Hotjar tracking
- [ ] 7 event types tracked

**Animations:**
- [ ] Hero entrance sequence (6 elements, staggered)
- [ ] Section heading reveal (scroll trigger)
- [ ] Card reveal (scroll trigger, row stagger)
- [ ] Counter animation (number rollup)
- [ ] Header transparent → solid transition
- [ ] IntersectionObserver reveal (.propyte-reveal)
- [ ] prefers-reduced-motion respect

**Misc:**
- [ ] PDF generation (property sheets)
- [ ] Video embeds (YouTube, Vimeo, Drive, MP4)
- [ ] Google Maps (markers, embed, clustering)
- [ ] Save/favorites (localStorage)
- [ ] Image optimization (next/image)

### Hub Backend (hub.propyte.com) — 35/52 (auditado 2026-05-07)

> Auditoría 2026-05-07: contraste de checklist vs código real en `Propyte_hub/src/`.
> `[x]` = evidencia clara en código · `[~]` = parcial / requiere verificación funcional · `[ ]` = no implementado.

**Approval System:**
- [x] 3-tab interface (Developers, Developments, Units) — `(dashboard)/{desarrolladores,desarrollos,unidades}/`
- [x] Bulk status update — `/api/bulk` + `/api/unidades/bulk`
- [x] Toggle web publication — `/api/site-config/visibility` + `(dashboard)/configuracion/visibilidad/`
- [x] Field editing with whitelist — `lib/fields-config.ts`
- [x] Image upload & optimization — `/api/images/{upload,sign,commit}` + Sharp + `lib/image-compress.ts`
- [x] Image deletion — `/api/images/route.ts` (DELETE handler)
- [x] Record duplication — `/api/record/route.ts`
- [x] Completeness scoring (weighted) — `lib/completeness.ts`
- [x] Pipeline status visualization — `(dashboard)/desarrollos/DevelopmentsTable.tsx`
- [x] Sync status badges (Zoho, Web) — `lib/status-canonical.ts`
- [~] Pagination (20-1000/page) — verificar rangos en DevelopmentsTable
- [x] Filters (status, city, completeness, sync, web) — DevelopmentsTable.tsx

**Sync Engine:**
- [x] Pull sync (Supabase → cache, quality filters) — `/api/ingest/`
- [x] Push sync (edits → Supabase, anti-loop) — vía mutation routes en `/api/desarrollos`, `/api/unidades`
- [x] Image sync (download, optimize, upload) — `/api/cron/process-images`
- [~] Conflict detection — verificar implementación
- [x] Incremental sync (updated_at) — usa `last_synced_at` en ingest connectors
- [x] Full sync (manual trigger) — endpoints `/api/ingest/zoho?full=1` etc
- [x] Cron scheduling (15min/6h/24h) — `scripts/cron/hostinger-crons.txt`, 13 jobs
- [x] Sync dashboard (logs, errors, timestamps) — `(dashboard)/sync/`
- [x] On-demand ISR trigger to propyte.com — `/api/revalidate`

**Content:**
- [x] Blog AI generator (Claude API) — `/api/blog/generate`
- [ ] Blog scheduling (cron) — sin `/api/cron/blog-*`, generación es manual
- [x] Blog moderation (draft → publish) — `(dashboard)/blog/manage/`

**Admin:**
- [x] Dashboard (stats, sync status, recent leads) — `(dashboard)/page.tsx`
- [x] Change log (audit trail for prices/availability) — `(dashboard)/cambios/page.tsx` + `lib/audit.ts`
- [x] Team management (CRUD) — `(dashboard)/equipo/` + `/api/team`
- [~] Agent profiles (11 meta fields) — verificar 11 campos completos en TeamManager
- [x] Settings panel (Supabase, sync, analytics, CRM, diagnostics) — `(dashboard)/configuracion/`
- [~] Settings diagnostics: 4 status cards (En Supabase, Aprobados, Pasan Quality, Sincronizados) — verificar
- [~] Settings diagnostics: rejection details table (20 max, with reasons) — verificar
- [ ] Built Settings admin (portfolio items, stats, services — NOT static page)

**API:**
- [~] 5 approval routes — sólo `/api/approve/route.ts` visible; verificar si las otras 4 están en otras carpetas o faltan
- [x] 3 sync routes — `/api/cron/{sync-zoho,sync-ads,sync-ga4}`
- [x] 2 blog routes — `/api/blog/{generate,save,list,pixabay}` (4, supera 2)
- [x] 1 revalidate route — `/api/revalidate`
- [~] 1 change-log route — UI existe pero no hay `/api/change-log` separado; queries via `lib/audit.ts`
- [x] 1 team route — `/api/team`
- [ ] 1 agents route — sin `/api/agents` independiente; cabe dentro de team
- [x] 1 settings route — `/api/site-config`
- [x] 2 leads routes (receive + forward) — `/api/leads`

**Auth:**
- [x] Login page — `app/login/page.tsx`
- [x] JWT sessions (8h) — `lib/auth/index.ts` (NextAuth.js v5)
- [x] RBAC (ADMIN, DIRECTOR, GERENTE, MARKETING) — `lib/auth/users.ts`
- [x] Middleware protection — `src/middleware.ts`

**Reports Module (NUEVO — fuera del scope original 0/48):**
- [x] Schema `reports` en Supabase (001_init.sql aplicado)
- [x] Connectors: Banxico, Zoho, Meta Ads, Google Ads, GA4, TikTok, Drive
- [x] Calculadores KPIs Semanal (10 secciones) + Asesores Semanal + Mensual + Anual
- [x] Crons generate-weekly/monthly/annual + evaluate-alerts
- [x] UI: `/reportes/{kpis,asesores,mensual,anual,snapshots,alertas,config}`
- [x] Generadores: CSV + XLSX + PDF (descarga via `/api/reports/export?format=csv|xlsx|pdf`)
- [x] Email distribution: nodemailer + SMTP Hostinger, templates HTML, auto-envío tras cron `generate-*`, endpoint manual `/api/reports/email/send`
- [ ] Generadores: WhatsApp Cloud API
- [ ] Drive backup automático tras cada generate-*
- [ ] 6 reglas de alertas agregadas (sólo individual asesor implementadas)

**Pendientes reales (gaps confirmados):**
1. Blog scheduling cron — agregar `/api/cron/blog-generate` + cron Hostinger
2. Built Settings admin — actualmente página estática, requiere CRUD
3. Generadores PDF/Email/WhatsApp + Drive backup (Bloque H Reports)
4. Reglas de alertas agregadas (Bloque I Reports)
5. Rutas API a verificar: 5 approval routes vs 1 actual, change-log route, agents route

---

## APÉNDICE A: META KEYS MAPPING (WP → TypeScript)

```typescript
// shared/constants/meta-keys.ts

// Desarrollo meta (55+ fields)
export const DESARROLLO_META = {
  supabaseId: 'propyte_supabase_id',
  syncStatus: 'propyte_sync_status',
  lastSynced: 'propyte_last_synced',
  city: 'propyte_city',
  zone: 'propyte_zone',
  state: 'propyte_state',
  address: 'propyte_address',
  lat: 'propyte_lat',
  lng: 'propyte_lng',
  priceMxn: 'propyte_price_mxn',
  currency: 'propyte_currency',
  bedrooms: 'propyte_bedrooms',
  bathrooms: 'propyte_bathrooms',
  areaM2: 'propyte_area_m2',
  propertyType: 'propyte_property_type',
  stage: 'propyte_stage',
  usage: 'propyte_usage',
  roiProjected: 'propyte_roi_projected',
  roiRentalMonthly: 'propyte_roi_rental_monthly',
  roiAppreciation: 'propyte_roi_appreciation',
  financingDownMin: 'propyte_financing_down_min',
  financingMonths: 'propyte_financing_months',
  financingRate: 'propyte_financing_rate',
  images: 'propyte_images',
  virtualTourUrl: 'propyte_virtual_tour_url',
  videoUrl: 'propyte_video_url',
  amenities: 'propyte_amenities',
  featured: 'propyte_featured',
  slug: 'propyte_slug',
  // Internal
  tipoDes: '_propyte_tipo_desarrollo',
  avanceObra: '_propyte_avance_obra_porcentaje',
  fasesTotales: '_propyte_fases_totales',
  faseActual: '_propyte_fase_actual',
  estado: '_propyte_estado',
  desarrolladorId: '_propyte_desarrollador_id',
  documentos: '_propyte_documentos',
  precioDesde: '_propyte_precio_desde',
  precioHasta: '_propyte_precio_hasta',
  monedaPrincipal: '_propyte_moneda_principal',
  totalUnidades: '_propyte_total_unidades',
  unidadesDisponibles: '_propyte_unidades_disponibles',
  entregaDescripcion: '_propyte_entrega_descripcion',
  fechaEntrega: '_propyte_fecha_entrega',
  comisionPorcentaje: '_propyte_comision_porcentaje',
  tourVirtual: '_propyte_tour_virtual_desarrollo',
  video: '_propyte_video_desarrollo',
  videosYoutube: '_desarrollo_videos_youtube',
  galeriaIds: '_propyte_galeria_ids',
  coverPhoto: 'propyte_cover_photo',
  urlBrochure: '_propyte_url_brochure',
  destacado: '_propyte_destacado',
  roiEstimado: '_propyte_roi_estimado',
  coordenadas: '_propyte_coordenadas',
} as const;

// Unidad meta (40+ fields)
export const UNIDAD_META = {
  numero: '_unidad_numero',
  piso: '_unidad_piso',
  orientacion: '_unidad_orientacion',
  subtipo: '_unidad_subtipo',
  recamaras: '_unidad_recamaras',
  banos: '_unidad_banos_completos',
  estacionamientos: '_unidad_estacionamientos',
  areaConstruida: '_unidad_area_construida',
  superficieTotal: '_unidad_superficie_total_m2',
  precioMxn: '_unidad_precio_mxn',
  precioUsd: '_unidad_precio_usd',
  precioDescuento: '_unidad_precio_descuento',
  textoDescuento: '_unidad_texto_descuento',
  precioM2Mxn: '_unidad_precio_m2_mxn',
  disponibilidad: '_unidad_disponibilidad',
  desarrolloId: '_unidad_desarrollo_id',
  esPreventa: '_unidad_es_preventa',
  slugAnterior: '_unidad_slug_anterior',
  slugsAnteriores: '_unidad_slugs_anteriores',
  slugLocked: '_unidad_slug_locked',
} as const;

// Lead meta
export const LEAD_META = {
  email: 'propyte_lead_email',
  phone: 'propyte_lead_phone',
  message: 'propyte_lead_message',
  source: 'propyte_lead_source',
  status: 'propyte_lead_status',
  crmSent: 'propyte_lead_crm_sent',
  utmSource: 'propyte_lead_utm_source',
  utmMedium: 'propyte_lead_utm_medium',
  utmCampaign: 'propyte_lead_utm_campaign',
} as const;
```

## APÉNDICE B: TAXONOMÍAS

```typescript
// shared/constants/taxonomies.ts
export const TAXONOMIES = {
  city: {
    slug: 'ciudad',
    postTypes: ['desarrollo', 'unidad'],
    hierarchical: true,
  },
  type: {
    slug: 'tipo',
    postTypes: ['desarrollo', 'unidad'],
    hierarchical: true,
    defaultTerms: [
      'departamento', 'estudio', 'penthouse', 'terreno',
      'casa', 'local-comercial', 'bodega',
    ],
  },
  stage: {
    slug: 'etapa',
    postTypes: ['desarrollo'],
    hierarchical: true,
    defaultTerms: [
      'preventa', 'en-construccion', 'entrega-inmediata', 'terminado',
    ],
  },
  zone: {
    slug: 'zona',
    postTypes: ['desarrollo', 'unidad'],
    hierarchical: true,
  },
  developer: {
    slug: 'desarrollador',
    postTypes: ['desarrollo'],
    hierarchical: false,
  },
} as const;
```

## APÉNDICE C: PIPELINE STATUS

```typescript
// shared/constants/pipeline-statuses.ts
export const PIPELINE_STATUSES = {
  discovery: { label: 'Descubrimiento', color: '#94A3B8', order: 1 },
  analisis: { label: 'Análisis', color: '#60A5FA', order: 2 },
  presentacion: { label: 'Presentación', color: '#A78BFA', order: 3 },
  aprobado: { label: 'Aprobado', color: '#34D399', order: 4 },
  listo: { label: 'Listo', color: '#22C55E', order: 5 },
  pausa: { label: 'En Pausa', color: '#F59E0B', order: 6 },
  descartado: { label: 'Descartado', color: '#EF4444', order: 7 },
} as const;

export const STAGE_BADGES = {
  preventa: { label: 'Preventa', class: 'bg-amber-500 text-white' },
  'en-construccion': { label: 'En Construcción', class: 'bg-blue-500 text-white' },
  construccion: { label: 'En Construcción', class: 'bg-blue-500 text-white' },
  'entrega-inmediata': { label: 'Entrega Inmediata', class: 'bg-emerald-500 text-white' },
  entregado: { label: 'Entregado', class: 'bg-teal text-navy' },
  terminado: { label: 'Terminado', class: 'bg-gray-500 text-white' },
} as const;
```

## APÉNDICE D: AMENIDADES (20 keys)

```typescript
export const AMENIDADES = [
  'amenidad_alberca', 'amenidad_gym', 'amenidad_roof_garden',
  'amenidad_lobby', 'amenidad_coworking', 'amenidad_pet_friendly',
  'amenidad_seguridad_24h', 'amenidad_estacionamiento',
  'amenidad_bodega', 'amenidad_terraza', 'amenidad_jardin',
  'amenidad_salon_eventos', 'amenidad_area_infantil',
  'amenidad_business_center', 'amenidad_spa', 'amenidad_bar',
  'amenidad_restaurante', 'amenidad_playa', 'amenidad_golf',
  'amenidad_marina',
] as const;
```

---

## 27. SHARE/DOWNLOAD MODAL — ESPECIFICACIÓN COMPLETA

> **Gap v1.0:** El archivo más pesado del theme (45KB, 668 líneas) estaba mencionado sin detalle.

### 27.1 Arquitectura del Modal

El modal genera **3 formatos de ficha técnica** para compartir/descargar propiedades:

| Formato | Dimensiones | Uso | Método |
|---------|-------------|-----|--------|
| **Stories** | 360×640px (9:16) | Instagram/WhatsApp Stories | html2canvas → PNG download |
| **Square** | 500×500px (1:1) | Instagram Feed/Posts | html2canvas → PNG download |
| **Letter** | 794×1056px (A4) | Impresión/Email PDF | `window.print()` con CSS print |

### 27.2 Data Input (props del componente)

```typescript
interface ShareDownloadData {
  // Obligatorios
  title: string;              // Nombre del desarrollo/unidad
  price: string;              // Precio formateado "$5,500,000 MXN"
  location: string;           // "Tulum, Quintana Roo"
  img: string;                // URL imagen principal
  url: string;                // URL de la propiedad
  wa: string;                 // Número WhatsApp

  // Opcionales
  price_disc?: string;        // Precio con descuento
  disc_text?: string;         // "11% OFF"
  etapa?: string;             // "Preventa" | "En Construcción" | etc.
  specs: Array<{label: string; value: string}>; // e.g. [{label:'Recámaras', value:'3'}]
  desc?: string;              // Descripción (truncada a 120 chars en Stories, 200 en Square)
  amenidades?: string[];      // Lista de amenidades
  dev_name?: string;          // Nombre del desarrollador
  delivery?: string;          // Fecha entrega
  roi?: string;               // ROI estimado %
  piso?: string;              // Piso (unidades)
  price_to?: string;          // Precio máximo (rango)
  prop_type?: string;         // Tipo de propiedad
  num_unidad?: string;        // Número de unidad
  precio_usd?: string;        // Precio en USD
}
```

### 27.3 Templates Visuales (Off-screen rendering)

**Template Stories (360×640px):**
```
┌──────────────────────────┐
│     [IMAGE - 60% height] │ ← object-cover, gradient overlay bottom
│                          │
│  [ETAPA badge]           │ ← Top-left, rounded pill
│                          │
│──────────────────────────│
│  📍 Location             │ ← Small text, white
│  TITLE                   │ ← Bold, large, white, max 2 lines
│                          │
│  ┌────┐ ┌────┐           │
│  │Rec │ │Baño│           │ ← 2×2 stats grid (if specs exist)
│  │ 3  │ │ 2  │           │
│  ├────┤ ├────┤           │
│  │m²  │ │Est │           │
│  │185 │ │ 2  │           │
│  └────┘ └────┘           │
│                          │
│  $5,500,000 MXN          │ ← Price (large, teal)
│  ~~$6.2M~~ -11%          │ ← Discount (if exists)
│                          │
│  [amenity] [amenity]...  │ ← Amenity tags (max 4, small)
│                          │
│  ──── PROPYTE ────       │ ← Brand footer + "Developer Name"
└──────────────────────────┘
```

**Template Square (500×500px):**
```
┌──────────────────────────────────┐
│         [IMAGE - 52% top]        │ ← object-cover
│  [ETAPA badge]                   │
├──────────────────────────────────┤
│  ═══ teal divider               │
│  TITLE                           │ ← Bold, navy
│  📍 Location                     │
│                                  │
│  ┌────┐ ┌────┐ ┌────┐           │
│  │Rec │ │m²  │ │Baño│           │ ← 3-col stats
│  │ 3  │ │185 │ │ 2  │           │
│  └────┘ └────┘ └────┘           │
│                                  │
│  $5,500,000 MXN                  │ ← Price
│  [amenity] [amenity] [amenity]   │ ← Tags
│                                  │
│  PROPYTE · propyte.com           │ ← Footer
└──────────────────────────────────┘
```

**Template Letter (794×1056px — A4):**
```
┌──────────────────────────────────────────────┐
│  [PROPYTE LOGO]              Ficha Técnica   │ ← Header bar
├──────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────────┐  │
│  │              │  │ TITLE                │  │
│  │   [IMAGE]    │  │ 📍 Location          │  │
│  │              │  │ [ETAPA badge]        │  │
│  │              │  │                      │  │
│  │              │  │ Tipo: Departamento   │  │ ← Specs table
│  │              │  │ Recámaras: 3         │  │
│  │              │  │ Baños: 2             │  │
│  │              │  │ Área: 185 m²         │  │
│  │              │  │ Piso: 5              │  │
│  │              │  │ Estac.: 2            │  │
│  └──────────────┘  └──────────────────────┘  │
│                                              │
│  $5,500,000 MXN                $315,000 USD  │ ← Price row
│                                              │
│  ┌─ Características ──────────────────────┐  │
│  │ ✓ Alberca  ✓ Gym  ✓ Roof Garden       │  │
│  │ ✓ Seguridad 24h  ✓ Pet Friendly       │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─ Entrega ──────┐  ┌─ ROI Estimado ────┐  │
│  │ 2027 Q4        │  │ 8.5% anual        │  │
│  └────────────────┘  └────────────────────┘  │
│                                              │
│  Descripción:                                │
│  Lorem ipsum... (max 300 chars)              │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  📱 WhatsApp: +52 984 323 5354        │  │ ← CTA
│  │  🌐 propyte.com/{url}                 │  │
│  └────────────────────────────────────────┘  │
│  PROPYTE — Tu aliado en bienes raíces        │ ← Footer
└──────────────────────────────────────────────┘
```

### 27.4 Share Options (Dropdown)

| Acción | Implementación |
|--------|---------------|
| Copiar link | `navigator.clipboard.writeText(url)` con fallback `execCommand('copy')` |
| WhatsApp | `https://wa.me/?text=${encodeURIComponent(message + url)}` |
| Facebook | `https://facebook.com/sharer/sharer.php?u=${url}` |
| X (Twitter) | `https://x.com/intent/tweet?url=${url}&text=${title}` |

### 27.5 Implementación React

```typescript
// components/property/ShareDownloadModal.tsx
'use client';

// Dependencia: html2canvas (lazy-loaded on first use)
// CDN: https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// O npm: html2canvas@1.4.1

// Off-screen rendering: Templates renderizados a -9999px, invisibles
// html2canvas captura el DOM node → canvas → PNG blob → download

// Print mode: Para Letter format, usa window.print() con CSS @media print
// que muestra solo el template Letter y oculta todo lo demás
```

---

## 28. LÓGICA JS COMPLETA — INVESTMENT CALCULATOR

> **Gap v1.0:** Solo mencionaba el componente sin calcar la lógica de cálculo. Aquí están las 10 funciones financieras exactas.

### 28.1 Constantes

```typescript
// lib/calculators/investment-constants.ts

// Residential mode
export const RES_OCCUPANCY = 0.95;        // 95% occupancy assumption
export const RES_EXPENSE_RATIO = 0.20;    // 20% expenses (mortgage+taxes+insurance+maint)

// Vacacional mode
export const VAC_EXPENSE_TOTAL = 0.53;    // 53% total costs
// Breakdown: 35% general expenses + 3% platform fees + 15% property management
export const VAC_DEFAULT_OCCUPANCY = 0.70; // 70% default

// Closing costs by state
export const CLOSING_RATES: Record<string, number> = {
  'quintana roo': 0.08,   // 8%
  'yucatan': 0.06,        // 6%
  'jalisco': 0.06,
  'default': 0.06,        // 6% default
};
```

### 28.2 Funciones Financieras Puras (Calca Exacta)

```typescript
// lib/calculators/investment-calculator.ts

/** Closing cost rate by state */
export function closingRate(state: string): number {
  return CLOSING_RATES[state.toLowerCase().trim()] ?? CLOSING_RATES.default;
}

/** Monthly amortization payment */
export function monthlyPayment(principal: number, annualRate: number, months: number): number {
  if (annualRate <= 0 || months <= 0) return principal / Math.max(months, 1);
  const r = annualRate / 100 / 12;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

/** Gross yield = annual rent / total investment × 100 */
export function grossYield(annualRent: number, totalInvestment: number): number {
  if (totalInvestment <= 0) return 0;
  return (annualRent / totalInvestment) * 100;
}

/** Net yield = annual net rent / total investment × 100 */
export function netYield(annualNetRent: number, totalInvestment: number): number {
  if (totalInvestment <= 0) return 0;
  return (annualNetRent / totalInvestment) * 100;
}

/** Cap rate = net yield (synonym) */
export const capRate = netYield;

/** Cash on cash = annual net rent / down payment × 100 */
export function cashOnCash(annualNetRent: number, downPayment: number): number {
  if (downPayment <= 0) return 0;
  return (annualNetRent / downPayment) * 100;
}

/** Breakeven months = total investment / monthly net flow */
export function breakevenMonths(totalInvestment: number, monthlyNetFlow: number): number | null {
  if (monthlyNetFlow <= 0) return null;
  return Math.ceil(totalInvestment / monthlyNetFlow);
}

/** Simple ROI over N years = (appreciation + rental income) / down payment × 100 */
export function roi(
  price: number, monthlyRent: number, downPayment: number,
  appreciationPct: number, years: number
): number {
  if (downPayment <= 0) return 0;
  const appreciationGain = price * (Math.pow(1 + appreciationPct / 100, years) - 1);
  const rentIncome = monthlyRent * 12 * years;
  return ((appreciationGain + rentIncome) / downPayment) * 100;
}

/** Projected property value after N years */
export function projectedValue(price: number, appreciationPct: number, years: number): number {
  return price * Math.pow(1 + appreciationPct / 100, years);
}

/** Build cash flow array for IRR calculation */
export function buildCashFlows(
  totalInvestment: number, annualNetRent: number,
  price: number, appreciationPct: number, years: number
): number[] {
  const flows = [-totalInvestment];
  for (let y = 1; y <= years; y++) {
    let flow = annualNetRent;
    if (y === years) {
      flow += price * Math.pow(1 + appreciationPct / 100, years); // sale proceeds
    }
    flows.push(flow);
  }
  return flows;
}

/** IRR via Newton-Raphson (max 100 iterations, tolerance 1e-7) */
export function irr(cashFlows: number[]): number | null {
  let guess = 0.1;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0, dnpv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + guess, i);
      dnpv -= i * cashFlows[i] / Math.pow(1 + guess, i + 1);
    }
    if (Math.abs(dnpv) < 1e-12) return null;
    const newGuess = guess - npv / dnpv;
    if (Math.abs(newGuess - guess) < 1e-7) return newGuess * 100; // Return as percentage
    guess = newGuess;
  }
  return null; // Did not converge
}
```

### 28.3 UI State Machine

```typescript
interface CalculatorState {
  mode: 'residencial' | 'vacacional';
  downPaymentPct: number;    // 10-100 slider
  interestRate: number;       // 0-20 input field
  months: 6 | 12 | 18 | 24;  // Button group
  appreciationPct: number;    // 0-20 slider
  occupancyPct: number;       // 1-100 slider (vacacional only, hidden in residencial)
}

// Recalculate on ANY state change
function recalculate(state: CalculatorState, property: PropertyData): CalculatorOutput {
  const closingCost = property.price * closingRate(property.state);
  const totalPropertyCost = property.price + closingCost;
  const downPayment = property.price * (state.downPaymentPct / 100);
  const totalInvestment = downPayment + closingCost;
  const financed = property.price - downPayment;
  const monthlyPmt = monthlyPayment(financed, state.interestRate, state.months);

  let monthlyRent: number;
  let expenseRatio: number;

  if (state.mode === 'residencial') {
    monthlyRent = property.rentRes * RES_OCCUPANCY;
    expenseRatio = RES_EXPENSE_RATIO;
  } else {
    monthlyRent = property.rentVac * (state.occupancyPct / 100);
    expenseRatio = VAC_EXPENSE_TOTAL;
  }

  const monthlyNet = monthlyRent * (1 - expenseRatio);
  const annualNet = monthlyNet * 12;
  const annualGross = monthlyRent * 12;

  // Use Supabase pre-computed values if defaults unchanged
  const usePrecomputed = state.downPaymentPct === 30
    && state.mode === 'residencial'
    && property.supabaseFinancials;

  return {
    closingCost,
    downPayment,
    totalInvestment,
    monthlyPayment: monthlyPmt,
    monthlyRent,
    monthlyNet,
    yieldGross: usePrecomputed ? property.supabaseFinancials.yieldGross
      : grossYield(annualGross, totalInvestment),
    yieldNet: usePrecomputed ? property.supabaseFinancials.yieldNet
      : netYield(annualNet, totalInvestment),
    capRate: usePrecomputed ? property.supabaseFinancials.capRate
      : capRate(annualNet, totalInvestment),
    cashOnCash: cashOnCash(annualNet, downPayment),
    netFlow: monthlyNet,
    breakeven: breakevenMonths(totalInvestment, monthlyNet),
    roi1yr: roi(property.price, monthlyNet, downPayment, state.appreciationPct, 1),
    roi3yr: roi(property.price, monthlyNet, downPayment, state.appreciationPct, 3),
    roi5yr: roi(property.price, monthlyNet, downPayment, state.appreciationPct, 5),
    irr5yr: irr(buildCashFlows(totalInvestment, annualNet, property.price, state.appreciationPct, 5)),
    irr10yr: irr(buildCashFlows(totalInvestment, annualNet, property.price, state.appreciationPct, 10)),
    projectedValue5yr: projectedValue(property.price, state.appreciationPct, 5),
  };
}
```

### 28.4 Formatters

```typescript
export function fmtMXN(v: number | null): string {
  if (v == null || isNaN(v)) return '—';
  return '$' + v.toLocaleString('es-MX', { maximumFractionDigits: 0 }) + ' MXN';
}

export function fmtPct(v: number | null): string {
  if (v == null || isNaN(v)) return '—';
  return v.toFixed(1) + '%';
}
```

---

## 29. LÓGICA JS COMPLETA — RENTAL ANALYSIS

> **Gap v1.0:** Solo mencionaba el componente sin calcar la lógica de filtrado, estadísticas e histograma.

### 29.1 Data Source

JSON inline `<script id="propyte-rental-data" type="application/json">` con:
```typescript
interface RentalAnalysisData {
  comparables: Array<{
    city: string;
    zone: string;
    property_type: string;
    bedrooms: number;
    rental_type: string;     // 'residencial' | 'vacacional'
    is_furnished: boolean;
    monthly_rent_mxn: number;
    area_m2: number;
  }>;
  rankings: Array<{
    name: string;
    image: string;
    url: string;
    zone: string;
    city: string;
    price_min: number;
    rent: number;
    yield: number;
    cap_rate: number;
    irr_5yr: number;
  }>;
}
```

### 29.2 Filter Logic

```typescript
function filterComparables(data: Comparable[], filters: Filters): Comparable[] {
  return data.filter(c => {
    if (filters.city && c.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    if (filters.zone && c.zone.toLowerCase() !== filters.zone.toLowerCase()) return false;
    if (filters.type && c.property_type.toLowerCase() !== filters.type.toLowerCase()) return false;
    if (filters.beds && c.bedrooms !== filters.beds) return false;
    if (filters.rentalType && c.rental_type !== filters.rentalType) return false;
    if (filters.furnished !== undefined && c.is_furnished !== filters.furnished) return false;
    if (filters.rentMin && c.monthly_rent_mxn < filters.rentMin) return false;
    if (filters.rentMax && c.monthly_rent_mxn > filters.rentMax) return false;
    return true;
  });
}

// Dynamic zone dropdown: updates options based on selected city
function getZonesForCity(data: Comparable[], city: string): string[] {
  return [...new Set(data.filter(c => c.city === city).map(c => c.zone))].sort();
}
```

### 29.3 Statistical Functions

```typescript
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function computeStats(filtered: Comparable[]): RentalStats {
  const rents = filtered.map(c => c.monthly_rent_mxn);
  const rentPerM2 = filtered
    .filter(c => c.area_m2 > 0)
    .map(c => c.monthly_rent_mxn / c.area_m2);

  return {
    count: rents.length,
    avg: rents.reduce((a, b) => a + b, 0) / rents.length,
    median: median(rents),
    p25: percentile(rents, 25),
    p75: percentile(rents, 75),
    min: Math.min(...rents),
    max: Math.max(...rents),
    rentPerM2: rentPerM2.length ? median(rentPerM2) : 0,
  };
}
```

### 29.4 Histogram (12 buckets)

```typescript
function buildHistogram(rents: number[], bucketCount: number = 12) {
  const min = Math.min(...rents);
  const max = Math.max(...rents);
  const step = (max - min) / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    rangeMin: min + i * step,
    rangeMax: min + (i + 1) * step,
    count: 0,
  }));
  rents.forEach(r => {
    const idx = Math.min(Math.floor((r - min) / step), bucketCount - 1);
    buckets[idx].count++;
  });
  const maxCount = Math.max(...buckets.map(b => b.count));
  return buckets.map(b => ({
    ...b,
    heightPct: maxCount > 0 ? (b.count / maxCount) * 100 : 0,
  }));
}
// Render: Vertical bars with hover tooltip showing "range: $X – $Y | count: N"
```

### 29.5 Breakdowns (Top 8)

```typescript
function breakdown(filtered: Comparable[], key: keyof Comparable): BreakdownItem[] {
  const groups = new Map<string, number[]>();
  filtered.forEach(c => {
    const k = String(c[key]);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(c.monthly_rent_mxn);
  });
  return [...groups.entries()]
    .map(([name, rents]) => ({ name, count: rents.length, median: median(rents) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}
// Breakdowns for: city, zone, property_type, bedrooms
```

### 29.6 Rankings Table

```typescript
// Sorted by yield descending (default)
// Columns: Rank, Property (image+name+location), Price, Rent/mes, Yield%, Cap Rate%, IRR 5yr
// Custom sort: click column header → toggle asc/desc
```

---

## 30. MAPEO DE ICONOS SVG → LUCIDE REACT

> **Gap v1.0:** Decía "reemplazo 1:1" pero no tenía el mapeo exacto. Son 78 iconos, no 42.

```typescript
// shared/constants/icon-map.ts
// Mapeo: nombre en icons.php → import de lucide-react

export const ICON_MAP = {
  // Navigation & UI
  'search':         'Search',
  'menu':           'Menu',
  'x':              'X',
  'chevron-down':   'ChevronDown',
  'arrow-right':    'ArrowRight',
  'arrow-up-right': 'ArrowUpRight',
  'home':           'Home',
  'layout':         'Layout',

  // Property specs
  'map-pin':        'MapPin',
  'bed':            'Bed',
  'bath':           'Bath',           // Note: icons.php uses 'bath', Lucide has 'Bath'
  'droplets':       'Droplets',
  'car':            'Car',
  'maximize':       'Maximize2',
  'key':            'Key',

  // Financial
  'dollar-sign':    'DollarSign',
  'trending-up':    'TrendingUp',
  'trending-down':  'TrendingDown',
  'bar-chart-3':    'BarChart3',
  'credit-card':    'CreditCard',
  'scale':          'Scale',

  // Social & Communication
  'heart':          'Heart',
  'star':           'Star',
  'share-2':        'Share2',
  'phone':          'Phone',
  'mail':           'Mail',
  'message-circle': 'MessageCircle',
  'smartphone':     'Smartphone',
  'headphones':     'Headphones',
  'megaphone':      'Megaphone',
  'volume-2':       'Volume2',

  // Features & Amenities
  'shield':         'Shield',
  'shield-check':   'ShieldCheck',
  'check-circle':   'CheckCircle',
  'zap':            'Zap',
  'sliders':        'Sliders',
  'award':          'Award',
  'globe':          'Globe',
  'users':          'Users',
  'building-2':     'Building2',
  'truck':          'Truck',
  'hammer':         'Hammer',
  'wrench':         'Wrench',
  'monitor':        'Monitor',
  'sofa':           'Sofa',         // Note: Lucide has 'Sofa' as of v0.300+
  'thermometer':    'Thermometer',
  'calendar':       'Calendar',
  'clock':          'Clock',

  // Media
  'play':           'Play',
  'rotate-ccw':     'RotateCcw',
  'file-text':      'FileText',

  // Social Media (custom SVGs — NO Lucide equivalent)
  'instagram':      null,  // Use custom SVG or react-icons/fi FiInstagram
  'facebook':       null,  // Use custom SVG or react-icons/fi FiFacebook

  // Help
  'help-circle':    'HelpCircle',

  // Marketplace
  'store':          'Store',
} as const;

// Para instagram y facebook: mantener SVG inline custom porque Lucide no incluye brand icons
// Alternativa: usar `react-icons` package → `import { FaInstagram, FaFacebook } from 'react-icons/fa'`
```

**Uso en componentes:**
```tsx
import { MapPin, Bed, Bath } from 'lucide-react';

// Reemplaza: <?php echo propyte_icon('map-pin', 14); ?>
// Con:       <MapPin size={14} />

// Los SVG custom (instagram, facebook) se mantienen como componentes inline
```

---

## 31. PLAYWRIGHT TEST MIGRATION

> **Gap v1.0:** Decía "calca del suite existente" sin detallar. Hay 20 test files (5,816 líneas).

### 31.1 Test Files a Migrar

| # | Archivo WP | Archivo Next.js | Líneas | Prioridad |
|---|-----------|----------------|--------|-----------|
| 1 | `seo-audit.spec.ts` | `tests/seo-audit.spec.ts` | 295 | P0 — Critical |
| 2 | `lead-form.spec.ts` | `tests/lead-form.spec.ts` | 129 | P0 — Critical |
| 3 | `navigation.spec.ts` | `tests/navigation.spec.ts` | 62 | P0 — Critical |
| 4 | `investment-analysis-quick.spec.js` | `tests/investment-calc.spec.ts` | 150 | P1 — High |
| 5 | `investment-mercado-features.spec.js` | `tests/mercado-features.spec.ts` | 120 | P1 — High |
| 6 | `exhaustive-audit.spec.js` | `tests/exhaustive-audit.spec.ts` | 80 | P1 — High |
| 7 | `archive-fixes.spec.js` | `tests/archive.spec.ts` | ~50 | P1 — High |
| 8 | `archive-fixes-v2.spec.js` | Merge into #7 | ~50 | P1 |
| 9 | `a11y-contrast.spec.ts` | `tests/a11y-contrast.spec.ts` | ~40 | P2 — Medium |
| 10 | `audit-completo.spec.ts` | `tests/full-audit.spec.ts` | ~100 | P2 |
| 11 | `auditoria-mercado.spec.ts` | `tests/mercado-audit.spec.ts` | ~80 | P2 |
| 12 | `auditoria-vacacional-exhaustiva.spec.js` | `tests/vacacional.spec.ts` | ~100 | P2 |
| 13 | `header-fixes.spec.js` | `tests/header.spec.ts` | ~40 | P2 |
| 14 | `legal-faq-i18n.spec.ts` | `tests/faq-i18n.spec.ts` | ~50 | P2 |
| 15 | `mercado-i18n.spec.ts` | `tests/mercado-i18n.spec.ts` | ~50 | P2 |
| 16 | `pages-i18n.spec.ts` | `tests/pages-i18n.spec.ts` | ~60 | P2 |
| 17 | `rename-propiedades.spec.ts` | `tests/slug-redirects.spec.ts` | ~30 | P1 — High |
| 18 | `seo-meta.spec.ts` | Merge into #1 | ~80 | P0 |
| 19 | `validate-fixes.spec.js` | `tests/regression.spec.ts` | ~40 | P3 |
| 20 | `verify-fixes-local.spec.js` | Drop (local-only) | ~30 | — |

### 31.2 Test Adaptations Required

**URL changes:**
- Base URL: `dev.propyte.com` → `staging.propyte.com` (Vercel) or `localhost:3000` (local)
- Slug format: `/desarrollos/nativa-tulum` → `/desarrollos/tulum/departamento/nativa-tulum`
- API endpoints: `admin-ajax.php?action=propyte_lead` → `/api/leads`

**DOM changes:**
- jQuery selectors → standard `page.locator()` (ya migrado en la mayoría)
- `page.$eval()` → `page.locator().evaluate()` (ya migrado)
- AJAX responses: WordPress JSON format → Next.js API response format

**New tests to add:**
- Slug redirect verification (old → new → 301 → correct page)
- Hub approval workflow (create → approve → verify on frontend)
- Sync engine (trigger sync → verify data appears)
- PDF generation (download → verify file is valid PDF)

### 31.3 CI Integration

```yaml
# In deploy workflow, post-deploy step:
- name: Run Playwright smoke tests
  run: |
    npx playwright install chromium
    npx playwright test --grep @smoke \
      --config=playwright.config.ts \
      --reporter=html
  env:
    BASE_URL: ${{ github.ref == 'refs/heads/main' && 'https://propyte.com' || 'https://staging.propyte.com' }}
```

---

## 32. PULIDO UX/A11Y POST-MIGRACIÓN (backlog Fase 5.5 — intercalada entre Fase 5 y Fase 7 Blog, dado que Fase 6 Built Portfolio fue skipped 2026-04-20)

> **Origen:** Auditoría UX/UI Pro 2026-04-20 (Luis). Se incorporan solo los hallazgos que **NO contradicen** la identidad canónica del Speckit (paleta Teal `#5CE0D2` / Navy `#1A2F3F` / Aztec `#0F1923`, tipografía Space Grotesk, tabs Comprar/Preventa §18). Rechazados: propuestas de rediseño de paleta a `#000000/#00A8B5`, pairing tipográfico con Playfair Display, y reemplazo de tabs Comprar/Preventa por dropdown — esos requieren aprobación explícita del Manual de Identidad Propyte (Notion).

### 32.1 — Credibilidad (bloqueantes si migración cierra con esto visible)

| # | Item | Acción |
|---|------|--------|
| 1 | Prefijo `[SAMPLE]` en cards de grid y single | Strip en query (`REPLACE(nombre, '[SAMPLE] ', '')`) o re-sembrar fila AZUL VIVO sin prefijo en Supabase |
| 2 | KPIs con dash huérfano "—" cuando `zone_scores`/`airdna_metrics` vacío | Ocultar card completa (no mostrar dash) + badge "Actualizando" si `null`. Mostrar `last_updated: hace X días` en pie de card |
| 3 | `wa.me/529841234567` placeholder | Luis setea `NEXT_PUBLIC_WHATSAPP_PHONE` real en Vercel. Todos los WhatsApp links consumen env var (audit commit ya validó uso correcto) |
| 4 | Footer redes sociales sin `href` | Vincular reales o remover íconos — no dejar placeholder |
| 5 | Disclaimer footer con tono amateur | Rewrite profesional: *"Propyte opera como plataforma de análisis inmobiliario; las transacciones son gestionadas por socios certificados ante AMPI/CANADEVI."* |
| 6 | Precio sin formato consistente | `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })` — verificar uso en todos los cards + detail |

### 32.2 — Cards de propiedad (oportunidad de diferencial)

- Agregar `$/m²` calculado + delta `+X.X% plusvalía vs zona` debajo del precio (tipografía `tabular-nums`)
- ROI/Cap badges ya existen en `MarketplaceCard` — verificar que rendericen cuando haya datos
- Skeleton loading con shimmer Tailwind para evitar CLS

### 32.3 — Datos de mercado (hero de diferencial)

- Hide-empty-KPI pattern (no dashes)
- `CurrencyContext` (MXN/USD) ya existe — exponer toggle prominente en sección KPIs
- Sparkline 12m por KPI (Recharts ya está en stack)
- Badge `Actualizado hace X días` por card — credibilidad > pretensión

### 32.4 — Accesibilidad WCAG 2.2 AA

- `focus-visible` ring Teal 2px + offset 2px en todos los interactivos (Tailwind `focus-visible:ring-2 focus-visible:ring-[#5CE0D2]`)
- Skip-to-content link antes del `<header>`
- `aria-current="page"` en nav item activo
- `aria-expanded` en dropdowns ("Más", SearchTypeToggle, filtros)
- `aria-label` en icon-only buttons (lupa, WhatsApp, favorito, LangSwitcher)
- `<label for>` real en formularios (no placeholder-as-label)
- Navegación por teclado en carruseles (flechas `←→` + `role="region"`)
- Correr **axe-core** en CI + Playwright — target **0 errores AA**

### 32.5 — SEO / Schema.org extensión

- `RealEstateListing` schema en cada card del grid + detail (hoy hay SchemaMarkup genérico)
- `AggregateRating` en bloque testimonios (cuando exista)
- `BreadcrumbList` visible + JSON-LD en archives + detail
- OG images dinámicas con foto real + precio + zona (no logo genérico)

### 32.6 — Mobile específico

- `env(safe-area-inset-bottom)` en footer + WhatsApp flotante (iOS notch)
- Tap targets mínimo **44×44px** en chips quick-filter + iconos footer
- WhatsApp float: `margin-bottom: 80px` al grid cuando `@media (max-width: 768px)` para no tapar última card
- Carruseles con scroll-snap obligatorio (evitar drag libre)

### 32.7 — Ejecución

Ejecutar este bloque como **Fase 5.5** DESPUÉS de cerrar Fase 5 Content Pages (15/15). Originalmente se pensó intercalada antes de Fase 6 Built Portfolio, pero Fase 6 quedó skipped (decisión Luis 2026-04-20) — por lo tanto Fase 5.5 antecede directamente a Fase 7 Blog Completo. Se mantiene separada de Fase 8 SEO & Performance (optimización de Core Web Vitals global) porque son alcances distintos: 5.5 es pulido visual/a11y del sitio migrado; 8 es perf global + schema extension cross-sitio. Audit por batch, igual que Fase 5.

---

---

## 33. BUGS HEADER/LAYOUT — Auditoría 2026-04-22

Bugs detectados por el auditor post-commits `c601a3d` + `cc1a3cc`. Pendientes de fix en un solo commit.

| # | Bug | Archivo | Fix |
|---|-----|---------|-----|
| 1 | `/mercado` en `DARK_HERO_ROUTES` incorrecto — MercadoHero usa gradiente claro, no dark hero. Commit cc1a3cc parchó con `bg-white` en `<main>` pero no resolvió la causa raíz. Crea costura oscura/clara visible. | `MainPadding.tsx` | Quitar `/mercado` de `DARK_HERO_ROUTES`; revertir `bg-white` parche en `mercado/page.tsx` |
| 2 | SearchBubble visible en `/propiedades` y `/desarrollos`. `isArchive` oculta ActionsPill pero NO el SearchBubble. `hideBubbleOnHome` solo aplica en home. | `Header.tsx:43-72` | `const hideBubble = hideBubbleOnHome \|\| !!isArchive;` y aplicarlo al div del SearchBubble |
| 3 | `/nosotros` NO en `DARK_HERO_ROUTES` → franja blanca de `pt-76px` visible sobre dark hero. | `MainPadding.tsx` | Agregar `/nosotros` a `DARK_HERO_ROUTES` |

**Estado:** ❌ Pendiente — otros chat debe resolver en un commit.

---

## 34. AUDITORÍA VISUAL FULLPAGE — dev.propyte.com 2026-04-28

Auditoría visual completa con Playwright (1440×900 desktop + 390×844 mobile, 25 hojas, 50 screenshots fullPage con scroll progresivo) cruzada con MCP `ui-ux-pro` (patrón Real Estate Tech: Glassmorphism + Trust Blue + Hero-centric + Sales Intelligence dashboard).

**Workspace:** `~/Projects/Propyte/_audit-dev-2026-04-28/` (capture.py, results.json, screenshots/, AUDITORIA-CHAT-CONSTRUCTOR.md).

### 34.1 — CRÍTICOS GLOBALES (bloqueantes)

| # | Bug | Hoja(s) | Fix |
|---|-----|---------|-----|
| 1 | Privacidad / Términos / Cookies son **literalmente la misma página vacía** con badge "En revisión legal" — riesgo LFPDPPP en MX captando leads sin Aviso vigente | `/es/privacidad`, `/es/terminos`, `/es/cookies` | Redactar y publicar 3 documentos con estructura mínima legal. Banner cookie con preferencias granulares. Fecha de última actualización en cada documento |
| 2 | `/es/zonas` y `/es/mercado` renderizan exactamente la misma URL (mismo height 2401px) — bug de routing | `/es/zonas` | Definir: `/zonas` = listado de zonas (cards con foto + ROI + occupancy + índice 0-100); `/mercado` = dashboard de KPIs. Crear ruta dinámica `/es/zonas/[slug]` con detalle por zona |
| 3 | `/es/desarrollos/tulum` muestra "0 Desarrollos · 0 Zonas" + texto auto-generado "uno de los mercados de mayor crecimiento en Mexico con 0 desarrollos activos en 0 zonas" | `/es/desarrollos/tulum`, `/es/desarrollos/cancun`, `/es/desarrollos/playa-del-carmen`, `/es/desarrollos/merida` | Hardcodear fallback de copy cuando count=0. Cargar data real o mostrar "Próximos lanzamientos en Q2 2026" |
| 4 | Built sin `<h1>` (h1_count=0); además acentos perdidos en copy ("Disenar", "Anos") | `/es/built` | Convertir "Diseñar. Construir. Entregar." en `<h1>`. Auditar normalización Unicode en strings dark mode |
| 5 | 52 de 65 `<img>` sin `alt` en /desarrollos (resto de hojas tienen 0/3 — vacías) | `/es/desarrollos` | Auditar `<Image alt>` global con regla ESLint `jsx-a11y/alt-text`. Generar alts descriptivos por carousel slide |
| 6 | Teléfono placeholder `+52 984 000 0000` visible en producción | `/es/contacto` | Reemplazar por número real Propyte. Verificar también `tel:` href |
| 7 | Banner "¿Listo para invertir en la Riviera Maya? · Contactar asesor" idéntico antes del footer en TODAS las hojas | global | Variar copy según contexto: en `/built` "¿Listo para construir tu proyecto?", en `/unete` "¿Listo para crecer con nosotros?", etc. |
| 8 | Sidebar lateral fijo + header pill superior + topbar Anuncia/MXN-USD/ES/Contacto = **triple navegación** que compite y se duplica en mobile | global | Decisión arquitectónica: eliminar sidebar y dejar solo top header sticky. Mover sidebar links a menú hamburguesa secundario. Unificar componente (hoy varía entre `/desarrollos/tulum` vs `/desarrollos`) |

### 34.2 — Catálogo y data (severidad ALTA)

- Solo **1 desarrollo publicado** ("AZUL VIVO") y 5 propiedades. La hoja /desarrollos dice "1 resultados". Antes de QA visual final: cargar mín. 12-20 desarrollos y 30+ propiedades reales o samples aprobados (extender script `tests/qa-data/approve-sample-units.mjs`).
- Métricas de mercado en `—` (em-dashes) en home, /mercado, /zonas. Aplicar pattern **hide-empty-KPI** (ya documentado en 32.3) globalmente — no mostrar dash, ocultar card o badge "Actualizando" + `last_updated`.
- /es/blog **vacío** con cards "Próximamente". Bloquear ruta del header hasta tener ≥6 posts publicados; mientras tanto, hero + newsletter signup como placeholder atractivo.
- /es/promociones con **1 sola promo** (AZUL VIVO) sin % descuento, vigencia, condiciones, countdown. Si no hay 2+ promos reales, mostrar mensaje "Suscríbete para enterarte de nuevas promos".
- /es/equipo-comercial y /es/nosotros/estructura con **avatares de iniciales** (JBP/FL/LL/MQ). Pedir fotos profesionales en fondo neutro a JBP, FL, LF y los +5 asesores antes de publicar. Verificar también ortografía de "Lordy Lopez" y "Mario Quetzal".
- FAQs colapsadas sin preview de respuesta en `/faq`, `/desarrolladores`, `/corredores`, `/unete`. Expandir top 3 por defecto y mostrar primeras 1-2 líneas en el resto. Schema.org `FAQPage` JSON-LD obligatorio.

### 34.3 — Mejoras UX por hoja

#### Home `/es`
- "Propiedades destacadas" muestra 1 card → grid 2×2 o carousel con 6-8.
- Testimonios sin foto/rol/ciudad/métrica → reescribir con foto, nombre, ciudad y resultado (ROI logrado).
- Hero tabs (Departamentos/Casas/Terrenos) + chips (Por ROI/Por precio) amontonados → reorganizar.
- Subir el simulador "Calcula tu ROI en segundos" más arriba (después del hero).
- Faltan: logos de aliados/medios, mapa de cobertura, video institucional 30-60s, trustbar (notario, escrow).
- Mobile: search hero apila vertical demasiado alto; comprimir.

#### `/es/desarrollos`
- Vista Lista/Grid/Mapa toggle (hoy solo split mapa+1card).
- Chips de filtros activos visibles ("Tulum · ×").
- Card sin botones Guardar (corazón), Comparar (checkbox), Brochure download.
- Toggle MXN/USD sin tooltip de fecha del tipo de cambio.
- Hero plano: agregar 3 mini-stats sticky (X desarrollos · Y zonas · ROI promedio Z%).

#### `/es/propiedades`
- Mapa con texto **"Las ubicaciones aún no están disponibles"** — placeholder explícito en producción. Cargar coordenadas o quitar el bloque.
- Cards sin badge de tipo (departamento/casa/terreno) ni estado (preventa/inmediata/usada).
- Filtros idénticos a /desarrollos — diferenciar (propiedades necesita Recámaras, Baños, m², Amueblado).
- Falta toggle Vista grid 2/3/lista + densidad compacta/cómoda.
- Mensaje "X resultados" inconsistente.

#### `/es/rentas` y `/es/mercado`
- Empty state "No hay datos de análisis disponibles" / "Actualizando datos de mercado..." ocupando >60% de hoja. Si feature flag, no exponer hasta tener datos.
- Sin filtros aplicados, mostrar Top 10 zonas por defecto en lugar de "No se encontraron zonas".
- Falta gráfico interactivo de tarifas mes/zona, ranking Top 10, comparador "tu propiedad vs mercado".
- Sección "Metodología" con texto largo → bullets o mover a /faq.

#### `/es/built`
- Cards de proyectos (Residencia Ceiba, Hotel Zenith, Villa Kana, Parque Central PdC, Loft Atelier, Casa Selva) **sin imagen** sobre fondo dark — cargar renders/fotos.
- Métricas "45+ · 120,000+ · 18 · 8" sin labels visibles → etiquetar (Proyectos · m² · Años · Premios).
- Form "Hablemos de tu proyecto" sin dropdown "Tipo de proyecto".
- Footer del Built sin link de regreso explícito a Propyte.

#### `/es/desarrolladores` y `/es/corredores`
- Logos de developers actuales/casos de éxito (incluso con 2-3) para social proof.
- Timeline visual horizontal en "Cómo trabajamos · 4 pasos" con duración por etapa.
- Forms sin validación visual, honeypot, mensaje de éxito tras envío.
- Corredores: publicar **tabla de comisiones** concreta (hoy promete transparencia y nunca la muestra).
- Corredores: agregar selector ciudad multi-select y upload cédula AMPI.

#### `/es/nosotros/quienes-somos`, `/estructura`, `/equipo-comercial`
- Quiénes somos: agregar timeline de fundación, foto oficina, foto grupal, logos aliados/awards.
- Estructura: organigrama simple → interactivo con tooltips/hover (LinkedIn, contacto). "2 Plazas activas" → link a /unete con vacantes.
- Equipo comercial: filtro por ciudad/especialidad, búsqueda, link WhatsApp directo + Calendly por asesor. Sección "Qué buscamos" con bullets red/green sin labels → cambiar a "Sí buscamos / No buscamos".

#### `/es/contacto`
- Mapa Google Maps embebido de oficina Playa del Carmen.
- Form con validación visual (email, teléfono MX), honeypot, reCAPTCHA, mensaje de éxito.
- Bloque social proof junto al form ("+N familias atendidas · X% recomienda Propyte").
- Link a Calendly para agendar videollamada 30 min.
- Horario de respuesta en CTA WhatsApp ("Respondemos en <2h hábiles").

#### `/es/como-comprar`
- 6 pasos numerados → timeline horizontal con progreso o tabs verticales que expanden detalle.
- Por paso: duración estimada, costo aproximado %, documentos, qué puede salir mal.
- Documentos: tabs separadas Residente / Extranjero.
- Trust bar: "Notarios certificados · Abogados aliados · Fideicomiso para extranjeros".
- Video explicativo 2-3 min con asesor.
- Simulador de costos totales (ITP, notario, escrituración, comisión).

#### `/es/como-invertir`
- 3 estrategias (Plusvalía / Renta residencial / Renta vacacional) → gráfico comparativo (barras horizontales).
- ROI por etapa → barra de progreso visual "Preventa 20-40% → Inmediata 0-5%".
- 4 métricas (ROI/Cap Rate/IRR/Cash-on-Cash) → fórmula + ejemplo numérico real ("Propiedad de $3M, renta $25K/mes...").
- Case study real ("María invirtió $X, vendió en Y meses con Z% ganancia").
- Comparador "Real estate vs CETES vs Bolsa vs Fibras" — diferenciador potente.

#### `/es/financiamiento`
- **Calculadora hipotecaria interactiva** (monto, plazo, enganche → mensualidad) — crítica para la categoría.
- Logos bancos aliados (BBVA, Banorte, Santander) en trustbar.
- Link a precalificación online (form con análisis en 24h).
- Tabla "Comparativa rápida" con columna **"Mejor para"** + link "Hablar con asesor especializado".
- Fecha de actualización de tasas ("Actualizado al 28-abr-2026").

#### `/es/faq`
- Search bar con highlight del match.
- Conteo por categoría en tabs ("Compra (4) · Inversión (5)...").
- Expandir top 5 preguntas más visitadas con badge "Más leída".
- Schema.org `FAQPage` JSON-LD.

#### `/es/glosario`
- **Quitar filtros del catálogo** (Ubicación/Precio/Tipo/ROI) que aparecen sin sentido en esta hoja.
- Search por keyword (no solo A-Z).
- Conteo por letra activa.
- Verificar que todos los `[Saber más →]` funcionen (no 404).
- Export PDF "Glosario inmobiliario Propyte" como lead magnet.

#### `/es/promociones`
- Si solo hay 1 promo, mostrar "Estamos negociando descuentos exclusivos · suscríbete" en lugar de la página vacía.
- Card debe incluir: % descuento, vigencia, condiciones, countdown timer, unidades restantes.
- Filtro por descuento %, ciudad, vigencia.
- Suscripción "Avísame de nuevas promos".

#### `/es/unete` (carreras)
- Calculadora de ingresos: "Si vendes X propiedades de $Y al mes, ganas $Z".
- Link a temario/syllabus de "200 horas Academia Propyte".
- Diagrama visual del network income MLM (5 niveles).
- Form con upload CV opcional + textarea "¿Por qué Propyte?".
- Fotos del equipo trabajando (no stock) + video testimonial de un asesor exitoso.

### 34.4 — Transversales (severidad MEDIA)

- Skeleton loaders en cards/mapas en lugar de "—" o "Actualizando datos…" (extiende 32.2 y 32.3).
- Empty states ilustrados (no solo texto) con CTA contextual.
- Toaster global para confirmaciones de form y errores.
- Microinteracciones: hover de cards (translateY -4px + shadow), favoritos (corazón fill), filtros (chip animado).
- Schema.org: `RealEstateListing` por desarrollo/propiedad, `BreadcrumbList` visible + JSON-LD, `FAQPage`, `Organization` con sameAs Instagram/Facebook.
- OG image dedicada por hoja (la home AZUL VIVO foto, /built render, /equipo grupo) — hoy probablemente comparten una sola.
- Footer disclaimer "Propyte es una comercializadora inmobiliaria. Información referencial..." repetido en cada hoja → mover a footer legal único o reescribir en tono confianza ("Datos verificados con 7 fuentes; precios actualizados al [fecha]").
- Topbar "Anuncia tu Desarrollo · MXN/USD · MX ES · Contacto" se pierde en mobile → replicar en menú hamburguesa.
- Tipografía: H1 weight 700, H2 600 con tracking -0.01em (hoy H2 muy similar en peso a párrafo en /mercado, /rentas).
- CTA verde-aqua sin borde/sombra en hover sobre fondo blanco — agregar microvariación.
- Iconografía Lucide genérica → reemplazar al menos los 10 más visibles por set custom de marca.
- Sesión fotográfica profesional de los 4 destinos (Cancún/Playa/Tulum/Mérida) para hero de /desarrollos/[ciudad] y home.

### 34.5 — Ejecución

Bloque **post-Fase 7** (sesiones 31+). Recomendado dividir en sub-fases:

- **34-A** (1 sesión): Críticos legales + bugs de routing (items 1, 2, 3, 6 de 34.1) — bloqueantes producción.
- **34-B** (1 sesión): Catálogo + data real (34.2) + alts/H1/disclaimer (34.1 items 4, 5, 7) — habilita QA visual real.
- **34-C** (2-3 sesiones): UX por hoja (34.3) — pulido página por página, audit por batch.
- **34-D** (1 sesión): Transversales (34.4) — schema, OG, skeletons, microinteracciones.

Workspace y artefactos en `~/Projects/Propyte/_audit-dev-2026-04-28/` para referencia visual durante la ejecución.

### 34.6 — Sprint A: Código puro — 12/12 ✅ CERRADO (2026-04-28)

> 11 commits atómicos `50cdc06 → e845111` + deploy `next-propyte-ki7cf75om-propyte`. Auditor verificó código (`tsc --noEmit` exit 0, `eslint src` 0 violations) + 12 curl live en `dev.propyte.com`. Constructor extendió scope correctamente en items 2 (sweep i18n más allá de namespace built), 7 (regex +/blog/promociones por dark hero propio) y 12 (ComparisonTable también recibe displayScores).

**Hallazgos no-bloqueantes (deuda nueva para sprint próximo):**
1. ⚠️ **Sweep de acentos parcial** — solo cubrió `i18n/messages/es.json`. 4 archivos con metadata hardcoded sin acentos (afecta SEO + JSON-LD):
   - `src/app/[locale]/built/page.tsx:37` — "diseno interior, construccion ... Yucatan"
   - `src/app/[locale]/corredores/page.tsx:50` — "Comercializacion ... Yucatan"
   - `src/app/[locale]/desarrolladores/page.tsx:66` — "Yucatan"
   - `src/app/[locale]/desarrollos/_components/cityConfig.ts:42-46` — "Yucatan", "Merida, Yucatan"
2. ⚠️ **MobileMenu icono duplicado** — `developments` y `advertise` ambos usan `Building2`. Cambiar `advertise` a `Megaphone` o `Briefcase` para diferenciar visualmente
3. ⚠️ **`/rentas` redirect remanente** — `next.config.ts` mantiene `/:locale/rentas → /:locale/mercado?tab=tradicional`. "Sin uso pero documentado" según commit message; candidato a remover si no se va a publicar `/rentas` independiente

**Decisiones del usuario antes del arranque:**
- **A**: Item 7 — ocultar floating header en hojas de contenido (mismo patrón que `isArchive` en `Header.tsx:29-32`).
- **B**: Item 3 — eliminar redirect `/zonas` en `next.config.ts`. `ZonasExplorer` queda como está; rediseño de cards va en Sprint posterior.

**Items + commit cierre:**

| # | Item | Commit | Status |
|---|------|--------|--------|
| 1 | H1 en /built | `516bd4d` | ✅ Live: `<h1 class="sr-only">Diseñar. Construir. Entregar.</h1>` |
| 2 | Acentos rotos | `50cdc06` | ✅ 22 strings en es.json (built/city/property + global). Sweep limpio: 0 matches. Constructor extendió scope correctamente. ⚠️ 4 archivos `.tsx` con metadata hardcoded sin acentos quedan para sprint próximo |
| 3 | /zonas vs /mercado | `7f474cd` | ✅ Live: ambas rutas 200 OK con contenido distinto |
| 4 | imgs sin alt | `e845111` | ✅ Regla ESLint `jsx-a11y/alt-text` como `warn`. 0 violations en src/. Las 52/65 eran Google Maps SDK runtime |
| 5 | FAQs top-3 abiertos | `2777107` | ✅ Live: 3 `aria-expanded="true"` en /faq, /desarrolladores, /corredores, /unete. Multi-open + reset categoría OK |
| 6 | Anuncia mobile | `2574f72` | ✅ Live: "Anuncia tu Desarrollo" en MobileMenu bundle. ⚠️ Icono `Building2` duplicado con `developments` |
| 7 | Floating header en content | `dad3c09` | ✅ Live: 0 ActionsPill en /es/glosario, presente en /es/built y /es. Constructor extendió regex con `/blog` y `/promociones` (correcto, ambas tienen dark hero propio) |
| 8 | Banner pre-footer contextual | `aeb323c` | ✅ Live: home="invertir", built="construir tu proyecto", unete="crecer con nosotros", faq=default. Map ROUTE_CTA_KEY con 5 overrides ES+EN |
| 9 | Mobile FilterBar single button | `4b32a0e` | ✅ Live: `md:hidden flex` button "Filtros (N)" + `md:flex` desktop pills. activeCount: city/price/type/roi/search |
| 10 | Tooltip TC MXN/USD | `d008df9` | ✅ Live: `title="TC: 17.24 MXN/USD · 1 abr 2026"`. `EXCHANGE_RATE_UPDATED_AT='2026-04-01'` en CurrencyContext |
| 11 | "Actualizando" → "Sin datos" | `9861258` | ✅ Live: "Sin datos para esta selección" en /es/mercado. amber→gray |
| 12 | Top 10 fallback /mercado | `8d9fe01` | ✅ Live: "Sin coincidencias para tu filtro. Mostrando Top 10 nacional." en /es/mercado?city=Cozumel. Constructor extendió: `ComparisonTable` también recibe `displayScores` |

**Orden recomendado (más barato → más caro):** 2 → 1 → 3 → 8 → 11 → 5 → 6 → 10 → 12 → 7 → 9 → 4

**Reglas de auditoría:**
- Auditor NO edita código — sólo verifica commits y tacha en Pendientes_Tracker + SPECKIT.
- Cada commit del chat constructor se manda al auditor; auditor confirma fix con código + Playwright si aplica.
- Items que cierran un CRITICO/ALTA/MEDIA de Fase 34: marcar también en sección raíz al cerrar.

**Items Fase 34 que NO toca Sprint A** (van a sprints posteriores):
- 34-A.1 (privacidad/términos/cookies legales) — requiere redacción legal MX
- 34-A.3 (tulum 0/0 desarrollos) — ~~requiere data + plantilla copy~~ ✅ CERRADO Batch 1 commit `9bf7b04`
- 34-A.6 (tel placeholder) — ~~requiere número real Propyte~~ ✅ CERRADO Batch 1 commit `860590c`
- 34-A.8 (eliminar sidebar fully) — decisión arquitectónica mayor (resolución sesión 32: mantener sidebar)

### 34.7 — Batch 1 post-Sprint A — 5/5 ✅ CERRADO (2026-04-29)

> 5 commits atómicos `8924e1d → a12a145`. Cierra 2 CRITICOS restantes (34-A.3 + 34-A.6) y 2 deudas no-bloqueantes de Sprint A (#1 acentos `.tsx` + #2 MobileMenu Megaphone). Build local limpio: `tsc --noEmit` 0 errors, ESLint 0 warnings. Auditor verificó código + curl live en `dev.propyte.com` (4 ciudades empty state + tel real).

| # | Item | Commit | Status |
|---|------|--------|--------|
| 1 | Blog default 2-col fetch sin filtro categoría | `8924e1d` | ⚠️ Workaround técnico al doble `.in()` (status+category) que rompía PostgREST cuando `BLOG_INCLUDE_STAGED=true`. Trae 16 sin filtro y divide en JS. Síntoma visible "Próximamente x8" persiste (root cause es data/env upstream, no código). Degrada cuando >12 posts de una categoría en últimos 16 |
| 2 | Tel real `+52 984 323 5354` | `860590c` | ✅ Live: i18n `info.phone` ES+EN + fallbacks WhatsApp en `ContactPageContent.tsx` y `equipo-comercial/page.tsx` → `529843235354`. Cierra CRITICO 34-A.6. ⚠️ Deuda menor: `formPhonePlaceholder` en form proveedores sigue placeholder; 3 fallbacks `521XXXXXXXXXX` en `WhatsAppButton.tsx` / `ContactSidebar.tsx` / `StickyBar.tsx` no homogeneizados (no rompe en práctica) |
| 3 | Empty state honesto `/desarrollos/[city]` | `9bf7b04` | ✅ Live verificado en /es/desarrollos/{cancun,tulum,playa-del-carmen,merida}: `count > 0` guards en stats, empty state CTA "Próximos lanzamientos en {city}" + "Avísame" + "Explora otras ciudades", `investingDescriptionEmpty` alterno, `name` acentuado SEO + `matchTerm` sin acento para `.ilike()` (DB tiene ambas variantes). Cierra CRITICO 34-A.3 |
| 4 | Acentos JSON-LD metadata | `0c74074` | ✅ 3 ProfessionalService schemas en built/corredores/desarrolladores: "diseno"/"construccion"/"Yucatan"/"Comercializacion" → acentos correctos. + Combinado con commit `9bf7b04` que arregla `cityConfig.ts` (Cancún/Mérida/Yucatán). Cierra deuda Sprint A #1 |
| 5 | MobileMenu icono `Megaphone` | `a12a145` | ✅ "Anuncia tu Desarrollo" diferenciado de "Desarrollos" (Building2). Cierra deuda Sprint A #2 |

**Hallazgos del auditor (no bloquean cierre):**
- ⚠️ **`formPhonePlaceholder`** en `i18n/messages/es.json:771` y `en.json:771` sigue `+52 984 000 0000` (placeholder de input en form proveedores). UX legítimo, pero el audit fullPage detectaba la cadena. Sugerencia: cambiar a un número genérico no-Propyte (ej. `+52 998 123 4567`)
- ⚠️ **3 fallbacks `521XXXXXXXXXX`** sin homogeneizar a `529843235354`:
  - `src/components/shared/WhatsAppButton.tsx:16`
  - `src/components/property/ContactSidebar.tsx:18`
  - `src/components/property/StickyBar.tsx:16`
  No rompe en producción (NEXT_PUBLIC_WHATSAPP_PHONE seteado en Vercel) pero es inconsistencia con el resto del repo
- ⚠️ **Blog 2-col fix técnico no resuelve síntoma visible**. La página `/es/blog` live sigue mostrando 8 cards "Próximamente". Causa probable: `BLOG_INCLUDE_STAGED` no está en `true` en Vercel Production env, o RLS bloquea anon, o `eq('locale','es')` no matchea filas con locale `es-MX`. Investigar antes de Sprint próximo → ✅ **RESUELTO en 34.8 commit `b210bf2`** (root cause definitivo: Next 16 RSC + 'use client' module proxy)
- ✅ Constructor extendió scope correctamente en commit `9bf7b04` cubriendo además `cityConfig.ts` (4to archivo de la deuda Sprint A #1)

**Críticos Fase 34-A restantes** (post-Batch 1):
- 34-A.1 (legal pages) — bloqueado por decisión Luis: redactar drafts genéricos vs proveer documentos legales propios + decisión banner cookies (vanilla vs CookieYes)
- 34-A.8 (eliminar sidebar) — decisión arquitectónica resuelta sesión 32: **mantener sidebar** (no es bug)

### 34.8 — Sesión 33: Fix definitivo blog default 2-col (2026-04-29)

> 5 commits adicionales `58cfcb8 → b1c3b07` (3 debug temporales + 1 fix real + 1 cleanup). Root cause definitivo del blog empty visible identificado mediante endpoint de diagnóstico temporal `/api/debug-blog`. 4 deploys Vercel a `dev.propyte.com` durante el ciclo de diagnóstico. Auditor verificó cleanup limpio (0 referencias a `debugMarker` / `debug-blog` / `DEBUG-MARKER` en `src/`).

**Diagnóstico técnico (ahora documentado en repo):**

Next.js 16 RSC trata los re-exports de constantes desde un módulo con directiva `'use client'` como **proxy functions** cuando se importan a un Server Component. La consecuencia: en `page.tsx` (Server Component) la línea

```ts
import { CAT_ASESORES, CAT_INVERSIONISTAS } from '@/components/blog/BlogHero';  // 'use client'
```

importaba *funciones stub* en vez de las strings `'Para Asesores'` / `'Para Inversionistas'`. El filtro `posts.filter(p => p.category === CAT_INVERSIONISTAS)` siempre devolvía `[]` porque comparaba `string === function`.

El URL filtered (`/blog?categoria=Para%20Inversionistas`) sí funcionaba porque pasaba el string literal por `searchParams`, no por la const importada.

**Fix `b210bf2`:**
- Crear `src/components/blog/categories.ts` (módulo neutro, sin `'use client'`)
- Mover `CAT_ASESORES` + `CAT_INVERSIONISTAS` ahí
- `BlogHero.tsx`, `page.tsx` y `debug-blog/route.ts` importan desde el módulo neutro
- Docstring en `categories.ts` documenta el porqué para futuro

**Verificación live (2026-04-29):**
- `/es/blog` ya renderiza 3 cards reales `Para Inversionistas` (slugs `invertir-en-tulum-2026`, `invertir-preventa-tulum-guia-principiantes`, `invertir-tulum-2026-guia-principiantes`)
- Columna `Para Asesores` sigue empty pero por **gap de data** (WK Blog AI debe generar posts con `category='Para Asesores'`), no por código

**Cleanup `b1c3b07`:**
- `/api/debug-blog/route.ts` removido (50 líneas)
- `debugMarker` + `data-debug-blog` div removidos de `page.tsx`
- Comentario actualizado documenta el motivo del módulo neutro

**Hallazgo Vercel env (no-bloqueante):**
- `BLOG_INCLUDE_STAGED="Save"` (typo literal en valor) → `=== 'true'` da `false` → comportamiento prod-like en staging. Si se quiere ver staged posts en `dev.propyte.com`, fix manual en Vercel dashboard a `"true"`

**Memoria persistida:** `~/.claude/projects/c--Users-Luis/memory/feedback_nextjs_rsc_use_client_const.md`

| # | Commit | Status |
|---|--------|--------|
| 1 | `58cfcb8` `chore(debug): tmp endpoint /api/debug-blog` | ✅ Removido en `b1c3b07` (50 líneas) |
| 2 | `ed6de5d` `chore(debug): marker temporal en /blog` | ✅ Removido en `b1c3b07` |
| 3 | `ad1c969` `chore(debug): expand marker para ver categorías` | ✅ Removido en `b1c3b07` |
| 4 | `b210bf2` `fix(blog): mover CAT_* constants a módulo neutro` | ✅ Live: 3 cards Para Inversionistas en /es/blog. Cierra ALTA Fase 34-B blog empty (parte código) |
| 5 | `b1c3b07` `chore(debug): cleanup` | ✅ 0 referencias debug en src/ |

**Pendientes de data (lado Felipe / sync, NO código):**
- Catálogo casi vacío en prod (1 desarrollo + 5 propiedades) — script `tests/qa-data/approve-sample-units.mjs` listo
- WK Blog AI debe generar posts con `category='Para Asesores'` (columna izquierda /es/blog sigue empty)
- `v_units` sin `roi`/`appreciation`/`capRate`
- `airdna_market_summary.latest_date` null
- `zone_scores` vacía en zonas de desarrollos aprobados

### 34.9 — Batch 3: 34-B code-side + cleanup deudas auditor (2026-04-29)

> 5 commits adicionales `e43f7eb → 31b69e9` + 1 deploy Vercel a `dev.propyte.com`. Cierra 3 ALTA Fase 34-B (`/promociones` empty state + hide-empty-KPI MercadoHero + FAQPage JSON-LD) + 2 deudas no-bloqueantes que el auditor reportó en batches 1-2 (3 fallbacks WhatsApp + formPhonePlaceholder genérico). Auditor verificó código + curl live para FAQPage + grid hero oculto + empty state /promociones.

| # | Commit | Item | Status |
|---|--------|------|--------|
| 1 | `e43f7eb` | Homogeneizar 3 fallbacks WhatsApp `521XXXXXXXXXX` → `529843235354` | ✅ Cierra deuda auditor sesión 33 batch 1. 3 archivos: `WhatsAppButton.tsx:16`, `ContactSidebar.tsx:18`, `StickyBar.tsx:16`. Override por env var sigue prioritario |
| 2 | `117cca0` | `formPhonePlaceholder` genérico `+52 998 123 4567` (área Cancún ficticia) | ✅ Cierra deuda auditor batch 1. Evita re-flag del audit fullPage que detectaba `+52 984 000 0000` (área Propyte real) |
| 3 | `6a3162e` | `/es/promociones` threshold `< 2` empty state honesto | ✅ Live: "Estamos negociando descuentos exclusivos" + dual CTA "Avísame de nuevas promos" + "Ver catálogo completo". 3 occurrencias en HTML cada una. AZUL VIVO oculto del grid (sigue accesible /destacados, /desarrollos). ⚠️ JSON-LD Offer/RealEstateListing aún declara AZUL VIVO — inconsistencia schema vs UI (Google Rich Results podría mostrar "tenemos esta oferta" pero usuario ve empty state). Cierra ALTA Fase 34-B promociones |
| 4 | `0d766c3` | hide-empty-KPI en `MercadoHero` | ✅ Live: grid de 4 KPIs oculto cuando `strStats`/`ltrStats` undefined. Badge amber con dot pulse "Actualizando datos de mercado…". ⚠️ Inconsistencia con Sprint A item 11: `VacacionalKPIs` usa "Sin datos para esta selección" gris (filter context); `MercadoHero` reintroduce "Actualizando" amber (header global onboarding). Razón defendible pero rompe consistencia visual del patrón hide-empty-KPI a nivel sitio. Cierra parcialmente ALTA Fase 34-B em-dashes — table cells (TradicionalTab/ComparisonTable) y detail cards mantienen `—` deliberadamente |
| 5 | `31b69e9` | FAQPage JSON-LD en `/desarrolladores`, `/corredores`, `/unete` | ✅ Live verificado: `"@type":"FAQPage"` + 8 `"@type":"Question"` entities en cada hoja. Reusa `SchemaMarkup type='faq'` en desarrolladores/corredores; `/unete` usa `<script type="application/ld+json">` inline porque ya tenía WebPage schema inline (consistencia con archivo, no entre archivos). i18n keys verificadas: `developers.faq{1..8}{Q,A}`, `brokers.faq{1..8}{Q,A}`, `unete.faq{1..8}{Q,A}` existen ES+EN. Cierra parcial Sprint A item 5 que quedaba pendiente (FAQ schema.org) |

**Hallazgos del auditor (no bloquean cierre):**
- ⚠️ **Schema.org vs UI desalineado en `/promociones`**: el threshold `< 2` oculta AZUL VIVO de la UI visible pero el JSON-LD `Offer` + `RealEstateListing` siguen declarándolo como oferta. Riesgo SEO menor: Google Rich Result podría mostrar "AZUL VIVO Residences" como promoción y al click el usuario ve empty state. Sugerencia: condicionar también el JSON-LD al threshold (`{items.length >= 2 && <SchemaMarkup ... />}`)
- ⚠️ **Inconsistencia copy hide-empty entre componentes**: Sprint A item 11 cambió `VacacionalKPIs` de amber "Actualizando" a gray "Sin datos" (decisión: ser honesto cuando no hay garantía de update inminente). Este batch reintroduce amber "Actualizando" en MercadoHero. Argumentable como diff filter-context vs onboarding-context, pero genera dos patrones visuales para "no data" en el mismo dashboard (`/mercado`)
- ✅ **Cleanup proactivo de deudas auditor**: constructor cerró ambos hallazgos no-bloqueantes (WhatsApp 521XXX + formPhonePlaceholder) antes de avanzar al batch siguiente. Buena higiene de deuda
- ✅ Código limpio: i18n keys validadas, SchemaMarkup type reusado correctamente, threshold lógico (`< 2` vs `=== 0`) más defensivo

**Pendientes lado Luis (no código):**
- Vercel `BLOG_INCLUDE_STAGED="Save"` → `"true"` (1 click dashboard)
- WK Blog AI: 3-4 posts con `category='Para Asesores'`
- ~~Decisión 34-A.1 legal: drafts genéricos vs documentos legales~~ ✅ Cerrado en 34.10 (drafts genéricos publicados)
- Fotos profesionales `/equipo-comercial` + `/nosotros/estructura`

### 34.10 — Batch 4: drafts legales + cleanup deudas batch 3 (2026-04-29)

> 3 commits adicionales `2970d14 → ca0f54f` + 1 deploy Vercel a `dev.propyte.com`. Cierra el último CRÍTICO Fase 34-A pendiente (34-A.1 legal pages) + 2 deudas no-bloqueantes que el auditor reportó en Batch 3 (JSON-LD condicional `/promociones` + comment in-line MercadoHero documentando los 2 patrones empty-state).

| # | Commit | Item | Status |
|---|--------|------|--------|
| 1 | `2970d14` | JSON-LD condicional `/promociones` al threshold UI (`items.length < 2 → null`) | ✅ Live: 0 ocurrencias de `AZUL VIVO`, `CollectionPage`, `Offer`, `RealEstateListing` cuando empty state activo. Schema vs UI consistentes. Cierra deuda auditor batch 3 #1 |
| 2 | `f82a366` | Comment in-line en `MercadoHero.tsx` documentando 2 patrones empty-state | ✅ 5 líneas de comment explicando "onboarding empty" (data NO existe → amber "Actualizando") vs "filter empty" (data existe pero filter sin match → gris "Sin datos") con referencia explícita a commit `9861258` Sprint A item 11. Future-self protected. Cierra deuda auditor batch 3 #2 |
| 3 | `ca0f54f` | Drafts legales `/privacidad` + `/terminos` + `/cookies` (es/en) | ✅ Live verificado 6 URLs (200 OK). `/es/privacidad`: 11 H2 + 13× LFPDPPP + 10× ARCO + INAI + jurisdicción Playa del Carmen. `/es/terminos`: 11 H2 + disclaimer inversión + IP + limitación responsabilidad. `/es/cookies`: 7 H2 + tabla 3 categorías (necesarias/analytics/marketing) + enlaces desactivar 4 navegadores. Footer Footer.tsx:124-126 ya enlazaba. EN versions con `pickLang` inline (11× "Privacy Notice", 0 leakage de strings ES). Componentes nuevos: `LegalPage.tsx` wrapper (76 líneas), `PrivacidadContent.tsx` (105), `TerminosContent.tsx` (79), `CookiesContent.tsx` (79). CSS `.legal-prose` (64 líneas en globals.css). `LegalPlaceholder.tsx` eliminado (-66 líneas). `robots: noindex` mantenido hasta revisión abogado. Cierra CRÍTICO Fase 34-A.1 (riesgo LFPDPPP en MX captando leads sin Aviso vigente) |

**Hallazgos del auditor (no bloquean cierre):**
- ⚠️ **Banner cookies granular pendiente** — los 3 documentos asumen un CMP que aún no existe (`cookies.tsx` referencia `cookieyes-consent` / `cookiebot-*` cookies que no se setean hoy). El "banner de consentimiento" descrito en /cookies sección 3 no está implementado en código todavía. Requiere decisión Luis (Cookiebot/CookieYes vs vanilla impl) antes de remover `noindex`
- ⚠️ **`pickLang` inline duplica strings** — los 3 contenidos legales tienen ~80 strings ES + EN inline en JSX (uno al lado del otro). Aceptable en este caso porque (a) el contenido es long-form y la traducción cambia frase-por-frase, (b) un i18n namespace separado se vuelve un wall de keys plana sin estructura. Trade-off válido para legal pages, no para resto del sitio
- ⚠️ **Email legal hardcodeado** — `privacidad@propyte.com` aparece 16× en /privacidad, 4× en /terminos, 4× en /cookies. Si cambia el email, hay 24 puntos de modificación (vs. 1 en i18n). Sugerencia menor: extraer a const exportada desde `LegalPage.tsx` o env var `NEXT_PUBLIC_LEGAL_EMAIL`. No bloqueante
- ✅ **`robots: { index: false, follow: true }`** — correcto durante draft. Permite que Google siga links salientes pero no indexa el contenido todavía. Cuando abogado revise, cambiar a `{ index: true, follow: true }` y remover badge `draftBadge`
- ✅ **Estructura legal técnicamente válida**: secciones LFPDPPP (responsable, finalidades 1as/2as, ARCO 20 días, INAI escalation), T&C marketplace standard (disclaimers inversión + jurisdicción + IP + limitación responsabilidad), cookies con inventario provisional + browser-level disable links

**Estado Fase 34-A post-Batch 4:** **7/8 cerrados** (resta solo 34-A.8 sidebar = decisión arquitectónica resuelta "mantener")
**Pendientes lado Luis** (no código):
- Vercel `BLOG_INCLUDE_STAGED="Save"` → `"true"`
- WK Blog AI: 3-4 posts `category='Para Asesores'`
- Revisión abogado de los 3 drafts legales antes de remover `noindex`
- Decisión banner cookies (Cookiebot/CookieYes vs vanilla)
- Fotos profesionales `/equipo-comercial` + `/nosotros/estructura`

### 34.11 — Batch 5: cleanup deudas legal Batch 4 + equipo-comercial→Supabase (paralelo) (2026-04-29)

> 3 commits en develop `c8a8455 → 6eead5b` + 1 deploy Vercel. **Constructor reportó 2 commits** que cierran las 2 deudas no-bloqueantes del Batch 4 auditor; el commit `6eead5b` (equipo-comercial → Supabase) entró en paralelo desde otra sesión (Hub admin /equipo) — el constructor explícitamente dijo "no toco ese archivo" pero la otra sesión sí lo committeó al mismo desarrollo branch. Auditor revisa los 3 ya que están en develop.

| # | Commit | Item | Status |
|---|--------|------|--------|
| 1 | `c8a8455` | `src/lib/legal/contacts.ts` con `PRIVACY_EMAIL` + `LEGAL_EMAIL` (override env) | ✅ 0 emails hardcoded fuera de `contacts.ts` (verificado `grep -r 'privacidad@\|legal@' src/`). LegalPage + PrivacidadContent + TerminosContent refactorizados a `{PRIVACY_EMAIL}` / `{LEGAL_EMAIL}`. Cambio futuro = 1 archivo en lugar de 6. Cierra deuda auditor batch 4 #2 |
| 2 | `f7077db` | Cookies §3 future-tense + §2.1 mover cookieyes-consent a nota italics | ✅ Live: 5× "próximamente", 2× "Cuando el banner esté", 2× "Mientras tanto", 2× "Estado:". §3 título cambiado a "Tu consentimiento (próximamente)". Cuerpo: "Estado: se está desplegando ... mientras se implementa, solo se cargan automáticamente las cookies estrictamente necesarias (§2.1); las cookies de analítica y marketing no se activan hasta que el banner de consentimiento esté disponible". Opt-out alternativo: navegador (§4) o email a PRIVACY_EMAIL. §2.1 quita `cookieyes-consent`/`cookiebot-*` del listado y los mueve a italics. Cierra deuda auditor batch 4 #1 |
| 3 | `6eead5b` (paralelo otra sesión) | `/equipo-comercial` lee de `real_estate_hub.v_team_members` en lugar de hardcoded | ⚠️ ISR 600s + on-demand revalidate desde Hub. Avatar con foto si existe + fallback initials con color hash determinístico. WhatsApp link condicional (`phone.length >= 10`). Empty state cuando `teamMembers.length === 0`. **Cierra parcialmente** ALTA Fase 34-B equipo-comercial (cuando Luis cargue seed SQL en Supabase, las fotos profesionales pendientes se renderizan vía Hub CRUD) |

**Hallazgos del auditor (Batch 5):**
- ⚠️ **Bug i18n en commit `6eead5b`** — `equipo-comercial/page.tsx:173` empty state hardcoded en ES: `"Equipo en formación, pronto compartimos detalles."` se muestra idéntico en `/en/nosotros/equipo-comercial` (verificado live: 2 ocurrencias del string ES en HTML del locale EN). Mover a namespace `team` con keys `emptyTitle` / `emptyBody`
- ⚠️ **Regresión de visibilidad** en commit `6eead5b` — hardcode previo de 4 leaders (JBP/FL/LF + 1 placeholder) eliminado del código → página vacía hasta que la otra sesión cargue seed en `v_team_members`. Trade-off arquitectónico defendible (single source of truth = Hub) pero usuarios pierden info de contacto del equipo mientras tanto. **Recomendación**: priorizar `scripts/sql/team-members.sql` + seed en Supabase Editor antes del próximo cache flush de Vercel/ISR. Decisión Luis si reintroducir hardcode temporal hasta que Hub publique
- ⚠️ **`<img>` con eslint-disable** — `Avatar` usa `<img>` plano con disable comment en lugar de `<Image>` next/image. Aceptable para fotos remotas con dimensiones desconocidas, pero pierde optimización LCP/lazy/srcset. Para 4-12 fotos profesionales, considerar `<Image fill>` con sizes específicos
- ✅ **`c8a8455` con override por env** — soporte `NEXT_PUBLIC_PRIVACY_EMAIL` / `NEXT_PUBLIC_LEGAL_EMAIL` permite distinguir staging/prod. Bonus point — el auditor solo pidió "extraer a const", el constructor extendió scope con env override (consistente con el patrón de `NEXT_PUBLIC_WHATSAPP_PHONE` ya usado en el repo)
- ✅ **`f7077db` mantiene §4 intacto** — el "Independientemente de nuestro banner de consentimiento, puedes configurar tu navegador" en §4 técnicamente menciona el banner pero está acotado por §3 como "próximamente". Aceptable; cuando el CMP se deploye, este texto sigue siendo válido. No requiere fix paralelo
- ✅ **Constructor explícito sobre el out-of-scope** — el mensaje del Batch 5 declaró "hay edits en curso desde otra sesión... No toco ese archivo". Aunque el commit `6eead5b` está en develop con el mismo author email, la transparencia evita confusión sobre quién hizo qué

**Estado post-Batch 5:**
- **Fase 34-A: 7/8 cerrados** (sin cambio — resta sólo 34-A.8 sidebar mantener)
- **Fase 34-B código: 7/9 + 1 parcial** (`/equipo-comercial` parcial via 6eead5b, espera seed data)
- **Deudas auditor**: 0 abiertas tras Batch 5 + 3 nuevas del 6eead5b (1 i18n, 1 visibilidad, 1 `<img>` opt-in)
- Listo para Fase 34-C (UX por hoja) cuando Luis indique

### 34.12 — Batch 6: cleanup deuda i18n batch 5 (2026-04-29)

> 1 commit `d1a6e1a` + 1 deploy Vercel a `dev.propyte.com`. Cierra la deuda #1 del commit paralelo `6eead5b` (bug i18n empty state hardcoded en ES). Las deudas #2 (regresión visibilidad) y #3 (`<img>` vs `<Image>`) quedan en backlog explícito a decisión Luis.

| # | Commit | Item | Status |
|---|--------|------|--------|
| 1 | `d1a6e1a` | Empty state `/equipo-comercial` respeta locale | ✅ Live verificado: `/es` muestra "Equipo en formación" + "Pronto compartiremos los perfiles del equipo. Mientras tanto, contáctanos para conectarte con un asesor." · `/en` muestra "Team coming together" + "We'll be sharing team profiles soon. In the meantime, contact us to connect with an advisor." 0 leakage del string ES en EN. 2 keys nuevas en namespace `about`: `teamEmptyTitle` + `teamEmptyBody`. Estructura `h3 + p` consistente con city pages + /promociones empty states. Padding mobile `px-6` agregado. Cierra deuda auditor batch 5 #1 |

**Hallazgos del auditor (Batch 6):**
- ✅ **Cleanup quirúrgico** — 1 commit, 3 archivos (page.tsx + es.json + en.json), 0 efectos colaterales
- ✅ **Estructura consistente con resto del repo** — `h3 + p` ya es el patrón de empty states en city pages (Cancún/Mérida/etc), `/promociones`, `/blog`. Constructor reconoció el patrón y lo aplicó
- ✅ **Constructor explícito sobre deudas remanentes** — declaró que #2 (regresión visibilidad) requiere OK Luis antes de agregar fallback, y #3 (`<img>`) queda en backlog para 20+ fotos. No actuó por su cuenta sobre lo que requiere decisión humana

**Estado post-Batch 6:**
- **Fase 34-A: 7/8 cerrados** (sin cambio)
- **Fase 34-B código: 7/9 + 1 parcial** (sin cambio en items raíz)
- **Deudas auditor activas:** 2 abiertas del commit paralelo `6eead5b` (regresión visibilidad temporal + `<img>` opt-in), ambas con decisión humana explícitamente bloqueada
- Listo para Fase 34-C (UX por hoja) cuando Luis indique

---

### 34.13 — Sesión 34 Batch 2: Glosario search + Mobile MXN/USD + Schema.org sameAs + CI bump + PropertySpecs defensa (2026-04-30)

> 5 commits `23dde3f → 8456a67` + deploy `dpl_6KoRwunTZXVHcZmfp2bbmsqyhYNo`. Cierra 2 BAJA backlog Sesión 32 + avanza 3 parciales (34-C glosario, 34-D MXN/USD mobile, 34-D Schema.org sameAs).

| # | Commit | Item | Status |
|---|--------|------|--------|
| 1 | `23dde3f` | PropertySpecs defensa MISSING_MESSAGE `1BR/1BA` | ✅ `safeType`/`safeStage` try/catch wrappers consistentes con `UnitModelsTable.tsx`. Fallback string raw cuando `unit_type` está fuera de enum 8 valores. Cierra BAJA backlog Sesión 32 (defensa-en-código). Pendiente data cleanup DB + enum constraint |
| 2 | `9397fa2` | Glosario search keyword + conteo letra | ✅ GlosarioClient.tsx (143 líneas) split del server page. Search input con normalización Unicode NFD strip diacritics, matchea name + def. Letter nav muestra solo letras presentes tras filtro con conteo `(N)` tabular-nums. Empty state "No se encontraron términos…" con `role="status"`. SSR + DefinedTermSet JSON-LD intactos. Live verificado /es/glosario 200 |
| 3 | `fd53edc` | CurrencyToggle MXN/USD en MobileMenu drawer | ✅ Prop `tone='light'\|'dark'` con default `light` retro-compatible. Active teal `#5CE0D2` sobre navy `#0F1923`. Inactive `text-white/60` pasa AA por regla /55+. Sección "Moneda" antes de "Idioma" en drawer. Keys `nav.currency` ES+EN |
| 4 | `3df8ba8` | CI bump checkout v5 + setup-node v6 | ✅ Cierra BAJA Sesión 32 (deadline 2-jun-2026 Node 20 deprecation). `node-version: 22` del proyecto sin tocar (independiente de runtime de actions) |
| 5 | `8456a67` | Schema.org sameAs IG/FB + telephone real | ✅ Organization + LocalBusiness incluyen `sameAs:[instagram.com/propyte.mx, facebook.com/propyte]` (match exacto con Footer.tsx:63,72). Telephone real `+529843235354` reemplaza placeholder `+52XXXXXXXXXX` en LocalBusiness; agrega telephone explícito en Organization. Live verificado en JSON-LD home: `"telephone":"+529843235354"` + sameAs IG+FB rendered |

**Hallazgos del auditor (Batch 2):**

✅ **Bien hecho:**
- PropertySpecs aplica el mismo patrón try/catch que ya estaba en UnitModelsTable — no introduce duplicación, sigue convención existente
- Glosario mantiene SSR + JSON-LD `DefinedTermSet` intactos (server hace los terms hardcoded i18n con `getTranslations`, client sólo filtra). Normalización Unicode NFD correcta para "fideicomiso" sin acento ↔ "fideicomiso" con acento
- CurrencyToggle prop opcional con default light → callsites previos no requieren update. WCAG verificado contra regla del repo
- Schema.org URLs sameAs hacen match exacto con Footer (no se inventaron URLs); telephone consistente con `i18n.info.phone` ya seteado en commit `860590c`
- CI bump quirúrgico (2 líneas), independiente del Node del proyecto

❌ **Errores / huecos:**
- **Dead code en glosario**: keys `glosario.resultsCount` ICU plural añadidas en es+en.json:1621 pero NUNCA consumidas en `GlosarioClient.tsx`. Probable que se planeó renderizar contador junto al search input y se olvidó cablear. Action: cablear (e.g. debajo del letter nav cuando `query` no vacío) o borrar
- **Higiene de commit `fd53edc`**: arrastró 2 archivos QA untracked previos (`tests/qa-data/check-blog-in.mjs` 22 líneas + `tests/qa-phase4/audit-session-final.mjs` 175 líneas) por uso de `git add -A`. No rompe deploy, contamina changelog del feat MobileMenu. Hábito a evitar en próximos batches
- **Glosario search bar NO sticky**: solo letter nav con `top-16`. Con catálogo de 22 términos no se nota; con scroll y filtro activo, el input desaparece de la vista. UX leve. Sugerencia: wrapper sticky compartido con backdrop-blur
- **Wording commit `3df8ba8`**: dice "v5/v6 ya corren en Node 24 nativo" — confunde runtime de la action con `node-version: 22` del proyecto (que no cambió). El cambio es correcto, sólo es nota cosmética
- **Schema.org sameAs incompleto**: si Propyte tiene LinkedIn/YouTube/TikTok activos, deberían listarse para Knowledge Graph. Verificar con marketing antes de cerrar 34-D Schema.org parcial

**Estado post-Batch 2 Sesión 34:**
- **Fase 34-A: 7/8 cerrados** (sin cambio)
- **Fase 34-B código: 7/9 + 1 parcial** (sin cambio)
- **Fase 34-C (UX por hoja): 3 parciales** (`/financiamiento` calc + bancos, `/como-invertir` comparador, `/glosario` search+conteo)
- **Fase 34-D (Transversales): 2 parciales** (banner contextual cerrado prev; MXN/USD mobile cerrado este batch; Schema.org sameAs cerrado este batch)
- **Backlog técnico Sesión 32: 2/4 cerrados** (CI bump + PropertySpecs defensa). Quedan 2 BAJA (RentalDashboard useTransition refactor + AirDNA market_summary view nombre)
- Recomendación auditor para batch 3: priorizar `/desarrollos` chips removibles + botones card (alto tráfico, cierra 34-C real) o `BreadcrumbList` JSON-LD global (bajo costo, alto SEO)

---

### 34.14 — Sesión 34 Batch 3: Glosario sticky+counter + FilterBar chips + useFavorites (2026-04-30)

> 3 commits `176eedd → abc658a` + deploy `dpl_6fBoFsaNomg9uxoVDju5RyN5ZFcA`. Cierra deudas auditor batch 2 + avanza 2 ítems Fase 34-C (chips removibles + heart persistente en card). Constructor identificó correctamente que `BreadcrumbList` ya estaba implementado de origen.

| # | Commit | Item | Status |
|---|--------|------|--------|
| 1 | `176eedd` | Glosario fix completo: cablea `resultsCount` ICU plural + sticky combinado | ✅ Search + counter + letter nav en único `sticky top-16 z-10 bg-white/95 backdrop-blur-md border-b shadow-sm`. Counter renderiza solo con `isSearching`. ICU plural via `tG('resultsCount',{count})` directo (next-intl resuelve nativamente, decisión correcta sobre escribir formatter manual). `role="status" + aria-live="polite"`. Cierra deudas auditor batch 2 (dead key + sticky perdido). Live verificado |
| 2 | `8c579de` | FilterBar chips removibles + clearAll | ✅ Array `activeChips` con `{key, label, clear}` por filtro (search/city/price/type/roi). `Limpiar todo` aparece con 2+ chips. Drawer-only filtros (stage/usage) excluidos por diseño (esos tienen su propio reset en MobileFilters). Aplica a /desarrollos + /propiedades (ambos consumen MarketplaceContent → FilterBar). Live verificado /es/desarrollos?city=Tulum |
| 3 | `abc658a` | useFavorites hook + heart persistente | ✅ Implementación canónica `useSyncExternalStore`. `getServerSnapshot=EMPTY_SET` (referencia estable, 0 hydration mismatch). Custom event `propyte:favorites-changed` necesario porque `storage` event no fire same-tab. `queueMicrotask(callback)` gatilla re-render tras subscribe inicial. MarketplaceCard agrega `aria-pressed={saved}` + `type="button"` + focus-visible ring teal |

**Hallazgos del auditor (Batch 3):**

✅ **Bien hecho:**
- Constructor cerró las 2 deudas auditor batch 2 con precisión: `resultsCount` cableado correctamente con ICU plural directo, sticky combinado en un único contenedor
- Decisión de excluir drawer-only filtros del chip-set bien justificada (esos tienen su propio reset)
- `useFavorites` con patrón canónico React 18+: `useSyncExternalStore` + getServerSnapshot estable evita hydration mismatch sin hacks
- Constructor identificó correctamente que `BreadcrumbList` JSON-LD ya estaba implementado de origen en `Breadcrumbs.tsx:37-53` y aplicado en 14 hojas — auditor confirma. El item del audit estaba cerrado de origen
- Live verificado: `/es/desarrollos?city=Tulum` renderiza chips + "Limpiar todo"; `/es/glosario` con sticky combinado y backdrop-blur

❌ **Errores / huecos:**
- **Falta `safeType` wrapper en FilterBar:127**: `tTypes(filters.type as 'departamento')` tiene mismo riesgo MISSING_MESSAGE que motivó commit `23dde3f` para PropertySpecs. Inconsistente con la defensa ya aplicada. Severidad baja porque `filters.type` viene de dropdown controlado pero defense-in-depth correspondería
- **Redundancia ARIA leve en glosario counter**: `role="status"` ya implica `aria-live="polite"` por default. Cosmético, 1 línea
- **`writeSet` doble-set**: setea `cachedSnapshot` directo + dispatch event que dispara listener que vuelve a leer/setear. Optimización menor, no urgente
- **FOUC potencial 1-frame en hearts**: hard reload con favoritos previos → SSR/getServerSnapshot=EMPTY_SET (correcto) → tras hydration+subscribe+microtask se actualiza. Trade-off acertado vs `useLayoutEffect` que rompería SSR

**Sobre la pregunta del constructor (Comparar vs Brochure):**

Auditor verificó que **`brochure_url` SÍ existe en el data layer**:
- `src/types/property.ts:72` ya tiene `brochure?: string`
- `src/lib/mappers/development-to-property.ts:125` ya hace `brochure: row.brochure_url ?? undefined`
- `src/lib/supabase/types.ts:85` ya tiene `brochure_url: string | null` en schema

El mapper ya pone el campo en el `Property` que renderiza la card. **No es deuda de data**, sólo render condicional `{property.brochure && <a href={property.brochure} download>...}` en MarketplaceCard. ~10 líneas. Procede directo.

**Estado post-Batch 3 Sesión 34:**
- **Fase 34-A: 7/8 cerrados** (sin cambio)
- **Fase 34-B código: 7/9 + 1 parcial** (sin cambio)
- **Fase 34-C (UX por hoja): 5 parciales** (financiamiento, como-invertir, glosario completo modulo links/PDF, /desarrollos chips+heart, /propiedades chips+heart)
- **Fase 34-D (Transversales): 2 parciales** + auditor confirma BreadcrumbList ya cerrado de origen, queda solo RealEstateListing por desarrollo individual
- Recomendación auditor para batch 4:
  - Commit 1: fix `safeType` en FilterBar (deuda batch 3)
  - Commit 2: brochure download icon en MarketplaceCard (cierra 34-C parcial, ~10 líneas)
  - Commit 3+4: useCompare hook + ComparePanel UI (cierra último item card de 34-C)
  - Bonus: vista toggle Lista/Grid/Mapa en /desarrollos (cierra 34-C casi completo)

---

### 34.15 — Sesión 34 Batch 4: safeType + Brochure + Dedupe chips + Compare panel (2026-04-30)

> 4 commits `f1fd865 → 2e64a43` + deploy `next-propyte-65meo6jw7-propyte`. Cierra deudas auditor batch 3 (safeType + aria cleanup) + completa card actions row (Guardar/Comparar/Brochure los 3 funcionales). Detección y fix de regresión doble chip-row introducida en batch 2.

| # | Commit | Item | Status |
|---|--------|------|--------|
| 1 | `f1fd865` | safeType en FilterBar + aria-live cleanup glosario | ✅ Cierra ambas deudas auditor batch 3. `safeType` con try/catch aplicado en 2 callsites (chip label + pill activeLabel). Mismo patrón que PropertySpecs/UnitModelsTable. `aria-live="polite"` removido del `<p role="status">` glosario |
| 2 | `60e2fc9` | Brochure download icon | ✅ Path correcto: `property.assets?.brochure` (no `property.brochure` — auditor sugería el path equivocado, constructor corrigió). Anchor con `download + target="_blank" + rel="noopener noreferrer"` + `e.stopPropagation()` para no disparar Link card. Top-right action stack con flex-col gap-1.5 |
| 3 | `0472778` | Dedupe chips → single-source en FilterBar | ✅ Detección crítica: `MarketplaceContent` ya tenía su propio chip-row (líneas 37-57+75-84) lo que generaba doble-render tras `8c579de`. FilterBar absorbe stage+usage con `safeStage`/`safeUsage`. MarketplaceContent pierde activeChips array, priceFmt, FilterChip+MAX_PRICE imports. ⚠️ Claim "/desarrolladores gana chips" es **FALSO** — esa página tiene filter inline propio (DevelopersPageContent.tsx:60), no usa marketplace FilterBar |
| 4 | `2e64a43` | useCompare + ComparePanel + modal | ✅ Mismo patrón canónico que useFavorites. `MAX_COMPARE=4` exportado. `Object.freeze` para inmutabilidad. `toggle` retorna `{ok, reason}` aunque MarketplaceCard ignora return (depende de `disabled` flag). ComparePanel sticky `bottom-0 z-40` con `safe-area-inset-bottom`. Modal con `aria-modal=true`, body scroll lock cleanup correcto, click backdrop close, sticky thead `top-0` dentro de scroll container. `modalOpen = open && selected.length > 0` derivado evita setState-in-effect |

**Hallazgos del auditor (Batch 4):**

✅ **Bien hecho:**
- Constructor cerró las 2 deudas auditor batch 3 con precisión quirúrgica
- Detectó y corrigió regresión doble chip-row de su propio commit batch 2 (`8c579de`) durante implementación de Compare — el smoke test no la detectó porque grep mostraba ambos. Buen self-audit
- Corrección del path `property.assets.brochure` (auditor sugería `property.brochure` equivocado) — buena lectura de tipos antes de implementar
- `useCompare` arquitectónicamente idéntico a useFavorites (singleton module-level + useSyncExternalStore + same-tab event + cross-tab event), ofrece consistencia fuerte
- ComparePanel mounted en MarketplaceContent → activo en /propiedades + /desarrollos (que reusa MarketplaceContent)
- Decisión de modal inline sobre ruta `/comparar` justificada (menos código, sin URL state), con concesión explícita de "si quieres deep-link, requiere otro commit"
- Live verificado: `aria-label` rendered correctamente, sticky bar + modal operativos en código

❌ **Errores / huecos:**
- **🔴 BUG WhatsAppButton vs ComparePanel overlap (CRÍTICO antes merge a main)**: WhatsAppButton (`fixed right-6 z-50 bottom: max(1.5rem, env(safe-area-inset-bottom)+1.25rem)`) se renderiza ENCIMA del CTA "Comparar →" del ComparePanel (`z-40`, también right-aligned). Constructor predijo el bug en su mensaje pero no lo arregló. Fix: WhatsAppButton lee `useCompare().count` y suma `~5rem` al bottom cuando count>0. Aplica a layout global (`layout.tsx:52`)
- **❌ Claim falso en commit `0472778`**: "/desarrolladores gana chips por primera vez como bonus" — verificado: esa página tiene su propio filter inline en `DevelopersPageContent.tsx:60-79` (search input + city select), NO importa la `FilterBar` del marketplace. El claim del commit message es incorrecto; no hay daño funcional
- **⚠️ Modal a11y gaps**:
  - Falta handler ESC key para cerrar (estándar `aria-modal=true`)
  - Falta focus trap (Tab puede salir del modal hacia el body)
  - Falta auto-focus al primer interactive del modal al abrir (botón close)
- **⚠️ Mixed-kind compare confusion**: si usuario selecciona desarrollos en /desarrollos + unidades en /propiedades, localStorage acumula 4 IDs mezclados pero el ComparePanel filtra por `byId` del array `properties` actual → solo muestra los del kind de la página. IDs huérfanos persisten silenciosamente. Mitigación posible: refuse cross-kind add o reset on kind change con toast
- **⚠️ `disabled + aria-pressed` en compare button**: `disabled` HTML attribute previene focus por tab → SR no escucha `title="Máximo 4..."`. Mobile users sin tooltip se quedan sin feedback al 5to tap. `useCompare.toggle` retorna `{ok:false, reason:'full'}` pero MarketplaceCard ignora el return — sería trivial cablear un toast pero queda como deuda futura

**Estado post-Batch 4 Sesión 34:**
- **Fase 34-A: 7/8 cerrados** (sin cambio)
- **Fase 34-B código: 7/9 + 1 parcial** (sin cambio)
- **Fase 34-C (UX por hoja): 5 parciales** — `/desarrollos` y `/propiedades` cards completos (Guardar+Brochure+Comparar). Pendiente vista Lista/Grid/Mapa toggle (decisión UX abierta), badges tipo/estado, filtros recámaras/baños/m² para /propiedades
- **Fase 34-D (Transversales): 2 parciales** sin cambio
- **Deuda auditor batch 3: 4 cerradas (safeType + aria cleanup) + 0 abiertas previas**
- **Deuda auditor batch 4 abierta: 1 crítica (WA overlap) + 4 minor (claim false, modal a11y x3, mixed-kind confusion)**

**Recomendación auditor para batch 5:**
- Commit 1: WhatsAppButton lee `useCompare().count` y suma offset (cierra bug crítico)
- Commit 2: ESC key + focus trap básico en ComparePanel modal (a11y)
- Commit 3+: Skeleton loaders en cards/mapas + microinteracciones hover (cierra 34-D, sin dependencias externas)
- Bonus si alcanza: hero homepage estructural (placeholders para fotos pendientes Luis)
- **Vista toggle Lista/Grid/Mapa pendiente wireframe Luis** — el split 60/40 actual ya cumple Mapa+Lista; agregar 4 toggles fragmenta UX sin guía
- **`/como-comprar` timeline pendiente data Luis** — duración + costos % por paso

---

### 34.16 — Sesión 34 Batch 5: WA fix + ESC modal + 4 Skeletons + hover-lift (2026-04-30)

> 2 commits `618a68f`+`1449042` + deploy `next-propyte-1y241cuxf-propyte`. Cierra bug crítico WA overlap señalado por auditor batch 4 + ESC modal a11y. Cobertura Skeleton +4 rutas alto tráfico (blog/mercado/detail x2). Microinteracciones hover-lift respetando `prefers-reduced-motion`.

| # | Commit | Item | Status |
|---|--------|------|--------|
| 1 | `618a68f` | WA respeta ComparePanel + ESC modal | ✅ WhatsAppButton lee `useCompare().count`; cuando >0, sube bottom de `1.25rem`→`5rem` para no taparse con sticky bar (~64px). `transition-[bottom,opacity,transform]` evita transitionear bg accidental. Cleanup `md:bottom-6` no-op. ComparePanel modal gana ESC keydown listener dentro del mismo `useEffect` del scroll lock — cleanup unificado en return. Cierra bug crítico auditor batch 4 + ESC handler. Focus trap formal queda agendado |
| 2 | `1449042` | Skeletons + hover-lift | ✅ 4 nuevos `loading.tsx`: /blog (hero navy + grid 3-col 6 cards skeleton article), /mercado (hero + 4 KPI strip + tabs + 8-row table), /desarrollos/[slug] + /propiedades/[slug] (gallery 16:9 + 6 thumbs + title + 4 metric cards + sticky sidebar). MarketplaceCard hover `-translate-y-1 + shadow-lg + transition-[transform,box-shadow] duration-200` con `motion-reduce:hover:translate-y-0 motion-reduce:transition-none`. MapView skip justificado (Google Maps SDK no expone `tilesloaded` callback confiable; placeholder produciría flicker). Live /blog/mercado/azul-vivo 200 |

**Hallazgos del auditor (Batch 5):**

✅ **Bien hecho:**
- Constructor cerró bug crítico WA con math correcta (5rem clearance vs ~4rem panel + safe-area)
- `transition-[bottom,opacity,transform]` evita transitionear `background-color` (snap esperado al cambiar bg-color, pero sin bug en bottom slide)
- ESC handler dentro del `useEffect` del scroll lock — lifecycle correcto, evita listener huérfano
- Skeleton.tsx existente reusado correctamente; layouts replican estructura SSR fidedignamente
- `motion-reduce` respetado en hover-lift — accesibilidad correcta
- Decisión skip MapView bien justificada con disclaimer técnico

❌ **Errores / huecos (sin bloqueantes):**
- **Duplicación de loading.tsx detail**: `desarrollos/[slug]/loading.tsx` y `propiedades/[slug]/loading.tsx` byte-idénticos (65 líneas). Refactor sugerido: `<DetailSkeleton/>` shared component
- **Hover bg-color snap**: `transition-[bottom,opacity,transform]` excluye `background-color`. `hover:bg-[#1EBE57]` ahora cambia instantáneamente sin transición. Cosmético; agregar `background-color` al list resuelve
- **Claim "0 sin protección"**: precision matters — quedan rutas estáticas sin loading.tsx (glosario/financiamiento/contacto/faq) pero no necesitan skeleton porque son SSR con contenido inmediato. Constructor framing correcto en spirit, exagerado en letra
- **FOUC potencial WA**: hard reload con compares previos → primer render bottom 1.25rem; tras hydration 5rem. WA hidden hasta scrollY>300 → invisible en práctica
- **Pendientes auditor batch 4 NO cerrados (declarados explícitos)**: focus trap formal modal (agendado), cross-kind compare reset toast (decisión de producto), `disabled+aria-pressed` 5to-tap feedback mobile (mismo origen, requiere toast)

**Estado post-Batch 5 Sesión 34:**
- **Fase 34-A: 7/8 cerrados** (sin cambio)
- **Fase 34-B código: 7/9 + 1 parcial** (sin cambio)
- **Fase 34-C: 5 parciales** (sin cambio en items raíz; deuda batch 3 toast 5to-tap se cerrará junto con Toaster global)
- **Fase 34-D: 3 parciales** — Skeletons + microinteracciones cierran parcial (loading.tsx +4 rutas + hover-lift). Banner contextual + MXN/USD mobile cerrados batch previos. Schema.org sameAs cerrado. Quedan: RealEstateListing por desarrollo, OG image dedicada por hoja, Toaster + EmptyState ilustrado, disclaimer rewrite + footer legal único, sesión fotográfica
- **Deuda auditor batch 4 abierta cerrada: 2/2** (WA overlap + ESC modal). Quedan agendados: focus trap, cross-kind compare, toast 5to-tap

**Recomendación auditor para batch 6:**
- Toaster global (sugerencia: `sonner` — 1 import + 1 provider, API limpia)
- Cablear toast en `useCompare.toggle` cuando `{ok:false, reason:'full'}` → cierra deuda mobile-no-tooltip batch 3
- Cablear toast en form contacto submit success/error
- EmptyState component reutilizable con illustration + CTA
- Aplicar EmptyState a /blog (vacío), /promociones (<2 promos), /equipo-comercial (sin seed), /desarrollos/[ciudad] (0 desarrollos)
- Bonus: `/propiedades` badges tipo (depto/casa/terreno) + estado (preventa/inmediata/usada) en MarketplaceCard
- **Hero homepage queda para batch 7** cuando Luis suba fotos profesionales 4 destinos

---

### 34.17 — Sesión 34 Batch 6: Sonner toaster + EmptyState + badges card (2026-04-30)

> 3 commits `959f27c`+`dd64d42`+`02191f8` + deploy `next-propyte-mlzyupvtp-propyte`. Cierra Fase 34-D item Skeletons+empty+toaster+microinteracciones completo. Cierra deuda mobile-no-tooltip auditor batch 3 (5to-tap compare). Bonus badges /propiedades tipo+estado.

| # | Commit | Item | Status |
|---|--------|------|--------|
| 1 | `959f27c` | Sonner toaster + 5to-tap + form contacto | ✅ `sonner ^2.0.7` instalado, `<Toaster bottom-center richColors closeButton font-sans>` en locale layout. Compare 5to-tap → `toast.warning(cardCompareFull)`. Cambio `disabled→aria-disabled` para que onClick fire en mobile (cierra deuda batch 3 mobile-no-tooltip). Form contacto submit → toast.success/error con keys `formSuccessToast`/`formErrorToast` ES+EN. Status state inline mantenido como secondary feedback |
| 2 | `dd64d42` | EmptyState component + 4 hojas migradas | ✅ Componente reutilizable: icon LucideIcon en círculo teal + title + description + actions[] (primary/secondary, internal Link o external `<a>`), `tone='light'\|'dark'`, `role="status"` para SR. CTAs con focus-visible ring. Migración: /blog (BookOpen + 2 CTAs nuevas: emptyStateBody/emptyStateCtaContact/emptyStateCtaBack), /promociones (Tag, mantiene keys), /equipo-comercial (Users + 2 CTAs nuevas: teamEmptyCtaContact/teamEmptyCtaJoin), /desarrollos/[ciudad] (Building2). 4 hojas con tono visual y CTAs primary+secondary consistentes |
| 3 | `02191f8` | Stage + Type badges con safe wrappers | ✅ Stage badge antes solo si `property.badge`, ahora fallback a `property.stage` (siempre visible). `(badge ?? stage) as Exclude<PropertyBadge, null>` cast TS-safe verificado: los 3 valores PropertyStage (preventa/construccion/entrega_inmediata) están todos en PropertyBadge. badgeColors cubre 7 valores + `\|\| 'bg-gray-600'` fallback. Type badge solo en `kind==='unit'` (pill blanca translúcida con backdrop-blur). safeStage+safeType wrappers consistentes con patrón repo. flex-col items-start gap-1 para apilar |

**Hallazgos del auditor (Batch 6):**

✅ **Bien hecho:**
- `sonner` elección acertada: 1 dep, sin radix-bloat, API limpia. Mounted en locale layout (cubre todo el árbol)
- `disabled→aria-disabled` en compare button cuando `compareFull && !comparing` — decisión UX correcta. Mobile sin tooltip ahora tiene feedback claro vía toast
- EmptyState API bien diseñado: `actions[]` con variants + external flag cubre los 4 casos de migración. `tone='dark'` permite reuso futuro sobre fondos navy
- Migración de las 4 hojas reduce código ad-hoc (~40 líneas neto eliminadas) y unifica visual+a11y
- Stage badge fallback verificado tipo-correcto: PropertyStage ⊂ PropertyBadge, cast safe
- `safeStage`/`safeType` con try/catch consistente con patrón establecido del repo
- Live: /blog 200, /promociones 200, /tulum 200, `Toaster` rendered en home

❌ **Errores / huecos (sin bloqueantes):**
- **Sonner `bottom-center` puede overlapear ComparePanel sticky 4s al 5to-tap**: el toast.warning aparece en bottom-center con z-index ~2147483647 > z-40 ComparePanel. Por 4s tapa la chip-row de items seleccionados. Sugerencia: `position="top-center"` en `<Toaster>` (1 línea), también queda lejos de WhatsApp flotante
- **EmptyState `key={action.href + action.label}` collision risk**: improbable pero posible si dos actions tienen mismo href+label exacto. Más robusto: `key={action.label}` o índice
- **EmptyState wrappers ad-hoc por hoja**: cada migración envuelve EmptyState en un `<div>` distinto (max-w-xl bg-white rounded-2xl en /promociones, max-w-2xl bg-[#F4F6F8] en /equipo-comercial, dashed-border teal en /desarrollos/[ciudad], sin wrapper en /blog). Visual consistency parcial. Si quieres total consistencia: variantes built-in en el componente
- **Sonner `richColors` warning sale amarillo default**: si quieres marca-consistente, customizar `toastOptions.classNames.warning` con teal/amber suave del design system Propyte. Cosmético
- **Type badge solo en units**: para developments queda solo stage badge. Decisión de producto correcta (developments agrupan múltiples tipos), pero implica que `/desarrollos` listing muestra solo stage, no tipo
- **Pendientes batch 4 declarados explícitos NO cerrados**: focus trap modal (agendado), cross-kind compare (decisión producto), DetailSkeleton refactor (minor)

**Estado post-Batch 6 Sesión 34:**
- **Fase 34-A: 7/8 cerrados** (sin cambio)
- **Fase 34-B código: 7/9 + 1 parcial** (sin cambio)
- **Fase 34-C: 5 parciales** (sin cambio en items raíz; deuda batch 3 mobile-no-tooltip CERRADA via toast 5to-tap)
- **Fase 34-D: 3 parciales + 1 CERRADO** (`Skeletons+empty+toaster+microinteracciones` completo). Quedan: RealEstateListing por desarrollo, OG image dedicada, disclaimer rewrite, sesión fotográfica. Schema.org sameAs + BreadcrumbList + FAQPage cerrados
- **Deudas auditor abiertas**: 0 críticas. Sólo cosméticas (sonner position, EmptyState key, wrappers, richColors). Pendientes agendados: focus trap, cross-kind, DetailSkeleton

**Recomendación auditor para batch 7:**
- **Schema.org `RealEstateListing` JSON-LD** helper en SchemaMarkup.tsx (`type='RealEstateListing'` con `price`, `priceCurrency`, `availability`, `numberOfRooms`, `floorSize`, `geo`, `image`, `address`)
- Aplicar a `/desarrollos/[slug]` y `/propiedades/[slug]` (cierra 34-D Schema.org completo, último item Schema)
- Bonus: **OG image dedicada por hoja** vía `next/og` dynamic (foto desarrollo + nombre + ciudad + ROI). Cierra otro chunk SEO de 34-D
- **Hero homepage queda para batch 8** cuando Luis dé: 12-20 desarrollos publicados + textos testimonios + fotos profesionales 4 destinos. Estructura placeholder ahora se rompería contra catálogo de 1 desarrollo + lorem ipsum visible en testimonios

---

### 34.18 — Sesión 34 Batch 7: minors + OG dedicadas + cross-kind + honeypot + disclaimer (2026-04-30)

> 4 commits `f794e52`+`adeae8b`+`3ddaa29`+`a5ecdbd` + deploy `next-propyte-5jd6f4ilv-propyte`. Cierra 3 items 34-D (Schema.org global completo, footer disclaimer, Topbar mobile). Avanza OG dedicadas (parcial) + /contacto (parcial honeypot+horario). Cierra deuda batch 3 cross-kind compare reset.

| # | Commit | Item | Status |
|---|--------|------|--------|
| 1 | `f794e52` | Minors batch 5 + OG /built + /equipo-comercial | ✅ Toaster bottom-center→top-center (resuelve overlap WA + ComparePanel). EmptyState key=label (resuelve collision risk). OG dedicada Satori 1200×630 reusa `OGFrame` + `loadOGFonts` + path explícito en metadata.images por memory Next 16 no inheritance. Live: ambas 200 image/png. **Hallazgo**: `RealEstateListing` JSON-LD ya estaba completo de origen en DevelopmentDetailPage:369-402 + UnitDetailPage:160-195 (verificado live `sample-azul-vivo-5a4e4a4e`). **34-D Schema.org completamente cerrado** (Organization sameAs ✓, BreadcrumbList ✓, FAQPage ✓, RealEstateListing ✓) |
| 2 | `adeae8b` | useCompare cross-kind reset con toast | ✅ Storage shape evoluciona `string[]`→`{kind:'unit'\|'development'\|null, ids:string[]}` con backward-compat (`Array.isArray(parsed)` detecta legacy y asume `'development'`). `toggle(id, newKind)` detecta cross-kind y resetea con `{ok:true, switched:true, switchedFrom}` + `toast.info('Comparativa reiniciada para {kind}')`. Cleanup storage cuando ids→0 (kind→null + removeItem). 3 keys i18n nuevas (compareReset/compareKind_unit/compareKind_development). MarketplaceCard pasa `property.kind ?? 'development'`. ComparePanel sigue coherente: navegación entre kinds sin click oculta (byId filter), reset solo al click explícito |
| 3 | `3ddaa29` | Honeypot anti-spam + horario WhatsApp | ✅ Campo `website` triple-defensa (display:none + aria-hidden + tabIndex=-1 + autoComplete=off). Zod `z.string().max(0).optional()` rechaza non-empty. Horario respuesta visible ("menos de 2 horas hábiles" / "within 2 business hours"). Live verificado: `name="website"` rendered + texto horario rendered |
| 4 | `a5ecdbd` | Footer disclaimer tono confianza | ✅ Reescritura efectiva: fuentes específicas (Banxico/INEGI/AirDNA/BMV) reemplazan "Información referencial" lavado. Disclaimer legal mínimo al final mantiene compliance. Live verificado en footer ES |

**Hallazgos del auditor (Batch 7):**

✅ **Bien hecho:**
- Constructor cerró ambos minors auditor batch 5 con precisión quirúrgica (1-2 líneas por fix)
- OG `/built` + `/equipo-comercial` reusa infra existente (OGFrame + loadOGFonts), 0 código duplicado, paths explícitos por memory Next 16
- Constructor identificó correctamente que `RealEstateListing` ya estaba implementado de origen — auditor verificó live, claim correcto. Mismo caso que `BreadcrumbList` batch 2
- `useCompare` migration con backward-compat clean: legacy `string[]` se detecta y migra al primer write. Decisión "refuse cross-kind con toast" del feedback batch 3 implementada correctamente
- ComparePanel sigue coherente sin tocar — UX flow: navegación entre kinds oculta panel (byId filter), reset solo al click explícito (toast informa al usuario)
- Honeypot triple-defensa: invisible para humanos, parsing-bots fallan, screen-reader bots ignoran (aria-hidden), keyboard bots no llegan (tabIndex=-1)
- Disclaimer reescrito da credibilidad concreta — fuentes auditables vs fórmula lavada

❌ **Errores / huecos (sin bloqueantes):**
- **🟡 Honeypot Zod redundancy → intent mismatch**: commit msg declara "drop silencioso con apariencia idéntica a éxito real, no señaliza al bot que fue detectado". Pero `z.string().max(0).optional()` rechaza el form ANTES de `onSubmit` (react-hook-form + zodResolver bloquea pre-submit). La rama `if (data.website && data.website.length > 0) setStatus('sent'); reset();` es **código muerto**. Bot ve form que no submite, NO ve fake success. Fix sugerido: cambiar a `z.string().optional()` sin `.max(0)` para que `onSubmit` reciba el valor y la rama silent drop fire. O eliminar la rama dead. Funcional pero inconsistente código vs comentario
- **EmptyState key={action.label}**: ahora colisión si dos actions tienen mismo label (improbable; dos botones "Volver" en una hoja). `key={action.href}` más único. Cosmético
- **`property.kind ?? 'development'`**: defensive cast TS-overkill (PropertyKind no incluye undefined en types). Cubre runtime drift. No bug
- **Cross-kind reset silencioso al primer click**: 4 desarrollos seleccionados → click en unit card → pierden los 4 instantáneamente con `toast.info`. Algunos UX pediría confirmación previa pero precedent estándar es toast post-acción. Decisión defendible

**Estado post-Batch 7 Sesión 34:**
- **Fase 34-A: 7/8 cerrados** (sin cambio; queda 34-A.8 triple navegación abierto, decisión arquitectónica)
- **Fase 34-B código: 7/9 + 1 parcial** (sin cambio; quedan catálogo vacío + Home propiedades destacadas, ambos dependen seed Luis)
- **Fase 34-C: 5 parciales** (`/contacto` avanzado con honeypot+horario, queda reCAPTCHA+Calendly+social-proof)
- **Fase 34-D**: **Schema.org completamente cerrado ✓** (4/4: Organization sameAs + BreadcrumbList + FAQPage + RealEstateListing). **Footer disclaimer cerrado ✓**. **Topbar mobile cerrado ✓**. **Skeletons+empty+toaster+microinteracciones cerrado ✓**. **OG image dedicada parcial** (home + blog/[slug] + desarrollos/[slug] + propiedades/[slug] + built + equipo-comercial; quedan content pages secundarias heredando fallback). **Sesión fotográfica pendiente Luis**
- **Deuda batch 3 cross-kind compare CERRADA via toast.info reset**
- **Deudas auditor abiertas**: 0 críticas. Solo cosméticas (honeypot intent mismatch, EmptyState key minor, focus trap modal agendado, DetailSkeleton refactor minor)

**Recomendación auditor para batch 8:**
- **Glosario PDF lead magnet** con `@react-pdf/renderer` ya instalado (Document → Page → secciones por letra → terms con name+def). Aplicar `margin*` no `gap` (memory `feedback_react_pdf_no_gap`). Cierra el último item de `/glosario` MEDIA 34-C + aporta lead magnet real
- API route `/api/glossary/pdf` o button server action que streamea el PDF
- Botón "Descargar glosario PDF" en `/glosario` (sticky bar combinada o footer)
- Bonus: **forms validación visual** en `/desarrolladores` y `/corredores` (~30 líneas cada uno: required + email + phone MX format + honeypot mismo patrón /contacto + toast success/error reusando infra batch 5)
- **Equipo-comercial filtros queda para batch 9** cuando Luis confirme seed team_members
- **Hero homepage queda para batch 10** cuando Luis dé catálogo (12-20 devs) + textos testimonios + fotos profesionales 4 destinos

---

### 34.19 — Sesión 34 Batch 8: Glosario PDF + forms validation dev/corredores + minor fixes batch 7 (2026-04-30)

> 2 commits `5339797`+`3848f27` + deploy `next-propyte-moozcjlrt-propyte`. Cierra `/glosario` MEDIA 34-C completo. Avanza /desarrolladores + /corredores forms (parcial). Cierra ambos minor fixes batch 7 (honeypot Zod + EmptyState key).

| # | Commit | Item | Status |
|---|--------|------|--------|
| 1 | `5339797` | Glosario PDF lead magnet + minors batch 7 | ✅ Route `/api/glossary/pdf?locale=es\|en` con `runtime=nodejs` (PDF requiere Node), `maxDuration=30`, `dynamic=force-dynamic` + `Cache-Control: public, max-age=86400` (CDN cache 24h, server per-request). Locale validation con type guard `isLocale`, inválido → 400. GlossaryPDFDocument cover navy + Helvetica nativo (sin font embed) + secciones por letra. `@react-pdf/renderer` margin* exclusivamente (memory `feedback_react_pdf_no_gap`). 22 terms via `getTranslations` server-side. Botón "Descargar PDF" en sticky bar (mobile icon-only, sm+ con label). Live: PDF es/en 200 application/pdf 9278 bytes 4 pages, fr → 400. **Minor fixes batch 7**: `/contacto` schema `z.string().max(0).optional() → z.string().optional()` (silent drop ahora alcanzable). EmptyState `key={action.href}` (más único que label) |
| 2 | `3848f27` | Forms validación visual + honeypot + toast en dev/corredores | ✅ DeveloperForm + BrokerForm reciben mismo upgrade defensivo: `errors{}` state per-field con cleanup on change. Email regex + Phone MX regex (`/^(\+?52[\s-]?)?\(?\d{2,3}\)?[\s-]?\d{3,4}[\s-]?\d{4}$/`). `aria-invalid` + `<p text-xs text-red-500>` inline. Honeypot website triple-defensa (display:none + aria-hidden + tabIndex=-1) con fake-success silent drop (mismo patrón /contacto post-fix). Toast success/error sonner reusando Toaster batch 5. Keys `formSuccess`/`formError` ya existían en namespaces `developers` (es.json:649) y `brokers` (923). Live verificado /es/desarrolladores + /es/corredores 200, `name="website"` + `aria-invalid` rendered |

**Hallazgos del auditor (Batch 8):**

✅ **Bien hecho:**
- PDF infrastructure correctamente configurada (runtime, maxDuration, cache headers, locale validation)
- GlossaryPDFDocument respeta restricción `@react-pdf/renderer` no `gap` con memory aplicada
- Cover navy + Helvetica nativo → PDF compacto (9.3KB, 4 páginas)
- Constructor cerró ambos minor fixes batch 7 quirúrgicamente — silent drop honeypot ahora alcanzable
- Forms validation con UX correcta (error desaparece on change)
- Phone MX regex permisivo acepta variantes comunes sin rechazar usuarios legítimos
- Honeypot triple-defensa consistente con `/contacto`
- Live: PDF binary válido, dev/corredores 200, name="website" + aria-invalid + i18n keys verificadas

❌ **Errores / huecos (sin bloqueantes):**
- **🟡 PDF "lead magnet" sin email gate**: commit msg dice "lead magnet sin email gate" pero técnicamente es PDF gratis (no captura email/nombre). Decisión de producto válida si Luis lo intencionó así, pero si quería captura de leads, falta form modal pre-download + endpoint de captura + email automation. Verificar con Luis
- **`TERM_COUNT = 22` hardcode brittle**: si agregan/quitan terms del i18n, route.ts no detecta automáticamente. Fix robusto: array i18n shape o detect-loop con try/catch
- **Cache invalidación 86400s**: cuando edites un term, users con CDN cache verán el viejo por 24h. `Cache-Control: max-age=0, s-maxage=86400, stale-while-revalidate=3600` daría invalidación inmediata browser pero CDN cache. No urgente para 22 terms estáticos
- **Phone MX regex acepta 9-11 dígitos**: estrictamente MX es 10 dígitos local. Permisivo es better-UX vs strict (false-positive permisivo > false-negative que rechaza legítimos), pero si quieren estrictez: `^(\+?52[\s-]?)?\(?\d{2,3}\)?[\s-]?\d{3}[\s-]?\d{4}$`
- **TERM_COUNT duplicate hardcode**: `22` en route + "22 términos" en cover labels. Si cambia uno, debe alinearse. Cosmético

**Estado post-Batch 8 Sesión 34:**
- **Fase 34-A: 7/8 cerrados** (sin cambio)
- **Fase 34-B código: 7/9 + 1 parcial** (sin cambio)
- **Fase 34-C: 6 parciales + 1 CERRADO** (`/glosario` completo). Quedan: vista toggle Lista/Grid/Mapa (decisión UX), filtros recámaras/baños/m² /propiedades, /como-comprar timeline (data Luis), /contacto reCAPTCHA+Calendly+social-proof, /equipo-comercial filtros (seed Luis), /desarrolladores+/corredores logos+tabla comisiones (Luis), /unete calculadora+temario, /built fotos+dropdown
- **Fase 34-D**: Schema.org completo ✓, Footer disclaimer ✓, Topbar mobile ✓, Skeletons+empty+toaster+microinteracciones ✓, OG image parcial. Sesión fotográfica pendiente Luis
- **Deudas auditor abiertas**: 0 críticas. Solo cosméticas batch 8 (TERM_COUNT brittle, cache invalidación, phone regex permisivo) + agendadas previas (focus trap modal, DetailSkeleton refactor, saber-más links check)

**Recomendación auditor para batch 9:**
- **Microinteracciones cards** (chip animado + heart fill animado) con framer-motion ya en repo
- **Focus trap ComparePanel modal** (cierra deuda batch 4 a11y) — `react-focus-lock` (1 dep) o impl manual con useEffect + focus() + Tab interceptor (~30-40 líneas)
- **DetailSkeleton shared component** (cierra deuda batch 5 minor) — extraer 1 componente entre `desarrollos/[slug]/loading.tsx` + `propiedades/[slug]/loading.tsx`
- **Glosario saber-más runtime check** — script o test que verifique `term*Link` apunta a rutas válidas
- **Bonus**: PDF email gate si Luis confirma captura (modal + endpoint + Zoho integration)
- **Bonus 2**: `/contacto` social proof bloque junto al form (también código puro)
- **Equipo-comercial filtros batch 10** (depende seed Luis), **Hero homepage batch 11** (catálogo + fotos Luis)

---

### 34.20 — Sesión 34 Batch 9: DetailSkeleton + focus trap modal + microinteracciones + glossary links check (2026-04-30)

> 3 commits `6bbaf33`+`a920683`+`e41bce9` + deploy `next-propyte-53llqunls-propyte`. Cierra 3 deudas auditor (DetailSkeleton batch 5, focus trap modal batch 4, glosario saber-más check). Microinteracciones cards completas.

| # | Commit | Item | Status |
|---|--------|------|--------|
| 1 | `6bbaf33` | DetailSkeleton compartido + focus trap modal | ✅ DetailSkeleton extrae 60+ líneas duplicadas a 1 componente compartido — los 2 `loading.tsx` (desarrollos/[slug] + propiedades/[slug]) son ahora wrappers de 5 líneas. Cierra deuda batch 5 minor. **Focus trap modal**: implementación sin deps nuevas, `dialogRef + closeBtnRef + lastFocusedRef`, `focusableSelector` cubre interactives + `[tabindex]` filtrando `-1`, `.filter(offsetParent !== null)` excluye hidden, Tab/Shift+Tab cycling first↔last, `queueMicrotask(() => closeBtnRef.current?.focus())` autofocus al abrir, `lastFocusedRef.current?.focus?.()` restore on cleanup. ESC integrado en mismo `useEffect`. Cierra deuda batch 4 a11y completo |
| 2 | `a920683` | Microinteracciones heart + filter chips | ✅ Heart `motion.button whileTap scale 0.85` (spring 500/17) + `motion.span keyed por saved` con `initial={{ scale: saved ? 0.6 : 1 }}` → pop al activate. Filter chips `AnimatePresence` con enter/exit (initial scale 0.85 + opacity 0 + y -4 → animate 1/1/0, spring 500/30 mass 0.5 snappy). "Limpiar todo" keyed para fade in/out al cruzar 1↔2 chips. framer-motion ya en deps |
| 3 | `e41bce9` | Glossary saber-más links runtime check | ✅ Script `tests/qa-data/verify-glossary-links.mjs` parsea TERM_LINKS via regex, valida cada href resuelve a `src/app/[locale]/<route>/page.tsx`. Exit 1 si broken. Auditor verificó corriendo: 5/5 OK (term4/19 → /como-invertir, term6/8 → /financiamiento, term10 → /como-comprar) |

**Hallazgos del auditor (Batch 9):**

✅ **Bien hecho:**
- DetailSkeleton refactor quirúrgico — elimina 60+ líneas de duplicación, mantiene fidelidad SSR
- Focus trap manual sin deps externas — implementación canónica con todos los hooks correctos: refs, autofocus, restore, cycling, ESC
- Heart pop con motion.button + motion.span dual — buen feel snappy sin lag
- Filter chips con AnimatePresence — enter/exit sincronizados, keyed para correctness
- Glossary verify script efectivo y runnable localmente, listo para CI
- Live: 3 rutas marketplace 200, script local 5/5 OK

❌ **Errores / huecos (sin bloqueantes):**
- **🟡 Claim falso framer-motion `prefers-reduced-motion`**: commit msg dice "framer respeta prefers-reduced-motion automáticamente". **NO es verdad por default**. framer-motion v11+ requiere `<MotionConfig reducedMotion="user">` envolviendo el árbol, o `useReducedMotion()` hook explícito. Sin esa configuración, animaciones corren regardless del media query. Animaciones son cortas (no son problemáticas para vestibular triggers) pero técnicamente las claims a11y motion-reduce **no se cumplen**. Fix: 1 import + 1 wrapper en `[locale]/layout.tsx`
- **Heart pop asimétrico**: `initial={{ scale: saved ? 0.6 : 1 }}` solo anima al activar (saved=false→true: 0.6→1). Al desactivar (saved=true→false: 1→1) no hay pop visible. Decisión defendible (muchas apps celebran "save" silencian "unsave") pero asimétrico
- **Focus trap "partial"**: si por alguna razón active element está FUERA del modal (edge case con mouse click previo), Tab no es interceptado. La condición `active === first || last` solo dispara en boundaries. Edge case improbable porque autofocus al close button + backdrop click cierra modal. Para fortificar: `if (!root.contains(active)) { e.preventDefault(); first.focus(); }`
- **verify-glossary-links regex-parsed**: si shape de TERM_LINKS cambia (inline computed keys, const enum), regex se rompe (pero `links.length === 0` tira exit 1, OK eso lo cubre). Script de mantenimiento, no en CI todavía
- **Pregunta bloqueante a Luis (deuda batch 8)**: PDF email gate — captura lead vs descarga libre. Sin respuesta no se puede cerrar esa puerta

**Estado post-Batch 9 Sesión 34:**
- **Fase 34-A: 7/8 cerrados** (sin cambio)
- **Fase 34-B código: 7/9 + 1 parcial** (sin cambio)
- **Fase 34-C: 6 parciales + 1 CERRADO** (`/glosario` completo cerrado batch 8)
- **Fase 34-D: TODOS los items principales CERRADOS** menos OG content pages secundarias (parcial) y sesión fotográfica (Luis): Schema.org ✓, Footer disclaimer ✓, Topbar mobile ✓, Skeletons+empty+toaster+microinteracciones+focustrap+microinteracciones+DetailSkeleton ✓
- **Deudas auditor abiertas**: 0 críticas. Solo cosméticas batch 9 (MotionConfig wrap, heart pop asymmetry, focus trap partial). Pregunta bloqueante a Luis sobre PDF email gate

**Recomendación auditor para batch 10:**
- **`<MotionConfig reducedMotion="user">`** wrap en `[locale]/layout.tsx` (1 import + 1 wrapper) — cierra deuda a11y honest del batch 9
- **`/contacto` social proof block** + Calendly placeholder — cierra parcial 34-C contacto
- **`/financiamiento` columna "Mejor para"** en comparativa bancos + link precalificación — cierra parcial /financiamiento (~30 líneas)
- **Schema.org Organization en home page** — `<SchemaMarkup type="organization">` en `[locale]/page.tsx` (verificar que no esté ya, según grep auditor el componente existe pero no se invoca en home)
- **Pregunta bloqueante a Luis**: PDF email gate (captura lead vs descarga libre)
- **Bonus**: `1BR/1BA` data cleanup script SQL listo para que Luis corra en Supabase Editor
- **Equipo-comercial filtros batch 11** (depende seed Luis), **Hero homepage batch 12** (catálogo + fotos Luis)

---

### 34.21 — Sesión 34 Batch 10: a11y honest + /contacto social proof + /financiamiento columnas + cleanup script (2026-04-30)

> 4 commits `b0284ee`+`b7e81b9`+`8498100`+`fc44bf8` + deploy `next-propyte-ijxn6003d-propyte`. Cierra 3 deudas auditor batch 9 en 1 commit + 2 parciales 34-C + Sesión 32 backlog. Schema.org Organization confirmado de origen.

| # | Commit | Item | Status |
|---|--------|------|--------|
| 1 | `b0284ee` | MotionConfig + heart symmetric + focus trap edge case | ✅ `<MotionConfig reducedMotion="user">` wrap en locale layout — framer-motion ahora respeta OS-level `prefers-reduced-motion` real (sin esto el wrapper era promesa vacía, antes corría animaciones regardless). Heart pop `initial={{ scale: 0.6 }}` sin condición → simétrico add+remove. Focus trap fortified `if (!root.contains(active)) { e.preventDefault(); first.focus(); return; }` antes de las branches first/last cubre drift de active fuera del modal. Cierra 3 deudas auditor batch 9 |
| 2 | `b7e81b9` | /contacto social proof + Calendly placeholder | ✅ 3 stats grid bajo el form sin números inventados (cobertura Riviera Maya & Yucatán, equipo bilingüe certificado, SLA <2h respuesta). Iconos teal sobre F4F6F8. Calendly env-driven: `NEXT_PUBLIC_CALENDLY_URL` → anchor activo navy/dark; sin env var → button disabled "Próximamente" con tooltip. Cuando Luis cree Calendly, basta env var sin redeploy. 8 keys i18n nuevas ES+EN |
| 3 | `8498100` | /financiamiento "Mejor para" + precalificación | ✅ 2 columnas nuevas en comparativa de métodos: "Mejor para" (renderiza `m.ideal` que ya existía en methods array i18n — zero new data) + "Asesoría" (link `Hablar con asesor →` a `/contacto?asunto=financiamiento-m{i+1}` con tracking distinto por método). CTA precalificación card border teal con título + button `Solicitar precalificación →` → `/contacto?asunto=precalificacion`. 7 keys i18n nuevas |
| 4 | `fc44bf8` | Script cleanup unit_type fuera de enum | ✅ `tests/qa-data/cleanup-unit-type.mjs` lee `real_estate_hub.Propyte_unidades`, REMAP heuristic (`1BR/1BA` → departamento, etc.). Dry-run default; `APPLY=1` para mutate. Requiere `SUPABASE_SERVICE_ROLE_KEY`. Defense-in-code ya estaba (commit `23dde3f`). Cierra Sesión 32 backlog data-side fix |

**Schema.org Organization en home: confirmado de origen** — auditor verificó [locale]/page.tsx:67 invoca `<SchemaMarkup type="organization" />`. Live `/es` renderiza `"@type":"Organization"` + `"@type":"PostalAddress"`. Constructor recomendó verificar primero, decisión correcta.

**Hallazgos del auditor (Batch 10):**

✅ **Bien hecho:**
- 3 deudas auditor batch 9 cerradas en 1 commit quirúrgico (`b0284ee`)
- MotionConfig wrap honest — framer real respeta preference, no promesa vacía
- Calendly env-driven pattern smart — Luis cambia env var sin redeploy
- "Mejor para" reusa `m.ideal` existente — zero new data, zero work duplication
- Asuntos distintos en links de financiamiento permiten tracking granular en CRM
- Cleanup script offline, dry/apply, no afecta deploy
- Schema.org Organization verificado de origen — patrón "ya existía en commits previos" se repite (BreadcrumbList batch 2, RealEstateListing batch 7, Organization batch 10)

❌ **Errores / huecos (sin bloqueantes):**
- **Social proof `grid-cols-3` siempre**: viewport mobile pequeño (320px) aplasta los 3 stats. Sugerencia `grid-cols-1 sm:grid-cols-3 gap-3`. Cosmético
- **Calendly disabled label confuso mobile**: cuando no hay env var, button muestra `t('calendlyCta')` con tooltip "Próximamente" solo en desktop hover. Mobile sin tooltip queda con label deshabilitado sin razón visible. Sugerencia: cambiar label inline a `t('calendlySoon')` cuando disabled
- **🟡 Queryparam preset en /contacto faltante**: los nuevos links `?asunto=financiamiento-m1` / `?asunto=precalificacion` (y otros previos `?asunto=blog`, `?asunto=promos`, etc.) llegan al form pero el form **no preselecciona** el subject del dropdown. User aterriza con form vacío y debe seleccionar manualmente. Fricción innecesaria. Fix: `useEffect` que lea `useSearchParams()` y haga `setValue('subject', ...)` si matchea opciones válidas (~10 líneas). Aplica retroactivamente a TODOS los `?asunto=` que ya existían
- Constructor mencionó "5 commits" en el mensaje pero envió 4 (typo)

**Estado post-Batch 10 Sesión 34:**
- **Fase 34-A: 7/8 cerrados** (sin cambio; queda triple navegación abierta + ⚠️ banner cookie del 34-A.1)
- **Fase 34-B código: 7/9 + 1 parcial** (sin cambio; bloquea seed Luis)
- **Fase 34-C**: 6 parciales, /glosario completo. Pendientes principalmente bloqueados por Luis (data, fotos, textos)
- **Fase 34-D**: Schema.org ✓, Footer ✓, Topbar mobile ✓, Skeletons+empty+toaster+microinteracciones+focustrap+motionconfig ✓. **OG content pages secundarias** parcial (queda /como-comprar, /como-invertir, /financiamiento, /contacto, /glosario, /faq sin OG dedicada — heredan fallback). **Sesión fotográfica** Luis
- **Backlog Sesión 32 cerrado completamente**: CI bump + PropertySpecs defense + AirDNA market_summary + unit_type data cleanup script
- **Deudas auditor abiertas**: 0 críticas. Solo cosméticas batch 10 (social proof grid, Calendly mobile label, queryparam preset)
- **Pregunta bloqueante a Luis (sigue)**: PDF email gate

**Recomendación auditor para batch 11:**
- **🟢 Cookie banner granular vanilla** (cierra ⚠️ pendiente del 34-A.1):
  - `<CookieBanner />` en layout, condicional `localStorage['propyte:cookies']`
  - 3 categorías: `necessary` (always on, disabled toggle), `analytics`, `marketing`
  - 3 botones: "Aceptar todo" / "Rechazar opcionales" / "Personalizar"
  - GA4 hookup: `gtag('consent', 'update', {analytics_storage: ..., ad_storage: ...})` post-consent
  - Re-open: link "Configuración de cookies" en footer
  - LEGAL alta prioridad GDPR/LFPDPPP-friendly, sin deps externas, ~80-100 líneas
- **Queryparam preset en /contacto** (deuda batch 10) — `useEffect` + `useSearchParams` + `setValue` ~10 líneas
- **Bonus**: actualizar `/cookies` page para reflejar el banner real (eliminar draft text si existe)
- **Bonus 2**: social proof `grid-cols-3` → `grid-cols-1 sm:grid-cols-3` + Calendly mobile label fix (~3 líneas combinadas)
- **Equipo-comercial filtros batch 12** (seed Luis), **Hero homepage batch 13** (catálogo + fotos Luis)

---

> **FIN DEL SPECKIT METAMORFOSIS PROPYTE v2.0**
>
> **Cambios v1.0 → v2.0:**
> - Deploy: Producción en Hostinger (standalone), Staging en Vercel
> - Slugs: Nuevo formato programático jerárquico `/ciudad/tipo/titulo`
> - Mapas: Agregado mapa en Single Unidad (hereda coords del parent)
> - Fases reordenadas: Hub Backend (Fases 2-3) ANTES de content pages
> - Rollback plan completo con blue/green y periodo de convivencia 30 días
> - Sección 27: Share/Download Modal detallado (3 formatos, off-screen rendering)
> - Sección 28: Investment Calculator — 10 funciones financieras con código completo
> - Sección 29: Rental Analysis — filtros, estadísticas, histograma, breakdowns
> - Sección 30: Mapeo 78 iconos SVG → Lucide React (icon-by-icon)
> - Sección 31: 20 Playwright tests categorizados con plan de migración
> - Riesgos expandidos: ISR en Hostinger, PDF engine delta, image optimization, DNS downtime
> - CI/CD detallado: SCP deploy, PM2 restart, CDN purge, smoke tests
> - Built Settings admin migrado (no es página estática — tiene admin settings)
