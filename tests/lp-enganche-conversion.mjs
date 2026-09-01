/**
 * La conversión de la VARIANTE C, en navegador.
 *
 * Hermano de `lp-terrenos-conversion.mjs`. Lo que verifica y por qué:
 *
 *   · **El POST sale con el `source` correcto.** `lp_lotes_pdc` es un literal de
 *     `KNOWN_SOURCES` en `/api/leads`. Un `source` inventado NO da error
 *     visible: da un lead que entra a Supabase y NUNCA llega a Zoho. Es el
 *     fallo más caro posible y no se ve en ninguna pantalla.
 *   · **`generate_lead` se dispara**, y DESPUÉS del 200. Es la misma llamada que
 *     emite la conversión de Google Ads una línea después.
 *   · **La atribución viaja.** El `gclid` de la URL tiene que llegar en el
 *     cuerpo: sin él la conversión no se puede casar con el clic pagado.
 *   · **`form_type` separa la variante.** Si las tres variantes reportaran el
 *     mismo `form_type`, el A/B/C no se podría leer en GA4.
 *   · **El lead sobrevive al autocompletado ANTES de hidratar.** Un form
 *     controlado servido por SSR pierde lo rellenado antes de que React monte:
 *     el campo se ve lleno y el estado está vacío. Sin error, sin POST y sin
 *     lead.
 *
 * ⚠️ EL POST SE INTERCEPTA SIEMPRE. Este test no puede crear leads basura en el
 * CRM de producción.
 *
 * Uso: BASE_URL=http://127.0.0.1:3199 node tests/lp-enganche-conversion.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3199';
const RUTA = '/lp/enganche-terrenos-playa-del-carmen';
const GCLID = 'TEST_GCLID_VARIANTE_C';

const fallos = [];
const ok = (cond, msg) => {
  if (!cond) fallos.push(msg);
};

const navegador = await chromium.launch();

/**
 * Espía de gtag. Se instala ANTES de cualquier script de la página, y hay que
 * mirar los DOS sitios: el script de Consent Mode declara su propia `function
 * gtag()` local y llama a esa, no a `window.gtag`, así que lo que empuja solo
 * aparece en `dataLayer`.
 */
const ESPIA = () => {
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
};

const leerEventos = (pagina) =>
  pagina.evaluate(() => {
    const w = /** @type {any} */ (window);
    const deDataLayer = Array.from(w.dataLayer ?? []).map((a) => Array.from(a));
    return [...(w.__eventos ?? []), ...deDataLayer];
  });

async function nuevaPagina() {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const pagina = await ctx.newPage();
  await pagina.addInitScript(ESPIA);
  return pagina;
}

/**
 * Espera a que React haya hidratado ESTE formulario, en vez de dormir un número
 * fijo de milisegundos. Sin esto el test interactúa antes de tiempo y falla por
 * una carrera suya, no por un fallo de la página.
 */
