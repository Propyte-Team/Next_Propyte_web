import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const URL = 'https://dev.propyte.com/es/desarrollos/sample-azul-vivo-5a4e4a4e';

// First hit triggers ISR revalidation; wait then re-fetch
console.log('=== First hit (may trigger ISR revalidation) ===');
await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(3000);

console.log('=== Second hit (should serve fresh) ===');
await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(1500);

// Scroll for whileInView
const h = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 500) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(300); }
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);

// Click Descripción tab
await page.evaluate(() => {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const d = tabs.find(t => (t.textContent || '').trim() === 'Descripción');
  if (d) d.click();
});
await page.waitForTimeout(800);

// Dump H2-H5 headings
const headings = await page.$$eval('h2, h3, h4, h5', els => els.map(e => ({ tag: e.tagName, text: e.textContent?.trim().slice(0, 80) })));
console.log('\nHeadings:');
for (const h of headings) console.log(`  ${h.tag}: ${h.text}`);

// Search for Avica mentions
const avicaInfo = await page.evaluate(() => {
  const bodyText = document.body.textContent || '';
  const avicaIdx = bodyText.indexOf('Avica');
  if (avicaIdx < 0) return { found: false };
  return {
    found: true,
    context: bodyText.slice(Math.max(0, avicaIdx - 30), avicaIdx + 400),
  };
});
console.log('\n=== Avica mentions ===');
console.log('  found:', avicaInfo.found);
if (avicaInfo.found) console.log('  context:', JSON.stringify(avicaInfo.context));

// Search for "proyecto(s) en Propyte" pattern
const projMatch = await page.evaluate(() => {
  const t = document.body.textContent || '';
  const matches = t.match(/(\d+)\s*(proyectos?|projects?)\s*(en\s*Propyte)?/gi);
  return matches;
});
console.log('\n"N proyecto(s)" matches:', projMatch);

// Look for developer image / logo / link to /desarrolladores/avica-inmobiliaria
const devLink = await page.evaluate(() => {
  const anchors = Array.from(document.querySelectorAll('a[href]'));
  return anchors.find(a => (a.getAttribute('href') || '').includes('avica-inmobiliaria'))?.getAttribute('href') || null;
});
console.log('Link a perfil Avica:', devLink);

// Full descripción panel text
const panelText = await page.$eval('[role="tabpanel"]:not([hidden])', el => (el.textContent || '')).catch(() => null);
console.log('\n=== Descripción panel tail (last 800 chars) ===');
console.log((panelText || '').slice(-800));

await page.screenshot({ path: 'tests/qa-phase4/screenshots-1d/dev-card-avica.png', fullPage: true });

await browser.close();
