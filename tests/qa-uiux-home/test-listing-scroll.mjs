/**
 * Test if the listing column scrolls properly.
 * Strategy: force many properties via URL, then check the overflow container
 * height vs content height, then try scrolling.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);

await page.goto('https://dev.propyte.com/es/propiedades', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => /rechazar|reject/i.test(b.textContent || ''));
  if (btn) btn.click();
});
await page.waitForTimeout(1500);

// Inspect the height chain of the listing column
const chain = await page.evaluate(() => {
  // PropertyList outer: flex flex-col h-full
  // Inside: header + overflow-y-auto

  // Find the overflow-y-auto container
  const allDivs = [...document.querySelectorAll('div')];
  const scrollDiv = allDivs.find(d => {
    const cs = getComputedStyle(d);
    return cs.overflowY === 'auto' && cs.flex.startsWith('1');
  });
  if (!scrollDiv) return { error: 'scroll container not found' };

  const scrollRect = scrollDiv.getBoundingClientRect();
  const cs = getComputedStyle(scrollDiv);

  // Inner grid with cards
  const grid = scrollDiv.querySelector('.grid');
  const gridRect = grid?.getBoundingClientRect();

  // Walk up parents
  const parents = [];
  let cur = scrollDiv;
  for (let i = 0; i < 6 && cur; i++) {
    const r = cur.getBoundingClientRect();
    const pcs = getComputedStyle(cur);
    parents.push({
      tag: cur.tagName,
      class: (cur.className || '').toString().slice(0, 60),
      height: pcs.height,
      overflowY: pcs.overflowY,
      flex: pcs.flex,
      boundsH: Math.round(r.height),
    });
    cur = cur.parentElement;
  }

  // Try scroll
  const scrollBefore = scrollDiv.scrollTop;
  scrollDiv.scrollTop = 9999;
  const scrollAfter = scrollDiv.scrollTop;

  return {
    scrollContainer: {
      visibleH: Math.round(scrollRect.height),
      scrollHeight: scrollDiv.scrollHeight,
      clientHeight: scrollDiv.clientHeight,
      overflowY: cs.overflowY,
      canScroll: scrollDiv.scrollHeight > scrollDiv.clientHeight,
      scrolledFrom: scrollBefore,
      scrolledTo: scrollAfter,
      scrollWorks: scrollAfter > scrollBefore,
    },
    gridInside: gridRect ? {
      height: Math.round(gridRect.height),
      cardCount: grid.children.length,
    } : null,
    parents,
  };
});

console.log('=== Listing scroll inspection ===');
console.log(JSON.stringify(chain, null, 2));

await browser.close();
