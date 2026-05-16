/**
 * Capture mobile header on dev.propyte.com home, pre-scroll and post-scroll,
 * to validate the dark-hero transparency fix.
 */
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'screenshots-mobile-header');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  ...devices['iPhone 13'],
});
const page = await ctx.newPage();
page.setDefaultTimeout(45000);

// Home — should show transparent header over dark hero
await page.goto('https://dev.propyte.com/es', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);
// Dismiss cookie banner if present
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => /rechazar|reject/i.test(b.textContent || ''));
  if (btn) btn.click();
});
await page.waitForTimeout(500);

// Crop top 200px (header area)
await page.screenshot({ path: join(OUT, 'home_top_prescroll.png'), clip: { x: 0, y: 0, width: 390, height: 220 } });
console.log('home pre-scroll ✓');

// Scroll a bit
await page.evaluate(() => window.scrollTo(0, 600));
await page.waitForTimeout(500);
await page.screenshot({ path: join(OUT, 'home_top_scrolled.png'), clip: { x: 0, y: 0, width: 390, height: 200 } });
console.log('home scrolled ✓');

// Contacto — light route, header should have white gradient pre-scroll
await page.goto('https://dev.propyte.com/es/contacto', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: join(OUT, 'contacto_top_prescroll.png'), clip: { x: 0, y: 0, width: 390, height: 200 } });
console.log('contacto pre-scroll ✓');

await browser.close();
console.log(`\nDone → ${OUT}`);
