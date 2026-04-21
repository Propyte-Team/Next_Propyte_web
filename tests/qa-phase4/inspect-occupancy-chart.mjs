#!/usr/bin/env node
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 2000 } });
  const page = await ctx.newPage();

  await page.goto('https://dev.propyte.com/es/desarrollos/akora-residencial-b73b319b', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    const t = Array.from(document.querySelectorAll('[role="tab"]')).find(el => (el.textContent || '').trim() === 'Ubicación');
    t?.click();
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollBy(0, 900));
  await page.waitForTimeout(2500);

  // Extract Y-axis tick values from the occupancy chart
  const info = await page.evaluate(() => {
    const panel = document.querySelector('[role="tabpanel"]:not([hidden])');
    if (!panel) return null;
    // Recharts typically puts ticks inside <text> elements in the cartesian axis group
    const axisTexts = Array.from(panel.querySelectorAll('.recharts-cartesian-axis-tick text, .recharts-yAxis text'));
    const tickValues = axisTexts.map(t => (t.textContent || '').trim()).filter(v => v.length > 0);
    // Heading context
    const near = Array.from(panel.querySelectorAll('h3, h4')).map(h => (h.textContent || '').trim());
    // Detect percentage values
    const allText = (panel.textContent || '').slice(0, 3000);
    return { tickValues: tickValues.slice(0, 30), headings: near, bodySlice: allText.slice(-1200) };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
