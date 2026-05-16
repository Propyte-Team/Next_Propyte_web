/**
 * Verify the map renders on /propiedades after the height fix.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'screenshots-map-fix');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);

await page.goto('https://dev.propyte.com/es/propiedades', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);

// Dismiss cookie banner
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => /rechazar|reject/i.test(b.textContent || ''));
  if (btn) btn.click();
});
await page.waitForTimeout(1500);

// Check heights
const heights = await page.evaluate(() => {
  const mapLeft = [...document.querySelectorAll('div')].find(d =>
    d.className.includes('w-[60%]') && d.className.includes('h-full')
  );
  const mapEl = document.querySelector('.gm-style, [aria-label*="Map"]');
  return {
    mapLeftHeight: mapLeft?.getBoundingClientRect().height ?? null,
    mapElExists: !!mapEl,
    mapElHeight: mapEl?.getBoundingClientRect().height ?? null,
  };
});
console.log('Heights:', JSON.stringify(heights, null, 2));

// Screenshot full page
await page.screenshot({ path: join(OUT, 'propiedades_after_fix.png'), fullPage: false });
console.log(`\nScreenshot → ${OUT}/propiedades_after_fix.png`);

await browser.close();
