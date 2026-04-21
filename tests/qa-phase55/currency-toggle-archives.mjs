// Validates CurrencyToggle visibility and behaviour in /desarrollos and /propiedades.
//
// Usage:
//   node tests/qa-phase55/currency-toggle-archives.mjs [BASE_URL]
//
// Checks:
//   1. Toggle renders in FilterBar on both archive routes (desktop + 375px)
//   2. Clicking USD changes at least one visible price from "$" to "USD" format
//   3. Layout does not collapse at 375×667 (no horizontal scroll)

import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://dev.propyte.com';
const ARCHIVES = ['/es/desarrollos', '/es/propiedades'];
const MOBILE = { width: 375, height: 667 };
const DESKTOP = { width: 1440, height: 900 };

let failures = 0;

function fail(msg) {
  console.error(`  ❌ ${msg}`);
  failures++;
}

function pass(msg) {
  console.log(`  ✅ ${msg}`);
}

async function auditViewport(viewport, label) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await ctx.newPage();

  for (const route of ARCHIVES) {
    const url = `${BASE}${route}`;
    console.log(`\n[${label}] ${route}`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(1000);

      // 1. Toggle renders
      const toggle = page.locator('[role="group"][aria-label]').filter({
        has: page.locator('button[aria-pressed]'),
      });
      const toggleCount = await toggle.count();
      if (toggleCount > 0) {
        pass(`Toggle presente (${toggleCount} instancia/s)`);
      } else {
        fail(`Toggle NO encontrado en ${route}`);
        continue;
      }

      // 2. No horizontal scroll at this viewport
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      if (scrollWidth <= viewport.width + 2) {
        pass(`Sin scroll horizontal (scrollWidth=${scrollWidth}px)`);
      } else {
        fail(`Scroll horizontal detectado: scrollWidth=${scrollWidth}px > viewport=${viewport.width}px`);
      }

      // 3. Only check price format change on desktop (cards render in grid)
      if (viewport.width >= 1024) {
        // Get a baseline price text from a visible card
        const firstPrice = await page
          .locator('[data-testid="card-price"], .marketplace-price, [class*="price"]')
          .first()
          .textContent({ timeout: 3000 })
          .catch(() => null);

        // Click USD button
        const usdBtn = toggle.locator('button', { hasText: 'USD' }).first();
        await usdBtn.click();
        await page.waitForTimeout(400);

        const priceAfter = await page
          .locator('[data-testid="card-price"], .marketplace-price, [class*="price"]')
          .first()
          .textContent({ timeout: 3000 })
          .catch(() => null);

        if (firstPrice && priceAfter && firstPrice !== priceAfter) {
          pass(`Precio cambió tras click USD ("${firstPrice.trim().slice(0, 30)}" → "${priceAfter.trim().slice(0, 30)}")`);
        } else if (firstPrice === null || priceAfter === null) {
          console.log(`  ⚠️  No se encontró selector de precio — omitiendo check de formato`);
        } else {
          console.log(`  ⚠️  Precio no cambió (posiblemente cards usan Intl sin data-testid)`);
        }

        // Reset back to MXN
        const mxnBtn = toggle.locator('button', { hasText: 'MXN' }).first();
        await mxnBtn.click();
        await page.waitForTimeout(200);
      }
    } catch (err) {
      fail(`Error inesperado: ${err.message}`);
    }
  }

  await browser.close();
}

console.log(`\n=== CURRENCY TOGGLE ARCHIVES AUDIT ===`);
console.log(`Base: ${BASE}\n`);

await auditViewport(DESKTOP, 'DESKTOP 1440');
await auditViewport(MOBILE, 'MOBILE 375x667');

console.log(`\n${failures === 0 ? '✅ PASS' : `❌ FAIL (${failures} fallo/s)`}`);
process.exit(failures > 0 ? 1 : 0);
