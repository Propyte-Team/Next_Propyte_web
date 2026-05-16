# Audit de Diseño Propyte Web — Catálogo de Cambios

> **Branch:** `feat/glass-system-propagation`
> **Fecha:** 2026-05-15
> **Fuente:** `NOTAS PARA CAMBIOS Y ARREGLOS DE DISEÑO WEB_.pdf` (audit de diseñadora, vía Luis)
> **Estado:** Scoping — pendiente de podar antes de plan TDD detallado

---

## Resumen ejecutivo

El audit tiene **~75 ítems** repartidos en 12+ páginas. La mayoría se resuelve con **5-7 cambios de alto leverage** (tokens, glass utility, hero pattern, botón WhatsApp, numeración steps, color icon-pill). Los demás son aplicaciones puntuales del sistema.

**Hallazgo importante del recon:**
- ✅ Los tokens brand (`--propyte-brand #A2F9FF`, cyan-50/100/200/300, dark-900/800/700/600) **ya existen** en `src/styles/globals.css`. La diseñadora confirma la paleta — no hay que crearla.
- ⚠️ El token `--color-amber: #F5A623` sigue presente y se usa en utilidades. Esto es lo que el audit llama "naranja que no corresponde a la marca".
- ✅ Las 6 variantes de `propyte-card-glass*` ya cubren los 2 estilos del audit (radius 52px / 40px).
- ⚠️ `WhatsAppButton` usa `#25D366` puro → choca con `#A2F9FF` (ambos saturados). Audit propone invertir (fondo dark + letras brand) — **necesita decisión**.
- ❌ `HowItWorks` (home) no tiene numeración `01/02/03` — sí la tiene `B2BProcess.tsx`.

---

## Convenciones

| Campo | Valores |
|---|---|
| **Leverage** | A = tokens (impacta todo) · B = componente compartido · C = página única |
| **Esfuerzo** | S = ≤30 min · M = 30–90 min · L = >90 min |
| **Riesgo regresión** | 🟢 bajo · 🟡 medio · 🔴 alto |
| **Estado propuesto** | `[IN]` lo hago · `[OUT]` descarto · `[DEFER]` otra sesión · `[⚠️]` necesito decisión |

**Antes de empezar:** WIP actual tiene 11 archivos modificados (glass system). Commiteamos o stash antes de abrir bloques nuevos.

---

## Tier A — Tokens y sistema global

Cambios que tocan `src/styles/globals.css` y aplican a TODO el sitio. Empezar aquí da el máximo ROI.

### A1. Eliminar `--color-amber` orange · `[IN]` · L=A · M · 🟡
**Audit:** "color naranja no corresponde a la marca" (varias ocurrencias)
**Archivos:**
- `src/styles/globals.css` (token amber L14)
- grep de `text-amber|bg-amber|amber-` para reemplazo
**Acción:** Mapear cada uso de amber → cyan o brand. Si el contexto pedía advertencia/warning real, mantener pero renombrar con propósito semántico.

### A2. Utility `.amenity-icon` con color brand · `[IN]` · L=A · S · 🟢
**Audit:** "iconos amenidades deben adaptarse a color de marca" (pág 6)
**Archivos:**
- `src/styles/globals.css` (nueva utility)
- `src/components/property/AmenityList.tsx` (aplicar)
**Acción:** Definir `color: var(--propyte-cyan-200)` o `--propyte-brand` y aplicar a todos los Lucide icons.

### A3. Utility `.step-number` con formato 01/02 · `[IN]` · L=A · S · 🟢
**Audit:** "números deben ser 01, 02, 03..." (págs 7, 8, 11)
**Acción:** Helper TS `formatStepNumber(n)` retorna `String(n).padStart(2, '0')` + utility CSS para tamaño/peso/color. Sustituir en `HowItWorks.tsx`, secciones de proceso/metodología.

