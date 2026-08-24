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
 * y con qué forma—, que es justo la parte que vive en esta landing.
 *
 * DOS ESCENARIOS, y el segundo es el que importa:
 *
 *   A · Camino normal. Se espera a que hidrate, se rellena y se envía.
 *   B · Autocompletado antes de hidratar. Ver el bloque del escenario B: es una
 *       regresión que ya se midió en producción y que no daba ni error ni POST.
 *
 * Uso:
 *   BASE_URL=http://127.0.0.1:3211 node tests/lp-terrenos-conversion.mjs
 *   BASE_URL=https://propyte.com   node tests/lp-terrenos-conversion.mjs
 */
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3211';
const RUTA = '/lp/terrenos-playa-del-carmen';
const GCLID = 'TEST_GCLID_VERIFICACION';

const fallos = [];
const ok = (cond, msg) => {
  if (!cond) fallos.push(msg);
};

const navegador = await chromium.launch();

/**
 * Espía de gtag y de dataLayer.
 *
 * Se instala ANTES de cualquier script de la página. Hay que mirar los DOS
 * sitios: el script de Consent Mode declara su propia `function gtag()` local y
 * llama a esa, no a `window.gtag`, así que el consent default NUNCA pasa por el
 * espía —solo aparece empujado a `dataLayer`—. Espiar solo `window.gtag` daba
 * un fallo falso contra producción.
 */
const ESPIA = () => {
  const w = /** @type {any} */ (window);
  w.__eventos = [];
  const espia = (...args) => {
    w.__eventos.push(args);
  };
  Object.defineProperty(w, 'gtag', { configurable: true, get: () => espia, set: () => {} });
};

/** Une lo que vio el espía con lo que se empujó a dataLayer, sin duplicar. */
const leerEventos = (pagina) =>
  pagina.evaluate(() => {
    const w = /** @type {any} */ (window);
    const deDataLayer = Array.from(w.dataLayer ?? []).map((a) => Array.from(a));
    return [...(w.__eventos ?? []), ...deDataLayer];
  });

async function nuevaPagina() {
  const contexto = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const pagina = await contexto.newPage();
  await pagina.addInitScript(ESPIA);
  return pagina;
}

/**
 * Espera a que React haya hidratado ESTE formulario, en vez de dormir un número
 * fijo de milisegundos. Se detecta por el efecto de montaje del componente, que
 * marca el nodo. Sin esto el test interactúa antes de tiempo y falla por una
 * carrera suya, no por un fallo de la página: pasó contra producción.
 */
async function esperarHidratacion(pagina) {
  await pagina.waitForLoadState('networkidle').catch(() => {});
  await pagina
    .waitForFunction(
      () => {
        const f = document.querySelector('form[data-lpt-form="hero"]');
        if (!f) return false;
        // React adjunta sus props internas al nodo al hidratar.
        return Object.keys(f).some((k) => k.startsWith('__react'));
      },
      null,
      { timeout: 20000 },
    )
    .catch(() => {});
}

