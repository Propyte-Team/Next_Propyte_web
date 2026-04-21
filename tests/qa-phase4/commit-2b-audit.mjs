#!/usr/bin/env node
/**
 * Fase 4 — Commit 2b audit: ShareButton + Share/Download modal + /api/generate-pdf
 * Commit edc8176.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE = 'https://dev.propyte.com';
const OUT = 'tests/qa-phase4/screenshots-2b';

const PAGES = [
  { path: '/es/desarrollos/sample-azul-vivo-5a4e4a4e', label: 'sample-dev-es', kind: 'development', slug: 'sample-azul-vivo-5a4e4a4e' },
  { path: '/en/desarrollos/sample-azul-vivo-5a4e4a4e', label: 'sample-dev-en', kind: 'development', slug: 'sample-azul-vivo-5a4e4a4e' },
  { path: '/es/propiedades/sample-azul-vivo-a101-5a4e4a4e', label: 'sample-unit-es', kind: 'unit', slug: 'sample-azul-vivo-a101-5a4e4a4e' },
  { path: '/en/propiedades/akora-a301-cancun', label: 'akora-unit-en', kind: 'unit', slug: 'akora-a301-cancun' },
];

// --- 1. API endpoint audit ---
async function auditApi(browser) {
  const sec = { name: 'API /api/generate-pdf', checks: [] };
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const tests = [
    { label: 'dev ES', q: '?slug=sample-azul-vivo-5a4e4a4e&kind=development&locale=es', expectedStatus: 200, expectPdf: true },
    { label: 'unit EN', q: '?slug=akora-a301-cancun&kind=unit&locale=en', expectedStatus: 200, expectPdf: true },
    { label: 'invalid slug', q: '?slug=noexiste-xyz&kind=development&locale=es', expectedStatus: 404, expectPdf: false },
    { label: 'missing slug', q: '?kind=development&locale=es', expectedStatus: 400, expectPdf: false },
    { label: 'invalid kind', q: '?slug=sample-azul-vivo-5a4e4a4e&kind=foo&locale=es', expectedStatus: 400, expectPdf: false },
  ];

  for (const t of tests) {
    try {
      const resp = await page.request.get(`${BASE}/api/generate-pdf${t.q}`, { timeout: 60000 });
      const status = resp.status();
      const statusOk = status === t.expectedStatus;
      sec.checks.push({ k: `[${t.label}] HTTP ${t.expectedStatus}`, v: status, ok: statusOk });

      if (t.expectPdf && status === 200) {
        const buf = await resp.body();
        const magic = buf.slice(0, 4).toString('ascii');
        const size = buf.length;
        const hasDisposition = /attachment.*\.pdf/i.test(resp.headers()['content-disposition'] || '');
        const hasContentType = /application\/pdf/i.test(resp.headers()['content-type'] || '');
        sec.checks.push({ k: `[${t.label}] %PDF magic bytes`, v: `${magic} · ${size}B`, ok: magic === '%PDF' });
        sec.checks.push({ k: `[${t.label}] Content-Type pdf + Content-Disposition attachment`, v: `ct=${hasContentType} cd=${hasDisposition}`, ok: hasContentType && hasDisposition });
      }
    } catch (e) {
      sec.checks.push({ k: `[${t.label}] request failed`, v: e.message.slice(0, 100), ok: false });
    }
  }

  await ctx.close();
  return sec;
}

// --- 2. Page-level audit: ShareButton + modal + actions ---
async function auditShareButton(browser, url, label, kind, locale) {
  const sec = { name: `SHARE ${label}`, checks: [] };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // catch network for PDF request
  let pdfRequestUrl = null;
  let pdfStatus = null;
  page.on('response', async (res) => {
    if (res.url().includes('/api/generate-pdf')) {
      pdfRequestUrl = res.url();
      pdfStatus = res.status();
    }
  });

  try {
    await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1500);

    // 1. ShareButton visible
    const shareBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a[role="button"]'));
      const share = btns.find(b => {
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        const text = (b.textContent || '').trim().toLowerCase();
        return /share|compartir|descargar/i.test(aria + ' ' + text);
      });
      if (!share) return null;
      const r = share.getBoundingClientRect();
      return {
        aria: share.getAttribute('aria-label'),
        text: share.textContent?.trim().slice(0, 30),
        visible: r.width > 0 && r.height > 0,
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    sec.checks.push({ k: 'ShareButton aria-label', v: shareBtn?.aria || 'NO FOUND', ok: !!shareBtn?.aria });
    sec.checks.push({ k: 'ShareButton visible', v: shareBtn ? `${shareBtn.w}x${shareBtn.h}` : 'no', ok: !!shareBtn?.visible });

    if (!shareBtn) {
      await ctx.close();
      return sec;
    }

    // 2. Click it and check modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a[role="button"]'));
      const share = btns.find(b => {
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        const text = (b.textContent || '').trim().toLowerCase();
        return /share|compartir|descargar/i.test(aria + ' ' + text);
      });
      share?.click();
    });
    await page.waitForTimeout(500);

    const modal = await page.evaluate(() => {
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'));
      const vis = dialogs.find(d => {
        const r = d.getBoundingClientRect();
        return r.width > 200 && r.height > 200;
      });
      if (!vis) return null;
      const btnTexts = Array.from(vis.querySelectorAll('button, a')).map(b => (b.textContent || '').trim()).filter(t => t.length > 0).slice(0, 10);
      return {
        role: vis.getAttribute('role'),
        ariaModal: vis.getAttribute('aria-modal'),
        ariaLabel: vis.getAttribute('aria-label'),
        btnTexts,
      };
    });
    sec.checks.push({ k: 'Modal abierto role=dialog', v: modal?.role || 'no', ok: modal?.role === 'dialog' });
    if (modal) {
      const texts = modal.btnTexts.join(' | ').toLowerCase();
      const hasPdf = /pdf|descargar|download/.test(texts);
      const hasEmail = /email|correo|mail/.test(texts);
      const hasWA = /whatsapp|wa/.test(texts);
      const hasCopy = /copiar|copy|enlace|link/.test(texts);
      sec.checks.push({ k: '4 acciones PDF/Email/WA/Copy presentes', v: modal.btnTexts.join(' | '), ok: hasPdf && hasEmail && hasWA && hasCopy });

      // i18n parity
      if (locale === 'en') {
        const enTexts = /download|copy|share/.test(texts);
        sec.checks.push({ k: 'EN strings (Download/Copy/Share)', v: enTexts, ok: enTexts });
      } else {
        const esTexts = /descargar|copiar|compartir/.test(texts);
        sec.checks.push({ k: 'ES strings (Descargar/Copiar/Compartir)', v: esTexts, ok: esTexts });
      }
    }

    // 3. Esc closes modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const closedByEsc = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]')).filter(d => {
        const r = d.getBoundingClientRect();
        return r.width > 200 && r.height > 200;
      }).length === 0;
    });
    sec.checks.push({ k: 'Esc cierra modal', v: closedByEsc, ok: closedByEsc });

    // 4. Re-open and click WhatsApp link
    if (closedByEsc) {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, a[role="button"]'));
        const share = btns.find(b => /share|compartir/i.test((b.getAttribute('aria-label') || '') + ' ' + (b.textContent || '')));
        share?.click();
      });
      await page.waitForTimeout(400);

      // Look for wa.me href
      const waHref = await page.evaluate(() => {
        const as = Array.from(document.querySelectorAll('a'));
        const wa = as.find(a => (a.href || '').includes('wa.me'));
        return wa?.href.slice(0, 200) || null;
      });
      sec.checks.push({ k: 'WhatsApp link wa.me presente', v: waHref || 'NO', ok: !!waHref });

      const mailHref = await page.evaluate(() => {
        const as = Array.from(document.querySelectorAll('a'));
        const m = as.find(a => (a.href || '').startsWith('mailto:'));
        return m?.href.slice(0, 200) || null;
      });
      sec.checks.push({ k: 'mailto: link presente', v: mailHref || 'NO', ok: !!mailHref });

      // 5. Click PDF button and verify request
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('[role="dialog"] button, [role="dialog"] a'));
        const pdfBtn = btns.find(b => /pdf|descargar|download/i.test(b.textContent || ''));
        pdfBtn?.click();
      });
      await page.waitForTimeout(3500);
      sec.checks.push({ k: 'PDF click -> /api/generate-pdf fetched', v: pdfRequestUrl?.slice(-100) || 'NO', ok: !!pdfRequestUrl });
      sec.checks.push({ k: 'PDF endpoint status 200', v: pdfStatus, ok: pdfStatus === 200 });

      // 6. Click Copy link and verify toast
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('[role="dialog"] button, [role="dialog"] a'));
        const cp = btns.find(b => /copiar|copy|enlace|link/i.test(b.textContent || ''));
        cp?.click();
      });
      await page.waitForTimeout(800);
      const toast = await page.evaluate(() => {
        const text = document.body.textContent || '';
        return /copiado|copied/i.test(text);
      });
      sec.checks.push({ k: 'Copy link toast (Copiado/Copied)', v: toast, ok: toast });

      // screenshot modal
      await page.screenshot({ path: join(OUT, `modal-${label}.png`), fullPage: false });
    }
  } catch (e) { sec.error = e.message; }
  await ctx.close();
  return sec;
}

// --- 3. Regression: still 200 on main pages ---
async function auditRegression(browser) {
  const sec = { name: 'REGRESSION', checks: [] };
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  for (const p of PAGES) {
    try {
      const r = await page.goto(BASE + p.path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      sec.checks.push({ k: `${p.label} HTTP 200`, v: r?.status(), ok: r?.status() === 200 });
    } catch (e) { sec.checks.push({ k: `${p.label}`, v: e.message.slice(0, 60), ok: false }); }
  }
  await ctx.close();
  return sec;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  console.log('\n=== COMMIT 2b AUDIT (ShareButton + PDF) ===\n');
  const results = [];
  results.push(await auditApi(browser));
  for (const p of PAGES) {
    const locale = p.path.startsWith('/en/') ? 'en' : 'es';
    results.push(await auditShareButton(browser, p.path, p.label, p.kind, locale));
  }
  results.push(await auditRegression(browser));

  await browser.close();

  for (const s of results) {
    console.log(`\n-- ${s.name} --`);
    if (s.error) { console.log(`   ERROR: ${s.error}`); continue; }
    for (const c of s.checks) {
      const mark = c.ok === false ? 'FAIL' : c.ok === true ? 'OK  ' : '?   ';
      console.log(`   [${mark}] ${c.k}: ${c.v}`);
    }
  }

  await writeFile('tests/qa-phase4/commit-2b-report.json', JSON.stringify(results, null, 2), 'utf-8');
  const failures = results.flatMap(s => s.error ? [`${s.name}: ${s.error}`] : s.checks.filter(c => c.ok === false).map(c => `${s.name} -> ${c.k}: ${c.v}`));
  console.log(`\n== SUMMARY: ${failures.length === 0 ? 'ALL GREEN' : `${failures.length} FAILURES`} ==`);
  for (const f of failures) console.log(`  - ${f}`);
}

main().catch(e => { console.error(e); process.exit(1); });
