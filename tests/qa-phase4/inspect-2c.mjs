#!/usr/bin/env node
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 2000 } });
  const page = await ctx.newPage();

  await page.goto('https://dev.propyte.com/es/desarrollos/akora-residencial-b73b319b', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1500);

  // Click Ubicación
  await page.evaluate(() => {
    const t = Array.from(document.querySelectorAll('[role="tab"]')).find(el => (el.textContent || '').trim() === 'Ubicación');
    t?.click();
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(1000);

  // Dump tabpanel active content near zone scores
  const geoDump = await page.evaluate(() => {
    const panel = document.querySelector('[role="tabpanel"]:not([hidden])');
    if (!panel) return null;
    return {
      innerTextHead: (panel.textContent || '').slice(0, 2500),
      h3: Array.from(panel.querySelectorAll('h3, h4, h5')).map(h => h.textContent?.trim()).slice(0, 20),
      svgCount: panel.querySelectorAll('svg').length,
      iframeCount: panel.querySelectorAll('iframe').length,
      classes: Array.from(new Set(Array.from(panel.querySelectorAll('*')).map(e => e.className).filter(c => typeof c === 'string' && /score|zone|composite/i.test(c)))).slice(0, 10),
    };
  });
  console.log('\n=== GEO TAB PANEL ===');
  console.log(JSON.stringify(geoDump, null, 2));

  // Now click Rentabilidad
  await page.evaluate(() => {
    const t = Array.from(document.querySelectorAll('[role="tab"]')).find(el => (el.textContent || '').trim() === 'Rentabilidad');
    t?.click();
  });
  await page.waitForTimeout(1800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(2000); // recharts needs time

  const retDump = await page.evaluate(() => {
    const panel = document.querySelector('[role="tabpanel"]:not([hidden])');
    if (!panel) return null;
    return {
      innerTextHead: (panel.textContent || '').slice(0, 3000),
      h3: Array.from(panel.querySelectorAll('h3, h4')).map(h => h.textContent?.trim()).slice(0, 20),
      svgClasses: Array.from(panel.querySelectorAll('svg')).map(s => s.getAttribute('class') || 'noclass').slice(0, 10),
      svgCount: panel.querySelectorAll('svg').length,
      rechartsCount: panel.querySelectorAll('.recharts-wrapper, .recharts-responsive-container').length,
      // Capture every percentage pattern
      percentMatches: ((panel.textContent || '').match(/\b\d{1,2}(?:\.\d)?%/g) || []).slice(0, 20),
    };
  });
  console.log('\n=== RENTABILIDAD TAB PANEL ===');
  console.log(JSON.stringify(retDump, null, 2));

  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
