/**
 * Inspect the parent height chain for the map.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);

await page.goto('https://dev.propyte.com/es/propiedades', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);

const heights = await page.evaluate(() => {
  // Find the map left div
  const mapLeft = [...document.querySelectorAll('div')].find(d =>
    d.className.includes('w-[60%]') && d.className.includes('h-full')
  );
  if (!mapLeft) return { error: 'mapLeft not found' };

  const chain = [];
  let cur = mapLeft;
  for (let i = 0; i < 8 && cur; i++) {
    const r = cur.getBoundingClientRect();
    const cs = getComputedStyle(cur);
    chain.push({
      tag: cur.tagName,
      class: (cur.className || '').toString().slice(0, 80),
      display: cs.display,
      height: cs.height,
      minHeight: cs.minHeight,
      flex: cs.flex,
      flexDirection: cs.flexDirection,
      boundsH: r.height,
    });
    cur = cur.parentElement;
  }
  return chain;
});

console.log(JSON.stringify(heights, null, 2));
await browser.close();
