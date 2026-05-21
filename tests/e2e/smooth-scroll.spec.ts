import { test, expect } from '@playwright/test';

/**
 * QW-2.4 — Smoke Playwright para SmoothScrollProvider (Lenis).
 *
 * Lenis monta en cliente vía useEffect — el HTML SSR no tiene clases,
 * aparecen tras hidratación. Verificamos:
 *   1. Provider monta y aplica `.lenis` en `<html>` por default.
 *   2. `prefers-reduced-motion: reduce` impide el mount (a11y).
 *   3. Otras rutas marketing también heredan el provider.
 *   4. Scroll programático cambia scrollY (Lenis intercepta sin bloquear).
 */

test.describe('@smoke Lenis SmoothScrollProvider', () => {
  test('aplica clase .lenis en <html> por default en /es', async ({ page }) => {
    await page.goto('/es');
    // Lenis monta dentro de useEffect → esperar hidratación.
    await expect(page.locator('html.lenis')).toHaveCount(1);
  });

  test('hereda el provider en /es/desarrollos', async ({ page }) => {
    await page.goto('/es/desarrollos');
    await expect(page.locator('html.lenis')).toHaveCount(1);
  });

  test('hereda el provider en /es/propiedades (página con mapa)', async ({ page }) => {
    // 'load' espera todas las imágenes (47+ por unidad × 4 unidades) + scripts third-party.
    // 'domcontentloaded' es suficiente: Lenis hidrata vía useEffect tras DOM ready.
    await page.goto('/es/propiedades', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html.lenis')).toHaveCount(1);
    // Sanity: la página renderiza H1 (no crashea por interacción Lenis ↔ mapa).
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('scroll programático cambia scrollY (no se queda pegado)', async ({ page }) => {
    await page.goto('/es');
    await expect(page.locator('html.lenis')).toHaveCount(1);

    const initialY = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'smooth' }));
    // Lenis hace easing — esperar a que llegue cerca del target.
    await page.waitForFunction(() => window.scrollY > 800, undefined, { timeout: 3000 });
    const finalY = await page.evaluate(() => window.scrollY);
    expect(finalY).toBeGreaterThan(initialY);
  });
});

test.describe('@smoke Lenis a11y — prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' } as Parameters<typeof test.use>[0]);

  test('NO aplica clases lenis si reducedMotion=reduce', async ({ page }) => {
    await page.goto('/es');
    // Sin Lenis activo, no debe haber `.lenis` en <html>.
    await expect(page.locator('html.lenis')).toHaveCount(0);
    // Smoke adicional: la página sigue renderizando OK.
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
