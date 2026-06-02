/**
 * Audit script — verifica que los items del PDF "NOTAS ICONOS" + image proxy
 * estén resueltos en dev.propyte.com. Reporta en consola pass/fail por item.
 *
 * Uso: node tests/audit-pdf-items.mjs
 */
import { chromium } from '@playwright/test';

const BASE = process.env.AUDIT_BASE || 'https://dev.propyte.com';
const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.log(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ locale: 'es-MX', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // ── 1. Image proxy /propyte-media en /desarrollos ──────────────────
  try {
    await page.goto(`${BASE}/es/desarrollos`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const imgSrcs = await page.$$eval('img', (imgs) => imgs.map((i) => i.currentSrc || i.src).filter(Boolean));
    const supabaseLeaks = imgSrcs.filter((u) => /supabase\.co/i.test(u));
    const proxied = imgSrcs.filter((u) => /\/propyte-media\//.test(u));
    if (supabaseLeaks.length === 0 && proxied.length > 0) {
      pass('Image proxy /propyte-media', `${proxied.length} URLs via proxy, 0 leaks Supabase`);
    } else if (supabaseLeaks.length > 0) {
      fail('Image proxy /propyte-media', `${supabaseLeaks.length} URLs exponen supabase.co (ej: ${supabaseLeaks[0].slice(0, 100)})`);
    } else {
      fail('Image proxy /propyte-media', `0 URLs via proxy, 0 leaks — verificar si hay imágenes en la página`);
    }
  } catch (e) {
    fail('Image proxy /propyte-media', `error navegación: ${e.message}`);
  }

  // ── 2. Burbuja search en /desarrollos (debería estar removida) ─────
  try {
    const searchBubble = await page.locator('text=/Ciudad, zona o desarrollo/i').count();
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="Ciudad"], input[placeholder*="desarrollo"]').count();
    if (searchBubble === 0 && searchInputs === 0) {
      pass('Burbuja search removida en /desarrollos', '0 inputs search visibles');
    } else {
      fail('Burbuja search removida en /desarrollos', `${searchBubble} textos + ${searchInputs} inputs encontrados`);
    }
  } catch (e) {
    fail('Burbuja search', `error: ${e.message}`);
  }

  // ── 3. Burbuja search en /propiedades ──────────────────────────────
  try {
    await page.goto(`${BASE}/es/propiedades`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    const searchBubble = await page.locator('text=/Ciudad, zona o desarrollo/i').count();
    const searchInputs = await page.locator('input[placeholder*="Ciudad"], input[placeholder*="desarrollo"]').count();
    if (searchBubble === 0 && searchInputs === 0) {
      pass('Burbuja search removida en /propiedades', '0 inputs search visibles');
    } else {
      fail('Burbuja search removida en /propiedades', `${searchBubble} textos + ${searchInputs} inputs`);
    }
  } catch (e) {
    fail('Burbuja search /propiedades', `error: ${e.message}`);
  }

  // ── 4. WhatsApp button color (esperado: brand cyan #A2F9FF) ────────
  try {
    await page.goto(`${BASE}/es`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    const wa = page.locator('a[href*="wa.me"], a[href*="whatsapp"], button:has-text("WhatsApp")').first();
    const count = await page.locator('a[href*="wa.me"], a[href*="whatsapp"]').count();
    if (count === 0) {
      fail('WhatsApp button color', 'no se encontró ningún botón WhatsApp en /es');
    } else {
      const bg = await wa.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return { bg: cs.backgroundColor, color: cs.color };
      });
      // brand cyan #A2F9FF → rgb(162, 249, 255). WhatsApp green clásico: rgb(37, 211, 102)
      const isBrandCyan = /162,\s*249,\s*255/.test(bg.bg) || /a2f9ff/i.test(bg.bg);
      const isWhatsappGreen = /37,\s*211,\s*102/.test(bg.bg) || /25d366/i.test(bg.bg);
      if (isBrandCyan) {
        pass('WhatsApp button brand cyan', `bg=${bg.bg}`);
      } else if (isWhatsappGreen) {
        fail('WhatsApp button brand cyan', `aún en verde whatsapp clásico bg=${bg.bg}`);
      } else {
        fail('WhatsApp button brand cyan', `bg desconocido=${bg.bg} (esperado rgb(162,249,255))`);
      }
    }
  } catch (e) {
    fail('WhatsApp color', `error: ${e.message}`);
  }

  // ── 5. Titulares editoriales — color de acento separado ────────────
  // Caso del PDF: "PREGUNTAS FRECUENTES" en home FAQ debería tener una palabra
  // en otro color (acento). Buscamos un span de color distinto dentro del h2.
  try {
    const faqH2 = page.locator('section').filter({ hasText: /PREGUNTAS FRECUENTES|FAQ/i }).locator('h2').first();
    const exists = await faqH2.count();
    if (exists === 0) {
      fail('Titulares editoriales acento', 'no se encontró H2 de FAQs en home');
    } else {
      const colors = await faqH2.evaluate((h) => {
        const all = h.querySelectorAll('span, em, strong');
        const parentColor = window.getComputedStyle(h).color;
        const childColors = Array.from(all).map((c) => window.getComputedStyle(c).color);
        return { parentColor, childColors, hasDifferent: childColors.some((c) => c !== parentColor) };
      });
      if (colors.hasDifferent) {
        pass('Titulares editoriales con acento', `parent=${colors.parentColor} hijos=[${colors.childColors.join(', ')}]`);
      } else {
        fail('Titulares editoriales con acento', `todo el H2 en color uniforme ${colors.parentColor}`);
      }
    }
  } catch (e) {
    fail('Titulares editoriales', `error: ${e.message}`);
  }

  // ── 6. Logo Propyte contraste en infografía ProcessInfographic ─────
  // En /es busca section de "Sin Propyte / Con Propyte" — verifica imagen
  // logo renderice con dimensiones > 0.
  try {
    const sinConSection = page.locator('text=/Sin Propyte|Con Propyte/i').first();
    const exists = await sinConSection.count();
    if (exists === 0) {
      fail('Logo Propyte infografía', 'sección "Sin/Con Propyte" no encontrada en home');
    } else {
      await sinConSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const logoBox = await page.locator('img[alt*="Propyte" i], img[src*="logo" i]').first().boundingBox();
      if (logoBox && logoBox.width > 0 && logoBox.height > 0) {
        pass('Logo Propyte infografía visible', `${logoBox.width}x${logoBox.height}`);
      } else {
        fail('Logo Propyte infografía visible', 'sin bounding box / logo invisible');
      }
    }
  } catch (e) {
    fail('Logo Propyte infografía', `error: ${e.message}`);
  }

  // ── 7. Brochure icon en ficha de desarrollo ────────────────────────
  try {
    const devsLinks = await page.locator('a[href*="/desarrollos/"]').first();
    // navega a uno
    await page.goto(`${BASE}/es/desarrollos/nativa-tulum-5c171e`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    const fichaBtn = page.locator('button:has-text("Ficha"), a:has-text("Ficha")').first();
    const exists = await fichaBtn.count();
    if (exists === 0) {
      fail('Brochure/Ficha button visible', 'no se encontró button "Ficha"');
    } else {
      const box = await fichaBtn.boundingBox();
      const fichaBtnColor = await fichaBtn.evaluate((el) => window.getComputedStyle(el).color);
      // verificar que tiene un svg adentro
      const svgCount = await fichaBtn.locator('svg').count();
      if (box && box.width > 0 && svgCount > 0) {
        pass('Brochure icon visible en Ficha', `svg=${svgCount} box=${box.width}x${box.height} color=${fichaBtnColor}`);
      } else {
        fail('Brochure icon visible en Ficha', `svg=${svgCount} box=${box ? box.width + 'x' + box.height : 'null'}`);
      }
    }
  } catch (e) {
    fail('Brochure icon', `error: ${e.message}`);
  }

  // ── 8. Cards Home — título 2 líneas no truncado (mi cambio de hoy) ─
  try {
    await page.goto(`${BASE}/es`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    const featuredSection = page.locator('section').filter({ has: page.locator('a[href*="/desarrollos/"]') }).first();
    const cards = featuredSection.locator('a[href*="/desarrollos/"]');
    const cardCount = await cards.count();
    if (cardCount === 0) {
      fail('Cards home título', '0 cards en FeaturedProperties');
    } else {
      const titles = await cards.locator('h3').evaluateAll((els) =>
        els.map((h) => {
          const cs = window.getComputedStyle(h);
          return {
            text: h.textContent?.trim() || '',
            fontSize: cs.fontSize,
            lineClamp: cs.webkitLineClamp || cs.getPropertyValue('-webkit-line-clamp'),
            scrollH: h.scrollHeight,
            clientH: h.clientHeight,
            truncated: h.scrollHeight > h.clientHeight + 2,
          };
        })
      );
      const truncated = titles.filter((t) => t.truncated);
      if (truncated.length === 0) {
        pass('Cards home título no truncado', `${titles.length} titles, fontSize=${titles[0]?.fontSize}, lineClamp=${titles[0]?.lineClamp}`);
      } else {
        fail('Cards home título no truncado', `${truncated.length}/${titles.length} truncados (ej: "${truncated[0].text}")`);
      }
    }
  } catch (e) {
    fail('Cards home título', `error: ${e.message}`);
  }

  // ── 9. "(Original)" removido del precio ────────────────────────────
  try {
    const body = await page.locator('body').textContent();
    if (body && /\(original\)/i.test(body)) {
      fail('(Original) removido', `aún aparece "(Original)" en el body de home`);
    } else {
      pass('(Original) removido', 'no detectado en home');
    }
    // Verificar también en detalle
    await page.goto(`${BASE}/es/desarrollos/nativa-tulum-5c171e`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const body2 = await page.locator('body').textContent();
    if (body2 && /\(original\)/i.test(body2)) {
      fail('(Original) removido en detalle', `aún aparece en ficha desarrollo`);
    } else {
      pass('(Original) removido en detalle', 'no detectado en ficha');
    }
  } catch (e) {
    fail('(Original) check', `error: ${e.message}`);
  }

  // ── 10. "Desde" arriba del precio (block, no inline) ───────────────
  try {
    const desdeLabel = page.locator('text=/^Desde$/i').first();
    const exists = await desdeLabel.count();
    if (exists === 0) {
      fail('Desde label block', 'no se encontró label "Desde"');
    } else {
      const layout = await desdeLabel.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return { display: cs.display, textTransform: cs.textTransform };
      });
      const isBlock = layout.display === 'block' || layout.display === 'flex';
      if (isBlock) {
        pass('Desde label arriba (block)', `display=${layout.display} textTransform=${layout.textTransform}`);
      } else {
        fail('Desde label arriba (block)', `display=${layout.display} — sigue inline`);
      }
    }
  } catch (e) {
    fail('Desde label', `error: ${e.message}`);
  }

  await browser.close();

  // Resumen final
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n──────────────────────────────────────────`);
  console.log(`Resumen: ${passed} PASS · ${failed} FAIL · ${results.length} total`);
  console.log(`──────────────────────────────────────────`);
  if (failed > 0) {
    console.log(`\nFAILS:`);
    results.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.name}: ${r.detail}`));
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Audit script error:', e);
  process.exit(2);
});
