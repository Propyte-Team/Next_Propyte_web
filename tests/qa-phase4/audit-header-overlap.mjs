#!/usr/bin/env node
/**
 * Audit commit 9d2f7d0 — Header no-cover fix
 * Verifica: home sin padding (hero bajo header transparente intencional),
 * non-home con pt-[76px] lg:pt-[80px], archives h-calc ajustado a 100dvh-140/144px.
 */
import { chromium } from 'playwright';

const BASE = 'https://dev.propyte.com';
const results = [];
const push = (k, ok, note = '') => results.push({ k, ok, note });

const NON_HOME_ROUTES = [
  '/es/desarrollos', '/en/desarrollos',
  '/es/propiedades', '/en/propiedades',
  '/es/nosotros/quienes-somos',
  '/es/como-comprar',
  '/es/faq',
  '/es/mercado',
  '/es/contacto',
  '/es/unete',
  '/es/corredores',
  '/es/blog',
  '/es/glosario',
  '/es/financiamiento',
  '/es/destacados',
  '/es/promociones',
  '/es/desarrollos/akora-residencial-b73b319b',
  '/es/desarrollos/selva-escondida-ii-b6296a0a',
];
const ARCHIVE_ROUTES = ['/es/desarrollos', '/es/propiedades', '/en/desarrollos', '/en/propiedades'];

// Helper: mide gap entre bottom del header y top del primer hijo de main/body
async function measureOverlap(page) {
  return await page.evaluate(() => {
    const header = document.querySelector('header');
    if (!header) return { error: 'no header' };
    const hRect = header.getBoundingClientRect();
    const main = document.querySelector('main');
    const _firstContent = main || document.querySelector('body > div:not([id=__next]) > *');
    void _firstContent;
    // Buscar el primer elemento visible después del header
    let firstChild = null;
    if (main) {
      const kids = Array.from(main.children);
      firstChild = kids.find(k => {
        const r = k.getBoundingClientRect();
        return r.height > 0 && r.width > 0;
      });
    }
    if (!firstChild) {
      return { hBottom: hRect.bottom, mainTop: null, error: 'no visible first child' };
    }
    const cRect = firstChild.getBoundingClientRect();
    const mainEl = document.querySelector('main');
    const cs = mainEl ? getComputedStyle(mainEl) : null;
    return {
      headerPos: getComputedStyle(header).position,
      headerHeight: Math.round(hRect.height),
      headerBottom: Math.round(hRect.bottom),
      firstChildTop: Math.round(cRect.top),
      gap: Math.round(cRect.top - hRect.bottom),
      mainPaddingTop: cs?.paddingTop,
      mainHeight: cs?.height,
      // Busca wrapper div con pt-[76px]/pt-[80px]
      wrapperPt: (() => {
        const wrappers = Array.from(document.querySelectorAll('div[class*="pt-["]'));
        return wrappers.map(w => {
          const cls = w.className;
          const m = cls.match(/pt-\[(\d+)px\]/);
          return m ? parseInt(m[1]) : null;
        }).filter(Boolean);
      })(),
    };
  });
}

async function run() {
  const b = await chromium.launch();

  // ============ HOME: hero bajo header transparente (intencional) ============
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1500);
    const data = await measureOverlap(page);
    // En home, gap esperado: negativo (hero debajo de header) O ≈0
    // Lo crítico es que header sea transparente/fixed y NO haya double padding
    push(`HOME /es: header presente (pos=${data.headerPos})`, !!data.headerPos, JSON.stringify(data).slice(0, 200));
    push(`HOME /es: wrapper pt-[76px] NO aplicado (intencional)`,
      !data.wrapperPt.includes(76) && !data.wrapperPt.includes(80),
      `wrapperPt=${JSON.stringify(data.wrapperPt)}`);
    await ctx.close();
  }

  // ============ NON-HOME: wrapper con pt-[76px] lg:pt-[80px] + no overlap ============
  for (const path of NON_HOME_ROUTES) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1200);
      const d = await measureOverlap(page);
      // Desktop lg → 80px esperado
      const hasLg80 = d.wrapperPt.includes(80);
      const gapOK = typeof d.gap === 'number' && d.gap >= -8; // tolerancia 8px
      push(`${path} [desktop] wrapper pt-[80px] aplicado`, hasLg80, `wrapperPt=${JSON.stringify(d.wrapperPt)} gap=${d.gap}`);
      push(`${path} [desktop] sin overlap (gap ≥ -8px)`, gapOK, `gap=${d.gap}px headerH=${d.headerHeight}`);
    } catch (e) { push(`${path} [desktop] EXCEPTION`, false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ NON-HOME mobile: wrapper con pt-[76px] + no overlap ============
  for (const path of NON_HOME_ROUTES) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1200);
      const d = await measureOverlap(page);
      const has76 = d.wrapperPt.includes(76);
      const gapOK = typeof d.gap === 'number' && d.gap >= -8;
      push(`${path} [mobile] wrapper pt-[76px] aplicado`, has76, `wrapperPt=${JSON.stringify(d.wrapperPt)}`);
      push(`${path} [mobile] sin overlap (gap ≥ -8px)`, gapOK, `gap=${d.gap}px headerH=${d.headerHeight}`);
    } catch (e) { push(`${path} [mobile] EXCEPTION`, false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ ARCHIVES: h-calc ajustado a 100dvh-140 / lg:100dvh-144 ============
  for (const path of ARCHIVE_ROUTES) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1500);
      const calcInfo = await page.evaluate(() => {
        // Buscar elementos con height calc(100dvh - XXXpx)
        const candidates = Array.from(document.querySelectorAll('*'));
        const calcs = [];
        for (const el of candidates) {
          const cls = el.className;
          if (typeof cls !== 'string') continue;
          const m = cls.match(/h-\[calc\(100dvh-(\d+)px\)\]/);
          if (m) calcs.push({ tag: el.tagName, offset: parseInt(m[1]), classes: cls.slice(0, 100) });
          const m2 = cls.match(/lg:h-\[calc\(100dvh-(\d+)px\)\]/);
          if (m2) calcs.push({ tag: el.tagName, offsetLg: parseInt(m2[1]) });
        }
        return calcs.slice(0, 10);
      });
      const has140 = calcInfo.some(c => c.offset === 140);
      const has144 = calcInfo.some(c => c.offsetLg === 144);
      push(`${path} archive h-[calc(100dvh-140px)] presente`, has140, `calcs=${JSON.stringify(calcInfo).slice(0, 150)}`);
      push(`${path} archive lg:h-[calc(100dvh-144px)] presente`, has144, '');
    } catch (e) { push(`${path} archive calc EXCEPTION`, false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ HTTP 200 regresión ============
  for (const path of ['/es', '/en', ...ARCHIVE_ROUTES]) {
    const ctx = await b.newContext();
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

console.log('\n===== HEADER OVERLAP FIX — AUDIT (commit 9d2f7d0) =====\n');
let ok = 0, fail = 0;
for (const r of results) {
  const icon = r.ok ? 'OK  ' : 'FAIL';
  if (r.ok) ok++; else fail++;
  console.log(`[${icon}] ${r.k}${r.note ? ' — ' + r.note : ''}`);
}
console.log(`\nSUMMARY: ok=${ok} fail=${fail}\n`);
process.exit(fail > 0 ? 1 : 0);
