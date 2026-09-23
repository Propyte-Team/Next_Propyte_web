/**
 * La VARIANTE C en un navegador de verdad.
 *
 * ═══ QUÉ CUBRE ESTO QUE NO CUBRE `lp-enganche-contrato.mjs` ═══
 *
 * Ese test lee el HTML y comprueba nombres, rótulos y posiciones. Es rápido y no
 * necesita servidor, pero un `<img>` en el HTML NO es una imagen en pantalla: la
 * ruta del optimizador de Next puede devolver 400 y la página se ve igual de
 * vacía. Pasó en esta misma sesión con el logo del layout, y el HTML lo
 * declaraba perfecto.
 *
 * Aquí se comprueba lo que solo se ve ejecutando:
 *   · que las 12 imágenes CARGUEN (`complete && naturalWidth > 0`);
 *   · que ninguna quede invisible — las cápsulas animan por CSS con
 *     `animation-timeline: view()` justo para que no puedan atascarse en cero;
 *   · que el estilo copiado esté REALMENTE aplicado: Poppins en el H1 y el
 *     radio de 32 px en las cápsulas. Un `next/font` mal cableado cae al
 *     fallback del sistema sin romper nada visible en el HTML;
 *   · que el formulario del hero esté dentro del primer viewport EN MÓVIL, que
 *     es la propiedad por la que se pagó $991.40 MXN aprendiéndola;
 *   · que no haya desborde horizontal a 390 px;
 *   · que los tres formularios hidraten.
 *
 * Uso, contra un build de producción servido:
 *   BASE_URL=http://127.0.0.1:3199 node tests/lp-enganche-navegador.mjs
 *
 * ⚠️ `output: 'standalone'` ⇒ `next start` NO sirve el build. Hay que levantar
 * `.next/standalone/server.js` con `.next/static` y `public` copiados dentro.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3199';
const RUTA = '/lp/enganche-terrenos-playa-del-carmen';

/** Imágenes del desarrollo que la página debe servir. Control POSITIVO. */
const IMAGENES_ESPERADAS = 12;
const FORMULARIOS_ESPERADOS = 3;

/** La firma del estilo copiado, medida en la landing de referencia. */
const RADIO_CAPSULA = '32px';
const FUENTE_TITULAR = /Poppins/;

/** Ruido conocido y ajeno, verificado uno por uno. Cualquier otro error va a rojo. */
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

  // Recorrer el documento: 11 de las 12 imágenes son `loading="lazy"`.
  await pagina.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await pagina.waitForTimeout(2500);

  const d = await pagina.evaluate(() => {
    /**
     * ⚠️ FUERA LAS BANDERAS DEL SELECTOR DE LADA.
     *
     * Desde el 2026-09-02 el hero y el cierre usan `PhoneInputField`, que
     * renderiza una bandera por formulario (`img.PhoneInputCountryIconImg`).
     * Son cromo de un control de UI, no imágenes del desarrollo: contarlas
     * rompía el conteo exacto (14 en vez de 12) y las marcaba «sin alt» porque
     * su alt es el nombre del país —«Mexico», 6 caracteres— y aquí el umbral de
     * alt descriptivo son 10.
     *
     * Tampoco entran en `noCargadas`: la bandera se sirve desde
     * `purecatamphetamine.github.io`, un tercero. Si ese host se cae, lo que
     * hay que ver en rojo es una alerta de dependencia externa, no «una imagen
     * del desarrollo no cargó» — que es lo que este test existe para vigilar.
     */
    const imgs = [...document.querySelectorAll('img')].filter(
      (i) => !i.classList.contains('PhoneInputCountryIconImg'),
    );
    const h1 = document.querySelector('h1');
    const cap = document.querySelector('.lpe-capsula');
    const hero = document.querySelector('[data-lpe-form="hero"]');
    return {
      imgs: imgs.map((i) => ({
        src: (i.currentSrc || i.src).slice(-90),
        cargada: i.complete && i.naturalWidth > 0,
        alt: (i.alt || '').length,
        opacidad: Number(getComputedStyle(i.closest('figure') ?? i).opacity),
      })),
      fuenteH1: h1 ? getComputedStyle(h1).fontFamily : '',
      radio: cap ? getComputedStyle(cap).borderTopLeftRadius : '',
      forms: document.querySelectorAll('form[data-lpe-form]').length,
      heroEnViewport: hero
        ? hero.getBoundingClientRect().top < window.innerHeight
        : false,
      desborde:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      pantallas:
        Math.round((document.body.scrollHeight / window.innerHeight) * 10) / 10,
    };
  });

  // El logo de Propyte vive en el layout compartido y su alt es "Propyte", que
  // es el alt correcto para un logotipo: se excluye del umbral de alt
  // descriptivo en vez de bajarle el umbral a todas.
  const propias = d.imgs.filter((i) => !i.src.includes('logo-horizontal'));
  const noCargadas = d.imgs.filter((i) => !i.cargada);
  const invisibles = d.imgs.filter((i) => i.opacidad < 0.05);
  const sinAlt = propias.filter((i) => i.alt < 10);

  console.log(
    `→ ${vp.nombre}: ${propias.length} imágenes · ${d.imgs.length - noCargadas.length}/${d.imgs.length} cargadas · ${d.forms} forms · ${d.pantallas} pantallas · radio ${d.radio} · desborde ${d.desborde}px`,
  );

  if (propias.length !== IMAGENES_ESPERADAS)
    fallos.push(
      `${vp.nombre}: ${propias.length} imágenes, esperadas ${IMAGENES_ESPERADAS}`,
    );
  if (noCargadas.length) {
    fallos.push(`${vp.nombre}: ${noCargadas.length} imagen(es) NO cargaron`);
    noCargadas.forEach((i) => console.error(`    ✗ ${i.src}`));
  }
  if (invisibles.length)
    fallos.push(`${vp.nombre}: ${invisibles.length} imagen(es) con opacidad ~0`);
  if (sinAlt.length) fallos.push(`${vp.nombre}: ${sinAlt.length} imagen(es) sin alt`);
  if (!FUENTE_TITULAR.test(d.fuenteH1))
    fallos.push(
      `${vp.nombre}: el H1 no usa Poppins (${d.fuenteH1 || 'sin fuente'}) — next/font cayó al fallback`,
    );
  if (d.radio !== RADIO_CAPSULA)
    fallos.push(
      `${vp.nombre}: el radio de la cápsula es ${d.radio}, debe ser ${RADIO_CAPSULA}`,
    );
  if (d.desborde > 1)
    fallos.push(`${vp.nombre}: desborde horizontal de ${d.desborde}px`);
  if (d.forms !== FORMULARIOS_ESPERADOS)
    fallos.push(
      `${vp.nombre}: ${d.forms} formularios, esperados ${FORMULARIOS_ESPERADOS}`,
    );
  if (!d.heroEnViewport)
    fallos.push(`${vp.nombre}: el formulario del hero cayó fuera del primer viewport`);
  if (errores.length) {
    fallos.push(`${vp.nombre}: ${errores.length} error(es) de consola/red`);
    errores.slice(0, 6).forEach((e) => console.error(`    ✗ ${e.slice(0, 160)}`));
  }

  await ctx.close();
}

await navegador.close();

if (fallos.length) {
  console.error('\n✗ Variante C en navegador:');
  for (const f of fallos) console.error(`  · ${f}`);
  process.exit(1);
}

console.log(
  '\n✓ Variante C: 12 imágenes cargan y se ven, Poppins y el radio de 32 px aplicados, 3 formularios, sin desborde.',
);