### A4. Verificar glass cards mapean specs audit · `[IN]` · L=A · S · 🟢
**Audit:** Estilo 01 → radius 52px + `rgba(72,115,121,0.40)` (pág 2); Estilo 02 → radius 40px + border 1px + shadow + blur 52px (pág 3)
**Acción:** Diff entre `.propyte-card-glass` actual (radius 52, blur 20) y spec audit (radius 52, blur 52). Ajustar blur si difiere. Confirmar `.propyte-card-glass-lg` matchea Estilo 02.

### A5. Botón WhatsApp inversión completa · `[IN]` · L=A · S · 🟡
**Audit:** "verde WhatsApp choca con cyan brand; invertir fondo→dark, letras→brand" (pág 7)
**Archivos:** `src/components/shared/WhatsAppButton.tsx`
**Decisión Luis:** opción **(a) Inversión completa** — fondo `dark-900`, texto `brand`, icono brand. Hover: lighten 1 step en dark-800.

---

## Tier B — Hero / Header (pattern "Propuesta dos")

### B1. Hero home — pattern propuesta dos · `[IN]` · L=B · M · 🟡
**Audit:** "propuesta dos" (pág 3) — H1 centrado, "Riviera Maya" en cyan brand, eyebrow "REAL ESTATE", overlay dark más fuerte para contraste tipográfico
**Archivos:** `src/components/home/Hero.tsx`
**Comparar con actual:** ya tiene overlay `from-#0B1C1E/55 via-30 to-/85`. Verificar contraste con texto y reforzar si necesario. La diseñadora ya mostró el preview correcto en la propuesta dos — replicarlo lo más cerca posible.

### B2. Stats inferiores hero · `[IN]` · L=B · S · 🟢
**Audit:** "170+ Desarrollos · 500+ Unidades · 5 Ciudades · 30+ Zonas" (pág 3, propuesta dos)
**Archivos:** `src/components/home/Hero.tsx` o `HeroStats.tsx`
**Acción:** Verificar que existe sección de stats con esos valores. Si está pero con tipografía/spacing diferente, ajustar.


---

## Tier C — Cards y botones sistémicos

### C1. Reducir radius cards de tipo-propiedad · `[IN]` · L=B · S · 🟢
**Audit:** "Explora por tipo de propiedad — radius muy redondeado" (pág 4-5)
**Acción:** Cambiar `rounded-3xl/full` por `rounded-xl` o `rounded-2xl` en cards de categoría tipo-propiedad de la home.

### C2. Separación cards listado propiedades · `[IN]` · L=B · S · 🟢
**Audit:** "fichas pegadas, no tienen su espacio y protagonismo" (pág 5)
**Archivos:** `src/components/marketplace/PropertyList.tsx` o grid en `/propiedades`
**Acción:** Aumentar `gap` del grid (4 → 6 o 8) y verificar `padding` interno tarjeta.

### C3. Pills/badges (Departamento, Preventa, Entrega inmediata) · `[IN]` · L=B · S · 🟢
**Audit:** "botones Departamento/Preventa deben ser negro (contraste con brand)" + "Entrega Inmediata color brand" (págs 4, 5)
**Acción:** Definir 2 variants de pill: solid-dark (categoría) + solid-brand (estado).

### C4. Botón "Verificado" texto negro · `[IN]` · L=B · S · 🟢
**Audit:** "texto del botón verificado debe ser negro para contraste" (pág 6)
**Archivos:** componente de badge "VERIFICADO" (probablemente en card o ficha)

### C5. Tipografía cards listado · `[IN]` · L=B · M · 🟡
**Audit:** "ubicación, recámaras, m², precio no son legibles en laptop" (pág 6)
**Archivos:** `src/components/marketplace/MarketplaceCard.tsx`
**Acción:** Aumentar size (text-sm → text-base) o ajustar weight de meta-info. Validar en screenshot tablet.

---

## Tier D — Páginas individuales

