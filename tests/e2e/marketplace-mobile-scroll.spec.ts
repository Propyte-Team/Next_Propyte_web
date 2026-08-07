import { test, expect, type Page } from '@playwright/test';

/**
 * Contenedores con scroll vertical propio que sobrepasan su alto visible.
 *
 * En escritorio esto es el split mapa+lista y es intencional. En móvil convierte
 * el catálogo en una ventana de 571 px sobre 12.691 px de contenido, con dos
 * regiones de scroll compitiendo y ninguna señal de cuál mueve qué.
 */
async function nestedScrollers(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .filter((e) => {
        const cs = getComputedStyle(e);
        return /auto|scroll/.test(cs.overflowY)
          && e.scrollHeight > e.clientHeight + 40
          && e.clientHeight > 100;
      })
      .map((e) => ({
        cls: String(e.className).slice(0, 60),
        clientHeight: e.clientHeight,
        scrollHeight: e.scrollHeight,
      })),
  );
}

test.describe('listado de propiedades', () => {
  test('en móvil la lista fluye en el documento, sin scroller anidado', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/es/propiedades', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    const scrollers = await nestedScrollers(page);
    expect(
      scrollers,
      `El catálogo no debe vivir en una ventana de scroll anidada en móvil: ${JSON.stringify(scrollers)}`,
    ).toEqual([]);

    // Y el documento sí crece con las tarjetas: con 49 resultados el alto real
    // ronda los 13.000 px. Si esto no se cumple, la lista sigue encerrada.
    const docH = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(docH).toBeGreaterThan(5000);

    // Las tarjetas ocupan el ancho: si alguien reactiva el split mapa+lista en
    // móvil, quedarían en una columna del 60% y esto cae.
    const cardWidth = await page.evaluate(() => {
      const card = [...document.querySelectorAll('article,[class*="card" i]')]
        .find((e) => e.getBoundingClientRect().height > 120);
      return card ? card.getBoundingClientRect().width : 0;
    });
    expect(cardWidth).toBeGreaterThan(320);

    // El pie va después de la última tarjeta, no por encima de ellas.
    const order = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('article,[class*="card" i]')]
        .filter((e) => e.getBoundingClientRect().height > 120);
      const footer = document.querySelector('footer');
      const lastBottom = cards[cards.length - 1].getBoundingClientRect().bottom + scrollY;
      return { lastBottom, footerTop: footer!.getBoundingClientRect().top + scrollY };
    });
    expect(order.footerTop).toBeGreaterThan(order.lastBottom);
  });

  test('en escritorio el split mapa+lista conserva su scroll interno', async ({ page }) => {
    // El shell de altura fija es intencional en lg: esta aserción impide que el
    // arreglo móvil se lo lleve por delante.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/es/propiedades', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    const scrollers = await nestedScrollers(page);
    expect(scrollers.length).toBeGreaterThan(0);
  });
});
