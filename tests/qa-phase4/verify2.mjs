import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('https://dev.propyte.com/es/desarrollos/cancun', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(3000);
const h = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 500) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(300); }

const pageTitle = await page.title();
const mainH1 = await page.$eval('h1', el => el.textContent?.trim() || '').catch(() => null);
const mainH2 = await page.$$eval('h2', els => els.map(e => e.textContent?.trim() || '').slice(0, 10)).catch(() => []);
const bodyLen = await page.evaluate(() => document.body.textContent?.length || 0);
const allHrefs = await page.$$eval('a[href]', as => Array.from(new Set(as.map(a => a.getAttribute('href')).filter(h => h && (h.includes('/desarrollos') || h.includes('/propiedades'))))));
console.log('cancun TITLE:', pageTitle);
console.log('cancun H1:', mainH1);
console.log('cancun H2s:', mainH2);
console.log('body len:', bodyLen);
console.log('all relevant links:');
for (const h of allHrefs) console.log(' -', h);

// Is there an article or grid with developments?
const articles = await page.$$eval('article, [role="article"]', a => a.length);
const gridCards = await page.$$eval('[class*="grid"] a, [class*="card"]', a => a.length);
console.log('articles:', articles, 'card-like:', gridCards);

await browser.close();
