import { test, expect } from '@playwright/test';

// ============================================================
// Guardia de Quality Score de la LP de lotes de Playa del Carmen.
//
// La campaña `Propyte | Lotes PDC | Search | MX | ES` pierde ~90% de sus
// impresiones por RANGO con la puja ya topada en 14 MXN, y las cinco keywords
// traen `post_click_quality_score = BELOW_AVERAGE`. Lo medido el 2026-08-17
// descartó velocidad (LCP 3.1 s, CLS 0) y transparencia: lo que fallaba era
// RELEVANCIA DE CONTENIDO — la página vendía un lote y las búsquedas son en
// plural.
//
// Estos asertos existen para que esa relevancia no se pierda en el siguiente
// refactor de copy. No comprueban que la página "se vea bien"; comprueban las
// cinco condiciones concretas que la hacían irrelevante.
//
// El quinto es de otra familia: convierte una regla de MARCA —el nombre interno
// del desarrollo nunca es público— en algo que vigila una máquina. Hasta hoy
// dependía de que alguien se acordara, y ya se escapó dos veces.
// ============================================================

const RUTA = '/lp/lotes-playa-del-carmen';

/**
 * Nombres internos de desarrollo. NINGUNO puede aparecer en el HTML servido.
 *
 * No es preferencia editorial: es política de marca de Propyte, y la fuga de
 * agosto de 2026 demostró que el pipeline de display puede estar correcto y
 * aun así filtrarlo, porque el nombre venía escrito dentro del dato editorial.
 */
const NOMBRES_INTERNOS = ['Gran Coralia', 'Anthar', 'Tierra Madre', 'Valenia'];

