import { test, expect, type Page } from '@playwright/test';

/**
 * E2E suite: cada uno de los 11 formularios web debe (a) submittear sin error visible
 * y (b) recibir 200 OK del endpoint /api/leads (el endpoint persiste + push a Zoho).
 *
 * Corre contra staging:
 *   PLAYWRIGHT_BASE_URL=https://dev.propyte.com npx playwright test tests/e2e/zoho-forms.spec.ts
 *
 * Workers=1 (config global) — rate limit del endpoint es 5/min/IP.
 * Pausa de 13s entre tests para mantenerse bajo el límite.
 */

const TS = Date.now();
const RATE_LIMIT_PAUSE_MS = 13_000;

const sampleEmail = (formNum: number, locale: 'es' | 'en') =>
  `test+${TS}_F${formNum}_${locale}@propyte.com`;

const sampleName = (formNum: number, route: string) => `TEST_${formNum}_${route}`;

const sampleMessage = (formNum: number, locale: 'es' | 'en') =>
  locale === 'es'
    ? `[E2E] Mensaje automatizado — Form ${formNum}. Ignorar. ts=${TS}`
    : `[E2E] Automated message — Form ${formNum}. Please ignore. ts=${TS}`;

const samplePhone = '+52 55 1234 5678';

/**
 * Click submit + esperar respuesta del endpoint /api/leads.
 * Verifica HTTP status real — más robusto que buscar texto de éxito.
 */
async function submitAndExpectLeadOk(
  page: Page,
  clickFn: () => Promise<void>,
): Promise<void> {
  const responsePromise = page.waitForResponse(
    (resp) =>
      resp.url().includes('/api/leads') && resp.request().method() === 'POST',
    { timeout: 20_000 },
  );
  await clickFn();
  const response = await responsePromise;
  expect(
    response.status(),
    `POST /api/leads returned ${response.status()} — body: ${await response.text().catch(() => '?')}`,
  ).toBe(200);
}

/** Selecciona la primera opción no-vacía de un select. */
async function pickFirstOption(page: Page, selector: string) {
  const sel = page.locator(selector).first();
  if (await sel.count() === 0) return;
  const opts = await sel.locator('option').evaluateAll((els) =>
    els.map((o) => (o as HTMLOptionElement).value).filter((v) => v && v !== ''),
  );
  if (opts.length > 0) await sel.selectOption(opts[0]!);
}

test.afterEach(async () => {
  await new Promise((r) => setTimeout(r, RATE_LIMIT_PAUSE_MS));
});

