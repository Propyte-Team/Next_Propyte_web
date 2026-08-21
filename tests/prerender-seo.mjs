/**
 * Verifica que las páginas clave lleguen PRERENDERIZADAS al HTML: con su <h1> y
 * con su JSON-LD como etiqueta <script type="application/ld+json"> real.
 *
 * Por qué existe: /contacto llegaba a producción como un cascarón. El HTML solo
 * traía el nav y el footer — sin <h1>, sin dirección, y sin el JSON-LD de
 * RealEstateAgent. Todo el contenido viajaba en el payload RSC y solo aparecía
 * si el cliente ejecutaba JavaScript. La causa: `useSearchParams()` en un client
 * component sin `<Suspense>` opta a todo el árbol hasta el layout raíz fuera del
 * prerender. El síntoma es invisible en el navegador (la página se ve bien) y
 * silencioso en el build (compila 375/375), así que solo un chequeo sobre el
 * HTML generado lo detecta.
 *
 * Uso: npm run build && node tests/prerender-seo.mjs
 */
import { readFileSync, existsSync } from 'node:fs';

const BASE = '.next/server/app/es';

/**
 * Cada página con lo que su HTML debe contener sin ejecutar JavaScript.
 *
 * `contiene` son marcadores de contenido propio de la página. No se usa un
 * umbral de caracteres: /contacto es legítimamente corta (un formulario son
 * campos, no prosa) y cualquier número redondo acaba siendo un falso positivo.
 * La ausencia de <h1> ya delata el cascarón de layout por sí sola.
 */
const ESPERADO = [
  {
    ruta: '.next/server/app/es.html',
    nombre: 'home',
    tipos: ['WebSite', 'Organization'],
    contiene: [],
  },
  {
    ruta: `${BASE}/contacto.html`,
    nombre: 'contacto',
    tipos: ['RealEstateAgent', 'BreadcrumbList'],
    // El NAP y el enlace a la ficha son el motivo de existir de esta página
    // para SEO local: si no están en el HTML, Google depende de ejecutar JS.
    contiene: ['77720', 'Ver en Google Maps', '<iframe'],
  },
  { ruta: `${BASE}/faq.html`, nombre: 'faq', tipos: ['FAQPage', 'BreadcrumbList'], contiene: [] },
  {
    ruta: `${BASE}/nosotros/quienes-somos.html`,
    nombre: 'quienes-somos',
    tipos: ['BreadcrumbList'],
    contiene: [],
  },
  {
    ruta: `${BASE}/financiamiento.html`,
    nombre: 'financiamiento',
    tipos: ['BreadcrumbList'],
    contiene: [],
  },
];

/** Solo etiquetas reales. Las menciones dentro del payload RSC no cuentan. */
function tiposJsonLd(html) {
  const bloques = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  const tipos = [];
  for (const [, cuerpo] of bloques) {
    try {
      const o = JSON.parse(cuerpo);
      if (o['@type']) tipos.push(String(o['@type']));
    } catch {
      tipos.push('(no parsea)');
    }
  }
  return tipos;
}

function textoVisible(html) {
  const sinScripts = html.replace(/<script[\s\S]*?<\/script>/g, '');
  const body = (sinScripts.match(/<body[\s\S]*<\/body>/) || [''])[0];
  return {
    chars: body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length,
    h1: (body.match(/<h1/g) || []).length,
  };
}

let fallos = 0;

for (const { ruta, nombre, tipos: requeridos, contiene } of ESPERADO) {
  if (!existsSync(ruta)) {
    console.error(`✗ ${nombre}: no existe ${ruta} — ¿corriste npm run build?`);
    fallos++;
    continue;
  }
  const html = readFileSync(ruta, 'utf8');
  const tipos = tiposJsonLd(html);
  const { chars, h1 } = textoVisible(html);
  const faltantes = requeridos.filter((t) => !tipos.includes(t));
  const problemas = [];

  if (h1 < 1) problemas.push('sin <h1> en el HTML (cascarón de layout)');
  if (faltantes.length) problemas.push(`falta JSON-LD: ${faltantes.join(', ')}`);
  const sinMarcador = (contiene || []).filter((m) => !html.includes(m));
  if (sinMarcador.length) problemas.push(`falta en el HTML: ${sinMarcador.join(', ')}`);

  if (problemas.length) {
    console.error(`✗ ${nombre}: ${problemas.join(' · ')}`);
    console.error(`    JSON-LD presente: [${tipos.join(', ') || 'ninguno'}]`);
    fallos++;
  } else {
    console.log(`✓ ${nombre}: h1=${h1} texto=${chars} JSON-LD=[${tipos.join(', ')}]`);
  }
}

if (fallos) {
  console.error(`\n${fallos} página(s) no llegan prerenderizadas al HTML.`);
  process.exit(1);
}
console.log('\nTodas las páginas clave llegan prerenderizadas.');
