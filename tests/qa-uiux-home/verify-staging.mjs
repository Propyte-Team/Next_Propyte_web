/** Post-deploy verification: re-audit staging only and compare with baseline. */
import { chromium } from 'playwright';

const URL = 'https://dev.propyte.com/es';
const VIEWPORTS = [
  { name: 'desktop', w: 1440, h: 900 },
  { name: 'tablet',  w: 834,  h: 1112 },
  { name: 'mobile',  w: 390,  h: 844 },
];

const browser = await chromium.launch();
const results = {};

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(800);

    const data = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const h2 = document.querySelector('h2');
      const h3 = document.querySelector('h3');
      const tap = [...document.querySelectorAll('a, button')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.width < 36 || r.height < 36);
      });
      return {
        h1: h1 ? getComputedStyle(h1).fontSize : null,
        h2: h2 ? getComputedStyle(h2).fontSize : null,
        h3: h3 ? getComputedStyle(h3).fontSize : null,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        tapTargets: tap.length,
      };
    });
    results[vp.name] = data;
    console.log(`[${vp.name}]`, data);
  } finally {
    await ctx.close();
  }
}
await browser.close();

console.log('\n— Verification target: tipografía fluida + sin overflow tablet + tap targets bajos —');
const t = results.tablet;
const ok = !t.overflow;
console.log(ok ? '✅ Tablet sin overflow' : `❌ Tablet sigue con overflow (+${t.scrollWidth - t.clientWidth}px)`);
const m = results.mobile;
console.log(m.tapTargets < 30 ? `✅ Tap targets mobile: ${m.tapTargets}` : `⚠️ Tap targets mobile: ${m.tapTargets}`);
const h3Mobile = parseFloat(results.mobile.h3);
console.log(h3Mobile >= 17 ? `✅ h3 mobile: ${results.mobile.h3}` : `⚠️ h3 mobile: ${results.mobile.h3}`);
