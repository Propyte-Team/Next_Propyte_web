#!/usr/bin/env node
/**
 * Audit Fase 5.5 Batch C — UX/pricing/i18n polish (items 16-23, #20 diferido)
 */
import { chromium } from 'playwright';
import { readFile, stat } from 'fs/promises';

const BASE = 'https://dev.propyte.com';
const results = [];
const push = (k, ok, note = '') => results.push({ k, ok, note });

async function run() {
  const b = await chromium.launch();

  // ============ #16 $/m² + badge +X% aprec./año en cards ============
  // Nota: $/m² aplica solo a propiedades (units con área). Desarrollos aggregate no tienen pricePerM2.
  // appreciation/ROI/Cap aplican cuando property.roi.* > 0 (data gap permisivo).
  for (const path of ['/es/propiedades', '/es/desarrollos']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(2000);
      const data = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('a[href*="/desarrollos/"], a[href*="/propiedades/"]'))
          .filter(a => a.querySelector('img'));
        const sample = cards.slice(0, 10);
        let withPerM2 = 0, withAppreciation = 0, withROI = 0, withCap = 0;
        let tabularCount = 0;
        for (const c of sample) {
          const text = c.textContent || '';
          if (/\/m²/.test(text)) withPerM2++;
          if (/aprec\.\/año|apprec\.\/yr/i.test(text)) withAppreciation++;
          // Sin \b al inicio — "InmobiliariaROI" no tiene word boundary entre alfa-alfa
          if (/ROI\s+\d/.test(text)) withROI++;
          if (/Cap\s+\d/.test(text)) withCap++;
          if (c.querySelector('.tabular-nums')) tabularCount++;
        }
        return { total: sample.length, withPerM2, withAppreciation, withROI, withCap, tabularCount };
      });
      const isProps = path.endsWith('/propiedades');
      if (isProps) {
        push(`#16 ${path} cards con $/m² (${data.withPerM2}/${data.total})`,
          data.total === 0 || data.withPerM2 >= Math.min(3, data.total),
          `total=${data.total} perM2=${data.withPerM2} tabularNums=${data.tabularCount}`);
      } else {
        // Desarrollos aggregate: no $/m² esperado. Solo validar tabular-nums en precios.
        push(`#16 ${path} precios con tabular-nums (${data.tabularCount}/${data.total})`,
          data.total === 0 || data.tabularCount >= Math.min(3, data.total),
          `tabularNums=${data.tabularCount} ($/m² no aplica a aggregates)`);
      }
      push(`#16 ${path} cards con badge +X% aprec. (${data.withAppreciation}/${data.total})`,
        data.total === 0 || data.withAppreciation >= 1,
        `appreciation=${data.withAppreciation} (data gap permisivo)`);
      push(`#17 ${path} ROI o Cap badge en ≥1 card (data gap permisivo)`,
        data.total === 0 || (data.withROI + data.withCap) >= 1,
        `ROI=${data.withROI} Cap=${data.withCap}`);
    } catch (e) { push(`#16/#17 ${path} EXCEPTION`, false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ #18 loading.tsx existe + animate-pulse + MarketplaceCardSkeleton ============
  {
    const files = [
      'src/app/[locale]/desarrollos/loading.tsx',
      'src/app/[locale]/propiedades/loading.tsx',
    ];
    for (const f of files) {
      try {
        const src = await readFile(f, 'utf8');
        const hasPulse = /animate-pulse/.test(src);
        const hasSkeleton = /MarketplaceCardSkeleton|Skeleton/.test(src);
        push(`#18 ${f} existe + animate-pulse`, hasPulse, `pulse=${hasPulse} skeleton=${hasSkeleton}`);
      } catch (e) { push(`#18 ${f}`, false, `missing: ${e.code || e.message}`); }
    }
    // MarketplaceCardSkeleton component
    try {
      await stat('src/components/marketplace/MarketplaceCardSkeleton.tsx');
      push(`#18 MarketplaceCardSkeleton.tsx existe`, true, '');
    } catch { push(`#18 MarketplaceCardSkeleton.tsx existe`, false, ''); }
  }

  // ============ #19 Toggle MXN/USD en header GLOBAL (no solo /mercado) ============
  for (const path of ['/es', '/es/desarrollos', '/es/propiedades']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1500);
      const data = await page.evaluate(() => {
        const header = document.querySelector('header');
        if (!header) return { noHeader: true };
        const txt = header.textContent || '';
        // Busca MXN Y USD en el header como texto de toggle/botón
        const btns = Array.from(header.querySelectorAll('button, a, [role="button"]'));
        const currencyToggle = btns.find(b => {
          const t = (b.textContent || '').trim();
          return /\b(MXN|USD)\b/.test(t) && t.length < 20;
        });
        return {
          noHeader: false,
          hasMXN: /\bMXN\b/.test(txt),
          hasUSD: /\bUSD\b/.test(txt),
          toggleFound: !!currencyToggle,
          toggleText: currencyToggle?.textContent?.trim().slice(0, 30) || null,
        };
      });
      push(`#19 ${path} Header contiene MXN+USD toggle`,
        !data.noHeader && data.hasMXN && data.hasUSD && data.toggleFound,
        `MXN=${data.hasMXN} USD=${data.hasUSD} btn="${data.toggleText}"`);
    } catch (e) { push(`#19 ${path} EXCEPTION`, false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // CurrencyProvider wrap en layout.tsx
  try {
    const layout = await readFile('src/app/[locale]/layout.tsx', 'utf8');
    const wrapped = /<CurrencyProvider>[\s\S]*<\/CurrencyProvider>/.test(layout);
    push(`#19 CurrencyProvider envuelve app en layout.tsx`, wrapped, '');
  } catch (e) { push('#19 layout.tsx read', false, e.message); }

  // ============ #21 Badge "Actualizado hace X días" en AirdnaInsights ============
  // AirdnaInsights vive en tab "Ubicación" (no SSR tab por default). Click requerido.
  // Badge condicional: solo renderiza si data.latest_date existe (data gap posible).
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/es/desarrollos/selva-escondida-ii-b6296a0a`, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1500);
      const clicked = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        const geo = tabs.find(t => /ubica|location|zona|geo/i.test(t.textContent || ''));
        if (geo) { geo.click(); return true; }
        return false;
      });
      await page.waitForTimeout(2000);
      await page.evaluate(async () => {
        for (let y = 0; y < 8000; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      });
      await page.waitForTimeout(800);
      const data = await page.evaluate(() => {
        const body = document.body.textContent || '';
        const hasAirdnaHeader = /Mercado de renta vacacional|Vacation rental market/i.test(body);
        const hasBadge = /Actualizado\s+hace\s+\d+\s+d[ií]as?|Actualizado\s+hoy|Actualizado\s+ayer/i.test(body);
        const hasUpdatedEn = /Updated\s+\d+\s+days?\s+ago|Updated\s+today|Updated\s+yesterday/i.test(body);
        return { hasAirdnaHeader, hasBadge, hasUpdatedEn };
      });
      push(`#21 AirdnaInsights renderiza en tab Ubicación`, clicked && data.hasAirdnaHeader, `clicked=${clicked} header=${data.hasAirdnaHeader}`);
      push(`#21 Badge "Actualizado hace X días" visible (requiere data.latest_date)`,
        data.hasBadge || data.hasUpdatedEn,
        `es=${data.hasBadge} en=${data.hasUpdatedEn} ${!data.hasBadge && !data.hasUpdatedEn && data.hasAirdnaHeader ? '(data gap: latest_date null)' : ''}`);
    } catch (e) { push('#21 EXCEPTION', false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // Verificar código del badge en fuente
  try {
    const src = await readFile('src/components/property/AirdnaInsights.tsx', 'utf8');
    const hasBadgeCode = /data\.latest_date[\s\S]{0,200}formatDaysAgo/.test(src);
    push(`#21 Código badge formatDaysAgo(latest_date) en AirdnaInsights.tsx`, hasBadgeCode, '');
  } catch (e) { push('#21 AirdnaInsights.tsx read', false, e.message); }

  // ============ #22 Footer social hrefs reales (no #) ============
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1000);
      const socials = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('footer a[href]'))
          .map(a => a.getAttribute('href'));
        const ig = links.find(h => h && /instagram\.com/i.test(h));
        const fb = links.find(h => h && /facebook\.com/i.test(h));
        const li = links.find(h => h && /linkedin\.com/i.test(h));
        const allHash = links.filter(h => h === '#').length;
        return { ig, fb, li, allHash, total: links.length };
      });
      push(`#22 Footer IG href real`, !!socials.ig && !/^#?$/.test(socials.ig), `ig=${socials.ig || 'missing'}`);
      push(`#22 Footer FB href real`, !!socials.fb && !/^#?$/.test(socials.fb), `fb=${socials.fb || 'missing'}`);
      push(`#22 Footer sin hrefs "#" placeholder`, socials.allHash === 0, `hashCount=${socials.allHash}/${socials.total}`);
    } catch (e) { push('#22 EXCEPTION', false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ #23 Footer disclaimer profesional + i18n (sin ternarios locale) ============
  try {
    const footer = await readFile('src/components/layout/Footer.tsx', 'utf8');
    const ternaries = (footer.match(/locale\s*===\s*['"]es['"]\s*\?/g) || []).length;
    const isEnTernaries = (footer.match(/isEn\s*\?/g) || []).length;
    const useTranslations = /useTranslations\s*\(/.test(footer);
    push(`#23 Footer sin ternarios locale==='es'?`, ternaries === 0, `locale?=${ternaries} isEn?=${isEnTernaries}`);
    push(`#23 Footer usa useTranslations()`, useTranslations, '');
  } catch (e) { push('#23 Footer.tsx read', false, e.message); }

  // Verificar que renderiza disclaimer real (no placeholder lorem)
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 45000 });
      const disclaimer = await page.evaluate(() => {
        const f = document.querySelector('footer');
        if (!f) return null;
        const txt = f.textContent || '';
        // Disclaimer profesional: al menos 80 chars de texto legal/disclaimer
        const hasCopyright = /©|copyright/i.test(txt);
        const hasYear = /20(2[5-9]|[3-9]\d)/.test(txt);
        const hasLorem = /lorem ipsum/i.test(txt);
        const hasMixedLang = /sitemap|home/i.test(txt) && /inicio|mapa/i.test(txt);
        return { hasCopyright, hasYear, hasLorem, hasMixedLang, totalLen: txt.length };
      });
      push(`#23 Footer disclaimer ES: © + año + sin lorem`,
        disclaimer && disclaimer.hasCopyright && disclaimer.hasYear && !disclaimer.hasLorem,
        `© ${disclaimer?.hasCopyright} yr=${disclaimer?.hasYear} lorem=${disclaimer?.hasLorem} len=${disclaimer?.totalLen}`);
      push(`#23 Footer ES sin mezcla idiomas`,
        disclaimer && !disclaimer.hasMixedLang, `mixed=${disclaimer?.hasMixedLang}`);
    } catch (e) { push('#23 render ES EXCEPTION', false, e.message.slice(0, 80)); }
    await ctx.close();

    // Footer EN
    const ctx2 = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page2 = await ctx2.newPage();
    try {
      await page2.goto(`${BASE}/en`, { waitUntil: 'networkidle', timeout: 45000 });
      const en = await page2.evaluate(() => {
        const f = document.querySelector('footer');
        const txt = f?.textContent || '';
        const hasProperties = /\bProperties\b/i.test(txt);
        const hasAbout = /About us|Company/i.test(txt);
        const hasRights = /All rights reserved|rights reserved/i.test(txt);
        const hasSpanishTexts = /\b(Inicio|Nosotros|Acerca de|Políticas|Términos de Uso)\b/.test(txt);
        return { hasProperties, hasAbout, hasRights, hasSpanishTexts, totalLen: txt.length };
      });
      push(`#23 Footer EN traducido (Properties/About/rights reserved sin ES)`,
        en.hasProperties && en.hasAbout && en.hasRights && !en.hasSpanishTexts,
        `Props=${en.hasProperties} About=${en.hasAbout} rights=${en.hasRights} ES=${en.hasSpanishTexts}`);
    } catch (e) { push('#23 render EN EXCEPTION', false, e.message.slice(0, 80)); }
    await ctx2.close();
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

console.log('\n===== FASE 5.5 BATCH C — AUDIT =====\n');
let ok = 0, fail = 0;
for (const r of results) {
  const icon = r.ok ? 'OK  ' : 'FAIL';
  if (r.ok) ok++; else fail++;
  console.log(`[${icon}] ${r.k}${r.note ? ' — ' + r.note : ''}`);
}
console.log(`\nSUMMARY: ok=${ok} fail=${fail}\n`);
console.log('Note: #20 (sparklines por KPI) diferido por constructor — AirdnaInsights ya tiene chart completo.\n');
process.exit(fail > 0 ? 1 : 0);
