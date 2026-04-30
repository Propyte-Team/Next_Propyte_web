#!/usr/bin/env node
/**
 * Auditoría completa de la sesión — verifica Sprint WCAG R1+R2 + Sprint 2/3 +
 * mis CI fixes (lockfile + lint) en runtime live + regression checks.
 */
import { chromium } from 'playwright';

const BASE = 'https://dev.propyte.com';
const DEV_SLUG = 'sample-azul-vivo-5a4e4a4e';
const results = [];
const push = (k, ok, note = '') => results.push({ k, ok: ok ? 'PASS' : 'FAIL', note });

async function run() {
  const b = await chromium.launch();

  // === SPRINT WCAG R2 — TradicionalTab table cell colors (live, requires tab click) ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es/mercado`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);

    // Click "Tradicional" tab if not active
    const tradTab = page.locator('button[role="tab"]', { hasText: /tradicional/i }).first();
    if (await tradTab.count() > 0) {
      await tradTab.click();
      await page.waitForTimeout(2500);
    }

    const colors = await page.evaluate(() => {
      const html = document.body.innerHTML;
      return {
        green700: (html.match(/#15803D/g) || []).length,
        red700: (html.match(/#B91C1C/g) || []).length,
        oldGreen: (html.match(/text-\[#22C55E\]/g) || []).length,
        oldRed: (html.match(/text-\[#EF4444\]/g) || []).length,
      };
    });
    push('WCAG-R2-TradicionalTab', colors.green700 > 0 || colors.red700 > 0, JSON.stringify(colors));
    await ctx.close();
  }

  // === MY FIX: useMediaQuery con useSyncExternalStore en runtime ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    // Si useMediaQuery se rompió, errores en console
    const consoleErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(800);
    push('useMediaQuery-no-runtime-errors', consoleErrors.length === 0,
      consoleErrors.length ? consoleErrors[0] : '');
    await ctx.close();
  }

  // === MY FIX: Tabs setState-during-render pattern ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
    await page.goto(`${BASE}/es/desarrollos/${DEV_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    // Click between tabs
    const tabs = await page.$$('button[role="tab"]');
    for (const t of tabs.slice(0, 3)) {
      try { await t.click({ timeout: 1000 }); await page.waitForTimeout(400); } catch {}
    }
    push('Tabs-no-runtime-errors', consoleErrors.length === 0,
      consoleErrors.length ? consoleErrors[0] : `${tabs.length} tabs clicked`);
    await ctx.close();
  }

  // === MY FIX: useFilters setState-during-render con searchParams ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
    await page.goto(`${BASE}/es/desarrollos`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    // Apply a filter (URL change)
    await page.goto(`${BASE}/es/desarrollos?city=Tulum`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    push('useFilters-no-runtime-errors', consoleErrors.length === 0,
      consoleErrors.length ? consoleErrors[0] : '');
    await ctx.close();
  }

  // === ShareDownloadModal Esc cierra (e7a4e71) ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es/desarrollos/${DEV_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const compartirBtn = page.locator('button', { hasText: /comparti|share/i }).first();
    if (await compartirBtn.count() > 0) {
      await compartirBtn.click();
      await page.waitForTimeout(400);
      const beforeEsc = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button[aria-expanded]')).find(b => /comparti|share/i.test(b.textContent || ''));
        return btn?.getAttribute('aria-expanded');
      });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      const afterEsc = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button[aria-expanded]')).find(b => /comparti|share/i.test(b.textContent || ''));
        return btn?.getAttribute('aria-expanded');
      });
      push('Esc-closes-dropdown-fixed', beforeEsc === 'true' && afterEsc === 'false',
        `before=${beforeEsc} after=${afterEsc}`);
    } else {
      push('Esc-closes-dropdown-fixed', false, 'btn not found');
    }
    await ctx.close();
  }

  // === Sprint 2 — AZUL VIVO Rentabilidad cap+rent visible ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es/desarrollos/${DEV_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const rentaTab = page.locator('button[role="tab"]', { hasText: /rentabilidad/i }).first();
    await rentaTab.click();
    await page.waitForTimeout(2500);
    const text = await page.evaluate(() => document.querySelector('[role="tabpanel"]:not([hidden])')?.innerText || '');
    push('AZUL-cap-rate-3.8', /3\.8\s*%/.test(text), '');
    push('AZUL-rent-12800', /12[,.]?800/.test(text), '');
    const fullHtml = await page.content();
    push('AZUL-roi-8.84', /8\.84/.test(fullHtml), '');
    await ctx.close();
  }

  // === Sprint 3 i18n — 4 rutas en /es y /en sin keys crudas ===
  for (const path of ['/desarrollos', '/propiedades', '/unete', '/financiamiento']) {
    for (const locale of ['es', 'en']) {
      const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/${locale}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);
      const text = await page.evaluate(() => document.querySelector('main')?.innerText || '');
      // detect i18n keys: dot.notation lowercased + camelCase
      const keys = (text.match(/\b[a-z][a-zA-Z0-9]*\.[a-zA-Z][a-zA-Z0-9]+(?:\.[a-zA-Z][a-zA-Z0-9]+)?\b/g) || [])
        .filter(s => !/\.(com|mx|png|jpg|svg)$/.test(s))
        .filter(s => /[A-Z]/.test(s));
      push(`i18n-${locale}${path}`, keys.length === 0, keys.length ? keys.slice(0,3).join(',') : '');
      await ctx.close();
    }
  }

  // === Regression check: my lint fixes didn't break any page ===
  for (const path of ['/es', '/en', '/es/desarrollos', '/es/propiedades', '/es/mercado', '/es/built',
                     '/es/blog', '/es/unete', '/es/financiamiento', '/es/contacto']) {
    const ctx = await b.newContext();
    const page = await ctx.newPage();
    const r = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    push(`HTTP-${path}`, r?.ok(), `status=${r?.status()}`);
    await ctx.close();
  }

  await b.close();

  console.log('\n=== AUDIT RESULTS ===');
  for (const r of results) console.log(`[${r.ok}] ${r.k}${r.note ? ' — ' + r.note : ''}`);
  const pass = results.filter(r => r.ok === 'PASS').length;
  const fail = results.filter(r => r.ok === 'FAIL').length;
  console.log(`\n${pass} PASS / ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(2); });
