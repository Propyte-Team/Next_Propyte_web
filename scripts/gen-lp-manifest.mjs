/**
 * Genera el manifiesto de landing pages a partir de las carpetas reales de
 * `src/app/lp/`.
 *
 * Por qué existe: el Hub lista las landings en `hub.propyte.com/landings` desde
 * la tabla `real_estate_hub.landing_pages`, y hasta ahora el alta era un INSERT
 * a mano. Si alguien creaba `src/app/lp/<x>/` y no hacía el INSERT, el listado
 * mentía por omisión — pasó con `enganche-terrenos-playa-del-carmen`.
 *
 * Este script corre en `prebuild`, así que el manifiesto se regenera con cada
 * build de producción. El archivo generado SÍ se commitea, para que el
 * typecheck y el lint no dependan de haber corrido el build antes; el test
 * `tests/lp-manifest.mjs` (modo --check) falla en CI si se quedó atrás.
 *
 * Uso:
 *   node scripts/gen-lp-manifest.mjs            escribe el archivo
 *   node scripts/gen-lp-manifest.mjs --check    no escribe; sale 1 si difiere
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LP_DIR = join(ROOT, 'src', 'app', 'lp');
const OUT_FILE = join(ROOT, 'src', 'lib', 'lp', 'manifest.generated.ts');

/**
 * Una landing es una carpeta directa de `src/app/lp/` que:
 *   · no empieza con `_` (esas son carpetas de convención de Next: `_components`)
 *   · contiene un `page.tsx` (sin page.tsx no hay ruta que servir)
 */
export function readLandingSlugs() {
  if (!existsSync(LP_DIR)) return [];
  return readdirSync(LP_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith('_'))
    .filter((name) => existsSync(join(LP_DIR, name, 'page.tsx')))
    .sort();
}

export function renderManifest(slugs) {
  const entries = slugs
    .map((slug) => `  { slug: '${slug}', path: '/lp/${slug}' },`)
    .join('\n');

  return `// GENERADO POR scripts/gen-lp-manifest.mjs — NO EDITAR A MANO.
// Se regenera en cada \`npm run build\` (prebuild). Para actualizarlo:
//   node scripts/gen-lp-manifest.mjs

export type LandingManifestEntry = {
  /** Segmento de la carpeta bajo \`src/app/lp/\`. */
  slug: string;
  /** Ruta servida, relativa al dominio. */
  path: string;
};

export const LP_MANIFEST: readonly LandingManifestEntry[] = [
${entries}
];
`;
}

/**
 * El repo tiene `core.autocrlf=true` y no hay `.gitattributes`: en un checkout
 * de Windows el archivo commiteado llega con CRLF, mientras que este script
 * siempre escribe LF. Comparar en crudo haría fallar el `--check` en Windows y
 * pasar en el CI de Linux — el peor de los dos mundos. Se compara normalizado.
 */
export function normalizarSaltos(texto) {
  return texto.split('\r\n').join('\n');
}

function main() {
  const check = process.argv.includes('--check');
  const slugs = readLandingSlugs();
  const next = renderManifest(slugs);
  const current = existsSync(OUT_FILE) ? normalizarSaltos(readFileSync(OUT_FILE, 'utf8')) : null;

  if (check) {
    if (current === next) {
      console.log(`OK  manifiesto al día — ${slugs.length} landings: ${slugs.join(', ')}`);
      return;
    }
    console.error('FALLO  src/lib/lp/manifest.generated.ts no coincide con las carpetas de src/app/lp/.');
    console.error(`       Carpetas encontradas (${slugs.length}): ${slugs.join(', ') || '(ninguna)'}`);
    console.error('       Corre: node scripts/gen-lp-manifest.mjs');
    process.exit(1);
  }

  if (current === next) {
    console.log(`Sin cambios — ${slugs.length} landings.`);
    return;
  }
  writeFileSync(OUT_FILE, next, 'utf8');
  console.log(`Escrito ${OUT_FILE} — ${slugs.length} landings: ${slugs.join(', ')}`);
}

if (process.argv[1] && process.argv[1].endsWith('gen-lp-manifest.mjs')) main();
