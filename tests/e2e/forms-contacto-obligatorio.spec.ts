import { test, expect, type Page } from '@playwright/test';

/**
 * Nombre + correo + teléfono son OBLIGATORIOS en todos los formularios de
 * captación, y el teléfono se captura con selector de lada internacional.
 *
 * Qué cubre, y por qué así:
 *
 *  1. Un envío incompleto NO sale al servidor. Se comprueba escuchando las
 *     peticiones, no mirando la pantalla: un form puede pintar un error y
 *     haber mandado el POST igual (fue exactamente el fallo del 29-ago-2026).
 *  2. Un envío completo SÍ sale y el teléfono viaja en E.164. La petición se
 *     intercepta y se responde en falso, así que la suite NO crea leads en
 *     Zoho y puede correr las veces que haga falta.
 *  3. El selector lista países fuera de LATAM y arranca en México.
 *
 *   npx playwright test tests/e2e/forms-contacto-obligatorio.spec.ts
 */

interface CasoForm {
  nombre: string;
  ruta: string;
  /** Selector del <form> concreto: varias páginas montan más de uno. */
  form: string;
  /** Campos de texto a rellenar en el caso «completo», sin el teléfono. */
  rellenar: Array<{ selector: string; valor: string }>;
  /**
   * Se escribe con la lada delante a propósito: el campo ya llega con «+52»
   * puesto, y una persona teclea DETRÁS de ese prefijo. Un `fill()` con el
   * número pelado lo borraría y dejaría un número sin país — que es
   * justamente lo que el selector existe para evitar.
   */
  telefono: string;
  telefonoE164: string;
}

const CASOS: CasoForm[] = [
  {
    nombre: '/contacto',
    ruta: '/es/contacto',
    form: 'form[toolname="enviar_mensaje_contacto"]',
    rellenar: [
      { selector: '#name', valor: 'E2E Prueba' },
      { selector: '#email', valor: 'e2e@example.com' },
      { selector: '#message', valor: 'Mensaje de prueba automatizada, largo suficiente.' },
    ],
    telefono: '+52 984 000 0000',
    telefonoE164: '+529840000000',
  },
  {
    nombre: 'lead magnet del home',
    ruta: '/es',
    form: 'form[toolname="descargar_guia_inversion"]',
    rellenar: [
      { selector: 'input[name="name"]', valor: 'E2E Prueba' },
      { selector: 'input[name="email"]', valor: 'e2e@example.com' },
    ],
    telefono: '+52 984 000 0000',
    telefonoE164: '+529840000000',
  },
];

/** Intercepta /api/leads y devuelve un 200 falso. Nada llega al CRM. */
async function interceptarLeads(page: Page, capturado: { cuerpo: unknown }) {
  await page.route('**/api/leads', async (route) => {
    capturado.cuerpo = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, id: 'e2e-simulado' }),
    });
  });
}

for (const caso of CASOS) {
  test(`@forms ${caso.nombre} — sin teléfono no sale al servidor`, async ({ page }) => {
    const enviados: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/leads') && req.method() === 'POST') enviados.push(req.url());
    });

    await page.goto(caso.ruta);
    const form = page.locator(caso.form);
    await expect(form).toBeVisible();

    // Todo menos el teléfono: es el campo que este cambio vuelve obligatorio.
    for (const campo of caso.rellenar) {
      await form.locator(campo.selector).fill(campo.valor);
    }
    // /contacto tiene además un <select> de asunto obligatorio.
    const asunto = form.locator('select#subject');
    if (await asunto.count()) {
      const valores = await asunto.locator('option').evaluateAll((els) =>
        els.map((o) => (o as HTMLOptionElement).value).filter(Boolean),
      );
      if (valores.length) await asunto.selectOption(valores[0]!);
    }

    await form.locator('button[type="submit"]').click();
    await page.waitForTimeout(1200);

    expect(enviados, 'salió un lead sin teléfono').toEqual([]);
  });

  test(`@forms ${caso.nombre} — completo sale y el teléfono va en E.164`, async ({ page }) => {
    const capturado: { cuerpo: unknown } = { cuerpo: null };
    await interceptarLeads(page, capturado);

    await page.goto(caso.ruta);
    const form = page.locator(caso.form);
    await expect(form).toBeVisible();

    for (const campo of caso.rellenar) {
      await form.locator(campo.selector).fill(campo.valor);
    }
    const asunto = form.locator('select#subject');
    if (await asunto.count()) {
      const valores = await asunto.locator('option').evaluateAll((els) =>
        els.map((o) => (o as HTMLOptionElement).value).filter(Boolean),
      );
      if (valores.length) await asunto.selectOption(valores[0]!);
    }
    await form.locator('input[name="phone"]').fill(caso.telefono);

    await form.locator('button[type="submit"]').click();
    await expect.poll(() => capturado.cuerpo, { timeout: 8000 }).not.toBeNull();

    const cuerpo = capturado.cuerpo as Record<string, unknown>;
    expect(cuerpo.name, 'el nombre no llegó').toBeTruthy();
    expect(cuerpo.email, 'el correo no llegó').toBeTruthy();
    // Lo que ve el asesor en Zoho no depende de cómo lo teclearon: el selector
    // normaliza a E.164 con la lada del país elegido.
    expect(cuerpo.phone).toBe(caso.telefonoE164);
  });

  test(`@forms ${caso.nombre} — el selector de lada es internacional`, async ({ page }) => {
    await page.goto(caso.ruta);
    const form = page.locator(caso.form);
    await expect(form).toBeVisible();

    const selector = form.locator('select.PhoneInputCountrySelect');
    await expect(selector, 'no hay selector de país junto al teléfono').toHaveCount(1);
    // México primero: es el mercado principal y evita que la mayoría lo toque.
    await expect(selector).toHaveValue('MX');

    const paises = await selector.locator('option').evaluateAll((els) =>
      els.map((o) => (o as HTMLOptionElement).value),
    );
    // La lista NO está acotada a América: un comprador español o alemán tiene
    // que poder dejar su número. Antes solo había 22 países.
    for (const pais of ['ES', 'DE', 'FR', 'GB', 'JP']) {
      expect(paises, `falta ${pais} en el selector`).toContain(pais);
    }
    // Un solo separador: la librería le pone `key: '|'` a todos, y dos dividers
    // son dos hijos de React con la misma key.
    expect(paises.filter((p) => p === '|').length).toBe(1);
  });
}

test('@forms el teléfono cambia de lada al elegir otro país', async ({ page }) => {
  const capturado: { cuerpo: unknown } = { cuerpo: null };
  await interceptarLeads(page, capturado);

  await page.goto('/es');
  const form = page.locator('form[toolname="descargar_guia_inversion"]');
  await expect(form).toBeVisible();

  await form.locator('input[name="name"]').fill('E2E España');
  await form.locator('input[name="email"]').fill('e2e-es@example.com');
  await form.locator('select.PhoneInputCountrySelect').selectOption('ES');
  // Elegir país reescribe el prefijo del input: pasa de «+52» a «+34».
  await expect(form.locator('input[name="phone"]')).toHaveValue('+34');
  await form.locator('input[name="phone"]').fill('+34 612 345 678');

  await form.locator('button[type="submit"]').click();
  await expect.poll(() => capturado.cuerpo, { timeout: 8000 }).not.toBeNull();

  const cuerpo = capturado.cuerpo as Record<string, unknown>;
  expect(cuerpo.phone, 'la lada de España no se aplicó').toBe('+34612345678');
});
