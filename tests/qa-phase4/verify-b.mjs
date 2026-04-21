import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// 1. Check all og/canonical meta tags on city + detail
async function inspectMeta(url, label) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(800);
  const metas = await page.evaluate(() => {
    const all = {};
    document.querySelectorAll('meta').forEach(m => {
      const k = m.getAttribute('property') || m.getAttribute('name');
      const v = m.getAttribute('content');
      if (k && (k.startsWith('og:') || k.startsWith('twitter:') || k === 'description' || k === 'keywords' || k === 'robots')) all[k] = v;
    });
    const canon = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null;
    return { metas: all, canonical: canon };
  });
  console.log(`\n=== ${label} ===\n${url}`);
  console.log('canonical:', metas.canonical);
  console.log('tags:', JSON.stringify(metas.metas, null, 2));
}

await inspectMeta('https://dev.propyte.com/es/desarrollos/cancun', 'CITY cancun');
await inspectMeta('https://dev.propyte.com/es/desarrollos/akora-residencial-b73b319b', 'DETAIL akora');

// 2. Breadcrumb hunt
await page.goto('https://dev.propyte.com/es/desarrollos/akora-residencial-b73b319b', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(1500);
const h = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 500) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(250); }
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);

const crumbs = await page.evaluate(() => {
  const out = [];
  // Any link containing "Inicio" or pointing to /desarrollos that is near the top
  const anchors = Array.from(document.querySelectorAll('a[href]'));
  for (const a of anchors.slice(0, 30)) {
    const href = a.getAttribute('href') || '';
    const text = a.textContent?.trim() || '';
    if (/inicio|home|desarrollos$|desarrollos\/(cancun|playa-del-carmen|tulum|merida)$/i.test(href + ' ' + text)) {
      const rect = a.getBoundingClientRect();
      out.push({ href, text: text.slice(0, 40), y: Math.round(rect.top) });
    }
  }
  return out;
});
console.log('\n=== DETAIL breadcrumb-candidate links (first 30 anchors) ===');
for (const c of crumbs) console.log(`  y=${c.y}  "${c.text}" -> ${c.href}`);

// Also get the first nav structure
const navs = await page.$$eval('nav', ns => ns.map((n, i) => ({
  idx: i,
  ariaLabel: n.getAttribute('aria-label'),
  className: n.className?.toString().slice(0, 80),
  linkCount: n.querySelectorAll('a').length,
  firstLinks: Array.from(n.querySelectorAll('a')).slice(0, 5).map(a => `${a.textContent?.trim().slice(0,20)} -> ${a.getAttribute('href')}`),
})));
console.log('\n=== <nav> elements on detail ===');
for (const n of navs) console.log(JSON.stringify(n, null, 2));

await browser.close();
