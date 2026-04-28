#!/usr/bin/env node
/**
 * Audit Sprint 3 — i18n refactor 356 ternarios → next-intl
 * Spot-check ES/EN routes para keys crudas + texto cross-locale
 */
import { chromium } from 'playwright';

const BASE = 'https://dev.propyte.com';
const DEV_SLUG = 'sample-azul-vivo-5a4e4a4e';
const UNIT_SLUG = 'sample-azul-vivo-a101-5a4e4a4e';

// Páginas con mayor concentración de ternarios refactorizados
const ROUTES = [
  '/',
  `/desarrollos/${DEV_SLUG}`,           // DevDetail (44 + RentalEstimate + InvestmentSummary + Geo + Cetes + MarketSentiment + Share)
  `/propiedades/${UNIT_SLUG}`,           // UnitDetail (26) + UnitInvestmentCalculator (41)
  '/desarrollos',
  '/propiedades',
  '/mercado',                             // MethodologySection (21) + ZoneAnalytics (19)
  '/zonas',                               // ZonasExplorer
  '/rentas',                              // RentalAnalysisDashboard
  '/financiamiento',
  '/como-invertir',
  '/unete',
  '/nosotros/quienes-somos',
];

const LOCALES = ['es', 'en'];
const results = [];
const push = (k, ok, note = '') => results.push({ k, ok: ok ? 'PASS' : 'FAIL', note });

// Pattern para detectar i18n keys crudas: namespace.subkey o namespace.subkey.deep
// Tolerante: descarta dominios/URLs (.com, .mx, .png), abreviaciones (S.A., M.N.), decimales
const KEY_PATTERN = /\b([a-z][a-zA-Z0-9]+(?:\.[a-zA-Z][a-zA-Z0-9]+){1,3})\b/g;
const ALLOW_LIST = new Set([
  'propyte.com', 'propyte.mx', 'instagram.com', 'facebook.com', 'whatsapp.com',
  'wa.me', 'gmail.com', 'webkoistudio.com',
  'p.s', 'sample.fee', // false positives data
]);

function findRawKeys(text) {
  const matches = [];
  let m;
  while ((m = KEY_PATTERN.exec(text)) !== null) {
    const candidate = m[1];
    if (ALLOW_LIST.has(candidate)) continue;
    if (/\.(com|mx|png|jpg|jpeg|svg|webp|webmanifest|css|js|html)$/.test(candidate)) continue;
    if (/^\d/.test(candidate)) continue; // skip starts with digit
    if (candidate.length < 8) continue; // skip short ambiguous like "p.s.s"
    // Accept only if has lowercase + camelCase pattern (typical i18n keys)
    const parts = candidate.split('.');
    if (parts.every(p => /^[a-z][a-z0-9]*$/.test(p))) continue; // all-lowercase = probably URL fragment
    if (parts.some(p => /[A-Z]/.test(p))) {
      // camelCase suspicious — confirm with surrounding context
      matches.push(candidate);
    }
  }
  return matches;
}

