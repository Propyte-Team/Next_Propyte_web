/**
 * Side-by-side comparison: propyte.com (WP) vs dev.propyte.com (Next.js)
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const WP   = 'https://propyte.com';
const NEXT = 'https://dev.propyte.com/es';
const OUT  = join(dirname(fileURLToPath(import.meta.url)), 'compare');
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: 'home',      wp: '/',                        next: '/' },
  { name: 'nosotros',  wp: '/nosotros/quienes-somos/', next: '/nosotros/quienes-somos' },
  { name: 'desarrollos', wp: '/desarrollos/',          next: '/desarrollos' },
  { name: 'blog',      wp: '/blog/',                   next: '/blog' },
  { name: 'corredores', wp: '/brokers/',               next: '/corredores' },
];

const VP = { width: 1440, height: 900 };

async function closeConsent(page) {
  try {
    const btn = page.locator('button:has-text("Aceptar todo"), button:has-text("Accept all"), button:has-text("Accept")');
    if (await btn.first().isVisible({ timeout: 3000 })) await btn.first().click();
    await page.waitForTimeout(400);
  } catch {}
}

async function shot(page, path, scroll = 0) {
  if (scroll) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scroll);
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path, fullPage: false });
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const p of PAGES) {
    console.log(`Comparing ${p.name}...`);

    const [wpPage, nextPage] = await Promise.all([
      browser.newPage(),
      browser.newPage(),
    ]);

    await wpPage.setViewportSize(VP);
    await nextPage.setViewportSize(VP);

    await Promise.all([
      wpPage.goto(`${WP}${p.wp}`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}),
      nextPage.goto(`${NEXT}${p.next}`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}),
    ]);

    await Promise.all([closeConsent(wpPage), closeConsent(nextPage)]);
    await Promise.all([wpPage.waitForTimeout(500), nextPage.waitForTimeout(500)]);

    // Fold
    await Promise.all([
      shot(wpPage,   join(OUT, `${p.name}-wp-fold.png`)),
      shot(nextPage, join(OUT, `${p.name}-next-fold.png`)),
    ]);

    // Mid scroll
    await Promise.all([
      shot(wpPage,   join(OUT, `${p.name}-wp-mid.png`),   600),
      shot(nextPage, join(OUT, `${p.name}-next-mid.png`), 600),
    ]);

    // Bottom scroll
    await Promise.all([
      shot(wpPage,   join(OUT, `${p.name}-wp-bottom.png`),  1400),
      shot(nextPage, join(OUT, `${p.name}-next-bottom.png`), 1400),
    ]);

    await Promise.all([wpPage.close(), nextPage.close()]);
    console.log(`  ✓ ${p.name} done`);
  }

  await browser.close();
  console.log(`\nScreenshots saved to: ${OUT}`);
})();
