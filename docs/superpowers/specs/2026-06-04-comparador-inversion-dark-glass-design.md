# Comparador de inversión — rediseño visual "dark glass"

**Fecha:** 2026-06-04 · **Página:** `/como-invertir` · **Componente:** `src/components/como-invertir/InvestmentComparison.tsx`
**Tipo:** cambio puramente visual (estilo). NO toca lógica, datos ni copy.
**Brainstorm:** vía Visual Companion (3 direcciones de estilo → "dark glass"; A/B de estructura → "sección completa").

## Objetivo
Elevar el comparador de inversión de un bloque claro estándar a un "momento" visual premium/tech, alineado con el lenguaje oscuro del hero de la página y del dashboard de `/unete`. Mantener 100% la honestidad anti-humo ya implementada (tasas del Hub, tasa inmobiliaria marcada ilustrativa, disclaimer reforzado).

## Decisiones (aprobadas)
1. **Dirección de estilo:** dark glass (fondo navy + tarjetas glass + glow cyan en la barra ganadora).
2. **Estructura:** sección oscura **edge-to-edge** (full-bleed), no tarjeta contenida. El comparador es el clímax visual entre "ROI por etapa" (gris claro) y "Métricas clave" (blanco).

## Estado actual (qué se reemplaza)
La sección es `bg-white` con tarjetas claras: panel de inputs sobre `#F4F6F8`, gráfica Recharts con grid claro y ejes grises, chips de leyenda en `#f9fafb`/`#5CE0D2`-10. Barra ganadora cyan plano.

## Diseño objetivo (componente por componente)

**Sección contenedora**
- Fondo: `bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923]`, `relative overflow-hidden`, padding `py-16 md:py-20`.
- Dos glows difuminados (mismo patrón que el hero/CTA): `absolute … bg-propyte-brand/15 rounded-full blur-3xl` (uno arriba-derecha) y `bg-[#A2F9FF]/8 … blur-3xl` (abajo-izquierda). `pointer-events-none`.

**Encabezado** (centrado, sobre el fondo oscuro)
- Eyebrow: chip `bg-propyte-brand/15 border-propyte-brand/30 text-propyte-brand` (igual que el hero).
- Título `text-white`; subtítulo `text-white/60`. Mismos textos i18n actuales (`comparison.eyebrow/title/subtitle`).

**Panel de inputs (col izquierda)** — tarjeta glass
- `bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6` (reusar la clase existente `propyte-card-glass-sm` si calza; si no, estas utilidades).
- Labels `text-white/85`; valores `text-propyte-brand`.
- Sliders: track `bg-white/12`, thumb cyan con glow (`accent-[#5CE0D2]`; el thumb ya hereda el accent — el "glow" es visual del mockup, se logra con el accent brillante sobre fondo oscuro).
- "Mejor rendimiento": label `text-white/50`, nombre del ganador `text-propyte-brand`, monto `text-white/80`.

**Gráfica (col derecha, lg:col-span-2)** — tarjeta glass igual
- **Recharts dark theming:** `CartesianGrid stroke="rgba(255,255,255,0.10)"`; `XAxis`/`YAxis` tick `fill: rgba(255,255,255,0.6)`; `Tooltip` con `contentStyle` fondo `#0F1923`, `border 1px solid rgba(255,255,255,.15)`, `labelStyle` blanco.
- **Barras:** las no-ganadoras pasan de `#1A2F3F` (invisible sobre navy) a un **glass tenue** `rgba(255,255,255,0.13)` con borde `rgba(255,255,255,.15)`. La barra ganadora (highlight) usa cyan brillante `#5CE0D2` (o gradiente cyan→`#A2F9FF`) con un **glow** (drop-shadow SVG o `filter`).
- **Chips de leyenda:** glass `bg-white/5 rounded-lg`; la del ganador `bg-propyte-brand/12 ring-1 ring-propyte-brand/35`. Rate en blanco; la del ganador en `text-propyte-brand` con el `*` en `#A2F9FF`.

**CTA + disclaimer**
- CTA "Hablar con un asesor": `bg-propyte-brand text-[#0F1923]` con sombra (ya es así; se mantiene).
- Disclaimer `text-white/45`; nota referencial `text-white/35` (hoy `text-gray-*`; pasan a blanco tenue para contraste sobre navy).

## Qué NO cambia (fuera de alcance)
- Lógica de cálculo (compounding), sliders capital/plazo, ordenamiento por FV.
- Fuente de datos: tasas vienen de `getMarketStats()`/`getComparatorRates()` del Hub; tasa inmobiliaria marcada ilustrativa (`reReferential`).
- Textos i18n (`comparison.*`): mismos. Solo cambian colores/contenedores, no copy.
- El resto de `/como-invertir` (hero, estrategias, tabla por etapa, métricas, CTA final).

## Accesibilidad
- Contraste: texto blanco/`white-70+` sobre navy `#0F1923/#1A2F3F` cumple AA. Las barras glass tenues no portan texto crítico (los valores viven en los chips de leyenda y/o etiqueta de la barra ganadora). Verificar contraste de `white/45` del disclaimer (texto pequeño no esencial; aceptable, pero subir a `white/55` si no pasa AA para texto legal).
- Sliders mantienen `aria-label`.

## Responsive / mobile
- El grid `lg:grid-cols-3` colapsa a 1 columna en móvil (inputs arriba, gráfica abajo) — comportamiento actual, se conserva. Verificar que el glass y los glows no generen overflow horizontal en 375px.

## Testing / verificación
- `tsc --noEmit` limpio.
- Render en Turbopack: screenshot desktop + móvil (375px) del comparador en contexto (sección oscura entre tabla clara y métricas blancas).
- Confirmar legibilidad de ejes/tooltip de Recharts sobre navy.
- Confirmar que la marca ilustrativa (`*` + nota) sigue visible y legible en dark.

## Riesgos
- **Recharts sobre dark:** los ticks/tooltip por defecto son oscuros → ilegibles; hay que pasar estilos explícitos (cubierto arriba).
- **Glow de la barra ganadora:** Recharts no soporta `box-shadow` en `<Bar>`; se logra con un `<filter>` SVG (feGaussianBlur) referenciado por la Cell ganadora, o se aproxima con el cyan brillante + un rect de glow detrás. Si el filtro complica, el cyan brillante sobre navy ya da suficiente énfasis (fallback aceptable).
- **Ritmo de página:** sección oscura seguida de métricas blancas y luego CTA `#1A2F3F` — verificar que la transición no se sienta abrupta (separación con el `py` actual basta).
