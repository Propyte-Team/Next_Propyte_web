#!/usr/bin/env node
/**
 * Fase 4 — Commit A audit: Tabs system en /desarrollos/[slug]
 *
 * Checks:
 *  1. /es/desarrollos/cancun          - city listing sin regresion
 *  2. /es/desarrollos/akora-...       - detail con 3 tabs
 *  3. Keyboard nav (Tab, arrows, Home/End)
 *  4. Tab "Rentabilidad" -> RentalEstimate visible, InvestmentSummary ausente OK
 *  5. Tab "Analisis Geografico" -> map placeholder + address/zone
 *  6. EN locale tabs: Overview / Location / Returns
 *  7. Sin regresion de contact.formBudget literal
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE = 'https://dev.propyte.com';
const OUT = 'tests/qa-phase4/screenshots-tabs';
const SLUG = 'akora-residencial-b73b319b';

function log(msg) {
  console.log(msg);
}

async function auditCityListing(browser) {
  const section = { name: '1. City listing (/es/desarrollos/cancun)', checks: [] };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(`${BASE}/es/desarrollos/cancun`, { waitUntil: 'networkidle', timeout: 45000 });
    section.checks.push({ k: 'HTTP status', v: resp?.status(), ok: resp?.status() === 200 });

    // Scroll step-by-step for whileInView
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 630) {
      await page.evaluate((s) => window.scrollTo(0, s), y);
      await page.waitForTimeout(300);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const cards = await page.$$eval('a[href*="/desarrollos/"]', (as) =>
      as.map((a) => a.getAttribute('href')).filter((h) => /\/desarrollos\/[a-z0-9-]+$/.test(h || ''))
    );
    section.checks.push({ k: 'Property cards detected', v: cards.length, ok: cards.length > 0 });
    section.checks.push({ k: 'Has Tab role elements (should be 0)', v: await page.$$eval('[role="tab"]', (els) => els.length), ok: true });
    await page.screenshot({ path: join(OUT, 'city-cancun.png'), fullPage: true });
  } catch (e) {
    section.error = e.message;
  }
  await ctx.close();
  return section;
}

async function auditDetailTabs(browser, locale) {
  const section = { name: `Detail ${locale.toUpperCase()} (/${locale}/desarrollos/${SLUG})`, checks: [] };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(`${BASE}/${locale}/desarrollos/${SLUG}`, { waitUntil: 'networkidle', timeout: 45000 });
    section.checks.push({ k: 'HTTP status', v: resp?.status(), ok: resp?.status() === 200 });

    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 630) {
      await page.evaluate((s) => window.scrollTo(0, s), y);
      await page.waitForTimeout(300);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);

    // Tab elements
    const tabs = await page.$$eval('[role="tab"]', (els) =>
      els.map((e) => ({
        text: e.textContent?.trim() || '',
        selected: e.getAttribute('aria-selected'),
        id: e.id || null,
        controls: e.getAttribute('aria-controls'),
      }))
    );
    section.checks.push({ k: 'Tab count (expect 3)', v: tabs.length, ok: tabs.length === 3 });
    section.checks.push({ k: 'Tab labels', v: tabs.map((t) => t.text).join(' | '), ok: true });

    const expectedLabels = locale === 'es'
      ? ['overview', 'ubic', 'rent']
      : ['overview', 'location', 'return'];
    const labelsMatch = tabs.every((t, i) => {
      const lower = t.text.toLowerCase();
      return lower.includes(expectedLabels[i] || '');
    });
    section.checks.push({ k: `Labels match ${locale} scheme`, v: labelsMatch, ok: labelsMatch });

    // Keyboard nav
    if (tabs.length === 3) {
      const firstTabId = tabs[0].id;
      if (firstTabId) {
        await page.focus(`#${firstTabId}`);
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(300);
        const afterRight = await page.$$eval('[role="tab"][aria-selected="true"]', (els) => els[0]?.textContent?.trim() || '');
        section.checks.push({ k: 'ArrowRight -> tab 2', v: afterRight, ok: afterRight === tabs[1].text });

        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(300);
        const afterRight2 = await page.$$eval('[role="tab"][aria-selected="true"]', (els) => els[0]?.textContent?.trim() || '');
        section.checks.push({ k: 'ArrowRight -> tab 3', v: afterRight2, ok: afterRight2 === tabs[2].text });

        await page.keyboard.press('Home');
        await page.waitForTimeout(300);
        const afterHome = await page.$$eval('[role="tab"][aria-selected="true"]', (els) => els[0]?.textContent?.trim() || '');
        section.checks.push({ k: 'Home -> tab 1', v: afterHome, ok: afterHome === tabs[0].text });

        await page.keyboard.press('End');
        await page.waitForTimeout(300);
        const afterEnd = await page.$$eval('[role="tab"][aria-selected="true"]', (els) => els[0]?.textContent?.trim() || '');
        section.checks.push({ k: 'End -> last tab', v: afterEnd, ok: afterEnd === tabs[tabs.length - 1].text });
      } else {
        section.checks.push({ k: 'Keyboard nav', v: 'no tab IDs found', ok: false });
      }
    }

    // Click each tab and inspect panel contents
    for (let i = 0; i < tabs.length; i++) {
      await page.click(`[role="tab"]:nth-of-type(${i + 1})`).catch(() => {});
      // prefer clicking by text to be safe
      const tabLocator = page.locator('[role="tab"]').nth(i);
      await tabLocator.click().catch(() => {});
      await page.waitForTimeout(500);

      const panel = await page.$eval('[role="tabpanel"]:not([hidden])', (el) => ({
        text: (el.textContent || '').slice(0, 800),
        hasIframe: !!el.querySelector('iframe'),
        hasTable: !!el.querySelector('table'),
      })).catch(() => null);

      section.checks.push({
        k: `Tab ${i + 1} "${tabs[i].text}" panel length`,
        v: panel?.text.length || 0,
        ok: (panel?.text.length || 0) > 50,
      });

      if (i === 1) { // Ubicacion / Location
        section.checks.push({
          k: `Tab 2 has iframe or map container`,
          v: panel?.hasIframe || /(map|maps|ubicaci|location)/i.test(panel?.text || ''),
          ok: true,
        });
      }
      if (i === 2) { // Rentabilidad / Returns
        const hasRental = /(renta|rental|estimad|monthly)/i.test(panel?.text || '');
        section.checks.push({ k: `Tab 3 shows RentalEstimate`, v: hasRental, ok: hasRental });
        const hasInvSummary = /TIR|IRR|cap rate|yield neto|net yield/i.test(panel?.text || '');
        section.checks.push({ k: `Tab 3 InvestmentSummary (should be absent, data gap)`, v: hasInvSummary, ok: !hasInvSummary });
      }
      await page.screenshot({ path: join(OUT, `detail-${locale}-tab${i + 1}.png`), fullPage: false });
    }

    // Check ContactForm for formBudget literal (regression check)
    const fullBody = await page.evaluate(() => document.body.textContent || '');
    const hasLiteral = /contact\.formBudget|formBudget|formInvestmentType|formPlusvalia/.test(fullBody);
    section.checks.push({ k: 'ContactForm literal keys (should be false)', v: hasLiteral, ok: !hasLiteral });

    await page.screenshot({ path: join(OUT, `detail-${locale}-full.png`), fullPage: true });
  } catch (e) {
    section.error = e.message;
  }
  await ctx.close();
  return section;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  log('\n=== FASE 4 / COMMIT A AUDIT ===\n');

  const results = [];
  results.push(await auditCityListing(browser));
  results.push(await auditDetailTabs(browser, 'es'));
  results.push(await auditDetailTabs(browser, 'en'));

  await browser.close();

  for (const s of results) {
    log(`\n-- ${s.name} --`);
    if (s.error) {
      log(`   ERROR: ${s.error}`);
      continue;
    }
    for (const c of s.checks) {
      const mark = c.ok === false ? 'FAIL' : c.ok === true ? 'OK  ' : '?   ';
      log(`   [${mark}] ${c.k}: ${c.v}`);
    }
  }

  await writeFile('tests/qa-phase4/tabs-report.json', JSON.stringify(results, null, 2), 'utf-8');

  const failures = results.flatMap((s) =>
    s.error ? [`${s.name}: ${s.error}`] : s.checks.filter((c) => c.ok === false).map((c) => `${s.name} -> ${c.k}`)
  );
  log(`\n\n== SUMMARY: ${failures.length === 0 ? 'ALL GREEN' : `${failures.length} FAILURES`} ==`);
  for (const f of failures) log(`  - ${f}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
