import { chromium } from 'playwright';
const BASE = 'https://dev.propyte.com';
const b = await chromium.launch();

// Home
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 45000 });
  await p.waitForTimeout(3000);

  const info = await p.evaluate(() => {
    const out = {};
    // Hero: buscar video o bg-image o backgroundImage
    const main = document.querySelector('main') || document.body;
    const heroSec = main.querySelector('section:first-of-type, [class*="hero" i]');
    out.heroHTML = heroSec ? heroSec.outerHTML.slice(0, 600) : 'NO_HERO_SECTION';
    out.heroHasVideo = !!heroSec?.querySelector('video');
    out.heroHasImg = !!heroSec?.querySelector('img');
    const bg = heroSec ? getComputedStyle(heroSec).backgroundImage : '';
    out.heroBgImg = bg.slice(0, 120);

    // Tabs
    const allButtons = Array.from(document.querySelectorAll('button, [role="tab"], [data-state]'));
    out.buttonsTexts = allButtons.map(b => (b.textContent || '').trim()).filter(t => t && t.length < 40).slice(0, 40);

    // Stats
    out.bodyHas170 = document.body.innerText.includes('170');
    out.bodyHas500 = document.body.innerText.includes('500');

    // Featured properties
    const possibleCards = document.querySelectorAll('a[href*="/desarrollos/"]');
    out.cardsDesarrolloLinks = possibleCards.length;
    const firstCard = possibleCards[0];
    out.firstCardHTML = firstCard ? firstCard.outerHTML.slice(0, 400) : 'NONE';

    // WhatsApp
    const waLinks = Array.from(document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]'));
    out.waCount = waLinks.length;
    out.waSizes = waLinks.map(a => { const r = a.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; });

    return out;
  });
  console.log('=== HOME ===');
  console.log(JSON.stringify(info, null, 2));
  await ctx.close();
}

// Mobile home — check burger
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 45000 });
  const info = await p.evaluate(() => {
    const header = document.querySelector('header');
    return {
      headerHTML: header?.outerHTML.slice(0, 1200) || 'NONE',
      burgerCandidates: Array.from(document.querySelectorAll('header button')).map(b => ({
        aria: b.getAttribute('aria-label'),
        text: (b.textContent || '').trim().slice(0, 30),
      })),
    };
  });
  console.log('\n=== MOBILE HEADER ===');
  console.log(JSON.stringify(info, null, 2));
  await ctx.close();
}

// Archive desarrollos
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/es/desarrollos`, { waitUntil: 'networkidle', timeout: 45000 });
  await p.waitForTimeout(3000);
  const info = await p.evaluate(() => {
    const out = {};
    out.buttons = Array.from(document.querySelectorAll('button')).map(b => (b.textContent || '').trim().slice(0, 30)).filter(x => x).slice(0, 30);
    out.cardLinks = document.querySelectorAll('a[href*="/desarrollos/"]').length;
    out.allArticles = document.querySelectorAll('article').length;
    out.gmStyle = !!document.querySelector('[class*="gm-style"]');
    return out;
  });
  console.log('\n=== ARCHIVE DESARROLLOS ===');
  console.log(JSON.stringify(info, null, 2));
  await ctx.close();
}

// Detail dev — similar + market indicator
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/es/desarrollos/akora-residencial-b73b319b`, { waitUntil: 'networkidle', timeout: 45000 });
  await p.waitForTimeout(3000);
  // scroll to bottom to load similar
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(2500);
  const info = await p.evaluate(() => {
    const body = document.body.innerText || '';
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4')).map(h => (h.textContent || '').trim()).filter(x => x);
    const has100 = body.match(/\b\d{1,3}\s*\/\s*100\b/g);
    return { headings, has100 };
  });
  console.log('\n=== DETAIL DEV ===');
  console.log(JSON.stringify(info, null, 2));
  await ctx.close();
}

// /propiedades cards check
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/es/propiedades`, { waitUntil: 'networkidle', timeout: 45000 });
  await p.waitForTimeout(3000);
  const info = await p.evaluate(() => {
    return {
      propLinks: document.querySelectorAll('a[href*="/propiedades/"]').length,
      devLinks: document.querySelectorAll('a[href*="/desarrollos/"]').length,
      articles: document.querySelectorAll('article').length,
      bodyExcerpt: (document.body.innerText || '').slice(0, 400),
    };
  });
  console.log('\n=== /propiedades ===');
  console.log(JSON.stringify(info, null, 2));
  await ctx.close();
}

await b.close();
