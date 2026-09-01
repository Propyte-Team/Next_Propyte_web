/**
 * El manifiesto de landings tiene que seguir a las carpetas reales.
 *
 * ═══ LO QUE ESTE ARCHIVO DEFIENDE ═══
 *
 *   1. **El commiteado no se queda atrás.** `src/lib/lp/manifest.generated.ts`
 *      se regenera en `prebuild`, pero se commitea para que lint y typecheck no
 *      dependan del build. Si alguien añade una landing y no lo regenera, el
 *      diff del PR no la muestra y el Hub no se entera hasta el deploy. Aquí
 *      falla antes.
 *   2. **Un manifiesto vacío NO es un manifiesto válido.** Si la enumeración se
 *      rompe y devuelve `[]`, el Hub marcaría TODAS las landings como pausadas.
 *      Un test que solo comparara "generado == commiteado" pasaría con los dos
 *      en cero. Por eso se exige un mínimo y se comprueba contra el disco.
 *   3. **`_components` no es una landing.** Control negativo real: la carpeta
 *      existe en disco, así que si la regla de exclusión desaparece, esta
 *      aserción se cae de verdad.
 *
 * Corre sin servidor y sin navegador: `npm run test:lp-manifest`.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLandingSlugs, renderManifest } from '../scripts/gen-lp-manifest.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LP_DIR = join(ROOT, 'src', 'app', 'lp');
const OUT_FILE = join(ROOT, 'src', 'lib', 'lp', 'manifest.generated.ts');
const ROUTE_FILE = join(ROOT, 'src', 'app', 'api', 'public', 'landings', 'route.ts');

const fallos = [];
function check(ok, mensaje) {
  if (!ok) fallos.push(mensaje);
}

const slugs = readLandingSlugs();

// 2 — el manifiesto vacío no vale, y tiene que cuadrar con lo que hay en disco.
const carpetasEnDisco = readdirSync(LP_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
  .map((e) => e.name)
  .filter((name) => existsSync(join(LP_DIR, name, 'page.tsx')));

check(slugs.length > 0, 'La enumeración devolvió CERO landings. Algo se rompió: nunca hay cero.');
check(
  slugs.length === carpetasEnDisco.length,
  `La enumeración ve ${slugs.length} landings y en disco hay ${carpetasEnDisco.length}: ` +
    `${carpetasEnDisco.filter((c) => !slugs.includes(c)).join(', ') || '(ninguna suelta)'}`,
);

// 3 — control negativo: `_components` existe de verdad y NO puede colarse.
check(
  existsSync(join(LP_DIR, '_components')),
  'src/app/lp/_components ya no existe: este control negativo dejó de probar nada, ajústalo.',
);
check(!slugs.includes('_components'), '`_components` se coló en el manifiesto: no es una landing.');

// Toda entrada tiene que tener page.tsx — sin él no hay ruta que servir.
for (const slug of slugs) {
  check(
    existsSync(join(LP_DIR, slug, 'page.tsx')),
    `El manifiesto lista "${slug}" pero no hay src/app/lp/${slug}/page.tsx.`,
  );
}

// 1 — el archivo commiteado tiene que ser exactamente el que se genera hoy.
check(existsSync(OUT_FILE), 'Falta src/lib/lp/manifest.generated.ts. Corre: node scripts/gen-lp-manifest.mjs');
if (existsSync(OUT_FILE)) {
  const actual = readFileSync(OUT_FILE, 'utf8');
  check(
    actual === renderManifest(slugs),
    'src/lib/lp/manifest.generated.ts se quedó atrás de src/app/lp/. Corre: node scripts/gen-lp-manifest.mjs',
  );
  for (const slug of slugs) {
    check(actual.includes(`slug: '${slug}'`), `El archivo generado no menciona "${slug}".`);
  }
}

// El endpoint que consume el Hub tiene que seguir leyendo del manifiesto.
check(existsSync(ROUTE_FILE), 'Falta src/app/api/public/landings/route.ts.');
if (existsSync(ROUTE_FILE)) {
  const route = readFileSync(ROUTE_FILE, 'utf8');
  check(
    route.includes('LP_MANIFEST') && route.includes('@/lib/lp/manifest.generated'),
    'El endpoint /api/public/landings dejó de leer del manifiesto generado.',
  );
}

if (fallos.length > 0) {
  console.error('✗ Manifiesto de landings');
  for (const f of fallos) console.error(`  · ${f}`);
  process.exit(1);
}

console.log('✓ Manifiesto de landings');
console.log(`  · ${slugs.length} landings: ${slugs.join(', ')}`);
console.log('  · generado == commiteado · _components excluido · endpoint conectado');
