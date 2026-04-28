#!/usr/bin/env node
/**
 * Fase 4 — Commit 2a audit: ImageGallery + MobileContactBar + a11y tap targets
 * Commit e8a3dc7.
 */
import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE = 'https://dev.propyte.com';
const OUT = 'tests/qa-phase4/screenshots-2a';

const URLS = [
  { path: '/es/desarrollos/sample-azul-vivo-5a4e4a4e', label: 'sample-dev', type: 'dev' },
  { path: '/en/desarrollos/sample-azul-vivo-5a4e4a4e', label: 'sample-dev-en', type: 'dev' },
  { path: '/es/propiedades/sample-azul-vivo-a101-5a4e4a4e', label: 'sample-unit', type: 'unit' },
  { path: '/es/desarrollos/atzaro-residences-playa-del-carmen-eeaa2be0', label: 'atzaro', type: 'dev' },
  { path: '/es/propiedades/akora-a301-cancun', label: 'akora-unit', type: 'unit' },
];

async function auditMobile(browser, url, label, _type) {
  const sec = { name: `MOBILE ${label}`, checks: [] };
  const ctx = await browser.newContext({ ...devices['iPhone 13 Pro'] });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });

  try {
    const resp = await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 45000 });
    sec.checks.push({ k: 'HTTP 200', v: resp?.status(), ok: resp?.status() === 200 });
    await page.waitForTimeout(1500);

    // Scroll gradual
    const scrollH = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < scrollH; y += 400) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(200); }
    await page.evaluate(half => window.scrollTo(0, half), Math.floor(scrollH / 2));
    await page.waitForTimeout(500);

    // MOBILE CONTACT BAR
    const bar = await page.evaluate(() => {
      // Buscar fixed bottom con WhatsApp + Contactar
      const candidates = Array.from(document.querySelectorAll('div'));
      const bar = candidates.find(el => {
        const cs = window.getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const hasFixed = cs.position === 'fixed';
        const isBottom = cs.bottom === '0px' || r.bottom >= window.innerHeight - 10;
        const wide = r.width >= window.innerWidth - 20;
        const hasWA = /wa\.me|whatsapp/i.test(el.innerHTML);
        const hasCTA = /contactar|contact/i.test(el.textContent || '');
        return hasFixed && isBottom && wide && hasWA && hasCTA;
      });
      if (!bar) return null;
      const r = bar.getBoundingClientRect();
      const waLink = bar.querySelector('a[href*="wa.me"], a[href*="whatsapp"]');
      const ctaBtn = Array.from(bar.querySelectorAll('button, a')).find(b => /contactar|contact/i.test(b.textContent || ''));
      const btnRects = Array.from(bar.querySelectorAll('button, a')).map(b => {
        const br = b.getBoundingClientRect();
        return { w: Math.round(br.width), h: Math.round(br.height), text: b.textContent?.trim().slice(0, 20) };
      });
      return {
        height: Math.round(r.height),
        bottom: Math.round(r.bottom),
        width: Math.round(r.width),
        waHref: waLink?.getAttribute('href')?.slice(0, 100) || null,
        ctaTag: ctaBtn?.tagName || null,
        buttons: btnRects,
      };
    });
    sec.checks.push({ k: 'MobileContactBar fixed bottom presente', v: bar ? `${bar.width}x${bar.height}px` : 'NO FOUND', ok: !!bar });
    if (bar) {
      sec.checks.push({ k: 'WhatsApp link wa.me', v: bar.waHref, ok: !!bar.waHref });
      const allTapsOk = bar.buttons.every(b => b.h >= 44);
      sec.checks.push({ k: 'Bar buttons min-h 44px (WCAG)', v: bar.buttons.map(b => `${b.text}:${b.h}`).join(' | '), ok: allTapsOk });
    }

    // IMAGE GALLERY (hero + thumb strip)
    const gallery = await page.evaluate(() => {
      // Hero: buscar imagen grande con aspect-[16/9] o ratio ~1.77
      const imgs = Array.from(document.querySelectorAll('img'));
      const hero = imgs.find(i => {
        const r = i.getBoundingClientRect();
        return r.width > 300 && Math.abs(r.width / r.height - 16 / 9) < 0.3;
      });
      const photoPill = Array.from(document.querySelectorAll('div, span')).find(el => {
        const t = (el.textContent || '').trim();
        return /^\d+\s*\/\s*\d+$/.test(t) && el.children.length === 0;
      });
      // Thumbnails: varios img pequeños juntos
      const thumbs = imgs.filter(i => {
        const r = i.getBoundingClientRect();
        return r.width > 60 && r.width < 120 && r.height > 40;
      });
      return {
        heroPresent: !!hero,
        heroSrc: hero?.src.slice(0, 100) || null,
        photoCountPill: photoPill?.textContent?.trim() || null,
        thumbCount: thumbs.length,
      };
    });
    sec.checks.push({ k: 'Gallery hero 16:9 presente', v: gallery.heroPresent, ok: gallery.heroPresent });
    sec.checks.push({ k: 'Photo count pill (X/M)', v: gallery.photoCountPill || 'NO FOUND', ok: !!gallery.photoCountPill });
    sec.checks.push({ k: 'Thumbnails visibles', v: gallery.thumbCount, ok: gallery.thumbCount > 0 });

    // Screenshot mobile
    await page.screenshot({ path: join(OUT, `mobile-${label}.png`), fullPage: false });

    // Tap targets global recount
    const taps = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a[href], [role="button"], [role="tab"]'));
      let small = 0, vis = 0;
      for (const b of btns) {
        const r = b.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          vis++;
          if (r.height < 32 || r.width < 32) small++;
        }
      }
      return { vis, small };
    });
    sec.checks.push({ k: 'Tap targets small/total', v: `${taps.small}/${taps.vis}`, ok: taps.small / taps.vis < 0.10 });

    sec.checks.push({ k: `Console errors`, v: consoleErrors.slice(0, 2).join(' | ') || 'none', ok: consoleErrors.length === 0 });
  } catch (e) { sec.error = e.message; }
  await ctx.close();
  return sec;
}

