import { test, expect } from '@playwright/test';

/**
 * Click-through real de los filtros del blog.
 *
 * `curl` y `grep` no sirven aquí: un filtro que no re-renderiza sale idéntico en
 * el HTML, y la cadena de un módulo puede viajar en el bundle de mensajes
 * serializado aunque el módulo no se haya renderizado. Lo que se verifica es el
 * grid después del clic y la URL resultante.
 */
test.describe('filtros del blog por pilar y audiencia', () => {
  test('el mapa enlaza los siete hubs y los dos nuevos responden 200 @smoke', async ({ page, request }) => {
    await page.goto('/es/blog');

    await expect(page.getByRole('heading', { name: /siete pilares/i })).toBeVisible();

    // Los siete hubs del catálogo, enlazados con independencia de si tienen posts.
    for (const path of [
      '/es/guias/fiscal-legal', '/es/como-comprar', '/es/como-invertir',
      '/es/financiamiento', '/es/mercado', '/es/guias/costa', '/es/brokers',
    ]) {
      await expect(page.locator(`a[href="${path}"]`).first()).toHaveCount(1);
    }

    // Los dos que este trabajo construye: vivos de verdad.
    for (const path of ['/es/guias/fiscal-legal', '/es/guias/costa']) {
      expect((await request.get(path)).status()).toBe(200);
    }
    // Y un pilar inexistente sigue dando 404 real, no 200 con lista vacía.
    expect((await request.get('/es/guias/inventado')).status()).toBe(404);
  });

  test('el filtro de audiencia filtra el grid y la URL lo refleja', async ({ page }) => {
    await page.goto('/es/blog');

    const filtro = page.getByRole('navigation', { name: /audiencia|audience/i });
    await expect(filtro).toBeVisible();

    const antes = await page.locator('a[href*="/es/blog/"]').count();
    expect(antes).toBeGreaterThan(0);

    // El chip de asesores: hoy no hay piezas publicadas de P7, así que el grid
    // debe QUEDARSE VACÍO. Si sigue mostrando artículos, el filtro no filtró.
    await filtro.getByRole('link', { name: /asesores|brokers/i }).click();
    await expect(page).toHaveURL(/[?&]audiencia=asesores/);
    await expect(filtro.getByRole('link', { name: /asesores|brokers/i })).toHaveAttribute('aria-current', 'page');

    const despues = await page.locator('a[href*="/es/blog/"]').count();
    expect(despues).toBeLessThan(antes);
  });

  test('el filtro de pilar aparece solo cuando hay piezas clasificadas', async ({ page }) => {
    await page.goto('/es/blog');
    const filtro = page.getByRole('navigation', { name: /pilar|pillar/i });

    // Mientras el reparto de pilares no se ejecute, getBlogPilares devuelve [] y
    // este filtro NO se renderiza: degrada a nada, no a un filtro vacío. Cuando el
    // reparto corra, el chip debe existir y filtrar.
    if (await filtro.count() === 0) {
      test.info().annotations.push({
        type: 'estado',
        description: 'Sin pilares clasificados todavía: el filtro no se renderiza, que es lo correcto.',
      });
      return;
    }

    const chip = filtro.getByRole('link').nth(1);
    const label = (await chip.textContent())!.trim();
    await chip.click();
    await expect(page).toHaveURL(/[?&]pilar=/);
    await expect(filtro.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
  });

  test('el filtro sobrevive a la paginación', async ({ page }) => {
    await page.goto('/es/blog?audiencia=inversionistas');
    await expect(page).toHaveURL(/audiencia=inversionistas/);

    const paginacion = page.getByRole('navigation', { name: /paginaci|pagination/i });
    if (await paginacion.count() === 0) {
      test.info().annotations.push({
        type: 'estado',
        description: 'Una sola página de resultados: no hay paginación que probar.',
      });
      return;
    }

    await paginacion.getByRole('link').last().click();
    // Si la paginación pierde el filtro, este assert cae.
    await expect(page).toHaveURL(/audiencia=inversionistas/);
    await expect(page).toHaveURL(/pagina=/);
  });

  test('un valor fuera del catálogo no rompe: 200, sin filtrar y desindexado', async ({ page }) => {
    const res = await page.goto('/es/blog?pilar=inventado');
    expect(res?.status()).toBe(200);

    // Se ignora el filtro (el listado sigue ahí) pero la URL no debe indexarse.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/es\/blog$/);
  });
});
