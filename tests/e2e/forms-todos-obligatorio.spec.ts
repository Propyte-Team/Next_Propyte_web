import { test, expect, type Locator, type Page } from '@playwright/test';

/**
 * TODOS los formularios de captación, uno por uno.
 *
 * Por cada form se comprueban dos cosas opuestas, que es la única forma de que
 * la prueba signifique algo: que lo incompleto NO salga, y que lo completo SÍ.
 * Un test que solo mira lo primero pasa igual con el formulario apagado.
 *
 * NADA llega al CRM: `/api/leads` se intercepta siempre y se responde un 200
 * falso, incluso en el caso «incompleto» donde no debería salir petición —
 * porque si el guardia se rompe, la petición sale de verdad, y esta suite está
 * pensada para poder correrse contra producción.
 *
 *   npx playwright test tests/e2e/forms-todos-obligatorio.spec.ts
 *   PLAYWRIGHT_BASE_URL=https://propyte.com npx playwright test tests/e2e/forms-todos-obligatorio.spec.ts
 */

interface Caso {
  nombre: string;
  ruta: string;
  /** Índice del <form> con teléfono dentro de la página (0 = el primero). */
  indice?: number;
  /** Acción previa para que el form exista (abrir un modal, por ejemplo). */
  antes?: (page: Page) => Promise<void>;
}

const CASOS: Caso[] = [
  { nombre: 'brokers', ruta: '/es/brokers' },
  { nombre: 'desarrolladores', ruta: '/es/desarrolladores' },
  { nombre: 'proveedores', ruta: '/es/proveedores' },
  { nombre: 'unete', ruta: '/es/unete' },
  { nombre: 'contacto es', ruta: '/es/contacto' },
  { nombre: 'contacto en', ruta: '/en/contacto' },
  { nombre: 'lead magnet home', ruta: '/es' },
  { nombre: 'blog · sidebar', ruta: '/es/blog/cfdi-compra-inmueble', indice: 1 },
  { nombre: 'ficha de unidad', ruta: '/es/propiedades/2-recamaras-pentgarden-con-alberca-privada' },
  { nombre: 'ficha de desarrollo', ruta: '/es/desarrollos/amares-riviera-maya' },
  { nombre: 'LP lotes · hero', ruta: '/lp/lotes-playa-del-carmen', indice: 0 },
  { nombre: 'LP lotes · principal', ruta: '/lp/lotes-playa-del-carmen', indice: 1 },
  { nombre: 'LP terrenos · hero', ruta: '/lp/terrenos-playa-del-carmen', indice: 0 },
  { nombre: 'LP terrenos · medio', ruta: '/lp/terrenos-playa-del-carmen', indice: 1 },
  { nombre: 'LP terrenos · cierre', ruta: '/lp/terrenos-playa-del-carmen', indice: 2 },
  { nombre: 'LP casas es', ruta: '/lp/casas-riviera-maya', indice: 0 },
  { nombre: 'LP casas en', ruta: '/lp/homes-riviera-maya', indice: 0 },
  {
    nombre: 'glosario · modal',
    ruta: '/es/glosario',
    antes: async (page) => {
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) =>
          /pdf|descarg/i.test(x.textContent || ''));
        if (b) (b as HTMLButtonElement).click();
      });
      await page.waitForTimeout(1000);
    },
  },
];

const TELEFONO = '+52 984 000 0000';
const TELEFONO_E164 = '+529840000000';

/**
 * Pulsa «enviar» dejando antes que el layout se asiente.
 *
 * El sidebar del blog vive dentro de un contenedor `sticky top-24`: al hacer
 * scroll para alcanzar el botón, el contenedor se reposiciona y Playwright
 * nunca lo da por «estable», así que el clic expira a los 30 s. No es un fallo
 * del formulario —una persona lo pulsa sin problema—, es la comprobación de
 * actionability peleándose con el sticky. Un scroll explícito y una pausa
 * corta lo dejan quieto, y así el test sigue comprobando que el botón es
 * pulsable de verdad en vez de saltarse la comprobación con `force: true`.
 */
