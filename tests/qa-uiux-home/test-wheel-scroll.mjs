/**
 * Simulate wheel events over the listing column and observe what actually scrolls.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);

await page.goto('https://dev.propyte.com/es/propiedades', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => /rechazar|reject/i.test(b.textContent || '')); if (b) b.click(); });
await page.waitForTimeout(1500);

// Find scroll container bounds
const scrollInfo = await page.evaluate(() => {
  const scrollDiv = [...document.querySelectorAll('div')].find(d => {
    const cs = getComputedStyle(d);
    return cs.overflowY === 'auto' && cs.flex.startsWith('1');
  });
  const r = scrollDiv.getBoundingClientRect();
  return {
    centerX: r.x + r.width / 2,
    centerY: r.y + r.height / 2,
    scrollTop: scrollDiv.scrollTop,
    scrollHeight: scrollDiv.scrollHeight,
    clientHeight: scrollDiv.clientHeight,
    pageScrollY: window.scrollY,
  };
});
console.log('Initial state:', scrollInfo);

// Move mouse to center of listing column
await page.mouse.move(scrollInfo.centerX, scrollInfo.centerY);
await page.waitForTimeout(300);

// Wheel down 5 times (each 100px)
for (let i = 0; i < 5; i++) {
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(150);
}

const after = await page.evaluate(() => {
  const scrollDiv = [...document.querySelectorAll('div')].find(d => {
    const cs = getComputedStyle(d);
    return cs.overflowY === 'auto' && cs.flex.startsWith('1');
  });
  return {
    listingScrollTop: scrollDiv.scrollTop,
    pageScrollY: window.scrollY,
    overscrollY: getComputedStyle(scrollDiv).overscrollBehaviorY,
  };
});
console.log('After 5 wheels of 100px each:', after);

console.log('\nVerdict:');
console.log('  Listing scrolled:', after.listingScrollTop, 'px');
console.log('  Page scrolled:', after.pageScrollY, 'px');
console.log('  overscrollBehaviorY:', after.overscrollY);
if (after.pageScrollY > 50) {
  console.log('  ❌ Page is scrolling — bubble through overscroll-contain failed');
} else if (after.listingScrollTop > 0) {
  console.log('  ✅ Only listing scrolled (containment works)');
} else {
  console.log('  ⚠️ Nothing scrolled');
}

await browser.close();
