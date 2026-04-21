// Audits header-over-content overlap across pages.
// For each page, checks the vertical distance from top of viewport to
// the first visible text/image element. If it's less than header height,
// content is being occluded by the floating header.

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] || 'https://dev.propyte.com';
const OUT_DIR = path.resolve('tests/qa-phase55/screenshots-header');
fs.mkdirSync(OUT_DIR, { recursive: true });

const ROUTES = [
  '/es',
  '/es/desarrollos',
  '/es/propiedades',
  '/es/desarrollos/azul-vivo-residences-b73b319b',
  '/es/nosotros/quienes-somos',
  '/es/contacto',
  '/es/faq',
  '/es/glosario',
  '/es/mercado',
  '/es/promociones',
  '/es/destacados',
  '/es/financiamiento',
  '/es/unete',
  '/es/corredores',
  '/es/proveedores',
  '/es/como-comprar',
  '/es/como-invertir',
  '/es/privacidad',
  '/es/desarrolladores',
];

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

async function audit(viewport, label) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();

  const results = [];

  for (const route of ROUTES) {
    const url = `${BASE}${route}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(800);

      // Measure header (desktop: <header>, mobile: header.lg:hidden)
      const headerRect = await page.evaluate(() => {
        const h = document.querySelector('header');
        if (!h) return null;
        const r = h.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      });

      // Find first visible "content" element inside <main>, excluding the header
      const firstContentTop = await page.evaluate(() => {
        const main = document.querySelector('main#main-content');
        if (!main) return null;
        // find first element with non-zero size visible in viewport
        const candidates = main.querySelectorAll('h1, h2, img, nav[aria-label="Breadcrumb"], [role="region"], section, div');
        for (const el of candidates) {
          const r = el.getBoundingClientRect();
          if (r.width > 100 && r.height > 20 && r.top >= 0 && r.top < 200) {
            return { top: r.top, tag: el.tagName.toLowerCase(), label: el.getAttribute('aria-label') || el.id || '' };
          }
        }
        return null;
      });

      const overlap = headerRect && firstContentTop && firstContentTop.top < headerRect.bottom;
      const gap = headerRect && firstContentTop ? firstContentTop.top - headerRect.bottom : null;

      results.push({
        route,
        headerHeight: headerRect?.height ?? null,
        firstContentTop: firstContentTop?.top ?? null,
        firstContentTag: firstContentTop?.tag ?? null,
        overlap: overlap ?? null,
        gapPx: gap !== null ? Math.round(gap) : null,
      });

      // Screenshot top portion for visual review
      const safeName = route.replace(/\//g, '_').replace(/^_/, '') || 'home';
      await page.screenshot({
        path: path.join(OUT_DIR, `${label}_${safeName}.png`),
        clip: { x: 0, y: 0, width: viewport.width, height: Math.min(400, viewport.height) },
      });
    } catch (err) {
      results.push({ route, error: err.message });
    }
  }

  await browser.close();
  return results;
}

const desktopResults = await audit(DESKTOP, 'desktop');
const mobileResults = await audit(MOBILE, 'mobile');

const report = { base: BASE, desktop: desktopResults, mobile: mobileResults };
fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));

console.log('\n=== HEADER OVERLAP AUDIT ===\n');
console.log(`Base: ${BASE}\n`);

for (const [label, results] of [['DESKTOP', desktopResults], ['MOBILE', mobileResults]]) {
  console.log(`--- ${label} ---`);
  for (const r of results) {
    if (r.error) {
      console.log(`  ${r.route.padEnd(50)} ERROR: ${r.error}`);
      continue;
    }
    const flag = r.overlap ? '❌ OVERLAP' : r.gapPx !== null && r.gapPx < 8 ? '⚠️ TIGHT' : '✅';
    console.log(`  ${flag} ${r.route.padEnd(50)} hdr=${r.headerHeight}px top=${r.firstContentTop}px gap=${r.gapPx}px (${r.firstContentTag})`);
  }
  console.log('');
}

const overlapCount = [...desktopResults, ...mobileResults].filter(r => r.overlap).length;
console.log(`Total overlaps detected: ${overlapCount}`);
console.log(`Screenshots: ${OUT_DIR}`);
process.exit(overlapCount > 0 ? 1 : 0);
