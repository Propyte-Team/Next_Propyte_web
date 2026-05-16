/**
 * Force-reveal all ScrollReveal sections on home, then full-page screenshot.
 * Goal: verify if the "empty" page is real or a Playwright/Framer Motion artifact.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'screenshots-desktop');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
// Use prefers-reduced-motion to skip ScrollReveal animations entirely
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});
const page = await ctx.newPage();
page.setDefaultTimeout(60000);

await page.goto('https://dev.propyte.com/es', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);

// Dismiss cookie banner
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => /rechazar|reject/i.test(b.textContent || ''));
  if (btn) btn.click();
});
await page.waitForTimeout(500);

// Scroll slowly to bottom to trigger ALL lazy/dynamic content
await page.evaluate(async () => {
  await new Promise((res) => {
    let y = 0;
    const max = document.body.scrollHeight;
    const t = setInterval(() => {
      y += 400; window.scrollTo(0, y);
      if (y >= max) { clearInterval(t); res(); }
    }, 250);
  });
});
await page.waitForTimeout(2000);

// Scroll back to top
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);

// Stats
const stats = await page.evaluate(() => ({
  scrollHeight: document.body.scrollHeight,
  sectionsCount: document.querySelectorAll('section').length,
  // Count visible sections (opacity > 0.5)
  visibleSections: [...document.querySelectorAll('section')].filter(s => {
    const o = parseFloat(getComputedStyle(s).opacity);
    return o > 0.5;
  }).length,
  // Section titles
  sectionTitles: [...document.querySelectorAll('section h1, section h2')].map(h => (h.textContent || '').trim().slice(0, 60)).filter(Boolean),
}));
console.log('Stats:', JSON.stringify(stats, null, 2));

await page.screenshot({ path: join(OUT, 'home_desktop_full_v2.png'), fullPage: true });
console.log('\nScreenshot → home_desktop_full_v2.png');

await browser.close();
