// Axe-core accessibility audit via Playwright.
//
// Usage:
//   node tests/qa-phase55/axe-core-audit.mjs [BASE_URL]
//
// Defaults to http://localhost:3000. Pass https://dev.propyte.com as argv[2]
// to audit the staging deploy. Writes a JSON report and prints a summary.
// Target: zero violations of impact `serious` or `critical` across WCAG AA.

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:3000';

const ROUTES = [
  '/es',
  '/en',
  '/es/desarrollos',
  '/en/desarrollos',
  '/es/propiedades',
  '/en/propiedades',
  '/es/destacados',
  '/es/promociones',
  '/es/como-comprar',
  '/es/como-invertir',
  '/es/faq',
  '/es/financiamiento',
  '/es/glosario',
  '/es/contacto',
  '/es/mercado',
  '/es/corredores',
  '/es/unete',
  '/en/unete',
  '/es/nosotros/quienes-somos',
  '/es/nosotros/estructura',
  '/es/nosotros/equipo-comercial',
];

const IMPACT_ORDER = { critical: 3, serious: 2, moderate: 1, minor: 0 };
const FAIL_THRESHOLD = 'serious';

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const report = { base: BASE, ran: new Date().toISOString(), pages: [] };
  let totalFails = 0;

  for (const route of ROUTES) {
    try {
      const res = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const status = res?.status() ?? 0;
      if (status !== 200) {
        report.pages.push({ route, status, error: 'non-200', violations: [] });
        console.log(`[SKIP] ${route} → HTTP ${status}`);
        continue;
      }

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const fails = results.violations.filter(
        (v) => IMPACT_ORDER[v.impact ?? 'minor'] >= IMPACT_ORDER[FAIL_THRESHOLD],
      );
      const pageReport = {
        route,
        status,
        totalViolations: results.violations.length,
        failViolations: fails.length,
        fails: fails.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
        })),
      };
      report.pages.push(pageReport);
      totalFails += fails.length;
      const tag = fails.length === 0 ? 'OK ' : 'FAIL';
      console.log(`[${tag}] ${route} → total=${results.violations.length} serious+=${fails.length}`);
    } catch (err) {
      report.pages.push({ route, error: String(err) });
      console.log(`[ERR ] ${route} → ${err.message || err}`);
    }
  }

  await browser.close();

  const outPath = resolve(process.cwd(), 'tests/qa-phase55/axe-core-report.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n================ SUMMARY ================');
  console.log(`Base:          ${BASE}`);
  console.log(`Routes tested: ${ROUTES.length}`);
  console.log(`Total fails ≥${FAIL_THRESHOLD}: ${totalFails}`);
  console.log(`Report:        ${outPath}`);
  process.exit(totalFails > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
