#!/usr/bin/env node
import { chromium, devices } from 'playwright';

const BASE = 'https://dev.propyte.com';
const URL = '/es/desarrollos/sample-azul-vivo-5a4e4a4e';

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13 Pro'] });
  const page = await ctx.newPage();
  const networkFails = [];
  page.on('response', res => {
    if (res.status() >= 400) networkFails.push({ url: res.url().slice(0, 200), status: res.status(), type: res.request().resourceType() });
  });

  await page.goto(BASE + URL, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1500);
  const scrollH = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < scrollH; y += 400) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(150); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  const smallTaps = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a[href], [role="button"], [role="tab"]'));
    const small = [];
    for (const b of btns) {
      const r = b.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.height < 32 || r.width < 32)) {
        small.push({
          tag: b.tagName,
          text: (b.textContent || '').trim().slice(0, 30),
          ariaLabel: b.getAttribute('aria-label')?.slice(0, 40) || null,
          cls: (b.className || '').toString().slice(0, 80),
          w: Math.round(r.width),
          h: Math.round(r.height),
        });
      }
    }
    return small;
  });

  console.log(`\n=== ${smallTaps.length} tap targets <32px ===`);
  // Group by aria/text pattern
  const groups = {};
  for (const t of smallTaps) {
    const key = `${t.tag}|${t.ariaLabel || t.text || '?'}|${t.w}x${t.h}`;
    groups[key] = (groups[key] || 0) + 1;
  }
  for (const [k, n] of Object.entries(groups).sort((a, b) => b[1] - a[1])) console.log(`  ${n}x  ${k}`);

  console.log(`\n=== Network failures (${networkFails.length}) ===`);
  for (const n of networkFails.slice(0, 8)) console.log(`  ${n.status} [${n.type}] ${n.url}`);

  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
