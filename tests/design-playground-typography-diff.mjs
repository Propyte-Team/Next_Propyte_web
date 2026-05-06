/**
 * Visual diff de tipografía: cambia fontSizeBase y verifica que elementos
 * con text-sm/text-lg/text-xl etc cambien de tamaño en el iframe.
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

  // Inventario inicial: medir font-size de elementos representativos
  const measureSamples = async () => frame.evaluate(() => {
    const samples = {};
    const selectors = {
      'h1':           'h1',
      'h2':           'h2',
      'p':            'p',
      'text-sm':      '.text-sm',
      'text-lg':      '.text-lg',
      'text-xl':      '.text-xl',
      'text-2xl':     '.text-2xl',
      'text-3xl':     '.text-3xl',
      'text-base':    '.text-base',
      'text-[10px]':  '.text-\\[10px\\]',
      'fw-bold':      '.font-bold',
    };
    for (const [k, sel] of Object.entries(selectors)) {
      try {
        const el = document.querySelector(sel);
        if (!el) { samples[k] = null; continue; }
        const cs = getComputedStyle(el);
        samples[k] = { fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily.slice(0, 20) };
      } catch { samples[k] = 'invalid-selector'; }
    }
    return samples;
  });

  const before = await measureSamples();
  console.log('\n📏 ANTES:');
  for (const [k, v] of Object.entries(before)) {
    console.log(`   ${k.padEnd(14)}: ${v ? `${v.fontSize} weight:${v.fontWeight}` : '(no element)'}`);
  }

  await iframeEl.screenshot({ path: path.join(OUT, 'typo-before.png') });

  // Cambiar fontSizeBase a 24px (default era 16) — abrir Tipografía y modificar
  // Desplegar la sección Tipografía
  const typoBtn = page.getByRole('button', { name: /^Tipografía$/ }).first();
  if (await typoBtn.count()) await typoBtn.click();
  await page.waitForTimeout(300);

  // Modificar el slider "Font base" → 24
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const fontBaseLabel = buttons.find((b) => b.textContent === 'Font base');
    if (!fontBaseLabel) { console.error('Font base label not found'); return; }
    const wrapper = fontBaseLabel.closest('.group');
    const numberInput = wrapper?.querySelector('input[type="number"]');
    if (!numberInput) { console.error('Font base input not found'); return; }
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(numberInput, '24');
    numberInput.dispatchEvent(new Event('input',  { bubbles: true }));
    numberInput.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // También subir Font 3xl para que los hero titles cambien
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const lbl = buttons.find((b) => b.textContent === 'Font 3xl');
    if (!lbl) return;
    const wrapper = lbl.closest('.group');
    const inp = wrapper?.querySelector('input[type="number"]');
    if (!inp) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(inp, '60');
    inp.dispatchEvent(new Event('input',  { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await page.waitForTimeout(1500);

  const after = await measureSamples();
  console.log('\n📏 DESPUÉS (fontSizeBase=24, fontSize3xl=60):');
  for (const [k, v] of Object.entries(after)) {
    const beforeV = before[k];
    const changed = beforeV && v && beforeV.fontSize !== v.fontSize;
    const arrow = changed ? '🟢 →' : '⚪';
    console.log(`   ${k.padEnd(14)}: ${beforeV?.fontSize ?? '?'} ${arrow} ${v?.fontSize ?? '?'}`);
  }

  await iframeEl.screenshot({ path: path.join(OUT, 'typo-after.png') });

  // Verificar el CSS var del iframe
  const fsBaseAfter = await frame.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--fs-base').trim(),
  );
  const textBaseAfter = await frame.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--text-base').trim(),
  );
  console.log(`\nIframe :root vars:`);
  console.log(`   --fs-base   = ${fsBaseAfter}`);
  console.log(`   --text-base = ${textBaseAfter} (Tailwind utility consume esto)`);

  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
