import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight } from '@/lib/icons';
import type { BlogPost } from '@/lib/supabase/queries';
import { formatDateShort } from '@/lib/helpers/format-date';
import { blogHref } from '@/lib/blog/blog-urls';

interface PilarArticlesProps {
  locale: string;
  posts: BlogPost[];
  /** Categorías que alimentan este pilar: el "Ver todos" filtra por la primera. */
  categories: string[];
  t: { title: string; minRead: string; viewAll: string };
}

/**
 * Módulo "Artículos relacionados" de una página pilar.
 *
 * Server component a propósito: es el lado hub→artículo del enlace bidireccional,
 * así que tiene que estar en el HTML del servidor para contar como enlace interno.
 * Devuelve null sin artículos — un hub sin contenido mapeado no muestra un módulo
 * vacío.
 */
export default function PilarArticles({ locale, posts, categories, t }: PilarArticlesProps) {
  if (posts.length === 0) return null;

  return (
    <section className="bg-white py-14 md:py-16">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F]">{t.title}</h2>
          {categories.length > 0 && (
            <Link
              href={blogHref(locale, { category: categories[0] })}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E7490] hover:underline"
            >
              {t.viewAll} <ArrowRight size={15} />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/${locale}/blog/${post.slug}`}
              className="group block rounded-xl overflow-hidden border border-gray-100 bg-white hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-[16/10] bg-gradient-to-br from-[#1A2F3F] to-[#5CE0D2]">
                {post.featured_image && (
                  <Image
                    src={post.featured_image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 767px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                  <span>{post.category}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {post.read_time_min} {t.minRead}
                  </span>
                </div>
                <h3 className="font-semibold text-[#1A2F3F] leading-snug line-clamp-2 group-hover:text-[#0E7490] transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                )}
                <p className="mt-3 text-2xs text-gray-500">
                  {formatDateShort(post.published_at, locale)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