async function auditGalleryModal(browser, url, label) {
  const sec = { name: `GALLERY MODAL ${label}`, checks: [] };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1500);

    // Click hero -> modal
    const heroClicked = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const hero = imgs.find(i => {
        const r = i.getBoundingClientRect();
        return r.width > 600 && Math.abs(r.width / r.height - 16 / 9) < 0.3;
      });
      if (!hero) return false;
      // Click el contenedor clickable más cercano
      let target = hero;
      for (let i = 0; i < 4; i++) {
        if (target.parentElement && (target.onclick || target.parentElement.getAttribute('role') === 'button' || target.parentElement.tagName === 'BUTTON')) break;
        target = target.parentElement || target;
      }
      (target).click();
      return true;
    });
    sec.checks.push({ k: 'Click hero ejecutado', v: heroClicked, ok: heroClicked });
    await page.waitForTimeout(600);

    // Modal presente
    const modal = await page.evaluate(() => {
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0, [aria-modal="true"]'));
      const visible = dialogs.find(d => {
        const r = d.getBoundingClientRect();
        return r.width > 400 && r.height > 400;
      });
      if (!visible) return null;
      return {
        role: visible.getAttribute('role'),
        ariaModal: visible.getAttribute('aria-modal'),
        ariaLabel: visible.getAttribute('aria-label'),
      };
    });
    sec.checks.push({ k: 'Modal abierto (role/aria)', v: modal ? JSON.stringify(modal) : 'NO FOUND', ok: !!modal });

    if (modal) {
      // Keyboard Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      const closed = await page.evaluate(() => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'));
        return dialogs.filter(d => {
          const r = d.getBoundingClientRect();
          return r.width > 400 && r.height > 400;
        }).length === 0;
      });
      sec.checks.push({ k: 'Esc cierra modal', v: closed, ok: closed });
    }
  } catch (e) { sec.error = e.message; }
  await ctx.close();
  return sec;
}

