#!/usr/bin/env node
/**
 * Audit Fase 5 Batch 1 ALTA — /contacto + /nosotros/{quienes-somos,estructura,equipo-comercial}
 */
import { chromium } from 'playwright';

const BASE = 'https://dev.propyte.com';
const results = [];
const push = (k, ok, note = '') => results.push({ k, ok, note });

const routes = [
  { path: '/es/contacto',               h1Re: /hablemos/i,                 locale: 'es' },
  { path: '/en/contacto',               h1Re: /let'?s talk|talk|contact/i, locale: 'en' },
  { path: '/es/nosotros/quienes-somos', h1Re: /conoce propyte/i,           locale: 'es' },
  { path: '/en/nosotros/quienes-somos', h1Re: /(about|meet|know)/i,        locale: 'en' },
  { path: '/es/nosotros/estructura',    h1Re: /estructura organiza/i,      locale: 'es' },
  { path: '/en/nosotros/estructura',    h1Re: /(organiza|structure)/i,     locale: 'en' },
  { path: '/es/nosotros/equipo-comercial', h1Re: /equipo comercial|nuestro equipo/i, locale: 'es' },
  { path: '/en/nosotros/equipo-comercial', h1Re: /(team|sales)/i,          locale: 'en' },
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

      // H1
      const h1 = await page.$eval('h1', el => (el.textContent || '').trim()).catch(() => '');
      push(`${r.path} H1 matches`, r.h1Re.test(h1), `h1="${h1.slice(0, 60)}"`);

      // generateMetadata: title + og + twitter + canonical + hreflang
      const meta = await page.evaluate(() => {
        const get = (sel) => document.querySelector(sel)?.getAttribute('content') || null;
        const title = document.querySelector('title')?.textContent || null;
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null;
        const hreflangs = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]'))
          .map(l => `${l.getAttribute('hreflang')}=${l.getAttribute('href')}`);
        return {
          title,
          description: get('meta[name="description"]'),
          ogTitle: get('meta[property="og:title"]'),
          ogDesc: get('meta[property="og:description"]'),
          twitter: get('meta[name="twitter:card"]'),
          canonical,
          hreflangs,
        };
      });
      push(`${r.path} <title>`, !!meta.title && meta.title.length > 5, meta.title?.slice(0, 60));
      push(`${r.path} meta description`, !!meta.description, meta.description?.slice(0, 60));
      push(`${r.path} og:title`, !!meta.ogTitle, meta.ogTitle?.slice(0, 60));
      push(`${r.path} twitter:card`, !!meta.twitter, meta.twitter);
      push(`${r.path} canonical link`, !!meta.canonical, meta.canonical);
      push(`${r.path} hreflang ES+EN`, meta.hreflangs.length >= 2, meta.hreflangs.join(' | '));

      // Canonical routing fix: /en/contact → /en/contacto (user claim: canonical debe apuntar a /en/contacto no /en/contact)
      if (r.path === '/en/contacto') {
        const canonicalOK = meta.canonical && /\/en\/contacto(\/|$|\?)/.test(meta.canonical) && !/\/en\/contact(\/|$|\?)/.test(meta.canonical);
        push(`${r.path} canonical NO redirige a /en/contact`, canonicalOK, `canonical=${meta.canonical}`);
      }

      // /contacto: Google Maps iframe real + teléfono +52 984
      if (r.path.endsWith('/contacto')) {
        const info = await page.evaluate(() => {
          const iframes = Array.from(document.querySelectorAll('iframe'));
          const gmap = iframes.some(i => /google\.com\/maps|maps\.google/i.test(i.src || ''));
          const body = document.body.innerText || '';
          const phone = /\+?52\s*984|\+?52[\s\-]?9?84/.test(body);
          const waLinks = Array.from(document.querySelectorAll('a[href*="wa.me"]'));
          const waHasMessage = waLinks.some(a => /[?&]text=/.test(a.href));
          return { gmap, phone, waHasMessage, waHrefs: waLinks.map(a => a.href).slice(0, 2) };
        });
        push(`${r.path} Google Maps iframe`, info.gmap, '');
        push(`${r.path} Teléfono +52 984`, info.phone, '');
        push(`${r.path} WhatsApp con mensaje (?text=)`, info.waHasMessage, info.waHrefs.join(' | '));
      }

      // /quienes-somos: foto Unsplash via next/image
      if (r.path.endsWith('/quienes-somos')) {
        const hasUnsplash = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          return imgs.some(i => /images\.unsplash\.com/.test(i.src || i.srcset || ''));
        });
        push(`${r.path} Unsplash foto (next/image)`, hasUnsplash, '');
      }

      // /equipo-comercial: wa.me con env var (PUBLIC_WHATSAPP_NUMBER)
      if (r.path.endsWith('/equipo-comercial')) {
        const waEnv = await page.evaluate(() => {
          const as = Array.from(document.querySelectorAll('a[href*="wa.me"]'));
          return as.map(a => a.href);
        });
        push(`${r.path} wa.me link presente`, waEnv.length > 0, waEnv.slice(0, 2).join(' | '));
      }

      // Mobile viewport 375px smoke
      await page.setViewportSize({ width: 375, height: 800 });
      await page.waitForTimeout(800);
      const overflow = await page.evaluate(() => {
        const w = document.documentElement.scrollWidth;
        const vw = window.innerWidth;
        return { scrollW: w, vw, overflow: w - vw };
      });
      push(`${r.path} sin overflow horizontal @375px`, overflow.overflow <= 8, `scrollW=${overflow.scrollW} vw=${overflow.vw}`);
    } catch (e) {
      push(`${r.path} EXCEPTION`, false, e.message.slice(0, 100));
    }
    await ctx.close();
  }

  await b.close();
}

await audit();

console.log('\n===== FASE 5 BATCH 1 ALTA — AUDIT RESULT =====\n');
let ok = 0, fail = 0;
for (const r of results) {
  const icon = r.ok ? 'OK  ' : 'FAIL';
  if (r.ok) ok++; else fail++;
  console.log(`[${icon}] ${r.k}${r.note ? ' — ' + r.note : ''}`);
}
console.log(`\nSUMMARY: ok=${ok} fail=${fail}\n`);
process.exit(fail > 0 ? 1 : 0);
