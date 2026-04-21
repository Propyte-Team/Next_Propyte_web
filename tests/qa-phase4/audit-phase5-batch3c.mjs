#!/usr/bin/env node
/**
 * Audit Fase 5 Batch 3c (cierre Fase 5) — /promociones + /corredores + /unete + /mercado (ES+EN)
 */
import { chromium } from 'playwright';

const BASE = 'https://dev.propyte.com';
const results = [];
const push = (k, ok, note = '') => results.push({ k, ok, note });

const routes = [
  {
    path: '/es/promociones',
    h1Re: /promocion/i,
    schemas: ['CollectionPage', 'ItemList', 'Offer'],
    expectOfferWithValidThrough: true,
    expectPriceSpec: true,
  },
  {
    path: '/en/promociones',
    h1Re: /promotion|special offer/i,
    schemas: ['CollectionPage', 'ItemList', 'Offer'],
    expectOfferWithValidThrough: true,
    expectPriceSpec: true,
  },
  {
    path: '/es/corredores',
    h1Re: /corredor|agencia|broker/i,
    schemas: ['ProfessionalService'],
    expectGeoOrCircle: true,
    expectBreadcrumb: true,
  },
  {
    path: '/en/corredores',
    h1Re: /broker|agenc/i,
    schemas: ['ProfessionalService'],
    expectGeoOrCircle: true,
    expectBreadcrumb: true,
  },
  {
    path: '/es/unete',
    h1Re: /[úu]nete|equipo|trabaja/i,
    schemas: ['WebPage'],
    heroSiteException: true,
  },
  {
    path: '/en/unete',
    h1Re: /join|team|work/i,
    schemas: ['WebPage'],
    heroSiteException: true,
  },
  {
    path: '/es/mercado',
    h1Re: /mercado|inteligencia/i,
    schemas: ['WebApplication'],
    expectPlace: true,
  },
  {
    path: '/en/mercado',
    h1Re: /market/i,
    schemas: ['WebApplication'],
    expectPlace: true,
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

function findFirst(node, typeName, acc = []) {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) { node.forEach(n => findFirst(n, typeName, acc)); return acc; }
  const t = node['@type'];
  const matches = Array.isArray(t) ? t.includes(typeName) : t === typeName;
  if (matches) acc.push(node);
  for (const k of Object.keys(node)) if (k !== '@context') findFirst(node[k], typeName, acc);
  return acc;
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

      // H1
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
      push(`${r.path} <title> custom`, !!meta.title && !/real estate en modo inteligente$/i.test(meta.title), meta.title?.slice(0, 70));
      push(`${r.path} <title> single | Propyte`, !!meta.title && (meta.title.match(/\|\s*Propyte/g) || []).length === 1, meta.title?.slice(0, 70));
      push(`${r.path} description`, !!meta.desc, meta.desc?.slice(0, 60));
      push(`${r.path} og:title`, !!meta.ogTitle, '');
      push(`${r.path} twitter:card`, !!meta.twitter, meta.twitter);
      push(`${r.path} canonical self-ref`, !!meta.canonical && meta.canonical.includes(r.path), meta.canonical);
      push(`${r.path} hreflang es+en+x-default`, meta.hreflangs.includes('es') && meta.hreflangs.includes('en') && meta.hreflangs.includes('x-default'), meta.hreflangs.join(','));

      // JSON-LD
      const ldScripts = await page.evaluate(() =>
        Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .map(s => { try { return JSON.parse(s.textContent || '{}'); } catch { return null; } })
          .filter(Boolean)
      );
      push(`${r.path} JSON-LD scripts >= 1`, ldScripts.length >= 1, `count=${ldScripts.length}`);

      const typesFound = new Set();
      ldScripts.forEach(s => collectTypes(s, typesFound));
      for (const expected of r.schemas) {
        push(`${r.path} JSON-LD contains @type=${expected}`, typesFound.has(expected), `types=[${Array.from(typesFound).join(',')}]`);
      }

      // /promociones: Offer con validThrough +90d + PriceSpecification
      if (r.expectOfferWithValidThrough) {
        const offers = [];
        ldScripts.forEach(s => findFirst(s, 'Offer', offers));
        const hasValidThrough = offers.some(o => !!o.validThrough);
        push(`${r.path} Offer con validThrough`, hasValidThrough, `offers=${offers.length}`);
        if (hasValidThrough) {
          const dates = offers.filter(o => o.validThrough).map(o => new Date(o.validThrough));
          const now = new Date();
          const within90d = dates.some(d => d > now && (d - now) / (1000*60*60*24) <= 100);
          push(`${r.path} Offer.validThrough futuro (~+90d)`, within90d, dates.map(d => d.toISOString().slice(0,10)).join('|'));
        }
      }
      if (r.expectPriceSpec) {
        const hasPS = typesFound.has('PriceSpecification') || typesFound.has('UnitPriceSpecification') || typesFound.has('CompoundPriceSpecification');
        push(`${r.path} PriceSpecification present`, hasPS, `types includes PriceSpec=${hasPS}`);
      }

      // /corredores: Geo + BreadcrumbList
      if (r.expectGeoOrCircle) {
        const hasGeo = typesFound.has('GeoCircle') || typesFound.has('GeoCoordinates') || typesFound.has('GeoShape');
        push(`${r.path} Geo (Circle/Coordinates)`, hasGeo, `types=[${Array.from(typesFound).join(',')}]`);
      }
      if (r.expectBreadcrumb) {
        push(`${r.path} BreadcrumbList`, typesFound.has('BreadcrumbList'), '');
      }

      // /unete: HERO-SITE exception — verificar que UI mantenga dark hero + beneficios grid + CTA
      if (r.heroSiteException) {
        const heroMarkers = await page.evaluate(() => {
          const body = document.body.innerText || '';
          const hasBenefitsGrid = /beneficio|benefit|carrera|career/i.test(body);
          const hasCTAApply = /postul|aplica|apply|env[ií]a/i.test(body);
          // dark hero: sección con bg oscuro en primera parte
          const firstSec = document.querySelector('main section, section');
          const bg = firstSec ? getComputedStyle(firstSec).backgroundColor : '';
          return { hasBenefitsGrid, hasCTAApply, firstSectionBg: bg };
        });
        push(`${r.path} HERO-SITE design preservado (benefits grid + CTA apply)`,
          heroMarkers.hasBenefitsGrid && heroMarkers.hasCTAApply,
          `benefits=${heroMarkers.hasBenefitsGrid} ctaApply=${heroMarkers.hasCTAApply} bg=${heroMarkers.firstSectionBg}`);
      }

      // /mercado: Place schema + data gap tolerance
      if (r.expectPlace) {
        push(`${r.path} Place schema`, typesFound.has('Place'), `types=[${Array.from(typesFound).join(',')}]`);
        // Data gap tolerance: la página debe renderizar aunque zone_scores esté vacío
        const contentOK = await page.evaluate(() => {
          const body = document.body.innerText || '';
          // No debe mostrar error stack traces ni "Error" genérico
          const hasError = /error|exception|stack trace/i.test(body.slice(0, 2000));
          const hasContent = body.length > 500;
          return { hasError, contentLength: body.length };
        });
        push(`${r.path} renderiza sin errores (data gap tolerance)`, !contentOK.hasError && contentOK.contentLength > 500, `len=${contentOK.contentLength} err=${contentOK.hasError}`);
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

console.log('\n===== FASE 5 BATCH 3c (cierre Fase 5) — AUDIT =====\n');
let ok = 0, fail = 0;
for (const r of results) {
  const icon = r.ok ? 'OK  ' : 'FAIL';
  if (r.ok) ok++; else fail++;
  console.log(`[${icon}] ${r.k}${r.note ? ' — ' + r.note : ''}`);
}
console.log(`\nSUMMARY: ok=${ok} fail=${fail}\n`);
process.exit(fail > 0 ? 1 : 0);
