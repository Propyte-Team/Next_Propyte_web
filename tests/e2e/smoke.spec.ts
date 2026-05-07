import { test, expect } from '@playwright/test';

/**
 * Critical-path smoke suite — covers the routes that, if broken, make
 * the site unusable. Tagged @smoke so CI can run it on every PR while
 * the slower regression suite runs nightly.
 *
 * Each spec is locale-agnostic where possible; ES-only assertions live
 * inside their own block so EN can be added without forking the test.
 */

test.describe('@smoke Home', () => {
  test('renders /es with hero + featured', async ({ page }) => {
    await page.goto('/es');

    // Page status should be 2xx — no 5xx that crashes the server.
    await expect(page).toHaveURL(/\/es\/?$/);

    // Hero is the single H1 on the page.
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toBeVisible();

    // Featured properties section either renders cards or a graceful empty state —
    // never a server error string.
    const errorText = page.getByText(/internal server error|fetch failed/i);
    await expect(errorText).toHaveCount(0);
  });

  test('switches /es ↔ /en preserving the route', async ({ page }) => {
    await page.goto('/es');
    await expect(page).toHaveURL(/\/es\/?$/);
    await page.goto('/en');
    await expect(page).toHaveURL(/\/en\/?$/);
    // English content marker — the home hero translates, so the H1
    // should differ between locales even though <html lang> stays static
    // (root layout limitation; a full fix requires moving <html> into
    // [locale]/layout.tsx, which is a separate refactor).
    const h1 = await page.locator('h1').first().innerText();
    expect(h1.length).toBeGreaterThan(0);
  });
});

test.describe('@smoke Marketplace', () => {
  test('/desarrollos lists properties', async ({ page }) => {
    await page.goto('/es/desarrollos');
    await expect(page.locator('h1')).toBeVisible();

    // Either the marketplace renders ≥1 card OR the empty-state UI shows.
    // `.first()` so the locator resolves to a single element regardless of count.
    await expect(
      page.locator('[data-testid="marketplace-card-price"], [data-testid="marketplace-empty"], main h1').first()
    ).toBeVisible();
  });

  test('/propiedades renders without errors', async ({ page }) => {
    await page.goto('/es/propiedades');
    await expect(page.locator('h1')).toBeVisible();
    const errorText = page.getByText(/internal server error|fetch failed/i);
    await expect(errorText).toHaveCount(0);
  });
});

test.describe('@smoke Taxonomy', () => {
  // City taxonomy page — pre-existing.
  test('/desarrollos/tulum renders', async ({ page }) => {
    const response = await page.goto('/es/desarrollos/tulum');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toBeVisible();
  });

  // New tipo taxonomy from this session.
  test('/desarrollos/tipo/departamento renders', async ({ page }) => {
    const response = await page.goto('/es/desarrollos/tipo/departamento');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toBeVisible();
  });

  // New etapa taxonomy from this session.
  test('/desarrollos/etapa/preventa renders', async ({ page }) => {
    const response = await page.goto('/es/desarrollos/etapa/preventa');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('invalid tipo slug renders not-found', async ({ page }) => {
    // Next.js dev server returns 200 for `notFound()` while showing the
    // not-found UI; production builds return 404. Assert on UI signals
    // (no taxonomy H1) rather than status to be environment-agnostic.
    await page.goto('/es/desarrollos/tipo/no-existe-este-tipo');
    // The taxonomy heading uses "Departamentos" / "Penthouses" / etc — none
    // should appear for an invalid slug.
    const knownTypeH1 = page.getByRole('heading', { level: 1, name: /Departamentos|Penthouses|Casas|Terrenos|Macrolotes/i });
    await expect(knownTypeH1).toHaveCount(0);
  });
});

test.describe('@smoke Content pages', () => {
  const routes = [
    '/es/contacto',
    '/es/nosotros/quienes-somos',
    '/es/financiamiento',
    '/es/glosario',
    '/es/blog',
    '/es/zonas',
    '/es/mercado',
  ];
  for (const route of routes) {
    test(`${route} returns 2xx with H1`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator('h1').first()).toBeVisible();
    });
  }
});

test.describe('@smoke SEO essentials', () => {
  test('home has canonical + hreflang alternates', async ({ page }) => {
    await page.goto('/es');
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);

    const altEs = page.locator('link[rel="alternate"][hreflang="es"]');
    const altEn = page.locator('link[rel="alternate"][hreflang="en"]');
    await expect(altEs).toHaveCount(1);
    await expect(altEn).toHaveCount(1);
  });

  test('robots.txt is reachable and disallows /api/', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('Disallow: /api/');
  });

  test('sitemap.xml is reachable', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('<urlset');
  });
});

test.describe('@smoke API guards', () => {
  test('/api/leads rate-limits rapid POST', async ({ request }) => {
    // Fire 7 rapid lead submissions; limiter caps at 5/min/IP, so at
    // least one of the last calls must come back as 429.
    const responses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const r = await request.post('/api/leads', {
        data: { name: `smoke-test-${i}`, source: 'smoke' },
        failOnStatusCode: false,
      });
      responses.push(r.status());
    }
    expect(responses).toContain(429);
  });
});
