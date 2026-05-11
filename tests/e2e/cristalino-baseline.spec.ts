import { test, expect } from '@playwright/test';
import path from 'node:path';

/**
 * Visual baseline for speckit cristalino-sitio-wide (T4.5).
 * Captures full-page screenshots of key routes in mobile + desktop
 * viewports. Run against dev.propyte.com via:
 *
 *   PLAYWRIGHT_BASE_URL=https://dev.propyte.com \
 *     npx playwright test tests/qa-visual/cristalino-baseline.spec.ts \
 *     --project=chromium
 *
 * Output: tests/qa-visual/screenshots/<route>_<viewport>.png
 */

const ROUTES = [
  { name: 'home', path: '/es' },
  { name: 'propiedades-grid-map', path: '/es/propiedades' },
  { name: 'desarrollos-grid', path: '/es/desarrollos' },
  { name: 'destacados', path: '/es/destacados' },
  { name: 'promociones', path: '/es/promociones' },
  { name: 'mercado', path: '/es/mercado' },
  { name: 'built', path: '/es/built' },
  { name: 'desarrolladores', path: '/es/desarrolladores' },
  { name: 'contacto', path: '/es/contacto' },
  { name: 'unete', path: '/es/unete' },
  { name: 'nosotros-quienes-somos', path: '/es/nosotros/quienes-somos' },
  { name: 'nosotros-equipo', path: '/es/nosotros/equipo-comercial' },
  { name: 'faq', path: '/es/faq' },
  { name: 'glosario', path: '/es/glosario' },
  { name: 'desarrollos-cancun-taxonomy', path: '/es/desarrollos/cancun' },
] as const;

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

const OUTPUT_DIR = path.join(__dirname, '..', 'qa-visual', 'screenshots');

for (const route of ROUTES) {
  for (const viewport of VIEWPORTS) {
    test(`baseline ${route.name} @${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto(route.path, { waitUntil: 'networkidle', timeout: 30_000 });
      expect(response?.status() ?? 0).toBeLessThan(400);

      // Pequeña espera para fonts + lazy images intersection
      await page.waitForTimeout(800);

      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${route.name}_${viewport.name}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
}
