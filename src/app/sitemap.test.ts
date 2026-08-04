import { describe, it, expect, vi } from 'vitest';

// El sitemap consulta Supabase para desarrollos y posts; aquí solo interesan las
// URLs estáticas, así que los clientes se anulan y el try/catch del propio
// sitemap absorbe la ausencia de datos dinámicos.
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => null),
  createServiceRoleClient: vi.fn(async () => null),
}));
vi.mock('@/lib/seo/noindex', () => ({ shouldNoIndex: () => false }));

describe('sitemap', () => {
  it('incluye los dos hubs de pilar en los dos locales', async () => {
    const { default: sitemap } = await import('./sitemap');
    const urls = (await sitemap()).map((e) => e.url);

    for (const path of ['/guias/fiscal-legal', '/guias/costa']) {
      for (const locale of ['es', 'en']) {
        expect(urls.some((u) => u.endsWith(`/${locale}${path}`))).toBe(true);
      }
    }
  });

  it('no duplica ninguna URL', async () => {
    const { default: sitemap } = await import('./sitemap');
    const urls = (await sitemap()).map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('todo hub declarado en el catálogo de pilares está en el sitemap', async () => {
    // Cierra el bloqueo #7 de raíz: si mañana se añade un pilar con hub nuevo al
    // catálogo y nadie toca sitemap.ts, este test cae en vez de dejar la página
    // fuera del índice en silencio.
    const [{ default: sitemap }, { PILARES }] = await Promise.all([
      import('./sitemap'),
      import('@/lib/blog/pilares'),
    ]);
    const urls = (await sitemap()).map((e) => e.url);

    for (const pilar of PILARES) {
      for (const hub of pilar.hubs) {
        expect(
          urls.some((u) => u.endsWith(`/es${hub}`)),
          `${pilar.code} declara el hub ${hub} y no está en el sitemap`
        ).toBe(true);
      }
    }
  });
});
