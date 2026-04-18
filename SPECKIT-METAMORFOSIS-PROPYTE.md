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

- [ ] Hero con video/image BG + 3-tier fallback (video → poster → gradient)
- [ ] Hero search tabs (Desarrollos/Propiedades) + stats pills con counter animation
- [ ] Hero quick links (4 filtros hardcoded)
- [ ] Explore Categories (4 cards con iconos + CTAs)
- [ ] Featured Properties (6 cards, `v_developments WHERE featured=true`)
- [ ] Trending Market (4 KPIs + top zones ranking)
- [ ] App Download Banner (iOS/Android links + features)
- [ ] Why Propyte (5 value props)
- [ ] Testimonials / "Propyte en Números" (carousel + live counts)
- [ ] Join Team Banner
- [ ] Framer Motion animation timing verification vs WP gsap-animations.js

### Fase 3: Property Cards & Archives (2 semanas)

> PropertyCard de HERO-SITE se reutiliza, se le agrega carousel/badges del WP.

- [ ] PropertyCard (carousel touch/swipe, stage badge, photo count, save heart, price strikethrough, financial badges, promo banner)
- [ ] FilterBar (5 dropdowns + "Más filtros" modal con stage radios + uso checkboxes)
- [ ] MobileFilters (fullscreen chip-based modal — calca WP main.js)
- [ ] MapView (Google Maps JS API — migrar de Mapbox de HERO. Navy pins con precio, InfoWindow, clustering >20)
- [ ] ListView (grid 1→2 cols responsive)
- [ ] SortDropdown (Recientes, Precio ↑, Precio ↓)
- [ ] Archive Desarrollos (map+list split 60/40 desktop, toggle mobile)
- [ ] Archive Unidades (list-only + filters: beds, price, area, disponibles toggle)
- [ ] Archive Desarrolladores (verified badges, contact info grid)
- [ ] Taxonomy pages (ciudad, tipo, zona, etapa — reuse archive con filtro pre-aplicado)
- [ ] Empty states
- [ ] Slug redirects middleware (old flat → new hierarchical)
- [ ] Active filter chips (removable)

### Fase 4: Detail Pages (2 semanas)

- [ ] Image Gallery (hero 16:9 + thumbnails horizontal scroll, click to expand)
- [ ] Tab system (3 tabs: Descripción, Análisis Geográfico, Rentabilidad)
- [ ] Contact Sidebar (sticky top-28, form React Hook Form + Zod)
- [ ] Mobile floating bar (fixed bottom: price + WA + contact buttons)
- [ ] Share/Download modal (PDF + email + WhatsApp + social — ver Sección 27)
- [ ] **Single Desarrollo Tab Descripción** (8 subsecciones: description expandable, unit chips, 4 metric cards, metrics row, tour 360°, video, amenities, developer card, brochure)
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

### Fase 6: Built Portfolio (1 semana)

- [ ] Built Hero (3 animated words: Diseña. Construye. Habita.)
- [ ] Philosophy blockquote
- [ ] Services grid (3×2)
- [ ] Portfolio showcase (filter tabs + 3-col grid + hover overlay)
- [ ] Process timeline (5 steps, horizontal desktop / vertical mobile)
- [ ] Team expertise (3 cards)
- [ ] Consultation form (Built-specific fields)
- [ ] Final CTA dark

### Fase 7: Blog Completo (1 semana)

- [ ] Blog listing page (category filter chips, featured post hero, pagination)
- [ ] Blog post detail (article schema, reading time calc, author byline, social share, related posts)
- [ ] BlogCard component (thumbnail, title, excerpt, date, category badge)
- [ ] CategoryFilter component
- [ ] RelatedPosts component (same category, max 3)

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

- [ ] Fase H1: Auth + Dashboard + Approvals (2 semanas)
- [ ] Fase H2: Sync Engine (2 semanas)
- [ ] Fase H3: Blog AI + Change Log + Team + Agents + Settings (1 semana)
- [ ] Fase H4: Testing + Cutover del hub (1 semana)

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
- [ ] Description (expandable, max 120px)
- [ ] Unit type chips
- [ ] 4 metric cards
- [ ] Metrics row (5 values)
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
- [ ] Share/Download modal (3 formatos: Stories/Square/Letter — Sección 27)
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

### Hub Backend (hub.propyte.com) — 0/48

**Approval System:**
- [ ] 3-tab interface (Developers, Developments, Units)
- [ ] Bulk status update
- [ ] Toggle web publication
- [ ] Field editing with whitelist
- [ ] Image upload & optimization
- [ ] Image deletion
- [ ] Record duplication
- [ ] Completeness scoring (weighted)
- [ ] Pipeline status visualization
- [ ] Sync status badges (Zoho, Web)
- [ ] Pagination (20-1000/page)
- [ ] Filters (status, city, completeness, sync, web)

**Sync Engine:**
- [ ] Pull sync (Supabase → cache, quality filters)
- [ ] Push sync (edits → Supabase, anti-loop)
- [ ] Image sync (download, optimize, upload)
- [ ] Conflict detection
- [ ] Incremental sync (updated_at)
- [ ] Full sync (manual trigger)
- [ ] Cron scheduling (15min/6h/24h)
- [ ] Sync dashboard (logs, errors, timestamps)
- [ ] On-demand ISR trigger to propyte.com

**Content:**
- [ ] Blog AI generator (Claude API)
- [ ] Blog scheduling (cron)
- [ ] Blog moderation (draft → publish)

**Admin:**
- [ ] Dashboard (stats, sync status, recent leads)
- [ ] Change log (audit trail for prices/availability)
- [ ] Team management (CRUD)
- [ ] Agent profiles (11 meta fields)
- [ ] Settings panel (Supabase, sync, analytics, CRM, diagnostics)
- [ ] Settings diagnostics: 4 status cards (En Supabase, Aprobados, Pasan Quality, Sincronizados)
- [ ] Settings diagnostics: rejection details table (20 max, with reasons)
- [ ] Built Settings admin (portfolio items, stats, services — NOT static page)

**API:**
- [ ] 5 approval routes
- [ ] 3 sync routes
- [ ] 2 blog routes
- [ ] 1 revalidate route
- [ ] 1 change-log route
- [ ] 1 team route
- [ ] 1 agents route
- [ ] 1 settings route
- [ ] 2 leads routes (receive + forward)

**Auth:**
- [ ] Login page
- [ ] JWT sessions (8h)
- [ ] RBAC (ADMIN, DIRECTOR, GERENTE, MARKETING)
- [ ] Middleware protection

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
