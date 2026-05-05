/**
 * Precise sticky tabs audit — measures exact overlap with header
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'sticky');
mkdirSync(OUT, { recursive: true });

async function closeConsent(page) {
  try {
    const btn = page.locator('button:has-text("Aceptar todo")');
    if (await btn.isVisible({ timeout: 3000 })) await btn.click();
    await page.waitForTimeout(300);
  } catch {}
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const [vp, label] of [
    [{ width: 1440, height: 900 }, 'desktop'],
    [{ width: 390,  height: 844 }, 'mobile'],
  ]) {
    const page = await browser.newPage();
    await page.setViewportSize(vp);
    await page.goto('https://dev.propyte.com/es/nosotros/quienes-somos', { waitUntil: 'networkidle', timeout: 30000 });
    await closeConsent(page);
    await page.waitForTimeout(500);

    // Measure header height precisely
    const headerH = await page.evaluate(() => {
      const all = [...document.querySelectorAll('*')];
      const fixed = all.filter(el => window.getComputedStyle(el).position === 'fixed');
      return fixed.map(el => {
        const r = el.getBoundingClientRect();
        return { tag: el.tagName, cls: el.className?.toString().slice(0, 50), top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) };
      }).filter(e => e.h > 10 && e.h < 300 && e.top <= 5);
    });
    console.log(`[${label}] Fixed header elements:`, JSON.stringify(headerH, null, 2));

    // Scroll step by step and check tab position
    for (const scrollY of [200, 400, 500, 600, 700, 800]) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollY);
      await page.waitForTimeout(200);

      const tabPos = await page.evaluate(() => {
        // Find the nosotros tab nav specifically
        const navs = [...document.querySelectorAll('nav')];
        for (const nav of navs) {
          // Look for nav with tab links (quienes-somos, estructura, equipo-comercial)
          if (nav.querySelector('a[href*="quienes-somos"]') || nav.querySelector('a[href*="estructura"]')) {
            const r = nav.getBoundingClientRect();
            return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };
          }
        }
        return null;
      });

      if (tabPos && tabPos.height < 200) {
        console.log(`[${label} scroll=${scrollY}] Tab bar: top=${tabPos.top}px height=${tabPos.height}px`);
      }

      // Screenshot at each key scroll
      await page.screenshot({ path: join(OUT, `${label}-scroll${scrollY}.png`), fullPage: false });
    }

    await page.close();
  }

  await browser.close();
})();
