/**
 * Deep introspection: hook into AdvancedMarkerElement creation and clusterer state.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);

await page.goto('https://dev.propyte.com/es/propiedades', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);

const deep = await page.evaluate(async () => {
  const gm = window.google?.maps;
  if (!gm) return { error: 'google.maps not loaded' };

  // Find all AdvancedMarkerElement instances by checking the markers library
  const markers = [];
  // Iterate over GMP-ADVANCED-MARKER DOM nodes
  document.querySelectorAll('gmp-advanced-marker').forEach((el) => {
    // The element is the marker; read its position
    const m = el; // CustomElement
    markers.push({
      tagName: el.tagName,
      position: m.position ? { lat: m.position.lat, lng: m.position.lng } : null,
      map: m.map ? 'attached' : 'detached',
      visible: getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0,
      bounds: el.getBoundingClientRect().toJSON(),
    });
  });

  return {
    googleMapsApi: 'loaded',
    advancedMarkerCount: markers.length,
    markers: markers.slice(0, 5),
    samePos: markers.every(m => m.position?.lat === markers[0].position?.lat),
  };
});
console.log('=== Deep ===');
console.log(JSON.stringify(deep, null, 2));

await browser.close();
