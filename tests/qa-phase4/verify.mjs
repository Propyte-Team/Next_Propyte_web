import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// 1. City listing
await page.goto('https://dev.propyte.com/es/desarrollos/cancun', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(2500);
const h = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 500) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(300); }
const allLinks = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')).filter(h => h && h.includes('/desarrollos/')));
console.log('CITY cancun - all desarrollo links:', allLinks.length);
console.log('Sample:', allLinks.slice(0, 8));

// 2. Detail ES - full panel text for tab 3
await page.goto('https://dev.propyte.com/es/desarrollos/akora-residencial-b73b319b', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(2000);
const h2 = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h2; y += 500) { await page.evaluate(s => window.scrollTo(0, s), y); await page.waitForTimeout(300); }
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);

await page.locator('[role="tab"]').nth(2).click();
await page.waitForTimeout(1000);
const tab3 = await page.$eval('[role="tabpanel"]:not([hidden])', el => el.textContent || '');
console.log('\n--- TAB 3 FULL TEXT (len=' + tab3.length + ') ---');
console.log(tab3);
console.log('--- END TAB 3 ---\n');

const bodyText = await page.evaluate(() => document.body.textContent || '');
const matches = bodyText.match(/formBudget|formInvestmentType|formPlusvalia|contact\.form/g);
console.log('FORM literal matches in body:', matches);
const idx = bodyText.search(/formBudget|formInvestmentType|formPlusvalia/);
if (idx > 0) console.log('Context:', JSON.stringify(bodyText.slice(Math.max(0, idx-80), idx+150)));

await browser.close();
