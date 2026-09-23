import { test, expect, type Page } from '@playwright/test';

/**
 * Regresión de la tarjeta #230 — el autocompletado no puede costar el lead.
 *
 * En un `<input value={estado} onChange={...}>` servido por SSR, React nunca
 * lee de vuelta el DOM. El autocompletado del navegador (y muchos gestores de
 * contraseñas) rellenan `.value` de golpe SIN disparar el `change` que React
 * escucha: el campo se ve lleno, el estado sigue en `''`, y al enviar o sale
 * «falta tu nombre» o —peor— no pasa absolutamente nada. Cero errores de
 * consola, cero peticiones, cero lead.
 *
 * Lo que se simula aquí es exactamente eso: escribir `.value` sin eventos.
 * Rellenar con `fill()` sería más benévolo y NO reproduce el fallo — si algún
 * día alguien cambia estos `evaluate` por `fill()`, el test pasa con el bug
 * dentro.
 *
 * ⚠️ EL POST SE INTERCEPTA: sin eso cada corrida crearía un lead basura en el
 * CRM. Por eso esta suite puede correr contra producción.
 *
 *   npx playwright test tests/e2e/forms-prehidratacion.spec.ts
 */

interface Objetivo {
  /** Nombre legible, el que sale en el reporte. */
  nombre: string;
  ruta: string;
  /** El `<form>` concreto: varias páginas tienen más de uno (buscador, etc.). */
  form: string;
  /** `name` del campo → valor, tal cual lo escribiría el autocompletado. */
  campos: Record<string, string>;
  /** Lo que tiene que llegar al servidor. `source` engancha el mapa de Zoho. */
  esperado: Record<string, string>;
}

const NOMBRE = 'Autocompletado Temprano';
const EMAIL = 'autocompletado@example.com';
const TEL = '+52 984 765 4321';

/**
 * NO están aquí, y por qué. `BuiltPageContent` y `BlogSidebarBrokerForm`
 * llevan el mismo arreglo, pero hoy no se sirven a nadie: `/es/built` responde
 * «Próximamente» —comprobado contra producción, no solo en local— y ningún
 * artículo publicado usa la categoría «Para Asesores» que elige el form de
 * brokers. Un test contra ellos pasaría en verde sin ejercitar una sola línea
 * del arreglo, que es peor que no tenerlo. Cuando esas dos páginas se
 * publiquen, se añaden aquí como dos entradas más de esta lista.
 */
const OBJETIVOS: Objetivo[] = [
  {
    nombre: 'brokers',
    ruta: '/es/brokers',
    form: '#registro form',
    campos: { name: NOMBRE, email: EMAIL, phone: TEL },
    esperado: { name: NOMBRE, email: EMAIL, source: 'broker_registration' },
  },
  {
    nombre: 'desarrolladores',
    ruta: '/es/desarrolladores',
    form: '#registro form',
    campos: {
      name: NOMBRE,
      company: 'Desarrolladora Prueba',
      email: EMAIL,
      phone: TEL,
      location: 'Playa del Carmen',
    },
    esperado: { name: NOMBRE, email: EMAIL, source: 'developer_request' },
  },
  {
    nombre: 'lead magnet del home',
    ruta: '/es',
    form: 'form:has(input[name="email"]):has(input[name="phone"])',
    campos: { name: NOMBRE, email: EMAIL, phone: TEL },
    esperado: { name: NOMBRE, email: EMAIL, source: 'lead_magnet' },
  },
  {
    nombre: 'form del artículo del blog',
    ruta: '/es/blog/mantenimiento-departamento-frente-al-mar-cuatro-cobros',
    form: 'form:has(input[name="email"]):has(input[name="phone"])',
    campos: { name: NOMBRE, email: EMAIL, phone: TEL },
    esperado: { name: NOMBRE, email: EMAIL, source: 'lead_magnet' },
  },
  {
    nombre: 'newsletter del blog',
    ruta: '/es/blog',
    form: 'form:has(#newsletter-email)',
    campos: { email: EMAIL },
    esperado: { email: EMAIL, source: 'newsletter' },
  },
];

