import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

async function inspect(url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1500);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(250); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

// ============ 1. Full page body inspection for sample dev (find developer count + iframes) ============
console.log('=== SAMPLE dev full page inspection ===');
await inspect('https://dev.propyte.com/es/desarrollos/sample-azul-vivo-5a4e4a4e');

const pageInfo = await page.evaluate(() => {
  const bodyText = document.body.textContent || '';
  const allIframes = Array.from(document.querySelectorAll('iframe')).map(i => i.getAttribute('src')?.slice(0, 80) || 'no-src');
  // Match "N proyecto(s)" anywhere in body
  const projMatch = bodyText.match(/(\d+)\s*(proyectos?|projects?)/gi);
  // Match "Propyte" nearby "proyecto"
  const propyteIdx = bodyText.indexOf('proyecto');
  const contextAroundProyecto = propyteIdx >= 0 ? bodyText.slice(Math.max(0, propyteIdx-60), propyteIdx+80) : null;
  // Per tabpanel
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]')).map((p, i) => ({
    idx: i,
    hidden: p.hasAttribute('hidden'),
    iframes: p.querySelectorAll('iframe').length,
    iframeSrcs: Array.from(p.querySelectorAll('iframe')).map(x => x.getAttribute('src')?.slice(0, 60)),
    textStart: (p.textContent || '').slice(0, 120),
  }));
  return { allIframes, projMatch, contextAroundProyecto, panels };
});
console.log('  All iframes on page:', pageInfo.allIframes);
console.log('  "N proyecto(s)" matches:', pageInfo.projMatch);
console.log('  Context around "proyecto":', JSON.stringify(pageInfo.contextAroundProyecto));
console.log('  Panels:');
for (const p of pageInfo.panels) console.log(`    panel ${p.idx} hidden=${p.hidden} iframes=${p.iframes} srcs=${JSON.stringify(p.iframeSrcs)} text="${p.textStart}"`);

// Click tab 2 (Análisis Geográfico / Location) and re-check iframes
console.log('\n--- Click tab Location (index 1) ---');
await page.evaluate(() => {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  if (tabs[1]) tabs[1].click();
});
await page.waitForTimeout(800);
const afterClick = await page.evaluate(() => {
  const panel = document.querySelector('[role="tabpanel"]:not([hidden])');
  return {
    iframes: panel ? Array.from(panel.querySelectorAll('iframe')).map(i => i.getAttribute('src')?.slice(0, 80)) : [],
    textStart: panel ? (panel.textContent || '').slice(0, 200) : null,
  };
});
console.log('  Tab Location panel iframes:', afterClick.iframes);
console.log('  Text start:', afterClick.textStart);

// ============ 2. ES tab label verification (developer + propiedades) ============
console.log('\n=== ES tabs /desarrollos vs /propiedades ===');
await inspect('https://dev.propyte.com/es/desarrollos/akora-residencial-b73b319b');
const devTabs = await page.$$eval('[role="tab"]', els => els.map(e => e.textContent?.trim()));
console.log('  /es/desarrollos tabs:', devTabs.slice(0, 3));

await inspect('https://dev.propyte.com/es/propiedades/akora-a301-cancun');
const propTabs = await page.$$eval('[role="tab"]', els => els.map(e => e.textContent?.trim()));
console.log('  /es/propiedades tabs:', propTabs.slice(0, 3));

await browser.close();
