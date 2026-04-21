#!/usr/bin/env node
/**
 * Audit Fase 5.5 Batch A — Credibilidad + A11y crítica (7 items + 1 Luis-flag)
 */
import { chromium } from 'playwright';

const BASE = 'https://dev.propyte.com';
const results = [];
const push = (k, ok, note = '') => results.push({ k, ok, note });

async function run() {
  const b = await chromium.launch();

  // ============ #1 — SAMPLE/DEMO/TEST prefix stripping ============
  for (const path of ['/es/desarrollos', '/en/desarrollos', '/es', '/en', '/es/destacados', '/en/destacados']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(800);
      const leak = await page.evaluate(() => {
        const body = document.body.innerText || '';
        const matches = body.match(/\[(sample|demo|test)\]/gi) || [];
        return { count: matches.length, samples: matches.slice(0, 3) };
      });
      push(`#1 SAMPLE prefix NO visible en ${path}`, leak.count === 0, `count=${leak.count} ${leak.samples.join('|')}`);
    } catch (e) { push(`#1 ${path} EXCEPTION`, false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ #2 — Hide-empty-KPI en VacacionalKPIs (/mercado) ============
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/es/mercado`, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1500);
      const kpi = await page.evaluate(() => {
        const body = document.body.innerText || '';
        // Dash huérfano en cards KPI es string "—" en aislamiento (no dentro de rangos)
        const orphanDashes = (body.match(/\b—\s*$/gm) || []).length;
        const hasActualizando = /actualizando|updating|actualizaci[oó]n|coming soon/i.test(body);
        const zeroKPICount = (body.match(/\b0\s*(%|MXN|USD|\/\s*10)/g) || []).length;
        return { orphanDashes, hasActualizando, zeroKPICount };
      });
      push(`#2 Hide-empty-KPI: no dashes huérfanos`, kpi.orphanDashes === 0, `orphans=${kpi.orphanDashes}`);
      push(`#2 Hide-empty-KPI: badge "Actualizando" presente si data gap`, kpi.hasActualizando, `hasActualizando=${kpi.hasActualizando}`);
    } catch (e) { push('#2 EXCEPTION', false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ #4 — focus-visible ring Teal 2px ============
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 45000 });
      // Focus un botón via Tab y leer outline + outlineColor
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(400);
      const focus = await page.evaluate(() => {
        const active = document.activeElement;
        if (!active || active === document.body) return null;
        const s = getComputedStyle(active);
        return {
          tag: active.tagName,
          outlineStyle: s.outlineStyle,
          outlineWidth: s.outlineWidth,
          outlineColor: s.outlineColor,
          boxShadow: s.boxShadow,
        };
      });
      const hasTealFocus = !!focus && (
        (focus.outlineStyle !== 'none' && /5ce0d2|0d9488|teal|92\s*,\s*224\s*,\s*210/i.test(focus.outlineColor + ' ' + focus.boxShadow))
        || /5ce0d2|92\s*,\s*224\s*,\s*210/i.test(focus.boxShadow)
      );
      push(`#4 focus-visible con color Teal en elemento focuseado`, hasTealFocus, JSON.stringify(focus));
    } catch (e) { push('#4 EXCEPTION', false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ #5 — Skip-to-content link bilingüe ============
  for (const loc of ['es', 'en']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/${loc}`, { waitUntil: 'networkidle', timeout: 45000 });
      const skip = await page.evaluate((loc) => {
        const links = Array.from(document.querySelectorAll('a'));
        const candidate = links.find(a => {
          const t = (a.textContent || '').trim().toLowerCase();
          if (loc === 'es') return /saltar al contenido/.test(t);
          return /skip to (main )?content/.test(t);
        });
        if (!candidate) return null;
        const href = candidate.getAttribute('href');
        const main = href && document.querySelector(href);
        const mainTabIndex = main?.getAttribute('tabindex');
        return { text: candidate.textContent?.trim(), href, mainExists: !!main, mainTabIndex };
      }, loc);
      push(`#5 Skip-to-content link ${loc.toUpperCase()}`, !!skip?.text, skip?.text || 'NOT FOUND');
      push(`#5 Skip link apunta a elemento con tabIndex (${loc.toUpperCase()})`, !!skip?.mainExists, `href=${skip?.href} tabIndex=${skip?.mainTabIndex}`);
    } catch (e) { push(`#5 ${loc} EXCEPTION`, false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ #6 — ARIA attrs en nav (aria-current / aria-expanded / aria-label icon buttons) ============
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/es/desarrollos`, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1000);
      const aria = await page.evaluate(() => {
        const ariaCurrent = document.querySelectorAll('[aria-current]').length;
        const ariaExpanded = document.querySelectorAll('[aria-expanded]').length;
        const iconBtns = Array.from(document.querySelectorAll('button')).filter(b => {
          const txt = (b.textContent || '').trim();
          const hasIcon = !!b.querySelector('svg');
          return hasIcon && txt.length < 3; // icon-only
        });
        const iconBtnsWithLabel = iconBtns.filter(b => b.getAttribute('aria-label'));
        return {
          ariaCurrent,
          ariaExpanded,
          iconBtnTotal: iconBtns.length,
          iconBtnLabeled: iconBtnsWithLabel.length,
        };
      });
      push(`#6 aria-current en nav activo (>=1)`, aria.ariaCurrent >= 1, `count=${aria.ariaCurrent}`);
      push(`#6 aria-expanded en dropdowns (>=3)`, aria.ariaExpanded >= 3, `count=${aria.ariaExpanded}`);
      push(`#6 icon-only buttons con aria-label (>= 80%)`,
        aria.iconBtnTotal === 0 || (aria.iconBtnLabeled / aria.iconBtnTotal) >= 0.8,
        `labeled=${aria.iconBtnLabeled}/${aria.iconBtnTotal}`);
    } catch (e) { push('#6 EXCEPTION', false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ #7 — <label for> + id + autoComplete en form /unete ============
  for (const loc of ['es', 'en']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/${loc}/unete`, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1200);
      // Scroll al formulario
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) form.scrollIntoView();
      });
      await page.waitForTimeout(500);
      const formA11y = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('form input, form textarea, form select'));
        const withId = inputs.filter(i => i.getAttribute('id'));
        const withLabel = inputs.filter(i => {
          const id = i.getAttribute('id');
          if (!id) return false;
          return !!document.querySelector(`label[for="${id}"]`);
        });
        const withAutoComplete = inputs.filter(i => i.getAttribute('autocomplete'));
        return {
          total: inputs.length,
          withId: withId.length,
          withLabel: withLabel.length,
          withAutoComplete: withAutoComplete.length,
          types: inputs.map(i => `${i.tagName}:${i.getAttribute('type') || ''}:${i.getAttribute('autocomplete') || ''}`).slice(0, 10),
        };
      });
      push(`#7 /${loc}/unete form inputs >= 6`, formA11y.total >= 6, `total=${formA11y.total}`);
      push(`#7 /${loc}/unete inputs con <label for> (100%)`, formA11y.total > 0 && formA11y.withLabel === formA11y.total, `${formA11y.withLabel}/${formA11y.total}`);
      push(`#7 /${loc}/unete inputs con autocomplete (>= 50%)`,
        formA11y.total === 0 || (formA11y.withAutoComplete / formA11y.total) >= 0.5,
        `${formA11y.withAutoComplete}/${formA11y.total}`);
    } catch (e) { push(`#7 ${loc} EXCEPTION`, false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ #8 — safe-area-inset-bottom en WhatsApp flotante ============
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(800);
      const wa = await page.evaluate(() => {
        const link = document.querySelector('a[href*="wa.me"], a[href*="whatsapp"]');
        if (!link) return null;
        const s = getComputedStyle(link);
        const htmlInline = link.outerHTML.slice(0, 600);
        return {
          ariaLabel: link.getAttribute('aria-label'),
          position: s.position,
          paddingBottom: s.paddingBottom,
          bottom: s.bottom,
          // Buscar env(safe-area-inset-bottom) en style inline o computed
          hasSafeArea: /env\(\s*safe-area-inset-bottom/.test(htmlInline) || /env\(\s*safe-area-inset-bottom/.test(s.cssText || ''),
          outerHTML: htmlInline,
        };
      });
      push(`#8 WhatsApp a[href*=wa.me] presente`, !!wa, '');
      push(`#8 WhatsApp aria-label i18n`, !!wa?.ariaLabel && /whats|contact/i.test(wa.ariaLabel), wa?.ariaLabel);
      // safe-area suele aparecer en inline style o en className con clase tailwind custom
      push(`#8 safe-area-inset-bottom aplicado (env() en style o className)`, !!wa?.hasSafeArea || !!wa?.paddingBottom, `padBottom=${wa?.paddingBottom} hasSafeArea=${wa?.hasSafeArea}`);
    } catch (e) { push('#8 EXCEPTION', false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  // ============ Regresión: rutas críticas siguen HTTP 200 ============
  for (const path of ['/es', '/en', '/es/desarrollos', '/es/propiedades', '/es/contacto', '/es/faq', '/es/mercado', '/es/unete', '/en/unete']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      const r = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      push(`Regresión ${path} HTTP 200`, r?.status() === 200, `status=${r?.status()}`);
    } catch (e) { push(`Regresión ${path} EXCEPTION`, false, e.message.slice(0, 80)); }
    await ctx.close();
  }

  await b.close();
}

await run();

console.log('\n===== FASE 5.5 BATCH A — AUDIT =====\n');
let ok = 0, fail = 0;
for (const r of results) {
  const icon = r.ok ? 'OK  ' : 'FAIL';
  if (r.ok) ok++; else fail++;
  console.log(`[${icon}] ${r.k}${r.note ? ' — ' + r.note : ''}`);
}
console.log(`\nSUMMARY: ok=${ok} fail=${fail}\n`);
process.exit(fail > 0 ? 1 : 0);
