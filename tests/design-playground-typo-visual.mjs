/**
 * Toma screenshots before/after de tipografía. La diferencia visual debe
 * ser evidente: heading "Departamentos, casas y terrenos en Riviera Maya"
 * grande vs muy grande.
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT = path.join(process.cwd(), 'tests', 'screenshots', 'design-playground');
fs.mkdirSync(OUT, { recursive: true });

async function setSlider(page, label, val) {
  await page.evaluate(({ label, val }) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const lbl = buttons.find((b) => b.textContent === label);
    if (!lbl) throw new Error(`label not found: ${label}`);
    const wrapper = lbl.closest('.group');
    const inp = wrapper?.querySelector('input[type="number"]');
    if (!inp) throw new Error(`input not found for: ${label}`);
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(inp, String(val));
    inp.dispatchEvent(new Event('input',  { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }, { label, val });
}

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const p = await ctx.newPage();

await p.goto('http://localhost:3000/design-playground', { waitUntil: 'domcontentloaded' });
await p.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

const iframeEl = await p.waitForSelector('iframe[title="Design Playground Preview"]');
const frame = await iframeEl.contentFrame();
await frame.waitForLoadState('domcontentloaded');
await p.waitForTimeout(3500);

// Antes
await iframeEl.screenshot({ path: path.join(OUT, 'typo-vis-before.png') });
console.log('📸 typo-vis-before.png');

// Abrir Tipografía
await p.getByRole('button', { name: /^Tipografía$/ }).first().click();
await p.waitForTimeout(300);

// HACER LA TIPOGRAFÍA HUGE para que el cambio sea inequívoco
await setSlider(p, 'Font 3xl',  72);  // hero h1
await setSlider(p, 'Font 2xl',  56);
await setSlider(p, 'Font xl',   42);
await setSlider(p, 'Font lg',   30);
await setSlider(p, 'Font base', 22);
await setSlider(p, 'Font sm',   18);

await p.waitForTimeout(1500);

await iframeEl.screenshot({ path: path.join(OUT, 'typo-vis-after-big.png') });
console.log('📸 typo-vis-after-big.png  (todos los tokens mucho más grandes)');

// SHRINK
await setSlider(p, 'Font 3xl',  20);
await setSlider(p, 'Font 2xl',  18);
await setSlider(p, 'Font xl',   16);
await setSlider(p, 'Font lg',   14);
await setSlider(p, 'Font base', 12);
await setSlider(p, 'Font sm',   10);
await p.waitForTimeout(1500);

await iframeEl.screenshot({ path: path.join(OUT, 'typo-vis-after-small.png') });
console.log('📸 typo-vis-after-small.png (todos los tokens mucho más chicos)');

await b.close();
