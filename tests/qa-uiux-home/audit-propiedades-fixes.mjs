/**
 * Validate the 3 fixes on /propiedades:
 *  1. Header strip-glass should be opacity:0 even when scrolled (no longer translucent)
 *  2. Cards should have gap + padding (no longer touching)
 *  3. Compare button (3rd in stack) should NOT overlap carousel arrow center
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'screenshots-propiedades-fixes');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);

await page.goto('https://dev.propyte.com/es/propiedades', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3500);

// Dismiss cookie banner
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => /rechazar|reject/i.test(b.textContent || ''));
  if (btn) btn.click();
});
await page.waitForTimeout(1500);

// === 1) HEADER STRIP-GLASS opacity check (pre + post scroll) ===
const headerPre = await page.evaluate(() => {
  const strip = document.querySelector('header .propyte-strip-glass');
  if (!strip) return { found: false };
  return { found: true, opacity: getComputedStyle(strip).opacity, scrolled: window.scrollY };
});
console.log('=== 1) Header strip-glass PRE-SCROLL ===');
console.log('  opacity:', headerPre.opacity, '(want: 0)');

// Scroll down
await page.evaluate(() => window.scrollTo(0, 400));
await page.waitForTimeout(700);
const headerPost = await page.evaluate(() => {
  const strip = document.querySelector('header .propyte-strip-glass');
  return { opacity: getComputedStyle(strip).opacity, scrolled: window.scrollY };
});
console.log('=== 1) Header strip-glass POST-SCROLL ===');
console.log('  opacity:', headerPost.opacity, '(want: 0 on listing archives)');

// Screenshot scrolled top
await page.screenshot({
  path: join(OUT, 'fix1_header_scrolled.png'),
  clip: { x: 72, y: 0, width: 1368, height: 220 },
});

// === 2) CARDS SPACING ===
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
const cardsSpacing = await page.evaluate(() => {
  // Find the property cards container
  const cards = [...document.querySelectorAll('a, article')].filter(c => {
    const r = c.getBoundingClientRect();
    return r.width > 200 && r.width < 700 && r.height > 200 && r.height < 700;
  });
  if (cards.length < 2) return { count: cards.length };
  const r1 = cards[0].getBoundingClientRect();
  const r2 = cards[1].getBoundingClientRect();
  return {
    count: cards.length,
    card1: { x: Math.round(r1.x), y: Math.round(r1.y), w: Math.round(r1.width), h: Math.round(r1.height) },
    card2: { x: Math.round(r2.x), y: Math.round(r2.y), w: Math.round(r2.width), h: Math.round(r2.height) },
    horizontalGap: Math.round(r2.x - (r1.x + r1.width)),
    verticalGap: Math.round(r2.y - (r1.y + r1.height)),
  };
});
console.log('\n=== 2) Cards spacing ===');
console.log(JSON.stringify(cardsSpacing, null, 2));

// === 3) ACTION STACK (heart + compare) vs ARROW ===
const stackInfo = await page.evaluate(() => {
  // The action stack — look for the absolute top-2 right-2 flex
  const stacks = [...document.querySelectorAll('div')].filter(d => {
    const cls = (d.className || '').toString();
    return cls.includes('absolute') && cls.includes('top-2') && cls.includes('right-2') && cls.includes('flex');
  });
  if (stacks.length === 0) return { found: false };
  const stack = stacks[0];
  const r = stack.getBoundingClientRect();
  const buttons = [...stack.querySelectorAll('button')].map(b => {
    const br = b.getBoundingClientRect();
    return { aria: b.getAttribute('aria-label'), w: Math.round(br.width), h: Math.round(br.height) };
  });
  // Find the right arrow (in same card)
  const card = stack.closest('article') || stack.closest('a') || stack.parentElement;
  const arrow = card?.querySelector('button[aria-label*="iguiente" i], button[aria-label*="next" i], button[aria-label*="cardNext" i]');
  let arrowInfo = null;
  if (arrow) {
    const ar = arrow.getBoundingClientRect();
    arrowInfo = { x: Math.round(ar.x), y: Math.round(ar.y), w: Math.round(ar.width), h: Math.round(ar.height) };
  }
  return {
    found: true,
    stackBounds: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    flexDirection: getComputedStyle(stack).flexDirection,
    buttonCount: buttons.length,
    buttons,
    arrowInfo,
    // Overlap check: do the bounding boxes intersect?
    overlap: arrowInfo
      ? !(r.x + r.width < arrowInfo.x ||
          arrowInfo.x + arrowInfo.w < r.x ||
          r.y + r.height < arrowInfo.y ||
          arrowInfo.y + arrowInfo.h < r.y)
      : null,
  };
});
console.log('\n=== 3) Action stack vs Right arrow ===');
console.log(JSON.stringify(stackInfo, null, 2));

// Screenshot for visual inspection
await page.screenshot({ path: join(OUT, 'propiedades_after_fixes.png'), fullPage: false });
console.log('\nScreenshot →', join(OUT, 'propiedades_after_fixes.png'));

// Verdict
console.log('\n=== VERDICT ===');
console.log('Fix 1 (header transparent on archive):', headerPost.opacity === '0' ? '✅ PASS' : '❌ FAIL');
console.log('Fix 2 (cards spacing > 0):', (cardsSpacing.horizontalGap > 0 || cardsSpacing.verticalGap > 0) ? '✅ PASS' : '❌ FAIL');
console.log('Fix 3 (action stack horizontal, no arrow overlap):',
  stackInfo.flexDirection === 'row' && stackInfo.overlap === false ? '✅ PASS' :
  stackInfo.overlap === false ? '⚠️ PARTIAL (no overlap but not horizontal)' : '❌ FAIL');

await browser.close();