// ════════════════════════════════════════════════════════════════════════════
// ESCENARIO A · camino normal
// ════════════════════════════════════════════════════════════════════════════
{
  const pagina = await nuevaPagina();

  let cuerpoLead = null;
  await pagina.route('**/api/leads', async (ruta) => {
    cuerpoLead = JSON.parse(ruta.request().postData() ?? '{}');
    await ruta.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, id: 'lead-de-prueba' }),
    });
  });
  await pagina.route('**/api/track', (ruta) =>
    ruta.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );

  const url = `${BASE}${RUTA}?gclid=${GCLID}&utm_source=google&utm_medium=cpc&utm_campaign=lotes-pdc`;
  const respuesta = await pagina.goto(url, { waitUntil: 'domcontentloaded' });
  ok(respuesta?.status() === 200, `A: la página respondió ${respuesta?.status()}`);

  const formularios = await pagina.locator('form[data-lpt-form]').count();
  ok(formularios === 2, `A: se esperaban 2 formularios, hay ${formularios}`);

  const hero = pagina.locator('form[data-lpt-form="hero"]');
  ok(await hero.isVisible(), 'A: el formulario del hero no es visible al cargar');

  const caja = await hero.boundingBox();
  ok(caja !== null && caja.y < 900, `A: el hero arranca en y=${caja?.y}, fuera del primer viewport`);

  await esperarHidratacion(pagina);

  // Sin consentimiento la conversión de Ads no se atribuye.
  const aceptar = pagina.getByRole('button', { name: /aceptar/i }).first();
  if (await aceptar.count()) {
    await aceptar.click();
    await pagina.waitForTimeout(300);
  }

  await hero.locator('input[name="name"]').fill('Prueba Verificacion');
  await hero.locator('input[name="phone"]').fill('9841234567');
  await hero.locator('button[type="submit"]').click();
  await pagina.waitForTimeout(2500);

  // ── Lo que viaja hacia Zoho ──
  ok(cuerpoLead !== null, 'A: no se envió ningún POST a /api/leads');
  if (cuerpoLead) {
    // Literal de KNOWN_SOURCES. Si cambia, el lead entra a Supabase y NO llega
    // al CRM.
    ok(cuerpoLead.source === 'lp_lotes_pdc', `A: source = ${cuerpoLead.source}`);
    ok(cuerpoLead.name === 'Prueba Verificacion', `A: name = ${cuerpoLead.name}`);
    ok(cuerpoLead.phone === '9841234567', `A: phone = ${cuerpoLead.phone}`);
    ok(cuerpoLead.whatsapp === '9841234567', `A: whatsapp = ${cuerpoLead.whatsapp}`);
    ok(cuerpoLead.website === '', `A: el honeypot viajó con valor: ${cuerpoLead.website}`);
    ok(cuerpoLead.gclid === GCLID, `A: gclid = ${cuerpoLead.gclid}`);
    ok(cuerpoLead.utm_source === 'google', `A: utm_source = ${cuerpoLead.utm_source}`);
    ok(cuerpoLead.utm_campaign === 'lotes-pdc', `A: utm_campaign = ${cuerpoLead.utm_campaign}`);
    // `page` se mapea a Nombre_anuncio en Zoho: separa esta variante de la larga.
    ok(
      typeof cuerpoLead.page === 'string' && cuerpoLead.page.includes(RUTA),
      `A: page = ${cuerpoLead.page}`,
    );
    ok(
      typeof cuerpoLead.message === 'string' && /\d+ meses/.test(cuerpoLead.message),
      `A: el mensaje no lleva el plazo: ${cuerpoLead.message}`,
    );
  }

  // ── Lo que viaja hacia Google ──
  const eventos = await leerEventos(pagina);
  const porNombre = (n) => eventos.filter((e) => e[0] === 'event' && e[1] === n);

  const generateLead = porNombre('generate_lead');
  ok(generateLead.length === 1, `A: generate_lead se disparó ${generateLead.length} veces`);
  if (generateLead[0]) {
    ok(
      generateLead[0][2]?.form_type === 'lp_terrenos_pdc',
      `A: form_type = ${generateLead[0][2]?.form_type}`,
    );
  }

  // La capacidad se detecta en el HTML servido, no en process.env: las
  // NEXT_PUBLIC_* se inlinean en tiempo de build, así que process.env visto
  // desde node no dice nada de lo que la página lleva dentro.
  const html = await pagina.content();
  const gaArmado = html.includes('ga4-consent-default');
  const adsArmado = /AW-\w+/.test(html);

  const conversion = porNombre('conversion');
  if (adsArmado) {
    ok(conversion.length === 1, `A: conversion se disparó ${conversion.length} veces`);
    ok(
      typeof conversion[0]?.[2]?.send_to === 'string' &&
        conversion[0][2].send_to.startsWith('AW-'),
      `A: send_to = ${conversion[0]?.[2]?.send_to}, se esperaba una etiqueta AW-`,
    );
  } else {
    console.log(
      '⚠  Sin NEXT_PUBLIC_GOOGLE_ADS_ID inlineado: el ping a Ads no se verifica en\n' +
        '   este entorno. generate_lead sí queda verificado, y es la misma llamada\n' +
        '   que emite la conversión una línea después.',
    );
  }

  if (gaArmado) {
    const consentDefault = eventos.find((e) => e[0] === 'consent' && e[1] === 'default');
    ok(consentDefault !== undefined, 'A: hay tag de GA4 pero no se declaró consent default');
    if (consentDefault) {
      ok(
        consentDefault[2]?.ad_storage === 'denied',
        `A: ad_storage por defecto = ${consentDefault[2]?.ad_storage}`,
      );
    }
  } else {
    console.log('⚠  Sin NEXT_PUBLIC_GA4_ID inlineado: Consent Mode no se verifica aquí.');
  }

  console.log(
    `→ A camino normal: POST ${cuerpoLead ? 'ok' : 'FALTA'} · generate_lead ${generateLead.length} · ` +
      `Ads ${adsArmado ? (conversion.length === 1 ? 'ok' : 'FALTA') : 'n/d'} · ` +
      `consent ${gaArmado ? 'ok' : 'n/d'}`,
  );

  await pagina.context().close();
}

