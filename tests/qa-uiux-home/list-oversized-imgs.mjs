/** Identify images served at >2.5x display size on tablet */
import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 834, height: 1112 } });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/es', { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(async () => {
  await new Promise((res) => {
    let y = 0;
    const max = document.body.scrollHeight;
    const t = setInterval(() => {
      y += 800; window.scrollTo(0, y);
      if (y >= max) { clearInterval(t); window.scrollTo(0, 0); res(); }
    }, 100);
  });
});
await page.waitForTimeout(800);

const list = await page.evaluate(() => {
  return [...document.querySelectorAll('img')].filter((i) => {
    return i.naturalWidth > 0 && i.clientWidth > 50 && i.naturalWidth > i.clientWidth * 2.5;
  }).map((i) => ({
    src: (i.currentSrc || i.src).slice(-90),
    natural: `${i.naturalWidth}x${i.naturalHeight}`,
    display: `${i.clientWidth}x${i.clientHeight}`,
    ratio: (i.naturalWidth / i.clientWidth).toFixed(1) + 'x',
    sizes: i.getAttribute('sizes'),
    alt: (i.alt || '').slice(0, 30),
  }));
});

console.log(JSON.stringify(list, null, 2));
await browser.close();
