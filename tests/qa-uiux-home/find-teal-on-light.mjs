/** Find <element style="color:#5CE0D2"> rendered over a *real* light background. */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/es', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(800);

// Scroll to load lazy
await page.evaluate(async () => {
  await new Promise((res) => {
    let y = 0; const max = document.body.scrollHeight;
    const t = setInterval(() => {
      y += 800; window.scrollTo(0, y);
      if (y >= max) { clearInterval(t); window.scrollTo(0, 0); res(); }
    }, 100);
  });
});
await page.waitForTimeout(300);

const findings = await page.evaluate(() => {
  const TEAL = ['rgb(92, 224, 210)', '#5CE0D2'];

  // Sample point in viewport center of each element using elementsFromPoint
  function getEffectiveBg(el) {
    let cur = el;
    while (cur) {
      const cs = getComputedStyle(cur);
      const bg = cs.backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return bg;
      }
      // Also check if any ancestor has a background-image
      if (cs.backgroundImage && cs.backgroundImage !== 'none') {
        return 'IMAGE: ' + cs.backgroundImage.slice(0, 60);
      }
      cur = cur.parentElement;
    }
    return 'rgb(255, 255, 255)';
  }

  function isLight(rgbStr) {
    const m = rgbStr.match(/rgba?\(([^)]+)\)/);
    if (!m) return false;
    const [r, g, b] = m[1].split(',').map((x) => parseFloat(x));
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6;
  }

  const matches = [];
  document.querySelectorAll('*').forEach((el) => {
    if (!el.children.length || el.tagName === 'P' || el.tagName === 'SPAN' || el.tagName === 'A' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'H4') {
      const cs = getComputedStyle(el);
      const c = cs.color;
      const text = (el.innerText || '').trim();
      if (TEAL.includes(c) && text.length > 0 && text.length < 120) {
        const bg = getEffectiveBg(el);
        const onLight = bg.startsWith('IMAGE:') ? false : isLight(bg);
        if (onLight) {
          const r = el.getBoundingClientRect();
          matches.push({
            tag: el.tagName.toLowerCase(),
            text: text.slice(0, 60),
            color: c,
            bg,
            fontSize: cs.fontSize,
            y: Math.round(r.top + window.scrollY),
            cls: el.className.toString().slice(0, 80),
          });
        }
      }
    }
  });

  return matches;
});

console.log(JSON.stringify(findings, null, 2));
await browser.close();