### D1. /desarrollos · `[IN]` · L=C · M · 🟢
- D1.1 Reemplazar azul no-brand del header por `dark-900` o degradado brand
- D1.2 Textura circular → forma isotipo o color sólido (pág 4)
- D1.3 CTA azul marino "¿Listo para invertir?" → brand-aligned (pág 4)

### D2. /propiedades (listado) · `[IN]` · L=C · M · 🟢
- D2.1 Eyebrow "BIENES RAÍCES RIVIERA MAYA" → color brand (no el verde-teal actual)
- D2.2 "Maya" en H1 → `var(--propyte-brand)` (pág 5)
- D2.3 Chips filtro activos (Departamento, Preventa) usan pills C3
- D2.4 Reducir radius cards (cubierto por C1+C2)

### D3. /propiedades/[slug] (ficha detalle) · `[IN]` · L=C · L · 🟡
- D3.1 Icons amenidades color brand (cubierto por A2)
- D3.2 Tipografía datos clave (precio, área, recámaras) → revisar peso/size
- D3.3 "Aviso de precio y tipo de cambio" → revisar si tipografía es brand (Neue Haas Grotesk)
- D3.4 Botón WhatsApp del form (cubierto por A5)
- D3.5 Badge "Verificado" texto negro (cubierto por C4)

### D4. /nosotros + /nosotros/equipo-comercial · `[IN]` · L=C · L · 🟡
- D4.1 Burbuja chat — debería verse en /nosotros, audit dice "gag visual donde debería ir burbuja" (pág 14)
- D4.2 Barra secundaria sticky se ve "incrustada en scroll" — revisar `position: sticky` + offset (pág 14)
- D4.3 Eyebrow badge "NOSOTROS" no es brand (pág 7)
- D4.4 Icons de Misión/Quiénes somos color brand (cubierto por A2)
- D4.5 Stats grandes (+12.3%, 12+, 170+, 8) tipografía Wide Medium (Normalidad VF) — pág 8
- D4.6 Numeración 01/02/03 (cubierto por A3)

### D5. /desarrolladores · `[IN]` · L=C · M · 🟢
- D5.1 Pills "80-100%", "Tech-first", "200+ hrs" colores brand (pág 11)
- D5.2 Icons servicios color brand (cubierto por A2)
- D5.3 Numeración steps 01/02/03/04 (cubierto por A3)
- D5.4 Botón Verificado + Ver proyectos + WhatsApp (cubiertos por C4, A5)

### D6. /corredores (brokers) · `[IN]` · L=C · S · 🟢
- D6.1 Mismas correcciones que D5 (WhatsApp, contraste, pills)
- D6.2 Numeración "Cómo funciona" 01/02/03/04 (cubierto por A3)

### D7. /proveedores · `[IN]` · L=C · S · 🟢
- D7.1 Decidir: ¿el icono header se queda o se quita? (pág 11) — **default: quitar** si está vacío visualmente
- D7.2 Eyebrow "CONVOCATORIA ABIERTA" color brand

### D8. /unete (reclutamiento) · `[IN]` · L=C · M · 🟢
- D8.1 Cambiar gradient/colores fondo (pág 11 — "el color")
- D8.2 Tipografía + numeración "Modelo de Comisiones" 01/02/03/04/05 (cubierto por A3)
- D8.3 Eyebrow "TECNOLOGÍA" pattern: palabra clave brand (audit lo señala como ejemplo bueno)

### D9. Metodología (en /nosotros o página propia) · `[IN]` · L=C · S · 🟢
- D9.1 Eyebrow "PROCESO" + "PREGUNTAS FRECUENTES" + "METODOLOGÍA PROPYTE" en color brand consistente (págs 12-13)
- D9.2 Cards numeradas 01/02/03 (cubierto por A3)
- D9.3 Iconos color brand (cubierto por A2)

### D10. /blog · `[IN]` · L=C · S · 🟢
- D10.1 Hero color brand-aligned ("toda esta sección el color es diferente", pág 12)
- D10.2 Eyebrow "PROPYTE BLOG" → brand
- D10.3 H1 "mueven el mercado" → "mueven" o "mercado" en brand

