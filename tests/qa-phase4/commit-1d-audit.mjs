#!/usr/bin/env node
/**
 * Fase 4 — Commit 1d audit: DevelopmentDetailPage tab "Descripción" enriquecido
 *
 * Checks:
 *  1. 4 metric cards con datos reales (Precio desde / Disponibilidad / Entrega / ROI)
 *  2. Unit chips con rangos (recámaras, baños, área) derivados de units seeded
 *  3. AmenityList con íconos (SVG) + amenidades reales
 *  4. Brochure card con filename + CTA descarga
 *  5. Developer card con project count ("X proyecto(s)")
 *  6. VirtualTour + Video renderizan cuando URLs presentes
 *  7. EN consistency: /es y /en usan tabs equivalentes (ES: Descripción/Ubicación/Rentabilidad, EN: Overview/Location/Returns)
 *  8. /propiedades EN también usa Overview/Location/Returns (unificación confirmada)
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE = 'https://dev.propyte.com';
const OUT = 'tests/qa-phase4/screenshots-1d';
const SAMPLE_DEV = 'sample-azul-vivo-5a4e4a4e';
const REAL_DEV = 'akora-residencial-b73b319b';
const REAL_UNIT = 'akora-a301-cancun';

async function scrollAll(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) {
    await page.evaluate(s => window.scrollTo(0, s), y);
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

async function auditDev(browser, slug, locale, label) {
  const sec = { name: `${label} /${locale}/desarrollos/${slug}`, checks: [] };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(`${BASE}/${locale}/desarrollos/${slug}`, { waitUntil: 'networkidle', timeout: 45000 });
    sec.checks.push({ k: 'HTTP status', v: resp?.status(), ok: resp?.status() === 200 });
    if (resp?.status() !== 200) { await ctx.close(); return sec; }

    await scrollAll(page);

    // Ensure Descripción/Overview tab active
    const descLabel = locale === 'es' ? 'Descripción' : 'Overview';
    await page.evaluate((lbl) => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const t = tabs.find(el => (el.textContent || '').trim() === lbl);
      if (t) t.click();
    }, descLabel);
    await page.waitForTimeout(600);

    // Outer tabs
    const tabs = await page.$$eval('[role="tab"]', els => els.map(e => e.textContent?.trim()));
    sec.checks.push({ k: 'Tabs labels', v: tabs.join(' | '), ok: true });
    const expectedTabs = locale === 'es' ? ['Descripción', 'Ubicación', 'Rentabilidad'] : ['Overview', 'Location', 'Returns'];
    const matchTabs = expectedTabs.every(l => tabs.includes(l));
    sec.checks.push({ k: `Tabs match ${locale} scheme ${expectedTabs.join('/')}`, v: matchTabs, ok: matchTabs });

    // Scan active panel content
    const panel = await page.$eval('[role="tabpanel"]:not([hidden])', el => ({
      text: (el.textContent || '').slice(0, 4000),
      svgCount: el.querySelectorAll('svg').length,
      iframes: el.querySelectorAll('iframe').length,
      images: el.querySelectorAll('img').length,
      links: Array.from(el.querySelectorAll('a[href]')).map(a => ({ href: a.getAttribute('href'), text: (a.textContent || '').trim().slice(0, 40) })).slice(0, 15),
    })).catch(() => null);

    // 4 metric cards — check for the 4 expected labels
    const metricLabels = locale === 'es'
      ? ['Precio desde', 'Disponibilidad', 'Entrega', 'ROI']
      : ['Starting', 'Availability', 'Delivery', 'ROI'];
    for (const lbl of metricLabels) {
      const has = new RegExp(lbl, 'i').test(panel?.text || '');
      sec.checks.push({ k: `Metric card "${lbl}"`, v: has, ok: has });
    }

    // Unit chips — look for range patterns (X–Y rec, X–Y ba, X–Y m²)
    const chipPattern = /(\d+)\s*[–\-]\s*(\d+)\s*(rec|recámaras|bedrooms|bedroom|ba|bath|bathrooms|m²|sqm)/i;
    const hasChips = chipPattern.test(panel?.text || '');
    sec.checks.push({ k: 'Unit range chips (X–Y rec/ba/m²)', v: hasChips, ok: hasChips });

    // AmenityList — presence of "Amenidades"/"Amenities" word + ≥10 svg icons in panel (20 canonical expected but fallback OK)
    const amenityWord = /amenid|amenit/i.test(panel?.text || '');
    sec.checks.push({ k: 'Section "Amenidades/Amenities"', v: amenityWord, ok: amenityWord });
    sec.checks.push({ k: `SVG icons in panel (expect ≥10)`, v: panel?.svgCount, ok: (panel?.svgCount || 0) >= 10 });

    // Brochure card — look for "Brochure" or "Descargar/Download"
    const brochureMatch = /brochure|descargar|download/i.test(panel?.text || '');
    sec.checks.push({ k: 'Brochure/Download CTA', v: brochureMatch, ok: brochureMatch });
    const brochureLink = panel?.links.find(l => /brochure|\.pdf/i.test(l.href || ''));
    sec.checks.push({ k: 'Brochure link to PDF', v: brochureLink?.href || 'NO LINK', ok: !!brochureLink });

    // Developer card — "X proyecto(s)" pattern
    const projectCountMatch = (panel?.text || '').match(/(\d+)\s*(proyecto|project)s?/i);
    sec.checks.push({ k: 'Developer "X proyecto(s)"', v: projectCountMatch?.[0] || 'NO MATCH', ok: !!projectCountMatch });

    // VirtualTour (iframe) + Video (iframe or video element)
    const hasIframe = (panel?.iframes || 0) >= 1;
    sec.checks.push({ k: 'Iframe (VirtualTour/Video) present', v: panel?.iframes, ok: hasIframe });

    // Screenshot descripción tab
    await page.screenshot({ path: join(OUT, `dev-${locale}-${slug.slice(0, 20)}.png`), fullPage: true });
  } catch (e) {
    sec.error = e.message;
  }
  await ctx.close();
  return sec;
}

async function auditUnitEnConsistency(browser) {
  const sec = { name: 'EN consistency /propiedades (expect Overview/Location/Returns)', checks: [] };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    // ES tabs
    await page.goto(`${BASE}/es/propiedades/${REAL_UNIT}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    const esTabs = await page.$$eval('[role="tab"]', els => els.map(e => e.textContent?.trim()));
    sec.checks.push({ k: 'ES /propiedades tabs', v: esTabs.slice(0, 3).join(' | '), ok: ['Descripción', 'Ubicación', 'Rentabilidad'].every(l => esTabs.includes(l)) });

    // EN tabs
    await page.goto(`${BASE}/en/propiedades/${REAL_UNIT}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    const enTabs = await page.$$eval('[role="tab"]', els => els.map(e => e.textContent?.trim()));
    sec.checks.push({ k: 'EN /propiedades tabs', v: enTabs.slice(0, 3).join(' | '), ok: ['Overview', 'Location', 'Returns'].every(l => enTabs.includes(l)) });

    // EN desarrollos (should match)
    await page.goto(`${BASE}/en/desarrollos/${REAL_DEV}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    const enDevTabs = await page.$$eval('[role="tab"]', els => els.map(e => e.textContent?.trim()));
    sec.checks.push({ k: 'EN /desarrollos tabs', v: enDevTabs.slice(0, 3).join(' | '), ok: ['Overview', 'Location', 'Returns'].every(l => enDevTabs.includes(l)) });

    const unified = JSON.stringify(enTabs.slice(0, 3)) === JSON.stringify(enDevTabs.slice(0, 3));
    sec.checks.push({ k: 'EN tabs UNIFIED (desarrollos == propiedades)', v: unified, ok: unified });
  } catch (e) { sec.error = e.message; }
  await ctx.close();
  return sec;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  console.log('\n=== COMMIT 1d AUDIT ===\n');

  const results = [];
  results.push(await auditDev(browser, SAMPLE_DEV, 'es', 'SAMPLE'));
  results.push(await auditDev(browser, SAMPLE_DEV, 'en', 'SAMPLE-EN'));
  results.push(await auditDev(browser, REAL_DEV, 'es', 'REAL'));
  results.push(await auditUnitEnConsistency(browser));

  await browser.close();

  for (const s of results) {
    console.log(`\n-- ${s.name} --`);
    if (s.error) { console.log(`   ERROR: ${s.error}`); continue; }
    for (const c of s.checks) {
      const mark = c.ok === false ? 'FAIL' : c.ok === true ? 'OK  ' : '?   ';
      console.log(`   [${mark}] ${c.k}: ${c.v}`);
    }
  }

  await writeFile('tests/qa-phase4/commit-1d-report.json', JSON.stringify(results, null, 2), 'utf-8');

  const failures = results.flatMap(s =>
    s.error ? [`${s.name}: ${s.error}`] : s.checks.filter(c => c.ok === false).map(c => `${s.name} -> ${c.k}`)
  );
  console.log(`\n== SUMMARY: ${failures.length === 0 ? 'ALL GREEN' : `${failures.length} FAILURES`} ==`);
  for (const f of failures) console.log(`  - ${f}`);
}

main().catch(e => { console.error(e); process.exit(1); });
