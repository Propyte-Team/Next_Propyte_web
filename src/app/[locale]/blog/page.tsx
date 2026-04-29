import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getBlogPosts } from '@/lib/supabase/queries';
import BlogCard from '@/components/blog/BlogCard';
import BlogHero, { CAT_ASESORES, CAT_INVERSIONISTAS } from '@/components/blog/BlogHero';
import BlogPagination from '@/components/blog/BlogPagination';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const POSTS_PER_PAGE = 6;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const title = t('listingTitle');
  const brandedTitle = `${title} | Propyte`;
  const description = t('listingDescription');
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title: brandedTitle,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
    },
    twitter: { card: 'summary_large_image', title: brandedTitle, description },
    alternates: {
      canonical: `/${locale}/blog`,
      languages: { es: '/es/blog', en: '/en/blog', 'x-default': '/es/blog' },
    },
  };
}

interface BlogPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categoria?: string; pagina?: string }>;
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { locale } = await params;
  const { categoria, pagina } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'blog' });
  const activeCategory = categoria || null;
  const currentPage = Math.max(1, Number(pagina) || 1);

  const supabase = createPublicSupabaseClient();

  const heroT = {
    heroHeadLine1: t('heroHeadLine1'),
    heroHeadLine2: t('heroHeadLine2'),
    heroDescription: t('heroDescription'),
    ctaAsesores: t('ctaAsesores'),
    ctaInversionistas: t('ctaInversionistas'),
  };

  // If a specific category is filtered, show paginated grid for that category
  if (activeCategory) {
    const { posts, total } = supabase
      ? await getBlogPosts(supabase, { locale, category: activeCategory, limit: POSTS_PER_PAGE, page: currentPage })
      : { posts: [], total: 0 };
    const totalPages = Math.ceil(total / POSTS_PER_PAGE);
    const cardT = { minRead: t('minRead') };

    return (
      <>
        <BlogHero t={heroT} activeCategory={activeCategory} />
        <section className="bg-white py-10">
          <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 mb-8">
            <Link href={`/${locale}/blog`} className="text-sm text-gray-400 hover:text-[#5CE0D2] transition-colors">
              Blog
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-[#1A2F3F]">{activeCategory}</span>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <BlogCard key={post.id} post={post} locale={locale} t={cardT} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">{t('emptyState')}</p>
            </div>
          )}

          <Suspense>
            <BlogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              locale={locale}
              prevLabel={t('paginationPrev')}
              nextLabel={t('paginationNext')}
            />
          </Suspense>
          </div>
        </section>
      </>
    );
  }

  // Default view: 2-column layout with "Para Asesores" + "Para Inversionistas"
  // Fetch sin filtro de categoría y dividir en JS. El doble .in() (status+category)
  // se rompía en Vercel cuando BLOG_INCLUDE_STAGED=true (PostgREST devolvía vacío
  // pese a que el filtered URL con .eq() sí funcionaba).
  let asesorResult = { posts: [] as Awaited<ReturnType<typeof getBlogPosts>>['posts'], total: 0 };
  let invResult = { posts: [] as Awaited<ReturnType<typeof getBlogPosts>>['posts'], total: 0 };
  if (supabase) {
    const all = await getBlogPosts(supabase, { locale, limit: 16, page: 1 });
    const ases = all.posts.filter((p) => p.category === CAT_ASESORES).slice(0, 4);
    const inv = all.posts.filter((p) => p.category === CAT_INVERSIONISTAS).slice(0, 4);
    asesorResult = { posts: ases, total: ases.length };
    invResult = { posts: inv, total: inv.length };
  }

  const cardT = { minRead: t('minRead') };

  return (
    <>
      <BlogHero t={heroT} activeCategory={null} />

      <section className="bg-white py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

            {/* Column: Para Asesores */}
            <div>
              <div className="flex items-end justify-between mb-1">
                <h2 className="text-xl md:text-2xl font-bold text-[#1A2F3F]">{t('colAsesores')}</h2>
                <Link
                  href={`/${locale}/blog?categoria=${encodeURIComponent(CAT_ASESORES)}`}
                  className="flex items-center gap-1 text-sm text-[#5CE0D2] font-medium hover:underline whitespace-nowrap"
                >
                  {t('viewAllCol')} <ArrowRight size={14} />
                </Link>
              </div>
              <p className="text-sm text-gray-500 mb-6">{t('colAsesoresSubtitle')}</p>

              {asesorResult.posts.length > 0 ? (
                <div className="space-y-5">
                  {/* Featured card first */}
                  <BlogCard post={asesorResult.posts[0]} locale={locale} t={cardT} priority />
                  {/* Compact list for remaining */}
                  {asesorResult.posts.slice(1).map((post) => (
                    <Link key={post.id} href={`/${locale}/blog/${post.slug}`} className="group flex gap-3 items-start py-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-[#5CE0D2] font-medium">{post.category}</span>
                        <p className="text-sm font-medium text-[#1A2F3F] line-clamp-2 mt-0.5 group-hover:text-[#5CE0D2] transition-colors">{post.title}</p>
                        <span className="text-xs text-gray-400 mt-1 block">{post.read_time_min} {t('minRead')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-400 text-sm">
                  {t('noPostsCol')}
                </div>
              )}
            </div>

            {/* Column: Para Inversionistas */}
            <div>
              <div className="flex items-end justify-between mb-1">
                <h2 className="text-xl md:text-2xl font-bold text-[#1A2F3F]">{t('colInversionistas')}</h2>
                <Link
                  href={`/${locale}/blog?categoria=${encodeURIComponent(CAT_INVERSIONISTAS)}`}
                  className="flex items-center gap-1 text-sm text-[#5CE0D2] font-medium hover:underline whitespace-nowrap"
                >
                  {t('viewAllCol')} <ArrowRight size={14} />
                </Link>
              </div>
              <p className="text-sm text-gray-500 mb-6">{t('colInversionistasSubtitle')}</p>

              {invResult.posts.length > 0 ? (
                <div className="space-y-5">
                  <BlogCard post={invResult.posts[0]} locale={locale} t={cardT} priority />
                  {invResult.posts.slice(1).map((post) => (
                    <Link key={post.id} href={`/${locale}/blog/${post.slug}`} className="group flex gap-3 items-start py-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-[#5CE0D2] font-medium">{post.category}</span>
                        <p className="text-sm font-medium text-[#1A2F3F] line-clamp-2 mt-0.5 group-hover:text-[#5CE0D2] transition-colors">{post.title}</p>
                        <span className="text-xs text-gray-400 mt-1 block">{post.read_time_min} {t('minRead')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-400 text-sm">
                  {t('noPostsCol')}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
