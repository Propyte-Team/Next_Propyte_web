#!/usr/bin/env node
/**
 * Audit Sprint 2 Ronda 2 — verifica BUG 1, OBS A, OBS B en tab Rentabilidad live
 */
import { chromium } from 'playwright';

const BASE = 'https://dev.propyte.com';
const DEV_SLUG = 'sample-azul-vivo-5a4e4a4e';
const results = [];
const push = (k, ok, note = '') => results.push({ k, ok: ok ? 'PASS' : 'FAIL', note });

async function run() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/es/desarrollos/${DEV_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click tab Rentabilidad
  const rentaTab = page.locator('button[role="tab"]', { hasText: /rentabilidad/i }).first();
  await rentaTab.click();
  await page.waitForTimeout(2500);

  const panel = await page.evaluate(() => {
    const p = document.querySelector('[role="tabpanel"]:not([hidden])');
    if (!p) return { err: 'no panel' };
    const text = p.innerText;
    const headings = Array.from(p.querySelectorAll('h2, h3, h4')).map(h => ({
      tag: h.tagName.toLowerCase(),
      text: h.textContent.trim(),
    }));
    return { text, headings };
  });

  // === BUG 1: cap=3.84% + rent=12,800 from precomputed trigger SQL ===
  push('BUG1-cap-3.84', /3\.84\s*%/.test(panel.text),
    /3\.84\s*%/.test(panel.text) ? '' : 'cap 3.84% not visible in panel');
  push('BUG1-rent-12800', /12[,.]?800/.test(panel.text),
    /12[,.]?800/.test(panel.text) ? '' : 'rent 12,800 not visible');
  push('BUG1-roi-8.84', /8\.84\s*%/.test(panel.text), '');
  // No mostrar 5.0% computed (puede aparecer en otro lado, validar)
  // Mas importante: la sección "Comparativa Residencial vs Vacacional" debería mostrar 3.84% no 5.0%

  // === OBS A: no duplicate "Análisis de Inversión", reemplazado por "Comparativa Residencial vs Vacacional" ===
  const aiHeadings = panel.headings.filter(h => /análisis\s*de\s*inversi[óo]n/i.test(h.text));
  push('OBS-A-no-duplicate-AnalisisInv', aiHeadings.length <= 1,
    `count=${aiHeadings.length} headings=${JSON.stringify(panel.headings.map(h => h.text))}`);
  const hasComparativa = panel.headings.some(h => /comparativa\s*residencial\s*vs\s*vacacional/i.test(h.text));
  push('OBS-A-comparativa-heading', hasComparativa, `headings=${JSON.stringify(panel.headings.map(h => h.text))}`);

  // === OBS B: FactorBar labels with "(factor)" ===
  const hasFactor = /(?:cap\s*rate|ocupaci[óo]n|precio\/renta|cobertura)\s*\(factor\)/i.test(panel.text);
  push('OBS-B-factor-labels', hasFactor, hasFactor ? '' : 'no "(factor)" suffix found');
  // Description "0-25 puntos cada"
  const has025 = /0[–—-]25\s*puntos\s*cada/i.test(panel.text);
  push('OBS-B-025-description', has025, has025 ? '' : 'no "0-25 puntos cada" description');

  // Capture screenshot
  await page.screenshot({ path: 'tests/screenshots/r2-rentabilidad.png', fullPage: false });
  // Also full panel
  await page.evaluate(() => {
    const p = document.querySelector('[role="tabpanel"]:not([hidden])');
    if (p) p.scrollIntoView();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/screenshots/r2-rentabilidad-full.png', fullPage: true });

  await b.close();

  console.log('\n=== AUDIT RONDA 2 RESULTS ===');
  for (const r of results) {
    console.log(`[${r.ok}] ${r.k}${r.note ? ' — ' + r.note : ''}`);
  }
  const pass = results.filter(r => r.ok === 'PASS').length;
  const fail = results.filter(r => r.ok === 'FAIL').length;
  console.log(`\n${pass} PASS / ${fail} FAIL`);
  console.log('\n=== Headings tab Rentabilidad ===');
  console.log(JSON.stringify(panel.headings, null, 2));
  console.log('\n=== Panel text excerpt (first 2KB) ===');
  console.log(panel.text.slice(0, 2000));
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(2); });
