/**
 * Contrato de marcado de la LP corta /lp/terrenos-playa-del-carmen.
 *
 * Hermano de `tests/lp-lotes-form.mjs`, con la misma lección detrás: la campaña
 * gastó $991 MXN en 72 clics con CERO envíos porque el formulario existía en el
 * código pero no en el HTML — vivía detrás de una compuerta de dos pasos. El
 * build compila y la página se ve bien; solo un chequeo sobre el HTML generado
 * lo detecta.
 *
 * Esta LP es la variante de conversión pura del A/B contra la larga, así que
 * aquí el contrato es más estricto: el formulario tiene que estar en el PRIMER
 * bloque del documento, no a tres pantallas de scroll.
 *
 * Uso: npm run build && node tests/lp-terrenos-form.mjs
 */
import { readFileSync, existsSync } from 'node:fs';

const RUTA = '.next/server/app/lp/terrenos-playa-del-carmen.html';

/** Sin el honeypot el formulario se renderizó a medias y el anti-bot no cubre nada. */
const CAMPOS = ['name="name"', 'name="phone"', 'name="website"'];

/**
 * Las TRES instancias del formulario: hero, la del medio (detrás del mosaico de
 * láminas, añadida el 2026-08-26) y la del cierre.
 */
const BLOQUES = [
  'data-lpt-form="hero"',
  'data-lpt-form="medio"',
  'data-lpt-form="cierre"',
];

const fallos = [];

if (!existsSync(RUTA)) {
  console.error(`✗ No existe ${RUTA} — corre "npm run build" primero.`);
  process.exit(1);
}

const html = readFileSync(RUTA, 'utf8');

for (const campo of CAMPOS) {
  if (!html.includes(campo)) fallos.push(`falta el campo ${campo} en el HTML del server`);
}

for (const bloque of BLOQUES) {
  if (!html.includes(bloque)) fallos.push(`falta el bloque ${bloque}`);
}

// Un <form> real, no un div con inputs sueltos.
if (!/<form[\s>]/.test(html)) fallos.push('no hay ni un <form> en el HTML del server');

// El formulario del hero tiene que ir ANTES del de cierre.
const posHero = html.indexOf(BLOQUES[0]);
const posCierre = html.indexOf(BLOQUES[1]);
if (posHero !== -1 && posCierre !== -1 && posHero > posCierre) {
  fallos.push('el formulario "hero" aparece DESPUÉS del de "cierre" en el HTML');
}

// Cada bloque tiene que traer su propio input de teléfono.
for (const bloque of BLOQUES) {
  const desde = html.indexOf(bloque);
  if (desde === -1) continue;
  if (!html.slice(desde, desde + 6000).includes('name="phone"')) {
    fallos.push(`el bloque ${bloque} no contiene un input name="phone"`);
  }
}

// El formulario del hero va en el primer tercio del documento. Es la diferencia
// entre esta variante y la larga: si cae más abajo, dejó de ser la variante corta.
if (posHero !== -1 && posHero > html.length / 3) {
  fallos.push(
    `el formulario del hero está al ${Math.round((posHero / html.length) * 100)}% del documento; debe estar en el primer tercio`,
  );
}

// El H1 nunca se funde: es el LCP. Un opacity:0 inline sobre el <h1> lo deja
// invisible sin JS y hunde el LCP. Ver feedback_lcp_h1_nunca_fundir_solo_mover
// y feedback_framer_ssr_opacity_cero_atascado.
const h1 = html.match(/<h1[^>]*>/);
if (!h1) {
  fallos.push('no hay <h1> en el HTML del server');
} else if (/opacity:\s*0(?![.\d])/.test(h1[0])) {
  fallos.push('el <h1> sale con opacity:0 en el HTML del server — es el LCP, solo se mueve');
}

// Toda cifra en pesos va rotulada MXN: el "$" de es-MX se lee como dólar.
const pesosSinMxn = [...html.matchAll(/\$\s?[\d,.]{3,}/g)]
  .map((m) => ({ txt: m[0], ctx: html.slice(m.index, m.index + 40) }))
  .filter((m) => !/MXN/.test(m.ctx));
if (pesosSinMxn.length) {
  fallos.push(
    `${pesosSinMxn.length} cifra(s) en $ sin "MXN" cerca: ${pesosSinMxn
      .slice(0, 3)
      .map((m) => m.txt)
      .join(' · ')}`,
  );
}

if (fallos.length) {
  console.error('✗ Contrato de la LP corta roto:');
  for (const f of fallos) console.error(`  · ${f}`);
  process.exit(1);
}

console.log('✓ LP /lp/terrenos-playa-del-carmen: formulario en el HTML del server, sin compuerta.');
console.log(`  · ${BLOQUES.length} bloques de formulario · hero al ${Math.round((posHero / html.length) * 100)}% del documento`);