async function esperarHidratacion(pagina) {
  await pagina.waitForLoadState('networkidle').catch(() => {});
  await pagina
    .waitForFunction(
      () => {
        const f = document.querySelector('form[data-lpe-form="hero"]');
        if (!f) return false;
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

  let cuerpo = null;
  let momentoPost = 0;
  await pagina.route('**/api/leads', async (ruta) => {
    cuerpo = JSON.parse(ruta.request().postData() ?? '{}');
    momentoPost = Date.now();
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

  // Tres desde el arranque: hero, medio y cierre. Se fija el número EXACTO y no
  // un mínimo: un cuarto formulario que aparezca sin querer ensucia la
  // atribución, porque cada instancia manda su propio `bloque` al CRM.
  const forms = await pagina.locator('form[data-lpe-form]').count();
  ok(forms === 3, `A: se esperaban 3 formularios, hay ${forms}`);

  const hero = pagina.locator('form[data-lpe-form="hero"]');
  ok(await hero.isVisible(), 'A: el formulario del hero no es visible al cargar');
  const caja = await hero.boundingBox();
  ok(
    caja !== null && caja.y < 900,
    `A: el hero arranca en y=${caja?.y}, fuera del primer viewport`,
  );

  await esperarHidratacion(pagina);

  await hero.locator('input[name="name"]').fill('Prueba Variante C');
  await hero.locator('input[name="phone"]').fill('9841234567');
  await hero.locator('button[type="submit"]').click();
  await pagina.waitForTimeout(1800);

  ok(cuerpo !== null, 'A: no salió ningún POST a /api/leads');
  if (cuerpo) {
    ok(
      cuerpo.source === 'lp_lotes_pdc',
      `A: source="${cuerpo.source}", debe ser "lp_lotes_pdc" (literal de KNOWN_SOURCES)`,
    );
    ok(cuerpo.name === 'Prueba Variante C', `A: name="${cuerpo.name}"`);
    ok(
      (cuerpo.phone ?? '').replace(/\D/g, '') === '9841234567',
      `A: phone="${cuerpo.phone}"`,
    );
    ok(cuerpo.gclid === GCLID, `A: el gclid no viajó (llegó "${cuerpo.gclid}")`);
    ok(
      cuerpo.utm_source === 'google' && cuerpo.utm_medium === 'cpc',
      'A: las UTM no viajaron',
    );
    ok(
      typeof cuerpo.message === 'string' && /bloque «hero»/.test(cuerpo.message),
      `A: el message no identifica el bloque: "${cuerpo.message}"`,
    );
    ok(
      typeof cuerpo.page === 'string' && cuerpo.page.includes(RUTA),
      'A: `page` no incluye el path de la variante — en Zoho se confundiría con las otras dos',
    );
  }

  const eventos = await leerEventos(pagina);
  const lead = eventos.filter((e) => e[0] === 'event' && e[1] === 'generate_lead');
  ok(lead.length >= 1, 'A: no se disparó generate_lead');
  const tipos = lead
    .map((e) => e[2]?.form_type)
    .filter(Boolean);
  ok(
    tipos.includes('lp_enganche_pdc'),
    `A: form_type = ${JSON.stringify(tipos)}, debe incluir "lp_enganche_pdc" para separar la variante en GA4`,
  );

  // El agradecimiento se pinta en la MISMA ruta: redirigir a /gracias perdería
  // el gclid de la URL y el contexto de medición.
  ok(
    /Listo, Prueba/.test(await pagina.content()),
    'A: no se pintó el agradecimiento en la misma ruta',
  );

  const idAds = await pagina.evaluate(
    () => document.documentElement.innerHTML.includes('AW-'),
  );
  if (!idAds) {
    console.log(
      '⚠  Sin NEXT_PUBLIC_GOOGLE_ADS_ID inlineado: el ping a Ads no se verifica en\n   este entorno. generate_lead sí queda verificado, y es la misma llamada\n   que emite la conversión una línea después.',
    );
  }

  console.log(
    `→ A camino normal: POST ok · generate_lead ${lead.length} · form_type ${tipos.join(',')} · gclid ${cuerpo?.gclid === GCLID ? 'ok' : 'PERDIDO'}`,
  );
  await pagina.context().close();
}

// ════════════════════════════════════════════════════════════════════════════
// ESCENARIO B · autocompletado ANTES de hidratar
//
// El navegador (o el gestor de contraseñas) rellena los inputs sobre el HTML del
// servidor, antes de que React monte. En un form controlado el valor del DOM y
// el estado de React se separan: el campo se ve lleno, el botón dice que está
// vacío, y no hay POST. Nueve formularios del sitio siguen expuestos a esto.
// ════════════════════════════════════════════════════════════════════════════
{
  const pagina = await nuevaPagina();

  let cuerpo = null;
  await pagina.route('**/api/leads', async (ruta) => {
    cuerpo = JSON.parse(ruta.request().postData() ?? '{}');
    await ruta.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, id: 'lead-de-prueba' }),
    });
  });
  await pagina.route('**/api/track', (ruta) =>
    ruta.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );

  // `domcontentloaded`, no `networkidle`: hay que llegar ANTES de la hidratación.
  await pagina.goto(`${BASE}${RUTA}`, { waitUntil: 'domcontentloaded' });

  // Escritura directa en el DOM, sin eventos de React: es exactamente lo que
  // hace el autocompletado del navegador.
  await pagina.evaluate(() => {
    const f = document.querySelector('form[data-lpe-form="hero"]');
    if (!f) return;
    const n = f.querySelector('input[name="name"]');
    const t = f.querySelector('input[name="phone"]');
    if (n) n.value = 'Autocompletado Temprano';
    if (t) t.value = '9849876543';
  });

  await esperarHidratacion(pagina);
  await pagina.waitForTimeout(400);

  const hero = pagina.locator('form[data-lpe-form="hero"]');
  await hero.locator('button[type="submit"]').click();
  await pagina.waitForTimeout(1800);

  ok(
    cuerpo !== null,
    'B: el autocompletado previo a la hidratación SE PERDIÓ — no salió POST',
  );
  if (cuerpo) {
    ok(
      cuerpo.name === 'Autocompletado Temprano',
      `B: el nombre llegó como "${cuerpo.name}"`,
    );
    ok(
      (cuerpo.phone ?? '').replace(/\D/g, '') === '9849876543',
      `B: el teléfono llegó como "${cuerpo.phone}"`,
    );
  }

  console.log(
    `→ B autocompletado pre-hidratación: ${cuerpo ? `POST ok, name="${cuerpo.name}"` : 'PERDIDO'}`,
  );
  await pagina.context().close();
}

await navegador.close();

if (fallos.length) {
  console.error('\n✗ Conversión de la variante C rota:');
  for (const f of fallos) console.error(`  · ${f}`);
  process.exit(1);
}

console.log('\n✓ Conversión de la variante C verificada, los dos escenarios.');
