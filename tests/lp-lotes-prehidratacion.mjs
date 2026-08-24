/**
 * Regresión de la variante A: rellenar ANTES de que React hidrate no puede
 * costar el lead.
 *
 * POR QUÉ ESTE TEST NACE AHORA Y NO ANTES. Mientras el formulario vivía detrás
 * de la compuerta «¿Qué estás buscando?», este fallo era imposible: no se
 * llegaba a un campo sin que React hubiera hidratado, porque el avance de paso
 * lo hacía el propio React. Al servirse el formulario en el HTML del servidor
 * se abre la ventana, y con ella el bug.
 *
 * Es decir: quitar la compuerta arregla un problema caro y destapa otro. Este
 * test cubre el segundo.
 *
 * Lo que se simula es el caso más duro y más común: el AUTOCOMPLETADO del
 * navegador, que escribe `.value` directamente sin disparar el `onChange` que
 * React escucha. Rellenar con `fill()` sería más benévolo.
 *
 * ⚠️ EL POST SE INTERCEPTA: cada corrida crearía un lead basura en el CRM.
 *
 * Uso:
 *   BASE_URL=http://127.0.0.1:3213 node tests/lp-lotes-prehidratacion.mjs
 *   BASE_URL=https://propyte.com   node tests/lp-lotes-prehidratacion.mjs
 */
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3213';
const RUTA = '/lp/lotes-playa-del-carmen';
const NOMBRE = 'Autocompletado Temprano';
const TEL = '9847654321';

const fallos = [];
const ok = (c, m) => {
  if (!c) fallos.push(m);
};

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });

let cuerpo = null;
await pagina.route('**/api/leads', async (r) => {
  cuerpo = JSON.parse(r.request().postData() ?? '{}');
  await r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
});
await pagina.route('**/api/track', (r) =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
);

await pagina.goto(`${BASE}${RUTA}`, { waitUntil: 'domcontentloaded' });

// Primero, la premisa. Si no hay formulario, el resto del test no tiene
// sentido: se aborta AQUÍ con el motivo, en vez de dejar que reviente 20
// segundos después esperando un botón que no existe. Un test que falla por
// timeout no dice qué pasó; éste sí.
const formsAlCargar = await pagina.locator('form').count();
if (formsAlCargar === 0) {
  console.error('✗ Variante A: no hay ni un <form> al cargar.');
  console.error('  · el formulario sigue detrás de la compuerta de dos pasos');
  console.error('  · sin formulario no hay nada que rescatar: este test no aplica todavía');
  await navegador.close();
  process.exit(1);
}

// Rellenado crudo, como el autocompletado: sin eventos.
const relleno = await pagina.evaluate(
  ({ n, t }) => {
    const f = document.querySelector('[data-lp-contacto="hero"]') ?? document.querySelector('form');
    if (!f) return false;
    const cn = f.querySelector('input[name="name"]');
    const ct = f.querySelector('input[name="phone"]');
    if (!cn || !ct) return false;
    cn.value = n;
    ct.value = t;
    return true;
  },
  { n: NOMBRE, t: TEL },
);
ok(relleno, 'no se encontraron los inputs de nombre y teléfono para rellenar');

// Espera a que React adjunte sus props al nodo, en vez de dormir un fijo.
await pagina.waitForLoadState('networkidle').catch(() => {});
await pagina
  .waitForFunction(
    () => {
      const f = document.querySelector('form');
      return !!f && Object.keys(f).some((k) => k.startsWith('__react'));
    },
    null,
    { timeout: 20000 },
  )
  .catch(() => {});
await pagina.waitForTimeout(600);

const aceptar = pagina.getByRole('button', { name: /aceptar/i }).first();
if (await aceptar.count()) {
  await aceptar.click();
  await pagina.waitForTimeout(200);
}

const bloque = pagina.locator('[data-lp-contacto="hero"]').first();
await (await bloque.count() ? bloque : pagina.locator('form').first())
  .locator('button[type="submit"]')
  .click();
await pagina.waitForTimeout(2500);

ok(cuerpo !== null, 'se rellenó antes de hidratar y NO salió POST — el lead se pierde en silencio');
if (cuerpo) {
  ok(cuerpo.name === NOMBRE, `name = "${cuerpo.name}", se esperaba "${NOMBRE}"`);
  ok(cuerpo.phone === TEL, `phone = "${cuerpo.phone}", se esperaba "${TEL}"`);
  // El literal que engancha el mapa de campos de Zoho.
  ok(cuerpo.source === 'lp_lotes_pdc', `source = ${cuerpo.source}`);
}

await navegador.close();

if (fallos.length) {
  console.error('✗ Variante A, autocompletado pre-hidratación:');
  for (const f of fallos) console.error(`  · ${f}`);
  process.exit(1);
}

console.log(`✓ Variante A: el lead sobrevive al autocompletado pre-hidratación (name="${cuerpo.name}").`);
