/**
 * Las láminas de /lp/terrenos-playa-del-carmen, en un navegador de verdad.
 *
 * ═══ QUÉ CUBRE ESTO QUE NO CUBRE `lp-terrenos-imagenes.mjs` ═══
 *
 * Ese test lee el HTML del build y comprueba nombres de archivo, rótulos y alt.
 * Es rápido y no necesita servidor, pero un `<img>` en el HTML NO es una imagen
 * en pantalla: la ruta del optimizador de Next puede devolver 400/404 y la
 * página se ve exactamente igual de vacía que antes de añadir nada. Pasó en la
 * sesión del 2026-08-26 con el logo del layout, y el HTML lo declaraba perfecto.
 *
 * Así que aquí se comprueba lo que solo se ve ejecutando:
 *   · que las 12 láminas CARGUEN (`complete && naturalWidth > 0`);
 *   · que ninguna quede INVISIBLE. Las primitivas de framer-motion sirven
 *     `opacity:0` y lo levanta un observer; las láminas van a propósito por CSS
 *     con `animation-timeline: view()` para que no puedan atascarse en cero;
 *   · que no haya desborde horizontal a 390 px;
 *   · que el formulario del hero siga DENTRO del primer viewport en móvil, que
 *     es la propiedad por la que existe esta variante;
 *   · que los tres formularios hidraten.
 *
 * Uso, contra un build de producción servido:
 *   BASE_URL=http://127.0.0.1:3211 node tests/lp-terrenos-laminas.mjs
 *
 * ⚠️ `output: 'standalone'` en next.config ⇒ `next start` NO sirve el build.
 * Hay que levantar `.next/standalone/server.js` con `.next/static` y `public`
 * copiados dentro.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3211';
const RUTA = '/lp/terrenos-playa-del-carmen';

/**
 * Imágenes del desarrollo que la página debe servir. Es el control POSITIVO:
 * sin este número, el test daría verde contra el build que publicaba UNA sola
 * imagen, y un medidor que no puede dar rojo no mide nada.
 *
 * Si cambia la lista blanca `IMAGENES_CURADAS`, este número cambia con ella.
 */
const LAMINAS_ESPERADAS = 12;

/** Instancias del formulario: hero, medio y cierre. */
const FORMULARIOS_ESPERADOS = 3;

/**
 * Ruido conocido y ajeno a esta página, verificado uno por uno. Cualquier OTRO
 * error de consola o de red pone el test en rojo.
 */
const RUIDO = [
  // La cabecera CSP del sitio va en report-only en todas las rutas.
  /upgrade-insecure-requests/,
  // El píxel de OpenAI no tiene salida a red desde un entorno local.
  /bzr\.openai\.com/,
];

const fallos = [];
const navegador = await chromium.launch();

for (const vp of [
  { nombre: 'movil', width: 390, height: 844 },
  { nombre: 'escritorio', width: 1440, height: 900 },
]) {
  const ctx = await navegador.newContext({
    viewport: { width: vp.width, height: vp.height },
  });
  const pagina = await ctx.newPage();

  const errores = [];
  const anotar = (t) => !RUIDO.some((r) => r.test(t)) && errores.push(t);
  pagina.on('console', (m) => m.type() === 'error' && anotar(m.text()));
  pagina.on('requestfailed', (r) => anotar(`REQ FAIL ${r.url()}`));

  const respuesta = await pagina.goto(`${BASE}${RUTA}`, { waitUntil: 'networkidle' });
  if (respuesta?.status() !== 200) {
    fallos.push(`${vp.nombre}: la página respondió ${respuesta?.status()}`);
    await ctx.close();
    continue;
  }

  // Recorrer el documento entero: 11 de las 12 láminas son `loading="lazy"` y
  // sin bajar no se pediría ninguna.
  await pagina.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await pagina.waitForTimeout(2500);

  const img = await pagina.evaluate(() =>
    [...document.querySelectorAll('img')].map((i) => ({
      src: (i.currentSrc || i.src).slice(-90),
      cargada: i.complete && i.naturalWidth > 0,
      alt: (i.alt || '').length,
      opacidad: getComputedStyle(i.closest('figure') ?? i).opacity,
    })),
  );

  // El logo de Propyte vive en el layout compartido de /lp y su alt es
  // "Propyte", que es el alt correcto para un logotipo: se excluye del umbral de
  // alt descriptivo en vez de bajarle el umbral a todas.
  const laminas = img.filter((i) => !i.src.includes('logo-horizontal'));

  const noCargadas = img.filter((i) => !i.cargada);
  const invisibles = img.filter((i) => Number(i.opacidad) < 0.05);
  const sinAlt = laminas.filter((i) => i.alt < 10);

  const desborde = await pagina.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  const formularios = await pagina.evaluate(
    () => document.querySelectorAll('form[data-lpt-form]').length,
  );
  const heroEnPrimerViewport = await pagina.evaluate(() => {
    const f = document.querySelector('[data-lpt-form="hero"]');
    if (!f) return false;
    return f.getBoundingClientRect().top < window.innerHeight;
  });
  const pantallas = await pagina.evaluate(
    () => Math.round((document.body.scrollHeight / window.innerHeight) * 10) / 10,
  );

  console.log(
    `→ ${vp.nombre}: ${laminas.length} láminas · ${img.length - noCargadas.length}/${img.length} cargadas · ${formularios} forms · ${pantallas} pantallas · desborde ${desborde}px`,
  );

  if (laminas.length !== LAMINAS_ESPERADAS)
    fallos.push(
      `${vp.nombre}: ${laminas.length} láminas, esperadas ${LAMINAS_ESPERADAS}`,
    );
  if (noCargadas.length) {
    fallos.push(`${vp.nombre}: ${noCargadas.length} imagen(es) NO cargaron`);
    noCargadas.forEach((i) => console.error(`    ✗ ${i.src}`));
  }
  if (invisibles.length)
    fallos.push(`${vp.nombre}: ${invisibles.length} imagen(es) con opacidad ~0`);
  if (sinAlt.length) fallos.push(`${vp.nombre}: ${sinAlt.length} lámina(s) sin alt`);
  if (desborde > 1) fallos.push(`${vp.nombre}: desborde horizontal de ${desborde}px`);
  if (formularios !== FORMULARIOS_ESPERADOS)
    fallos.push(
      `${vp.nombre}: ${formularios} formularios, esperados ${FORMULARIOS_ESPERADOS}`,
    );
  if (!heroEnPrimerViewport)
    fallos.push(`${vp.nombre}: el formulario del hero cayó fuera del primer viewport`);
  if (errores.length) {
    fallos.push(`${vp.nombre}: ${errores.length} error(es) de consola/red`);
    errores.slice(0, 6).forEach((e) => console.error(`    ✗ ${e.slice(0, 160)}`));
  }

  await ctx.close();
}

await navegador.close();

if (fallos.length) {
  console.error('\n✗ Láminas de /lp/terrenos-playa-del-carmen:');
  for (const f of fallos) console.error(`  · ${f}`);
  process.exit(1);
}

console.log('\n✓ Las 12 láminas cargan, se ven y no desbordan, en móvil y escritorio.');
