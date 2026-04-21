import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('https://dev.propyte.com/es/desarrollos/sample-azul-vivo-5a4e4a4e', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(1500);
const h = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 500) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(250); }
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);

// Search for "360°" button / clickable and try clicking
const tourClick = await page.evaluate(() => {
  const all = Array.from(document.querySelectorAll('button, [role="button"], div[onclick], a'));
  const target = all.find(el => /360|matterport|recorre/i.test((el.textContent || '').trim()));
  if (target) {
    target.scrollIntoView({ block: 'center' });
    const rect = target.getBoundingClientRect();
    return { tag: target.tagName, text: (target.textContent || '').trim().slice(0, 60), y: Math.round(rect.top) };
  }
  return null;
});
console.log('Tour clickable:', tourClick);

if (tourClick) {
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, [role="button"], div[onclick], a'));
    const target = all.find(el => /360|matterport|recorre/i.test((el.textContent || '').trim()));
    if (target) target.click();
  });
  await page.waitForTimeout(1500);
  const iframesAfterClick = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('iframe')).map(i => i.getAttribute('src')?.slice(0, 100));
  });
  console.log('Iframes after clicking tour:', iframesAfterClick);
}

// Now check video
const vidClick = await page.evaluate(() => {
  const all = Array.from(document.querySelectorAll('button, [role="button"], div[onclick], a'));
  const target = all.find(el => /video|play|youtube|2:30/i.test((el.textContent || '').trim()));
  if (target) {
    target.scrollIntoView({ block: 'center' });
    const rect = target.getBoundingClientRect();
    return { tag: target.tagName, text: (target.textContent || '').trim().slice(0, 60), y: Math.round(rect.top) };
  }
  return null;
});
console.log('\nVideo clickable:', vidClick);

// Also dump full page text to find "desarrolladora" / "Developer" section
const devCardInfo = await page.evaluate(() => {
  const allText = document.body.textContent || '';
  // Look for developer section heading
  const devHeadingIdx = allText.search(/desarrolladora|developer|conoce al desarrollador/i);
  const ctx = devHeadingIdx >= 0 ? allText.slice(Math.max(0, devHeadingIdx - 30), devHeadingIdx + 300) : null;
  return { devHeadingIdx, context: ctx };
});
console.log('\nDeveloper section context:', JSON.stringify(devCardInfo.context));

// Dump all h3/h4 headings to see what sections exist
const headings = await page.$$eval('h2, h3, h4', els => els.map(e => e.textContent?.trim()));
console.log('\nAll H2-H4 headings:', headings);

await browser.close();
