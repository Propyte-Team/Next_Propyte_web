/**
 * Capture header behavior at scroll position 600 on several routes.
 * Goal: verify if propyte-strip-glass clashes on dark sections.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'screenshots-header-scrolled');
mkdirSync(OUT, { recursive: true });

const BASE = 'https://dev.propyte.com/es';
const ROUTES = [
  { name: 'home',         path: '/' },
  { name: 'propiedades',  path: '/propiedades' },
  { name: 'destacados',   path: '/destacados' },
  { name: 'mercado',      path: '/mercado' },
  { name: 'unete',        path: '/unete' },
  { name: 'contacto',     path: '/contacto' },
];

const browser = await chromium.launch();
for (const r of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(45000);
  try {
    await page.goto(BASE + r.path, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);
    // Dismiss cookie banner
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => /rechazar|reject/i.test(b.textContent || ''));
      if (btn) btn.click();
    });
    await page.waitForTimeout(300);
    // Scroll to 700
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForTimeout(500);
    // Crop top 200px
    await page.screenshot({ path: join(OUT, `${r.name}_scrolled_top.png`), clip: { x: 0, y: 0, width: 1440, height: 200 } });
    console.log(`${r.name} ✓`);
  } catch (e) {
    console.log(`${r.name} FAIL — ${e.message.slice(0, 80)}`);
  } finally {
    await ctx.close();
  }
}
await browser.close();
console.log(`\nDone → ${OUT}`);
