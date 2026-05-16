# Glass System Propyte — Árbol canónico

Sistema de tarjetas/pills cristalinas oficial. Las clases viven en [`src/styles/globals.css:736-915`](../src/styles/globals.css). **Toda página pública debe usar una de estas variantes** en lugar de reinventar glass con Tailwind genérico.

## Las 6 variantes

| Clase | Bg | Radius | Uso |
|---|---|---|---|
| `.propyte-card-glass` | teal-dark @ 40% | 52px | Card grande sobre **dark** (datos/stats) |
| `.propyte-card-glass-lg` | teal-dark @ 40% + border | 40px | Card premium sobre **dark** (testimonios) |
| `.propyte-card-glass-sm` | teal-dark @ 28% + border sutil | 16px | Card rectangular chica sobre **dark** (info tiles, benefits, features 2-4 cols) |
| `.propyte-glass-pill` | teal-dark @ 32% + border | rounded-full | Chip/stat/CTA inline sobre **dark** |
| `.propyte-card-glass-light` | white @ 65% | 24px | Card mediana sobre **light** |
| `.propyte-card-glass-light-sm` | white @ 65% | 16px | Mini-card sobre **light** (métricas 2-4 cols) |
| `.propyte-strip-glass` | white @ 72%, border-bottom | 0 | Strip full-width (header scroll, breadcrumb) |

## Decisión: ¿qué variante uso?

```
1. ¿Es un strip full-width sin border-radius?
   └─ Sí  →  .propyte-strip-glass

2. ¿Fondo detrás es CLARO u OSCURO?
   ├─ Oscuro (hero, sections dark, sobre imagen/video)
   │   ├─ pill/chip/CTA inline           →  .propyte-glass-pill
   │   ├─ card premium con border+shadow →  .propyte-card-glass-lg
   │   ├─ card chica info/benefit/tile   →  .propyte-card-glass-sm
   │   └─ card grande de datos (hero)    →  .propyte-card-glass
   │
   └─ Claro (sections light, white-ish bg)
       ├─ mini-stat (≤220px, métricas)   →  .propyte-card-glass-light-sm
       └─ container mediano (form/info)  →  .propyte-card-glass-light
```

## Reglas de marca (no negociables)

- **Acento cyan `#A2F9FF` → SOLO sobre dark.** Sobre light usar teal `#0D9488` (WCAG AA — memoria `project_next_propyte_brand_identity.md`).
- **Border cards/pills dark:** base `rgba(255,255,255,0.22)` → hover `rgba(162,249,255,0.55)`.
- **Border cards light:** `rgba(11,28,30,0.06)` (aztec con alpha bajo).
- **Buttons solid primarios NO son glass** — son `bg-[#A2F9FF] text-[#0F1923]`.

## Anti-patterns a reemplazar

| Veo en código… | Reemplazo |
|---|---|
| `bg-white/[80-95] backdrop-blur-md rounded-2xl` (sobre light) | `propyte-card-glass-light` |
| `bg-white/[60-90] backdrop-blur-sm rounded-xl` mini | `propyte-card-glass-light-sm` |
| `bg-white/90 backdrop-blur-* shadow-sm rounded-full` chip sobre dark | `propyte-glass-pill` |
| `bg-white/[5-15] backdrop-blur-sm border border-white/[10-25] rounded-(lg\|xl\|2xl)` (sobre dark) | `propyte-card-glass-sm` |
| `bg-[teal-dark]/[20-45] backdrop-blur-* rounded-[40-52]px` | `propyte-card-glass` o `-lg` |
| `bg-white backdrop-blur-* border-b` full-width | `propyte-strip-glass` |

## Excepciones — NO migrar

- **Modales/drawers** que usan glass como overlay funcional (no identidad visual): dejar Tailwind directo.
- **Hero overlay gradient** (`from-[#0B1C1E]/55 via-... to-...`): es overlay de tinte, no glass.
- **Buttons primarios solid**.
- **Inputs/forms con fondo white solid** donde el feel "cristalino" no aporta (checkout, contacto).

## Cómo aplicar durante migración

1. **Identificar el bg detrás** del componente actual — ¿está sobre section dark o light?
2. **Identificar tamaño** — pill / card / mini-card / strip.
3. **Buscar la variante correspondiente** en la tabla arriba.
4. **Reemplazar las clases Tailwind ad-hoc** por la clase canónica. Mantener clases utilitarias que sigan necesitándose (padding, gap, layout) pero quitar las que duplican lo que la canónica ya hace (bg, blur, border, shadow, radius).
5. **Revisar accents:** asegurar que cyan/teal sigue la regla dark/light.
