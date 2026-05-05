# Design Playground

Herramienta interna para editar visualmente los tokens de identidad de Propyte.

## Acceso

- **Desarrollo:** `http://localhost:3000/design-playground` (siempre activo si `NODE_ENV !== production`)
- **Staging/producción:** requiere `NEXT_PUBLIC_ENABLE_PLAYGROUND=true` en `.env.local`

El layout devuelve 404 en producción si la variable no está definida.

## Estructura

```
/design-playground          ← Panel principal (split 40/60)
/design-playground/preview  ← Showcase completo standalone
```

## Tokens disponibles

| Sección | CSS vars | Store path |
|---------|----------|------------|
| Colores | `--color-*` | `tokens[mode].colors.*` |
| Tipografía | `--font-*`, `--fs-*`, `--fw-*`, `--lh-*`, `--ls-*` | `tokens[mode].typography.*` |
| Espaciado | `--space-*`, `--container-*`, `--grid-gap`, `--section-*` | `tokens[mode].spacing.*`, `layout.*`, `sectionMargins.*` |
| Radios | `--radius-*` | `tokens[mode].radii.*` |
| Sombras | `--shadow-*` | `tokens[mode].shadows.*` |
| Media | `--media-*` | `tokens[mode].media.*` |

## Export

- **JSON** → archivo descargable con toda la estructura `DesignTokens`.
- **CSS** → bloque `:root { ... }` + `[data-theme="dark"] { ... }` listo para `globals.css`.

## Persistencia

Los tokens se guardan en `localStorage` bajo la clave `propyte-design-tokens-v1`.
Los presets nombrados también se persisten en el mismo key.
El stack de undo/redo (hasta 20 pasos) NO se persiste entre sesiones.

## Undo / Redo

Ctrl+Z / Ctrl+Y no están mapeados como keyboard shortcuts — usar los botones del topbar.
