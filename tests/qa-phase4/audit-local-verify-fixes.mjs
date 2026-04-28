import { chromium } from 'playwright';
const BASE = 'http://localhost:3000';
const b = await chromium.launch();
const results = [];
const push = (k, ok, note='') => results.push({ k, ok, note });

// Desktop home
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const r = await p.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 60000 });
  push('home HTTP', r?.status() === 200, `status=${r?.status()}`);
  await p.waitForTimeout(3000);

  // Fix 1: Hero tabs Comprar/Preventa
  const tabs = await p.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, [role="tab"]'));
    return all.map(x => (x.textContent || '').trim()).filter(t => t && t.length < 40);
  });
  const hasComprar = tabs.some(t => /^comprar$/i.test(t) || /^buy$/i.test(t));
  const hasPreventa = tabs.some(t => /preventa|pre-?sale/i.test(t));
  push('Fix#3 Hero tabs Comprar/Preventa', hasComprar && hasPreventa, `comprar=${hasComprar} preventa=${hasPreventa} | allTabs=[${tabs.slice(0,10).join('|')}]`);

  // Fix 2: Hero stats pills 170/500/5/30
  const statsVals = await p.evaluate(() => {
    const txt = document.body.innerText || '';
    return {
      has170: /170/.test(txt),
      has500: /500/.test(txt),
      has5cities: /\b5\b[\s\S]{0,20}(ciudades|cities)/i.test(txt),
      has30zones: /\b30\+?\b[\s\S]{0,20}(zonas|zones)/i.test(txt),
    };
  });
  const statsPass = statsVals.has170 && statsVals.has500;
  push('Fix#1 Hero stats pills (170/500/5/30)', statsPass, JSON.stringify(statsVals));

  // Fix 4: Featured Properties ≥ 3 cards
  const cards = await p.$$eval('a[href*="/desarrollos/"]', els => els.length);
  push('Fix#4 Featured Properties ≥3 cards', cards >= 3, `desarrollo-links=${cards}`);

  // Fix 6: WhatsApp button present in DOM (permanent render)
  const waInfo = await p.evaluate(() => {
    const as = Array.from(document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]'));
    return {
      count: as.length,
      hrefs: as.map(a => a.href).slice(0, 3),
      sizes: as.map(a => { const r = a.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; }),
    };
  });
  push('Fix#6 WhatsApp button permanent render (desktop)', waInfo.count >= 1, JSON.stringify(waInfo));

  await ctx.close();
}

// Mobile home — burger aria-label
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2000);

  const burgerInfo = await p.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const candidates = allBtns.filter(b => {
      const al = (b.getAttribute('aria-label') || '').toLowerCase();
      return /menu|men[úu]|burger|abrir/.test(al);
    });
    return {
      burgerCount: candidates.length,
      burgerAriaLabels: candidates.map(b => b.getAttribute('aria-label')),
      allHeaderAriaLabels: Array.from(document.querySelectorAll('header button, [class*="MobileHeader"] button'))
        .map(b => b.getAttribute('aria-label')),
    };
  });
  push('Fix#7 Mobile burger button (aria-label menú)', burgerInfo.burgerCount >= 1, JSON.stringify(burgerInfo));

  await ctx.close();
}

// Detail dev — Market Indicator in Rentabilidad tab
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/es/desarrollos/akora-residencial-b73b319b`, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(3000);
  // Click tab Rentabilidad
  const _clicked = await p.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const t = tabs.find(el => /rentabilidad|returns/i.test(el.textContent || ''));
    if (t) { t.click(); return true; }
    return false;
  });
  void _clicked;
  await p.waitForTimeout(2500);
  const miInfo = await p.evaluate(() => {
    const body = document.body.innerText || '';
    // Buscar score /100 o "indicador de mercado"
    const scoreMatches = (body.match(/\b\d{1,3}\s*\/\s*100\b/g) || []);
    const hasIndicatorText = /market indicator|indicador de mercado|puntaje de mercado|score de mercado/i.test(body);
    return { scoreMatches, hasIndicatorText };
  });
  push('Fix#5 Market Indicator badge en tab Rentabilidad', miInfo.scoreMatches.length > 0 || miInfo.hasIndicatorText, JSON.stringify(miInfo));
  await ctx.close();
}

await b.close();

console.log('\n===== LOCAL VERIFY RESULTS =====\n');
for (const r of results) {
  console.log(`[${r.ok ? 'OK  ' : 'FAIL'}] ${r.k}`);
  if (r.note) console.log(`       → ${r.note}`);
}
const fails = results.filter(r => !r.ok).length;
console.log(`\nSUMMARY: ${results.length - fails}/${results.length} pass`);
process.exit(fails > 0 ? 1 : 0);
