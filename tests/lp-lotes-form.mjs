/**
 * Verifica que la LP de lotes PDC llegue al HTML con el formulario USABLE, sin
 * ejecutar JavaScript y sin que el visitante tenga que responder nada antes.
 *
 * Por qué existe: la campaña de Google Ads gastó $991 MXN en 72 clics con CERO
 * envíos. Medido con Playwright, `document.querySelectorAll('form').length`
 * daba 0 al cargar: los campos de nombre y WhatsApp vivían detrás de una
 * compuerta de dos pasos ("¿Qué estás buscando?"), así que el visitante que
 * costó $13.77 no veía un formulario, veía una pregunta. El síntoma es
 * invisible en el build (compila) y en el navegador (la página se ve bien):
 * solo un chequeo sobre el HTML generado lo detecta.
 *
 * Contrato de marcado que este test fija:
 *   - data-lp-contacto="hero"      → el par nombre+WhatsApp cerca del inicio
 *   - data-lp-contacto="principal" → el formulario completo de la columna
 * Ambos deben traer sus inputs en el HTML del server.
 *
 * Uso: npm run build && node tests/lp-lotes-form.mjs
 */
import { readFileSync, existsSync } from 'node:fs';

const RUTA = '.next/server/app/lp/lotes-playa-del-carmen.html';

/**
 * Campos que deben estar en el HTML del server. El honeypot cuenta: si no
 * salió, el formulario se renderizó a medias y el anti-bot no protege nada.
 */
const CAMPOS = ['name="name"', 'name="phone"', 'name="website"'];

/** Los dos puntos de contacto. Uno arriba y uno en la columna. */
const BLOQUES = ['data-lp-contacto="hero"', 'data-lp-contacto="principal"'];

/**
 * La compuerta. Que el texto exista no es el problema — el problema es que sea
 * lo ÚNICO que hay. Se permite como campo opcional junto a los inputs, se
 * prohíbe como paso previo: si aparece el marcador de progreso "1/2" sin que
 * haya inputs, seguimos con la compuerta puesta.
 */
const COMPUERTA = 'aria-label="Paso 1 de 2"';

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

if (html.includes(COMPUERTA)) {
  fallos.push('sigue la compuerta de 2 pasos: se encontró el progressbar "Paso 1 de 2"');
}

// El bloque del hero tiene que ir ANTES del principal en el documento, si no
// no está arriba: está duplicado abajo y el visitante sigue scrolleando 3
// pantallas para poder dar su teléfono.
const posHero = html.indexOf(BLOQUES[0]);
const posPrincipal = html.indexOf(BLOQUES[1]);
if (posHero !== -1 && posPrincipal !== -1 && posHero > posPrincipal) {
  fallos.push('el bloque "hero" aparece DESPUÉS del "principal" en el HTML');
}

// Un input dentro de cada bloque. Sin esto, "data-lp-contacto" podría ser un
// div vacío y el test pasaría en falso.
for (const bloque of BLOQUES) {
  const desde = html.indexOf(bloque);
  if (desde === -1) continue;
  const trozo = html.slice(desde, desde + 4000);
  if (!trozo.includes('name="phone"')) {
    fallos.push(`el bloque ${bloque} no contiene un input name="phone"`);
  }
}

if (fallos.length) {
  console.error('✗ LP lotes PDC — formulario NO usable sin JavaScript:\n');
  for (const f of fallos) console.error(`  · ${f}`);
  console.error(`\n${fallos.length} fallo(s). HTML revisado: ${RUTA}`);
  process.exit(1);
}

console.log('✓ LP lotes PDC: formulario en el HTML del server, sin compuerta, con bloque arriba y abajo.');
