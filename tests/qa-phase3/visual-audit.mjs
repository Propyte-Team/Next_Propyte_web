#!/usr/bin/env node
/**
 * Fase 3 Visual QA — /desarrollos y /propiedades en staging
 * Audit de PropertyCard, FilterBar, MapView, sort, chips, empty state.
 */
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const BASE = 'https://dev.propyte.com/es';
const OUT = 'tests/qa-phase3/screenshots';

const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const routes = [
  { path: '/desarrollos', label: 'desarrollos' },
  { path: '/propiedades', label: 'propiedades' },
];

async function audit(page) {
  return page.evaluate(() => {
    const cards = document.querySelectorAll('a[href*="/propiedades/"]');
    const cardsFirst = cards[0];
    let cardInfo = null;
    if (cardsFirst) {
      cardInfo = {
        hasPrice: !!cardsFirst.querySelector('.text-lg.font-bold'),
        hasBadge: !!cardsFirst.querySelector('[class*="bg-\\[\\#F5A623\\]"], [class*="bg-\\[\\#22C55E\\]"], [class*="bg-\\[\\#5CE0D2\\]"]'),
        hasHeart: !!cardsFirst.querySelector('button[aria-label="Save"]'),
        hasArrows: cardsFirst.querySelectorAll('button[aria-label="Previous"], button[aria-label="Next"]').length,
        hasDots: cardsFirst.querySelectorAll('.w-1\\.5.h-1\\.5').length,
      };
    }

    // FilterBar pills
    const pillButtons = document.querySelectorAll('.h-10.px-4.rounded-full');
    const searchInput = document.querySelector('input[type="text"][placeholder*="zona" i], input[type="text"][placeholder*="search" i], input[type="text"][placeholder*="ubicación" i]');
    const moreFilters = Array.from(document.querySelectorAll('button')).find(b => /filtros|filters/i.test(b.textContent || ''));
    const sortSelect = document.querySelector('select[aria-label*="sort" i], select[aria-label*="orden" i]');

    // Map presence
    const mapContainer = document.querySelector('[aria-label*="Map"], .gm-style, [class*="propyte-map"]') ||
      Array.from(document.querySelectorAll('div')).find(d => d.clientWidth > 300 && d.clientHeight > 300 && d.querySelector('canvas, iframe'));

    // Active chips
    const chips = document.querySelectorAll('[class*="FilterChip"], [class*="rounded-full"][class*="px-3"]');

    // Empty state
    const emptyState = Array.from(document.querySelectorAll('p')).some(p => /no results|sin resultados|no hay/i.test(p.textContent || ''));

    const h1 = document.querySelector('h1');
    return {
      title: document.title,
      cardCount: cards.length,
      cardInfo,
      filterBar: {
        pills: pillButtons.length,
        hasSearchInput: !!searchInput,
        hasMoreFilters: !!moreFilters,
        hasSort: !!sortSelect,
      },
      mapPresent: !!mapContainer,
      chips: chips.length,
      emptyState,
      h1Text: h1?.textContent?.trim().slice(0, 80) || null,
    };
  });
}

async function capture(url, label) {
  const browser = await chromium.launch();
  const result = {};

  for (const [name, vp] of Object.entries(viewports)) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    console.log(`[${label}] ${name} → ${url}`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(2500);

      await page.screenshot({
        path: join(OUT, `${label}-${name}-fold.png`),
        fullPage: false,
      });

      // Scroll for whileInView
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += vp.height * 0.7) {
        await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
        await page.waitForTimeout(300);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);

      await page.screenshot({
        path: join(OUT, `${label}-${name}-full.png`),
        fullPage: true,
      });

      result[name] = await audit(page);
    } catch (e) {
      result[name] = { error: e.message };
    }
    await ctx.close();
  }

  await browser.close();
  return result;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const report = { runAt: new Date().toISOString(), routes: {} };

  for (const route of routes) {
    report.routes[route.label] = {
      url: BASE + route.path,
      ...(await capture(BASE + route.path, route.label)),
    };
  }

  const { writeFile } = await import('fs/promises');
  await writeFile('tests/qa-phase3/report.json', JSON.stringify(report, null, 2), 'utf-8');

  console.log('\n=== QA REPORT FASE 3 ===');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
