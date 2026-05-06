/**
 * Visual diff — toma screenshot del iframe antes/después de cambiar teal,
 * y reporta cuántos píxeles cambiaron + lista los elementos que SÍ tienen
 * --color-teal aplicado.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const OUT = path.join(process.cwd(), 'tests', 'screenshots', 'design-playground');
fs.mkdirSync(OUT, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE_URL}/design-playground`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  const iframeEl = await page.waitForSelector('iframe[title="Design Playground Preview"]');
  const frame = await iframeEl.contentFrame();
  await frame.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3500);

  // Screenshot iframe ANTES
  const beforePath = path.join(OUT, 'before-teal.png');
  await iframeEl.screenshot({ path: beforePath });
  console.log(`📸 Antes: ${beforePath}`);

  // Inventario de elementos que usan colores Propyte
  const inventory = await frame.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const byColor = { teal: [], navy: [], aztec: [], amber: [], graphite: [] };
    const tealHex     = ['rgb(92, 224, 210)', '#5ce0d2'];
    const navyHex     = ['rgb(26, 47, 63)',   '#1a2f3f'];
    const aztecHex    = ['rgb(15, 25, 35)',   '#0f1923'];
    const amberHex    = ['rgb(245, 166, 35)', '#f5a623'];
    const graphiteHex = ['rgb(44, 44, 44)',   '#2c2c2c'];

    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.bottom < 0 || rect.right < 0) continue;
      const cs = getComputedStyle(el);
      const bg = cs.backgroundColor.toLowerCase();
      const fg = cs.color.toLowerCase();
      const tag = el.tagName.toLowerCase();
      const cls = (typeof el.className === 'string' ? el.className : '').slice(0, 60);

      const matches = (hexList) => hexList.some(h => bg.includes(h) || fg.includes(h));
      if (matches(tealHex))     byColor.teal.push({ tag, cls });
      if (matches(navyHex))     byColor.navy.push({ tag, cls });
      if (matches(aztecHex))    byColor.aztec.push({ tag, cls });
      if (matches(amberHex))    byColor.amber.push({ tag, cls });
      if (matches(graphiteHex)) byColor.graphite.push({ tag, cls });
    }
    return {
      teal:     byColor.teal.length,
      navy:     byColor.navy.length,
      aztec:    byColor.aztec.length,
      amber:    byColor.amber.length,
      graphite: byColor.graphite.length,
      sample:   byColor.teal.slice(0, 5),
    };
  });
  console.log('\n📊 Inventario de elementos visibles que usan colores Propyte:');
  console.log(`   Teal:     ${inventory.teal}`);
  console.log(`   Navy:     ${inventory.navy}`);
  console.log(`   Aztec:    ${inventory.aztec}`);
  console.log(`   Amber:    ${inventory.amber}`);
  console.log(`   Graphite: ${inventory.graphite}`);
  if (inventory.sample.length > 0) {
    console.log(`   Sample teal:`);
    inventory.sample.forEach((s) => console.log(`     <${s.tag}> ${s.cls}`));
  }

  // Cambiar teal a magenta brillante
  await page.evaluate(() => {
    const inp = document.querySelector('input[type="color"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(inp, '#ff00ff');
    inp.dispatchEvent(new Event('input',  { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(1500);

  // Re-inventariar después del cambio
  const inventoryAfter = await frame.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    let magentaCount = 0;
    const samples = [];
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const cs = getComputedStyle(el);
      const bg = cs.backgroundColor;
      if (bg === 'rgb(255, 0, 255)') {
        magentaCount++;
        if (samples.length < 8) {
          samples.push({
            tag: el.tagName.toLowerCase(),
            cls: (typeof el.className === 'string' ? el.className : '').slice(0, 80),
            visible: rect.top < 800 && rect.left < 1600,
            top: Math.round(rect.top),
          });
        }
      }
    }
    return { magentaCount, samples };
  });

  console.log(`\n🟣 Después de cambiar teal a magenta:`);
  console.log(`   Total elementos magenta: ${inventoryAfter.magentaCount}`);
  inventoryAfter.samples.forEach((s) =>
    console.log(`     ${s.visible ? '✓ visible' : '× off-screen'} top:${s.top} <${s.tag}> ${s.cls}`),
  );

  // Screenshot DESPUÉS
  const afterPath = path.join(OUT, 'after-teal.png');
  await iframeEl.screenshot({ path: afterPath });
  console.log(`📸 Después: ${afterPath}`);

  // Pixel diff comparison
  const before = fs.readFileSync(beforePath);
  const after = fs.readFileSync(afterPath);
  const same = before.equals(after);
  console.log(`\n${same ? '⚠️  Imágenes idénticas — el cambio NO es visible' : '✅ Imágenes distintas — algo cambió visualmente'}`);
  console.log(`   before: ${before.length} bytes / after: ${after.length} bytes`);

  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
