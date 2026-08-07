import { describe, it, expect, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

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

describe('sitemap y compuerta de visibilidad', () => {
  it('omite las páginas que el Hub marca como no visibles', async () => {
    vi.resetModules();
    vi.doMock('@/lib/visibility', async () => {
      const real = await vi.importActual<typeof import('@/lib/visibility')>('@/lib/visibility');
      return { ...real, getVisibility: async () => ({ 'page.built': false }) };
    });

    const { default: sitemap } = await import('./sitemap');
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls.some((u) => u.endsWith('/es/built'))).toBe(false);
    expect(urls.some((u) => u.endsWith('/en/built'))).toBe(false);
    // Una página sin gate no se ve afectada.
    expect(urls.some((u) => u.endsWith('/es/propiedades'))).toBe(true);
  });

  it('sale completo cuando el Hub no responde (fail-open)', async () => {
    vi.resetModules();
    vi.doMock('@/lib/visibility', async () => {
      const real = await vi.importActual<typeof import('@/lib/visibility')>('@/lib/visibility');
      return { ...real, getVisibility: async () => ({}) };
    });

    const { default: sitemap } = await import('./sitemap');
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls.some((u) => u.endsWith('/es/built'))).toBe(true);
  });

  it('toda página con assertPageVisible declara su visibilityKey en el sitemap', () => {
    // Guardarraíl: si mañana alguien gatea una página nueva y no la declara aquí,
    // el sitemap volvería a anunciar una URL que el sitio 404ea. Este test cae
    // antes de que eso llegue a producción.
    const APP = path.resolve(__dirname, '[locale]');
    const src = readFileSync(path.resolve(__dirname, 'sitemap.ts'), 'utf8');

    const gated: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) { walk(full); continue; }
        if (entry !== 'page.tsx') continue;
        const body = readFileSync(full, 'utf8');
        const m = body.match(/assertPageVisible\(\s*VISIBILITY_KEYS\.(\w+)/);
        if (!m) continue;
        const route = '/' + path.relative(APP, path.dirname(full)).split(path.sep).join('/');
        gated.push(route === '/' ? '' : route);
      }
    };
    walk(APP);

    const missing = gated.filter((route) => {
      const declared = new RegExp(`path:\\s*'${route}'[^}]*visibilityKey`).test(src);
      const present = new RegExp(`path:\\s*'${route}'`).test(src);
      return present && !declared;
    });

    expect(missing, `Estas rutas tienen gate pero no declaran visibilityKey en sitemap.ts: ${missing.join(', ')}`).toEqual([]);
  });
});