async function run() {
  const b = await chromium.launch();

  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      const url = `${BASE}/${locale}${route === '/' ? '' : route}`;
      const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      try {
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1500);

        if (!resp || !resp.ok()) {
          push(`HTTP-${locale}${route}`, false, `status=${resp?.status()}`);
          await ctx.close();
          continue;
        }

        // Click ALL tabs (so RentalEstimate, MarketSentiment, etc. are SSR-ed)
        const tabs = await page.$$('[role="tab"]');
        for (const tab of tabs) {
          try {
            await tab.click({ timeout: 1000 });
            await page.waitForTimeout(400);
          } catch {}
        }
        // Click first MUcho/Más button if any
        try {
          const moreBtn = page.locator('button', { hasText: /leer m[aá]s|read more/i }).first();
          if (await moreBtn.count() > 0) await moreBtn.click({ timeout: 1000 });
        } catch {}

        // Get visible text of <main> only (skip header/footer noise)
        const text = await page.evaluate(() => {
          const main = document.querySelector('main');
          return main ? main.innerText : document.body.innerText;
        });

        const rawKeys = findRawKeys(text);
        const uniq = [...new Set(rawKeys)];
        push(`Keys-${locale}${route}`, uniq.length === 0,
          uniq.length ? `${uniq.length} suspect: ${JSON.stringify(uniq.slice(0, 6))}` : '');

        // Cross-locale leak: if /es has English-only fillers OR /en has Spanish-only
        const esLeak = locale === 'en' && /\b(Departamentos|Desarrollos|Recámaras|Baños|Comprar|Preventa|Iniciar sesión|Inversión|Análisis)\b/.test(text);
        const enLeak = locale === 'es' && /\b(Apartments|Bedrooms|Bathrooms|Sign in|Investment Analysis|Buy|Pre-sale)\b/.test(text);
        push(`Cross-locale-${locale}${route}`, !esLeak && !enLeak,
          esLeak ? 'ES strings in EN' : enLeak ? 'EN strings in ES' : '');

        // <h1> exists & is non-empty
        const h1 = await page.evaluate(() => {
          const h = document.querySelector('main h1');
          return h ? h.textContent.trim() : null;
        });
        push(`H1-${locale}${route}`, !!h1 && h1.length > 0, h1 ? `"${h1.slice(0,60)}"` : 'no h1');

      } catch (e) {
        push(`Nav-${locale}${route}`, false, e.message.slice(0, 120));
      }
      await ctx.close();
    }
  }

  // === Specific deep-check: AZUL VIVO detail tabs in EN must be English ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/en/desarrollos/${DEV_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Verify the 3 tab labels are EN
    const tabLabels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button[role="tab"]')).map(b => b.textContent.trim());
    });
    const expectedEN = /Description|Overview|Location|Returns/i;
    const allEN = tabLabels.length >= 3 && tabLabels.every(l => expectedEN.test(l) || l.length === 0);
    push('Tabs-en-detail', allEN, `tabs=${JSON.stringify(tabLabels)}`);

    // Click Returns/Rentabilidad and verify NO Spanish leak
    for (const tab of await page.$$('[role="tab"]')) {
      try {
        const txt = (await tab.textContent()).toLowerCase();
        if (txt.includes('return') || txt.includes('rentabil')) {
          await tab.click();
          break;
        }
      } catch {}
    }
    await page.waitForTimeout(2000);
    const tabText = await page.evaluate(() => {
      const panel = document.querySelector('[role="tabpanel"]:not([hidden])');
      return panel ? panel.innerText.slice(0, 4000) : '';
    });
    const esLeak = /\b(Renta\s*Mensual|Inversión\s*total|Yield\s*bruto|Crecimiento\s*estimado|Plusvalía)\b/i.test(tabText);
    push('Returns-tab-en-no-es-leak', !esLeak, esLeak ? 'ES strings found in EN Returns tab' : '');

    await page.screenshot({ path: 'tests/screenshots/sprint3-en-returns.png', fullPage: false });
    await ctx.close();
  }

  // === ShareDownloadModal templates en EN should NOT have Spanish hardcoded ===
  // (Bug previo identificado: TemplateLetter strings ES hardcoded)
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/en/desarrollos/${DEV_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const offscreenES = await page.evaluate(() => {
      const text = document.body.innerHTML;
      return {
        fichaTecnica: /Ficha\s*T[ée]cnica/.test(text),
        caracteristicas: /Caracter[ií]sticas/.test(text),
        precio: /(?<![<\w])Precio(?![:\w])/.test(text),
        entregaEstimada: /Entrega\s*estimada/.test(text),
      };
    });
    const stillHardcoded = offscreenES.fichaTecnica || offscreenES.caracteristicas || offscreenES.entregaEstimada;
    push('Modal-template-letter-en', !stillHardcoded, JSON.stringify(offscreenES));
    await ctx.close();
  }

  await b.close();

  console.log('\n=== AUDIT SPRINT 3 i18n RESULTS ===');
  for (const r of results) {
    console.log(`[${r.ok}] ${r.k}${r.note ? ' — ' + r.note : ''}`);
  }
  const pass = results.filter(r => r.ok === 'PASS').length;
  const fail = results.filter(r => r.ok === 'FAIL').length;
  console.log(`\n${pass} PASS / ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(2); });
