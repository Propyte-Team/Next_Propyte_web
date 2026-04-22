import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock } from 'lucide-react';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getBlogPosts } from '@/lib/supabase/queries';

interface RecentBlogProps {
  locale: string;
}

export default async function RecentBlog({ locale }: RecentBlogProps) {
  const t = await getTranslations({ locale, namespace: 'blog' });

  const supabase = createPublicSupabaseClient();
  const { posts } = supabase
    ? await getBlogPosts(supabase, { locale, limit: 3, page: 1 })
    : { posts: [] };

  if (!posts.length) return null;

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#2C2C2C]">{t('title')}</h2>
          <Link
            href={`/${locale}/blog`}
            className="hidden md:flex items-center gap-1 text-[#5CE0D2] font-medium hover:underline"
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
                    <div className="w-full h-full bg-gradient-to-br from-[#1A2F3F] to-[#5CE0D2]" />
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 text-xs font-semibold bg-[#5CE0D2] text-white rounded">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-1">
                    {post.published_at && (
                      <time className="text-xs text-gray-400">
                        {new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        }).format(new Date(post.published_at))}
                      </time>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
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
          <Link href={`/${locale}/blog`} className="flex items-center gap-1 text-[#5CE0D2] font-medium">
            {t('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
