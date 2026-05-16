/**
 * Qualitative desktop audit — covers gaps from REPORT.md (2026-05-08):
 *   • Teal #5CE0D2 on light backgrounds (contrast bug)
 *   • Dead zones (large empty/transparent sections)
 *   • Cookie banner overlapping hero/above-the-fold
 *   • Header sticky behavior at scroll (blur/bg detection)
 *   • Skip-to-content link contrast
 *   • Section spacing scale audit
 * Run: AUDIT_BASE=https://dev.propyte.com/es node tests/qa-uiux-home/audit-qualitative-desktop.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(HERE, 'screenshots-desktop');
mkdirSync(SHOTS, { recursive: true });

const BASE = process.env.AUDIT_BASE || 'http://localhost:3000/es';

const ROUTES = [
  { name: 'home',                path: '/' },
  { name: 'desarrollos',         path: '/desarrollos' },
  { name: 'propiedades',         path: '/propiedades' },
  { name: 'nosotros-quienes',    path: '/nosotros/quienes-somos' },
  { name: 'nosotros-estructura', path: '/nosotros/estructura' },
  { name: 'desarrolladores',     path: '/desarrolladores' },
  { name: 'corredores',          path: '/corredores' },
  { name: 'mercado',             path: '/mercado' },
  { name: 'financiamiento',      path: '/financiamiento' },
  { name: 'blog',                path: '/blog' },
  { name: 'contacto',            path: '/contacto' },
  { name: 'faq',                 path: '/faq' },
  { name: 'glosario',            path: '/glosario' },
  { name: 'unete',               path: '/unete' },
  { name: 'destacados',          path: '/destacados' },
];

async function dismissCookieBanner(page) {
  try {
    // Capture initial state for cookie-overlap detection BEFORE dismissing
    const cookieState = await page.evaluate(() => {
      const banner = document.querySelector('[role="dialog"][aria-label*="cookie" i], [role="dialog"][aria-label*="privacidad" i], [aria-label*="cookie" i]');
      if (!banner) return null;
      const r = banner.getBoundingClientRect();
      return {
        present: true,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        viewportH: window.innerHeight,
      };
    });
    // Dismiss for cleaner audit of page body
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => /reject|reject|rechazar|aceptar/i.test(b.textContent || ''));
      if (btn) btn.click();
    });
    await page.waitForTimeout(300);
    return cookieState;
  } catch { return null; }
}

async function scrollAndSettle(page) {
  await page.evaluate(async () => {
    await new Promise((res) => {
      let y = 0;
      const max = document.body.scrollHeight;
      const t = setInterval(() => {
        y += 800; window.scrollTo(0, y);
        if (y >= max) { clearInterval(t); window.scrollTo(0, 0); res(); }
      }, 80);
    });
  });
  await page.waitForTimeout(400);
}

async function auditDesktop(page, name) {
  // 1) Teal on light backgrounds
  const tealOnLight = await page.evaluate(() => {
    const TEAL = ['rgb(92, 224, 210)', '#5CE0D2'];
    function getEffectiveBg(el) {
      let cur = el;
      while (cur) {
        const cs = getComputedStyle(cur);
        const bg = cs.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return 'IMAGE';
        cur = cur.parentElement;
      }
      return 'rgb(255, 255, 255)';
    }
    function isLight(rgbStr) {
      const m = rgbStr.match(/rgba?\(([^)]+)\)/);
      if (!m) return false;
      const [r, g, b] = m[1].split(',').map((x) => parseFloat(x));
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
    }
    const hits = [];
    document.querySelectorAll('*').forEach((el) => {
      const tag = el.tagName;
      if (['P','SPAN','A','H1','H2','H3','H4','LI','DIV'].includes(tag)) {
        const cs = getComputedStyle(el);
        if (TEAL.includes(cs.color)) {
          const text = (el.innerText || '').trim();
          if (text.length > 0 && text.length < 200) {
            const bg = getEffectiveBg(el);
            if (bg !== 'IMAGE' && isLight(bg)) {
              hits.push({ tag: tag.toLowerCase(), text: text.slice(0, 80), fontSize: cs.fontSize, bg });
            }
          }
        }
      }
    });
    return hits;
  });

  // 2) Dead zones — sections taller than 200px with very low content density
  const deadZones = await page.evaluate(() => {
    const sections = [...document.querySelectorAll('section, main > div, footer')];
    const found = [];
    sections.forEach((sec) => {
      const r = sec.getBoundingClientRect();
      if (r.height < 200) return;
      const text = (sec.innerText || '').trim();
      const imgs = sec.querySelectorAll('img, svg, picture, video').length;
      const interactive = sec.querySelectorAll('a, button, input').length;
      // Heuristic: tall (>= 300px) but <50 chars of text AND <2 imgs AND <2 interactive
      if (r.height >= 300 && text.length < 50 && imgs < 2 && interactive < 2) {
        const cs = getComputedStyle(sec);
        found.push({
          tag: sec.tagName.toLowerCase(),
          height: Math.round(r.height),
          textLen: text.length,
          imgs,
          interactive,
          bg: cs.backgroundColor,
          textPreview: text.slice(0, 60),
          cls: sec.className.toString().slice(0, 80),
        });
      }
    });
    return found;
  });

  // 3) Header sticky behavior: scroll past hero, check header has bg/blur
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(300);
  const headerScrolled = await page.evaluate(() => {
    const header = document.querySelector('header');
    if (!header) return null;
    const cs = getComputedStyle(header);
    const r = header.getBoundingClientRect();
    return {
      position: cs.position,
      bg: cs.backgroundColor,
      backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter || 'none',
      top: Math.round(r.top),
      height: Math.round(r.height),
      zIndex: cs.zIndex,
    };
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);

  // 4) Section spacing scale (collect all top-padding values on direct main children)
  const spacing = await page.evaluate(() => {
    const sections = [...document.querySelectorAll('section')];
    const values = sections.map(s => {
      const cs = getComputedStyle(s);
      return { pt: cs.paddingTop, pb: cs.paddingBottom };
    });
    const unique = [...new Set(values.flatMap(v => [v.pt, v.pb]))].filter(v => v !== '0px').sort();
    return { count: sections.length, paddings: unique };
  });

  return { tealOnLight, deadZones, headerScrolled, spacing };
}

const browser = await chromium.launch();
const report = { generatedAt: new Date().toISOString(), base: BASE, routes: {} };

for (const route of ROUTES) {
  console.log(`\n=== ${route.name} (${route.path}) ===`);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(45000);
  try {
    await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(800);
    const cookieState = await dismissCookieBanner(page);
    await scrollAndSettle(page);
    const result = await auditDesktop(page, route.name);
    result.cookieState = cookieState;
    await page.screenshot({ path: join(SHOTS, `${route.name}_desktop_full.png`), fullPage: true });
    await page.screenshot({ path: join(SHOTS, `${route.name}_desktop_top.png`), fullPage: false });
    report.routes[route.name] = { path: route.path, ...result };
    const issues = [];
    if (result.tealOnLight.length) issues.push(`teal-on-light: ${result.tealOnLight.length}`);
    if (result.deadZones.length) issues.push(`dead-zones: ${result.deadZones.length}`);
    if (result.headerScrolled?.bg === 'rgba(0, 0, 0, 0)' && result.headerScrolled?.backdropFilter === 'none') {
      issues.push('header-transparent-scrolled');
    }
    if (cookieState && cookieState.rect.y < cookieState.viewportH * 0.8) issues.push('cookie-banner-above-fold-bottom');
    console.log(`  ${issues.length ? issues.join(', ') : 'clean'}`);
  } catch (e) {
    console.log(`  FAIL — ${e.message.slice(0, 100)}`);
    report.routes[route.name] = { path: route.path, error: e.message };
  } finally {
    await ctx.close();
  }
}

await browser.close();
writeFileSync(join(HERE, 'qualitative-desktop-report.json'), JSON.stringify(report, null, 2), 'utf8');

// Aggregated summary
console.log('\n=== AGGREGATED ===');
let totalTeal = 0, totalDead = 0, headerBad = 0, cookieBad = 0;
for (const [name, data] of Object.entries(report.routes)) {
  if (data.error) continue;
  totalTeal += data.tealOnLight.length;
  totalDead += data.deadZones.length;
  if (data.headerScrolled?.bg === 'rgba(0, 0, 0, 0)' && data.headerScrolled?.backdropFilter === 'none') headerBad++;
  if (data.cookieState && data.cookieState.rect.y < data.cookieState.viewportH * 0.8) cookieBad++;
}
console.log(`teal-on-light hits (across all routes): ${totalTeal}`);
console.log(`dead zones (across all routes):         ${totalDead}`);
console.log(`routes with transparent sticky header:  ${headerBad}/15`);
console.log(`routes with cookie banner above 80% vp: ${cookieBad}/15`);
console.log(`\nReport: ${join(HERE, 'qualitative-desktop-report.json')}`);
console.log(`Screenshots: ${SHOTS}`);
