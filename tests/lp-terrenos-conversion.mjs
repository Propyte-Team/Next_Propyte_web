/**
 * Prueba de punta a punta de la CONVERSIÓN de /lp/terrenos-playa-del-carmen.
 *
 * El contrato de marcado lo fija `lp-terrenos-form.mjs` sobre el HTML del
 * servidor. Esto es lo otro: que al pulsar enviar salga el POST correcto hacia
 * el endpoint que alimenta Zoho, y que se dispare el evento que alimenta Ads.
 *
 * ⚠️ EL POST SE INTERCEPTA. No se deja llegar a `/api/leads` a propósito: cada
 * corrida crearía una fila en Supabase y un lead basura en el CRM de
 * producción. Lo que se verifica aquí es el CONTRATO DEL CLIENTE —qué se manda
 * y con qué forma—, que es justo la parte que vive en esta landing. Que el
 * endpoint mapee `lp_lotes_pdc` a Zoho es responsabilidad de `/api/leads`, ya
 * probada y compartida con la otra landing.
 *
 * Uso:
 *   BASE_URL=http://127.0.0.1:3210 node tests/lp-terrenos-conversion.mjs
 */
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3210';
const RUTA = '/lp/terrenos-playa-del-carmen';
const GCLID = 'TEST_GCLID_VERIFICACION';

const fallos = [];
const ok = (cond, msg) => {
  if (!cond) fallos.push(msg);
};

const navegador = await chromium.launch();
const contexto = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
const pagina = await contexto.newPage();

// ── Espía de gtag ───────────────────────────────────────────────────────────
// Se instala ANTES de cualquier script de la página. `Analytics` define su
// propio `window.gtag`, así que el espía envuelve lo que haya y registra todo
// en un array que luego se lee desde node.
await pagina.addInitScript(() => {
  const w = /** @type {any} */ (window);
  w.__eventos = [];
  const espia = (...args) => {
    w.__eventos.push(args);
  };
  Object.defineProperty(w, 'gtag', {
    configurable: true,
    get: () => espia,
    set: () => {},
  });
});

// ── Intercepción del POST del lead ──────────────────────────────────────────
let cuerpoLead = null;
await pagina.route('**/api/leads', async (ruta) => {
  cuerpoLead = JSON.parse(ruta.request().postData() ?? '{}');
  await ruta.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, id: 'lead-de-prueba' }),
  });
});
// `/api/track` también se corta: es el espejo de Meta y no toca a este test.
await pagina.route('**/api/track', (ruta) =>
  ruta.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
);

const url = `${BASE}${RUTA}?gclid=${GCLID}&utm_source=google&utm_medium=cpc&utm_campaign=lotes-pdc`;
const respuesta = await pagina.goto(url, { waitUntil: 'domcontentloaded' });
ok(respuesta?.status() === 200, `la página respondió ${respuesta?.status()}`);

// ── El formulario existe y es usable sin contestar nada antes ───────────────
const formularios = await pagina.locator('form[data-lpt-form]').count();
ok(formularios === 2, `se esperaban 2 formularios, hay ${formularios}`);

const hero = pagina.locator('form[data-lpt-form="hero"]');
ok(await hero.isVisible(), 'el formulario del hero no es visible al cargar');

// Está DENTRO del primer viewport: es la premisa de la variante corta.
const caja = await hero.boundingBox();
ok(caja !== null && caja.y < 900, `el formulario del hero arranca en y=${caja?.y}, fuera del primer viewport`);

// ── Consentimiento: sin él la conversión de Ads no se atribuye ──────────────
const aceptar = pagina.getByRole('button', { name: /aceptar/i }).first();
if (await aceptar.count()) {
  await aceptar.click();
  await pagina.waitForTimeout(250);
}

// ── Envío ───────────────────────────────────────────────────────────────────
await hero.locator('input[name="name"]').fill('Prueba Verificacion');
await hero.locator('input[name="phone"]').fill('9841234567');
await hero.locator('button[type="submit"]').click();

await pagina.waitForFunction(() => document.querySelector('[data-lpt-form="hero"]')?.tagName !== 'FORM', null, {
  timeout: 8000,
}).catch(() => {});

// ── 1 · Lo que viaja hacia Zoho ─────────────────────────────────────────────
ok(cuerpoLead !== null, 'no se envió ningún POST a /api/leads');
if (cuerpoLead) {
  // `source` es el literal de KNOWN_SOURCES que engancha el mapa de Zoho.
  // Si esto cambia, el lead entra a Supabase y NO llega al CRM.
  ok(cuerpoLead.source === 'lp_lotes_pdc', `source = ${cuerpoLead.source}, se esperaba lp_lotes_pdc`);
  ok(cuerpoLead.name === 'Prueba Verificacion', `name = ${cuerpoLead.name}`);
  ok(cuerpoLead.phone === '9841234567', `phone = ${cuerpoLead.phone}`);
  ok(cuerpoLead.whatsapp === '9841234567', `whatsapp = ${cuerpoLead.whatsapp}`);
  ok(cuerpoLead.website === '', `el honeypot viajó con valor: ${cuerpoLead.website}`);
  // Atribución: sin gclid, Ads no puede casar el lead con el clic que lo pagó.
  ok(cuerpoLead.gclid === GCLID, `gclid = ${cuerpoLead.gclid}, se esperaba ${GCLID}`);
  ok(cuerpoLead.utm_source === 'google', `utm_source = ${cuerpoLead.utm_source}`);
  ok(cuerpoLead.utm_campaign === 'lotes-pdc', `utm_campaign = ${cuerpoLead.utm_campaign}`);
  // `page` se mapea a Nombre_anuncio en Zoho: es lo que separa esta variante
  // de la larga dentro del CRM.
  ok(
    typeof cuerpoLead.page === 'string' && cuerpoLead.page.includes(RUTA),
    `page = ${cuerpoLead.page}`,
  );
  ok(
    typeof cuerpoLead.message === 'string' && /\d+ meses/.test(cuerpoLead.message),
    `el mensaje no lleva el plazo elegido: ${cuerpoLead.message}`,
  );
}

