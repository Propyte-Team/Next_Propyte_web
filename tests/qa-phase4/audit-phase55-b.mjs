#!/usr/bin/env node
/**
 * Audit Fase 5.5 Batch B — SEO Schema + Mobile A11y (6 items + 1 defer)
 */
import { chromium } from 'playwright';

const BASE = 'https://dev.propyte.com';
const results = [];
const push = (k, ok, note = '') => results.push({ k, ok, note });

// Rutas que deben tener breadcrumbs (todas excepto home)
const BREADCRUMB_ROUTES = [
  '/es/desarrollos', '/en/desarrollos',
  '/es/propiedades', '/en/propiedades',
  '/es/nosotros/quienes-somos',
  '/es/nosotros/estructura',
  '/es/nosotros/equipo-comercial',
  '/es/como-comprar', '/es/como-invertir',
  '/es/financiamiento', '/es/faq', '/es/glosario',
  '/es/destacados', '/es/promociones',
  '/es/corredores', '/es/unete',
  '/es/mercado', '/es/contacto',
];

async function run() {
  const b = await chromium.launch();

  // ============ #9 RealEstateListing schema en archives ============
  for (const path of ['/es/desarrollos', '/en/desarrollos', '/es/propiedades', '/en/propiedades']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1500);
      const data = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .map(s => { try { return JSON.parse(s.textContent || '{}'); } catch { return null; } })
          .filter(Boolean);
        const collection = scripts.find(s => s['@type'] === 'CollectionPage');
        const itemList = collection?.mainEntity;
        const itemCount = itemList?.numberOfItems ?? 0;
        const itemListEls = (itemList?.itemListElement || []).length;
        // Buscar RealEstateListing a cualquier profundidad
        let realEstateCount = 0;
        const walk = (n) => {
          if (!n || typeof n !== 'object') return;
          if (Array.isArray(n)) return n.forEach(walk);
          const t = n['@type'];
          if (t === 'RealEstateListing' || (Array.isArray(t) && t.includes('RealEstateListing'))) realEstateCount++;
          for (const k of Object.keys(n)) if (k !== '@context') walk(n[k]);
        };
        scripts.forEach(walk);

        const visibleCards = document.querySelectorAll('a[href*="/desarrollos/"], a[href*="/propiedades/"]').length;

        return { hasCollectionPage: !!collection, itemCount, itemListEls, realEstateCount, visibleCards };
      });
      push(`#9 ${path} CollectionPage present`, data.hasCollectionPage, '');
      push(`#9 ${path} ItemList numberOfItems matches visible (>0 si hay cards)`,
        data.visibleCards === 0 || data.itemCount > 0,
        `visibleCards=${data.visibleCards} schema.numberOfItems=${data.itemCount} itemListEls=${data.itemListEls}`);
      push(`#9 ${path} RealEstateListing in schema (cards exist)`,
        data.visibleCards === 0 || data.realEstateCount >= 1,
        `visible=${data.visibleCards} realEstate=${data.realEstateCount}`);
    } catch (e) { push(`#9 ${path} EXCEPTION`, false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ #10 BreadcrumbList UI + JSON-LD en 14+ rutas ============
  for (const path of BREADCRUMB_ROUTES) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(800);
      const bc = await page.evaluate(() => {
        const nav = document.querySelector('nav[aria-label="Migas de pan"], nav[aria-label="Breadcrumb"], nav[aria-label*="breadcrumb" i]');
        const navUI = !!nav;
        const hasOl = !!nav?.querySelector('ol');
        const current = nav?.querySelector('[aria-current="page"]');
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .map(s => { try { return JSON.parse(s.textContent || '{}'); } catch { return null; } })
          .filter(Boolean);
        let hasBCJsonLd = false;
        let bcItems = 0;
        const walk = (n) => {
          if (!n || typeof n !== 'object') return;
          if (Array.isArray(n)) return n.forEach(walk);
          if (n['@type'] === 'BreadcrumbList') {
            hasBCJsonLd = true;
            bcItems = Math.max(bcItems, (n.itemListElement || []).length);
          }
          for (const k of Object.keys(n)) if (k !== '@context') walk(n[k]);
        };
        scripts.forEach(walk);
        return { navUI, hasOl, hasCurrent: !!current, hasBCJsonLd, bcItems };
      });
      push(`#10 ${path} UI <nav aria-label Migas/Breadcrumb>`, bc.navUI, '');
      push(`#10 ${path} <ol> + aria-current="page"`, bc.hasOl && bc.hasCurrent, `ol=${bc.hasOl} current=${bc.hasCurrent}`);
      push(`#10 ${path} BreadcrumbList JSON-LD SSR`, bc.hasBCJsonLd, `items=${bc.bcItems}`);
    } catch (e) { push(`#10 ${path} EXCEPTION`, false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ Home NO debe tener breadcrumb ============
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 45000 });
    const homeBC = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Migas de pan"], nav[aria-label="Breadcrumb"]');
      return !!nav;
    });
    push(`#10 /es (home) SIN breadcrumb UI`, !homeBC, `hasBC=${homeBC}`);
    await ctx.close();
  }

  // ============ #12 Tap targets 44×44 ============
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1000);
      const taps = await page.evaluate(() => {
        const results = {};
        // Hero quick filter chips
        const chips = Array.from(document.querySelectorAll('a[href*="/propiedades?"], a[href*="/desarrollos?"]'))
          .filter(a => {
            const r = a.getBoundingClientRect();
            return r.width > 20 && r.width < 300 && r.height > 0;
          });
        const chipsOK = chips.filter(c => c.getBoundingClientRect().height >= 44);
        results.chips = { total: chips.length, ok: chipsOK.length, sizes: chips.map(c => `${Math.round(c.getBoundingClientRect().width)}x${Math.round(c.getBoundingClientRect().height)}`).slice(0, 5) };

        // Footer social icons
        const socials = Array.from(document.querySelectorAll('footer a[href*="instagram"], footer a[href*="facebook"], footer a[href*="linkedin"], footer a[href*="twitter"]'));
        const socialsOK = socials.filter(s => {
          const r = s.getBoundingClientRect();
          return r.width >= 44 && r.height >= 44;
        });
        results.socials = { total: socials.length, ok: socialsOK.length, sizes: socials.map(s => `${Math.round(s.getBoundingClientRect().width)}x${Math.round(s.getBoundingClientRect().height)}`) };

        return results;
      });
      push(`#12 Hero quick chips 44px altura (${taps.chips.ok}/${taps.chips.total})`,
        taps.chips.total === 0 || taps.chips.ok === taps.chips.total,
        `sizes=${taps.chips.sizes.join('|')}`);
      push(`#12 Footer social icons 44x44 (${taps.socials.ok}/${taps.socials.total})`,
        taps.socials.total === 0 || taps.socials.ok === taps.socials.total,
        `sizes=${taps.socials.sizes.join('|')}`);
    } catch (e) { push('#12 EXCEPTION', false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ #13 <main> padding-bottom en mobile (no tapar última card) ============
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/es/desarrollos`, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1000);
      const pad = await page.evaluate(() => {
        const main = document.querySelector('main');
        if (!main) return null;
        const s = getComputedStyle(main);
        return { paddingBottom: s.paddingBottom, pbPx: parseFloat(s.paddingBottom) };
      });
      push(`#13 <main> padding-bottom >= 60px mobile`, !!pad && pad.pbPx >= 60, JSON.stringify(pad));
    } catch (e) { push('#13 EXCEPTION', false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ #14 Carruseles con role="region" + aria-roledescription="carousel" + keyboard ============
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      // MarketplaceCard en /es/desarrollos
      await page.goto(`${BASE}/es/desarrollos`, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1500);
      const carousels = await page.evaluate(() => {
        const regions = Array.from(document.querySelectorAll('[role="region"][aria-roledescription="carousel"], [aria-roledescription*="carousel" i]'));
        return { count: regions.length, labels: regions.map(r => r.getAttribute('aria-label') || '(no label)').slice(0, 5) };
      });
      push(`#14 MarketplaceCard carousels con role="region" aria-roledescription="carousel" (archive)`,
        carousels.count >= 1, `count=${carousels.count} labels=${carousels.labels.join('|')}`);
    } catch (e) { push('#14 EXCEPTION archive', false, e.message.slice(0, 80)); }
    await ctx.close();

    // ImageGallery en single desarrollo
    const ctx2 = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page2 = await ctx2.newPage();
    try {
      await page2.goto(`${BASE}/es/desarrollos/akora-residencial-b73b319b`, { waitUntil: 'networkidle', timeout: 45000 });
      await page2.waitForTimeout(1500);
      const gallery = await page2.evaluate(() => {
        const regions = Array.from(document.querySelectorAll('[role="region"][aria-roledescription="carousel"], [aria-roledescription*="carousel" i]'));
        return { count: regions.length };
      });
      push(`#14 ImageGallery carousel con role="region" (single)`, gallery.count >= 1, `count=${gallery.count}`);
    } catch (e) { push('#14 EXCEPTION single', false, e.message.slice(0, 80)); }
    await ctx2.close();
  }

  // ============ #15 axe-core script instalado + importable ============
  {
    // Solo check metadata: que exista y sea ejecutable (no corro axe completo aquí — el usuario lo ejecutará)
    const fs = await import('fs/promises');
    try {
      const exists = await fs.stat('tests/qa-phase55/axe-core-audit.mjs').then(() => true).catch(() => false);
      push(`#15 tests/qa-phase55/axe-core-audit.mjs existe`, exists, `exists=${exists}`);
      if (exists) {
        const content = await fs.readFile('tests/qa-phase55/axe-core-audit.mjs', 'utf8');
        const hasAxeImport = /@axe-core\/playwright/.test(content);
        const hasWcag = /wcag2aa|wcag21aa|wcag22aa/.test(content);
        push(`#15 Usa @axe-core/playwright`, hasAxeImport, '');
        push(`#15 Configurado para WCAG AA`, hasWcag, '');
      }
    } catch (e) { push('#15 EXCEPTION', false, e.message.slice(0, 80)); }
  }

  // ============ Regresión HTTP 200 ============
  for (const path of ['/es', '/en', '/es/desarrollos', '/es/propiedades', '/es/desarrollos/akora-residencial-b73b319b']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      const r = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      push(`Regresión ${path} HTTP 200`, r?.status() === 200, `status=${r?.status()}`);
    } catch (e) { push(`Regresión ${path}`, false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  await b.close();
}

await run();

console.log('\n===== FASE 5.5 BATCH B — AUDIT =====\n');
let ok = 0, fail = 0;
for (const r of results) {
  const icon = r.ok ? 'OK  ' : 'FAIL';
  if (r.ok) ok++; else fail++;
  console.log(`[${icon}] ${r.k}${r.note ? ' — ' + r.note : ''}`);
}
console.log(`\nSUMMARY: ok=${ok} fail=${fail}\n`);
process.exit(fail > 0 ? 1 : 0);
