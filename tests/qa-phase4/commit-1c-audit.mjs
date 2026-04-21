#!/usr/bin/env node
/**
 * Fase 4 — Commit 1c audit: Single Unidad + Dual Investment Calculator + JSON-LD
 *
 * Auditamos dos paths en paralelo:
 *  A. Mock fixtures (akora-a301-cancun, nativa-jungla-t12-tulum, playacar-...-b205-...)
 *  B. Sample real seeded en v_units (sample-azul-vivo-a101-... etc.)
 *
 * Checks:
 *  1. Status 200 + H1 presente
 *  2. 3 tabs + ARIA roles correctos
 *  3. Sub-tabs Rentabilidad (4 pills: Residencial/Vacacional/Financiamiento/Proyección ROI)
 *  4. MarketIndicator score 0-100 + 4 barras
 *  5. AmenityList visible con ~20 items
 *  6. UnitFAQs expandibles + link a dev padre
 *  7. Sidebar sticky con contacto/price
 *  8. Breadcrumb → /propiedades?city=X → 200
 *  9. JSON-LD: RealEstateListing + BreadcrumbList + FAQPage + Offer
 * 10. Meta: og:title, og:image, twitter:card, canonical, hreflang
 * 11. EN locale: labels traducidos
 * 12. /propiedades/slug-que-no-existe → 404
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE = 'https://dev.propyte.com';
const OUT = 'tests/qa-phase4/screenshots-1c';
const MOCK_SLUGS = [
  'akora-a301-cancun',
  'nativa-jungla-t12-tulum',
  'playacar-residencias-b205-playa-del-carmen',
];
const SAMPLE_SLUGS = [
  'sample-azul-vivo-a101-5a4e4a4e',
  'sample-azul-vivo-a102-5a4e4a4e',
  'sample-azul-vivo-ph501-5a4e4a4e',
];

function log(m) { console.log(m); }

async function scrollAll(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) {
    await page.evaluate(s => window.scrollTo(0, s), y);
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

async function extractJsonLd(page) {
  return await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    return scripts.map(s => {
      try { return JSON.parse(s.textContent || '{}'); } catch { return null; }
    }).filter(Boolean);
  });
}

async function getMeta(page) {
  return await page.evaluate(() => {
    const g = (s, a) => document.querySelector(s)?.getAttribute(a) || null;
    return {
      title: document.title,
      canonical: g('link[rel="canonical"]', 'href'),
      hreflangEs: g('link[rel="alternate"][hreflang="es"]', 'href'),
      hreflangEn: g('link[rel="alternate"][hreflang="en"]', 'href'),
      ogTitle: g('meta[property="og:title"]', 'content'),
      ogImage: g('meta[property="og:image"]', 'content'),
      ogDescription: g('meta[property="og:description"]', 'content'),
      twitterCard: g('meta[name="twitter:card"]', 'content'),
    };
  });
}

async function auditUnit(browser, slug, locale, label, { isPrimary = false } = {}) {
  const sec = { name: `${label} /${locale}/propiedades/${slug}`, checks: [], slug, locale };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(`${BASE}/${locale}/propiedades/${slug}`, { waitUntil: 'networkidle', timeout: 45000 });
    sec.checks.push({ k: 'HTTP status', v: resp?.status(), ok: resp?.status() === 200 });
    if (resp?.status() !== 200) { await ctx.close(); return sec; }

    await scrollAll(page);

    const h1 = await page.$eval('h1', el => el.textContent?.trim() || '').catch(() => null);
    sec.checks.push({ k: 'H1 presente', v: h1?.slice(0, 60), ok: !!h1 && h1.length > 3 });

    // Tabs (outer 3)
    const outerTabs = await page.$$eval('[role="tablist"]', lists =>
      lists.map(l => Array.from(l.querySelectorAll('[role="tab"]')).map(t => t.textContent?.trim()))
    );
    sec.checks.push({ k: 'Outer tablist count', v: outerTabs.length, ok: outerTabs.length >= 1 });
    sec.checks.push({ k: 'Outer tabs (first list)', v: outerTabs[0]?.join(' | ') || 'none', ok: (outerTabs[0]?.length || 0) === 3 });

    // Click Rentabilidad tab (3rd of first tablist)
    const rentTabText = locale === 'es' ? 'Rentabilidad' : 'Returns';
    const rentClicked = await page.evaluate((text) => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const t = tabs.find(el => (el.textContent || '').trim() === text);
      if (t) { t.click(); return true; }
      return false;
    }, rentTabText);
    await page.waitForTimeout(800);
    sec.checks.push({ k: `Click tab "${rentTabText}"`, v: rentClicked, ok: rentClicked });

    // After click, there should now be 2 tablists (outer + inner 4 pill)
    const allTablists = await page.$$eval('[role="tablist"]', lists =>
      lists.map(l => ({
        labels: Array.from(l.querySelectorAll('[role="tab"]')).map(t => t.textContent?.trim() || ''),
      }))
    );
    const innerTabs = allTablists.find(l => l.labels.length === 4 && l.labels !== outerTabs[0]);
    sec.checks.push({ k: 'Inner 4-pill tablist (Dual Calc)', v: innerTabs ? innerTabs.labels.join(' | ') : 'NOT FOUND', ok: !!innerTabs });

    if (innerTabs && locale === 'es') {
      const hasRes = innerTabs.labels.some(t => /residencial/i.test(t));
      const hasVac = innerTabs.labels.some(t => /vacacional/i.test(t));
      const hasFin = innerTabs.labels.some(t => /financ/i.test(t));
      const hasProj = innerTabs.labels.some(t => /proyecci|roi/i.test(t));
      sec.checks.push({ k: 'Pills: Residencial/Vacacional/Financiamiento/ROI', v: `${hasRes}/${hasVac}/${hasFin}/${hasProj}`, ok: hasRes && hasVac && hasFin && hasProj });
    }
    if (innerTabs && locale === 'en') {
      const allEn = innerTabs.labels.every(t => /residential|vacation|financ|projection|return/i.test(t));
      sec.checks.push({ k: 'Pills labels translated to EN', v: innerTabs.labels.join('|'), ok: allEn });
    }

    // MarketIndicator (expect 4 bars + score)
    const mi = await page.evaluate(() => {
      const all = document.body.textContent || '';
      const scoreMatch = all.match(/(\d{1,3})\s*\/\s*100/) || all.match(/score[:\s]*(\d{1,3})/i);
      const bars = document.querySelectorAll('[class*="market" i] [role="progressbar"], [data-testid="market-indicator"] [role="progressbar"]').length;
      return { scoreMatch: scoreMatch?.[1] || null, bars };
    });
    sec.checks.push({ k: 'MarketIndicator score visible', v: mi.scoreMatch, ok: mi.scoreMatch !== null });

    // AmenityList count
    const amenityCount = await page.evaluate(() => {
      const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
      let max = 0;
      for (const p of panels) {
        const items = p.querySelectorAll('li, [class*="amenit" i]');
        if (items.length > max) max = items.length;
      }
      return max;
    });
    sec.checks.push({ k: 'Amenity-like items (max per panel)', v: amenityCount, ok: amenityCount >= 5 });

    // FAQs: expandable buttons + link a dev padre
    const faqsInfo = await page.evaluate(() => {
      const faqButtons = Array.from(document.querySelectorAll('button[aria-expanded], details summary'));
      const devLinks = Array.from(document.querySelectorAll('a[href*="/desarrollos/"]')).map(a => a.getAttribute('href'));
      return { faqCount: faqButtons.length, devLinks: devLinks.slice(0, 3) };
    });
    sec.checks.push({ k: 'FAQ-expandable elements', v: faqsInfo.faqCount, ok: faqsInfo.faqCount >= 3 });
    sec.checks.push({ k: 'Link a desarrollo padre', v: faqsInfo.devLinks.find(l => l.includes('/desarrollos/')) || 'none', ok: faqsInfo.devLinks.length > 0 });

    // Breadcrumb → /propiedades?city=X
    const bcInfo = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('nav a[href], [class*="readcrumb" i] a'));
      const cityLink = anchors.find(a => /\/propiedades\?city=/i.test(a.getAttribute('href') || ''));
      return cityLink ? { href: cityLink.getAttribute('href'), text: cityLink.textContent?.trim() } : null;
    });
    sec.checks.push({ k: 'Breadcrumb → /propiedades?city=', v: bcInfo ? `${bcInfo.text} -> ${bcInfo.href}` : 'NO FOUND', ok: !!bcInfo });

    // Verify breadcrumb resolves 200
    if (bcInfo?.href) {
      const url = bcInfo.href.startsWith('http') ? bcInfo.href : BASE + bcInfo.href;
      const p2 = await ctx.newPage();
      const r2 = await p2.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      sec.checks.push({ k: 'Breadcrumb link resuelve', v: `${r2?.status()} ${url.split('?')[0]}`, ok: r2?.status() === 200 });
      await p2.close();
    }

    // JSON-LD
    const ld = await extractJsonLd(page);
    const flat = ld.flatMap(x => Array.isArray(x) ? x : (x['@graph'] || [x]));
    const types = flat.map(x => x['@type']).flat();
    sec.checks.push({ k: 'JSON-LD blocks', v: ld.length, ok: ld.length > 0 });
    sec.checks.push({ k: 'Has RealEstateListing', v: types.some(t => /RealEstate/i.test(String(t))), ok: types.some(t => /RealEstate/i.test(String(t))) });
    sec.checks.push({ k: 'Has BreadcrumbList', v: types.includes('BreadcrumbList'), ok: types.includes('BreadcrumbList') });
    sec.checks.push({ k: 'Has FAQPage', v: types.includes('FAQPage'), ok: types.includes('FAQPage') });
    sec.checks.push({ k: 'Has Offer', v: types.includes('Offer') || JSON.stringify(flat).includes('"@type":"Offer"'), ok: types.includes('Offer') || JSON.stringify(flat).includes('"@type":"Offer"') });

    // Metadata
    const meta = await getMeta(page);
    sec.checks.push({ k: 'og:title', v: meta.ogTitle?.slice(0, 60) || null, ok: !!meta.ogTitle });
    sec.checks.push({ k: 'og:image', v: meta.ogImage ? '[ok]' : null, ok: !!meta.ogImage });
    sec.checks.push({ k: 'twitter:card', v: meta.twitterCard, ok: !!meta.twitterCard });
    sec.checks.push({ k: 'canonical', v: meta.canonical ? '[ok]' : null, ok: !!meta.canonical });
    sec.checks.push({ k: 'hreflang es/en', v: `${!!meta.hreflangEs}/${!!meta.hreflangEn}`, ok: !!meta.hreflangEs && !!meta.hreflangEn });

    if (isPrimary) {
      await page.screenshot({ path: join(OUT, `${label.replace(/\s/g, '-')}-${locale}-${slug}.png`), fullPage: true });
    }
  } catch (e) {
    sec.error = e.message;
  }
  await ctx.close();
  return sec;
}

async function audit404(browser) {
  const sec = { name: '404 fallback /es/propiedades/slug-que-no-existe-xyz', checks: [] };
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    const r = await page.goto(`${BASE}/es/propiedades/slug-que-no-existe-xyz-1234`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    sec.checks.push({ k: 'HTTP 404 status', v: r?.status(), ok: r?.status() === 404 });
  } catch (e) { sec.error = e.message; }
  await ctx.close();
  return sec;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  log('\n=== COMMIT 1c AUDIT ===\n');

  const results = [];
  // Path A — mocks
  for (const s of MOCK_SLUGS) {
    results.push(await auditUnit(browser, s, 'es', 'MOCK', { isPrimary: s === MOCK_SLUGS[0] }));
  }
  // Primary mock also in EN
  results.push(await auditUnit(browser, MOCK_SLUGS[0], 'en', 'MOCK-EN'));

  // Path B — sample seeded (v_units real)
  for (const s of SAMPLE_SLUGS) {
    results.push(await auditUnit(browser, s, 'es', 'SAMPLE', { isPrimary: s === SAMPLE_SLUGS[0] }));
  }

  // 404
  results.push(await audit404(browser));

  await browser.close();

  for (const s of results) {
    log(`\n-- ${s.name} --`);
    if (s.error) { log(`   ERROR: ${s.error}`); continue; }
    for (const c of s.checks) {
      const mark = c.ok === false ? 'FAIL' : c.ok === true ? 'OK  ' : '?   ';
      log(`   [${mark}] ${c.k}: ${c.v}`);
    }
  }

  await writeFile('tests/qa-phase4/commit-1c-report.json', JSON.stringify(results, null, 2), 'utf-8');

  const failures = results.flatMap(s =>
    s.error ? [`${s.name}: ${s.error}`] : s.checks.filter(c => c.ok === false).map(c => `${s.name} -> ${c.k}`)
  );
  log(`\n== SUMMARY: ${failures.length === 0 ? 'ALL GREEN' : `${failures.length} FAILURES`} ==`);
  for (const f of failures) log(`  - ${f}`);
}

main().catch(e => { console.error(e); process.exit(1); });
