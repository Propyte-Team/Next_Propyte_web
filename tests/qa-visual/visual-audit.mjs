/**
 * Visual audit — dev.propyte.com
 * Checks: sticky offsets, contrast, gaps, overlaps, layout breaks
 * Run: node tests/qa-visual/visual-audit.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const BASE = 'https://dev.propyte.com/es';
const OUT  = join(dirname(fileURLToPath(import.meta.url)), 'screenshots');
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  { name: 'home',               path: '/' },
  { name: 'desarrollos',        path: '/desarrollos' },
  { name: 'nosotros-quienes',   path: '/nosotros/quienes-somos' },
  { name: 'nosotros-estructura',path: '/nosotros/estructura' },
  { name: 'glosario',           path: '/glosario' },
  { name: 'corredores',         path: '/corredores' },
  { name: 'desarrolladores',    path: '/desarrolladores' },
  { name: 'faq',                path: '/faq' },
  { name: 'mercado',            path: '/mercado' },
  { name: 'blog',               path: '/blog' },
];

const VIEWPORT_DESKTOP = { width: 1440, height: 900 };
const VIEWPORT_MOBILE  = { width: 390,  height: 844 };

const issues = [];
const log = (route, severity, msg) => {
  issues.push({ route, severity, msg });
  console.log(`[${severity}] ${route}: ${msg}`);
};

async function scrollStep(page, steps = 6) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  const step   = Math.floor(height / steps);
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), step * i);
    await page.waitForTimeout(350);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(200);
}

async function checkHeaderOverlap(page, route) {
  // Get header bottom edge
  const headerBottom = await page.evaluate(() => {
    // Look for fixed/sticky header elements
    const candidates = [...document.querySelectorAll('[class*="fixed"]')].filter(el => {
      const r = el.getBoundingClientRect();
      return r.top <= 10 && r.height > 20 && r.height < 200;
    });
    if (!candidates.length) return null;
    return Math.max(...candidates.map(el => el.getBoundingClientRect().bottom));
  });

  if (!headerBottom) return;

  // Check first meaningful content element below header
  const contentTop = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return null;
    const first = main.querySelector('section, article, div > h1, div > h2');
    if (!first) return null;
    return first.getBoundingClientRect().top;
  });

  if (contentTop !== null && contentTop < headerBottom - 5) {
    log(route, 'ERROR', `Header overlap: content starts at ${Math.round(contentTop)}px, header ends at ${Math.round(headerBottom)}px`);
  }
}

async function checkStickyElements(page, route) {
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await page.waitForTimeout(300);

  const stickyProblems = await page.evaluate(() => {
    const sticky = [...document.querySelectorAll('[class*="sticky"]')];
    const problems = [];
    for (const el of sticky) {
      const r   = el.getBoundingClientRect();
      // Check if any sticky element is at top-0 (likely missing offset)
      if (r.top < 5 && r.height > 10 && r.height < 120) {
        problems.push({ tag: el.tagName, top: Math.round(r.top), height: Math.round(r.height), text: el.textContent?.trim().slice(0, 60) });
      }
    }
    return problems;
  });

  for (const p of stickyProblems) {
    log(route, 'WARN', `Sticky element at top=${p.top}px (expected ≥76px): <${p.tag}> "${p.text}"`);
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
}

async function checkContrastTeal(page, route) {
  const problems = await page.evaluate(() => {
    // Find elements using light teal (#5CE0D2 = rgb(92,224,210)) as text color on light backgrounds
    const all = [...document.querySelectorAll('*')];
    const results = [];
    for (const el of all) {
      if (!el.childElementCount || el.children.length === 0) {
        const style = window.getComputedStyle(el);
        const color = style.color;
        // Match #5CE0D2 ≈ rgb(92, 224, 210)
        if (/rgb\(9[0-5],\s*22[0-9],\s*20[0-9]\)/.test(color) || color === 'rgb(92, 224, 210)') {
          const bg = style.backgroundColor;
          // Only flag if background is light (not transparent/dark)
          const bgMatch = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (bgMatch) {
            const [, r, g, b] = bgMatch.map(Number);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            if (luminance > 0.5) {
              results.push({ text: el.textContent?.trim().slice(0, 50), bg, tag: el.tagName });
            }
          }
        }
      }
    }
    return results.slice(0, 10);
  });

  for (const p of problems) {
    log(route, 'CONTRAST', `#5CE0D2 text on light bg (${p.bg}): <${p.tag}> "${p.text}"`);
  }
}

async function checkGaps(page, route) {
  // Check for unexpected white gaps between sections
  const gaps = await page.evaluate(() => {
    const sections = [...document.querySelectorAll('main section, main > div')];
    const gaps = [];
    for (let i = 0; i < sections.length - 1; i++) {
      const r1 = sections[i].getBoundingClientRect();
      const r2 = sections[i + 1].getBoundingClientRect();
      const gap = r2.top - r1.bottom;
      if (gap > 20 && gap < 200) {
        // Potential unexpected gap
        gaps.push({ gap: Math.round(gap), section1: sections[i].className?.slice(0, 40), section2: sections[i + 1].className?.slice(0, 40) });
      }
    }
    return gaps.slice(0, 5);
  });
  // Only log if gap is suspicious (very large)
  for (const g of gaps) {
    if (g.gap > 80) {
      log(route, 'WARN', `Gap of ${g.gap}px between sections`);
    }
  }
}

async function checkMobileHeaderColor(page, route) {
  // On dark-hero pages, mobile header should not be transparent with white links
  const problems = await page.evaluate(() => {
    const header = document.querySelector('header');
    if (!header) return null;
    const style = window.getComputedStyle(header);
    return { bg: style.backgroundColor, color: style.color };
  });
  return problems;
}

async function auditRoute(browser, route, viewport, suffix) {
  const page = await browser.newPage();
  await page.setViewportSize(viewport);

  try {
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Scroll to trigger animations/lazy loads
    await scrollStep(page, 5);

    // Checks
    await checkHeaderOverlap(page, route.name);
    await checkStickyElements(page, `${route.name}[${suffix}]`);
    await checkContrastTeal(page, `${route.name}[${suffix}]`);
    await checkGaps(page, route.name);

    // Screenshot at fold
    await page.screenshot({ path: join(OUT, `${route.name}-${suffix}-fold.png`), fullPage: false });

    // Scroll to mid and screenshot (to catch sticky issues)
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(OUT, `${route.name}-${suffix}-mid.png`), fullPage: false });

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  } catch (e) {
    log(route.name, 'ERROR', `Page load failed: ${e.message}`);
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const route of ROUTES) {
    console.log(`\nAuditing ${route.name}...`);
    await auditRoute(browser, route, VIEWPORT_DESKTOP, 'desktop');
    await auditRoute(browser, route, VIEWPORT_MOBILE, 'mobile');
  }

  await browser.close();

  const summary = {
    total: issues.length,
    errors:    issues.filter(i => i.severity === 'ERROR').length,
    contrast:  issues.filter(i => i.severity === 'CONTRAST').length,
    warnings:  issues.filter(i => i.severity === 'WARN').length,
    issues,
  };

  const reportPath = join(dirname(fileURLToPath(import.meta.url)), 'report.json');
  writeFileSync(reportPath, JSON.stringify(summary, null, 2));

  console.log('\n========== AUDIT SUMMARY ==========');
  console.log(`Total issues: ${summary.total}`);
  console.log(`  Errors:    ${summary.errors}`);
  console.log(`  Contrast:  ${summary.contrast}`);
  console.log(`  Warnings:  ${summary.warnings}`);
  console.log(`Report: ${reportPath}`);
  console.log(`Screenshots: ${OUT}`);
})();
