/**
 * Contrato de IMÁGENES de la LP corta /lp/terrenos-playa-del-carmen.
 *
 * ═══ POR QUÉ ESTE TEST EXISTE ═══
 *
 * La galería del desarrollo del Hub contiene renders donde el NOMBRE COMERCIAL
 * está rotulado dentro del pixel: el monumento del acceso, la señalética de los
 * locales. `sanitizarTexto` no puede verlos —solo lee cadenas—, así que la
 * única defensa es la lista blanca `IMAGENES_CURADAS`, revisada a ojo.
 *
 * Una lista blanca revisada a ojo protege mientras nadie la edite. Este test es
 * la parte que sí aguanta ediciones: si alguien vuelve a dar de alta uno de los
 * archivos rechazados, el HTML servido lo delata y esto se pone rojo.
 *
 * El 2026-08-26 el rechazo número tres apareció DESPUÉS de dar el alta y de que
 * el build pasara: el recorte 16/10 de la lámina metía en cuadro un monumento
 * con «GRAN CORALIA RESIDENCIAL» que en el archivo original quedaba en el borde.
 * Ese caso —fuga que solo se ve maquetada— este test NO lo detecta: es un test
 * de nombres de archivo, no de contenido visual. Lo que hace es impedir que la
 * decisión, ya tomada, se pierda.
 *
 * Uso: npm run build && node tests/lp-terrenos-imagenes.mjs
 */
import { readFileSync, existsSync } from 'node:fs';

const RUTA = '.next/server/app/lp/terrenos-playa-del-carmen.html';

/**
 * Copiados a mano de `ARCHIVOS_RECHAZADOS` en `src/lib/supabase/lp-lotes.ts`.
 *
 * ⚠️ NO se importan de ahí a propósito. Ese módulo arrastra el cliente de
 * Supabase y este test corre sobre HTML ya generado, sin entorno. Y sobre todo:
 * un test que compara la lista contra sí misma no prueba nada — si alguien
 * borrara una entrada de `ARCHIVOS_RECHAZADOS` para «arreglar» un rojo, el test
 * importado se pondría verde solo. Estar duplicado es lo que le da valor.
 */
const RECHAZADOS = [
  '1782488141310-uns1a3.webp', // el monumento con el nombre comercial
  '1782488140060-8pdp40.webp', // pilón de rótulos de la plaza comercial
  '1782488141376-dpv2ki.webp', // la caseta: el nombre entra en el recorte 16/10
];

/** Nombres comerciales que jamás pueden estar en el DOM (Camino A). */
const NOMBRES_PROHIBIDOS = ['gran coralia', 'coralia', 'desarrollos coralia'];

/** Lo que la página debe servir. Es el control POSITIVO: sin él, un build que
 *  vuelva a publicar una sola imagen daría verde. */
const MINIMO_IMAGENES = 12;

const fallos = [];

if (!existsSync(RUTA)) {
  console.error(`✗ No existe ${RUTA} — corre "npm run build" primero.`);
  process.exit(1);
}

const html = readFileSync(RUTA, 'utf8');

// ── 1. Ningún archivo rechazado ────────────────────────────────────────────
for (const archivo of RECHAZADOS) {
  // El nombre viaja dentro de la URL de Storage, ya sea cruda o url-encoded
  // dentro del `?url=` del optimizador de Next. Se busca el nombre a secas.
  if (html.includes(archivo)) {
    fallos.push(
      `el archivo RECHAZADO ${archivo} está en el HTML — ver ARCHIVOS_RECHAZADOS en lp-lotes.ts`,
    );
  }
}

// ── 2. Ningún nombre comercial en el DOM ───────────────────────────────────
const enMinusculas = html.toLowerCase();
for (const nombre of NOMBRES_PROHIBIDOS) {
  if (enMinusculas.includes(nombre)) {
    fallos.push(`el nombre comercial "${nombre}" aparece en el HTML (Camino A)`);
  }
}

// ── 3. Se sirven imágenes, y suficientes ───────────────────────────────────
const archivos = [...new Set(html.match(/1782\d+-[a-z0-9]+\.webp/g) ?? [])];
if (archivos.length < MINIMO_IMAGENES) {
  fallos.push(
    `solo ${archivos.length} imágenes distintas en el HTML, mínimo ${MINIMO_IMAGENES}`,
  );
}

// ── 4. Toda imagen va rotulada por lo que es ───────────────────────────────
// El prefijo lo pone `FiguraTerrenos`/`Figure` y es la regla que impide vender
// un render como obra existente.
if (!html.includes('Render del desarrollador')) {
  fallos.push('ninguna imagen se rotula como «Render del desarrollador»');
}
if (!html.includes('Fotografía real')) {
  fallos.push('la aérea real del polígono no se rotula como «Fotografía real»');
}

// ── 5. Toda <img> con alt no vacío ─────────────────────────────────────────
const imgs = html.match(/<img[^>]*>/g) ?? [];
const sinAlt = imgs.filter((t) => !/alt="[^"]+"/.test(t));
if (sinAlt.length) fallos.push(`${sinAlt.length} <img> sin alt`);

// ── 6. Las láminas no dependen de JS para verse ────────────────────────────
// `Reveal`/`Escalonado` de framer-motion sirven `opacity:0` en el HTML. Si una
// lámina cae dentro de uno de esos, un JS que no carga deja la sección en
// blanco — y las imágenes son la razón de ser de la sección.
const laminas = html.match(/lpt-lamina-entra[^>]*/g) ?? [];
const conOpacidadCero = laminas.filter((t) => /opacity:\s*0/.test(t));
if (conOpacidadCero.length) {
  fallos.push(`${conOpacidadCero.length} lámina(s) servidas con opacity:0`);
}
if (laminas.length < 10) {
  fallos.push(`solo ${laminas.length} contenedores .lpt-lamina-entra, esperados ≥10`);
}

// ── Veredicto ──────────────────────────────────────────────────────────────
if (fallos.length) {
  console.error('✗ Contrato de imágenes de /lp/terrenos-playa-del-carmen:');
  for (const f of fallos) console.error(`  · ${f}`);
  process.exit(1);
}

console.log('✓ Contrato de imágenes de /lp/terrenos-playa-del-carmen');
console.log(
  `  · ${archivos.length} imágenes distintas · ${laminas.length} láminas sin opacity:0 · 0 archivos rechazados · 0 nombres comerciales`,
);