// ════════════════════════════════════════════════════════════════════════════
// ESCENARIO B · autocompletado ANTES de hidratar
//
// Regresión medida contra producción el 2026-08-21. El HTML del servidor pinta
// el formulario a los ~600 ms y React no hidrata hasta ~2.2 s. Quien rellena en
// esa ventana deja su texto en el DOM, pero el estado de React sigue vacío: al
// enviar, la página responde «Falta tu nombre o tu WhatsApp» CON LOS CAMPOS
// VISIBLEMENTE LLENOS, y no sale ningún POST. Ni error de consola, ni lead.
//
// Aquí se simula el caso más duro y más común: el autocompletado del navegador,
// que escribe `.value` directamente SIN disparar el `onChange` que React
// escucha. Rellenar con `fill()` sería más benévolo.
// ════════════════════════════════════════════════════════════════════════════
{
  const pagina = await nuevaPagina();

  let cuerpoLead = null;
  await pagina.route('**/api/leads', async (ruta) => {
    cuerpoLead = JSON.parse(ruta.request().postData() ?? '{}');
    await ruta.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
  await pagina.route('**/api/track', (ruta) =>
    ruta.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );

  await pagina.goto(`${BASE}${RUTA}`, { waitUntil: 'domcontentloaded' });

  // Rellenado crudo, como el autocompletado: sin eventos.
  await pagina.evaluate(() => {
    const f = document.querySelector('form[data-lpt-form="hero"]');
    if (!f) return;
    const n = f.querySelector('input[name="name"]');
    const t = f.querySelector('input[name="phone"]');
    if (n) n.value = 'Autocompletado Temprano';
    if (t) t.value = '9847654321';
  });

  await esperarHidratacion(pagina);
  await pagina.waitForTimeout(600);

  const hero = pagina.locator('form[data-lpt-form="hero"]');
  const aceptar = pagina.getByRole('button', { name: /aceptar/i }).first();
  if (await aceptar.count()) {
    await aceptar.click();
    await pagina.waitForTimeout(200);
  }

  await hero.locator('button[type="submit"]').click();
  await pagina.waitForTimeout(2500);

  ok(
    cuerpoLead !== null,
    'B: se rellenó antes de hidratar y NO salió POST — el lead se pierde en silencio',
  );
  if (cuerpoLead) {
    ok(
      cuerpoLead.name === 'Autocompletado Temprano',
      `B: name = "${cuerpoLead.name}", se esperaba lo que ya estaba en el DOM`,
    );
    ok(cuerpoLead.phone === '9847654321', `B: phone = "${cuerpoLead.phone}"`);
  }

  console.log(
    `→ B autocompletado pre-hidratación: ${cuerpoLead ? `POST ok, name="${cuerpoLead.name}"` : 'SIN POST'}`,
  );

  await pagina.context().close();
}

await navegador.close();

if (fallos.length) {
  console.error('\n✗ Conversión de la LP corta rota:');
  for (const f of fallos) console.error(`  · ${f}`);
  process.exit(1);
}

console.log('\n✓ Conversión verificada en navegador, los dos escenarios.');
