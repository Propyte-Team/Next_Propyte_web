import { test, expect } from '@playwright/test';

// El contenido depende de datos de prod (miembros con bio_long). Estos tests
// son tolerantes: si no hay ningún botón "Ver perfil"/tarjeta clickable,
// se omiten en lugar de fallar (entorno sin datos de bio).

test.describe('TeamBioModal — equipo comercial', () => {
  test('abre y cierra el pop-up de biografía', async ({ page }) => {
    await page.goto('/es/nosotros/equipo-comercial', { waitUntil: 'domcontentloaded' });
    const trigger = page.getByRole('button', { name: 'Ver perfil' }).first();
    const count = await trigger.count();
    test.skip(count === 0, 'No hay miembros con bio_long en este entorno');

    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('cierra con click en backdrop', async ({ page }) => {
    await page.goto('/es/nosotros/equipo-comercial', { waitUntil: 'domcontentloaded' });
    const trigger = page.getByRole('button', { name: 'Ver perfil' }).first();
    test.skip((await trigger.count()) === 0, 'Sin datos de bio');
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(dialog).toBeHidden();
  });
});

test.describe('TeamBioModal — estructura (líderes)', () => {
  test('las tarjetas de líderes con bio abren el pop-up', async ({ page }) => {
    await page.goto('/es/nosotros/estructura', { waitUntil: 'domcontentloaded' });
    const leaderBtn = page.locator('button:has-text("CEO")').first();
    test.skip((await leaderBtn.count()) === 0, 'Sin CEO clickable (sin bio)');
    await leaderBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});

test.describe('TeamBioModal — EN locale', () => {
  test('la versión en inglés usa el botón "View profile"', async ({ page }) => {
    await page.goto('/en/nosotros/equipo-comercial', { waitUntil: 'domcontentloaded' });
    const trigger = page.getByRole('button', { name: 'View profile' }).first();
    test.skip((await trigger.count()) === 0, 'Sin datos de bio');
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
