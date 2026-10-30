#!/usr/bin/env node
/**
 * Descarga UNA VEZ al repo los .woff2 que antes pedía `next/font/google` en
 * cada build. NO lo ejecuta el build: se corre a mano solo para añadir una
 * familia, un peso o un estilo, y el resultado se commitea en `src/fonts/`.
 *
 * Por qué existe: el build de producción compila en el VPS de Hostinger y
 * `next/font/google` descargaba las fuentes de Google en cada deploy. El
 * 2026-10-14 dos builds murieron con
 *   TypeError: Cannot read properties of null (reading '1')
 * en `next/font/google/loader.js`, que hace
 *   /\.(woff|woff2|eot|ttf|otf)$/.exec(googleFontFileUrl)[1]
 * Google devolvió al servidor de build una URL de fuente sin extensión.
 * Intermitente, imposible de reproducir desde fuera, y sin reintento en esa
 * línea. Con las fuentes en el repo, el build no sale a la red por ellas.
 *
 * Fidelidad: cada URL de abajo es EXACTAMENTE la que generaba next/font/google
 * 16.3 para la llamada original (misma familia, pesos, estilos y ejes), y se
 * pide con su mismo User-Agent. Así los bytes son los mismos que se servían.
 * Solo se baja el subset `latin`, el único declarado en `subsets`.
 *
 * Uso:  node scripts/descargar-fuentes.mjs
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DESTINO = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'fonts');

// El UA que manda next/font/google (fetch-resource.js). Decide el formato que
// sirve Google: con este, woff2.
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36';

const CSS2 = 'https://fonts.googleapis.com/css2?family=';
const FUENTES = [
  // src/app/layout.tsx
  { slug: 'inter', query: 'Inter:wght@400;500;600;700' },
  { slug: 'dm-sans', query: 'DM+Sans:wght@300;400;500;700' },
  { slug: 'space-grotesk', query: 'Space+Grotesk:wght@300;400;500;600;700' },
  { slug: 'fraunces', query: 'Fraunces:ital,wght@1,400;1,500' },
  { slug: 'jetbrains-mono', query: 'JetBrains+Mono:wght@400;500;700' },
  // src/app/lp/layout.tsx
  { slug: 'newsreader', query: 'Newsreader:ital,wght@0,400;0,500;1,400;1,500' },
  // src/app/lp/casas-riviera-maya y src/app/lp/terrenos-playa-del-carmen
  { slug: 'archivo', query: 'Archivo:wdth,wght@62..125,100..900' },
  // src/app/lp/terrenos-playa-del-carmen
  { slug: 'azeret-mono', query: 'Azeret+Mono:wght@400;500' },
  // src/app/lp/enganche-terrenos-playa-del-carmen
  { slug: 'poppins', query: 'Poppins:wght@300;400;500;600' },
  // Landings de inventario v2 (src/app/lp/{casas-playa-del-carmen,…})
  { slug: 'outfit', query: 'Outfit:wght@300..700' },
  { slug: 'manrope', query: 'Manrope:wght@400..800' },
  { slug: 'cormorant-garamond', query: 'Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500' },
  { slug: 'sora', query: 'Sora:wght@300..700' },
  { slug: 'bricolage-grotesque', query: 'Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,300..800' },
];

async function pedir(url) {
  for (let intento = 1; ; intento++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (intento === 3) throw new Error(`${res.status} al pedir ${url}`);
  }
}

/** Bloques `@font-face` del subset latin: { url, style, weight, stretch }. */
function bloquesLatin(css) {
  return [...css.matchAll(/\/\* (.+?) \*\/\s*@font-face \{([^}]+)\}/g)]
    .filter(([, subset]) => subset === 'latin')
    .map(([, , cuerpo]) => {
      const valor = (prop) => new RegExp(`${prop}:\\s*([^;]+);`).exec(cuerpo)?.[1].trim();
      return {
        url: /src: url\((.+?)\)/.exec(cuerpo)[1],
        style: valor('font-style'),
        weight: valor('font-weight'),
        stretch: valor('font-stretch'),
      };
    });
}

mkdirSync(DESTINO, { recursive: true });

// `SOLO=outfit,sora node scripts/descargar-fuentes.mjs` baja solo esas
// familias: Google devuelve a veces una URL sin extensión en una familia que
// ya está en el repo, y tumba la corrida entera por nada.
const SOLO = process.env.SOLO ? new Set(process.env.SOLO.split(',')) : null;

for (const { slug, query } of FUENTES) {
  if (SOLO && !SOLO.has(slug)) continue;
  const css = (await pedir(`${CSS2}${query}&display=swap`)).toString('utf8');
  const bloques = bloquesLatin(css);
  if (bloques.length === 0) throw new Error(`${slug}: Google no devolvió subset latin`);

  // Un archivo por URL distinta. Google sirve un solo archivo variable para
  // varios pesos (Inter, DM Sans…) y uno por peso en las estáticas (Poppins).
  const porUrl = new Map();
  for (const b of bloques) {
    const previo = porUrl.get(b.url);
    if (previo) previo.weights.push(b.weight);
    else porUrl.set(b.url, { ...b, weights: [b.weight] });
  }
  const urlsPorEstilo = (style) => [...porUrl.values()].filter((a) => a.style === style).length;

  for (const archivo of porUrl.values()) {
    // Es justo lo que tumbaba el build: una URL sin extensión. Aquí se detecta
    // en una corrida manual, no en el deploy.
    if (!/\.woff2$/.test(archivo.url)) throw new Error(`${slug}: URL sin .woff2, reintentar: ${archivo.url}`);

    const nombre = [
      slug,
      'latin',
      archivo.style === 'italic' ? 'italic' : null,
      urlsPorEstilo(archivo.style) > 1 ? archivo.weight : null,
    ]
      .filter(Boolean)
      .join('-');
    const bytes = await pedir(archivo.url);
    writeFileSync(join(DESTINO, `${nombre}.woff2`), bytes);

    const sha = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
    const stretch = archivo.stretch ? `  font-stretch ${archivo.stretch}` : '';
    console.log(
      `${`${nombre}.woff2`.padEnd(34)} ${archivo.style.padEnd(6)} weight ${archivo.weights.join(',').padEnd(18)}${stretch}  ${String(bytes.length).padStart(6)} B  sha256 ${sha}`,
    );
  }
}
