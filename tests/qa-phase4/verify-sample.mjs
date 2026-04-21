import { chromium } from 'playwright';

const BASE = 'https://dev.propyte.com';
const DEV_SLUG = 'sample-azul-vivo-5a4e4a4e';
const UNIT_SLUGS = [
  'sample-azul-vivo-a101-5a4e4a4e',
  'sample-azul-vivo-a102-5a4e4a4e',
  'sample-azul-vivo-a103-5a4e4a4e',
  'sample-azul-vivo-a104-5a4e4a4e',
  'sample-azul-vivo-ph501-5a4e4a4e',
  'sample-azul-vivo-st001-5a4e4a4e',
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

async function probe(url, label) {
  try {
    const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const status = r?.status() ?? 'no-response';
    const h1 = await page.$eval('h1', el => el.textContent?.trim() || '').catch(() => null);
    const title = await page.title().catch(() => null);
    console.log(`${status}  ${label.padEnd(44)} h1="${(h1 || '').slice(0, 60)}"  title="${(title || '').slice(0, 60)}"`);
    return status;
  } catch (e) {
    console.log(`ERR    ${label}  ${e.message}`);
    return null;
  }
}

console.log('=== SAMPLE VERIFY ===\n');
console.log('Detail del desarrollo sample:');
await probe(`${BASE}/es/desarrollos/${DEV_SLUG}`, `/es/desarrollos/${DEV_SLUG}`);
await probe(`${BASE}/en/desarrollos/${DEV_SLUG}`, `/en/desarrollos/${DEV_SLUG}`);

console.log('\nUnidades sample:');
for (const s of UNIT_SLUGS) {
  await probe(`${BASE}/es/propiedades/${s}`, `/es/propiedades/${s}`);
}

console.log('\nListing aparece en /es/desarrollos?');
await page.goto(`${BASE}/es/desarrollos`, { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(2000);
const h = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 600) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(250); }
const hasSample = await page.evaluate((slug) => {
  const anchors = Array.from(document.querySelectorAll('a[href]'));
  return anchors.some(a => (a.getAttribute('href') || '').includes(slug));
}, DEV_SLUG);
const totalSlugs = await page.evaluate(() => {
  const anchors = Array.from(document.querySelectorAll('a[href]'));
  const set = new Set();
  for (const a of anchors) {
    const m = (a.getAttribute('href') || '').match(/\/desarrollos\/([^/?#]+)$/);
    if (m) set.add(m[1]);
  }
  return Array.from(set).length;
});
console.log(`  total slugs en listing: ${totalSlugs}`);
console.log(`  sample visible en listing: ${hasSample ? 'YES' : 'NO (cached ISR?)'}`);

await browser.close();
