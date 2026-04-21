#!/usr/bin/env node
/**
 * Audit Fase 5 Batch 2a — /como-comprar (HowTo), /faq (FAQPage), /como-invertir (HowTo)
 * Plus: fix dual-H1 /nosotros/* (estructura, equipo-comercial, quienes-somos)
 */
import { chromium } from 'playwright';

const BASE = 'https://dev.propyte.com';
const results = [];
const push = (k, ok, note = '') => results.push({ k, ok, note });

const routes = [
  { path: '/es/como-comprar',    schemaType: 'HowTo',    h1Re: /c[oó]mo comprar/i,        minH1: 1, maxH1: 1 },
  { path: '/en/como-comprar',    schemaType: 'HowTo',    h1Re: /how to buy|buy/i,         minH1: 1, maxH1: 1 },
  { path: '/es/faq',             schemaType: 'FAQPage',  h1Re: /preguntas|faq/i,          minH1: 1, maxH1: 1, faqCheck: true },
  { path: '/en/faq',             schemaType: 'FAQPage',  h1Re: /faq|frequently|questions/i, minH1: 1, maxH1: 1, faqCheck: true },
  { path: '/es/como-invertir',   schemaType: 'HowTo',    h1Re: /c[oó]mo invertir|invertir/i, minH1: 1, maxH1: 1 },
  { path: '/en/como-invertir',   schemaType: 'HowTo',    h1Re: /how to invest|invest/i,   minH1: 1, maxH1: 1 },
  // Dual-H1 fix verification
  { path: '/es/nosotros/quienes-somos',     h1Re: /./,   minH1: 1, maxH1: 1 },
  { path: '/en/nosotros/quienes-somos',     h1Re: /./,   minH1: 1, maxH1: 1 },
  { path: '/es/nosotros/estructura',        h1Re: /estructura/i, minH1: 1, maxH1: 1 },
  { path: '/en/nosotros/estructura',        h1Re: /structure|organiza/i, minH1: 1, maxH1: 1 },
  { path: '/es/nosotros/equipo-comercial',  h1Re: /equipo/i, minH1: 1, maxH1: 1 },
  { path: '/en/nosotros/equipo-comercial',  h1Re: /team|sales/i, minH1: 1, maxH1: 1 },
];

async function audit() {
  const b = await chromium.launch();

  for (const r of routes) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      const resp = await page.goto(BASE + r.path, { waitUntil: 'networkidle', timeout: 45000 });
      push(`${r.path} HTTP 200`, resp?.status() === 200, `status=${resp?.status()}`);
      if (resp?.status() !== 200) { await ctx.close(); continue; }
      await page.waitForTimeout(1200);

      // H1 count + match
      const h1 = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('h1'));
        return { count: els.length, texts: els.map(e => (e.textContent || '').trim().slice(0, 80)) };
      });
      push(`${r.path} exactly ${r.minH1} <h1>`, h1.count === r.minH1, `count=${h1.count} texts=[${h1.texts.join(' | ')}]`);
      if (r.h1Re && h1.texts[0]) {
        push(`${r.path} H1 matches regex`, r.h1Re.test(h1.texts[0]), `h1="${h1.texts[0]}"`);
      }

      // JSON-LD schema with correct @type
      if (r.schemaType) {
        const schema = await page.evaluate(() => {
          const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
          return scripts.map(s => {
            try { return JSON.parse(s.textContent || '{}'); } catch { return null; }
          }).filter(Boolean);
        });
        const found = schema.some(s => {
          const types = Array.isArray(s) ? s.map(x => x['@type']) : [s['@type']];
          return types.includes(r.schemaType) || types.some(t => Array.isArray(t) && t.includes(r.schemaType));
        });
        push(`${r.path} JSON-LD @type=${r.schemaType}`, found, `found types=${schema.map(s => s['@type']).join(',')}`);

        if (r.schemaType === 'HowTo' && found) {
          const howTo = schema.find(s => s['@type'] === 'HowTo');
          const hasSteps = Array.isArray(howTo?.step) && howTo.step.length >= 2;
          push(`${r.path} HowTo.step >= 2`, hasSteps, `steps=${howTo?.step?.length || 0}`);
        }
        if (r.schemaType === 'FAQPage' && found) {
          const faq = schema.find(s => s['@type'] === 'FAQPage');
          const hasQA = Array.isArray(faq?.mainEntity) && faq.mainEntity.length >= 3;
          push(`${r.path} FAQPage.mainEntity >= 3`, hasQA, `qa=${faq?.mainEntity?.length || 0}`);
        }
      }

      // Metadata
      const meta = await page.evaluate(() => {
        const get = (s) => document.querySelector(s)?.getAttribute('content') || null;
        return {
          title: document.querySelector('title')?.textContent || null,
          desc: get('meta[name="description"]'),
          ogTitle: get('meta[property="og:title"]'),
          ogType: get('meta[property="og:type"]'),
          twitter: get('meta[name="twitter:card"]'),
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
          hreflangs: Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).length,
        };
      });
      push(`${r.path} <title> presente`, !!meta.title, meta.title?.slice(0, 60));
      push(`${r.path} description`, !!meta.desc, meta.desc?.slice(0, 60));
      push(`${r.path} og:title + og:type`, !!meta.ogTitle && !!meta.ogType, `ogType=${meta.ogType}`);
      push(`${r.path} twitter:card`, !!meta.twitter, meta.twitter);
      push(`${r.path} canonical self-referential`, !!meta.canonical && meta.canonical.includes(r.path), meta.canonical);
      push(`${r.path} hreflang ES+EN+x-default`, meta.hreflangs >= 3, `count=${meta.hreflangs}`);

      // FAQ accordion aria-expanded
      if (r.faqCheck) {
        const faqA11y = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button[aria-expanded]'));
          return {
            count: btns.length,
            hasAriaControls: btns.filter(b => b.hasAttribute('aria-controls')).length,
          };
        });
        push(`${r.path} FAQ accordions con aria-expanded (>= 3)`, faqA11y.count >= 3, `count=${faqA11y.count} aria-controls=${faqA11y.hasAriaControls}`);
      }

      // WCAG teal accessible (#0D9488 present instead of #5CE0D2 on white)
      if (r.schemaType) {
        const tealUsage = await page.evaluate(() => {
          const html = document.documentElement.outerHTML;
          return {
            has0D9488: /#0D9488|text-teal-600|text-\[#0D9488\]/i.test(html),
            has5CE0D2onWhite: false, // hard to detect without rendered computed styles
          };
        });
        push(`${r.path} Uso de teal accesible (#0D9488)`, tealUsage.has0D9488, `has0D9488=${tealUsage.has0D9488}`);
      }

      // Mobile no overflow
      await page.setViewportSize({ width: 375, height: 800 });
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      push(`${r.path} sin overflow @375px`, overflow <= 8, `overflow=${overflow}`);

    } catch (e) {
      push(`${r.path} EXCEPTION`, false, e.message.slice(0, 100));
    }
    await ctx.close();
  }

  await b.close();
}

await audit();

console.log('\n===== FASE 5 BATCH 2a — AUDIT =====\n');
let ok = 0, fail = 0;
for (const r of results) {
  const icon = r.ok ? 'OK  ' : 'FAIL';
  if (r.ok) ok++; else fail++;
  console.log(`[${icon}] ${r.k}${r.note ? ' — ' + r.note : ''}`);
}
console.log(`\nSUMMARY: ok=${ok} fail=${fail}\n`);
process.exit(fail > 0 ? 1 : 0);
