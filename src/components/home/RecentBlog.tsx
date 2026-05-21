import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, FileText, Mail } from '@/lib/icons';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getBlogPosts } from '@/lib/supabase/queries';

interface RecentBlogProps {
  locale: string;
}

const MIN_POSTS_FOR_GRID = 3;

export default async function RecentBlog({ locale }: RecentBlogProps) {
  const t = await getTranslations({ locale, namespace: 'blog' });

  const supabase = createPublicSupabaseClient();
  const { posts } = supabase
    ? await getBlogPosts(supabase, { locale, limit: 3, page: 1 })
    : { posts: [] };

  // B7: si posts < 3, render placeholder con CTA newsletter en lugar de ocultar.
  // Comunica intención editorial sin claims engañosos sobre contenido inexistente.
  if (posts.length < MIN_POSTS_FOR_GRID) {
    return (
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="propyte-card-glass-light p-8 md:p-12 text-center border-2 border-dashed border-[#A2F9FF]/40 rounded-2xl">
            <div className="w-14 h-14 mx-auto mb-5 bg-[#A2F9FF]/20 rounded-2xl flex items-center justify-center">
              <FileText size={28} strokeWidth={1.5} className="text-[#0E7490]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-4 leading-snug">
              {t('homeEmptyTitle')}
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-8 max-w-xl mx-auto">
              {t('homeEmptyBody')}
            </p>
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center gap-2 min-h-[44px] px-7 bg-[#1A2F3F] hover:bg-[#0F1923] text-white font-semibold rounded-lg transition-colors text-sm"
            >
              <Mail size={16} strokeWidth={1.75} />
              {t('homeEmptyCta')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#2C2C2C]">{t('title')}</h2>
          <Link
            href={`/${locale}/blog`}
            className="hidden md:flex items-center gap-1 text-[#0E7490] font-medium hover:underline"
          >
            {t('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <Link key={post.id} href={`/${locale}/blog/${post.slug}`} className="group block">
              <article className="rounded-xl overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {post.featured_image ? (
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 639px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority={i === 0}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0B1C1E] to-[#A2F9FF]" />
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 text-xs font-semibold bg-[#0E7490] text-white rounded">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-1">
                    {post.published_at && (
                      <time className="text-xs text-gray-600">
                        {new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        }).format(new Date(post.published_at))}
                      </time>
                    )}
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock size={10} /> {post.read_time_min} {t('minRead')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#2C2C2C] mt-1 line-clamp-2">{post.title}</h3>
                </div>
              </article>
            </Link>
          ))}
        </div>
        <div className="mt-6 flex justify-center md:hidden">
          <Link href={`/${locale}/blog`} className="inline-flex items-center gap-1 min-h-[44px] text-[#0E7490] font-medium">
            {t('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
