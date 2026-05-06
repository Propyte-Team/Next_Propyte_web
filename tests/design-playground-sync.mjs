/**
 * Playwright E2E — Design Playground real-time sync
 *
 * Verifica que cambiar un token en el panel se refleja en vivo en el iframe.
 *
 * Uso:
 *   1. Servidor corriendo: npm run dev (o npm run start)
 *   2. node tests/design-playground-sync.mjs
 *      (BASE_URL=http://localhost:3000 por default; ajusta si usas otro puerto)
 *
 * Reporta paso a paso:
 *   - Carga del playground
 *   - Carga del iframe (/es)
 *   - Detección del TokenSyncListener
 *   - Estado inicial del CSS var --color-teal en el iframe
 *   - Cambio de token vía picker → re-lectura del CSS var
 *   - Verifica que el var cambió de hex
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUT_DIR  = path.join(process.cwd(), 'tests', 'screenshots', 'design-playground');
fs.mkdirSync(OUT_DIR, { recursive: true });

const results = [];
function check(label, ok, detail = '') {
  results.push({ label, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

async function run() {
  console.log(`\n=== Design Playground Sync — ${BASE_URL}/design-playground ===\n`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();

  // Capture console logs from main page + iframe
  const logs = [];
  page.on('console', (msg) => {
    const t = msg.type();
    const text = msg.text();
    if (text.includes('[Propyte Playground]') || text.includes('TokenSyncListener')) {
      logs.push(`[${t}] ${text}`);
    }
  });
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));

  // ── 1. Navegar al playground ────────────────────────────────────────────
  await page.goto(`${BASE_URL}/design-playground`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  check('Playground responde 200', page.url().includes('/design-playground'));

  await page.screenshot({ path: path.join(OUT_DIR, '01-playground-loaded.png'), fullPage: false });

  // ── 2. Esperar iframe ────────────────────────────────────────────────────
  const iframeEl = await page.waitForSelector('iframe[title="Design Playground Preview"]', { timeout: 10000 });
  check('Iframe presente', !!iframeEl);

  // Esperar a que el iframe termine de cargar /es
  const frame = await iframeEl.contentFrame();
  if (!frame) {
    check('Iframe contentFrame accesible', false);
    await browser.close();
    return;
  }
  check('Iframe contentFrame accesible', true);

  await frame.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500); // hidratación del iframe

  // ── 3. Leer estado inicial de --color-teal ──────────────────────────────
  const initialTeal = await frame.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-teal').trim(),
  );
  check('--color-teal inicial leído', !!initialTeal, initialTeal);

  // ── 4. Cambiar el color teal en el playground ───────────────────────────
  // El input de color para "Teal (primary)" — primer input type=color en el panel de colors
  const tealInput = await page.locator('input[type="color"]').first();
  const tealCount = await tealInput.count();
  check('Input de color teal accesible', tealCount > 0);

  if (tealCount > 0) {
    // Cambiar a magenta brillante para que el cambio sea inequívoco
    const NEW_HEX = '#ff00ff';
    await page.evaluate((hex) => {
      const inp = document.querySelector('input[type="color"]');
      if (!inp) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(inp, hex);
      inp.dispatchEvent(new Event('input',  { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    }, NEW_HEX);

    await page.waitForTimeout(800);

    // Re-leer --color-teal
    const newTeal = await frame.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-teal').trim(),
    );
    check('--color-teal cambió post-input', newTeal !== initialTeal, `${initialTeal} → ${newTeal}`);

    const expectedMatch = newTeal.toLowerCase().includes('ff00ff') || newTeal.toLowerCase() === '#ff00ff';
    check('--color-teal === #ff00ff (esperado)', expectedMatch, newTeal);

    // ── 5. Verificar que un elemento real con bg-teal cambió ──────────────
    const tealElementColor = await frame.evaluate(() => {
      // Encuentra cualquier elemento que use bg-teal o color teal
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const cs = getComputedStyle(el);
        const bg = cs.backgroundColor;
        // rgb(255, 0, 255) === #ff00ff
        if (bg === 'rgb(255, 0, 255)') {
          return { found: true, tag: el.tagName, classes: el.className, bg };
        }
      }
      return { found: false };
    });
    check(
      'Elemento real con bg-teal pintó magenta',
      tealElementColor.found,
      JSON.stringify(tealElementColor),
    );

    await page.screenshot({ path: path.join(OUT_DIR, '02-after-color-change.png'), fullPage: false });
  }

  // ── 6. Test typography token (font-size base) ───────────────────────────
  // Abrir la sección Tipografía
  const typoButton = page.getByRole('button', { name: /^Tipografía$/ }).first();
  if (await typoButton.count()) {
    await typoButton.click();
    await page.waitForTimeout(300);

    const initialFsBase = await frame.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--fs-base').trim(),
    );
    check('--fs-base inicial leído', !!initialFsBase, initialFsBase);

    // Cambiar el slider de "Font base" — buscamos el input numeric label "Font base"
    await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('button'));
      const fontBaseLabel = labels.find((b) => b.textContent === 'Font base');
      if (!fontBaseLabel) return;
      const wrapper = fontBaseLabel.closest('.group');
      const numberInput = wrapper?.querySelector('input[type="number"]');
      if (!numberInput) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(numberInput, '24');
      numberInput.dispatchEvent(new Event('input',  { bubbles: true }));
      numberInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.waitForTimeout(500);
    const newFsBase = await frame.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--fs-base').trim(),
    );
    check('--fs-base cambió a 24px', newFsBase === '24px', `${initialFsBase} → ${newFsBase}`);
  }

  // ── Logs capturados ─────────────────────────────────────────────────────
  console.log('\n--- Console logs capturados ---');
  if (logs.length === 0) console.log('(ninguno)');
  for (const l of logs.slice(0, 30)) console.log('  ' + l);

  // Resumen
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== Resumen: ${passed}/${results.length} OK ===`);
  if (failed.length > 0) {
    console.log('Fallos:');
    failed.forEach((f) => console.log(`  ❌ ${f.label} — ${f.detail}`));
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'results.json'),
    JSON.stringify({ passed, total: results.length, results, logs }, null, 2),
  );

  await browser.close();
  return failed.length === 0;
}

run().then((ok) => process.exit(ok ? 0 : 1)).catch((e) => {
  console.error(e);
  process.exit(2);
});
