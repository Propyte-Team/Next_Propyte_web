#!/usr/bin/env node
/**
 * Fase 1 Visual QA — Compara staging (dev.propyte.com) vs WP prod (propyte.com)
 * Captura screenshots desktop + mobile y extrae tokens de diseño.
 */
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const STAGING = 'https://dev.propyte.com/es';
const PROD = 'https://propyte.com/';
const OUT = 'tests/qa-phase1/screenshots';

const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

async function extract(page) {
  return page.evaluate(() => {
    const body = document.body;
    const computed = getComputedStyle(body);
    const h1 = document.querySelector('h1');
    const h1Style = h1 ? getComputedStyle(h1) : null;

    const rgbToHex = (rgb) => {
      if (!rgb) return null;
      const m = rgb.match(/\d+/g);
      if (!m) return rgb;
      return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('').toUpperCase();
    };

    return {
      title: document.title,
      bodyFont: computed.fontFamily,
      bodyColor: rgbToHex(computed.color),
      bodyBg: rgbToHex(computed.backgroundColor),
      h1Text: h1?.textContent?.trim().slice(0, 80) || null,
      h1Size: h1Style?.fontSize || null,
      h1Weight: h1Style?.fontWeight || null,
      h1Color: h1Style ? rgbToHex(h1Style.color) : null,
      h1Count: document.querySelectorAll('h1').length,
      h2Count: document.querySelectorAll('h2').length,
      imagesCount: document.querySelectorAll('img').length,
      hasHeroSearchBubble: !!document.querySelector('[class*="search-bubble"], [class*="propyte-search-bubble"]'),
      hasSidebar: !!document.querySelector('aside, [class*="sidebar"], [class*="w-\\[72px\\]"]'),
      hasWhatsAppFloat: !!document.querySelector('a[href*="wa.me"], a[href*="whatsapp"]'),
      sectionCount: document.querySelectorAll('section').length,
    };
  });
}

async function capture(site, url, label) {
  const browser = await chromium.launch();
  const results = {};

  for (const [name, vp] of Object.entries(viewports)) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    console.log(`[${label}] ${name} → ${url}`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);

      // Full-page screenshot
      await page.screenshot({
        path: join(OUT, `${label}-${name}-full.png`),
        fullPage: true,
      });

      // Above-fold only
      await page.screenshot({
        path: join(OUT, `${label}-${name}-fold.png`),
        fullPage: false,
      });

      results[name] = await extract(page);
    } catch (e) {
      results[name] = { error: e.message };
    }
    await ctx.close();
  }

  await browser.close();
  return results;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const [stagingData, prodData] = await Promise.all([
    capture('staging', STAGING, 'staging'),
    capture('prod', PROD, 'prod'),
  ]);

  const report = {
    runAt: new Date().toISOString(),
    staging: { url: STAGING, ...stagingData },
    prod: { url: PROD, ...prodData },
  };

  const { writeFile } = await import('fs/promises');
  await writeFile(
    'tests/qa-phase1/report.json',
    JSON.stringify(report, null, 2),
    'utf-8'
  );

  console.log('\n=== QA REPORT ===');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