async function enviar(page: Page, form: Locator) {
  const boton = form.locator('button[type="submit"]').first();
  await boton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await boton.click();
}

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

/**
 * Rellena todo lo rellenable del form menos el teléfono.
 *
 * Se salta a propósito:
 *   · el honeypot `website` — llenarlo hace que el endpoint responda un 200
 *     silencioso tratándolo como bot, y el test daría un falso verde;
 *   · `companyWebsite` — es opcional y valida como URL, así que un texto
 *     cualquiera tumbaría el esquema entero;
 *   · los `<select>` de lada del propio campo de teléfono.
 */
async function rellenarTodoMenosTelefono(form: Locator) {
  const entradas = form.locator('input:not([type="hidden"]), textarea');
  for (let i = 0; i < (await entradas.count()); i++) {
    const campo = entradas.nth(i);
    const nombre = ((await campo.getAttribute('name')) || '').toLowerCase();
    const tipo = (await campo.getAttribute('type')) || 'text';
    if (nombre.includes('website')) continue;           // honeypot y URL opcional
    if (await campo.evaluate((e: HTMLElement) => e.closest('.PhoneInput') !== null)) continue;
    if (!(await campo.isVisible().catch(() => false))) continue;

    if (tipo === 'checkbox') {
      await campo.check().catch(() => {});
    } else if (tipo === 'radio') {
      continue;                                          // ya vienen con default
    } else if (tipo === 'email' || nombre.includes('email') || nombre.includes('correo')) {
      await campo.fill('e2e@example.com');
    } else {
      // Largo suficiente para los `min(10)` de los campos de mensaje.
      await campo.fill('Prueba automatizada E2E, texto suficientemente largo.');
    }
  }

  const selects = form.locator('select');
  for (let i = 0; i < (await selects.count()); i++) {
    const s = selects.nth(i);
    const clase = (await s.getAttribute('class')) || '';
    if (clase.includes('PhoneInputCountrySelect')) continue;
    const valores = await s.locator('option').evaluateAll((els) =>
      els.map((o) => (o as HTMLOptionElement).value).filter(Boolean),
    );
    if (valores.length) await s.selectOption(valores[0]!).catch(() => {});
  }
}

for (const caso of CASOS) {
  const abrir = async (page: Page) => {
    await page.goto(caso.ruta);
    if (caso.antes) await caso.antes(page);
    const form = page.locator('form:has(.PhoneInput)').nth(caso.indice ?? 0);
    await expect(form, 'no se encontró el formulario con teléfono').toBeVisible();
    return form;
  };

  test(`@todos ${caso.nombre} — sin teléfono NO sale`, async ({ page }) => {
    const registro = await interceptar(page);
    const form = await abrir(page);

    await rellenarTodoMenosTelefono(form);
    await enviar(page, form);
    await page.waitForTimeout(1500);

    expect(
      registro.cuerpos,
      `salió un lead sin teléfono desde ${caso.nombre}`,
    ).toEqual([]);
  });

  test(`@todos ${caso.nombre} — completo SÍ sale, con los tres datos`, async ({ page }) => {
    const registro = await interceptar(page);
    const form = await abrir(page);

    await rellenarTodoMenosTelefono(form);
    // El campo ya llega con «+52» puesto y una persona teclea detrás; por eso
    // se escribe con la lada delante en vez de un número pelado.
    await form.locator('.PhoneInput input').fill(TELEFONO);
    await enviar(page, form);

    await expect
      .poll(() => registro.cuerpos.length, { timeout: 10000 })
      .toBeGreaterThan(0);

    const cuerpo = registro.cuerpos[0]!;
    expect(cuerpo.name, 'el nombre no llegó').toBeTruthy();
    expect(cuerpo.email, 'el correo no llegó').toBeTruthy();
    // El asesor ve el mismo formato venga de donde venga el lead.
    const telefono = (cuerpo.phone ?? cuerpo.whatsapp) as string;
    expect(telefono, 'el teléfono no llegó en E.164').toBe(TELEFONO_E164);
  });
}
