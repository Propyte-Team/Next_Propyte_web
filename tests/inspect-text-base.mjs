import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.goto('http://localhost:3000/es', { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await p.waitForTimeout(2000);
const info = await p.evaluate(() => {
  const els = Array.from(document.querySelectorAll('.text-base')).slice(0, 3);
  return els.map(el => ({
    classes: el.className,
    inlineStyle: el.getAttribute('style'),
    computedFontSize: getComputedStyle(el).fontSize,
    tag: el.tagName,
  }));
});
console.log(JSON.stringify(info, null, 2));
await b.close();
