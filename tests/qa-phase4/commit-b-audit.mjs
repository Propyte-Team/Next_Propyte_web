#!/usr/bin/env node
/**
 * Fase 4 — Commit B audit: extract city-page + detail-page to shared components.
 *
 * Checks:
 *  1. /es/desarrollos/{cancun, playa-del-carmen, tulum, merida} render igual que antes (A)
 *  2. Breadcrumb en detail linkea a /desarrollos/{slugify(city)} y resuelve a 200
 *  3. Listing /es/desarrollos cards -> detail slug 200, NO overlap con city literals
 *  4. Metadata title/OG presentes en ambas paginas
 *  5. Sitemap incluye rutas de city (opcional)
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE = 'https://dev.propyte.com';
const OUT = 'tests/qa-phase4/screenshots-commit-b';
const DETAIL_SLUG = 'akora-residencial-b73b319b';
const CITIES = ['cancun', 'playa-del-carmen', 'tulum', 'merida'];

function log(m) { console.log(m); }

async function getMeta(page) {
  return await page.evaluate(() => {
    const get = (sel, attr) => document.querySelector(sel)?.getAttribute(attr) || null;
    return {
      title: document.title,
      description: get('meta[name="description"]', 'content'),
      ogTitle: get('meta[property="og:title"]', 'content'),
      ogDescription: get('meta[property="og:description"]', 'content'),
      ogImage: get('meta[property="og:image"]', 'content'),
      canonical: get('link[rel="canonical"]', 'href'),
      hreflangEs: get('link[rel="alternate"][hreflang="es"]', 'href'),
      hreflangEn: get('link[rel="alternate"][hreflang="en"]', 'href'),
    };
  });
}

async function cityAudit(browser, city) {
  const sec = { name: `City /es/desarrollos/${city}`, checks: [] };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(`${BASE}/es/desarrollos/${city}`, { waitUntil: 'networkidle', timeout: 45000 });
    sec.checks.push({ k: 'HTTP status', v: resp?.status(), ok: resp?.status() === 200 });

    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 600) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(300); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const h1 = await page.$eval('h1', el => el.textContent?.trim() || '').catch(() => null);
    sec.checks.push({ k: 'H1 presente', v: h1, ok: !!h1 && h1.toLowerCase().includes(city.split('-')[0]) });

    const meta = await getMeta(page);
    sec.checks.push({ k: 'Meta title', v: meta.title?.slice(0, 80), ok: !!meta.title && meta.title.length > 10 });
    sec.checks.push({ k: 'Meta description', v: meta.description ? '[ok]' : null, ok: !!meta.description });
    sec.checks.push({ k: 'OG title', v: meta.ogTitle ? '[ok]' : null, ok: !!meta.ogTitle });
    sec.checks.push({ k: 'OG image', v: meta.ogImage ? '[ok]' : null, ok: !!meta.ogImage });
    sec.checks.push({ k: 'Canonical', v: meta.canonical, ok: meta.canonical?.includes(`/desarrollos/${city}`) });
    sec.checks.push({ k: 'hreflang es', v: meta.hreflangEs ? '[ok]' : null, ok: !!meta.hreflangEs });
    sec.checks.push({ k: 'hreflang en', v: meta.hreflangEn ? '[ok]' : null, ok: !!meta.hreflangEn });

    const bodyLen = await page.evaluate(() => document.body.textContent?.length || 0);
    sec.checks.push({ k: 'body length', v: bodyLen, ok: bodyLen > 3000 });

    const hasTabs = await page.$$eval('[role="tab"]', els => els.length);
    sec.checks.push({ k: 'Tabs role (should be 0 en city)', v: hasTabs, ok: hasTabs === 0 });

    await page.screenshot({ path: join(OUT, `city-${city}.png`), fullPage: true });
  } catch (e) {
    sec.error = e.message;
  }
  await ctx.close();
  return sec;
}

async function detailAudit(browser) {
  const sec = { name: `Detail /es/desarrollos/${DETAIL_SLUG}`, checks: [] };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(`${BASE}/es/desarrollos/${DETAIL_SLUG}`, { waitUntil: 'networkidle', timeout: 45000 });
    sec.checks.push({ k: 'HTTP status', v: resp?.status(), ok: resp?.status() === 200 });

    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 600) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(300); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Tabs still present (didn't regress from Commit A)
    const tabs = await page.$$eval('[role="tab"]', els => els.map(e => e.textContent?.trim()));
    sec.checks.push({ k: 'Tabs count (expect 3)', v: tabs.length, ok: tabs.length === 3 });
    sec.checks.push({ k: 'Tab labels', v: tabs.join(' | '), ok: true });

    // Breadcrumbs
    const breadcrumbLinks = await page.$$eval('nav[aria-label*="readcrumb" i] a, [class*="readcrumb" i] a, [class*="BreadCrumb"] a', as =>
      as.map(a => ({ href: a.getAttribute('href'), text: a.textContent?.trim() }))
    ).catch(() => []);
    const cityCrumb = breadcrumbLinks.find(l => /desarrollos\/(cancun|playa|tulum|merida)/i.test(l.href || ''));
    sec.checks.push({ k: 'Breadcrumbs detectados', v: breadcrumbLinks.length, ok: breadcrumbLinks.length > 0 });
    sec.checks.push({ k: 'Breadcrumb a city', v: cityCrumb ? `${cityCrumb.text} -> ${cityCrumb.href}` : 'NO FOUND', ok: !!cityCrumb });

    // Verify breadcrumb link resolves 200
    if (cityCrumb?.href) {
      const url = cityCrumb.href.startsWith('http') ? cityCrumb.href : BASE + cityCrumb.href;
      const p2 = await ctx.newPage();
      const r2 = await p2.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      sec.checks.push({ k: 'Breadcrumb link resuelve', v: `${r2?.status()} ${url}`, ok: r2?.status() === 200 });
      await p2.close();
    }

    // Metadata
    const meta = await getMeta(page);
    sec.checks.push({ k: 'Detail meta title', v: meta.title?.slice(0, 80), ok: !!meta.title && meta.title.length > 10 });
    sec.checks.push({ k: 'Detail OG image', v: meta.ogImage ? '[ok]' : null, ok: !!meta.ogImage });
    sec.checks.push({ k: 'Detail canonical', v: meta.canonical, ok: meta.canonical?.includes(DETAIL_SLUG) });
  } catch (e) {
    sec.error = e.message;
  }
  await ctx.close();
  return sec;
}

async function listingOverlapAudit(browser) {
  const sec = { name: 'Listing /es/desarrollos — overlap check', checks: [] };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(`${BASE}/es/desarrollos`, { waitUntil: 'networkidle', timeout: 45000 });
    sec.checks.push({ k: 'HTTP status', v: resp?.status(), ok: resp?.status() === 200 });

    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 600) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(300); }
    await page.waitForTimeout(800);

    const slugs = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const out = new Set();
      for (const a of anchors) {
        const m = (a.getAttribute('href') || '').match(/\/desarrollos\/([^/?#]+)$/);
        if (m && m[1]) out.add(m[1]);
      }
      return Array.from(out);
    });
    sec.checks.push({ k: 'Slugs detectados', v: slugs.length, ok: slugs.length > 0 });

    const overlap = slugs.filter(s => CITIES.includes(s));
    sec.checks.push({ k: 'Overlap con city literals (debe ser 0)', v: overlap.join(',') || 'none', ok: overlap.length === 0 });
    sec.checks.push({ k: 'Sample slugs', v: slugs.slice(0, 5).join(', '), ok: true });

    // Sample 2 detail slugs to verify they still hit [slug] route (200)
    const sample = slugs.slice(0, 2);
    for (const s of sample) {
      const p2 = await ctx.newPage();
      const r = await p2.goto(`${BASE}/es/desarrollos/${s}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const hasTabs = await p2.$$eval('[role="tab"]', els => els.length);
      sec.checks.push({ k: `/${s} -> 200 con tabs`, v: `${r?.status()} tabs=${hasTabs}`, ok: r?.status() === 200 && hasTabs === 3 });
      await p2.close();
    }
  } catch (e) {
    sec.error = e.message;
  }
  await ctx.close();
  return sec;
}

async function sitemapAudit(browser) {
  const sec = { name: 'Sitemap.xml', checks: [] };
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    const r = await page.goto(`${BASE}/sitemap.xml`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    sec.checks.push({ k: 'HTTP status', v: r?.status(), ok: r?.status() === 200 });
    const xml = await page.content();
    for (const city of CITIES) {
      const hit = xml.includes(`/desarrollos/${city}`);
      sec.checks.push({ k: `Sitemap contiene /desarrollos/${city}`, v: hit, ok: hit });
    }
  } catch (e) {
    sec.error = e.message;
  }
  await ctx.close();
  return sec;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  log('\n=== COMMIT B AUDIT ===\n');

  const results = [];
  for (const c of CITIES) results.push(await cityAudit(browser, c));
  results.push(await detailAudit(browser));
  results.push(await listingOverlapAudit(browser));
  results.push(await sitemapAudit(browser));

  await browser.close();

  for (const s of results) {
    log(`\n-- ${s.name} --`);
    if (s.error) { log(`   ERROR: ${s.error}`); continue; }
    for (const c of s.checks) {
      const mark = c.ok === false ? 'FAIL' : c.ok === true ? 'OK  ' : '?   ';
      log(`   [${mark}] ${c.k}: ${c.v}`);
    }
  }

  await writeFile('tests/qa-phase4/commit-b-report.json', JSON.stringify(results, null, 2), 'utf-8');

  const failures = results.flatMap(s =>
    s.error ? [`${s.name}: ${s.error}`] : s.checks.filter(c => c.ok === false).map(c => `${s.name} -> ${c.k}`)
  );
  log(`\n== SUMMARY: ${failures.length === 0 ? 'ALL GREEN' : `${failures.length} FAILURES`} ==`);
  for (const f of failures) log(`  - ${f}`);
}

main().catch(e => { console.error(e); process.exit(1); });
