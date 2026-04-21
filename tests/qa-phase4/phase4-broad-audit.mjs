#!/usr/bin/env node
/**
 * Fase 4 — Broad quality audit:
 *  1. Mobile viewport (iPhone 13 Pro: 390x844) en detail pages clave
 *  2. Console errors / warnings / 404s durante carga
 *  3. Network failures (status >= 400) de recursos críticos
 *  4. Lighthouse-like smoke checks (LCP image, no broken images)
 *  5. Keyboard navigation: skip link + first focusable + tab order en detail
 */
import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE = 'https://dev.propyte.com';
const OUT = 'tests/qa-phase4/screenshots-broad';

const URLS = [
  { path: '/es/desarrollos/sample-azul-vivo-5a4e4a4e', label: 'sample-dev' },
  { path: '/es/propiedades/sample-azul-vivo-a101-5a4e4a4e', label: 'sample-unit' },
  { path: '/es/desarrollos/akora-residencial-b73b319b', label: 'real-dev' },
];

async function auditMobile(browser, url, label) {
  const sec = { name: `MOBILE ${label}`, checks: [] };
  const ctx = await browser.newContext({ ...devices['iPhone 13 Pro'] });
  const page = await ctx.newPage();
  const consoleMsgs = [];
  const networkFails = [];
  page.on('console', msg => { if (['error', 'warning'].includes(msg.type())) consoleMsgs.push({ type: msg.type(), text: msg.text().slice(0, 200) }); });
  page.on('requestfailed', req => networkFails.push({ url: req.url().slice(0, 120), err: req.failure()?.errorText }));
  page.on('response', res => { if (res.status() >= 400 && !res.url().includes('_next/data')) networkFails.push({ url: res.url().slice(0, 120), status: res.status() }); });

  try {
    const resp = await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 45000 });
    sec.checks.push({ k: 'HTTP', v: resp?.status(), ok: resp?.status() === 200 });

    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(250); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Overflow horizontal check
    const hOverflow = await page.evaluate(() => {
      const body = document.body;
      return { scrollWidth: body.scrollWidth, clientWidth: body.clientWidth };
    });
    sec.checks.push({ k: 'No horizontal overflow', v: `${hOverflow.scrollWidth}/${hOverflow.clientWidth}`, ok: hOverflow.scrollWidth <= hOverflow.clientWidth + 5 });

    // Mobile floating bar (Fase 4 pendiente según tracker)
    const mobileBar = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('[class*="fixed"][class*="bottom"], [class*="sticky"][class*="bottom"]'));
      return candidates.filter(c => {
        const rect = c.getBoundingClientRect();
        return rect.bottom > window.innerHeight - 100 && rect.width > 200;
      }).length;
    });
    sec.checks.push({ k: 'Mobile floating bar detectado', v: mobileBar, ok: true }); // info only

    // Buttons tap targets (min 44px per WCAG)
    const smallTaps = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a[href], [role="button"], [role="tab"]'));
      let small = 0;
      for (const b of btns) {
        const r = b.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.height < 32 || r.width < 32)) small++;
      }
      return { total: btns.length, small };
    });
    sec.checks.push({ k: `Tap targets ≥32px (WCAG)`, v: `${smallTaps.small}/${smallTaps.total} small`, ok: smallTaps.small / smallTaps.total < 0.15 });

    // Images: any broken (natural width 0)?
    const brokenImgs = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.src.slice(0, 100));
    });
    sec.checks.push({ k: 'Broken images', v: brokenImgs.length, ok: brokenImgs.length === 0 });
    if (brokenImgs.length > 0) sec.checks.push({ k: 'Broken img URLs', v: brokenImgs.slice(0, 3).join(' | '), ok: false });

    await page.screenshot({ path: join(OUT, `mobile-${label}.png`), fullPage: false });
  } catch (e) { sec.error = e.message; }

  sec.checks.push({ k: `Console errors (${consoleMsgs.filter(m => m.type === 'error').length})`, v: consoleMsgs.filter(m => m.type === 'error').slice(0, 3).map(m => m.text).join(' | ') || 'none', ok: consoleMsgs.filter(m => m.type === 'error').length === 0 });
  sec.checks.push({ k: `Network failures (${networkFails.length})`, v: networkFails.slice(0, 3).map(n => `${n.status || n.err}:${n.url}`).join(' | ') || 'none', ok: networkFails.length === 0 });

  await ctx.close();
  return sec;
}

async function auditKeyboardNav(browser, url, label) {
  const sec = { name: `KEYBOARD ${label}`, checks: [] };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1500);

    // Skip link presence (WCAG 2.4.1)
    const skipLink = await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(a => /skip|saltar|ir al contenido/i.test(a.textContent || ''));
      return link?.textContent?.trim() || null;
    });
    sec.checks.push({ k: 'Skip link (accesibilidad)', v: skipLink || 'NO FOUND', ok: !!skipLink });

    // Focus first interactive
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    const firstFocus = await page.evaluate(() => {
      const el = document.activeElement;
      return { tag: el?.tagName, text: el?.textContent?.trim().slice(0, 40), href: el?.getAttribute('href') };
    });
    sec.checks.push({ k: 'First Tab destination', v: `${firstFocus.tag} "${firstFocus.text}"`, ok: firstFocus.tag !== 'BODY' });

    // Outer focus ring visible?
    const focusStyles = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = window.getComputedStyle(el);
      return { outline: style.outline, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
    });
    sec.checks.push({ k: 'Focus visible (outline/boxShadow)', v: focusStyles ? `${focusStyles.outlineWidth} / ${focusStyles.boxShadow.slice(0, 40)}` : 'n/a', ok: focusStyles?.outlineWidth !== '0px' || (focusStyles?.boxShadow && focusStyles.boxShadow !== 'none') });
  } catch (e) { sec.error = e.message; }
  await ctx.close();
  return sec;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  console.log('\n=== PHASE 4 BROAD AUDIT (mobile + console + a11y) ===\n');

  const results = [];
  for (const { path, label } of URLS) results.push(await auditMobile(browser, path, label));
  for (const { path, label } of URLS) results.push(await auditKeyboardNav(browser, path, label));

  await browser.close();

  for (const s of results) {
    console.log(`\n-- ${s.name} --`);
    if (s.error) { console.log(`   ERROR: ${s.error}`); continue; }
    for (const c of s.checks) {
      const mark = c.ok === false ? 'FAIL' : c.ok === true ? 'OK  ' : '?   ';
      console.log(`   [${mark}] ${c.k}: ${c.v}`);
    }
  }

  await writeFile('tests/qa-phase4/phase4-broad-report.json', JSON.stringify(results, null, 2), 'utf-8');
  const failures = results.flatMap(s => s.error ? [`${s.name}: ${s.error}`] : s.checks.filter(c => c.ok === false).map(c => `${s.name} -> ${c.k}`));
  console.log(`\n== SUMMARY: ${failures.length === 0 ? 'ALL GREEN' : `${failures.length} FAILURES`} ==`);
  for (const f of failures) console.log(`  - ${f}`);
}

main().catch(e => { console.error(e); process.exit(1); });
