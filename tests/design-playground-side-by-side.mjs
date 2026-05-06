/**
 * Genera before-vs-after side-by-side del iframe del playground
 * cuando se cambia el token teal a magenta. Evidencia visual del sync.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3000';
const OUT  = path.join(process.cwd(), 'tests', 'screenshots', 'design-playground');
fs.mkdirSync(OUT, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/design-playground`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  const iframeEl = await page.waitForSelector('iframe[title="Design Playground Preview"]');
  const frame = await iframeEl.contentFrame();
  await frame.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3500);

  // Antes
  await iframeEl.screenshot({ path: path.join(OUT, 'sxs-before.png') });

  // Cambiar teal a magenta
  await page.evaluate(() => {
    const inp = document.querySelector('input[type="color"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(inp, '#ff00ff');
    inp.dispatchEvent(new Event('input',  { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(1500);

  await iframeEl.screenshot({ path: path.join(OUT, 'sxs-after.png') });

  // Cambiar a verde lima para una segunda demostración
  await page.evaluate(() => {
    const inp = document.querySelector('input[type="color"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(inp, '#84CC16');
    inp.dispatchEvent(new Event('input',  { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(1500);

  await iframeEl.screenshot({ path: path.join(OUT, 'sxs-after-green.png') });

  console.log('\nScreenshots:');
  console.log('  ' + path.join(OUT, 'sxs-before.png'));
  console.log('  ' + path.join(OUT, 'sxs-after.png') + '       (teal → #ff00ff magenta)');
  console.log('  ' + path.join(OUT, 'sxs-after-green.png') + ' (teal → #84CC16 lima)');
  console.log('\nÁbrelos lado a lado para ver el cambio.');

  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
