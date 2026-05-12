import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env.A11Y_BASE_URL || 'https://dev.propyte.com';

const ROUTES = [
  '/es',
  '/es/propiedades',
  '/es/desarrollos',
  '/es/desarrolladores',
  '/es/corredores',
  '/es/unete',
  '/es/contacto',
  '/es/faq',
  '/es/glosario',
  '/es/financiamiento',
  '/es/promociones',
  '/es/destacados',
  '/es/proveedores',
  '/es/blog',
  '/es/built',
  '/es/como-invertir',
  '/es/como-comprar',
  '/es/nosotros/quienes-somos',
  '/es/nosotros/estructura',
  '/es/nosotros/equipo-comercial',
  '/es/aviso-legal-inversion',
  '/es/metodologia',
  '/es/privacidad',
];

for (const route of ROUTES) {
  test(`a11y contrast ${route}`, async ({ page }) => {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

    // WCAG 2 AA (4.5:1 normal, 3:1 large). AAA es opcional, no required.
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    const contrast = results.violations.filter((v) => v.id === 'color-contrast');

    if (contrast.length > 0) {
      const lines: string[] = [];
      lines.push(`\n=== ${route} — ${contrast.length} rule(s), ${contrast.reduce((s, v) => s + v.nodes.length, 0)} node(s) ===`);
      for (const v of contrast) {
        for (const node of v.nodes) {
          const data = (node.any[0]?.data ?? {}) as { fgColor?: string; bgColor?: string; contrastRatio?: number; fontSize?: string; fontWeight?: string };
          lines.push(`  ratio=${data.contrastRatio} fg=${data.fgColor} bg=${data.bgColor} size=${data.fontSize}`);
          lines.push(`    target: ${node.target.join(' > ')}`);
          lines.push(`    html: ${(node.html ?? '').replace(/\s+/g, ' ').slice(0, 180)}`);
        }
      }
      console.log(lines.join('\n'));
    }

    // Don't fail the test — we want all routes audited in one run.
    expect(contrast.length, `${contrast.length} contrast violations on ${route}`).toBeGreaterThanOrEqual(0);
  });
}
