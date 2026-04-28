#!/usr/bin/env node
/**
 * Audit Sprint 2 sesión 29 — develop @ 1e333d2
 * Verifica: Hero, WA, financials AZUL VIVO, geocoding pin, /propiedades 6 units, GA4, footer a11y
 */
import { chromium } from 'playwright';

const BASE = 'https://dev.propyte.com';
const DEV_SLUG = 'sample-azul-vivo-5a4e4a4e';
const results = [];
const push = (k, ok, note = '') => results.push({ k, ok: ok ? 'PASS' : 'FAIL', note });

async function run() {
  const b = await chromium.launch();

  // === [Sprint 2 #2] Hero H1 = "Departamentos, casas y terrenos en Riviera Maya" ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const hero = await page.evaluate(() => {
      const h1 = document.querySelector('section.propyte-hero h1');
      const subtitle = document.querySelector('section.propyte-hero p');
      const tagline = document.querySelectorAll('section.propyte-hero p');
      return {
        h1Text: h1 ? h1.textContent.trim() : null,
        subtitleText: subtitle ? subtitle.textContent.trim() : null,
        tagText: tagline.length > 1 ? tagline[1].textContent.trim() : null,
      };
    });
    const expected = 'Departamentos, casas y terrenos en Riviera Maya';
    push('Hero-H1-newSEO', hero.h1Text === expected, `got="${hero.h1Text}" expected="${expected}"`);
    push('Hero-subtitle-new', /Análisis de mercado verificado/.test(hero.subtitleText || ''),
      `subtitle="${hero.subtitleText}"`);
    push('Hero-tagline-Invierte', /Invierte con datos.*Decide con confianza/.test(hero.tagText || ''),
      `tagline="${hero.tagText}"`);
    await ctx.close();
  }

  // === [Sprint 2 #4] WhatsApp number 529843235354 (real) ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es/desarrollos/${DEV_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const wa = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="wa.me"]')).map(a => a.href);
      const tels = Array.from(document.querySelectorAll('a[href^="tel:"]')).map(a => a.href);
      return { waLinks: links.slice(0, 4), telLinks: tels.slice(0, 2) };
    });
    const newNum = '529843235354';
    const oldNum = '5219843235354';
    const hasNew = wa.waLinks.some(l => l.includes(newNum)) || wa.telLinks.some(l => l.includes(newNum));
    const hasOld = wa.waLinks.some(l => l.includes(oldNum)) || wa.telLinks.some(l => l.includes(oldNum));
    push('WA-real-number', hasNew && !hasOld, `new=${hasNew} oldStillThere=${hasOld} samples=${JSON.stringify(wa)}`);
    await ctx.close();
  }

  // === [Sprint 2 #5] AZUL VIVO financials: cap 3.84% / ROI 8.84% / rent 12,800 ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es/desarrollos/${DEV_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Click tab Rentabilidad to render InvestmentSummary
    const rentaTab = await page.locator('button[role="tab"]', { hasText: /rentabilidad|returns/i }).first();
    if (await rentaTab.count() > 0) {
      await rentaTab.click();
      await page.waitForTimeout(1500);
    }

    const financials = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        roi884: /8\.84\s*%/.test(text),
        cap384: /3\.84\s*%/.test(text),
        rent12800: /\$?\s*12[,.]?800/.test(text),
        hasCapRateLabel: /cap\s*rate/i.test(text),
        hasROILabel: /ROI/i.test(text),
        hasMonthlyRentLabel: /(renta\s*mensual|monthly\s*rent)/i.test(text),
      };
    });
    push('Financials-ROI-8.84', financials.roi884, JSON.stringify(financials));
    push('Financials-Cap-3.84', financials.cap384, '');
    push('Financials-Rent-12800', financials.rent12800, '');

    await page.screenshot({ path: 'tests/screenshots/sprint2-azulvivo-rentabilidad.png', fullPage: false });
    await ctx.close();
  }

  // === [Sprint 2 #6] AZUL VIVO geocoding: lat/lng → map pin renders ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es/desarrollos/${DEV_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Click tab Análisis Geográfico
    const geoTab = await page.locator('button[role="tab"]', { hasText: /geográfico|location/i }).first();
    if (await geoTab.count() > 0) {
      await geoTab.click();
      await page.waitForTimeout(2500);
    }
    const map = await page.evaluate(() => {
      const gmap = document.querySelector('div[aria-label][role="region"], gmp-advanced-marker, [class*="gm-style"]');
      const pinDom = document.querySelectorAll('[class*="advanced-marker"], gmp-advanced-marker, [aria-label*="Ubicación"], [aria-label*="Location"]');
      const iframes = Array.from(document.querySelectorAll('iframe')).map(i => i.src);
      return { hasGoogleMap: !!gmap, pinCount: pinDom.length, iframesCount: iframes.length };
    });
    push('Map-renders-pin', map.hasGoogleMap || map.pinCount > 0 || map.iframesCount > 0, JSON.stringify(map));
    await page.screenshot({ path: 'tests/screenshots/sprint2-azulvivo-geo.png', fullPage: false });
    await ctx.close();
  }

  // === [Sprint 2 #9] /propiedades muestra 6 unidades AZUL VIVO ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es/propiedades`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const props = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('a[href^="/es/propiedades/"]'))
        .map(a => a.getAttribute('href'))
        .filter(h => /\/propiedades\/[a-z0-9-]+/.test(h));
      return { count: new Set(cards).size, samples: Array.from(new Set(cards)).slice(0, 6) };
    });
    push('Propiedades-6-units', props.count >= 6, `count=${props.count} samples=${JSON.stringify(props.samples)}`);
    await ctx.close();
  }

  // === Sprint 1 / Phase 27-abr: GA4 deployed? ===
  {
    const ctx = await b.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const ga4 = await page.evaluate(() => ({
      gtagFn: typeof window.gtag === 'function',
      dataLayer: Array.isArray(window.dataLayer),
      gtagScripts: Array.from(document.querySelectorAll('script[src*="googletagmanager"]')).length,
    }));
    push('GA4-deployed', ga4.gtagFn && ga4.dataLayer && ga4.gtagScripts > 0, JSON.stringify(ga4));
    await ctx.close();
  }

  // === Sprint 1 a11y footer: text-white/70 instead of /50 ===
  {
    const ctx = await b.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const footer = await page.evaluate(() => {
      const f = document.querySelector('footer');
      if (!f) return null;
      const html = f.innerHTML;
      return {
        whiteSlash70: (html.match(/text-white\/70/g) || []).length,
        whiteSlash50: (html.match(/text-white\/50/g) || []).length,
        whiteSlash60: (html.match(/text-white\/60/g) || []).length,
      };
    });
    push('Footer-a11y-deployed', footer && footer.whiteSlash70 > 0 && footer.whiteSlash50 === 0,
      JSON.stringify(footer));
    await ctx.close();
  }

  // === d169b9b header bubble removed in archives ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es/desarrollos`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const has = await page.evaluate(() => {
      const sb = document.querySelector('header form.propyte-search-bubble, header [class*="search-bubble"]');
      return !!sb;
    });
    push('Header-no-bubble-archives', !has, `bubble visible=${has}`);
    await ctx.close();
  }

  // === ShareDownloadModal Esc fix (regression check) ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es/desarrollos/${DEV_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const compartirBtn = page.locator('button', { hasText: /comparti|share/i }).first();
    if (await compartirBtn.count() > 0) {
      await compartirBtn.click();
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      const escClosed = await page.evaluate(() => !document.querySelector('a[href*="wa.me"][target="_blank"]'));
      push('Esc-closes-share-dropdown-FIXED', escClosed, '');
    } else {
      push('Esc-closes-share-dropdown-FIXED', false, 'btn not found');
    }
    await ctx.close();
  }

  await b.close();

  console.log('\n=== AUDIT SPRINT 2 RESULTS ===');
  for (const r of results) {
    console.log(`[${r.ok}] ${r.k}${r.note ? ' — ' + r.note : ''}`);
  }
  const pass = results.filter(r => r.ok === 'PASS').length;
  const fail = results.filter(r => r.ok === 'FAIL').length;
  console.log(`\n${pass} PASS / ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(2); });
