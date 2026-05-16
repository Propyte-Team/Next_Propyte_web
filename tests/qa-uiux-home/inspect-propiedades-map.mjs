/**
 * Inspect /propiedades map area: check API key, console errors, DOM state.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);

const consoleMsgs = [];
const pageErrors = [];
page.on('console', msg => consoleMsgs.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', err => pageErrors.push(err.message));

await page.goto('https://dev.propyte.com/es/propiedades', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);

// Dismiss cookie banner
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => /rechazar|reject/i.test(b.textContent || ''));
  if (btn) btn.click();
});
await page.waitForTimeout(500);

const inspection = await page.evaluate(() => {
  // The map should be in the left column
  const flexRow = [...document.querySelectorAll('div')].find(d => {
    const cs = getComputedStyle(d);
    return cs.display === 'flex' && d.children.length === 2 && d.querySelector('[id*="map"]');
  });

  const mapLeftDiv = flexRow?.children[0];
  const mapEl = document.querySelector('[id*="map"]') || document.querySelector('.gm-style');

  // Check if Google Maps API loaded
  // @ts-ignore
  const hasGoogle = typeof window.google !== 'undefined' && window.google.maps;

  // Find any element containing map-related text (fallback messages)
  const allText = (document.body.innerText || '').toLowerCase();
  const hasApiKeyMessage = allText.includes('api key') || allText.includes('apikey');
  const hasErrorMessage = allText.includes('error') && allText.includes('map');
  const hasNoCoordsMessage = allText.includes('sin coordenadas') || allText.includes('no coords');

  return {
    googleMapsLoaded: !!hasGoogle,
    mapElementExists: !!mapEl,
    mapElementBounds: mapEl ? mapEl.getBoundingClientRect().toJSON() : null,
    mapLeftDivExists: !!mapLeftDiv,
    mapLeftDivClass: mapLeftDiv?.className || null,
    mapLeftDivBounds: mapLeftDiv ? mapLeftDiv.getBoundingClientRect().toJSON() : null,
    hasApiKeyMessage,
    hasErrorMessage,
    hasNoCoordsMessage,
    bodyTextSnippet: document.body.innerText.slice(0, 300),
  };
});

console.log('=== Inspection ===');
console.log(JSON.stringify(inspection, null, 2));

console.log('\n=== Page Errors ===');
pageErrors.forEach(e => console.log('  ' + e));

console.log('\n=== Console (errors + warnings only) ===');
consoleMsgs
  .filter(m => m.type === 'error' || m.type === 'warning')
  .slice(0, 20)
  .forEach(m => console.log('  [' + m.type + '] ' + m.text.slice(0, 200)));

await browser.close();
