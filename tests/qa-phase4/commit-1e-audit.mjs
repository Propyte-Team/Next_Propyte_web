#!/usr/bin/env node
/**
 * Fase 4 — Commit 1e audit: SimilarListings + 3 fixes (availability i18n, tabGeo ES, developer card)
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE = 'https://dev.propyte.com';
const OUT = 'tests/qa-phase4/screenshots-1e';
const SAMPLE_DEV = 'sample-azul-vivo-5a4e4a4e';
const REAL_DEV = 'akora-residencial-b73b319b';
const REAL_UNIT = 'akora-a301-cancun';

async function scrollAll(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(300); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

async function hitTwice(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1500);
}

async function auditDev(browser, slug, locale, label) {
  const sec = { name: `${label} /${locale}/desarrollos/${slug}`, checks: [] };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await hitTwice(page, `${BASE}/${locale}/desarrollos/${slug}`);
    await scrollAll(page);

    // Ensure Descripción/Overview tab active
    const descLabel = locale === 'es' ? 'Descripción' : 'Overview';
    await page.evaluate((lbl) => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const t = tabs.find(el => (el.textContent || '').trim() === lbl);
      if (t) t.click();
    }, descLabel);
    await page.waitForTimeout(600);

    // FIX 1: ES tab "Ubicación" (era "Análisis Geográfico")
    const tabs = await page.$$eval('[role="tab"]', els => els.map(e => e.textContent?.trim()));
    const expectedES = ['Descripción', 'Ubicación', 'Rentabilidad'];
    const expectedEN = ['Overview', 'Location', 'Returns'];
    const expected = locale === 'es' ? expectedES : expectedEN;
    const tabsMatch = expected.every(l => tabs.includes(l));
    sec.checks.push({ k: `Tabs match ${locale} scheme ${expected.join('/')}`, v: tabs.slice(0, 3).join(' | '), ok: tabsMatch });

    // Full body text for analysis
    const bodyText = await page.evaluate(() => document.body.textContent || '');

    // FIX 2: availability.reservado/vendido i18n (no more literal keys)
    const hasLiteralReservado = /availability\.reservado/.test(bodyText);
    const hasLiteralVendido = /availability\.vendido/.test(bodyText);
    sec.checks.push({ k: 'NO literal key "availability.reservado"', v: !hasLiteralReservado, ok: !hasLiteralReservado });
    sec.checks.push({ k: 'NO literal key "availability.vendido"', v: !hasLiteralVendido, ok: !hasLiteralVendido });
    const hasReservadoLabel = /Reservado|Reserved/.test(bodyText);
    const hasVendidoLabel = /Vendido|Sold/.test(bodyText);
    sec.checks.push({ k: 'Label "Reservado/Reserved" renders', v: hasReservadoLabel, ok: hasReservadoLabel });
    sec.checks.push({ k: 'Label "Vendido/Sold" renders', v: hasVendidoLabel, ok: hasVendidoLabel });

    // FIX 3: Developer card renders
    const headings = await page.$$eval('h2, h3, h4', els => els.map(e => e.textContent?.trim()));
    const hasDevHeading = headings.some(h => /desarrollad|developer/i.test(h || ''));
    sec.checks.push({ k: 'Developer card heading present', v: headings.find(h => /desarrollad|developer/i.test(h || '')) || 'NO FOUND', ok: hasDevHeading });
    const hasAvica = /Avica/i.test(bodyText);
    sec.checks.push({ k: 'Mentions "Avica" (expected on sample)', v: hasAvica, ok: slug === SAMPLE_DEV ? hasAvica : true });

    // SimilarListings component check
    const similarInfo = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2, h3'));
      const similar = h2s.find(h => /similar|m[áa]s desarrollos|más propiedades|more development|similar listings|propiedades similares/i.test(h.textContent || ''));
      const nearby = Array.from(document.querySelectorAll('[aria-label*="imilar" i], [aria-label*="imilar" i]')).length;
      return { similarHeading: similar?.textContent?.trim() || null, similarByAria: nearby };
    });
    sec.checks.push({ k: 'Similar section heading', v: similarInfo.similarHeading, ok: !!similarInfo.similarHeading });

    if (slug === SAMPLE_DEV && locale === 'es') {
      await page.screenshot({ path: join(OUT, `dev-${slug}.png`), fullPage: true });
    }
  } catch (e) { sec.error = e.message; }
  await ctx.close();
  return sec;
}

async function auditUnit(browser, slug, locale, label) {
  const sec = { name: `${label} /${locale}/propiedades/${slug}`, checks: [] };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await hitTwice(page, `${BASE}/${locale}/propiedades/${slug}`);
    await scrollAll(page);
    const bodyText = await page.evaluate(() => document.body.textContent || '');

    // SimilarListings aria-label check (commit note: aria-label="Propiedades similares")
    const similarAria = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('[aria-label]'));
      return els.map(el => el.getAttribute('aria-label')).filter(a => /similar|propiedades similares/i.test(a || ''));
    });
    sec.checks.push({ k: 'aria-label="Propiedades similares" (o similar)', v: similarAria.join(' | ') || 'NO FOUND', ok: similarAria.length > 0 });

    // availability keys check on unit page (should NOT have literals)
    const hasLiteralR = /availability\.reservado/.test(bodyText);
    const hasLiteralV = /availability\.vendido/.test(bodyText);
    sec.checks.push({ k: 'NO literal availability keys', v: !hasLiteralR && !hasLiteralV, ok: !hasLiteralR && !hasLiteralV });
  } catch (e) { sec.error = e.message; }
  await ctx.close();
  return sec;
}

async function auditDebugEndpoint(browser) {
  const sec = { name: 'Debug endpoint removido', checks: [] };
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    const r = await page.goto(`${BASE}/api/debug-temp/dev-fields`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    sec.checks.push({ k: 'HTTP 404', v: r?.status(), ok: r?.status() === 404 });
  } catch (e) { sec.error = e.message; }
  await ctx.close();
  return sec;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  console.log('\n=== COMMIT 1e AUDIT ===\n');
  const results = [];
  results.push(await auditDev(browser, SAMPLE_DEV, 'es', 'SAMPLE-ES'));
  results.push(await auditDev(browser, SAMPLE_DEV, 'en', 'SAMPLE-EN'));
  results.push(await auditDev(browser, REAL_DEV, 'es', 'REAL-ES'));
  results.push(await auditUnit(browser, REAL_UNIT, 'es', 'UNIT-ES'));
  results.push(await auditDebugEndpoint(browser));
  await browser.close();

  for (const s of results) {
    console.log(`\n-- ${s.name} --`);
    if (s.error) { console.log(`   ERROR: ${s.error}`); continue; }
    for (const c of s.checks) {
      const mark = c.ok === false ? 'FAIL' : c.ok === true ? 'OK  ' : '?   ';
      console.log(`   [${mark}] ${c.k}: ${c.v}`);
    }
  }

  await writeFile('tests/qa-phase4/commit-1e-report.json', JSON.stringify(results, null, 2), 'utf-8');
  const failures = results.flatMap(s => s.error ? [`${s.name}: ${s.error}`] : s.checks.filter(c => c.ok === false).map(c => `${s.name} -> ${c.k}`));
  console.log(`\n== SUMMARY: ${failures.length === 0 ? 'ALL GREEN' : `${failures.length} FAILURES`} ==`);
  for (const f of failures) console.log(`  - ${f}`);
}

main().catch(e => { console.error(e); process.exit(1); });
