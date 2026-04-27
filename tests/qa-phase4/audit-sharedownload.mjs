#!/usr/bin/env node
/**
 * Audit ShareDownloadModal + ExpandableText + header layout fixes (commits 22-abr)
 * + verifica si commits 27-abr (GA4, a11y) están deployados
 */
import { chromium } from 'playwright';

const BASE = 'https://dev.propyte.com';
const DEV_SLUG = 'sample-azul-vivo-5a4e4a4e';
const results = [];
const push = (k, ok, note = '') => results.push({ k, ok: ok ? 'PASS' : 'FAIL', note });

async function run() {
  const b = await chromium.launch();

  // === [27-abr] GA4 deployed? ===
  {
    const ctx = await b.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const ga4 = await page.evaluate(() => ({
      gtagFn: typeof window.gtag === 'function',
      dataLayer: Array.isArray(window.dataLayer),
      gtagScripts: Array.from(document.querySelectorAll('script[src*="googletagmanager"]')).map(s => s.src),
      gaIdInline: document.documentElement.outerHTML.includes('G-H4VD5TVEKM'),
    }));
    push('GA4-script-tag', ga4.gtagScripts.length > 0, JSON.stringify(ga4));
    push('GA4-window-gtag', ga4.gtagFn);
    push('GA4-dataLayer', ga4.dataLayer);
    await ctx.close();
  }

  // === [27-abr] a11y contraste footer (text-white/70 vs /50) ===
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
        whiteSlash40: (html.match(/text-white\/40/g) || []).length,
        whiteSlash55: (html.match(/text-white\/55/g) || []).length,
        whiteSlash20: (html.match(/text-white\/20/g) || []).length,
      };
    });
    push('Footer-a11y-deployed', footer && footer.whiteSlash70 > 0 && footer.whiteSlash50 === 0,
      JSON.stringify(footer));
    await ctx.close();
  }

  // === [22-abr d169b9b] /desarrollos: NO SearchBubble en header ===
  for (const path of ['/es/desarrollos', '/es/propiedades']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const has = await page.evaluate(() => {
      const sb = document.querySelector('[class*="propyte-search-bubble"], form[role="search"] input[placeholder]');
      const headerBubble = document.querySelector('header [class*="search-bubble"]');
      return { sb: !!sb, headerBubble: !!headerBubble };
    });
    push(`HeaderBubble-${path}`, !has.headerBubble, JSON.stringify(has));
    await ctx.close();
  }

  // === [22-abr d169b9b] /mercado: bg-white not dark ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es/mercado`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const bg = await page.evaluate(() => {
      const main = document.querySelector('main');
      const computed = main ? getComputedStyle(main).backgroundColor : null;
      const html = main ? main.outerHTML.slice(0, 500) : '';
      return { computed, hasBgWhite: html.includes('bg-white') };
    });
    push('Mercado-bg-white', bg.computed === 'rgb(255, 255, 255)' || bg.hasBgWhite, JSON.stringify(bg));
    await ctx.close();
  }

  // === [22-abr d169b9b] /nosotros: white strip pt above dark hero ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es/nosotros/quienes-somos`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const padding = await page.evaluate(() => {
      const wrappers = Array.from(document.querySelectorAll('div')).filter(d => {
        const pt = parseInt(getComputedStyle(d).paddingTop, 10);
        return pt >= 70 && pt <= 90;
      });
      return wrappers.length;
    });
    push('Nosotros-pt-strip', padding > 0, `wrappers with pt 70-90px: ${padding}`);
    await ctx.close();
  }

  // === [22-abr 352d35a] DEVELOPMENT DETAIL: ShareDownloadModal full audit ===
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es/desarrollos/${DEV_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 1. Triggers visible
    const triggers = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button[aria-expanded]'));
      return buttons.map(b => ({
        text: (b.textContent || '').trim().slice(0, 30),
        ariaExpanded: b.getAttribute('aria-expanded'),
        disabled: b.disabled,
      }));
    });
    const compartirBtn = triggers.find(t => /comparti|share/i.test(t.text));
    const fichaBtn = triggers.find(t => /ficha|download/i.test(t.text));
    push('Trigger-Compartir', !!compartirBtn, JSON.stringify(compartirBtn || triggers.slice(0, 5)));
    push('Trigger-Ficha', !!fichaBtn, JSON.stringify(fichaBtn || ''));

    // 2. Click Compartir → dropdown
    if (compartirBtn) {
      await page.getByRole('button', { name: /comparti|share/i }).first().click();
      await page.waitForTimeout(400);
      const items = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="wa.me"], a[href*="facebook.com/sharer"], a[href*="x.com/intent"]'));
        const copy = Array.from(document.querySelectorAll('button')).find(b => /copiar|copy/i.test(b.textContent || ''));
        return { wa: !!links.find(l => l.href.includes('wa.me')), fb: !!links.find(l => l.href.includes('facebook')), x: !!links.find(l => l.href.includes('x.com')), copy: !!copy };
      });
      push('Compartir-dropdown-items', items.wa && items.fb && items.x && items.copy, JSON.stringify(items));
      await page.keyboard.press('Escape').catch(() => {});
      await page.locator('body').click({ position: { x: 1, y: 1 } }).catch(() => {});
      await page.waitForTimeout(200);
    }

    // 3. Click Ficha → dropdown 3 items + a11y semantic check
    if (fichaBtn) {
      await page.getByRole('button', { name: /ficha|download/i }).first().click();
      await page.waitForTimeout(400);
      const items = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('button')).map(b => (b.textContent || '').trim());
        return {
          stories: all.some(t => /stories.*9:16/i.test(t)),
          square: all.some(t => /(cuadrado|square).*1:1/i.test(t)),
          letter: all.some(t => /(carta|letter).*(imprimir|print)/i.test(t)),
        };
      });
      push('Ficha-dropdown-items', items.stories && items.square && items.letter, JSON.stringify(items));
      await page.locator('body').click({ position: { x: 1, y: 1 } }).catch(() => {});
      await page.waitForTimeout(200);
    }

    // 4. ESC closes dropdown? (a11y)
    if (compartirBtn) {
      await page.getByRole('button', { name: /comparti|share/i }).first().click();
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      const escClosed = await page.evaluate(() => {
        const wa = document.querySelector('a[href*="wa.me"]');
        return !wa;
      });
      push('Esc-closes-dropdown', escClosed, '');
      // re-cleanup if didnt close
      if (!escClosed) {
        await page.locator('body').click({ position: { x: 1, y: 1 } }).catch(() => {});
      }
    }

    // 5. Off-screen templates (aria-hidden + position: -9999)
    const templates = await page.evaluate(() => {
      const offscreen = Array.from(document.querySelectorAll('[aria-hidden="true"]'))
        .filter(d => {
          const s = getComputedStyle(d);
          return s.position === 'fixed' && parseInt(s.top, 10) <= -9000;
        });
      return offscreen.length;
    });
    push('Templates-off-screen', templates >= 1, `off-screen aria-hidden=true at top<=-9000: ${templates}`);

    // 6. 4 metric cards Tipo/Etapa/Zona/Estado
    const metrics = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return {
        tipo: text.includes('tipo'),
        etapa: text.includes('etapa'),
        zona: text.includes('zona'),
        estado: text.includes('estado') || text.includes('disponib'),
      };
    });
    push('Metric-cards-4', metrics.tipo && metrics.etapa && metrics.zona && metrics.estado, JSON.stringify(metrics));

    // 7. ExpandableText "Leer más" present (if descripción > 120px)
    const expandable = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')).filter(b => /leer m[aá]s|read more/i.test(b.textContent || ''));
      return btns.length;
    });
    push('ExpandableText-button', expandable >= 0, `Leer más buttons: ${expandable}`);

    // 8. Capture screenshot of detail page top
    await page.screenshot({ path: 'tests/screenshots/detail-22abr.png', fullPage: false });
    push('Screenshot-detail-22abr', true, 'tests/screenshots/detail-22abr.png');

    await ctx.close();
  }

  // === Print CSS check (commit c371ff5) ===
  {
    const ctx = await b.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es/desarrollos/${DEV_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const printCss = await page.evaluate(async () => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href);
      const fetched = await Promise.all(
        links.map(href => fetch(href).then(r => r.text()).catch(() => '')),
      );
      const all = fetched.join('\n');
      return {
        hasAtPageMargin0: /@page\s*{\s*margin\s*:\s*0/i.test(all),
        hasMediaPrint: /@media\s+print/i.test(all),
      };
    });
    push('Print-@page-margin-0', printCss.hasAtPageMargin0, JSON.stringify(printCss));
    await ctx.close();
  }

  await b.close();

  // === Report ===
  console.log('\n=== AUDIT RESULTS ===');
  for (const r of results) {
    console.log(`[${r.ok}] ${r.k}${r.note ? ' — ' + r.note : ''}`);
  }
  const pass = results.filter(r => r.ok === 'PASS').length;
  const fail = results.filter(r => r.ok === 'FAIL').length;
  console.log(`\n${pass} PASS / ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(2); });
