// Validates CurrencyToggle visibility and behaviour in /desarrollos and /propiedades.
//
// Usage:
//   node tests/qa-phase55/currency-toggle-archives.mjs [BASE_URL]
//
// Checks:
//   1. role="group" + aria-label presente en FilterBar
//   2. MXN disabled en estado inicial, USD disabled tras click
//   3. Precio en data-testid="marketplace-card-price" cambia al cambiar moneda
//   4. Sin scroll horizontal en 375×667

import { chromium } from 'playwright';
import { expect } from '@playwright/test';

const BASE = process.argv[2] || 'https://dev.propyte.com';
const ARCHIVES = ['/es/desarrollos', '/es/propiedades'];
const MOBILE = { width: 375, height: 667 };
const DESKTOP = { width: 1440, height: 900 };

let failures = 0;

function pass(msg) { console.log(`  ✅ ${msg}`); }
function fail(msg) { console.error(`  ❌ ${msg}`); failures++; }

async function auditViewport(viewport, label) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();

  for (const route of ARCHIVES) {
    const url = `${BASE}${route}`;
    console.log(`\n[${label}] ${route}`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(1000);

      // Locate the toggle group
      const group = page.locator('[role="group"]').filter({
        has: page.locator('button[aria-pressed]'),
      }).first();

      // 1a. role="group" presente
      try {
        await expect(group).toHaveAttribute('role', 'group');
        pass('role="group" presente');
      } catch (e) { fail(`role="group" ausente: ${e.message}`); continue; }

      // 1b. aria-label no vacío
      const ariaLabel = await group.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.trim().length > 0) {
        pass(`aria-label="${ariaLabel}"`);
      } else {
        fail('aria-label ausente o vacío en group'); continue;
      }

      const mxnBtn = group.locator('button', { hasText: 'MXN' });
      const usdBtn = group.locator('button', { hasText: 'USD' });

      // 2a. MXN disabled en estado inicial (currency=MXN por defecto)
      try {
        await expect(mxnBtn).toBeDisabled();
        pass('MXN disabled en estado inicial');
      } catch (e) { fail(`MXN debería estar disabled al inicio: ${e.message}`); }

      // 2b. USD enabled en estado inicial
      try {
        await expect(usdBtn).toBeEnabled();
        pass('USD enabled en estado inicial');
      } catch (e) { fail(`USD debería estar enabled al inicio: ${e.message}`); }

      // 3. No scroll horizontal
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      if (scrollWidth <= viewport.width + 2) {
        pass(`Sin scroll horizontal (scrollWidth=${scrollWidth}px)`);
      } else {
        fail(`Scroll horizontal: scrollWidth=${scrollWidth}px > ${viewport.width}px`);
      }

      // 4. Precio cambia (solo desktop, cards visibles en grid)
      if (viewport.width >= 1024) {
        const priceLocator = page.locator('[data-testid="marketplace-card-price"]').first();

        // Precio DEBE existir — FAIL si no (no silencioso)
        try {
          await expect(priceLocator).toBeVisible({ timeout: 5000 });
        } catch {
          fail(`data-testid="marketplace-card-price" no encontrado en ${route} — verificar que haya cards y el data-testid esté aplicado`);
          // Reset toggle and continue
          await mxnBtn.click().catch(() => {});
          continue;
        }

        const priceBefore = (await priceLocator.textContent()) ?? '';

        // Click USD
        await usdBtn.click();
        await page.waitForTimeout(400);

        try {
          await expect(usdBtn).toBeDisabled();
          pass('USD disabled tras click');
        } catch (e) { fail(`USD debería estar disabled tras click: ${e.message}`); }

        try {
          await expect(mxnBtn).toBeEnabled();
          pass('MXN enabled tras click USD');
        } catch (e) { fail(`MXN debería estar enabled tras click USD: ${e.message}`); }

        const priceAfter = (await priceLocator.textContent()) ?? '';
        if (priceBefore && priceAfter && priceBefore !== priceAfter) {
          pass(`Precio cambió: "${priceBefore.trim().slice(0, 30)}" → "${priceAfter.trim().slice(0, 30)}"`);
        } else {
          fail(`Precio no cambió tras click USD (before="${priceBefore.trim()}" after="${priceAfter.trim()}")`);
        }

        // 5. Focus ring — keyboard focus no lanza error
        await mxnBtn.click();
        await page.waitForTimeout(200);
        await mxnBtn.focus();
        const outline = await page.evaluate(() => {
          const el = document.querySelector('[data-testid="marketplace-card-price"]')
            ?.closest('[role="group"]')
            ?.querySelector('button[aria-pressed="true"]');
          if (!el) return null;
          el.focus();
          const s = window.getComputedStyle(el);
          return s.outlineWidth || s.boxShadow;
        });
        if (outline && outline !== 'none' && outline !== '0px') {
          pass(`Focus ring detectado (${outline.slice(0, 60)})`);
        } else {
          console.log(`  ⚠️  Focus ring no detectado vía computedStyle (puede ser focus-visible solo con teclado)`);
        }
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
