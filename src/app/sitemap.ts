import type { MetadataRoute } from 'next';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { TYPE_SLUGS } from '@/app/[locale]/desarrollos/_components/typeConfig';
import { STAGE_SLUGS_URL } from '@/app/[locale]/desarrollos/_components/stageConfig';
import { shouldNoIndex } from '@/lib/seo/noindex';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://propyte.com';
const LOCALES = ['es', 'en'];
const CITIES = ['cancun', 'playa-del-carmen', 'tulum', 'merida'];

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
    { path: '/blog', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/desarrolladores', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/brokers', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/built', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/nosotros/quienes-somos', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/nosotros/estructura', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/nosotros/equipo-comercial', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/metodologia', priority: 0.8, changeFrequency: 'monthly' as const },
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
        lastModified: new Date(),
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
        lastModified: new Date(),
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
        lastModified: new Date(),
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
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }
  }

  // ── Zone pages ──────────────────────────────
  const zoneSlugs = [
    'zona-hotelera', 'puerto-cancun', 'centro', 'supermanzana-11-17',
    'arbolada', 'aqua---cumbres', 'lagos-del-sol', 'alfredo-v.-bonfil',
    'las-torres', 'isla-dorada', 'residencial-rio', 'selvamar', 'palmaris', 'campestre',
  ];
  for (const slug of zoneSlugs) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}/zonas/${slug}`,
        lastModified: new Date(),
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
