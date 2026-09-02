/**
 * Contrato de marcado de la VARIANTE C, /lp/enganche-terrenos-playa-del-carmen.
 *
 * Hermano de `lp-terrenos-form.mjs` + `lp-terrenos-imagenes.mjs`, sobre el HTML
 * que genera el build. Corre sin servidor y sin navegador.
 *
 * ═══ LAS TRES LECCIONES QUE ESTE ARCHIVO DEFIENDE ═══
 *
 *   1. El formulario tiene que estar EN EL HTML, sin compuerta. La campaña
 *      gastó $991.40 MXN en 72 clics con cero envíos porque los campos vivían
 *      detrás de dos preguntas: el build compilaba y la página se veía bien.
 *   2. Ningún archivo de imagen RECHAZADO puede volver. Tres de los 16 de la
 *      galería llevan rótulos dentro del pixel; uno de ellos se colaba solo al
 *      cambiar el recorte. Ver `ARCHIVOS_RECHAZADOS` en `lp-lotes.ts`.
 *   3. Toda cifra en pesos lleva «MXN». Esta variante publica el ENGANCHE como
 *      protagonista: es la cifra más grande de la página y un `$` suelto se lee
 *      como dólar.
 *
 * Uso: npm run build && node tests/lp-enganche-contrato.mjs
 */
import { readFileSync, existsSync } from 'node:fs';

const RUTA = '.next/server/app/lp/enganche-terrenos-playa-del-carmen.html';

/**
 * Sin el honeypot el formulario se renderizó a medias y el anti-bot no cubre
 * nada. `name="email"` entra el 2026-09-02: el hero y el cierre piden correo, y
 * si el campo desaparece el lead llega sin la vía por la que se manda el PDF.
 */
const CAMPOS = ['name="name"', 'name="phone"', 'name="email"', 'name="website"'];

/**
 * El diagnóstico del cierre. Va aquí y no solo en el test de navegador porque
 * su fallo más probable es silencioso: que los grupos dejen de renderizarse en
 * el HTML del servidor y el bloque se quede en un formulario normal.
 *
 * ⚠️ EXACTAMENTE UNO DE CADA. Un segundo `data-lpe-grupo` significa que el
 * diagnóstico se colgó de otro bloque — y un cuestionario en el hero es la
 * compuerta que costó $991.40 MXN en 72 clics con cero envíos.
 */
const GRUPOS_DIAGNOSTICO = ['uso', 'enganche', 'zona'];

/**
 * El cierre está partido en dos pasos. Estas dos cadenas defienden que siga
 * PARTIDO Y COMPLETO en el HTML del servidor: los grupos del diagnóstico de
 * arriba viven en el paso 2, y si un día se renderizaran condicionalmente en
 * cliente en vez de ocultos, desaparecerían del HTML sin romper el build. El
 * síntoma sería el de siempre: la página se ve bien y no convierte.
 */
const PASOS_DEL_CIERRE = ['data-lpe-paso="1"', 'data-lpe-pasos="2"', '>Continuar<'];

/** Las tres instancias: hero, medio (tras la galería) y cierre. */
const BLOQUES = [
  'data-lpe-form="hero"',
  'data-lpe-form="medio"',
  'data-lpe-form="cierre"',
];

/**
 * Copiados a mano de `ARCHIVOS_RECHAZADOS`. ⚠️ NO se importan de ahí a
 * propósito: ese módulo arrastra el cliente de Supabase, y sobre todo, un test
 * que compara la lista contra sí misma no prueba nada — si alguien borrara una
 * entrada para «arreglar» un rojo, el test importado se pondría verde solo.
 */
const RECHAZADOS = [
  '1782488141310-uns1a3.webp', // monumento con el nombre comercial
  '1782488140060-8pdp40.webp', // pilón de rótulos de la plaza comercial
  '1782488141376-dpv2ki.webp', // la caseta: el nombre entra en el recorte ancho
];

/** Nombres comerciales que jamás pueden estar en el DOM (Camino A). */
const NOMBRES_PROHIBIDOS = ['gran coralia', 'coralia', 'desarrollos coralia'];

/** Control POSITIVO: sin esto, un build que publique una sola imagen da verde. */
const MINIMO_IMAGENES = 12;

const fallos = [];

if (!existsSync(RUTA)) {
  console.error(`✗ No existe ${RUTA} — corre "npm run build" primero.`);
  process.exit(1);
}

const html = readFileSync(RUTA, 'utf8');

// ── 1. El formulario, en el HTML y sin compuerta ────────────────────────────
for (const campo of CAMPOS) {
  if (!html.includes(campo)) fallos.push(`falta el campo ${campo}`);
}
for (const bloque of BLOQUES) {
  if (!html.includes(bloque)) fallos.push(`falta el bloque ${bloque}`);
}