test.describe('LP lotes PdC · relevancia para Quality Score', () => {
  test('el primer pliegue móvil nombra la categoría y la ciudad', async ({ page }) => {
    // 390x844 es el iPhone 14/15, el corte más común del tráfico pagado.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(RUTA, { waitUntil: 'domcontentloaded' });

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();

    const textoH1 = (await h1.innerText()).toLowerCase();
    expect(textoH1, 'el H1 debe nombrar el producto que se buscó').toContain('terreno');
    expect(textoH1, 'el H1 debe nombrar la ciudad que se buscó').toContain(
      'playa del carmen',
    );

    // Y tiene que estar REALMENTE en el primer pliegue, no solo existir.
    const caja = await h1.boundingBox();
    expect(caja, 'el H1 debe tener caja').not.toBeNull();
    expect(
      caja!.y,
      'el H1 debe empezar dentro de los primeros 844 px, sin scroll',
    ).toBeLessThan(844);
  });

  test('el vocabulario de la página coincide con el de las búsquedas', async ({
    page,
  }) => {
    await page.goto(RUTA, { waitUntil: 'domcontentloaded' });
    const texto = (await page.locator('body').innerText()).toLowerCase();

    // «terrenos» en plural: es la forma en que la gente busca y la que la
    // página no usaba (aparecía UNA vez, y apuntando a la competencia).
    const terrenos = (texto.match(/terrenos/g) ?? []).length;
    expect(terrenos, `«terrenos» aparece ${terrenos} veces, se esperaban >=3`).toBeGreaterThanOrEqual(3);

    // «residencial(es)»: estaba en CERO pese a ser el término de dos de las
    // cinco keywords compradas.
    const residencial = (texto.match(/residencial/g) ?? []).length;
    expect(residencial, '«residencial» debe aparecer al menos una vez').toBeGreaterThanOrEqual(1);
  });

  test('el comparador va en la primera mitad, no enterrado tras el cierre', async ({
    page,
  }) => {
    await page.goto(RUTA, { waitUntil: 'domcontentloaded' });

    const comparador = page.locator('#comparador-titulo');
    await expect(comparador, 'el comparador debe renderizarse').toBeVisible();

    // Posición estructural, no conteo de caracteres: lo que importa es que el
    // inventario plural aparezca ANTES del bloque jurídico, que es donde
    // empieza la letra pequeña. Un umbral en píxeles o en bytes se rompería
    // con cualquier cambio de copy sin que la relevancia hubiera cambiado.
    const cajaComparador = await comparador.boundingBox();
    const juridico = page.locator('#juridico');
    const cajaJuridico = await juridico.boundingBox();

    expect(cajaComparador, 'el comparador debe tener caja').not.toBeNull();
    expect(cajaJuridico, 'el bloque jurídico debe tener caja').not.toBeNull();
    expect(
      cajaComparador!.y,
      'el comparador debe ir ANTES del bloque jurídico',
    ).toBeLessThan(cajaJuridico!.y);
  });

  test('ningún nombre interno de desarrollo llega al HTML', async ({ page }) => {
    const respuesta = await page.goto(RUTA, { waitUntil: 'domcontentloaded' });
    const html = (await respuesta!.text()).toLowerCase();

    for (const nombre of NOMBRES_INTERNOS) {
      expect(
        html.includes(nombre.toLowerCase()),
        `FUGA DE MARCA: «${nombre}» aparece en el HTML servido`,
      ).toBe(false);
    }
  });

  test('el banner de cookies no tapa los CTA del hero en móvil', async ({ page }) => {
    // Regresión medida el 2026-08-18. El banner iba en `bottom-20` para dejar
    // libre la barra de CTA fija, y en 390x844 eso lo colocaba en y 616–764:
    // encima de los DOS botones del hero (y 636–692 y y 704–756). Al cargar la
    // página no había un solo CTA visible hasta decidir las cookies.
    //
    // Este aserto existe porque el fallo es invisible en revisión de código:
    // depende de la altura acumulada del titular y del subtítulo, así que
    // cualquier cambio de copy en el hero puede reintroducirlo sin tocar el
    // banner. Un `tsc` limpio y un build verde no lo detectan.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(RUTA, { waitUntil: 'networkidle' });

    const caja = async (loc: ReturnType<typeof page.locator>) => {
      if ((await loc.count()) === 0) return null;
      return loc.first().boundingBox();
    };

    const banner = await caja(page.locator('[role="dialog"]'));
    // Si el visitante ya decidió, el banner no se monta y no hay nada que medir.
    test.skip(banner === null, 'el banner no está visible en esta sesión');

    for (const [nombre, sel] of [
      ['CTA primario', 'a[href="#solicitar"]'],
      ['WhatsApp', 'a[href*="wa.me"]'],
    ] as const) {
      const b = await caja(page.locator(sel));
      expect(b, `${nombre} debe existir`).not.toBeNull();

      const seSolapan = b!.y < banner!.y + banner!.height && banner!.y < b!.y + b!.height;
      expect(
        seSolapan,
        `${nombre} (y ${Math.round(b!.y)}–${Math.round(b!.y + b!.height)}) queda tapado ` +
          `por el banner de cookies (y ${Math.round(banner!.y)}–${Math.round(banner!.y + banner!.height)})`,
      ).toBe(false);

      expect(
        b!.y + b!.height,
        `${nombre} debe caber en el primer pliegue de 844 px`,
      ).toBeLessThanOrEqual(844);
    }
  });

  test('el enlace de WhatsApp conserva el identificador de clic del anuncio', async ({
    page,
  }) => {
    const GCLID = 'TestGclid_QS_2026';
    await page.goto(`${RUTA}?gclid=${GCLID}`, { waitUntil: 'domcontentloaded' });

    const wa = page.locator('a[href*="wa.me"]').first();
    await expect(wa).toBeAttached();

    // El href se completa en `useEffect`, después de hidratar: el HTML del
    // servidor no puede conocer la URL del visitante.
    await expect
      .poll(async () => (await wa.getAttribute('href')) ?? '', {
        message: 'el href de WhatsApp debe acabar llevando el gclid',
        timeout: 10_000,
      })
      .toContain(`gclid=${GCLID}`);
  });
});
