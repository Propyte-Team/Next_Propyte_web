#!/usr/bin/env node
/**
 * Audit Fase 5 Batch 2b — /financiamiento + /glosario + /destacados (ES+EN)
 */
import { chromium } from 'playwright';

const BASE = 'https://dev.propyte.com';
const results = [];
const push = (k, ok, note = '') => results.push({ k, ok, note });

const routes = [
  {
    path: '/es/financiamiento',
    h1Re: /financiamiento/i,
    schemas: ['ItemList', 'LoanOrCredit'],
    expectLoans: 4,
    expectMonetary: true,
  },
  {
    path: '/en/financiamiento',
    h1Re: /financing/i,
    schemas: ['ItemList', 'LoanOrCredit'],
    expectLoans: 4,
    expectMonetary: true,
  },
  {
    path: '/es/glosario',
    h1Re: /glosario/i,
    schemas: ['DefinedTermSet'],
    expectTerms: 22,
  },
  {
    path: '/en/glosario',
    h1Re: /glossary/i,
    schemas: ['DefinedTermSet'],
    expectTerms: 22,
  },
  {
    path: '/es/destacados',
    h1Re: /destacados|desarrollos destacados/i,
    schemas: ['CollectionPage', 'ItemList'],
    expectRealEstate: true,
  },
  {
    path: '/en/destacados',
    h1Re: /featured/i,
    schemas: ['CollectionPage', 'ItemList'],
    expectRealEstate: true,
  },
];

function collectTypes(node, acc) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach(n => collectTypes(n, acc)); return; }
  if (node['@type']) {
    const t = node['@type'];
    if (Array.isArray(t)) t.forEach(x => acc.add(x));
    else acc.add(t);
  }
  for (const k of Object.keys(node)) {
    if (k === '@context') continue;
    collectTypes(node[k], acc);
  }
}