for (const locale of ['es', 'en'] as const) {
  test.describe(`@zoho-forms ${locale.toUpperCase()}`, () => {

    // ============================================================
    // Form 1 — Contacto general (/contacto)
    // ============================================================
    test(`F1 contacto — ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/contacto`, { waitUntil: 'networkidle' });
      await page.getByLabel(/nombre|name/i).first().fill(sampleName(1, `/${locale}/contacto`));
      await page.getByLabel(/email|correo/i).first().fill(sampleEmail(1, locale));
      await pickFirstOption(page, 'select');
      await page.getByLabel(/mensaje|message/i).first().fill(sampleMessage(1, locale));

      await submitAndExpectLeadOk(page, () =>
        page.getByRole('button', { name: /enviar|send|submit/i }).first().click(),
      );
    });

    // ============================================================
    // Form 2 — Property inquiry (ficha)
    // ============================================================
    test(`F2 property_inquiry — ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/propiedades`, { waitUntil: 'networkidle' });
      const firstProperty = page.locator('a[href*="/propiedades/"]').first();
      const href = await firstProperty.getAttribute('href');
      test.skip(!href, 'No hay propiedades publicadas — skip');

      await page.goto(href!, { waitUntil: 'networkidle' });

      // El form vive dentro del detalle — encuéntralo por el input email primero
      const emailInput = page.getByLabel(/email|correo/i).first();
      await emailInput.scrollIntoViewIfNeeded();

      // El form padre del input email
      const form = page.locator('form').filter({ has: emailInput });

      await form.getByLabel(/nombre|name/i).first().fill(sampleName(2, `/${locale}/propiedades`));
      await emailInput.fill(sampleEmail(2, locale));

      // Phone es opcional (toggle "+ Phone") — saltamos
      // investmentType: select
      await pickFirstOption(page, 'select#contact-investmentType');

      await submitAndExpectLeadOk(page, () =>
        form.getByRole('button', { name: /enviar|send|submit/i }).click(),
      );
    });

    // ============================================================
    // Form 3 — Desarrolladores B2B (hero)
    // ============================================================
    test(`F3 b2b_request — ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/desarrolladores`, { waitUntil: 'networkidle' });
      // B2BForm tiene inputs con id "b2b-*" — espera que aparezcan
      const nameInput = page.locator('#b2b-name');
      await nameInput.waitFor({ state: 'visible', timeout: 15_000 });
      await nameInput.scrollIntoViewIfNeeded();

      const b2bForm = page.locator('form').filter({ has: nameInput });

      await nameInput.fill(sampleName(3, `/${locale}/desarrolladores/hero`));
      await page.locator('#b2b-company').fill('Desarrollos E2E');
      await page.locator('#b2b-email').fill(sampleEmail(3, locale));
      await page.locator('#b2b-phone').fill(samplePhone);
      await page.locator('#b2b-location').fill('Playa del Carmen');
      await page.locator('#b2b-message').fill(sampleMessage(3, locale));

      await submitAndExpectLeadOk(page, () =>
        b2bForm.getByRole('button', { name: /enviar|send|submit/i }).click(),
      );
    });

    // ============================================================
    // Form 4 — Desarrolladores registro (#registro)
    // ============================================================
    test(`F4 developer_request — ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/desarrolladores#registro`, { waitUntil: 'networkidle' });

      // Cualquiera de los forms en la página — el de #registro NO es el primero (el primero es B2BForm hero).
      // Estrategia: hay 2 forms con input name="name", el del registro tiene también projectType/unitCount.
      // Buscamos el form que tenga un select[name="projectType"].
      const projectTypeSel = page.locator('select[name="projectType"]');
      await projectTypeSel.waitFor({ state: 'visible', timeout: 15_000 });
      const form = page.locator('form').filter({ has: projectTypeSel });
      await form.scrollIntoViewIfNeeded();

      await form.locator('input[name="name"]').fill(sampleName(4, `/${locale}/desarrolladores/registro`));
      const companyInput = form.locator('input[name="company"]');
      if (await companyInput.count()) await companyInput.fill('Desarrollos Registro E2E');
      await form.locator('input[name="email"]').fill(sampleEmail(4, locale));
      await form.locator('input[name="phone"]').fill(samplePhone);
      const locationInput = form.locator('input[name="location"]');
      if (await locationInput.count()) await locationInput.fill('Tulum');

      for (const selName of ['projectType', 'unitCount']) {
        await pickFirstOption(page, `form select[name="${selName}"]`);
      }

      const msg = form.locator('textarea[name="message"]');
      if (await msg.count()) await msg.fill(sampleMessage(4, locale));

      await submitAndExpectLeadOk(page, () =>
        form.getByRole('button', { name: /enviar|send|submit/i }).click(),
      );
    });

    // ============================================================
    // Form 5 — Corredores/Brokers (#registro)
    // ============================================================
    test(`F5 broker_registration — ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/corredores#registro`, { waitUntil: 'networkidle' });
      // Form distintivo: tiene select brokerType
      const brokerTypeSel = page.locator('select[name="brokerType"]');
      await brokerTypeSel.waitFor({ state: 'visible', timeout: 15_000 });
      const form = page.locator('form').filter({ has: brokerTypeSel });
      await form.scrollIntoViewIfNeeded();

      await form.locator('input[name="name"]').fill(sampleName(5, `/${locale}/corredores`));
      await form.locator('input[name="email"]').fill(sampleEmail(5, locale));
      await form.locator('input[name="phone"]').fill(samplePhone);
      const companyInput = form.locator('input[name="company"]');
      if (await companyInput.count()) await companyInput.fill('Inmobiliaria E2E');

      for (const selName of ['brokerType', 'experience', 'focusArea']) {
        await pickFirstOption(page, `form select[name="${selName}"]`);
      }

      const msg = form.locator('textarea[name="message"]');
      if (await msg.count()) await msg.fill(sampleMessage(5, locale));

      await submitAndExpectLeadOk(page, () =>
        form.getByRole('button', { name: /enviar|send|submit|registr/i }).click(),
      );
    });

    // ============================================================
    // Form 6 — Proveedores (/proveedores)
    // ============================================================
    test(`F6 provider_form — ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/proveedores`, { waitUntil: 'networkidle' });
      // Distintivo: tiene select#category con categorías de proveedor
      const categorySel = page.locator('select#category');
      await categorySel.waitFor({ state: 'visible', timeout: 15_000 });
      const form = page.locator('form').filter({ has: categorySel });
      await form.scrollIntoViewIfNeeded();

      await form.locator('#company').fill('Servicios E2E');
      await form.locator('#category').selectOption('Notary');
      await form.locator('#city').fill('Cancún');
      await form.locator('#companyWebsite').fill('https://servicios-e2e.example.com');
      await form.locator('#contactName').fill(sampleName(6, `/${locale}/proveedores`));
      await form.locator('#phone').fill(samplePhone);
      await form.locator('#email').fill(sampleEmail(6, locale));
      await form.locator('#message').fill(sampleMessage(6, locale));

      await submitAndExpectLeadOk(page, () =>
        form.getByRole('button', { name: /enviar|send|submit/i }).click(),
      );
    });

    // ============================================================
    // Form 7 — Built construcción (/built#contacto)
    // ============================================================
    test(`F7 built_consultation — ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/built#contacto`, { waitUntil: 'networkidle' });
      const phoneInput = page.locator('input[name="phone"]');
      await phoneInput.waitFor({ state: 'visible', timeout: 15_000 });
      const form = page.locator('form').filter({ has: phoneInput });
      await form.scrollIntoViewIfNeeded();

      await form.locator('input[name="name"]').fill(sampleName(7, `/${locale}/built`));
      await form.locator('input[name="email"]').fill(sampleEmail(7, locale));
      await phoneInput.fill(samplePhone);
      const companyInput = form.locator('input[name="company"]');
      if (await companyInput.count()) await companyInput.fill('Construcciones E2E');

      for (const selName of ['projectType', 'budget', 'location']) {
        await pickFirstOption(page, `form select[name="${selName}"]`);
      }
      const msg = form.locator('textarea[name="message"]');
      if (await msg.count()) await msg.fill(sampleMessage(7, locale));

      await submitAndExpectLeadOk(page, () =>
        form.getByRole('button', { name: /enviar|send|submit/i }).click(),
      );
    });

    // ============================================================
    // Form 8 — Únete (afiliados)
    // ============================================================
    test(`F8 affiliate_request — ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/unete#aplicar`, { waitUntil: 'networkidle' });
      const nameInput = page.locator('#unete-name');
      await nameInput.waitFor({ state: 'visible', timeout: 15_000 });
      await nameInput.scrollIntoViewIfNeeded();

      const form = page.locator('form').filter({ has: nameInput });

      await nameInput.fill(sampleName(8, `/${locale}/unete`));
      await page.locator('#unete-whatsapp').fill(samplePhone);
      await page.locator('#unete-email').fill(sampleEmail(8, locale));
      await page.locator('#unete-city').selectOption('playa');
      await page.locator('#unete-experience').selectOption('1-2');
      await page.locator('#unete-interest').fill(sampleMessage(8, locale));

      await submitAndExpectLeadOk(page, () =>
        form.getByRole('button', { name: /enviar|send|aplicar|apply|submit/i }).click(),
      );
    });

    // ============================================================
    // Form 9 — Newsletter (/blog)
    // ============================================================
    test(`F9 newsletter — ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/blog`, { waitUntil: 'networkidle' });
      const newsletterEmail = page.locator('#newsletter-email');
      await newsletterEmail.waitFor({ state: 'visible', timeout: 15_000 });
      await newsletterEmail.scrollIntoViewIfNeeded();
      await newsletterEmail.fill(sampleEmail(9, locale));

      const form = page.locator('form').filter({ has: newsletterEmail });
      await submitAndExpectLeadOk(page, () =>
        form.getByRole('button', { name: /suscrib|subscribe|enviar|send/i }).click(),
      );
    });

    // ============================================================
    // Form 10 — Lead magnet (homepage)
    // ============================================================
    test(`F10 lead_magnet — ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}`, { waitUntil: 'networkidle' });
      // LeadMagnet tiene un botón con icono FileDown — texto cae a t('downloadCta').
      // Distintivo: form que tiene un botón con "Descargar"/"Download" Y un input email
      // EN la home (no Newsletter, que vive en /blog).
      // Estrategia: find input[type="text"][placeholder*=nombre|name] adyacente a input[type="email"]

      // El LeadMagnet del home tiene un section con icono FileDown. Mejor scroll a una sección
      // que lo contenga. Sus inputs no tienen id explícito.
      // Patrón confiable: encontrar el button con texto descargar Y un input email en el mismo form.

      const downloadBtn = page.getByRole('button', { name: /descargar|download/i }).first();
      await downloadBtn.waitFor({ state: 'visible', timeout: 15_000 });
      await downloadBtn.scrollIntoViewIfNeeded();

      const form = page.locator('form').filter({ has: downloadBtn });
      await form.locator('input[type="text"]').first().fill(sampleName(10, `/${locale}`));
      await form.locator('input[type="email"]').first().fill(sampleEmail(10, locale));

      await submitAndExpectLeadOk(page, () => downloadBtn.click());
    });

    // ============================================================
    // Form 11 — Glosario PDF gate (modal)
    // ============================================================
    test(`F11 glossary_pdf — ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/glosario`, { waitUntil: 'networkidle' });

      // Cookie banner puede estar al frente — cerrarlo si existe.
      const cookieAccept = page.getByRole('button', { name: /aceptar|acepto|accept|got it/i }).first();
      if (await cookieAccept.count()) {
        await cookieAccept.click().catch(() => {});
        await page.waitForTimeout(500);
      }

      // Trigger del modal: botón "Descargar PDF"
      const trigger = page.getByRole('button', { name: /descargar|download/i }).first();
      await trigger.click();

      // Filter por aria-labelledby="glossary-gate-title" (la cookie banner usa otro label)
      const dialog = page.locator('[role="dialog"][aria-labelledby="glossary-gate-title"]');
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      await dialog.getByLabel(/nombre|name/i).first().fill(sampleName(11, `/${locale}/glosario`));
      await dialog.getByLabel(/email|correo/i).first().fill(sampleEmail(11, locale));

      const consent = dialog.locator('input[type="checkbox"]').first();
      if (await consent.count()) await consent.check();

      await submitAndExpectLeadOk(page, () =>
        dialog.getByRole('button', { name: /descargar|download|enviar|send/i }).click(),
      );
    });

  });
}