// ── 2 · Lo que viaja hacia Google ───────────────────────────────────────────
const eventos = await pagina.evaluate(() => /** @type {any} */ (window).__eventos ?? []);
const porNombre = (n) => eventos.filter((e) => e[0] === 'event' && e[1] === n);

const generateLead = porNombre('generate_lead');
ok(generateLead.length === 1, `generate_lead se disparó ${generateLead.length} veces, se esperaba 1`);
if (generateLead[0]) {
  ok(
    generateLead[0][2]?.form_type === 'lp_terrenos_pdc',
    `form_type = ${generateLead[0][2]?.form_type}, se esperaba lp_terrenos_pdc`,
  );
}

// ── Capacidad del entorno, leída de la PÁGINA y no de process.env ───────────
//
// Las variables `NEXT_PUBLIC_*` se inlinean en el bundle EN TIEMPO DE BUILD, así
// que `process.env` visto desde node no dice nada sobre lo que la página
// realmente lleva dentro. Preguntárselo a node daría un chequeo que miente en
// verde: se saltaría la comprobación creyendo que no aplica, aun cuando la
// página sí trae el tag. La capacidad se detecta en el HTML servido.
const html = await pagina.content();
const gaArmado = html.includes('ga4-consent-default');
const adsArmado = /AW-\w+/.test(html);

// La conversión de Ads es un evento SEPARADO, etiquetado con send_to. GA4 lo
// ignora; Ads solo registra los que lo llevan.
const conversion = porNombre('conversion');
if (adsArmado) {
  ok(conversion.length === 1, `conversion se disparó ${conversion.length} veces, se esperaba 1`);
  ok(
    typeof conversion[0]?.[2]?.send_to === 'string' && conversion[0][2].send_to.startsWith('AW-'),
    `send_to = ${conversion[0]?.[2]?.send_to}, se esperaba una etiqueta AW-`,
  );
} else {
  // Sin etiqueta inlineada, `sendAdsConversion` sale temprano A PROPÓSITO: el
  // sitio nunca manda una conversión a una etiqueta vacía. Se REPORTA, no se da
  // por bueno en silencio.
  console.log(
    '⚠  Este build no lleva NEXT_PUBLIC_GOOGLE_ADS_ID inlineado, así que el ping a\n' +
      '   Ads no puede verificarse aquí. Lo que sí queda verificado es que\n' +
      '   generate_lead se dispara: es la MISMA llamada que emite la conversión,\n' +
      '   una línea después. Correr este test contra producción cierra el hueco.',
  );
}

// ── 3 · Consent Mode: el estado por defecto tiene que ser denegado ──────────
if (gaArmado) {
  const consentDefault = eventos.find((e) => e[0] === 'consent' && e[1] === 'default');
  ok(consentDefault !== undefined, 'hay tag de GA4 pero no se declaró un consent default');
  if (consentDefault) {
    ok(
      consentDefault[2]?.ad_storage === 'denied',
      `ad_storage por defecto = ${consentDefault[2]?.ad_storage}, se esperaba denied`,
    );
  }
} else {
  console.log(
    '⚠  Este build no lleva NEXT_PUBLIC_GA4_ID inlineado: Consent Mode v2 no se\n' +
      '   monta y no puede verificarse aquí.',
  );
}

await navegador.close();

if (fallos.length) {
  console.error('✗ Conversión de la LP corta rota:');
  for (const f of fallos) console.error(`  · ${f}`);
  process.exit(1);
}

// El resumen enumera SOLO lo que se comprobó de verdad. Una línea fija que
// afirme haber verificado algo que se saltó por falta de entorno es
// exactamente cómo un chequeo pasa a mentir en verde.
console.log('✓ Conversión verificada en navegador:');
console.log('  · POST a /api/leads con source=lp_lotes_pdc, gclid, utm y page correctos');
console.log('  · generate_lead disparado una vez con form_type=lp_terrenos_pdc');
console.log(`  · ${adsArmado ? 'conversion con send_to AW- disparada' : 'ping a Ads NO verificado en este entorno'}`);
console.log(`  · ${gaArmado ? 'Consent Mode v2 arranca en ad_storage=denied' : 'Consent Mode NO verificado en este entorno'}`);
