/**
 * UI/UX Pro Audit — Home page comparative
 *  - Local (Next_Propyte_web @ localhost:3000)
 *  - Staging (dev.propyte.com)
 *
 * Captures screenshots @ desktop / tablet / mobile, plus full-page,
 * extracts design tokens (computed styles), measures vertical rhythm,
 * detects header overlap, contrast, font/scale issues, CLS hints.
 *
 * Run: node tests/qa-uiux-home/audit-home.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const OUT = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(OUT, 'screenshots');
mkdirSync(SHOTS, { recursive: true });

const TARGETS = [
  { name: 'local',   url: 'http://localhost:3000/es' },
  { name: 'staging', url: 'https://dev.propyte.com/es' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900,  isMobile: false },
  { name: 'tablet',  width: 834,  height: 1112, isMobile: false },
  { name: 'mobile',  width: 390,  height: 844,  isMobile: true  },
];

const report = { generatedAt: new Date().toISOString(), targets: {} };

function rgb(s) {
  const m = s && s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(',').map((x) => parseFloat(x));
  return { r, g, b, a };
}
function relLum({ r, g, b }) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(c1, c2) {
  const L1 = relLum(c1), L2 = relLum(c2);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

async function smoothScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      const dist = 600, delay = 120;
      let scrolled = 0;
      const max = document.body.scrollHeight;
      const t = setInterval(() => {
        window.scrollBy(0, dist);
        scrolled += dist;
        if (scrolled >= max - window.innerHeight) {
          clearInterval(t);
          window.scrollTo(0, 0);
          resolve();
        }
      }, delay);
    });
  });
  await page.waitForTimeout(500);
}

async function extractDesign(page) {
  return page.evaluate(() => {
    const data = {};

    // Body / root
    const rootCS = getComputedStyle(document.documentElement);
    const bodyCS = getComputedStyle(document.body);
    data.root = {
      fontFamily: bodyCS.fontFamily,
      fontSizeBase: bodyCS.fontSize,
      lineHeightBase: bodyCS.lineHeight,
      bg: bodyCS.backgroundColor,
      color: bodyCS.color,
      letterSpacing: bodyCS.letterSpacing,
    };

    // Headings (first occurrence on the page)
    const grabHeading = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        text: (el.innerText || '').trim().slice(0, 120),
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        color: cs.color,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
      };
    };
    data.h1 = grabHeading('h1');
    data.h2 = grabHeading('h2');
    data.h3 = grabHeading('h3');

    // CTA buttons (anchor or button visible above the fold)
    const ctaCandidates = [...document.querySelectorAll('a, button')].filter((b) => {
      const r = b.getBoundingClientRect();
      const cs = getComputedStyle(b);
      return (
        r.width > 80 &&
        r.height > 28 &&
        r.top >= 0 &&
        r.top < window.innerHeight + 200 &&
        cs.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        cs.visibility !== 'hidden' &&
        cs.display !== 'none'
      );
    });
    data.ctas = ctaCandidates.slice(0, 6).map((b) => {
      const r = b.getBoundingClientRect();
      const cs = getComputedStyle(b);
      return {
        text: (b.innerText || '').trim().slice(0, 60),
        tag: b.tagName.toLowerCase(),
        rect: { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) },
        bg: cs.backgroundColor,
        color: cs.color,
        border: cs.border,
        borderRadius: cs.borderRadius,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        padding: cs.padding,
        boxShadow: cs.boxShadow,
      };
    });

    // Hero / first section
    const main = document.querySelector('main') || document.body;
    const heroEl = main.querySelector('section, header, div');
    if (heroEl) {
      const r = heroEl.getBoundingClientRect();
      const cs = getComputedStyle(heroEl);
      data.hero = {
        height: Math.round(r.height),
        bg: cs.backgroundColor,
        backgroundImage: cs.backgroundImage.slice(0, 200),
        padding: cs.padding,
      };
    }

    // Sections vertical rhythm
    const sections = [...main.querySelectorAll(':scope > section, :scope > div > section')]
      .slice(0, 12)
      .map((s) => {
        const r = s.getBoundingClientRect();
        const cs = getComputedStyle(s);
        return {
          h: Math.round(r.height),
          py: cs.paddingTop + ' / ' + cs.paddingBottom,
          mb: cs.marginBottom,
          bg: cs.backgroundColor,
        };
      });
    data.sections = sections;

    // Images: count, missing alt, lazy, oversized
    const imgs = [...document.querySelectorAll('img')];
    data.images = {
      total: imgs.length,
      missingAlt: imgs.filter((i) => !i.alt || !i.alt.trim()).length,
      lazyCount: imgs.filter((i) => i.loading === 'lazy').length,
      oversized: imgs.filter((i) => i.naturalWidth > 0 && i.naturalWidth > i.clientWidth * 2.5 && i.clientWidth > 50).length,
    };

    // Header / sticky
    const header = document.querySelector('header, [class*="sticky"], [class*="fixed-top"]');
    data.header = header
      ? (() => {
          const r = header.getBoundingClientRect();
          const cs = getComputedStyle(header);
          return {
            height: Math.round(r.height),
            position: cs.position,
            bg: cs.backgroundColor,
            zIndex: cs.zIndex,
            blur: cs.backdropFilter,
          };
        })()
      : null;

    // Layout shift / overflow horizontal
    data.bodyScroll = {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };

    // Approximate spacing scale used (paddings/margins on sections)
    const spacingSet = new Set();
    sections.forEach((s) => {
      s.py.split('/').forEach((v) => spacingSet.add(v.trim()));
      spacingSet.add(s.mb);
    });
    data.spacingScale = [...spacingSet].filter(Boolean).slice(0, 20);

    // Interactive density: count links + buttons in viewport
    const inView = [...document.querySelectorAll('a, button')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.top < window.innerHeight && r.width > 0 && r.height > 0;
    });
    data.interactiveAboveFold = inView.length;

    return data;
  });
}

async function detectIssues(page, vw) {
  return page.evaluate((viewport) => {
    const issues = [];

    // 1. horizontal scroll
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) {
      issues.push({
        severity: 'ERROR',
        kind: 'overflow-x',
        msg: `Horizontal scroll: ${document.documentElement.scrollWidth}px > ${document.documentElement.clientWidth}px`,
      });
    }

    // 2. tap targets too small on mobile (<= 36px)
    if (viewport.isMobile) {
      const small = [...document.querySelectorAll('a, button')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.width < 36 || r.height < 36);
      });
      if (small.length) {
        issues.push({
          severity: 'WARN',
          kind: 'tap-target',
          msg: `${small.length} tap targets < 36px`,
          samples: small.slice(0, 3).map((el) => ({
            tag: el.tagName.toLowerCase(),
            text: (el.innerText || el.getAttribute('aria-label') || '').slice(0, 30),
            w: Math.round(el.getBoundingClientRect().width),
            h: Math.round(el.getBoundingClientRect().height),
          })),
        });
      }
    }

    // 3. missing alt on imgs
    const noAlt = [...document.querySelectorAll('img')].filter((i) => !i.alt || !i.alt.trim());
    if (noAlt.length) {
      issues.push({
        severity: 'WARN',
        kind: 'a11y-img-alt',
        msg: `${noAlt.length} <img> sin alt`,
        samples: noAlt.slice(0, 3).map((i) => i.currentSrc || i.src).map((s) => s.slice(-80)),
      });
    }

    // 4. heading order
    const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    const h1Count = headings.filter((h) => h.tagName === 'H1').length;
    if (h1Count !== 1) {
      issues.push({
        severity: h1Count === 0 ? 'ERROR' : 'WARN',
        kind: 'a11y-h1',
        msg: `H1 count = ${h1Count} (expected 1)`,
      });
    }

    // 5. font scale: count of unique px sizes in body text
    const fontSizes = new Set();
    [...document.querySelectorAll('p, span, li, a, button, h1, h2, h3, h4, h5, h6')].slice(0, 400).forEach((el) => {
      const fs = getComputedStyle(el).fontSize;
      if (fs) fontSizes.add(fs);
    });
    if (fontSizes.size > 14) {
      issues.push({
        severity: 'INFO',
        kind: 'type-scale',
        msg: `Font-size scale: ${fontSizes.size} valores únicos (sugerido <= 10)`,
        samples: [...fontSizes].slice(0, 14),
      });
    }

    // 6. low contrast text against parent bg
    const sample = [...document.querySelectorAll('p, a, span, h1, h2, h3, h4, button')].slice(0, 80);
    const lowContrast = [];
    sample.forEach((el) => {
      const cs = getComputedStyle(el);
      const fg = cs.color;
      let bg = cs.backgroundColor;
      let p = el.parentElement;
      while (p && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
        bg = getComputedStyle(p).backgroundColor;
        p = p.parentElement;
      }
      lowContrast.push({ tag: el.tagName.toLowerCase(), fg, bg, fontSize: cs.fontSize, text: (el.innerText || '').trim().slice(0, 60) });
    });
    // we will compute contrast on Node side
    return { issues, contrastSamples: lowContrast };
  }, vw);
}

async function captureTarget(target) {
  console.log(`\n=== ${target.name.toUpperCase()} → ${target.url} ===`);
  const browser = await chromium.launch();
  const result = { url: target.url, viewports: {} };

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      userAgent: vp.isMobile
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(45000);
    try {
      await page.goto(target.url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(800);

      // above-fold shot
      await page.screenshot({
        path: join(SHOTS, `${target.name}_${vp.name}_top.png`),
        fullPage: false,
      });

      // trigger lazy: scroll then back
      await smoothScroll(page);

      // full-page shot
      await page.screenshot({
        path: join(SHOTS, `${target.name}_${vp.name}_full.png`),
        fullPage: true,
      });

      const design = await extractDesign(page);
      const { issues, contrastSamples } = await detectIssues(page, vp);

      // post-process contrast on Node
      const lowC = [];
      contrastSamples.forEach((s) => {
        const fg = rgb(s.fg);
        const bg = rgb(s.bg);
        if (!fg || !bg) return;
        if (bg.a === 0) return;
        const ratio = contrast(fg, bg);
        const fz = parseFloat(s.fontSize);
        const isLarge = fz >= 18 || (fz >= 14 && /bold|[6-9]00/.test(s.fontSize));
        const min = isLarge ? 3 : 4.5;
        if (ratio < min) lowC.push({ ...s, ratio: ratio.toFixed(2), min });
      });
      if (lowC.length) {
        issues.push({
          severity: 'WARN',
          kind: 'a11y-contrast',
          msg: `${lowC.length} muestras con contraste < AA`,
          samples: lowC.slice(0, 5),
        });
      }

      result.viewports[vp.name] = { design, issues };
      console.log(`  [${vp.name}] OK — ${issues.length} issue(s)`);
    } catch (e) {
      console.log(`  [${vp.name}] FAIL — ${e.message}`);
      result.viewports[vp.name] = { error: e.message };
    } finally {
      await ctx.close();
    }
  }
  await browser.close();
  return result;
}

(async () => {
  for (const t of TARGETS) {
    report.targets[t.name] = await captureTarget(t);
  }
  writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nReporte → ${join(OUT, 'report.json')}`);
  console.log(`Screenshots → ${SHOTS}`);
})();
