#!/usr/bin/env node
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await ctx.newPage();

  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text().slice(0, 150)); });

  await page.goto('https://dev.propyte.com/es/desarrollos/sample-azul-vivo-5a4e4a4e', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a[role="button"]'));
    const share = btns.find(b => /share|compartir/i.test((b.getAttribute('aria-label') || '')));
    share?.click();
  });
  await page.waitForTimeout(500);

  // Screenshot modal ABIERTO antes de click copy
  await page.screenshot({ path: 'tests/qa-phase4/screenshots-2b/inspect-modal-open.png' });

  const modalBtns = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    if (!d) return [];
    return Array.from(d.querySelectorAll('button, a')).map(b => ({
      tag: b.tagName,
      text: (b.textContent || '').trim().slice(0, 40),
      aria: b.getAttribute('aria-label'),
    }));
  });
  console.log('MODAL BUTTONS:', JSON.stringify(modalBtns, null, 2));

  // Click copy link
  await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    const btns = Array.from(d?.querySelectorAll('button, a') || []);
    const cp = btns.find(b => /copiar|copy/i.test(b.textContent || ''));
    if (cp) {
      console.log('Clicking copy button:', cp.textContent);
      cp.click();
    } else {
      console.log('NO COPY BUTTON FOUND');
    }
  });

  // Sample over 3s
  for (let t = 100; t <= 3000; t += 300) {
    await page.waitForTimeout(300);
    const state = await page.evaluate(() => {
      const body = document.body.textContent || '';
      const hasCop = /copiado|copied/i.test(body);
      const dialog = document.querySelector('[role="dialog"]');
      const buttons = Array.from(dialog?.querySelectorAll('button, a') || []).map(b => (b.textContent || '').trim().slice(0, 30));
      const clip = navigator.clipboard ? 'api-present' : 'no-api';
      return { t: performance.now(), hasCop, buttons, clip };
    });
    console.log(`t+${t}ms:`, state.hasCop ? 'TOAST_VISIBLE' : 'no-toast', '| buttons:', state.buttons.join(' || '));
    if (state.hasCop) break;
  }

  // Check clipboard content
  try {
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    console.log('CLIPBOARD:', clip);
  } catch (e) { console.log('CLIP READ FAIL:', e.message.slice(0, 80)); }

  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
