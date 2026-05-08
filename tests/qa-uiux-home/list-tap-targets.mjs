/** Enumerate ALL tap targets <44px in mobile, with parent context */
import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/es', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(800);
await page.evaluate(async () => {
  await new Promise((res) => {
    let y = 0; const max = document.body.scrollHeight;
    const t = setInterval(() => {
      y += 800; window.scrollTo(0, y);
      if (y >= max) { clearInterval(t); window.scrollTo(0, 0); res(); }
    }, 100);
  });
});

const list = await page.evaluate(() => {
  return [...document.querySelectorAll('a, button')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
  }).map((el) => {
    const r = el.getBoundingClientRect();
    let parent = el.parentElement;
    let path = [el.tagName.toLowerCase()];
    for (let i = 0; i < 4 && parent; i++) {
      const cls = (parent.className || '').toString().split(/\s+/).slice(0, 2).join('.');
      path.push(parent.tagName.toLowerCase() + (cls ? '.' + cls : ''));
      parent = parent.parentElement;
    }
    return {
      tag: el.tagName.toLowerCase(),
      label: (el.getAttribute('aria-label') || el.innerText || '').trim().slice(0, 40),
      w: Math.round(r.width),
      h: Math.round(r.height),
      y: Math.round(r.top + window.scrollY),
      cls: el.className.toString().slice(0, 60),
      path: path.slice(0, 3).join(' > '),
    };
  }).sort((a, b) => a.y - b.y);
});

console.log(`Total: ${list.length} tap-targets <44px\n`);
const groups = {};
list.forEach((t) => {
  const key = t.path;
  groups[key] = (groups[key] || 0) + 1;
});
console.log('Grouped by path:');
Object.entries(groups).sort((a,b)=>b[1]-a[1]).forEach(([p,c]) => console.log(`  ${c}× ${p}`));
console.log('\nFirst 10 unique:');
console.log(JSON.stringify(list.slice(0, 10), null, 2));

await browser.close();
