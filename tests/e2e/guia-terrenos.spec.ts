import { test, expect, type Page } from '@playwright/test';

/**
 * Formulario de cierre de la guía de terrenos residenciales
 * (`/{locale}/guias/terrenos-residenciales`), componente `GuiaTerrenosForm`.
 *
 * Mismo patrón que `forms-todos-obligatorio.spec.ts`: `/api/leads` se
 * intercepta SIEMPRE, incluso en el caso «incompleto» donde no debería salir
 * petición — porque si el guardia del formulario se rompe, la petición sale
 * de verdad y ensucia el CRM con un lead de prueba. Cero leads creados por
 * esta suite: los dos casos (incompleto y completo) quedan cubiertos por la
 * misma intercepción.
 *
 *   npx playwright test tests/e2e/guia-terrenos.spec.ts
 */

const RUTA = '/es/guias/terrenos-residenciales';
const TELEFONO = '+52 984 000 0000';

/** Intercepta /api/leads. Devuelve el registro de lo que se intentó enviar. */
async function interceptar(page: Page) {
  const registro: { cuerpos: Record<string, unknown>[] } = { cuerpos: [] };
  await page.route('**/api/leads', async (route) => {
    registro.cuerpos.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, id: 'e2e-simulado' }),
    });
  });
  return registro;
}

/** Pulsa «enviar» dejando antes que el layout se asiente (ver forms-todos-obligatorio.spec.ts). */
async function enviar(page: Page) {
  const boton = page.locator('form:has(.PhoneInput) button[type="submit"]');
  await boton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await boton.click();
}

test.describe('@guia-terrenos formulario de la guía de terrenos residenciales', () => {
  test('incompleto (solo nombre) NO sale y se ve el error de campo requerido', async ({ page }) => {
    const registro = await interceptar(page);
    await page.goto(RUTA);

    const form = page.locator('form:has(.PhoneInput)');
    await expect(form, 'no se encontró el formulario con teléfono').toBeVisible();

    await form.locator('#guia-name').fill('Prueba E2E');
    // Email y teléfono se dejan vacíos a propósito.
    await enviar(page);
    await page.waitForTimeout(1500);

    expect(registro.cuerpos, 'salió un lead incompleto desde la guía de terrenos').toEqual([]);

    // El teléfono vacío siempre renderiza el mensaje "required" (ver
    // GuiaTerrenosForm.tsx: solo cae a "invalidPhone" cuando el error trae
    // ese código; vacío dispara el `min(1, 'required')` de zod).
    await expect(page.locator('#guia-phone-error')).toBeVisible();
  });

  test('completo (nombre, correo, teléfono) SÍ sale con source guia_terrenos y phone en E.164', async ({ page }) => {
    const registro = await interceptar(page);
    await page.goto(RUTA);

    const form = page.locator('form:has(.PhoneInput)');
    await form.locator('#guia-name').fill('Prueba E2E');
    await form.locator('#guia-email').fill('e2e@example.com');
    // El campo ya trae «+52» puesto; se teclea detrás, como una persona real.
    await form.locator('.PhoneInput input').fill(TELEFONO);
    await enviar(page);

    await expect
      .poll(() => registro.cuerpos.length, { timeout: 10000 })
      .toBeGreaterThan(0);

    const cuerpo = registro.cuerpos[0]!;
    expect(cuerpo.source, 'el source no fue guia_terrenos').toBe('guia_terrenos');
    expect(cuerpo.name, 'el nombre no llegó').toBeTruthy();
    expect(cuerpo.email, 'el correo no llegó').toBeTruthy();
    expect(typeof cuerpo.phone === 'string' && cuerpo.phone.startsWith('+'), `phone no vino en E.164: ${cuerpo.phone}`).toBe(true);
  });

  test('tras el envío exitoso aparece el bloque de agradecimiento (con o sin agenda)', async ({ page }) => {
    await interceptar(page);
    await page.goto(RUTA);

    const form = page.locator('form:has(.PhoneInput)');
    await form.locator('#guia-name').fill('Prueba E2E');
    await form.locator('#guia-email').fill('e2e@example.com');
    await form.locator('.PhoneInput input').fill(TELEFONO);
    await enviar(page);

    const gracias = page.getByTestId('guia-terrenos-gracias');
    await expect(gracias).toBeVisible();

    // La agenda SOLO existe cuando `NEXT_PUBLIC_GUIA_TERRENOS_AGENDA_URL` está
    // configurada (ver GuiaTerrenosForm.tsx), y en este entorno de prueba no lo
    // está. Así que no se afirma su presencia: solo que, SI aparece, cumpla su
    // contrato. El bloque de agradecimiento es lo único que se exige siempre.
    //
    // Desde el 2026-09-02 la agenda va en una CAPA con el scroll del body
    // bloqueado, no dentro del bloque de gracias: en línea, la rueda sobre el
    // calendario movía la página 250 px por gesto. Ver AgendaModal.tsx.
    const capa = page.getByTestId('guia-terrenos-agenda-modal');
    if ((await capa.count()) > 0) {
      await expect(capa).toBeVisible();
      await expect(capa).toHaveAttribute('aria-modal', 'true');
      await expect(capa.locator('iframe')).toBeVisible();

      // Lo que de verdad pidió Luis: la página no se mueve detrás.
      expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');

      // Y Escape la cierra devolviendo el scroll, o el visitante queda atrapado.
      await page.keyboard.press('Escape');
      await expect(capa).toHaveCount(0);
      expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');

      // El botón de reabrir tiene que estar: el lead ya entró y no puede
      // volver a llenar el formulario para elegir horario.
      await expect(gracias.locator('button')).toBeVisible();
    }
  });
});
