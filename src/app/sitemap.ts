import type { MetadataRoute } from 'next';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { TYPE_SLUGS } from '@/app/[locale]/desarrollos/_components/typeConfig';
import { STAGE_SLUGS_URL } from '@/app/[locale]/desarrollos/_components/stageConfig';
import { shouldNoIndex } from '@/lib/seo/noindex';
import { MARKET_SUBMARKET_TO_ZONE } from '@/lib/calculator';
import { zoneSlug } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://propyte.com';
const LOCALES = ['es', 'en'];
const CITIES = ['cancun', 'playa-del-carmen', 'tulum', 'merida'];

// Fecha estable de build para páginas estáticas — `new Date()` en cada
// invocación del sitemap hace que lastmod sea siempre "ahora" y por tanto
// no aporta señal real a los crawlers. Se fija al build/deploy en vez de
// recalcularse en cada request (route es dynamic pero el contenido de estas
// páginas no cambia por request).
const STATIC_LASTMOD = new Date('2026-07-01T00:00:00.000Z');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Staging: sitemap vacío. Evita que Google descubra URLs nuevas y
  // refuerza la señal de desindexación junto con noindex meta/header.
  if (shouldNoIndex()) return [];

  const entries: MetadataRoute.Sitemap = [];

  // ── Static pages ──────────────────────────────
  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/propiedades', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/desarrollos', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/exclusivos', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/destacados', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/blog', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/desarrolladores', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/brokers', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/proveedores', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/built', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/nosotros/quienes-somos', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/nosotros/estructura', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/nosotros/equipo-comercial', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/metodologia', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/como-comprar', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/como-invertir', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/financiamiento', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/promociones', priority: 0.75, changeFrequency: 'weekly' as const },
    { path: '/faq', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/glosario', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/unete', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/aviso-legal-inversion', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/contacto', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/mercado', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/rentas', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/zonas', priority: 0.85, changeFrequency: 'weekly' as const },
  ];

  for (const page of staticPages) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: STATIC_LASTMOD,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }

  // ── City pages ────────────────────────────────
  for (const city of CITIES) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}/desarrollos/${city}`,
        lastModified: STATIC_LASTMOD,
        changeFrequency: 'daily',
        priority: 0.85,
      });
    }
  }

  // ── Type taxonomy pages (/desarrollos/tipo/{type}) ───
  for (const type of TYPE_SLUGS) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}/desarrollos/tipo/${type}`,
        lastModified: STATIC_LASTMOD,
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }
  }

  // ── Stage taxonomy pages (/desarrollos/etapa/{stage}) ─
  for (const stage of STAGE_SLUGS_URL) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}/desarrollos/etapa/${stage}`,
        lastModified: STATIC_LASTMOD,
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }
  }

  // ── Zone pages ──────────────────────────────
  // Misma fuente canónica que zonas/[slug]/page.tsx (UNIQUE_ZONES): deriva los
  // slugs de MARKET_SUBMARKET_TO_ZONE en vez de duplicar un array literal que
  // se desincroniza (ese literal solo cubría Cancún y omitía Playa del Carmen,
  // Tulum, CDMX y Mérida).
  const zoneSlugsSet = new Set(Object.values(MARKET_SUBMARKET_TO_ZONE).map(zoneSlug));
  for (const slug of zoneSlugsSet) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}/zonas/${slug}`,
        lastModified: STATIC_LASTMOD,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  // ── Dynamic development pages ────────
  try {
    const supabase = await createServiceRoleClient() || await createServerSupabaseClient();
    const { data: developments } = await supabase
      .from('developments')
      .select('slug, updated_at')
      .eq('published', true)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(5000);

    if (developments) {
      for (const dev of developments) {
        for (const locale of LOCALES) {
          entries.push({
            url: `${BASE_URL}/${locale}/desarrollos/${dev.slug}`,
            lastModified: new Date(dev.updated_at),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }
    }
  } catch {
    // Supabase not connected — skip dynamic entries
  }

  // ── Dynamic blog posts ────────────────────────
  try {
    const supabase2 = await createServiceRoleClient() || await createServerSupabaseClient();
    const { data: blogPosts } = await supabase2
      .from('blog_posts')
      .select('slug, locale, updated_at')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .limit(1000);

    if (blogPosts) {
      for (const post of blogPosts as { slug: string; locale: string; updated_at: string }[]) {
        entries.push({
          url: `${BASE_URL}/${post.locale}/blog/${post.slug}`,
          lastModified: new Date(post.updated_at),
          changeFrequency: 'monthly',
          priority: 0.7,
        });
      }
    }
  } catch {
    // blog_posts table may not exist yet — skip
  }

  return entries;
}
