/**
 * Detailed visual audit — focus on specific problem areas
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const BASE = 'https://dev.propyte.com/es';
const OUT  = join(dirname(fileURLToPath(import.meta.url)), 'screenshots2');
mkdirSync(OUT, { recursive: true });

async function shot(page, name, scroll = 0) {
  if (scroll) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scroll);
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false });
}

async function closeConsent(page) {
  try {
    const btn = page.locator('button:has-text("Aceptar todo")');
    if (await btn.isVisible({ timeout: 3000 })) await btn.click();
    await page.waitForTimeout(300);
  } catch {}
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const issues = [];

  // ── 1. Nosotros: tabs sticking position ──────────────────────────────
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/nosotros/quienes-somos`, { waitUntil: 'networkidle', timeout: 30000 });
    await closeConsent(page);
    await shot(page, '01-nosotros-top', 0);
    await shot(page, '01-nosotros-tabs-sticking', 500);
    await shot(page, '01-nosotros-values', 900);
    await shot(page, '01-nosotros-vision', 1500);

    // Check tab bar position when sticking
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
    await page.waitForTimeout(400);
    const tabInfo = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label]');
      if (!nav) return null;
      const r = nav.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };
    });
    if (tabInfo) {
      console.log(`[NOSOTROS] Tab bar when sticky: top=${tabInfo.top}px, height=${tabInfo.height}px`);
      if (tabInfo.top < 70) issues.push({ page: 'nosotros', issue: `Tab bar at top=${tabInfo.top}px — expected ~76px` });
    }

    // Check all teal text nodes on light bg
    const contrastProblems = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const results = [];
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim();
        if (!text || text.length < 2) continue;
        const el = node.parentElement;
        if (!el) continue;
        const s = window.getComputedStyle(el);
        const c = s.color;
        // Detect #5CE0D2 = rgb(92,224,210) or close variants
        const m = c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!m) continue;
        const [,r,g,b] = m.map(Number);
        if (r < 150 && g > 180 && b > 150 && g > r * 1.5) {
          // Looks teal — check bg luminance
          const bg = window.getComputedStyle(el).backgroundColor;
          const bm = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (bm) {
            const lum = (0.299 * bm[1] + 0.587 * bm[2] + 0.114 * bm[3]) / 255;
            if (lum > 0.4) results.push({ text: text.slice(0, 50), color: c, bg, lum: lum.toFixed(2) });
          }
        }
      }
      return results.slice(0, 15);
    });
    for (const p of contrastProblems) {
      console.log(`[CONTRAST nosotros] "${p.text}" color=${p.color} bg-lum=${p.lum}`);
      issues.push({ page: 'nosotros', issue: `Contrast: "${p.text.slice(0,30)}" (${p.color}) on light bg` });
    }
    await page.close();
  }

  // ── 2. Blog ──────────────────────────────────────────────────────────
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/blog`, { waitUntil: 'networkidle', timeout: 30000 });
    await closeConsent(page);
    await shot(page, '02-blog-hero', 0);
    await shot(page, '02-blog-content', 700);
    await shot(page, '02-blog-content2', 1400);

    const blogContrast = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const results = [];
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim();
        if (!text || text.length < 2) continue;
        const el = node.parentElement;
        if (!el) continue;
        const s = window.getComputedStyle(el);
        const c = s.color;
        const m = c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!m) continue;
        const [,r,g,b] = m.map(Number);
        if (r < 150 && g > 180 && b > 150 && g > r * 1.5) {
          const bg = window.getComputedStyle(el).backgroundColor;
          const bm = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (bm) {
            const lum = (0.299 * bm[1] + 0.587 * bm[2] + 0.114 * bm[3]) / 255;
            if (lum > 0.4) results.push({ text: text.slice(0, 50), color: c, bg, lum: lum.toFixed(2) });
          }
        }
      }
      return results.slice(0, 15);
    });
    for (const p of blogContrast) {
      console.log(`[CONTRAST blog] "${p.text}" color=${p.color} bg-lum=${p.lum}`);
      issues.push({ page: 'blog', issue: `Contrast: "${p.text.slice(0,30)}" (${p.color}) on light bg` });
    }
    await page.close();
  }

  // ── 3. Glosario ──────────────────────────────────────────────────────
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/glosario`, { waitUntil: 'networkidle', timeout: 30000 });
    await closeConsent(page);
    await shot(page, '03-glosario-top', 0);
    await shot(page, '03-glosario-mid', 400);

    // Check if sticky search overlaps content
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
    await page.waitForTimeout(400);
    const stickyInfo = await page.evaluate(() => {
      const sticky = document.querySelector('[class*="sticky"]');
      if (!sticky) return null;
      const r = sticky.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };
    });
    if (stickyInfo) {
      console.log(`[GLOSARIO] Sticky search bar: top=${stickyInfo.top}px, bottom=${stickyInfo.bottom}px, h=${stickyInfo.height}px`);
      if (stickyInfo.top < 70) issues.push({ page: 'glosario', issue: `Sticky search at top=${stickyInfo.top}px — too close to top` });
    }
    await page.close();
  }

  // ── 4. Home floating header ───────────────────────────────────────────
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await closeConsent(page);
    await shot(page, '04-home-fold', 0);
    await shot(page, '04-home-after-hero', 800);

    // Get header elements info
    const headerInfo = await page.evaluate(() => {
      const fixed = [...document.querySelectorAll('*')].filter(el => {
        const s = window.getComputedStyle(el);
        return s.position === 'fixed' && el.getBoundingClientRect().top < 200;
      });
      return fixed.map(el => ({
        tag: el.tagName,
        cls: el.className?.toString().slice(0, 80),
        top: Math.round(el.getBoundingClientRect().top),
        bottom: Math.round(el.getBoundingClientRect().bottom),
        height: Math.round(el.getBoundingClientRect().height),
      })).filter(e => e.height > 10 && e.height < 300);
    });
    console.log('[HOME] Fixed elements:', JSON.stringify(headerInfo.slice(0, 5), null, 2));
    await page.close();
  }

  // ── 5. Mobile: nosotros ──────────────────────────────────────────────
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/nosotros/quienes-somos`, { waitUntil: 'networkidle', timeout: 30000 });
    await closeConsent(page);
    await shot(page, '05-mobile-nosotros-top', 0);
    await shot(page, '05-mobile-nosotros-scroll', 500);
    await page.close();
  }

  // ── 6. Desarrollos ───────────────────────────────────────────────────
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/desarrollos`, { waitUntil: 'networkidle', timeout: 30000 });
    await closeConsent(page);
    await shot(page, '06-desarrollos-fold', 0);
    await page.close();
  }

  await browser.close();

  // Write report
  const reportPath = join(dirname(fileURLToPath(import.meta.url)), 'report2.json');
  writeFileSync(reportPath, JSON.stringify({ issues }, null, 2));
  console.log(`\n== ${issues.length} issues found ==`);
  issues.forEach(i => console.log(` [${i.page}] ${i.issue}`));
})();
