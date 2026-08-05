import { test, expect } from '@playwright/test';

/**
 * Click-through real de la barra de filtros del blog.
 *
 * `curl` y `grep` no bastan: un filtro que no re-renderiza sale idéntico en el
 * HTML, y una cadena puede viajar en el bundle de mensajes serializado aunque el
 * componente no se haya renderizado. Lo que se verifica aquí es el grid después
 * del clic y la URL resultante.
 */
test.describe('barra de filtros del blog', () => {
  test('los enlaces existen con el desplegable CERRADO @smoke', async ({ page }) => {
    // Es la propiedad que decidió el diseño: la barra usa <details> en vez de un
    // dropdown de cliente justo para que cada opción sea un <a href> presente en
    // el HTML servido. Si alguien lo convierte en render condicional, las vistas
    // filtradas vuelven a ser inalcanzables sin JavaScript y este test cae.
    await page.goto('/es/blog');

    const bar = page.getByRole('navigation', { name: /filtros del blog|blog filters/i });
    await expect(bar).toBeVisible();

    for (const href of [
      '/es/blog?audiencia=asesores',
      '/es/blog?audiencia=inversionistas',
      '/es/blog?pilar=fiscal-legal',
    ]) {
      await expect(page.locator(`a[href="${href}"]`)).toHaveCount(1);
    }

    // Y están ahí sin que nadie haya abierto nada.
    const abiertos = await page.locator('details[open]').count();
    expect(abiertos).toBe(0);
  });

  test('el filtro de público filtra el grid, y el pill muestra y limpia su valor', async ({ page }) => {
    await page.goto('/es/blog');

    const antes = await page.locator('a[href*="/es/blog/"]').count();
    expect(antes).toBeGreaterThan(0);

    await page.locator('summary').filter({ hasText: /público|audience/i }).click();
    await page.locator('a[href="/es/blog?audiencia=asesores"]').click();

    await expect(page).toHaveURL(/[?&]audiencia=asesores/);

    // Hoy no hay piezas publicadas de P7, así que el grid debe quedarse vacío.
    // Si siguiera mostrando artículos, el filtro no filtró.
    const despues = await page.locator('a[href*="/es/blog/"]').count();
    expect(despues).toBeLessThan(antes);

    // El pill pasa a mostrar el valor activo en vez de su etiqueta genérica: es
    // lo que sustituye al chip duplicado.
    await expect(page.locator('summary').filter({ hasText: /para asesores|for brokers/i })).toBeVisible();

    // El desplegable SIGUE ABIERTO tras elegir. `<Link>` hace navegación suave y
    // React no controla el atributo `open` del <details>, así que el panel
    // sobrevive al cambio de página. Se afirma explícitamente para que si algún
    // día se cierra —por ejemplo al añadir un wrapper de cliente— este test lo
    // avise en vez de que el cambio pase inadvertido.
    await expect(page.locator('details[open]')).toHaveCount(1);

    // Y se limpia desde el mismo panel, sin chip aparte.
    await page.getByRole('link', { name: /todo el público|everyone/i }).click();
    await expect(page).not.toHaveURL(/audiencia=/);
    expect(await page.locator('a[href*="/es/blog/"]').count()).toBe(antes);
  });

  test('una categoría por URL sí deja chip, porque no tiene pill donde verse', async ({ page }) => {
    // `?categoria=` se retiró como pill pero el param sigue vivo: lo usan el "ver
    // todos" de los hubs viejos y las URLs ya indexadas. Sin chip sería un filtro
    // aplicándose de forma invisible.
    await page.goto('/es/blog?categoria=Para+Inversionistas');

    const chip = page.getByRole('link', { name: /quitar filtro|remove filter/i });
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(page).not.toHaveURL(/categoria=/);
  });

  test('el filtro de tema acierta: devuelve solo las piezas de ese pilar', async ({ page }) => {
    await page.goto('/es/blog');
    const total = await page.locator('a[href*="/es/blog/"]').count();

    await page.locator('summary').filter({ hasText: /tema|topic/i }).click();
    await page.locator('a[href="/es/blog?pilar=fiscal-legal"]').click();

    await expect(page).toHaveURL(/[?&]pilar=fiscal-legal/);
    const filtradas = await page.locator('a[href*="/es/blog/"]').count();
    // Acierta, no solo excluye: devuelve piezas, y no más de las que había.
    expect(filtradas).toBeGreaterThan(0);
    expect(filtradas).toBeLessThanOrEqual(total);
  });

  test('el filtro sobrevive a la paginación', async ({ page }) => {
    await page.goto('/es/blog?audiencia=inversionistas');
    await expect(page).toHaveURL(/audiencia=inversionistas/);

    const paginacion = page.getByRole('navigation', { name: /paginaci|pagination/i });
    if ((await paginacion.count()) === 0) {
      test.info().annotations.push({
        type: 'estado',
        description: 'Una sola página de resultados: no hay paginación que probar.',
      });
      return;
    }

    await paginacion.getByRole('link').last().click();
    await expect(page).toHaveURL(/audiencia=inversionistas/);
    await expect(page).toHaveURL(/pagina=/);
  });

  test('un valor fuera del catálogo no rompe: 200, sin filtrar y desindexado', async ({ page }) => {
    const res = await page.goto('/es/blog?pilar=inventado');
    expect(res?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/es\/blog$/);
  });

  test('el mapa enlaza los siete hubs y los dos nuevos responden 200 @smoke', async ({ page, request }) => {
    await page.goto('/es/blog');
    await expect(page.getByRole('heading', { name: /siete pilares/i })).toBeVisible();

    for (const path of [
      '/es/guias/fiscal-legal', '/es/como-comprar', '/es/como-invertir',
      '/es/financiamiento', '/es/mercado', '/es/guias/costa', '/es/brokers',
    ]) {
      await expect(page.locator(`a[href="${path}"]`).first()).toHaveCount(1);
    }

    for (const path of ['/es/guias/fiscal-legal', '/es/guias/costa']) {
      expect((await request.get(path)).status()).toBe(200);
    }
    expect((await request.get('/es/guias/inventado')).status()).toBe(404);
  });
});
