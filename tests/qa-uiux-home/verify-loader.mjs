/**
 * Capture the PropyteLoader visible during a route transition.
 * Strategy: throttle network so the loading state is visible long enough
 * to screenshot.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'screenshots-loader');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);

// Visit home first (fast)
await page.goto('https://dev.propyte.com/es', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);
// Dismiss cookie
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => /rechazar|reject/i.test(b.textContent || ''));
  if (btn) btn.click();
});
await page.waitForTimeout(500);

// Throttle network to slow down so loader is visible
const client = await ctx.newCDPSession(page);
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 800,
  downloadThroughput: 200 * 1024,   // 200 KB/s
  uploadThroughput: 200 * 1024,
});

// Trigger client-side navigation to /desarrollos
const navPromise = page.click('a[href*="/desarrollos"]', { delay: 50 }).catch(() => {});

// While loading, capture screenshots
for (const ms of [400, 900, 1500]) {
  await page.waitForTimeout(ms === 400 ? 400 : (ms - 400));
  await page.screenshot({ path: join(OUT, `loader_${ms}ms.png`) });
  console.log(`  capture @ ${ms}ms saved`);
}

await navPromise;

// Disable throttling, capture final state for comparison
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 0,
  downloadThroughput: -1,
  uploadThroughput: -1,
});

// Snapshot loader DOM during a fresh load via reload
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);

// Inspect the loader component (after navigation completes, normally absent)
const loaderInfo = await page.evaluate(() => {
  const role = document.querySelector('[role="status"][aria-busy="true"]');
  if (!role) return { present: false };
  const span = role.querySelector('span.sr-only');
  return {
    present: true,
    text: role.textContent?.trim().slice(0, 80) ?? null,
    srOnly: span?.textContent?.trim() ?? null,
  };
});
console.log('\nLoader on /desarrollos after load:', JSON.stringify(loaderInfo));

await browser.close();
console.log(`\nScreenshots → ${OUT}`);
