#!/usr/bin/env node
/**
 * Audit WCAG ALTA Sprint — verifica ratios live + 0 regresiones
 */
import { chromium } from 'playwright';

const BASE = 'https://dev.propyte.com';
const results = [];
const push = (k, ok, note = '') => results.push({ k, ok: ok ? 'PASS' : 'FAIL', note });

// WCAG luminance formula
function luminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}
function contrast(rgb1, rgb2) {
  const L1 = luminance(...rgb1);
  const L2 = luminance(...rgb2);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}
function parseRGB(s) {
  const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

async function checkPage(b, path, label, selectors) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    for (const { selector, name, expectMin = 4.5 } of selectors) {
      const data = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = getComputedStyle(el);
        // walk up to find non-transparent bg
        let bg = cs.backgroundColor;
        let parent = el;
        while ((bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') && parent.parentElement) {
          parent = parent.parentElement;
          bg = getComputedStyle(parent).backgroundColor;
        }
        return {
          color: cs.color,
          bg,
          fontSize: parseFloat(cs.fontSize),
          fontWeight: cs.fontWeight,
          text: el.textContent.trim().slice(0, 50),
        };
      }, selector);

      if (!data) {
        push(`${label}-${name}-found`, false, `selector=${selector}`);
        continue;
      }
      const fg = parseRGB(data.color);
      const bg = parseRGB(data.bg);
      if (!fg || !bg) {
        push(`${label}-${name}-rgb`, false, `couldnt parse fg=${data.color} bg=${data.bg}`);
        continue;
      }
      const ratio = contrast(fg, bg);
      const isLarge = data.fontSize >= 24 || (data.fontSize >= 18.66 && parseInt(data.fontWeight, 10) >= 700);
      const min = isLarge ? 3.0 : expectMin;
      push(`${label}-${name}`, ratio >= min,
        `ratio=${ratio.toFixed(2)} (min ${min}, ${isLarge ? 'large' : 'normal'}, "${data.text}")`);
    }
  } finally {
    await ctx.close();
  }
}

async function run() {
  const b = await chromium.launch();

  // ==== /es Footer (dark bg #0F1923, text-white/70 ahora) ====
  await checkPage(b, '/es', 'footer', [
    { selector: 'footer p.text-sm.text-white\\/70', name: 'description-p' },
    { selector: 'footer h4.text-white\\/80', name: 'h4-section' },
    { selector: 'footer .text-white\\/70', name: 'first-link' },
  ]);

  // ==== /es/built (dark hero, text-white/65, /75) ====
  await checkPage(b, '/es/built', 'built', [
    { selector: '.text-white\\/65', name: 'subtitle-65' },
    { selector: '.text-white\\/75', name: 'detail-75' },
  ]);

  // ==== /es/unete (UnetePageContent — refactor commit) ====
  await checkPage(b, '/es/unete', 'unete', [
    { selector: '.text-white\\/65', name: 'stat-label-65' },
  ]);

  // ==== /es Testimonials Verificado badge ====
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    // Scroll to Testimonials so it lazy-loads if any
    await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(h => /testimo/i.test(h.textContent));
      h2?.scrollIntoView();
    });
    await page.waitForTimeout(800);
    const badge = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('div, span'))
        .filter(el => el.textContent.trim().toLowerCase().match(/^verified|verificado$/));
      const el = candidates[0];
      if (!el) return null;
      const cs = getComputedStyle(el);
      let bg = cs.backgroundColor;
      let parent = el;
      while ((bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') && parent.parentElement) {
        parent = parent.parentElement;
        bg = getComputedStyle(parent).backgroundColor;
      }
      return { color: cs.color, bg, fontSize: parseFloat(cs.fontSize), fontWeight: cs.fontWeight, text: el.textContent.trim() };
    });
    if (!badge) {
      push('testimonios-badge-found', false, 'badge "Verificado" not found');
    } else {
      const fg = parseRGB(badge.color);
      const bg = parseRGB(badge.bg);
      const ratio = contrast(fg, bg);
      // Badge text-[10px] = 10px = small text; min 4.5
      push('testimonios-badge-AA', ratio >= 4.5,
        `ratio=${ratio.toFixed(2)} fg=${badge.color} bg=${badge.bg} text="${badge.text}"`);
    }
    await ctx.close();
  }

  // ==== /es Sidebar nav inactive (dark bg #0F1923) ====
  await checkPage(b, '/es', 'sidebar', [
    { selector: 'nav.lucide-home, [class*="text-white/75"]', name: 'nav-inactive' },
  ]);

  // ==== Regression: pages still render ====
  for (const path of ['/es/built', '/es/unete', '/es/equipo-comercial', '/es/corredores', '/es']) {
    const ctx = await b.newContext();
    const page = await ctx.newPage();
    const r = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    push(`HTTP-${path}`, r?.ok(), `status=${r?.status()}`);
    await ctx.close();
  }

  // ==== Favicon commit verification ====
  {
    const ctx = await b.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const fav = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel*="icon"]')).map(l => ({ rel: l.rel, href: l.href }));
      const apple = Array.from(document.querySelectorAll('link[rel*="apple"]')).map(l => l.href);
      return { links, apple };
    });
    push('Favicon-present', fav.links.length > 0, JSON.stringify(fav).slice(0, 200));
    await ctx.close();
  }

  await b.close();

  console.log('\n=== AUDIT WCAG SPRINT RESULTS ===');
  for (const r of results) console.log(`[${r.ok}] ${r.k}${r.note ? ' — ' + r.note : ''}`);
  const pass = results.filter(r => r.ok === 'PASS').length;
  const fail = results.filter(r => r.ok === 'FAIL').length;
  console.log(`\n${pass} PASS / ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(2); });
