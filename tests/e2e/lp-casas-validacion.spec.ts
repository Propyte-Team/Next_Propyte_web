import { test, expect } from '@playwright/test';

/**
 * Regresión del 29-ago-2026 — las DOS landings de casas.
 *
 * Un clic pagado de Google Ads en inglés envió `/lp/homes-riviera-maya` con
 * nombre, WhatsApp y correo vacíos. El `<form>` llevaba `noValidate`, así que
 * los `required` no frenaban nada; `enviar()` no comprobaba nada; y el esquema
 * del endpoint acepta los tres campos vacíos a propósito. El lead aterrizó en
 * Zoho como «Anónimo», sin manera de contactarlo, y al visitante se le mostró
 * la pantalla de éxito.
 *
 * A diferencia de `zoho-forms.spec.ts`, esta suite NO crea leads: lo que
 * comprueba es justamente que la petición no salga. Por eso puede correr contra
 * producción sin ensuciar el CRM.
 *
 *   npx playwright test tests/e2e/lp-casas-validacion.spec.ts
 */

const LANDINGS = [
  { ruta: '/lp/casas-riviera-maya', idioma: 'es' },
  { ruta: '/lp/homes-riviera-maya', idioma: 'en' },
] as const;

for (const { ruta, idioma } of LANDINGS) {
  test(`@lp-casas ${idioma} — un envío vacío no llega a /api/leads`, async ({ page }) => {
    const enviados: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/leads') && req.method() === 'POST') {
        enviados.push(req.url());
      }
    });

    await page.goto(ruta);

    const form = page.locator('form[data-lpc-form="hero"]');
    await expect(form).toBeVisible();

    // Elegir casa reproduce el envío real: el visitante SÍ había seleccionado
    // «Casa 2 Recámaras en Preventa | Comunidad Privada» antes de enviar.
    const select = form.locator('select[name="propertySlug"]');
    const opciones = await select.locator('option').evaluateAll((els) =>
      els.map((o) => (o as HTMLOptionElement).value).filter(Boolean),
    );
    if (opciones.length > 0) await select.selectOption(opciones[0]!);

    await form.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    expect(
      enviados,
      'un formulario con los tres campos vacíos salió al servidor',
    ).toEqual([]);

    // Los tres campos siguen siendo `required`. OJO: esto NO detecta que vuelva
    // el `noValidate` — `:invalid` aplica igual, porque `noValidate` solo apaga
    // el BLOQUEO del envío, no la evaluación de la restricción. Se comprobó
    // revirtiendo el arreglo: quien atrapa la regresión es el assert de arriba.
    expect(
      await form.locator('input:invalid').count(),
      'los campos dejaron de ser required',
    ).toBeGreaterThan(0);

    // Y sobre todo: NO se le miente al visitante con la pantalla de éxito.
    await expect(page.locator('[data-lpc-estado="enviado"]')).toHaveCount(0);
  });

  test(`@lp-casas ${idioma} — un envío completo SÍ sale, y con los tres campos`, async ({
    page,
  }) => {
    // La contraparte del test de arriba: la guardia no debe frenar lo bueno.
    // Cambió cómo se arma el payload (ahora se lee del DOM, no del estado), así
    // que se verifica el CUERPO, no solo que la petición salga.
    let cuerpo: Record<string, unknown> | null = null;

    await page.route('**/api/leads', async (route) => {
      cuerpo = route.request().postDataJSON();
      // Se responde en falso: el CRM no debe recibir leads de prueba.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, id: 'e2e-simulado' }),
      });
    });

    await page.goto(ruta);
    const form = page.locator('form[data-lpc-form="hero"]');
    await expect(form).toBeVisible();

    await form.locator('input[name="name"]').fill('E2E Prueba');
    await form.locator('input[name="phone"]').fill('+52 984 000 0000');
    await form.locator('input[name="email"]').fill('e2e@example.com');
    // El selector de lada arranca en México: es el mercado principal.
    await expect(form.locator('select.PhoneInputCountrySelect')).toHaveValue('MX');
    await form.locator('button[type="submit"]').click();

    await expect(page.locator('[data-lpc-estado="enviado"]')).toBeVisible();

    expect(cuerpo, 'no salió ninguna petición').not.toBeNull();
    expect(cuerpo!.name).toBe('E2E Prueba');
    expect(cuerpo!.email).toBe('e2e@example.com');
    // El selector normaliza a E.164 antes de mandar: lo que ve el asesor en
    // Zoho no depende de cómo lo haya tecleado el visitante.
    expect(cuerpo!.phone).toBe('+529840000000');
    // `whatsapp` es el que field-maps mapea a Mobile en Zoho.
    expect(cuerpo!.whatsapp).toBe('+529840000000');
  });
}
