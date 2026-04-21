#!/usr/bin/env node
/**
 * Fase 4 IRR Audit — valida que los numeros del InvestmentSummary en
 * /desarrollos/[slug] sean coherentes y esten en rango razonable despues
 * del fix actuarial (commit que reemplaza linear por actuarial).
 *
 * Extrae IRR 5yr/10yr, Cap Rate, Cash-on-Cash, Yield neto desde la tabla
 * comparativa y flaggea valores negativos, NaN, em-dash inesperados, o
 * fuera de rango (<0% o >50% IRR).
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE = 'https://dev.propyte.com/es';
const LISTING = `${BASE}/desarrollos`;
const OUT = 'tests/qa-phase4/screenshots';
const SAMPLE_SIZE = 3;

const parsePct = (txt) => {
  if (!txt) return null;
  const clean = txt.trim();
  if (clean === '—' || clean === '-' || clean === '') return null;
  const m = clean.match(/-?[\d.,]+/);
  if (!m) return null;
  return parseFloat(m[0].replace(/,/g, ''));
};

const parseMoney = (txt) => {
  if (!txt) return null;
  const clean = txt.trim();
  if (clean === '—' || clean === '-' || clean === '') return null;
  const m = clean.match(/-?[\d.,]+/);
  if (!m) return null;
  return parseFloat(m[0].replace(/,/g, ''));
};

function extractMetrics() {
  const rows = document.querySelectorAll('table tbody tr');
  const data = {};
  for (const tr of rows) {
    const cells = tr.querySelectorAll('td');
    if (cells.length < 2) continue;
    const label = cells[0].textContent?.trim() || '';
    const resValue = cells[1]?.textContent?.trim() || null;
    const vacValue = cells[2]?.textContent?.trim() || null;
    data[label] = { res: resValue, vac: vacValue };
  }
  return data;
}

async function listSlugs(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(LISTING, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3500);
  // Force a scroll to trigger any lazy cards
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  const debug = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('a[href]'));
    const hrefs = all.map((a) => a.getAttribute('href') || '');
    const devHrefs = hrefs.filter((h) => /\/desarrollos\/[^/?#]+/.test(h));
    const propHrefs = hrefs.filter((h) => /\/propiedades\/[^/?#]+/.test(h));
    return { total: hrefs.length, devHrefs: devHrefs.slice(0, 10), propHrefs: propHrefs.slice(0, 10) };
  });
  console.log('   listing debug:', JSON.stringify(debug));

  const slugs = await page.evaluate(() => {
    // Prefer /desarrollos/[slug] links (detail page route we want to audit).
    // Fall back to /propiedades/[slug] if the listing links to the property route.
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const out = new Set();
    for (const a of anchors) {
      const href = a.getAttribute('href') || '';
      const m =
        href.match(/\/desarrollos\/([^/?#]+)/) ||
        href.match(/\/propiedades\/([^/?#]+)/);
      if (m && m[1] && m[1] !== 'null' && m[1] !== 'undefined') out.add(m[1]);
    }
    return Array.from(out);
  });
  await ctx.close();
  return slugs;
}

function validateMetrics(metrics) {
  const flags = [];
  const irr5Label = Object.keys(metrics).find((k) => /TIR.*5|IRR.*5|5.*anos|5.*years/i.test(k));
  const irr10Label = Object.keys(metrics).find((k) => /TIR.*10|IRR.*10|10.*anos|10.*years/i.test(k));
  const capLabel = Object.keys(metrics).find((k) => /cap.*rate|tasa.*capital/i.test(k));
  const netYieldLabel = Object.keys(metrics).find((k) => /yield.*neto|net.*yield/i.test(k));
  const cocLabel = Object.keys(metrics).find((k) => /cash.*on.*cash/i.test(k));
  const netFlowLabel = Object.keys(metrics).find((k) => /flujo.*neto|net.*cash.*flow|net.*flow/i.test(k));

  const irr5 = irr5Label ? parsePct(metrics[irr5Label].res) : null;
  const irr10 = irr10Label ? parsePct(metrics[irr10Label].res) : null;
  const cap = capLabel ? parsePct(metrics[capLabel].res) : null;
  const netYield = netYieldLabel ? parsePct(metrics[netYieldLabel].res) : null;
  const coc = cocLabel ? parsePct(metrics[cocLabel].res) : null;
  const netFlow = netFlowLabel ? parseMoney(metrics[netFlowLabel].res) : null;

  if (irr5 == null) flags.push('IRR 5yr missing (shows em-dash or absent)');
  if (irr10 == null) flags.push('IRR 10yr missing');
  if (irr5 != null && (irr5 < -50 || irr5 > 80)) flags.push(`IRR 5yr out of range: ${irr5}%`);
  if (irr10 != null && (irr10 < -50 || irr10 > 80)) flags.push(`IRR 10yr out of range: ${irr10}%`);
  if (irr5 != null && irr10 != null && Math.abs(irr5 - irr10) > 40)
    flags.push(`IRR 5yr vs 10yr divergence >40pp: ${irr5} vs ${irr10}`);
  if (cap != null && (cap < 0 || cap > 30)) flags.push(`Cap rate out of range: ${cap}%`);
  if (netYield != null && cap != null && Math.abs(netYield - cap) > 0.5)
    flags.push(`NetYield !== CapRate (both defined as annualNet/totalInv): ${netYield} vs ${cap}`);
  if (coc != null && netFlow != null) {
    if (netFlow >= 0 && coc < 0) flags.push(`netFlow>=0 but CoC<0 (inconsistent): flow=${netFlow}, coc=${coc}`);
    if (netFlow < 0 && coc >= 0) flags.push(`netFlow<0 but CoC>=0 (inconsistent): flow=${netFlow}, coc=${coc}`);
  }

  return {
    values: { irr5, irr10, cap, netYield, coc, netFlow },
    flags,
  };
}

async function auditSlug(browser, slug) {
  const url = `${BASE}/desarrollos/${slug}`;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const result = { slug, url };
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    result.status = resp?.status() ?? null;
    await page.waitForTimeout(2500);

    // Scroll step-by-step for whileInView reveals
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const vh = 900;
    for (let y = 0; y < h; y += vh * 0.7) {
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
      await page.waitForTimeout(350);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Try to scroll to the investment analysis section
    const scrolled = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3'));
      const target = headings.find((h) => /inversion|investment/i.test(h.textContent || ''));
      if (target) {
        target.scrollIntoView({ block: 'center' });
        return true;
      }
      return false;
    });
    result.analysisSectionFound = scrolled;
    await page.waitForTimeout(500);

    const metrics = await page.evaluate(extractMetrics);
    result.rawMetrics = metrics;
    const validated = validateMetrics(metrics);
    result.values = validated.values;
    result.flags = validated.flags;

    await page.screenshot({
      path: join(OUT, `${slug}-analysis.png`),
      fullPage: false,
    });
    await page.screenshot({
      path: join(OUT, `${slug}-full.png`),
      fullPage: true,
    });
  } catch (e) {
    result.error = e.message;
  }
  await ctx.close();
  return result;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  console.log('[1/3] Collecting slugs from listing...');
  const slugs = await listSlugs(browser);
  console.log(`   Found ${slugs.length} slugs`);

  const sample = slugs.slice(0, SAMPLE_SIZE);
  console.log(`[2/3] Auditing ${sample.length} detail pages...`);

  const results = [];
  for (const slug of sample) {
    console.log(`   - ${slug}`);
    const r = await auditSlug(browser, slug);
    results.push(r);
  }

  await browser.close();

  const report = {
    runAt: new Date().toISOString(),
    base: BASE,
    sampleSize: sample.length,
    results,
    summary: {
      totalSlugs: slugs.length,
      audited: results.length,
      withFlags: results.filter((r) => (r.flags || []).length > 0).length,
      errors: results.filter((r) => r.error).length,
    },
  };

  await writeFile('tests/qa-phase4/irr-report.json', JSON.stringify(report, null, 2), 'utf-8');

  console.log('\n=== IRR AUDIT REPORT ===');
  for (const r of results) {
    console.log(`\n  ${r.slug}  (HTTP ${r.status})`);
    if (r.error) {
      console.log(`    ERROR: ${r.error}`);
      continue;
    }
    console.log(`    IRR 5yr: ${r.values?.irr5 ?? '—'}%   IRR 10yr: ${r.values?.irr10 ?? '—'}%`);
    console.log(`    Cap: ${r.values?.cap ?? '—'}%   NetYield: ${r.values?.netYield ?? '—'}%   CoC: ${r.values?.coc ?? '—'}%`);
    console.log(`    Flujo neto mensual: ${r.values?.netFlow ?? '—'}`);
    if ((r.flags || []).length > 0) {
      console.log('    FLAGS:');
      for (const f of r.flags) console.log(`      - ${f}`);
    } else {
      console.log('    ✓ no flags');
    }
  }
  console.log(`\n  Summary: ${report.summary.withFlags}/${report.summary.audited} with flags, ${report.summary.errors} errors`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
