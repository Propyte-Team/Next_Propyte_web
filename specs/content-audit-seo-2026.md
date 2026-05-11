# Spec: Auditoría de Contenido SEO 2026 + Tono Propyte + Conversión

> **Estado:** approved v2.1 (optimizado contra fuentes Propyte, sin prescripción visual) | **Fecha:** 2026-05-11 | **Proyecto:** Next_Propyte_web (propyte.com)
> **Branch:** `feat/content-audit-seo-2026`
> **Base v1:** documento entregado en sesión 2026-05-11 (auditoría YMYL + 5 hallazgos críticos + 7 importantes)
> **Owner:** Luis Flores (Coordinador de Marketing Propyte) — **Ejecutor:** Claude

---

## 0. Fuentes de verdad (orden de prioridad)

Cualquier decisión de **estructura, copy, contenido, IA o schema** en este spec se valida contra los siguientes documentos, en este orden. Si hay conflicto, gana el de mayor jerarquía.

| # | Documento | Versión | Rol en este spec |
|---|---|---|---|
| 1 | **Manual UX/UI Sitio Web Propyte** | v1.0 — Mar 2026 | Estructura del Home (§4.2), arquitectura de información (§2.1), set de schema markup (§7.3), micrositio (§6), páginas secundarias (§7), copy canónico de H1 y disclaimers (§4.1, §6.3.2). |
| 2 | **Playbook Comercial Propyte** | Mar 2026 | Tono de voz, propuesta de valor, principios anti-hype ("sin humo, sin improvisación, sin promesas vacías"), perfil del asesor/inversionista. |
| 3 | **MASTER SOP Operativo Propyte** | v1.0 — Feb 2026 | Convenciones de inventario, estados de desarrollo, razón social (Nativa Tulum), Real Estate Lab, CRM (Zoho). |
| 4 | **Auditoría YMYL** (sesión 2026-05-11) | — | Diagnóstico de hallazgos a remediar. |
| 5 | **Google QRG Sept 2025** | — | Estándar YMYL externo (E-E-A-T, disclaimers, autoría). |

> **Alcance de este spec:** estructura, contenido textual, IA, schema, SEO técnico. **No** prescribe cambios visuales (colores, tipografía, layout fino, animaciones, fondos, gradientes). El tratamiento visual actual del sitio se mantiene. Si una sección del Manual UX/UI mezcla estructura con prescripción visual, este spec adopta solo la parte estructural y respeta el estilo ya implementado.

---

## 1. Overview

`propyte.com` es un sitio **YMYL** que comercializa inversión inmobiliaria en Riviera Maya. Bajo Google QRG sept-2025, los sitios YMYL están sujetos a estándares E-E-A-T estrictos (credenciales visibles, disclaimers obligatorios, fuentes citadas, autoría documentada).

La auditoría YMYL detectó tres clases de problemas simultáneos:

1. **Credibilidad rota** — cifras "piso" (`FLOORS = {170, 500, 5, 30}` en `Hero.tsx:23`) presentadas como datos reales; claims absolutos sin sustento ("Inversión Segura", "Asesor certificado"); ROI sin metodología ni disclaimer; testimonios truncados con marca huérfana ("Manejo de Datos").
2. **Mensaje desorganizado** — 7 banners de conversión compiten en el Home; tagline + subtitle duplican mensaje; microcopy plantilla ("la plataforma más inteligente"); blog empty state visible.
3. **SEO técnico básico** — solo `Organization` JSON-LD, sin `WebSite+SearchAction`, `RealEstateListing` real, `Review`/`AggregateRating`, `BreadcrumbList` global, `FAQPage` ni `BlogPosting`.

Esto bloquea ranking en queries comerciales ("departamentos preventa Tulum", "ROI Airbnb Playa del Carmen") y expone al sitio a sanción algorítmica YMYL.

**Lo crítico del diagnóstico** es que **violenta la propuesta de valor declarada en el Playbook**: *"Sin humo, sin improvisación y sin promesas vacías"*. Un sitio con cifras infladas y disclaimers ausentes contradice directamente la tesis comercial de Propyte. No es solo un problema de SEO — es coherencia entre lo que el equipo entrena para decir y lo que el sitio dice.

El proyecto se ejecuta en 3 bloques secuenciales (A → B → C), todos contra `feat/content-audit-seo-2026`.

---

## 2. Goals

- **G1.** Eliminar los 5 hallazgos rojos de la auditoría (FLOORS engañosos, claims absolutos, ROI sin disclaimer, testimonios truncados, blog empty state).
- **G2.** Reducir microcopy plantilla a copy específico, en voz Propyte (consultiva, basada en datos, anti-hype), con prueba verificable.
- **G3.** Reorganizar el Home **alineado al Manual UX/UI v1.0 §4.2** (orden de scroll canónico) sin alterar el tratamiento visual de cada sección.
- **G4.** Cubrir el set completo de schema markup definido en el Manual §7.3 (`WebSite+SearchAction`, `RealEstateListing`, `AggregateRating`+`Review`, `BreadcrumbList` global, `FAQPage`, `BlogPosting`, `LocalBusiness`, `Event` cuando aplique).
- **G5.** Cumplir los 4 signals YMYL extra de QRG sept-2025: credenciales visibles, disclaimers explícitos, citas a fuentes primarias, proceso de revisión documentado.

**Métricas de éxito** (medibles tras merge a `main`):
- 0 claims sin fecha + fuente + n=muestra en el Home.
- 100% de cifras numéricas en home con tooltip o footnote de metodología, citando fuente (Softec, AMPI, comparables internos, etc.).
- Lighthouse SEO ≥ 95 en `/`, `/propiedades/[slug]`, `/desarrolladores`, `/equipo`.
- Rich Results Test pasa para los 8 schemas del Manual §7.3.
- CTR orgánico en queries "departamentos preventa Tulum", "inversión Riviera Maya", "Airbnb Tulum ROI" → comparar GSC 30 días pre/post merge a main.
- Ratio de conversión Hero → marketplace medido en GA4 (baseline a capturar antes del merge).

---

## 3. Non-Goals

