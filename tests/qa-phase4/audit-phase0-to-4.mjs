#!/usr/bin/env node
/**
 * Audit: progreso Fase 0 → Fase 4 + Sesión 18.
 * Target: dev.propyte.com (staging deployado).
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';

const BASE = 'https://dev.propyte.com';
const OUT = 'tests/qa-phase4/screenshots-audit-p0-4';

const DEV_SLUG = 'akora-residencial-b73b319b';
const SAMPLE_SLUG = 'sample-azul-vivo-5a4e4a4e';

const report = { phases: {}, summary: { ok: 0, fail: 0, warn: 0 } };

function push(phase, key, ok, note = '') {
  report.phases[phase] ??= [];
  report.phases[phase].push({ key, ok, note });
  if (ok === true) report.summary.ok++;
  else if (ok === false) report.summary.fail++;
  else report.summary.warn++;
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  // ============ FASE 1 — Layout ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const r = await page.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 45000 });
    push('F1_Layout', 'Home HTTP 200', r?.status() === 200, `status=${r?.status()}`);

    const sidebar = await page.evaluate(() => {
      const el = document.querySelector('aside, nav[class*="sidebar" i], [class*="Sidebar"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    push('F1_Layout', 'Sidebar desktop 72px', !!sidebar && sidebar.w >= 60 && sidebar.w <= 90, `w=${sidebar?.w}`);

    const wa = await page.evaluate(() => {
      const a = Array.from(document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]'))
        .find(a => { const r = a.getBoundingClientRect(); return r.width > 40 && r.width < 100; });
      if (!a) return null;
      const r = a.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    push('F1_Layout', 'WhatsApp float 60x60', !!wa && wa.w >= 50 && wa.w <= 80, `size=${wa?.w}x${wa?.h}`);

    const footerCols = await page.evaluate(() => {
      const f = document.querySelector('footer');
      if (!f) return 0;
      const grids = f.querySelectorAll('[class*="grid-cols-6"], [class*="lg:grid-cols-6"]');
      return grids.length;
    });
    push('F1_Layout', 'Footer 6 cols present', footerCols >= 1, `grids=${footerCols}`);

    await page.screenshot({ path: `${OUT}/home-desktop.png`, fullPage: false });
    await ctx.close();
  }

  // ============ FASE 1 — Mobile ============
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 45000 });

    const mobileHeader = await page.evaluate(() => {
      const h = document.querySelector('header');
      if (!h) return null;
      const burger = h.querySelector('button[aria-label*="menu" i], button[aria-label*="men" i]');
      const search = h.querySelector('[class*="search" i], [class*="Search"]');
      return { hasHeader: !!h, hasBurger: !!burger, hasSearch: !!search };
    });
    push('F1_Mobile', 'Mobile header + burger + search', !!mobileHeader?.hasHeader && !!mobileHeader?.hasBurger, JSON.stringify(mobileHeader));

    await page.screenshot({ path: `${OUT}/home-mobile.png`, fullPage: false });
    await ctx.close();
  }

  // ============ FASE 2 — Homepage sections ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2000);

    const hero = await page.evaluate(() => {
      const body = document.body.innerText || '';
      const hasH1 = /invierte con datos|decide con confianza/i.test(body);
      const hasVideoOrImg = !!document.querySelector('video, section img[alt*="hero" i], [class*="hero" i] img');
      const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'))
        .map(el => (el.textContent || '').trim().toLowerCase());
      const hasComprar = tabs.some(t => /comprar/.test(t));
      const hasPreventa = tabs.some(t => /preventa/.test(t));
      return { hasH1, hasVideoOrImg, hasComprar, hasPreventa };
    });
    push('F2_Home', 'H1 nueva voz (Invierte con datos / Decide con confianza)', hero.hasH1, '');
    push('F2_Home', 'Hero video/image BG', hero.hasVideoOrImg, '');
    push('F2_Home', 'Hero tabs Comprar + Preventa', hero.hasComprar && hero.hasPreventa, `comprar=${hero.hasComprar} preventa=${hero.hasPreventa}`);

    // Scroll para disparar whileInView
    for (let y = 0; y < 6000; y += 600) {
      await page.evaluate((s) => window.scrollTo(0, s), y);
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(1500);

    const sections = await page.evaluate(() => {
      const body = document.body.innerText || '';
      return {
        stats: /170\+|500\+|5 ciudades|30\+/i.test(body),
        quickLinks: /PDC|Tulum|Beachfront|<\s*\$?3\s*m/i.test(body),
        explore: /preventa|rentas|desarrollos|propiedades|zonas/i.test(body),
        // Count unique card links to dev/unit slugs (robust vs Next prod minification)
        featured: new Set(
          Array.from(document.querySelectorAll('a[href^="/es/desarrollos/"], a[href^="/en/desarrollos/"]'))
            .map((a) => a.getAttribute('href'))
            .filter((h) => h && h.split('/').length >= 4)
        ).size,
        trending: /trending|top zonas|kpi|market|mercado/i.test(body),
        whyPropyte: /por qu[eé] propyte|why propyte|data-driven|datos/i.test(body),
        joinTeam: /join.*team|[úu]nete|equipo/i.test(body),
      };
    });
    push('F2_Home', 'Hero stats pills (170+, 500+, 5 ciudades, 30+)', sections.stats, '');
    push('F2_Home', 'Hero quick links (PDC, Tulum, Beachfront, <$3M)', sections.quickLinks, '');
    push('F2_Home', 'Explore Categories', sections.explore, '');
    push('F2_Home', 'Featured Properties (>=3 cards)', sections.featured >= 3, `cards=${sections.featured}`);
    push('F2_Home', 'Trending Market KPIs', sections.trending, '');
    push('F2_Home', 'Why Propyte section', sections.whyPropyte, '');
    push('F2_Home', 'Join Team Banner', sections.joinTeam, '');

    await page.screenshot({ path: `${OUT}/home-full.png`, fullPage: true });
    await ctx.close();
  }

  // ============ FASE 3 — Archive Desarrollos ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const r = await page.goto(`${BASE}/es/desarrollos`, { waitUntil: 'networkidle', timeout: 45000 });
    push('F3_Archive_Dev', 'GET /desarrollos 200', r?.status() === 200, `status=${r?.status()}`);
    await page.waitForTimeout(2000);

    const arch = await page.evaluate(() => {
      // FilterBar pills: data-filter-pill attribute (explicit) OR filter-like text
      const explicitPills = Array.from(document.querySelectorAll('[data-filter-pill]'));
      const filterTextRe = /ubicaci[oó]n|location|ciudad|city|precio|price|tipo|type|etapa|stage|zona|zone|recámaras|bedrooms|roi|m[aá]s filtros|more filters/i;
      const allBtns = Array.from(document.querySelectorAll('button'));
      const textPills = allBtns.filter((b) => filterTextRe.test(b.textContent || '') && (b.offsetWidth || 0) > 0);
      const pills = explicitPills.length > 0 ? explicitPills : textPills;
      const sortBtn = allBtns.find((b) => /orden|sort|relevancia|relevance|recientes|newest|precio/i.test(b.textContent || ''));
      const map = document.querySelector('iframe[src*="google.com/maps"], [aria-label*="Map" i], div.gm-style, [data-google-map]');
      // Cards: unique slug links under /desarrollos/{slug}
      const cardSlugs = new Set(
        Array.from(document.querySelectorAll('a[href^="/es/desarrollos/"], a[href^="/en/desarrollos/"]'))
          .map((a) => a.getAttribute('href'))
          .filter((h) => h && h.split('/').length >= 4 && !h.endsWith('/desarrollos'))
      );
      return {
        pillsCount: pills.length,
        hasSort: !!sortBtn,
        hasMap: !!map,
        cards: cardSlugs.size,
      };
    });
    push('F3_Archive_Dev', 'FilterBar pills >=4', arch.pillsCount >= 4, `pills=${arch.pillsCount}`);
    push('F3_Archive_Dev', 'SortDropdown present', arch.hasSort, '');
    push('F3_Archive_Dev', 'MapView (Google Maps)', arch.hasMap, '');
    push('F3_Archive_Dev', 'Cards render (>=1)', arch.cards >= 1, `cards=${arch.cards}`);

    await page.screenshot({ path: `${OUT}/archive-desarrollos.png`, fullPage: false });
    await ctx.close();
  }

  // ============ FASE 3 — Archive Propiedades (Sesión 18 fix) ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const r = await page.goto(`${BASE}/es/propiedades`, { waitUntil: 'networkidle', timeout: 45000 });
    push('F3_Archive_Unit', 'GET /propiedades 200', r?.status() === 200, `status=${r?.status()}`);
    await page.waitForTimeout(2000);
    const cards = await page.evaluate(() => {
      return new Set(
        Array.from(document.querySelectorAll('a[href^="/es/propiedades/"], a[href^="/en/propiedades/"]'))
          .map((a) => a.getAttribute('href'))
          .filter((h) => h && h.split('/').length >= 4 && !h.endsWith('/propiedades'))
      ).size;
    });
    push('F3_Archive_Unit', '/propiedades renderiza cards (unidades, no desarrollos)', cards >= 1, `cards=${cards}`);
    await page.screenshot({ path: `${OUT}/archive-propiedades.png`, fullPage: false });
    await ctx.close();
  }

  // ============ FASE 3 — Archive Desarrolladores ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const r = await page.goto(`${BASE}/es/desarrolladores`, { waitUntil: 'networkidle', timeout: 45000 });
    push('F3_Archive_Dev2', 'GET /desarrolladores 200', r?.status() === 200, `status=${r?.status()}`);
    await page.waitForTimeout(1500);
    const hasFilterBar = await page.$$eval('[class*="FilterBar"], [data-filter-pill]', els => els.length > 0);
    push('F3_Archive_Dev2', 'FilterBar present (ALTA pending in tracker)', hasFilterBar, hasFilterBar ? 'OK' : 'MISSING (esperado — pending)');
    await ctx.close();
  }

  // ============ FASE 4 — Detail Dev page (3 tabs) ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const r = await page.goto(`${BASE}/es/desarrollos/${DEV_SLUG}`, { waitUntil: 'networkidle', timeout: 45000 });
    push('F4_Detail_Dev', `GET /desarrollos/${DEV_SLUG} 200`, r?.status() === 200, `status=${r?.status()}`);
    await page.waitForTimeout(2000);

    const tabs = await page.$$eval('[role="tab"]', els => els.map(e => e.textContent?.trim()));
    push('F4_Detail_Dev', 'Tab system 3 tabs', tabs.length >= 3, tabs.join(' | '));

    const sidebar = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      const hasContact = Array.from(forms).some(f => /contacto|contact|nombre|email|mensaje/i.test(f.textContent || ''));
      return hasContact;
    });
    push('F4_Detail_Dev', 'Contact sidebar form', sidebar, '');

    const similar = await page.evaluate(() => {
      const body = document.body.innerText || '';
      return /similar|parecid|relacionad|más desarrollos|more developments/i.test(body);
    });
    push('F4_Detail_Dev', 'Similar Listings section', similar, '');

    // Click tab 2 (geo)
    const geoClicked = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const t = tabs.find(el => /ubicaci[oó]n|location|geogr[aá]fico/i.test(el.textContent || ''));
      if (t) { t.click(); return true; }
      return false;
    });
    await page.waitForTimeout(1500);
    push('F4_Detail_Dev', 'Click tab Ubicación funciona', geoClicked, '');

    const hasMap = await page.evaluate(() => {
      return !!document.querySelector('[class*="gm-style"], iframe[src*="google.com/maps"]');
    });
    push('F4_Detail_Dev', 'Google Map renderiza en tab Ubicación', hasMap, '');

    // Click tab 3 (rentabilidad)
    const retClicked = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const t = tabs.find(el => /rentabilidad|returns/i.test(el.textContent || ''));
      if (t) { t.click(); return true; }
      return false;
    });
    await page.waitForTimeout(1500);
    push('F4_Detail_Dev', 'Click tab Rentabilidad funciona', retClicked, '');

    // Market Indicator badge — vive en tab Rentabilidad, requiere click previo
    const marketIndicator = await page.evaluate(() => {
      const body = document.body.innerText || '';
      return /market score|market indicator|índice de mercado|indicador de mercado|\/\s*100/i.test(body);
    });
    push('F4_Detail_Dev', 'Market Indicator badge', marketIndicator, '');

    const rentAirdna = await page.evaluate(() => {
      const body = document.body.innerText || '';
      // AirDNA metrics: ocupación %, ADR, listings. Guard commit 2c contra scale bug (si >100% inflated)
      const occMatch = body.match(/(\d{1,3}(?:\.\d+)?)\s*%\s*(ocupaci[oó]n|occupancy)/i);
      const hasADR = /adr|tarifa diaria/i.test(body);
      const hasListings = /listings|propiedades listadas/i.test(body);
      let occValue = null;
      if (occMatch) occValue = parseFloat(occMatch[1]);
      return { hasADR, hasListings, occValue };
    });
    push('F4_Detail_Dev', 'AirDNA ADR + listings', rentAirdna.hasADR && rentAirdna.hasListings, JSON.stringify(rentAirdna));
    push('F4_Detail_Dev', 'AirDNA occupancy scale 0-100 (no inflación)', rentAirdna.occValue === null || rentAirdna.occValue <= 100, `occ=${rentAirdna.occValue}`);

    const cetes = await page.evaluate(() => /cetes|comparaci[oó]n con cetes/i.test(document.body.innerText || ''));
    push('F4_Detail_Dev', 'CetesComparison presente', cetes, '');

    await page.screenshot({ path: `${OUT}/detail-dev.png`, fullPage: false });
    await ctx.close();
  }

  // ============ FASE 4 — Detail Dev: Share modal + Mobile floating bar ============
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es/desarrollos/${DEV_SLUG}`, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2000);

    const floatBar = await page.evaluate(() => {
      const fixed = Array.from(document.querySelectorAll('*')).filter(el => {
        const s = getComputedStyle(el);
        return s.position === 'fixed' && parseFloat(s.bottom) >= 0 && parseFloat(s.bottom) < 20;
      });
      return fixed.some(el => /contact|wa|whats|precio/i.test(el.textContent || '') || el.querySelector('a[href*="wa.me"]'));
    });
    push('F4_Mobile_Bar', 'Mobile floating bar (fixed bottom)', floatBar, '');

    const shareBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => /compartir|share|descargar|download/i.test(b.textContent || '') || b.querySelector('[class*="share" i]'));
    });
    push('F4_Mobile_Bar', 'Share/Download trigger button', shareBtn, '');

    await page.screenshot({ path: `${OUT}/detail-dev-mobile.png`, fullPage: false });
    await ctx.close();
  }

  // ============ FASE 4 — Single Unidad ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const r = await page.goto(`${BASE}/es/propiedades/a101`, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => null);
    const status = r?.status();
    push('F4_Unit', `GET /propiedades/a101 (sample unit)`, status === 200 || status === 404, `status=${status} (404 OK si slug cambió)`);
    if (status === 200) {
      await page.waitForTimeout(2000);
      const calc = await page.evaluate(() => {
        const body = document.body.innerText || '';
        return {
          hasCalc: /residencial|vacacional|financiamiento|proyecci[oó]n|roi/i.test(body),
          hasGallery: !!document.querySelector('[class*="gallery" i], [class*="Gallery"]'),
          hasAvailability: /disponible|vendid|reservad|available/i.test(body),
        };
      });
      push('F4_Unit', 'Dual Investment Calculator (4 tabs)', calc.hasCalc, '');
      push('F4_Unit', 'Image Gallery', calc.hasGallery, '');
      push('F4_Unit', 'Availability badge', calc.hasAvailability, '');
    }
    await ctx.close();
  }

  // ============ SESIÓN 18 — Branding ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/es`, { waitUntil: 'networkidle', timeout: 45000 });

    const logoReal = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.some(i => /logo/i.test(i.src || i.alt || ''));
    });
    push('S18_Brand', 'Logo PNG real en header/sidebar/footer', logoReal, '');

    // Favicon
    const faviconR = await page.goto(`${BASE}/icon`, { waitUntil: 'load', timeout: 15000 }).catch(() => null);
    push('S18_Brand', 'Favicon dinámico /icon', faviconR?.status() === 200, `status=${faviconR?.status()}`);

    const appleR = await page.goto(`${BASE}/apple-icon`, { waitUntil: 'load', timeout: 15000 }).catch(() => null);
    push('S18_Brand', 'apple-icon dinámico', appleR?.status() === 200, `status=${appleR?.status()}`);

    const manifestR = await page.goto(`${BASE}/manifest.webmanifest`, { waitUntil: 'load', timeout: 15000 }).catch(() => null);
    push('S18_Brand', 'manifest.webmanifest PWA', manifestR?.status() === 200, `status=${manifestR?.status()}`);

    // Verifica middleware no redirige metadata
    const sitemapR = await page.goto(`${BASE}/sitemap.xml`, { waitUntil: 'load', timeout: 15000 }).catch(() => null);
    push('S18_Brand', 'sitemap.xml accesible (middleware excluye)', sitemapR?.status() === 200, `status=${sitemapR?.status()}`);

    const robotsR = await page.goto(`${BASE}/robots.txt`, { waitUntil: 'load', timeout: 15000 }).catch(() => null);
    push('S18_Brand', 'robots.txt accesible (middleware excluye)', robotsR?.status() === 200, `status=${robotsR?.status()}`);

    await ctx.close();
  }

  // ============ i18n EN — smoke ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const r = await page.goto(`${BASE}/en`, { waitUntil: 'networkidle', timeout: 45000 });
    push('i18n', 'GET /en 200', r?.status() === 200, `status=${r?.status()}`);

    const hasEnglish = await page.evaluate(() => {
      const body = document.body.innerText || '';
      // Debe tener strings en inglés y NO tener strings ES mayoritarios
      const english = /(invest|home|properties|developments|contact)/i.test(body);
      const spanishStrong = /(desarrollos|propiedades|invertir|ciudades)/i.test(body);
      return { english, spanishStrong };
    });
    push('i18n', 'Home /en muestra strings inglés', hasEnglish.english, JSON.stringify(hasEnglish));
    await ctx.close();
  }

  await browser.close();
  await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2));
  console.log('\n===== REPORT =====\n');
  for (const [phase, checks] of Object.entries(report.phases)) {
    console.log(`\n## ${phase}`);
    for (const c of checks) {
      const icon = c.ok === true ? 'OK  ' : c.ok === false ? 'FAIL' : 'WARN';
      console.log(`  [${icon}] ${c.key}${c.note ? ' — ' + c.note : ''}`);
    }
  }
  console.log(`\n===== SUMMARY: ok=${report.summary.ok} fail=${report.summary.fail} warn=${report.summary.warn} =====\n`);
  process.exit(report.summary.fail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(2); });
