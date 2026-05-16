/**
 * Inspect why the MarkerClusterer isn't grouping the 4 Nativa Tulum markers.
 * Strategy: log advanced-marker count + cluster DOM + map-internal state.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);

const consoleMsgs = [];
page.on('console', m => consoleMsgs.push({ type: m.type(), text: m.text().slice(0, 200) }));

await page.goto('https://dev.propyte.com/es/propiedades', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000); // Give map time to load + clusterer to engage

await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => /rechazar|reject/i.test(b.textContent || ''));
  if (btn) btn.click();
});
await page.waitForTimeout(1000);

const inspection = await page.evaluate(() => {
  // Advanced markers in DOM (price pins)
  const advMarkers = [...document.querySelectorAll('.gmp-advanced-marker, gmp-advanced-marker')];
  const advCount = advMarkers.length;

  // Look for cluster-style elements (our custom renderer creates 36-52px circle)
  // The renderer makes a div with border-radius 50% and bg #A2F9FF
  const allDivs = [...document.querySelectorAll('div')];
  const possibleClusters = allDivs.filter(d => {
    const cs = getComputedStyle(d);
    const bg = cs.backgroundColor;
    return bg.includes('162, 249, 255') ||
      (d.textContent || '').match(/^\+\d+$/);
  }).map(d => ({
    text: (d.textContent || '').slice(0, 20),
    bg: getComputedStyle(d).backgroundColor,
    bounds: d.getBoundingClientRect().toJSON(),
  })).slice(0, 5);

  // Visible price pins (the AdvancedMarker contents)
  const pricePins = [...document.querySelectorAll('.gm-style div')].filter(d => {
    return (d.textContent || '').match(/^\$[\d.]+[KM]/);
  }).map(d => ({
    text: d.textContent,
    bounds: d.getBoundingClientRect().toJSON(),
  })).slice(0, 8);

  return {
    advMarkerNodeCount: advCount,
    advMarkerSampleTagNames: advMarkers.slice(0, 3).map(m => m.tagName),
    possibleClusterCount: possibleClusters.length,
    possibleClusters,
    pricePinCount: pricePins.length,
    pricePins,
  };
});

console.log('=== Inspection ===');
console.log(JSON.stringify(inspection, null, 2));

console.log('\n=== Console errors/warnings (first 10) ===');
consoleMsgs
  .filter(m => m.type === 'error' || m.type === 'warning')
  .slice(0, 10)
  .forEach(m => console.log(`  [${m.type}] ${m.text}`));

await browser.close();