- **No** rediseño visual. La paleta, tipografía, fondos, animaciones, gradientes y demás tratamientos estéticos del sitio actual se preservan.
- **No** cambios de stack (Next.js 16 / Tailwind 4.2 / next-intl / Supabase).
- **No** crear blog posts ni contenido editorial real (eso es trabajo del Hub de contenido, fase aparte).
- **No** rediseño de `/propiedades/[slug]` ni `/zonas/[slug]` — solo agregar JSON-LD y aplicar disclaimer YMYL.
- **No** integración con Google Business Profile ni schema avanzado de `Place` (fuera de alcance).
- **No** A/B testing de copy en esta fase — los cambios son push directo basado en auditoría + Manual.
- **No** producción de fotos/videos nuevos para testimonios. Manual §7.1 establece que **no hay casos de éxito hasta que el primer MasterBroker firme en dic-2026** → los testimonios actuales del Home se retiran (ver B3).
- **No** ManyChat bot (es Fase 2 de la estrategia de marketing, deferido a mes 3+).

---

## 4. Context y constraints

### 4.1 Estado actual del repo

- **Branch base:** `develop` (1 commit ahead de origin, screenshots de tests sin commitear). Rama dedicada: `feat/content-audit-seo-2026`.
- **Deploy vivo:** `dev.propyte.com` (Vercel staging) con la versión actual. `propyte.com` (Hostinger) en versión anterior. Merge a `main` dispara GitHub Actions → SCP → PM2 restart.
- **i18n:** `src/i18n/messages/es.json` ~126KB, `en.json` ~119KB. Sincronización obligatoria — 0 keys huérfanas, 0 keys sin traducir.
- **Schema actual:** `src/components/shared/SchemaMarkup.tsx` cubre `organization`, `realEstateListing` (shape vacía, no usado), `localBusiness`, `professionalService`, `breadcrumb`, `faq`. Solo se inyecta `organization` en Home.
- **Visibility flags:** `getVisibility()` + `VISIBILITY_KEYS` (fail-open). Se usará para condicionar `RecentBlog`.
- **Hub content:** `getTestimonials('home')`, `getCta('home_lead_magnet')`, `getSiteConfig()`, `getPageContent()` ya existen como puente Supabase → frontend con fallback i18n.
- **Componentes Home existentes** (`src/components/home/*.tsx`): `Hero`, `ExploreCategories`, `FeaturedProperties`, `Testimonials`, `TrendingMarket`, `WhyPropyte`, `JoinTeamBanner`, `DeveloperBanner`, `DeveloperLogos`, `LeadMagnet`, `AppDownloadBanner`, `RecentBlog`, **`HowItWorks` (ya existe pero no renderizado en `page.tsx` actual)**, `MarketData`, `ValueProposition`. Cualquier referencia a "nuevo HowItWorks" en este spec significa **reactivar el componente existente**, no crearlo.

### 4.2 Constraints de negocio

- **YMYL compliance:** disclaimer de inversión obligatorio bajo QRG sept-2025 y consistente con el principio Playbook *"plusvalía garantizada" = frase prohibida*.
- **Razón social:** Propyte opera bajo **Nativa Tulum** (SOP-4.2-01 §3). Esto importa para `LocalBusiness` schema y footer legal.
- **CRM:** Zoho (Playbook §"abre tu Zoho y empieza"). Cualquier integración de formularios al CRM apunta a Zoho.
- **Inventario:** convención de nombres en CRM es `[CIUDAD/REGIÓN] | [NOMBRE DESARROLLO]` (ej. `TULUM | NATIVA TULUM`). Esto debe reflejarse en breadcrumbs y JSON-LD `RealEstateListing.brand`.
- **Domicilio Real Estate Lab:** Calle 5 Norte 95, Playa del Carmen (SOP Hostess). Es el `address` canónico para `LocalBusiness`.
- **Casos de éxito:** **NO HAY** hasta que el primer MasterBroker firme en diciembre 2026 (Manual §7.1). Implicación directa: los testimonios actuales del Home no son casos de éxito comerciales y no deben presentarse como tales.

### 4.3 Conexión con estrategia de marketing 2026

El sitio es la pieza de conversión del **Phase 1 (orgánico + Meta + Google Search)** de la estrategia digital. Los 5 pilares de contenido se mapean al Home así:

| Pilar | Sección del Home que lo materializa |
|---|---|
| **Ubicación** | Hero (eyebrow "Riviera Maya"), Datos del Mercado, Mapa en marketplace |
| **Inversión (rationale)** | Simulador financiero (en micrositios), Datos del Mercado, FAQ Home |
| **Lifestyle** | Galerías de propiedades destacadas, descripción de zonas |
| **Amenidades** | Ficha técnica de propiedades destacadas, micrositios |
| **Prueba social** | Logos de desarrolladores, casos de éxito (vacío hasta dic-2026), métricas verificables |

El spec optimiza el sitio para soportar los 5 pilares sin inventar contenido faltante.

### 4.4 Stakeholders

- **Luis Flores** — owner, signoff de copy y estructura.
- **Claude** — ejecutor.
- **Equipo creativo (1 persona)** — bajo presión de workload, no recibe briefs ampliados en este spec.
- **Eventualmente:** equipo legal Propyte para validar disclaimer YMYL (texto base ya redactado en Manual §6.3.2 — ver A3).

---

## 5. Requirements

### 5.1 Funcionales

#### Bloque A — Limpieza de credibilidad

> **Cada tarea cita la fuente Propyte que la origina.**

- [ ] **A1. FLOORS** *(Auditoría YMYL §3.1 + Playbook "sin promesas vacías")* — **Resolución Q1 (2026-05-11):** Luis confirmó solo **2 desarrollos reales `LISTO PARA VENTA`** + decisión "mostrar cifras reales tal cual" (máxima transparencia). Implementación:
  1. Eliminar `const FLOORS = { developments: 170, units: 500, cities: 5, zones: 30 }` de `Hero.tsx:23`.
  2. Eliminar los `Math.max(stats?.x ?? 0, FLOORS.x)` y pasar directamente `stats.developments`, `stats.units`, `stats.cities`, `stats.zones`.
  3. Verificar que `getGlobalStats(supabase)` retorna datos solo de filas con `ext_publicado=true AND deleted_at IS NULL` (criterio v_developers).
  4. Render condicional por pill: si cifra === 0, no renderizar esa pill (filtrado dinámico — preserva la franja visual con las pills que sí tienen dato).
  5. El `suffix="+"` del `StatCounter` se mantiene solo si `cifra >= 10` (con 2 desarrollos no aplica `+`).
  6. Sin cambio visual de overlay, fondo, tipografía o color de las pills.