### D11. Páginas legales/contenido (aviso-legal, terminos, cookies, como-comprar, como-invertir, financiamiento, faq, glosario, destacados) · `[DEFER]` · L=C · S · 🟢
**El audit no tiene puntos específicos para estas (secciones vacías)**. Aplicar el sistema A+B+C automáticamente cuando se toque el componente compartido las cubre.

---

## Tier E — Chrome / Nav / Polish

### E1. Burbuja en listados — visibility por ruta · `[IN]` · L=B · S · 🟢
**Audit:** "burbuja NO debe aparecer en /desarrollos ni /propiedades listados, PERO sí submenú contacto/idioma/USD top-right" (pág 14)
**Acción:** Lista de rutas excluidas para `<ChatBubble>` y mantener `<HeaderSubmenu>` independiente.

### E2. /nosotros barra secundaria sticky · `[IN]` · L=C · S · 🟡
**Audit:** "La barra secundaria se queda incrustada en el scroll y se ve feo" (pág 14)
**Acción:** Revisar offset top, z-index, posiblemente convertir a `position: relative` + transición suave al sticky.

---

## Tier F — Responsive (Desktop / Tablet / Mobile)

Las secciones 1.2-1.4, 2.2-2.4, etc. del audit están **vacías** (sin puntos específicos). No hay scope concreto. Quedará cubierto naturalmente al validar cada bloque en 3 viewports.

`[DEFER]` — verificar al final en QA pass único.

---

## Tier G — Out of scope

| Ítem | Razón |
|---|---|
| Foto del equipo/local físico para hero /nosotros | Audit menciona "cuando esté lista" — no es de Claude |
| Reescribir copy/contenido | No es scope visual |
| Cambios estructurales de arquitectura | Innecesario para el audit |
| Sustituir tipografía actual | `Neue Haas Grotesk Display Pro` + `Normalidad VF` ya están — confirmado por la diseñadora en pág 2 |

---

## Plan de ataque sugerido (orden de batches)

| Batch | Items | Tier | Esfuerzo total | Validación |
|---|---|---|---|---|
| **B0 — Limpieza WIP** | Commit/stash 11 archivos modificados glass system | — | 5 min | git status clean |
| **B1 — Tokens** | A1, A2, A3, A4 | A | 1.5h | Visual diff en home, ficha, /desarrolladores |
| **B2 — Decisión WhatsApp + Hero** | A5 (con tu respuesta), B1, B2 | A+B | 1h | Screenshot hero antes/después |
| **B3 — Cards sistémicas** | C1, C2, C3, C4, C5 | B | 1.5h | /propiedades listado screenshot |
| **B4 — Páginas Tier 1** | D1, D2, D3 (las más visibles) | C | 2h | Por página |
| **B5 — Páginas Tier 2** | D4, D5, D6, D8 | C | 2h | Por página |
| **B6 — Polish** | D7, D9, D10, E1, E2 | C+E | 1h | QA pass |
| **B7 — QA responsive** | Tier F | — | 1h | Playwright + screenshots manuales |

**Total estimado:** ~10h reales = 2-3 sesiones de trabajo.

---

## Decisiones aprobadas (Luis · 2026-05-15)

| # | Pregunta | Decisión |
|---|----------|----------|
| A5 | Botón WhatsApp | **(a) Inversión completa** — fondo dark, texto brand |
| D4.1 | Burbuja en /nosotros | **SÍ** debe verse |
| D7.1 | Icono header /proveedores | **QUITAR** |
| Branch | Branch de trabajo | Continuar en `feat/glass-system-propagation` |
| WIP | 11 archivos modificados | **Dejarlos correr** — incluir cambios sobre la misma rama |
| Scope | Tiers a recortar | D11 legales/contenido = `DEFER` confirmado; resto IN |
