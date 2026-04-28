#!/usr/bin/env node
/**
 * Fase 2 Visual QA — Home completo en staging (dev.propyte.com/es)
 * Captura desktop + mobile + secciones individuales. Extrae tokens por sección.
 */
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const STAGING = 'https://dev.propyte.com/es';
const OUT = 'tests/qa-phase2/screenshots';

const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

async function auditSections(page) {
  return page.evaluate(() => {
    const _pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        found: true,
        height: Math.round(r.height),
        bg: s.backgroundColor,
      };
    };

    const rgbToHex = (rgb) => {
      if (!rgb) return null;
      const m = String(rgb).match(/\d+/g);
      if (!m || m.length < 3) return rgb;
      return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('').toUpperCase();
    };

    // Heurísticas para cada sección
    const sections = Array.from(document.querySelectorAll('section'));
    const h1 = document.querySelector('h1');
    const h1Style = h1 ? getComputedStyle(h1) : null;

    // Hero detection
    const hero = document.querySelector('.propyte-hero');
    const heroStats = document.querySelectorAll('.hero-stat');
    const heroTabs = hero ? hero.querySelectorAll('button[type="button"]').length : 0;
    const heroQuickLinks = hero ? hero.querySelectorAll('a[class*="bg-white/15"]').length : 0;

    // Count sections
    const sectionCount = sections.length;

    // Search bubble (hero)
    const heroBubble = !!document.querySelector('.propyte-hero .propyte-search-bubble');

    // ExploreCategories — 5 cards with images
    const exploreGrid = document.querySelector('section .grid.md\\:grid-cols-5');
    const exploreCount = exploreGrid ? exploreGrid.querySelectorAll('a').length : 0;

    // Testimonials — stars + "Verificado"/"Verified"
    const testimonialStars = document.querySelectorAll('[class*="fill-\\[\\#F5A623\\]"]').length;

    // TrendingMarket — stat cards + zones
    const trendingStats = document.querySelectorAll('.bg-\\[\\#F4F6F8\\].rounded-xl').length;

    // WhyPropyte feature cards
    const whyFeatures = document.querySelectorAll('.bg-\\[\\#5CE0D2\\]\\/10').length;

    // AppBanner
    const appBanner = !!document.querySelector('section [class*="from-\\[\\#1A2F3F\\]"]');

    // JoinTeamBanner
    const joinTeam = Array.from(document.querySelectorAll('a')).some(a =>
      a.href.includes('/unete')
    );

    // LeadMagnet
    const leadForm = !!document.querySelector('form input[type="email"]');

    // Framer motion detection — elements with opacity+transform inline style
    const motionDivs = document.querySelectorAll('[style*="transform"][style*="opacity"]').length;

    return {
      title: document.title,
      h1Text: h1?.textContent?.trim().slice(0, 100) || null,
      h1Size: h1Style?.fontSize || null,
      h1Color: rgbToHex(h1Style?.color),
      h1Weight: h1Style?.fontWeight || null,
      sectionCount,
      hero: {
        present: !!hero,
        heightPx: hero ? Math.round(hero.getBoundingClientRect().height) : null,
        hasBubble: heroBubble,
        tabs: heroTabs,
        quickLinks: heroQuickLinks,
        statPills: heroStats.length,
      },
      explore: {
        present: !!exploreGrid,
        cards: exploreCount,
      },
      featured: {
        present: !!document.querySelector('.bg-\\[\\#F4F6F8\\]'),
        cards: document.querySelectorAll('article').length,
      },
      testimonials: {
        stars: testimonialStars,
        hasCarousel: !!document.querySelector('[class*="ChevronLeft"]') || document.querySelectorAll('button[class*="rounded-full border"]').length >= 2,
      },
      trendingMarket: {
        statCards: trendingStats,
        zonesVisible: document.querySelectorAll('a[href*="/zonas/"]').length,
      },
      whyPropyte: {
        featureCards: whyFeatures,
      },
      sections: {
        appBanner,
        joinTeam,
        leadMagnet: leadForm,
      },
      framerMotionActive: motionDivs,
    };
  });
}

async function capture(url, label) {
  const browser = await chromium.launch();
  const results = {};

  for (const [name, vp] of Object.entries(viewports)) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    console.log(`[${label}] ${name} → ${url}`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(2500);

      // Above-fold FIRST (before scrolling)
      await page.screenshot({
        path: join(OUT, `${label}-${name}-fold.png`),
        fullPage: false,
      });

      // Trigger all ScrollReveal/whileInView by scrolling step-by-step
      const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const step = vp.height * 0.7;
      for (let y = 0; y < totalHeight; y += step) {
        await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
        await page.waitForTimeout(400);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(700);

      // Now full-page screenshot — all whileInView should have fired
      await page.screenshot({
        path: join(OUT, `${label}-${name}-full.png`),
        fullPage: true,
      });

      // Scroll to capture sections
      if (name === 'desktop') {
        await page.evaluate(() => window.scrollTo(0, 900));
        await page.waitForTimeout(700);
        await page.screenshot({ path: join(OUT, `${label}-${name}-scroll-1.png`), fullPage: false });

        await page.evaluate(() => window.scrollTo(0, 1800));
        await page.waitForTimeout(700);
        await page.screenshot({ path: join(OUT, `${label}-${name}-scroll-2.png`), fullPage: false });

        await page.evaluate(() => window.scrollTo(0, 3000));
        await page.waitForTimeout(700);
        await page.screenshot({ path: join(OUT, `${label}-${name}-scroll-3.png`), fullPage: false });

        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
      }

      results[name] = await auditSections(page);
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

  const stagingData = await capture(STAGING, 'staging-home');

  const report = {
    runAt: new Date().toISOString(),
    staging: { url: STAGING, ...stagingData },
  };

  const { writeFile } = await import('fs/promises');
  await writeFile(
    'tests/qa-phase2/report.json',
    JSON.stringify(report, null, 2),
    'utf-8'
  );

  console.log('\n=== QA REPORT FASE 2 ===');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