- [ ] **A2. whyPropyte** *(Auditoría YMYL §3.2 + Playbook §4 "Propuesta de Valor")* — Las 6 features genéricas se reducen a 3, cada una alineada a un pilar Playbook con prueba enlazada:
  1. **"Datos antes que entusiasmo"** → link a `/metodologia` (cómo se valida un desarrollo)
  2. **"Asesoría sin presión"** → link a `/equipo` (bios con credenciales)
  3. **"Transparencia desde el día uno"** → link a `/aviso-legal-inversion` (disclaimer + términos del simulador)
- [ ] **A3. Disclaimer YMYL + Cifras del Simulador** *(Manual §6.3.2 + Resolución Q8 2026-05-11)* — Dividida en dos sub-tareas:

  - [ ] **A3a. Disclaimer canónico (ejecutable inmediato)** — Reemplazar `roiSimulator.footnote` por la versión canónica del Manual §6.3.2:
    > *"Las proyecciones son estimaciones basadas en datos históricos y supuestos del usuario. No constituyen garantía de rendimiento. Consulta a un asesor Propyte para un análisis personalizado. Fuente de referencia: [Softec / AMPI / comparables internos Propyte] — actualización [fecha]."*

    Mostrar en Footer + inline en cualquier página con cifra de ROI/plusvalía. Resuelve Q6.

  - [ ] **A3b. Eliminar las 4 cifras del simulador (Resolución Q9 2026-05-11)** — Luis confirmó: "ninguna fuente comercial — fallback honesto". Plan:
    1. **Eliminar las 4 cards numéricas** del `AppDownloadBanner.tsx` (12% / 35% / $200K / 6 sem). Sin sustitución por rangos hasta tener fuente verificada.
    2. Reescribir copy del banner para que no prometa cifras:
       - Eyebrow: `"Simulador Financiero"` (sin cambio)
       - Título: `"Calcula tu rendimiento"` (quitar "en segundos" — sugerencia falsa de simplicidad)
       - Subtitle: `"Simula enganche, mensualidades y rendimiento proyectado con tus propios supuestos."` (en lugar de "datos reales del mercado de la Riviera Maya" — más honesto)
       - CTAs: `"Calcular mi rendimiento"` + `"Ver Inteligencia de Mercado"` (validar que `/mercado` tenga contenido antes de mantener el secondary CTA)
       - Footnote: disclaimer canónico A3a (Manual §6.3.2)
    3. Las cifras volverán al Home cuando exista fuente externa verificada (Softec/AMPI con licencia, o agregados públicos linkeables) — re-evaluar en Bloque B o C.
    4. **Keys i18n a actualizar:** `roiSimulator.title`, `roiSimulator.subtitle`. **Keys a eliminar:** `roiSimulator.metric1Value..metric4Label` (8 keys totales — incluir en grep de A.QA).
- [ ] **A4. Typo Inversionistas** *(Auditoría YMYL §3.3)* — `es.json` línea ~191: "Inversiónistas" → "Inversionistas". `en.json` sin cambio.
- [ ] **A5. Vestigial keys** *(Auditoría YMYL §3.4)* — Eliminar `hero.tab_comprar`, `hero.tab_rentar`, `hero.tab_preventa` de ES y EN.
- [ ] **A6. Eyebrow + H1 i18n** *(Manual §4.1 — copy canónico)* — Mover string hardcoded `"REAL ESTATE"` de `Hero.tsx:95` a JSON y alinear copy del Hero al manual:
  - `hero.eyebrow` ES: `"Bienes raíces · Riviera Maya"` / EN: `"Real Estate · Riviera Maya"`
  - `hero.title` ES: **`"Real estate en modo inteligente."`** / EN: **`"Real estate, powered by intelligence."`** *(citas literales del Manual §4.1)*
  - `hero.subtitle` ES: `"Datos verificables, asesoría sin presión y propiedades validadas en Tulum, Playa del Carmen y Mérida."` / EN equivalente.

  Estos son cambios de **texto**, no de tratamiento visual. El estilo del Hero se preserva.
- [ ] **A7. Links muertos** *(Auditoría YMYL §3.5)* — Fix `href="#"`:
  - `ValueProposition.tsx` botón "desarrolladores" → `/desarrolladores`
  - `MarketData.tsx` CTA → `/blog/mercado` o `/blog?category=analisis-mercado`

#### Bloque B — Reorganización mensajes

