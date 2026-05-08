# UI/UX Pro Review — Home Propyte

**Targets:** `localhost:3000/es` (Next_Propyte_web local) vs `dev.propyte.com/es` (Vercel staging)
**Viewports:** Desktop 1440 / Tablet 834 / Mobile 390
**Tooling:** Playwright (Chromium) — capturas + DOM/CSS audit
**Fecha:** 2026-05-08

> Artefactos: `tests/qa-uiux-home/screenshots/*.png` + `report.json`
> Script: `tests/qa-uiux-home/audit-home.mjs`

---

## TL;DR

Local y staging comparten la mayoría del DNA visual (Space Grotesk, paleta Teal/Navy, ritmo vertical 64/80/112). Staging ya tiene **2 secciones más** que el local (`Propiedades destacadas` + bloque extra inferior). Hay **3 bugs concretos compartidos** que comprometen calidad UI/UX y SEO/CWV, y **1 bug visible solo en staging** (zona muerta antes del footer en desktop).

---

## P0 — Bloqueantes

### 1. Overflow horizontal en tablet (834px) — AMBOS
- `scrollWidth = 862px`, viewport `834px` → 28px de scroll lateral.
- Causa visible: los chips de quick-search del hero (`Playa del Carmen / Tulum / Frente al mar / Menos de $3M / Marca de $3M…`) se acomodan en una sola fila y rompen el ancho.
- Fix sugerido: en breakpoint `md` (768–1023) hacer wrap a 2 filas o convertir a carrusel `overflow-x-auto` *contenido* (con `scroll-snap-x`), no que el body entero se scrollee.

### 2. Tap targets < 36px en mobile — AMBOS (37/39 elementos)
Detectados con altura ~23–24px:
- `Propyte` logo: 128×24
- Currency switcher `MXN`, `USD`: 38×23 / 35×23
- Locale switcher `ES`
- Probables: links del top-bar y chips inferiores del search

Apple HIG = 44pt, Material = 48dp. Subir a **min-height 44px** en `header-mobile` y currency/locale switchers (puede ser solo padding vertical, sin cambiar diseño).

### 3. Contraste eyebrow `Invierte con datos. Decide con confianza.` — AMBOS
- Color actual: `#5CE0D2` (Teal primario) sobre fondo blanco → ratio **1.61** (WCAG AA exige 4.5).
- El propio `CLAUDE.md` ya declara `Teal A11y: #0D9488 (text on white, WCAG AA)`. **No se está aplicando** en este eyebrow.
- Fix: cambiar la utility a `text-teal-a11y` (o `--color-teal-a11y`) sobre fondos claros. Este patrón se repite en otras secciones (verificar globalmente).

### 4. Zona muerta vacía antes del footer — solo STAGING desktop
En `staging_desktop_full.png` hay ~600px de whitespace continuo entre la grid `¿Por qué Propyte?` y el footer. La auditoría detecta una `<section>` extra de `582px` con `bg: transparent` y `padding 80/80` que aparece **vacía**. En local esa sección no existe → es contenido nuevo en `develop` que *no está renderizando datos* (probable: query Supabase fallida sin fallback UI).

> En mobile/tablet de staging la sección final también muestra mucho aire blanco antes del footer (visible en `staging_mobile_full.png` y `staging_tablet_full.png`).

---

## P1 — Importantes

### 5. Imágenes oversized
- Tablet local: **7/8** imgs servidas a >2.5× su tamaño de display.
- Tablet staging: **9/10** imgs.

Aumenta peso, baja LCP, penaliza CWV. Propyte ya usa `next/image` (8/8 lazy correctas), pero los `sizes`/`srcset` están mal calibrados para 768–1023px. Auditar `<Image sizes="…">` por componente.

### 6. Banner de cookies bloquea el hero
En desktop top, el modal `Tu privacidad` se centra ocluyendo el search bar y los CTAs principales (`Desarrollos / Propiedades`). Aunque es lícito por GDPR, UX-pro lo coloca como `bottom strip` no-modal que no bloquee el primer input (CTA principal del hero es el search). Mantener modal completo solo si se requiere consent explícito antes de tracking.

### 7. Type-scale H3 inconsistente entre local y staging
- Local H3 = **18px / 600** ✅
- Staging H3 = **14px / 600** ❌ (igual al body)

Cuando un H3 cae al tamaño del body se rompe la jerarquía. En staging hay cards de developer/desarrollo donde el nombre (`Nativa Tulum`) se renderiza como H3 a 14px. Fix: forzar `h3 { font-size: clamp(1.125rem, 2vw, 1.25rem) }` (18–20px) en cards.

### 8. Indicador de error Next.js (solo LOCAL)
En todos los screenshots locales aparece el badge rojo `1 issue` (DevIndicator de Next 16). Hay un warning/error en consola que no afecta la UI pero conviene resolver antes de promote a staging. Correr `npm run dev` y revisar terminal.

