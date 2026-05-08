/** Find element causing horizontal overflow at 834px viewport */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 834, height: 1112 } });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/es', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(800);

const culprits = await page.evaluate(() => {
  const VW = document.documentElement.clientWidth;
  const out = [];
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > VW + 0.5 && r.width > 0 && r.height > 0) {
      const cs = getComputedStyle(el);
      // skip absolute-positioned offscreen items (skip-link, sidebar)
      if (cs.position === 'absolute' && r.left < -100) return;
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 90),
        id: el.id || '',
        rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), right: Math.round(r.right) },
        position: cs.position,
        text: (el.innerText || '').trim().slice(0, 40),
      });
    }
  });
  return out.sort((a, b) => b.rect.right - a.rect.right).slice(0, 12);
});

console.log('\n=== Elements crossing 834px (top 12 by rightmost edge) ===\n');
console.log(JSON.stringify(culprits, null, 2));

await browser.close();
