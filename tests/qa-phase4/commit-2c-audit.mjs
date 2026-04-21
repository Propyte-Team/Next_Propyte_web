#!/usr/bin/env node
/**
 * Fase 4 — Commit 2c audit: GeoAnalysis + AirdnaInsights + MarketSentiment + CetesComparison
 * Commit 98ee3c8. Tabs primitive solo SSRiza tab activa → requiere click real.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE = 'https://dev.propyte.com';
const OUT = 'tests/qa-phase4/screenshots-2c';

const DEV_URLS = [
  { path: '/es/desarrollos/akora-residencial-b73b319b', label: 'akora-es', locale: 'es' },
  { path: '/en/desarrollos/akora-residencial-b73b319b', label: 'akora-en', locale: 'en' },
  { path: '/es/desarrollos/sample-azul-vivo-5a4e4a4e', label: 'sample-es', locale: 'es' },
];

async function clickTab(page, locale, whichTab) {
  const labels = {
    es: { geo: 'Ubicación', ret: 'Rentabilidad' },
    en: { geo: 'Location', ret: 'Returns' },
  };
  const target = labels[locale][whichTab];
  const clicked = await page.evaluate((lbl) => {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const t = tabs.find(el => (el.textContent || '').trim() === lbl);
    if (t) { t.click(); return true; }
    return false;
  }, target);
  await page.waitForTimeout(900); // allow content to hydrate + recharts to mount
  return { target, clicked };
}

async function auditDev(browser, url, label, locale) {
  const sec = { name: `DEV ${label}`, checks: [] };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 45000 });
    sec.checks.push({ k: 'HTTP 200', v: resp?.status(), ok: resp?.status() === 200 });
    await page.waitForTimeout(1500);

    // Verificar tabs presentes
    const tabs = await page.$$eval('[role="tab"]', els => els.map(e => e.textContent?.trim()));
    sec.checks.push({ k: 'Tabs ES/EN esperadas', v: tabs.slice(0, 3).join(' | '), ok: tabs.length >= 3 });

    // -------- TAB GEO --------
    const geo = await clickTab(page, locale, 'geo');
    sec.checks.push({ k: `Click tab "${geo.target}"`, v: geo.clicked, ok: geo.clicked });

    if (geo.clicked) {
      // Scroll down para cargar el map iframe
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(1500);

      // Google Maps: iframe maps.google.com o google element
      const hasMap = await page.evaluate(() => {
        const iframes = Array.from(document.querySelectorAll('iframe'));
        const gmap = iframes.find(f => /google\.com\/maps/.test(f.src || ''));
        // @vis.gl / react-google-maps renderiza con google.maps JS API (no iframe)
        const gContainer = document.querySelector('[class*="gm-style"], [class*="google-map"], [aria-label*="Map"]');
        const canvas = document.querySelector('div[role="region"][aria-label]')?.getAttribute('aria-label') || '';
        return {
          iframe: !!gmap,
          container: !!gContainer,
          ariaRegion: canvas,
        };
      });
      sec.checks.push({ k: 'Google Map renderiza (iframe o gm-style container)', v: JSON.stringify(hasMap), ok: hasMap.iframe || hasMap.container });

      // Zone scores: 4 cards o grid con composite + componentes
      const zoneScores = await page.evaluate(() => {
        const text = document.body.textContent || '';
        const hasComposite = /composite|compuesta|compuesto|overall|general/i.test(text);
        // Buscar algo tipo "8.4/10" o "85/100" (zone score shape)
        const scoreMatches = (text.match(/\b\d{1,2}(?:\.\d)?\s*\/\s*(?:10|100)\b/g) || []).slice(0, 5);
        return { hasComposite, scoreMatches };
      });
      sec.checks.push({ k: 'Zone scores (X/10 o X/100) renderizan', v: zoneScores.scoreMatches.join(' | ') || 'NO', ok: zoneScores.scoreMatches.length >= 2 });

      // raw metrics (schools, walk score, etc.)
      const geoHeadings = await page.$$eval('h3, h4', els => els.map(e => (e.textContent || '').trim()).filter(t => t.length > 0));
      sec.checks.push({ k: 'Geo section headings', v: geoHeadings.slice(0, 6).join(' | '), ok: geoHeadings.length >= 2 });

      await page.screenshot({ path: join(OUT, `geo-${label}.png`), fullPage: false });
    }

    // -------- TAB RENTABILIDAD --------
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    const ret = await clickTab(page, locale, 'ret');
    sec.checks.push({ k: `Click tab "${ret.target}"`, v: ret.clicked, ok: ret.clicked });

    if (ret.clicked) {
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(1500);

      // AirdnaInsights: recharts SVG area chart
      const airdna = await page.evaluate(() => {
        const svgs = Array.from(document.querySelectorAll('svg'));
        const recharts = svgs.find(s => s.classList.contains('recharts-surface') || s.closest('.recharts-wrapper'));
        // KPI cards with % or $ values relevant to Airdna
        const text = document.body.textContent || '';
        const hasAdr = /adr|tarifa|daily rate/i.test(text);
        const hasOcc = /ocupaci[oó]n|occupancy/i.test(text);
        const hasListings = /listings|propiedades activas/i.test(text);
        return { chart: !!recharts, hasAdr, hasOcc, hasListings };
      });
      sec.checks.push({ k: 'AirdnaInsights recharts chart', v: `chart=${airdna.chart} adr=${airdna.hasAdr} occ=${airdna.hasOcc} lst=${airdna.hasListings}`, ok: airdna.chart && airdna.hasAdr && airdna.hasOcc });

      // MarketSentiment: 3 indicators (appreciation + demand + supply)
      const sentiment = await page.evaluate(() => {
        const text = document.body.textContent || '';
        const hasApprec = /plusval[ií]a|appreciation/i.test(text);
        const hasDemand = /demand|demanda/i.test(text);
        const hasSupply = /supply|oferta|inventory|inventario/i.test(text);
        // Look for directional arrows (↑ ↓ →) or badge words
        const hasDirectional = /[↑↓→]|al alza|a la baja|rising|falling|up|down|stable|estable/i.test(text);
        return { hasApprec, hasDemand, hasSupply, hasDirectional };
      });
      sec.checks.push({ k: 'MarketSentiment 3 indicadores + overall', v: JSON.stringify(sentiment), ok: sentiment.hasApprec && sentiment.hasDemand && sentiment.hasSupply });

      // CetesComparison
      const cetes = await page.evaluate(() => {
        const text = document.body.textContent || '';
        const hasCetes = /cetes/i.test(text);
        const hasBank = /banco|bank/i.test(text);
        const hasFv = /fv|valor futuro|future value|a 5 a[ñn]os|5\s*year|a 10 a[ñn]os|10\s*year/i.test(text);
        const hasIrr = /irr|tir/i.test(text);
        return { hasCetes, hasBank, hasFv, hasIrr };
      });
      sec.checks.push({ k: 'CetesComparison (CETES + banco + FV 5/10y + IRR)', v: JSON.stringify(cetes), ok: cetes.hasCetes && cetes.hasBank && cetes.hasFv });

      // IRR value akora
      if (label.startsWith('akora')) {
        const irrValues = await page.evaluate(() => {
          const text = document.body.textContent || '';
          // match "24.2%" patterns near IRR/TIR
          const matches = (text.match(/\b\d{1,2}\.\d%\b/g) || []).slice(0, 6);
          return matches;
        });
        const has242 = irrValues.some(v => /24\.\d%/.test(v));
        const has207 = irrValues.some(v => /20\.\d%/.test(v));
        sec.checks.push({ k: 'IRR akora 24.2% / 20.7% (5y/10y)', v: irrValues.join(' | '), ok: has242 && has207 });
      }

      await page.screenshot({ path: join(OUT, `ret-${label}.png`), fullPage: false });
    }
  } catch (e) { sec.error = e.message; }
  await ctx.close();
  return sec;
}

async function auditPdfGuards(browser) {
  const sec = { name: 'PDF defensive guards', checks: [] };
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const tests = [
    { q: '?slug=sample-azul-vivo-5a4e4a4e&kind=foo&locale=es', want: 400, label: 'kind=foo -> 400' },
    { q: '?slug=sample-azul-vivo-5a4e4a4e&kind=development&locale=xx', want: 400, label: 'locale=xx -> 400' },
    { q: '?kind=development&locale=es', want: 400, label: 'missing slug -> 400' },
    { q: '?slug=sample-azul-vivo-5a4e4a4e&kind=development&locale=es', want: 200, label: 'valid -> 200' },
  ];
  for (const t of tests) {
    try {
      const r = await page.request.get(`${BASE}/api/generate-pdf${t.q}`, { timeout: 60000 });
      sec.checks.push({ k: t.label, v: r.status(), ok: r.status() === t.want });
    } catch (e) { sec.checks.push({ k: t.label, v: e.message.slice(0, 60), ok: false }); }
  }
  await ctx.close();
  return sec;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  console.log('\n=== COMMIT 2c AUDIT (Geo + Returns tabs + micro-fix PDF) ===\n');
  const results = [];
  results.push(await auditPdfGuards(browser));
  for (const u of DEV_URLS) results.push(await auditDev(browser, u.path, u.label, u.locale));
  await browser.close();

  for (const s of results) {
    console.log(`\n-- ${s.name} --`);
    if (s.error) { console.log(`   ERROR: ${s.error}`); continue; }
    for (const c of s.checks) {
      const mark = c.ok === false ? 'FAIL' : c.ok === true ? 'OK  ' : '?   ';
      console.log(`   [${mark}] ${c.k}: ${c.v}`);
    }
  }

  await writeFile('tests/qa-phase4/commit-2c-report.json', JSON.stringify(results, null, 2), 'utf-8');
  const failures = results.flatMap(s => s.error ? [`${s.name}: ${s.error}`] : s.checks.filter(c => c.ok === false).map(c => `${s.name} -> ${c.k}: ${c.v}`));
  console.log(`\n== SUMMARY: ${failures.length === 0 ? 'ALL GREEN' : `${failures.length} FAILURES`} ==`);
  for (const f of failures) console.log(`  - ${f}`);
}

main().catch(e => { console.error(e); process.exit(1); });