async function audit() {
  const b = await chromium.launch();

  for (const r of routes) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      const resp = await page.goto(BASE + r.path, { waitUntil: 'networkidle', timeout: 45000 });
      push(`${r.path} HTTP 200`, resp?.status() === 200, `status=${resp?.status()}`);
      if (resp?.status() !== 200) { await ctx.close(); continue; }
      await page.waitForTimeout(1000);

      // H1 count + match
      const h1 = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('h1'));
        return { count: els.length, texts: els.map(e => (e.textContent || '').trim().slice(0, 80)) };
      });
      push(`${r.path} exactly 1 <h1>`, h1.count === 1, `count=${h1.count} texts=[${h1.texts.join(' | ')}]`);
      if (h1.texts[0]) push(`${r.path} H1 matches regex`, r.h1Re.test(h1.texts[0]), `h1="${h1.texts[0]}"`);

      // Metadata
      const meta = await page.evaluate(() => {
        const get = (s) => document.querySelector(s)?.getAttribute('content') || null;
        return {
          title: document.querySelector('title')?.textContent || null,
          desc: get('meta[name="description"]'),
          ogTitle: get('meta[property="og:title"]'),
          twitter: get('meta[name="twitter:card"]'),
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
          hreflangs: Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map(l => l.getAttribute('hreflang')),
        };
      });
      push(`${r.path} <title> custom (no default layout title)`,
        !!meta.title && !/real estate en modo inteligente$/i.test(meta.title),
        meta.title?.slice(0, 70));
      push(`${r.path} <title> single | Propyte suffix`,
        !!meta.title && (meta.title.match(/\|\s*Propyte/g) || []).length === 1,
        meta.title?.slice(0, 70));
      push(`${r.path} description`, !!meta.desc, meta.desc?.slice(0, 60));
      push(`${r.path} og:title`, !!meta.ogTitle, meta.ogTitle?.slice(0, 60));
      push(`${r.path} twitter:card`, !!meta.twitter, meta.twitter);
      push(`${r.path} canonical self-referential`, !!meta.canonical && meta.canonical.includes(r.path), meta.canonical);
      push(`${r.path} hreflang es+en+x-default`, meta.hreflangs.includes('es') && meta.hreflangs.includes('en') && meta.hreflangs.includes('x-default'), meta.hreflangs.join(','));

      // JSON-LD schemas (SSR via curl check + parsed)
      const ldScripts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .map(s => { try { return JSON.parse(s.textContent || '{}'); } catch { return null; } })
          .filter(Boolean);
      });
      push(`${r.path} JSON-LD scripts >= 1`, ldScripts.length >= 1, `count=${ldScripts.length}`);

      const typesFound = new Set();
      ldScripts.forEach(s => collectTypes(s, typesFound));
      for (const expected of r.schemas) {
        push(`${r.path} JSON-LD contains @type=${expected}`, typesFound.has(expected), `types=[${Array.from(typesFound).join(',')}]`);
      }

      // /financiamiento: 4 LoanOrCredit items + MonetaryAmount
      if (r.expectLoans) {
        let loanCount = 0;
        const walk = (n) => {
          if (!n || typeof n !== 'object') return;
          if (Array.isArray(n)) return n.forEach(walk);
          if (n['@type'] === 'LoanOrCredit' || (Array.isArray(n['@type']) && n['@type'].includes('LoanOrCredit'))) loanCount++;
          for (const k of Object.keys(n)) if (k !== '@context') walk(n[k]);
        };
        ldScripts.forEach(walk);
        push(`${r.path} LoanOrCredit items >= ${r.expectLoans}`, loanCount >= r.expectLoans, `count=${loanCount}`);
      }
      if (r.expectMonetary) {
        push(`${r.path} MonetaryAmount present`, typesFound.has('MonetaryAmount'), '');
        push(`${r.path} QuantitativeValue present`, typesFound.has('QuantitativeValue'), '');
      }

      // /glosario: 22 DefinedTerm
      if (r.expectTerms) {
        let termCount = 0;
        const walk = (n) => {
          if (!n || typeof n !== 'object') return;
          if (Array.isArray(n)) return n.forEach(walk);
          if (n['@type'] === 'DefinedTerm' || (Array.isArray(n['@type']) && n['@type'].includes('DefinedTerm'))) termCount++;
          for (const k of Object.keys(n)) if (k !== '@context') walk(n[k]);
        };
        ldScripts.forEach(walk);
        push(`${r.path} DefinedTerm count = ${r.expectTerms}`, termCount === r.expectTerms, `count=${termCount}`);

        // Visual: al menos 22 términos con dt/dd o similar
        const uiTerms = await page.evaluate(() => {
          const dtCount = document.querySelectorAll('dt').length;
          const termish = document.querySelectorAll('[class*="term" i], [class*="glosario" i] h2, [class*="glosario" i] h3, li, article').length;
          return { dtCount, termish };
        });
        push(`${r.path} UI: >=22 term blocks rendered`, uiTerms.dtCount >= 22 || uiTerms.termish >= 22, `dt=${uiTerms.dtCount} termish=${uiTerms.termish}`);
      }

      // /destacados: RealEstateListing en ItemList
      if (r.expectRealEstate) {
        push(`${r.path} JSON-LD contains RealEstateListing`, typesFound.has('RealEstateListing'), '');
        const visibleCards = await page.evaluate(() => {
          return document.querySelectorAll('a[href*="/desarrollos/"]').length;
        });
        push(`${r.path} UI: cards enlazando a /desarrollos/*`, visibleCards >= 1, `cards=${visibleCards}`);
      }

      // Mobile overflow
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

console.log('\n===== FASE 5 BATCH 2b — AUDIT =====\n');
let ok = 0, fail = 0;
for (const r of results) {
  const icon = r.ok ? 'OK  ' : 'FAIL';
  if (r.ok) ok++; else fail++;
  console.log(`[${icon}] ${r.k}${r.note ? ' — ' + r.note : ''}`);
}
console.log(`\nSUMMARY: ok=${ok} fail=${fail}\n`);
process.exit(fail > 0 ? 1 : 0);
