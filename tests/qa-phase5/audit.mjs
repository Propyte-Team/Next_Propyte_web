// Standalone Playwright audit for dev.propyte.com — Phase 5
// Runs chromium at 1440x900, scrolls by 70% vh with 400ms dwell, fullPage screenshot.
// Outputs a JSON file with findings per page for reporting.

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const PAGES = [
  'https://dev.propyte.com/es/contacto',
  'https://dev.propyte.com/es/nosotros/quienes-somos',
  'https://dev.propyte.com/es/nosotros/estructura',
  'https://dev.propyte.com/es/nosotros/equipo-comercial',
  'https://dev.propyte.com/es/como-comprar',
  'https://dev.propyte.com/es/como-invertir',
  'https://dev.propyte.com/es/financiamiento',
  'https://dev.propyte.com/es/faq',
  'https://dev.propyte.com/es/glosario',
  'https://dev.propyte.com/es/promociones',
  'https://dev.propyte.com/es/mercado',
  'https://dev.propyte.com/es/corredores',
  'https://dev.propyte.com/es/proveedores',
  'https://dev.propyte.com/es/unete',
  'https://dev.propyte.com/es/built',
];

const SCREENSHOT_DIR = path.resolve('tests/qa-phase5/screenshots');
const OUT_JSON = path.resolve('tests/qa-phase5/audit-results.json');

