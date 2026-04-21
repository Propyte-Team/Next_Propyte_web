import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// 1. Inspect amenity rendering in Descripción tab
await page.goto('https://dev.propyte.com/es/propiedades/akora-a301-cancun', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(1500);
const h = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 500) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(250); }
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);

// Ensure Descripción tab active
await page.evaluate(() => {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const d = tabs.find(t => (t.textContent || '').trim() === 'Descripción');
  if (d) d.click();
});
await page.waitForTimeout(800);

// Scan for amenity-related content in the active panel
const descInfo = await page.evaluate(() => {
  const panel = document.querySelector('[role="tabpanel"]:not([hidden])');
  if (!panel) return null;
  const allLi = panel.querySelectorAll('li').length;
  const allDivWithIcon = panel.querySelectorAll('div svg').length;
  const textSample = (panel.textContent || '').slice(0, 1000);
  const hasAmenityWord = /amenid|amenit/i.test(panel.textContent || '');
  return { allLi, allDivWithIcon, hasAmenityWord, textSample };
});
console.log('=== Descripción tab inspection ===');
console.log('  <li> count:', descInfo?.allLi);
console.log('  div>svg count:', descInfo?.allDivWithIcon);
console.log('  has "amenid" word:', descInfo?.hasAmenityWord);
console.log('  text sample (first 1000):');
console.log(descInfo?.textSample);

// 2. Inspect EN outer tabs
console.log('\n=== EN outer tabs ===');
await page.goto('https://dev.propyte.com/en/propiedades/akora-a301-cancun', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(1500);
const enTabs = await page.$$eval('[role="tab"]', els => els.map(e => e.textContent?.trim()));
console.log('  EN tabs:', enTabs);

// Try clicking "Investment" (the label we saw)
const clicked = await page.evaluate(() => {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const t = tabs.find(el => /investment|rentabilidad|returns/i.test((el.textContent || '').trim()));
  if (t) { t.click(); return t.textContent?.trim(); }
  return null;
});
await page.waitForTimeout(800);
console.log('  Clicked tab:', clicked);

const enInnerTabs = await page.$$eval('[role="tablist"]', lists =>
  lists.map(l => Array.from(l.querySelectorAll('[role="tab"]')).map(t => t.textContent?.trim()))
);
console.log('  All tablists after click:', JSON.stringify(enInnerTabs));

// Compare with /en/desarrollos/... to see if labels differ
console.log('\n=== /en/desarrollos tabs (for comparison) ===');
await page.goto('https://dev.propyte.com/en/desarrollos/akora-residencial-b73b319b', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(1500);
const devEnTabs = await page.$$eval('[role="tab"]', els => els.map(e => e.textContent?.trim()));
console.log('  /en/desarrollos tabs:', devEnTabs);

await browser.close();