/** Rellena como el autocompletado: `.value` a pelo, sin un solo evento. */
async function rellenarSinEventos(
  page: Page,
  form: string,
  campos: Record<string, string>,
): Promise<string[]> {
  return page.evaluate(
    ({ form, campos }) => {
      // Todas las copias: el artículo del blog pinta el mismo form dos veces
      // —una para móvil y otra para escritorio— y solo una está visible.
      const formularios = Array.from(document.querySelectorAll(form));
      if (formularios.length === 0) {
        return ['no se encontró el formulario en el HTML del servidor'];
      }
      const fallos: string[] = [];
      for (const f of formularios) {
        for (const [nombre, valor] of Object.entries(campos)) {
          const campo = f.querySelector(`[name="${nombre}"]`) as HTMLInputElement | null;
          if (!campo) fallos.push(`el campo [name="${nombre}"] no existe`);
          else campo.value = valor;
        }
      }
      return fallos;
    },
    { form, campos },
  );
}

/** Espera a la hidratación por señal, nunca por un `waitForTimeout` fijo. */
async function esperarHidratacion(page: Page, form: string) {
  await page
    .waitForFunction(
      (form) => {
        const f = document.querySelector(form);
        return !!f && Object.keys(f).some((k) => k.startsWith('__react'));
      },
      form,
      { timeout: 20_000 },
    )
    .catch(() => {});
}

for (const objetivo of OBJETIVOS) {
  test(`@prehidratacion ${objetivo.nombre} — lo autocompletado antes de hidratar SÍ sale`, async ({
    page,
  }) => {
    let cuerpo: Record<string, unknown> | null = null;
    await page.route('**/api/leads', async (route) => {
      cuerpo = route.request().postDataJSON();
      // Se responde en falso: el CRM no debe recibir leads de prueba.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, success: true, id: 'e2e-simulado' }),
      });
    });

    await page.goto(objetivo.ruta, { waitUntil: 'domcontentloaded' });

    // La premisa primero. Sin `<form>` en el HTML del servidor no hay ventana
    // de pre-hidratación que probar, y el test no aplicaría: se dice, en vez
    // de reventar 20 s después esperando un botón que no existe.
    const formulario = page.locator(`${objetivo.form} >> visible=true`).first();
    await expect(
      formulario,
      'el formulario no llega en el HTML del servidor: este test no aplica',
    ).toBeVisible({ timeout: 15_000 });

    // Se rellena DOS veces, y las dos importan.
    //
    //   1. Antes de hidratar — el caso de la tarjeta: el HTML del servidor ya
    //      se ve, React todavía no responde.
    //   2. Otra vez ya hidratado — porque si React re-renderiza entremedias,
    //      restaura el `value=''` del estado y borra lo que escribimos: el
    //      escenario se desmonta solo y el test daría un falso verde. Además
    //      es el caso del gestor de contraseñas, que rellena tarde y tampoco
    //      dispara `change`. El defecto es el mismo: valor en el DOM, estado
    //      de React vacío.
    const fallos = await rellenarSinEventos(page, objetivo.form, objetivo.campos);
    expect(fallos, 'no se pudo simular el autocompletado').toEqual([]);

    await esperarHidratacion(page, objetivo.form);
    await rellenarSinEventos(page, objetivo.form, objetivo.campos);

    // El banner de cookies se come el clic si está abierto.
    const aceptar = page.getByRole('button', { name: /aceptar/i }).first();
    if (await aceptar.count()) await aceptar.click().catch(() => {});

    // Control de que el escenario sigue en pie: si React re-renderizó y borró
    // lo que escribimos a pelo, el fallo de abajo sería del montaje del test y
    // no del código. Se distingue aquí.
    await expect(
      formulario.locator('input[name="email"]').first(),
      'React borró lo autocompletado antes de que se pudiera enviar: el escenario no llegó a montarse',
    ).not.toHaveValue('');

    await formulario.locator('button[type="submit"]').click();
    await page.waitForTimeout(2500);

    expect(
      cuerpo,
      'se rellenó antes de hidratar y NO salió ninguna petición: el lead se pierde en silencio',
    ).not.toBeNull();
    for (const [clave, valor] of Object.entries(objetivo.esperado)) {
      expect(cuerpo![clave], `\`${clave}\` no llegó como se escribió`).toBe(valor);
    }
  });
}
