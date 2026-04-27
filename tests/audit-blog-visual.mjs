/**
 * Playwright visual audit — Blog pages (commit 67978c4)
 * Tests: /es/blog default, /es/blog?categoria=Para Asesores, /es/blog?categoria=Para Inversionistas
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://dev.propyte.com';
const SCREENSHOT_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'blog-audit');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = [];

async function check(label, condition, detail = '') {
  const pass = !!condition;
  results.push({ label, pass, detail });
  console.log(`${pass ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // ── BLOG DEFAULT VIEW ──────────────────────────────────────────────────────
  console.log('\n=== /es/blog (default) ===');
  await page.goto(`${BASE_URL}/es/blog`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-blog-default.png'), fullPage: true });

  // Hero section exists with dark background
  const hero = page.locator('section.bg-\\[\\#0F1923\\]').first();
  await check('Hero exists with bg-[#0F1923]', await hero.count() > 0);

  // Badge "Propyte Blog"
  const badge = page.getByText('Propyte Blog');
  await check('Badge "Propyte Blog" present', await badge.count() > 0);

  // H1 bicolor
  const h1 = page.locator('h1');
  await check('H1 present', await h1.count() > 0, await h1.innerText().catch(() => '(no h1)'));

  // CTAs in hero
  const ctaAsesores = page.getByRole('link', { name: 'Para Asesores' }).first();
  const ctaInversionistas = page.getByRole('link', { name: 'Para Inversionistas' }).first();
  await check('CTA "Para Asesores" present', await ctaAsesores.count() > 0);
  await check('CTA "Para Inversionistas" present', await ctaInversionistas.count() > 0);

  // CTA "Para Asesores" inactive should NOT have full opacity (should be /80)
  const asesorBtnClass = await ctaAsesores.getAttribute('class');
  await check('CTA Asesores inactive has bg-[#5CE0D2]/80', asesorBtnClass?.includes('5CE0D2]/80'), asesorBtnClass || '(no class)');

  // White content section below hero
  const whiteSection = page.locator('section.bg-white').first();
  await check('White content section present below hero', await whiteSection.count() > 0);

  // Two-column grid
  const twoColGrid = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2').first();
  await check('Two-column grid (Asesores/Inversionistas) present', await twoColGrid.count() > 0);

  // Column headers
  const colAsesores = page.getByText('Para Asesores').nth(1); // nth(0) is the CTA
  const colInv = page.getByText('Para Inversionistas').nth(1);
  await check('Column "Para Asesores" header present', await colAsesores.count() > 0);
  await check('Column "Para Inversionistas" header present', await colInv.count() > 0);

  // Subtitle key (colAsesoresSubtitle) — should contain "Técnicas"
  const subtitle = page.getByText('Técnicas, herramientas y estrategias');
  await check('colAsesoresSubtitle renders correctly (typo fixed)', await subtitle.count() > 0);

  // No dark background bleed in content area (check body bg or section bg)
  const darkSectionCount = await page.locator('section.bg-\\[\\#0F1923\\]').count();
  await check('Only 1 dark section (hero only, no bleed)', darkSectionCount === 1, `found ${darkSectionCount}`);

  // ── BLOG CATEGORY VIEW: Para Asesores ─────────────────────────────────────
  console.log('\n=== /es/blog?categoria=Para%20Asesores ===');
  await page.goto(`${BASE_URL}/es/blog?categoria=Para%20Asesores`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-blog-cat-asesores.png'), fullPage: true });

  // Hero still present
  const heroInCat = page.locator('section.bg-\\[\\#0F1923\\]').first();
  await check('[Cat] Hero present', await heroInCat.count() > 0);

  // CTA "Para Asesores" should be ACTIVE — has ring-2 ring-white/30
  const activeCta = page.getByRole('link', { name: 'Para Asesores' }).first();
  const activeCtaClass = await activeCta.getAttribute('class');
  await check('[Cat] Asesores CTA active — has ring-2', activeCtaClass?.includes('ring-2'), activeCtaClass || '(no class)');

  // CRITICAL: white bg-white section wrapping the grid
  const whiteSectionCat = page.locator('section.bg-white').first();
  await check('[Cat] bg-white section wraps grid (Fix #1)', await whiteSectionCat.count() > 0);

  // Breadcrumb visible and not on dark background
  const breadcrumbLink = page.getByRole('link', { name: 'Blog' }).first();
  await check('[Cat] Breadcrumb "Blog" link visible', await breadcrumbLink.count() > 0);

  // Check breadcrumb color is not invisible (text-gray-400 should be readable on white bg)
  const breadcrumbColor = await breadcrumbLink.evaluate((el) => getComputedStyle(el).color);
  await check('[Cat] Breadcrumb has readable color on white bg', !breadcrumbColor.includes('255, 255, 255'), breadcrumbColor);

  // Check page doesn't have dark text on dark background (bg-white section exists)
  const paginationOrGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2').first();
  // This is either empty state or grid of posts
  const emptyState = page.getByText(/próximamente|no posts|coming soon/i);
  const hasContentOrEmpty = (await paginationOrGrid.count() > 0) || (await emptyState.count() > 0);
  await check('[Cat] Grid or empty state renders', hasContentOrEmpty);

  // ── BLOG CATEGORY VIEW: Para Inversionistas ───────────────────────────────
  console.log('\n=== /es/blog?categoria=Para%20Inversionistas ===');
  await page.goto(`${BASE_URL}/es/blog?categoria=Para%20Inversionistas`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-blog-cat-inversionistas.png'), fullPage: true });

  // CTA "Para Inversionistas" active — has bg-[#5CE0D2] text-[#0F1923]
  const invCta = page.getByRole('link', { name: 'Para Inversionistas' }).first();
  const invCtaClass = await invCta.getAttribute('class');
  await check('[Inv] Inversionistas CTA active', invCtaClass?.includes('5CE0D2] text') || invCtaClass?.includes('5CE0D2] text-\\['), invCtaClass || '(no class)');

  // bg-white section also present in inversionistas category view
  const whiteSectionInv = page.locator('section.bg-white').first();
  await check('[Inv] bg-white section wraps grid (Fix #1 parity)', await whiteSectionInv.count() > 0);

  // ── MOBILE CHECK (375px) ──────────────────────────────────────────────────
  console.log('\n=== Mobile 375px — /es/blog ===');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE_URL}/es/blog`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-blog-mobile.png'), fullPage: true });

  const mobileCta = page.getByRole('link', { name: 'Para Asesores' }).first();
  await check('[Mobile] CTAs render on 375px', await mobileCta.count() > 0);

  await browser.close();

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`RESULTADO: ${passed} passed | ${failed} failed`);
  if (failed > 0) {
    console.log('\nFAILS:');
    results.filter(r => !r.pass).forEach(r => console.log(`  ❌ ${r.label}: ${r.detail}`));
  }

  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'results.json'),
    JSON.stringify({ passed, failed, results }, null, 2)
  );

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
