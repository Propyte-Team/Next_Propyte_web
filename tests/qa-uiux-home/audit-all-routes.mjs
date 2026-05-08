/**
 * Multi-page UI/UX audit — same checks as home, all main routes.
 * Run: node tests/qa-uiux-home/audit-all-routes.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(HERE, 'screenshots-all');
mkdirSync(SHOTS, { recursive: true });

const BASE = 'http://localhost:3000/es';

// Routes to audit. Slugs picked from src/app/[locale]/. Detail pages skipped
// (need known slugs); use first development/property where applicable.
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

const VIEWPORTS = [
  { name: 'mobile',  w: 390, h: 844, isMobile: true },
  { name: 'tablet',  w: 834, h: 1112, isMobile: false },
];

async function auditPage(page, vp) {
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

  return page.evaluate((viewport) => {
    const issues = [];

    // 1. overflow-x
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) {
      issues.push({
        kind: 'overflow-x',
        severity: 'ERROR',
        msg: `${document.documentElement.scrollWidth}px > ${document.documentElement.clientWidth}px`,
      });
    }

    // 2. tap targets <44px (only mobile)
    if (viewport.isMobile) {
      const small = [...document.querySelectorAll('a, button')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
      });
      const reallySmall = small.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width < 36 || r.height < 36;
      });
      if (reallySmall.length) {
        issues.push({
          kind: 'tap-target-strict',
          severity: 'WARN',
          msg: `${reallySmall.length} <36px`,
          samples: reallySmall.slice(0, 5).map((el) => {
            const r = el.getBoundingClientRect();
            return {
              tag: el.tagName.toLowerCase(),
              text: (el.getAttribute('aria-label') || el.innerText || '').trim().slice(0, 40),
              w: Math.round(r.width),
              h: Math.round(r.height),
              cls: el.className.toString().slice(0, 60),
            };
          }),
        });
      }
    }

    // 3. h1 count
    const h1s = document.querySelectorAll('h1');
    if (h1s.length !== 1) {
      issues.push({
        kind: 'h1-count',
        severity: h1s.length === 0 ? 'ERROR' : 'WARN',
        msg: `H1 count = ${h1s.length}`,
      });
    }

    // 4. images oversized
    const imgs = [...document.querySelectorAll('img')];
    const oversized = imgs.filter(
      (i) => i.naturalWidth > 0 && i.clientWidth > 50 && i.naturalWidth > i.clientWidth * 2.5
    );
    if (oversized.length) {
      issues.push({
        kind: 'img-oversized',
        severity: 'INFO',
        msg: `${oversized.length} imgs >2.5× display`,
        samples: oversized.slice(0, 3).map((i) => ({
          src: (i.currentSrc || i.src).slice(-60),
          natural: `${i.naturalWidth}×${i.naturalHeight}`,
          display: `${i.clientWidth}×${i.clientHeight}`,
          alt: (i.alt || '').slice(0, 30),
        })),
      });
    }

    // 5. h3 fontSize <16 (jerarquía rota)
    const tinyH3s = [...document.querySelectorAll('h3')].filter((el) => {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      return fs < 16;
    });
    if (tinyH3s.length) {
      issues.push({
        kind: 'h3-too-small',
        severity: 'WARN',
        msg: `${tinyH3s.length} <h3> con fontSize <16px`,
        samples: tinyH3s.slice(0, 3).map((el) => ({
          text: (el.innerText || '').trim().slice(0, 50),
          fontSize: getComputedStyle(el).fontSize,
        })),
      });
    }

    // 6. images sin alt
    const noAlt = imgs.filter((i) => !i.alt || !i.alt.trim());
    if (noAlt.length) {
      issues.push({
        kind: 'a11y-img-alt',
        severity: 'WARN',
        msg: `${noAlt.length} imgs sin alt`,
      });
    }

    return {
      issues,
      meta: {
        h1Text: h1s[0]?.innerText?.slice(0, 80) ?? null,
        h1FontSize: h1s[0] ? getComputedStyle(h1s[0]).fontSize : null,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        imgCount: imgs.length,
      },
    };
  }, vp);
}

const browser = await chromium.launch();
const report = { generatedAt: new Date().toISOString(), routes: {} };

for (const route of ROUTES) {
  console.log(`\n=== ${route.name} (${route.path}) ===`);
  report.routes[route.name] = { path: route.path, viewports: {} };

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(45000);
    try {
      await page.goto(BASE + route.path, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(500);
      const r = await auditPage(page, vp);
      await page.screenshot({ path: join(SHOTS, `${route.name}_${vp.name}.png`), fullPage: false });
      report.routes[route.name].viewports[vp.name] = r;
      console.log(`  [${vp.name}] ${r.issues.length} issues — ${r.issues.map(i => i.kind).join(', ') || 'clean'}`);
    } catch (e) {
      console.log(`  [${vp.name}] FAIL — ${e.message.slice(0, 100)}`);
      report.routes[route.name].viewports[vp.name] = { error: e.message };
    } finally {
      await ctx.close();
    }
  }
}

await browser.close();
writeFileSync(join(HERE, 'all-routes-report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(`\nFull report → ${join(HERE, 'all-routes-report.json')}`);

// Summary table
console.log('\n=== SUMMARY ===');
console.log('Route                | mobile issues   | tablet issues');
console.log('---------------------|-----------------|----------------');
for (const [name, data] of Object.entries(report.routes)) {
  const m = data.viewports.mobile?.issues?.length ?? '?';
  const t = data.viewports.tablet?.issues?.length ?? '?';
  const mKinds = (data.viewports.mobile?.issues || []).map(i => i.kind).join(',') || 'clean';
  const tKinds = (data.viewports.tablet?.issues || []).map(i => i.kind).join(',') || 'clean';
  console.log(`${name.padEnd(20)} | ${String(m).padEnd(2)} ${mKinds.padEnd(13)} | ${t} ${tKinds}`);
}