for (const marca of PASOS_DEL_CIERRE) {
  if (!html.includes(marca)) {
    fallos.push(`falta «${marca}» — el cierre dejó de estar partido en dos pasos`);
  }
}
for (const grupo of GRUPOS_DIAGNOSTICO) {
  const veces = html.split(`data-lpe-grupo="${grupo}"`).length - 1;
  if (veces === 0) {
    fallos.push(`falta el grupo «${grupo}» del diagnóstico del cierre`);
  } else if (veces > 1) {
    fallos.push(
      `el grupo «${grupo}» aparece ${veces} veces: el diagnóstico solo va en el bloque de cierre`,
    );
  }
}

const posHero = html.indexOf('data-lpe-form="hero"');
if (posHero === -1) {
  fallos.push('no hay formulario de hero');
} else if (posHero > html.length / 3) {
  fallos.push(
    `el formulario del hero está al ${Math.round((posHero / html.length) * 100)}% del documento; debe estar en el primer tercio`,
  );
}

// ── 2. El enganche ES la protagonista ──────────────────────────────────────
// La razón de existir de la variante. Si el plan no resuelve, la página sigue
// funcionando pero deja de ser esta variante, y eso tiene que salir en rojo.
if (!/de enganche/i.test(html)) {
  fallos.push('el H1 no menciona el enganche: la variante perdió su tesis');
}
// Los tres tramos del esquema, publicados los tres.
for (const tramo of ['Enganche', 'Mensualidades', 'Contraentrega']) {
  if (!html.includes(tramo)) fallos.push(`falta el tramo «${tramo}» del desglose`);
}

// ── 3. Ningún archivo rechazado ────────────────────────────────────────────
for (const archivo of RECHAZADOS) {
  if (html.includes(archivo)) {
    fallos.push(
      `el archivo RECHAZADO ${archivo} está en el HTML — ver ARCHIVOS_RECHAZADOS`,
    );
  }
}

// ── 4. Ningún nombre comercial ─────────────────────────────────────────────
const enMinusculas = html.toLowerCase();
for (const nombre of NOMBRES_PROHIBIDOS) {
  if (enMinusculas.includes(nombre)) {
    fallos.push(`el nombre comercial "${nombre}" aparece en el HTML (Camino A)`);
  }
}

// ── 5. Imágenes: cuántas, y todas rotuladas ────────────────────────────────
const archivos = [...new Set(html.match(/1782\d+-[a-z0-9]+\.webp/g) ?? [])];
if (archivos.length < MINIMO_IMAGENES) {
  fallos.push(
    `solo ${archivos.length} imágenes distintas, mínimo ${MINIMO_IMAGENES}`,
  );
}
if (!html.includes('Render del desarrollador')) {
  fallos.push('ninguna imagen se rotula como «Render del desarrollador»');
}
if (!html.includes('Fotografía real')) {
  fallos.push('la aérea del polígono no se rotula como «Fotografía real»');
}
const sinAlt = (html.match(/<img[^>]*>/g) ?? []).filter(
  (t) => !/alt="[^"]+"/.test(t),
);
if (sinAlt.length) fallos.push(`${sinAlt.length} <img> sin alt`);

// ── 6. Toda cifra en pesos con «MXN» ───────────────────────────────────────
// Se busca `$` seguido de dígitos SIN un «MXN» cerca. El margen de 12
// caracteres cubre el cierre de etiqueta que Next mete entre la cifra y el
// sufijo cuando van en spans distintos.
const soloCuerpo = html.slice(html.indexOf('<body'));
const pesosSinMxn = (soloCuerpo.match(/\$[\d,]+(?![^<]{0,12}MXN)/g) ?? []).filter(
  (m) => m.length > 4,
);
if (pesosSinMxn.length) {
  fallos.push(
    `${pesosSinMxn.length} cifra(s) en $ sin «MXN» cerca: ${pesosSinMxn.slice(0, 5).join(', ')}`,
  );
}

// ── Veredicto ──────────────────────────────────────────────────────────────
if (fallos.length) {
  console.error('✗ Contrato de /lp/enganche-terrenos-playa-del-carmen:');
  for (const f of fallos) console.error(`  · ${f}`);
  process.exit(1);
}

console.log('✓ Contrato de /lp/enganche-terrenos-playa-del-carmen');
console.log(
  `  · ${BLOQUES.length} formularios · hero al ${Math.round((posHero / html.length) * 100)}% · ${archivos.length} imágenes · 0 archivos rechazados · 0 nombres comerciales`,
);