async function auditScrollTarget(browser, url, label) {
  const sec = { name: `SCROLL CONTACT ${label}`, checks: [] };
  const ctx = await browser.newContext({ ...devices['iPhone 13 Pro'] });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1500);

    // contact-form id present
    const hasContactId = await page.evaluate(() => !!document.getElementById('contact-form'));
    sec.checks.push({ k: 'id="contact-form" presente', v: hasContactId, ok: hasContactId });

    // pb-24 on main container (bottom padding to avoid bar overlap)
    const pbOk = await page.evaluate(() => {
      // find main container
      const main = document.querySelector('main') || document.body;
      const cs = window.getComputedStyle(main);
      const pb = parseInt(cs.paddingBottom);
      // Or check any ancestor has pb-24 class
      const pbClass = document.querySelector('[class*="pb-24"]');
      return { mainPb: pb, hasPbClass: !!pbClass };
    });
    sec.checks.push({ k: 'pb-24 (96px) presente (anti-overlap)', v: `class=${pbOk.hasPbClass}`, ok: pbOk.hasPbClass });

    // Click Contactar CTA in bar -> check scrolled
    const clickResult = await page.evaluate(() => {
      const bar = Array.from(document.querySelectorAll('div')).find(el => {
        const cs = window.getComputedStyle(el);
        return cs.position === 'fixed' && /wa\.me/i.test(el.innerHTML) && /contactar|contact/i.test(el.textContent || '');
      });
      if (!bar) return { ok: false, reason: 'no bar' };
      const cta = Array.from(bar.querySelectorAll('button, a')).find(b => /contactar|contact/i.test(b.textContent || ''));
      if (!cta) return { ok: false, reason: 'no cta' };
      const prevY = window.scrollY;
      cta.click();
      return { ok: true, prevY };
    });
    await page.waitForTimeout(1200);
    const afterY = await page.evaluate(() => window.scrollY);
    sec.checks.push({ k: 'Click Contactar cambia scroll', v: `prev=${clickResult.prevY} -> after=${afterY}`, ok: clickResult.ok && Math.abs(afterY - (clickResult.prevY || 0)) > 50 });
  } catch (e) { sec.error = e.message; }
  await ctx.close();
  return sec;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  console.log('\n=== COMMIT 2a AUDIT (ImageGallery + MobileContactBar) ===\n');
  const results = [];

  for (const u of URLS) results.push(await auditMobile(browser, u.path, u.label, u.type));

  // Desktop modal audit only for dev + unit
  results.push(await auditGalleryModal(browser, '/es/desarrollos/sample-azul-vivo-5a4e4a4e', 'sample-dev'));
  results.push(await auditGalleryModal(browser, '/es/propiedades/sample-azul-vivo-a101-5a4e4a4e', 'sample-unit'));

  // Scroll+click CTA
  results.push(await auditScrollTarget(browser, '/es/desarrollos/sample-azul-vivo-5a4e4a4e', 'sample-dev'));
  results.push(await auditScrollTarget(browser, '/es/propiedades/sample-azul-vivo-a101-5a4e4a4e', 'sample-unit'));

  await browser.close();

  for (const s of results) {
    console.log(`\n-- ${s.name} --`);
    if (s.error) { console.log(`   ERROR: ${s.error}`); continue; }
    for (const c of s.checks) {
      const mark = c.ok === false ? 'FAIL' : c.ok === true ? 'OK  ' : '?   ';
      console.log(`   [${mark}] ${c.k}: ${c.v}`);
    }
  }

  await writeFile('tests/qa-phase4/commit-2a-report.json', JSON.stringify(results, null, 2), 'utf-8');
  const failures = results.flatMap(s => s.error ? [`${s.name}: ${s.error}`] : s.checks.filter(c => c.ok === false).map(c => `${s.name} -> ${c.k}: ${c.v}`));
  console.log(`\n== SUMMARY: ${failures.length === 0 ? 'ALL GREEN' : `${failures.length} FAILURES`} ==`);
  for (const f of failures) console.log(`  - ${f}`);
}

main().catch(e => { console.error(e); process.exit(1); });