---

## P2 — Mejoras de pulido

### 9. Header sticky transparente sin blur
`header { position: fixed; bg: transparent; z-index: 40; backdrop-filter: none }`. Sobre el hero oscuro funciona, pero al hacer scroll a secciones blancas (`Explora por tipo`, `¿Por qué Propyte?`) los nav-links blancos quedan ilegibles. Aplicar:

```css
header.scrolled {
  background: rgba(15,25,35,.85);
  backdrop-filter: blur(12px);
}
```

Disparar la clase con un `IntersectionObserver` o `scrollY > 80`.

### 10. CTA visual hierarchy en hero
Los dos toggles `Desarrollos` (blanco sólido, peso 700, sombra) vs `Propiedades` (vidrio translúcido, peso 700, borde) — el contraste no comunica que son **toggles equivalentes** sino que `Desarrollos` es CTA principal. Si la intención es toggle (para cambiar el target del search), homologar peso visual o usar variant `pill-segmented` con bg igual + estado activo claro.

### 11. Skip-to-content link mal contrastado
Detectado: `<a> Saltar al contenido principal` con `color: #2C2C2C` sobre `bg: #0F1923` (Aztec) → ratio 1.27. Este link aparece al recibir focus desde teclado (a11y). Cambiar a `color: #FFFFFF` o `#5CE0D2` sobre Aztec. Es a11y pura, lo notará un teclado/lector de pantalla.

### 12. Densidad above-the-fold mobile
- Mobile local: `13` elementos interactivos sobre el viewport inicial.
- Mobile staging: `14`.

Es alta. El header mobile suma logo + lang + currency + búsqueda + 2 toggles + 4 chips. Considerar mover currency/lang switcher al menú hamburguesa (lo usan <5% de visitantes en una primera visita).

### 13. Diferencia de imágenes count (8 vs 10)
Staging tiene 2 imgs más por la sección extra `Propiedades destacadas`. Confirmar si es contenido intencional del próximo deploy a producción o un experimento solo de `develop`.

---

## Resumen de números

| Métrica | Local | Staging | Target |
|---|---|---|---|
| Secciones | 8 | 10 | — |
| H1 count | 1 ✅ | 1 ✅ | 1 |
| Spacing scale | 0/48/64/80/112 ✅ | 0/48/64/80/112 ✅ | ≤8 |
| Img sin alt | 0 ✅ | 0 ✅ | 0 |
| Lazy / total | 6/8 ✅ | 8/10 ✅ | ≥75% |
| Img oversized tablet | 7 ⚠️ | 9 ⚠️ | 0 |
| Tap targets <36px mobile | 37 ❌ | 39 ❌ | 0 |
| Overflow-x tablet | 28px ❌ | 28px ❌ | 0 |
| Contrast issues (real, no falsos+) | 2 ❌ | 2 ❌ | 0 |
| H1 fontSize desktop | 56px | 56px | — |
| H1 fontSize mobile | 36px | 36px | — |
| H3 fontSize | 18px ✅ | 14px ❌ | ≥18px |
| Header height | 76px | 76px | — |
| Interactive above-fold (desktop) | 28 | 26 | <20 |

---

## Plan de acción sugerido (1 sprint corto)

1. **Fix overflow tablet** — chip-bar con scroll horizontal contenido + scroll-snap. *(2 h)*
2. **Tap targets header mobile** — `min-h-[44px]` en logo, lang, currency, toggles. *(1 h)*
3. **Aplicar `Teal A11y` al eyebrow** y auditar `text-teal-500` global sobre fondos claros. *(1–2 h)*
4. **Investigar zona muerta staging desktop** — verificar query/fallback de la sección 9 (`582px transparent`). Definir si es bug o WIP. *(1 h diagnóstico)*
5. **`sizes` correctos en `<Image>`** para breakpoint tablet. *(2 h)*
6. **Header sticky con blur al scroll**. *(1 h)*
7. **H3 14→18px en staging** (cards de developer/desarrollo). *(30 min)*
8. **Resolver `1 issue` Next dev** — revisar consola. *(15 min)*

Total estimado: **~9 h** de trabajo focalizado, todo encajable antes del próximo `vercel --prod`.

---

## Apéndice — Cómo reproducir

```bash
# 1. Tener dev server corriendo
cd ~/Projects/Next_Propyte_web
npm run dev      # localhost:3000

# 2. En otra terminal
node tests/qa-uiux-home/audit-home.mjs

# 3. Resultados
# tests/qa-uiux-home/screenshots/  (12 PNGs)
# tests/qa-uiux-home/report.json   (DOM/CSS dump + issues estructurados)
```
