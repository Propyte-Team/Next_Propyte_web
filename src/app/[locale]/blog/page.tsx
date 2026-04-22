import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getBlogPosts, getBlogCategories } from '@/lib/supabase/queries';
import BlogCard from '@/components/blog/BlogCard';
import FeaturedPostHero from '@/components/blog/FeaturedPostHero';
import CategoryFilter from '@/components/blog/CategoryFilter';
import BlogPagination from '@/components/blog/BlogPagination';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

export const revalidate = 3600; // ISR 1h

const POSTS_PER_PAGE = 9;

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
  const tb = await getTranslations({ locale, namespace: 'breadcrumbs' });

  const supabase = createPublicSupabaseClient();
  const currentPage = Math.max(1, Number(pagina) || 1);
  const activeCategory = categoria || null;

  const [{ posts, total }, categories] = await Promise.all([
    getBlogPosts(supabase, { locale, category: activeCategory ?? undefined, limit: POSTS_PER_PAGE, page: currentPage }),
    getBlogCategories(supabase, locale),
  ]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  // Featured = first post on page 1 without category filter
  const featuredPost = currentPage === 1 && !activeCategory && posts.length > 0 ? posts[0] : null;
  const remainingPosts = featuredPost ? posts.slice(1) : posts;

  const breadcrumbs = [{ label: t('listingTitle') }];

  const tMinRead = t('minRead');
  const cardT = { minRead: tMinRead };

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8">
      <Breadcrumbs
        items={breadcrumbs}
        locale={locale}
        homeLabel={tb('home')}
        ariaLabel={tb('ariaLabel')}
        baseUrl={process.env.NEXT_PUBLIC_SITE_URL}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A2F3F]">{t('listingTitle')}</h1>
        <p className="text-gray-500 mt-2">{t('listingDescription')}</p>
      </div>

      {/* Featured post */}
      {featuredPost && (
        <FeaturedPostHero
          post={featuredPost}
          locale={locale}
          t={{ minRead: tMinRead, readMore: t('readMore'), featured: t('featuredLabel') }}
        />
      )}

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="mb-8">
          <Suspense>
            <CategoryFilter
              categories={categories}
              active={activeCategory}
              allLabel={t('allCategories')}
              locale={locale}
            />
          </Suspense>
        </div>
      )}

      {/* Grid */}
      {remainingPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {remainingPosts.map((post, i) => (
            <BlogCard
              key={post.id}
              post={post}
              locale={locale}
              t={cardT}
              priority={i < 3}
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">{t('emptyState')}</p>
        </div>
      ) : null}

      {/* Pagination */}
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
  );
}