- [ ] **B1. Home rebuild — Manual §4.2 + ampliación E-E-A-T 2026** *(Decisión Luis 2026-05-11)* — El orden canónico del Manual §4.2 se mantiene como **base estructural** pero se amplía con 4 secciones nuevas de certidumbre porque el Manual fue escrito en marzo 2026 sin alinear a estándares YMYL/E-E-A-T sept-2025. El Bloque A dejó el Home delgado; este rebuild agrega sustancia sin tocar paleta ni tratamiento visual (solo decide **slots por sección** — dark/claro/glass — para alternancia rítmica).

  **Orden Home post-rebuild:**

  | # | Sección | Componente | Slot visual | Origen |
  |---|---|---|---|---|
  | 1 | Hero | `Hero` (post-A) | dark | Manual §4.2 #1 |
  | 2 | Nosotros teaser | **NUEVO** `NosotrosTeaser` | claro | Ampliación E-E-A-T |
  | 3 | Propiedades destacadas | `FeaturedProperties` | claro | Manual §4.2 #2 |
  | 4 | Metodología teaser | **NUEVO** `MetodologiaTeaser` (5 criterios SOP-3.2) | dark | Ampliación E-E-A-T |
  | 5 | Proceso de compra | **NUEVO** `ProcessInfographicPlaceholder` (espacio reservado para infografía Propyte — copy de Luis pendiente) | claro | Ampliación Luis 2026-05-11 |
  | 6 | Cómo funciona | `HowItWorks` (reactivar — ya existe) | claro o glass | Manual §4.2 #3 |
  | 7 | Por qué Propyte | `WhyPropyte` (3 features post-A2) | claro `#F4F6F8` | Manual §4.2 #4 |
  | 8 | Datos del mercado | `TrendingMarket` / `MarketData` | dark | Manual §4.2 #5 |
  | 9 | Dónde estamos | **NUEVO** `DondeEstamos` (Real Estate Lab + zonas cubiertas) | claro | Ampliación E-E-A-T |
  | 10 | Logos desarrolladores | `DeveloperLogos` (excepción E-E-A-T) | claro | Spec v2.1 |
  | 11 | FAQ del Home | **NUEVO** `HomeFAQ` (4 Q&A + JSON-LD FAQPage) | claro | Adelanto Bloque C2 |
  | 12 | Banner desarrolladores | `DeveloperBanner` | dark | Manual §4.2 #6 |
  | 13 | Banner únete al equipo | `JoinTeamBanner` | dark | Manual §4.2 #7 |
  | 14 | Blog reciente | `RecentBlog` (condicional B7) | claro | Manual §4.2 #8 |
  | 15 | Footer | `Footer` (post-A3a) | dark | Layout |

  **Componentes retirados del Home** (no listados en Manual §4.2 ni ampliación):
  - `Testimonials` → retirar (B3, Manual §7.1).
  - `LeadMagnet` → migrar a `/blog` o `/propiedades` (decisión Q11).
  - `ExploreCategories` → migrar a `/propiedades` como nav inicial de tipo (Q11).
  - `AppDownloadBanner` → migrar al cierre de `/propiedades` o a `/simulador` futuro (Q11).
  - `ValueProposition` → retirar (queda redundante con WhyPropyte 3-features).

  **Slots visuales — decisión "solo slots" (Luis 2026-05-11)**: la paleta brand (#A2F9FF, navy `#1A2F3F`, aztec `#0F1923`, dark900 `#0B1C1E`, dark600 `#132B2E`, light `#F4F6F8`) **no se toca**. Cada sección decide solo si su fondo es dark/claro/glass para alternancia rítmica que da estructura visual sin rediseño. Las secciones nuevas reutilizan utilities existentes (`propyte-card-glass-light`, `propyte-glass-pill`, tokens cyan-100/200).

  **Justificación documental**: Manual §4.2 sigue siendo base. La ampliación queda registrada en memoria `project_next_propyte_propyte_canon.md` como excepción documentada cuando se requiere certidumbre YMYL adicional. No desautoriza el Manual.

- [ ] **B1.1 NosotrosTeaser** *(nueva sección — Ampliación E-E-A-T)* — Crear `src/components/home/NosotrosTeaser.tsx`. Slot: claro. Copy:
  - Eyebrow: "Quiénes somos"
  - Título: "Comercializamos bienes raíces con datos y sin presión"
  - Descripción (2 párrafos): equipo bilingüe + años en plaza (de Manual/Playbook) + qué hacemos diferente (validación estratégica de cada desarrollo, asesoría consultiva, transparencia documentada)
  - 3 mini-stats (sin cifras inventadas — solo verificables): "8+ años en plaza", "Bilingüe ES/EN", "Validación SOP-3.2 documentada"
  - CTA: "Conoce al equipo" → `/equipo` (creado en B4)
  - Sin testimoniales (Manual §7.1)

- [ ] **B1.2 MetodologiaTeaser** *(nueva sección — Ampliación E-E-A-T)* — Crear `src/components/home/MetodologiaTeaser.tsx`. Slot: dark. Los 5 criterios del Scorecard SOP-3.2:
  1. **Claridad legal** — escritura, fideicomiso, anticorrupción
  2. **Fiabilidad de plazos** — historial del desarrollador, contratos
  3. **Precio comparable** — análisis de mercado por zona
  4. **Calidad constructiva** — visitas, especificaciones, materiales
  5. **Vendibilidad** — análisis de demanda y reventa
  - Eyebrow: "Metodología Propyte"
  - Título: "Cinco criterios antes de listar un desarrollo"
  - Subtitle breve explicando que cada criterio es validado por el equipo legal/comercial
  - 5 cards horizontales (1 línea de descripción cada una)
  - CTA: "Ver metodología completa" → `/metodologia` (creado en B4)

- [ ] **B1.3 ProcessInfographicPlaceholder** *(espacio reservado)* — Crear `src/components/home/ProcessInfographic.tsx` como placeholder. Slot: claro. Contenido provisional:
  - Eyebrow: "Proceso de compra Propyte"
  - Título: "De la primera llamada a la escrituración"
  - Espacio amplio (~600px alto, max-width 1280px) con border dashed `border-2 border-dashed border-[#A2F9FF]/30` y texto centrado: *"Infografía en preparación — próxima sesión incluirá los pasos del proceso documentado paso a paso."*
  - Sin CTA (componente en construcción)
  - Cuando Luis pase el contenido, el placeholder se reemplaza por el componente final con steps reales

- [ ] **B1.4 DondeEstamos** *(nueva sección — Ampliación E-E-A-T)* — Crear `src/components/home/DondeEstamos.tsx`. Slot: claro. Contenido:
  - Eyebrow: "Dónde estamos"
  - Título: "Cobertura en Riviera Maya y Yucatán"
  - Layout 2 columnas:
    - Izquierda: card "Real Estate Lab" con dirección `Calle 5 Norte 95, Playa del Carmen, Q. Roo` (SOP Hostess §2.1), teléfono, horario, link a `/contacto`
    - Derecha: lista visual de zonas cubiertas (Tulum, Playa del Carmen, Cancún, Mérida, Bacalar) cada una con número de desarrollos activos si la query devuelve >0
  - Sin mapa interactivo en esta versión (evitar dependencia Google Maps en Home — ya está en `/propiedades`)
  - Posible CTA secundario: "Agendar visita al Lab" → `/contacto`
- [ ] **B2. Microcopy CTAs** *(Manual §4.2 + Playbook tono consultor)* — Reescribir labels primarios en JSON ES/EN:
  | Key | Antes | Después | Fuente |
  |---|---|---|---|
  | `hero.searchCta` | "Buscar" | "Buscar propiedad" | Manual §4.1 |
  | `joinTeam.cta` | "Únete al Equipo" | "Conoce el Plan de Carrera" | Manual §4.2 |
  | `developerBanner.cta` | "Solicitar Propuesta" | "Solicitar Propuesta Comercial" | Manual §7.1 |
  | `roiSimulator.ctaPrimary` | "Abrir Simulador" | "Calcular mi rendimiento" | Playbook tono |
  | `featuredProperties.cta` | varios | "Ver Todas las Propiedades" | Manual §4.2 |
- [ ] **B3. Testimonios** *(Manual §7.1 — RESOLUCIÓN DIRECTA de Q3)* — El Manual establece: *"No se incluyen casos de éxito por ahora (el primer MasterBroker firma en diciembre 2026)."* Decisión: **retirar `Testimonials` del Home**. Migrar el componente a `/equipo` si hay testimonios con consentimiento explícito; si no, archivar el componente. Esto **elimina el riesgo de re-consentimiento** y resuelve el hallazgo de marca huérfana "Manejo de Datos" (Q5 deja de aplicar — ver §9).
- [ ] **B4. Páginas de confianza** *(Manual §2.1 + SOP-3.2 + QRG E-E-A-T)* — Crear estas páginas reutilizando los componentes de layout y los estilos del resto del sitio (no se diseñan plantillas nuevas):
  - **`/metodologia`** — cómo se valida un desarrollo (Scorecard SOP-3.2, criterios de claridad/fiabilidad/precio/calidad/vendibilidad). Schema `WebPage` + breadcrumb.
  - **`/equipo`** *(Resolución directa de Q4: Manual §2.1 ya define `/equipo` como canónico)* — bios reales con credenciales (AMPI, CFA, idiomas, años en plaza). Schema `WebPage` con `about: Organization` + `mainEntity: Person[]`. Si existe `/nosotros/equipo-comercial`, agregar redirect 301 → `/equipo`.
  - **`/aviso-legal-inversion`** — disclaimer completo + términos del simulador + fuentes de datos. Schema `WebPage`.
  - Linkear estas 3 desde Footer columna "Legal/Transparencia" y desde claims numéricos en Home.
- [ ] **B5. H1/H2 keyword-rich** *(Auditoría YMYL §3.7 + intent de búsqueda mexicano)* — Reemplazar headings genéricos. Es un cambio de **texto**, los estilos tipográficos de cada heading se mantienen:
  | Sección | Antes | Después |
  |---|---|---|
  | `FeaturedProperties` H2 | "Propiedades destacadas" | "Desarrollos destacados en preventa · Tulum, Playa del Carmen y Mérida" |
  | `HowItWorks` H2 | — (reactivar) | "Cómo invertir con Propyte: Explora, analiza, decide" |
  | `WhyPropyte` H2 | "Por qué Propyte" | "Por qué inversionistas eligen Propyte para Riviera Maya" |
  | `TrendingMarket` H2 | "Datos del mercado" | "Mercado inmobiliario Riviera Maya: ROI, plusvalía y demanda 2026" |
  | `RecentBlog` H2 | "Blog reciente" | "Análisis y guías de inversión inmobiliaria · Riviera Maya" |
- [ ] **B6. Tono Propyte — pass de copy** *(Playbook §4 + valores "sin humo, sin improvisación")* — Reemplazos masivos en ES y EN:
  | Key | Antes | Después |
  |---|---|---|
  | `seo.homeDescription` | "La plataforma inmobiliaria más inteligente" | "Comercializamos bienes raíces en Tulum, Playa del Carmen y Mérida con datos, simuladores y asesoría sin presión." |
  | `whyPropyte.subtitle` | "tecnología, datos y experiencia" | "Equipo bilingüe, validación estratégica de cada desarrollo y proceso documentado desde el contacto hasta la escrituración." |
  | `hero.subtitle` | "Análisis de mercado verificado" | "Datos verificables, asesoría sin presión y propiedades validadas." |
  | Footer `tagline` | (varias) | **"Real estate en modo inteligente."** (canónico Manual) |
  | Disclaimer `brand` | (varias) | **"PROPYTE™ — Property + Byte. Sin humo. Sin improvisación. Sin promesas vacías."** (canónico Manual cierre) |

  **Frases prohibidas** a auditar y remover globalmente: *"oportunidad única"*, *"se vende solo"*, *"plusvalía garantizada"*, *"rendimientos asegurados"*, *"inversión segura"*. (Playbook §4 las enumera explícitamente como anti-patrón.)
- [ ] **B7. RecentBlog condicional** *(Auditoría YMYL §3.8 + Manual §7.3)* — Render condicional: si `posts.length >= 3`, render normal con 3 cards. Si `< 3`, render alternativo: card placeholder "Próximamente: análisis mensual de mercado y guías de inversión" + CTA "Suscríbete al newsletter" (alineado a estrategia Phase 1 email list). **No esconder la sección** — comunica intención editorial. Reutilizar el estilo de card existente.

#### Bloque C — SEO técnico profundo

- [ ] **C1. Ampliar SchemaMarkup** *(Manual §7.3 lista los schemas requeridos)*:
  - **C1.a.** `case 'website'` con `potentialAction: SearchAction` apuntando a `/propiedades?search={search_term_string}`. Inyectar en `[locale]/layout.tsx`. Activa Sitelinks Search Box.
  - **C1.b.** `realEstateListing` shape real per Schema.org: `Apartment`/`House`/`Residence` según `Propyte_desarrollos.property_type`, `floorSize`, `numberOfRooms`, `numberOfBathroomsTotal`, `price`, `priceCurrency: "MXN"|"USD"`, `offers`, `geo`, `brand: "Nativa Tulum"` cuando aplique. Inyectar en `/propiedades/[slug]/page.tsx`.
  - **C1.c.** `aggregateRating` + `review` — **DIFERIDO/BLOQUEADO** hasta que existan testimonios consentidos (B3 retira testimonios del Home; Manual §7.1 fija el desbloqueo en dic-2026 con primer MasterBroker firmado). Tarea queda registrada en §10 con label `bloqueada` para no perderse.
  - **C1.d.** `breadcrumb` helper — crear `src/components/shared/Breadcrumb.tsx` (UI + JSON-LD) reutilizando los estilos de navegación existentes; aplicar en páginas principales.
  - **C1.e.** `localBusiness` schema con `address: "Calle 5 Norte 95, Playa del Carmen, Q. Roo"` (Real Estate Lab — SOP Hostess §2.1), `parentOrganization: Organization`, `legalName: "Nativa Tulum"`.
  - **C1.f.** `blogPosting` schema en plantilla de artículo del blog (preparado aunque no haya posts aún).
- [ ] **C2. FAQPage en Home** *(Auditoría YMYL §3.10 — Q7 resuelto con queries de intent real)* — Crear `<HomeFAQ />` con 4 Q&A + JSON-LD. Acordeón visible (no solo JSON-LD oculto). Reutilizar el patrón de accordion ya existente en el sitio (si no existe, mantenerlo simple y consistente con el sistema vigente).

  Preguntas validadas contra perfil de inversionista del Playbook (mexicano-americano, canadiense, nacional):
  1. *"¿Un extranjero puede comprar propiedad en Tulum o Playa del Carmen?"* (fideicomiso bancario, zona restringida)
  2. *"¿Cuánto cuesta el cierre legal de una propiedad en Riviera Maya?"* (impuestos, notario, fideicomiso anual)
  3. *"¿Cuál es el ROI realista de un Airbnb en Tulum?"* (rango por zona + metodología, sin garantías)
  4. *"¿Qué pasa si compro en preventa y el desarrollo se retrasa?"* (validación Scorecard SOP-3.2, contingencias)

  Ubicación: después de `TrendingMarket`, antes de `DeveloperBanner`.
- [ ] **C3. OG images dinámicas** *(Auditoría YMYL §3.11)* — Extender `src/app/[locale]/opengraph-image.tsx` con `ImageResponse` de `next/og` (Edge runtime) por-ruta. Mínimo: home + `/propiedades/[slug]` + `/zonas/[slug]` + `/blog/[slug]`. **Tratamiento visual:** replicar el estilo y paleta de la OG image actual del Home, solo cambiando el texto dinámico por página. No se diseña un nuevo estilo de OG.
- [ ] **C4. Hero performance** *(Auditoría YMYL §3.12)* —
  - `<link rel="preload" as="video" />` cuando `NEXT_PUBLIC_HERO_VIDEO_URL` está definido.
  - Forzar `poster={imageUrl || defaultPoster}` siempre.
  - Medir LCP con `npx lighthouse https://dev.propyte.com/es --view`. Objetivo: LCP < 2.5s mobile.
  - El tratamiento visual del Hero (video, overlay, gradiente, colores) **no cambia**.
- [ ] **C5. Sitelinks Search Box** — auto-activado por C1.a, validar en Rich Results Test.
- [ ] **C6. Sitemap + hreflang** *(Manual §2.2 ya define patrón bilingüe)* — Agregar las 3 páginas nuevas (`/metodologia`, `/equipo`, `/aviso-legal-inversion`) a `src/app/sitemap.ts`. Verificar `hreflang` simétrico ES/EN con `x-default` a ES.

### 5.2 No funcionales

- **Performance**: LCP < 2.5s, INP < 200ms, CLS < 0.1 en Home. Sin regresión vs. baseline.
- **Accesibilidad**: mantener WCAG AA. Hit area mínimo 44×44px. `aria-label` en CTAs sin texto.
- **SEO**: Lighthouse SEO ≥ 95 en rutas principales. Rich Results Test pasa los 8 schemas.
- **i18n**: 0 keys huérfanas, 0 keys sin traducir. Verificación con `grep` exhaustivo por cada cambio de key.
- **YMYL compliance**: disclaimer visible en toda página con cifras de ROI/plusvalía. Linkeable desde Footer permanente.
- **Seguridad**: ningún cambio toca `.env`, schemas Supabase, RLS, ni claves.
- **Preservación visual**: ningún componente existente cambia tratamiento estético. Componentes nuevos (`HomeFAQ`, páginas de confianza, `Breadcrumb`) reutilizan los estilos del sistema vigente.

---

## 6. Approach / Arquitectura

### 6.1 Flujo de trabajo

```
develop (base)
  │
  └── feat/content-audit-seo-2026
        │
        ├── commit A1..A7   (Bloque A — ~1-2 días)
        ├── commit B1..B7   (Bloque B — ~1 semana)
        └── commit C1..C6   (Bloque C — ~2-3 días)
              │
              └── PR a develop (review Luis) → Vercel staging
                    │
                    └── validación 48h → merge develop → main → Hostinger prod
```

Cada bloque cierra con: typecheck + Playwright e2e + screenshot diff manual en `dev.propyte.com`. **El screenshot diff verifica que no haya cambios visuales no intencionales** — si un componente existente cambia de aspecto, es regresión.

### 6.2 Archivos tocados (estimado)

**Bloque A:**
- `src/components/home/Hero.tsx` (FLOORS removal + H1/eyebrow i18n; sin cambio de estilos)
- `src/i18n/messages/{es,en}.json` (A2, A3, A4, A5, A6, A7 keys)
- `src/components/home/AppDownloadBanner.tsx` (disclaimer inline)
- `src/components/layout/Footer.tsx` (disclaimer link + tagline canónico)
- `src/components/sections/ValueProposition.tsx`, `src/components/home/MarketData.tsx` (links)

**Bloque B:**
- `src/app/[locale]/page.tsx` (reorden per Manual §4.2)
- `src/components/home/WhyPropyte.tsx` (6→3 features; sin rediseño)
- `src/components/home/HowItWorks.tsx` (**ya existe — solo reactivar y conectar en `page.tsx`**; ajustar copy si es necesario)
- `src/components/home/Testimonials.tsx` (retirar del Home — migrar o archivar)
- `src/components/home/RecentBlog.tsx` (condicional con CTA newsletter)
- `src/i18n/messages/{es,en}.json` (B2, B5, B6 mass-edit)
- **NUEVO** `src/app/[locale]/metodologia/page.tsx` (layout y estilos del sistema)
- **NUEVO** `src/app/[locale]/equipo/page.tsx` (+ redirect desde `/nosotros/equipo-comercial`)
- **NUEVO** `src/app/[locale]/aviso-legal-inversion/page.tsx`
- `src/components/layout/Footer.tsx` (nav legal)

**Bloque C:**
- `src/components/shared/SchemaMarkup.tsx` (WebSite, RealEstateListing real, LocalBusiness con address, BlogPosting)
- **NUEVO** `src/components/shared/Breadcrumb.tsx`
- **NUEVO** `src/components/home/HomeFAQ.tsx`
- `src/app/[locale]/layout.tsx` (WebSite schema global)
- `src/app/[locale]/propiedades/[slug]/page.tsx` (RealEstateListing)
- `src/app/[locale]/opengraph-image.tsx`
- `src/app/sitemap.ts`

### 6.3 Decisiones clave reconciliadas con fuentes

1. **Orden Home** → Manual §4.2 es ley. Se retiran componentes no listados ahí (Testimonials, LeadMagnet, ExploreCategories, AppDownloadBanner). **Excepción consciente:** `DeveloperLogos` se preserva como sustento E-E-A-T real (es la única prueba social legítima disponible hasta dic-2026; filtra por `verified=true`). El **tratamiento visual de los componentes que permanecen no cambia**.
2. **HowItWorks** → componente ya existe en `src/components/home/HowItWorks.tsx` pero no está renderizado. Se reactiva conectándolo en `page.tsx` y revisando copy. No es creación nueva.
3. **Testimonios** → Manual §7.1 lo resuelve: no hay casos hasta dic-2026 → retirar del Home.
4. **`/equipo`** → Manual §2.1 lo establece como canónico → usar `/equipo` con redirect 301 desde `/nosotros/equipo-comercial` si existe.
5. **Schema set** → Manual §7.3 enumera el set completo → implementar todos los implementables. `AggregateRating + Review` queda bloqueado hasta dic-2026 por dependencia con testimonios.
6. **Disclaimer wording** → Manual §6.3.2 ya lo redactó → usar literal, no inventar nuevo.
7. **FAQ topics** → Inferidos del perfil de inversionista del Playbook — alineado a queries reales en el embudo.
8. **Voice & tone** → Playbook §4 y SOP. Aplicar como filtro en cada string de copy.
9. **Hero treatment** → conservar el tratamiento visual actual. Los cambios son: quitar FLOORS, migrar copy a i18n con H1 canónico, optimizar performance.

---

## 7. Acceptance Criteria

### Bloque A
- [ ] `Hero.tsx` ya no usa `FLOORS` constant (grep returna 0 matches).
- [ ] `hero.title` ES = `"Real estate en modo inteligente."` (literal Manual).
- [ ] `whyPropyte` JSON tiene 3 features con link a página de evidencia.
- [ ] `roiSimulator.footnote` + Footer contienen disclaimer canónico del Manual §6.3.2.
- [ ] `es.json` no tiene "Inversiónistas" ni `tab_comprar/rentar/preventa` (grep = 0).
- [ ] `Hero.tsx` no tiene "REAL ESTATE" hardcoded (grep = 0).
- [ ] `grep -r 'href="#"' src/` no devuelve matches en ValueProposition ni MarketData.
- [ ] `grep -ri 'plusvalía garantizada\|inversión segura\|oportunidad única\|se vende solo' src/i18n/` = 0.
- [ ] `npm run typecheck` pasa limpio. Playwright `tests/qa-uiux-home/` pasa.
- [ ] **Screenshot diff:** ningún cambio visual no intencional en Hero, Footer, banners.

### Bloque B
- [ ] `src/app/[locale]/page.tsx` con orden Manual §4.2 (verificable con diff).
- [ ] `Testimonials` no aparece en Home (verificado en `dev.propyte.com`).
- [ ] `HowItWorks` renderiza con Explora → Analiza → Decide (componente reactivado, no creado), usando estilos del sistema existente.
- [ ] `DeveloperLogos` se conserva en Home con justificación documentada (sustento E-E-A-T).
- [ ] `RecentBlog` con render condicional probado en local con 0, 1, 2, 3+ posts.
- [ ] `/metodologia`, `/equipo`, `/aviso-legal-inversion` existen con WebPage schema + breadcrumb + estilos consistentes con el resto del sitio.
- [ ] Redirect 301 de `/nosotros/equipo-comercial` → `/equipo` activo si existe la ruta legacy.
- [ ] H1/H2 keyword-rich aplicados (B5 tabla completa).
- [ ] Replacements de B6 sincronizados ES/EN.

### Bloque C
- [ ] Rich Results Test pasa para Home, `/propiedades/[slug]`, `/zonas/[slug]`: Organization, WebSite, RealEstateListing, BreadcrumbList, FAQPage, LocalBusiness, BlogPosting.
- [ ] Lighthouse SEO ≥ 95 en las 4 rutas principales.
- [ ] `<HomeFAQ />` con 4 Q&A + JSON-LD válido + acordeón funcional.
- [ ] LCP < 2.5s en `dev.propyte.com/es` (medido Lighthouse mobile).
- [ ] Sitelinks Search Box visible en Rich Results Test.
- [ ] OG image dinámica funciona en `/propiedades/<slug>` y `/zonas/<slug>` con estilo consistente al actual.
- [ ] `sitemap.xml` incluye las 3 páginas nuevas. `hreflang` simétrico verificado.

### Global
- [ ] PR `feat/content-audit-seo-2026` → `develop` con descripción enlazando este spec.
- [ ] Signoff de Luis en el PR.
- [ ] Validación 48h en `dev.propyte.com` antes de merge a `main`.
- [ ] Memoria `project_next_propyte_web_estado.md` actualizada.

---

## 8. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Luis rechaza disclaimer YMYL por "asusta al cliente" | L | M | Disclaimer es literal del Manual aprobado por dirección. Mostrar evidencia QRG sept-2025. |
| Retirar Testimonials genera vacío visual en Home | M | L | El reorden del Manual §4.2 ya rellena la sección con `HowItWorks` + Datos del Mercado + Banners. Visualmente queda denso. |
| Cambio de keys i18n rompe traducciones | M | M | Cada cambio acompañado de `grep` + sync ES/EN simultáneo. |
| Schema.org error invalida resultados Google | L | H | Validar con Rich Results Test antes de merge a main. |
| RealEstateListing schema falla porque `floorSize`/`numberOfRooms` están vacíos | M | M | Implementar fallback: omitir propiedades del schema si faltan campos críticos. SOP-3.2 → solo schema-izar `LISTO PARA VENTA`. |
| `/equipo` redirect rompe links externos | L | L | Redirect 301 preserva SEO. Auditar backlinks en GSC antes/después. |
| Performance regression por nuevos JSON-LD | L | L | JSON-LD es liviano (<5KB total), sin impacto LCP. |
| ISR cache stale tras cambios | M | L | `revalidateTag` en deploy. |
| **Cambio visual no intencional al refactorizar componentes** | M | M | **Screenshot diff manual obligatorio antes de cerrar cada bloque.** Si Hero, Footer, banners cambian de aspecto, es regresión y se corrige. |
| Migración de `ExploreCategories`/`LeadMagnet`/`AppDownloadBanner` fuera del Home pierde tráfico interno | L | M | Linkear desde Footer + páginas relacionadas. Medir clicks pre/post en GA4. |

---

## 9. Open Questions

> **Resueltas con fuentes Propyte y NO bloquean ejecución:**
>
> - ~~Q1 FLOORS política~~ → **Resuelto 2026-05-11**: solo 2 desarrollos reales `LISTO PARA VENTA`. Decisión Luis: "mostrar cifras reales tal cual". Implementación detallada en A1.
> - ~~Q2 Second CTA Developer vs Broker~~ → **Resuelto**: Manual §1.3 y §4.2 — ambos coexisten en Home.
> - ~~Q3 Testimonios re-consentimiento~~ → **Resuelto**: Manual §7.1 — no hay casos hasta dic-2026 → retirar del Home (B3).
> - ~~Q4 `/equipo` ruta canónica~~ → **Resuelto**: Manual §2.1 — usar `/equipo`.
> - ~~Q5 "Manejo de Datos"~~ → **Resuelto**: si retiramos Testimonials del Home (B3), el problema desaparece.
> - ~~Q6 Disclaimer wording~~ → **Resuelto**: Manual §6.3.2 ya tiene texto aprobado.
> - ~~Q7 FAQ topics~~ → **Resuelto**: 4 preguntas validadas contra perfil de inversionista Playbook (C2).
> - ~~Q8 ROI methodology~~ → **Resuelto 2026-05-11**: "reales, nada aspiracional". Approach inicial: rangos públicos con fuente externa. Implementación final tras resolver Q9.
> - ~~Q9 Fuentes externas (Softec/AMPI)~~ → **Resuelto 2026-05-11**: ninguna fuente comercial todavía. Fallback honesto: eliminar las 4 cifras del simulador (A3b). Las cifras vuelven cuando exista fuente verificada — re-evaluar en Bloque B/C.

> **Requieren input de Luis antes del bloque correspondiente:**

- **Q10 (Para Hub editorial, post-merge)**: ¿Quién es el autor declarable de los futuros posts del blog (E-E-A-T exige autoría con credenciales)? El Playbook menciona `Felipe Luksic — Director Comercial, Co-fundador` como firma — ¿es el `author` por defecto del schema BlogPosting hasta que se contrate un Hub editor?

- **Q11 (Bloque B1). Migración de componentes fuera del Home**: confirmar destino final de `ExploreCategories`, `LeadMagnet`, `AppDownloadBanner` (¿`/propiedades`, `/blog`, `/simulador` futuro, o se archivan?).

---

## 10. Plan de tareas (preliminar — se promueven a `task_manager.md`)

### Bloque A — Limpieza credibilidad (~1-2 días)

- [x] **A0.** Q1, Q6, Q8, Q9 resueltas con Luis (2026-05-11). Bloque A totalmente desbloqueado.
- [ ] **A1.** FLOORS removal — `Hero.tsx`: eliminar constant, pasar stats reales, render condicional por pill (omitir si === 0). Sin cambio visual.
- [ ] **A2.** `whyPropyte` 6→3 features con links de evidencia.
- [ ] **A3a.** Disclaimer YMYL (literal Manual §6.3.2) en JSON + Footer + AppDownloadBanner footnote.
- [ ] **A3b.** Eliminar 4 cards numéricas del `AppDownloadBanner` + reescribir copy del simulador sin claims numéricos. Eliminar 8 keys i18n `roiSimulator.metric*`.
- [ ] **A4.** Typo "Inversiónistas" → "Inversionistas".
- [ ] **A5.** Eliminar vestigial keys (`tab_comprar/rentar/preventa`).
- [ ] **A6.** Eyebrow + H1 i18n canónico Manual §4.1.
- [ ] **A7.** Fix `href="#"` (ValueProposition + MarketData).
- [ ] **A.QA.** typecheck + Playwright + screenshot diff + grep de frases prohibidas (Playbook §4).
- [ ] **A.PR.** Push a `feat/content-audit-seo-2026`, Vercel preview, revisión Luis del bloque A.

### Bloque B — Reorganización mensajes (~1 semana)

- [ ] **B0.** Confirmar Q11 (destino final de `ExploreCategories`, `LeadMagnet`, `AppDownloadBanner` migrados fuera del Home).
- [ ] **B1.** Reorden Home per Manual §4.2 — `src/app/[locale]/page.tsx`. Reactivar `HowItWorks` (existente). Preservar `DeveloperLogos` con justificación E-E-A-T.
- [ ] **B2.** Microcopy CTAs (tabla B2).
- [ ] **B3.** Retirar `Testimonials` del Home (resolución Manual §7.1).
- [ ] **B4.** Crear `/metodologia`, `/equipo`, `/aviso-legal-inversion`. Redirect 301 de legacy.
- [ ] **B5.** H1/H2 keyword-rich (tabla B5).
- [ ] **B6.** Tono Propyte pass — replacement masivo + auditoría de frases prohibidas.
- [ ] **B7.** `RecentBlog` condicional + CTA newsletter.
- [ ] **B.QA.** typecheck + e2e + screenshot diff + manual review + Lighthouse comparativo.

### Bloque C — SEO técnico (~2-3 días)

- [ ] **C1.a.** WebSite + SearchAction schema (`[locale]/layout.tsx`).
- [ ] **C1.b.** RealEstateListing real (`/propiedades/[slug]/page.tsx`).
- [ ] **C1.c.** AggregateRating + Review schema — **BLOQUEADA hasta dic-2026 (primer MasterBroker firmado, Manual §7.1)**. Tarea pre-registrada para no perderse.
- [ ] **C1.d.** Breadcrumb helper UI + JSON-LD.
- [ ] **C1.e.** LocalBusiness con address Real Estate Lab + parentOrg (`legalName: Nativa Tulum`).
- [ ] **C1.f.** BlogPosting schema (plantilla de blog).
- [ ] **C2.** HomeFAQ con 4 Q&A + JSON-LD.
- [ ] **C3.** OG images dinámicas por-ruta (estilo consistente al actual).
- [ ] **C4.** Hero performance (preload video + poster default; sin cambio visual).
- [ ] **C5.** Validar Sitelinks Search Box en Rich Results.
- [ ] **C6.** Sitemap + hreflang para páginas nuevas.
- [ ] **C.QA.** Rich Results Test + Lighthouse ≥ 95 + typecheck + e2e.

### Cierre

- [ ] PR a `develop` con descripción + link a este spec.
- [ ] Signoff Luis.
- [ ] Merge → Vercel staging → 48h validación.
- [ ] Merge `develop` → `main` → Hostinger prod.
- [ ] Actualizar `project_next_propyte_web_estado.md`.

---

**Cierre del documento.**

PROPYTE™ — Property + Byte. Sin humo. Sin improvisación. Sin promesas vacías.