function slugFromUrl(url) {
  const u = new URL(url);
  return u.pathname.replace(/^\/+|\/+$/g, '').replace(/\//g, '_') || 'home';
}

async function auditPage(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'es-MX',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const failedRequests = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on('pageerror', (err) => pageErrors.push(String(err).slice(0, 300)));
  page.on('requestfailed', (req) => {
    failedRequests.push({ url: req.url().slice(0, 200), err: req.failure()?.errorText || '' });
  });
  page.on('response', (res) => {
    const status = res.status();
    if (status >= 400) failedRequests.push({ url: res.url().slice(0, 200), err: `HTTP ${status}` });
  });

  const slug = slugFromUrl(url);
  const shotPath = path.join(SCREENSHOT_DIR, `${slug}.png`);

  const result = {
    url,
    slug,
    screenshot: path.relative(path.resolve('tests/qa-phase5'), shotPath).replace(/\\/g, '/'),
    status: null,
    title: null,
    loadError: null,
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    metrics: {},
  };

  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    result.status = resp ? resp.status() : null;
    result.title = await page.title();

    // Scroll step by step (70% vh) with dwell 400ms to trigger ScrollReveal / lazy
    const stepH = await page.evaluate(() => Math.floor(window.innerHeight * 0.7));
    const docH = await page.evaluate(() => document.documentElement.scrollHeight);
    let y = 0;
    let safetyCounter = 0;
    while (y < docH + stepH && safetyCounter < 40) {
      await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
      await page.waitForTimeout(400);
      y += stepH;
      safetyCounter++;
    }
    // Back to top then small wait
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);

    // Collect DOM heuristics
    const domMetrics = await page.evaluate(() => {
      const _pickText = (sel) => {
        const el = document.querySelector(sel);
        return el ? (el.innerText || '').trim().slice(0, 500) : null;
      };
      void _pickText;

      // Hero detection — common hero selectors
      const heroSel = [
        'section[class*="hero" i]',
        'section[data-hero]',
        '[class*="Hero" i]',
        'header[class*="hero" i]',
        'main > section:first-of-type',
      ];
      let hero = null;
      for (const s of heroSel) {
        const el = document.querySelector(s);
        if (el) {
          const rect = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const bgImage = cs.backgroundImage;
          const innerImgs = el.querySelectorAll('img, video').length;
          hero = {
            selector: s,
            h: Math.round(rect.height),
            bgImage: bgImage && bgImage !== 'none' ? bgImage.slice(0, 200) : null,
            innerMedia: innerImgs,
            bgColor: cs.backgroundColor,
            text: (el.innerText || '').trim().slice(0, 240),
          };
          break;
        }
      }

      // Images analysis
      const imgs = Array.from(document.querySelectorAll('img'));
      const imgBroken = imgs.filter((im) => im.complete && im.naturalWidth === 0).length;
      const imgTotal = imgs.length;
      const imgLazy = imgs.filter((im) => im.loading === 'lazy').length;
      const imgNoSrc = imgs.filter((im) => !im.currentSrc && !im.src).length;

      // Anchor analysis
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const hrefs = anchors.map((a) => a.getAttribute('href'));
      const hashOnly = hrefs.filter((h) => h === '#' || h === '').length;
      const totalLinks = hrefs.length;
      const ctaSelectors = [
        'a[class*="button" i]',
        'a[class*="btn" i]',
        'a[role="button"]',
        'button',
      ];
      let ctasHashOnly = 0;
      let ctasTotal = 0;
      for (const s of ctaSelectors) {
        const els = Array.from(document.querySelectorAll(s));
        for (const el of els) {
          if (el.tagName === 'A') {
            ctasTotal++;
            const h = el.getAttribute('href');
            if (h === '#' || h === '' || h == null) ctasHashOnly++;
          } else {
            ctasTotal++;
          }
        }
      }

      // Placeholder / lorem / construction detection
      const body = document.body.innerText || '';
      const _bodyLower = body.toLowerCase(); void _bodyLower;
      const placeholders = {
        loremIpsum: /lorem ipsum/i.test(body),
        enConstruccion:
          /en construcci[oó]n|coming soon|pr[oó]ximamente|placeholder|tbd|todo\b/i.test(body),
        undefinedLiteral: /\bundefined\b/.test(body),
        nanLiteral: /\bNaN\b/.test(body),
        cannotRead: /cannot read propert(y|ies)/i.test(body),
      };

      // Empty grids / lists — look for common list/grid containers with <2 children
      const gridSelectors = [
        '[class*="grid" i]',
        'ul[class*="list" i]',
        '[class*="cards" i]',
        '[class*="items" i]',
      ];
      let suspiciousGrids = 0;
      const gridDetails = [];
      for (const s of gridSelectors) {
        const els = Array.from(document.querySelectorAll(s));
        for (const el of els) {
          const rect = el.getBoundingClientRect();
          if (rect.height < 40) continue;
          const children = el.children.length;
          if (children < 2 && rect.height > 80) {
            suspiciousGrids++;
            if (gridDetails.length < 3)
              gridDetails.push({
                sel: s,
                children,
                h: Math.round(rect.height),
              });
          }
        }
      }

      // Skeleton / loading stuck
      const skeletonSel = [
        '[class*="skeleton" i]',
        '[class*="animate-pulse"]',
        '[aria-busy="true"]',
        '[class*="loading" i]',
      ];
      let skeletonsCount = 0;
      for (const s of skeletonSel) skeletonsCount += document.querySelectorAll(s).length;

      // Error boundary text
      const errorWords = /(something went wrong|algo sali[oó] mal|error boundary|500 error)/i;
      const errorOnPage = errorWords.test(body);

      // Overflow detection — compare scrollWidth vs clientWidth on body
      const overflowX =
        document.documentElement.scrollWidth - document.documentElement.clientWidth;

      // Page content length
      const textLen = body.trim().length;

      // H1 presence and text
      const h1 = document.querySelector('h1');
      const h1Text = h1 ? (h1.innerText || '').trim().slice(0, 160) : null;

      // Sections count
      const sectionsCount = document.querySelectorAll('section, main > div').length;

      return {
        hero,
        imgTotal,
        imgBroken,
        imgLazy,
        imgNoSrc,
        totalLinks,
        hashOnly,
        ctasTotal,
        ctasHashOnly,
        placeholders,
        suspiciousGrids,
        gridDetails,
        skeletonsCount,
        errorOnPage,
        overflowX,
        textLen,
        h1Text,
        sectionsCount,
      };
    });

    result.metrics = domMetrics;

    await page.screenshot({ path: shotPath, fullPage: true, animations: 'disabled' });
  } catch (err) {
    result.loadError = String(err).slice(0, 400);
    try {
      await page.screenshot({ path: shotPath, fullPage: false });
    } catch {}
  }

  result.consoleErrors = consoleErrors.slice(0, 15);
  result.pageErrors = pageErrors.slice(0, 10);
  result.failedRequests = failedRequests.slice(0, 20);

  await context.close();
  return result;
}

(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const url of PAGES) {
    const t0 = Date.now();
    process.stdout.write(`[audit] ${url} ... `);
    try {
      const r = await auditPage(browser, url);
      results.push(r);
      const ms = Date.now() - t0;
      process.stdout.write(`ok ${ms}ms\n`);
    } catch (err) {
      process.stdout.write(`ERR ${String(err).slice(0, 120)}\n`);
      results.push({ url, fatalError: String(err).slice(0, 400) });
    }
  }
  fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2), 'utf8');
  await browser.close();
  console.log(`\nWrote ${results.length} results -> ${OUT_JSON}`);
})();
