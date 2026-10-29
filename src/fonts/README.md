# Fuentes autoalojadas

Los `.woff2` que usa el sitio vía `next/font/local`. El build no las pide a
Google: antes `next/font/google` las descargaba en cada build del VPS, y el
2026-10-14 dos deploys murieron porque Google devolvió una URL de fuente sin
extensión.

Son los mismos bytes que servía `next/font/google` (subset `latin`, mismas
URLs y mismo User-Agent). Se generan con:

```bash
node scripts/descargar-fuentes.mjs
```

Para añadir una familia, un peso o un estilo: añadirlo a `FUENTES` en ese
script, correrlo, commitear el `.woff2` nuevo y declararlo en el `localFont()`
correspondiente.

| Archivo | Familia | Se usa en |
|---|---|---|
| `inter-latin.woff2` | Inter (variable) | Sin uso desde el rediseño v3 (antes `--font-display`); se conserva para comparar |
| `dm-sans-latin.woff2` | DM Sans (variable) | Sin uso desde el rediseño v3 (antes `--font-text`); se conserva para comparar |
| `hanken-grotesk-latin.woff2` | Hanken Grotesk (variable) | `src/app/layout.tsx` → `--font-text` (texto del sitio) |
| `space-grotesk-latin.woff2` | Space Grotesk (variable) | `src/app/layout.tsx` → `--font-space-grotesk` |
| `fraunces-latin-italic.woff2` | Fraunces itálica (variable) | `src/app/layout.tsx` → `--font-fraunces` |
| `jetbrains-mono-latin.woff2` | JetBrains Mono (variable) | `src/app/layout.tsx` → `--font-mono` |
| `newsreader-latin*.woff2` | Newsreader normal e itálica (variable) | `src/app/lp/layout.tsx` → `--font-lp-display` |
| `archivo-latin.woff2` | Archivo (variable, ejes `wght` y `wdth`) | `src/app/layout.tsx` → `--font-display` (titulares del sitio), `/lp/casas-riviera-maya`, `/lp/terrenos-playa-del-carmen` |
| `azeret-mono-latin.woff2` | Azeret Mono (variable) | `/lp/terrenos-playa-del-carmen` → `--font-lpt-mono` |
| `poppins-latin-{300,400,500,600}.woff2` | Poppins (estática, un archivo por peso) | `/lp/enganche-terrenos-playa-del-carmen` |

Solo el subset `latin` (U+0000-00FF, puntuación general, €, ™…): cubre
español e inglés. Un carácter fuera de ese rango (ā, ł, ő, griego, cirílico)
se pinta con la fuente de respaldo.

Licencia: todas son SIL Open Font License 1.1. Cada archivo lleva su
copyright y la URL de la licencia en la tabla `name`.
