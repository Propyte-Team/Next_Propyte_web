import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BookOpen } from '@/lib/icons';
import { assertPageVisible } from '@/lib/page-visibility';
import { VISIBILITY_KEYS } from '@/lib/visibility';
import EmptyState from '@/components/ui/EmptyState';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getBlogPosts, getBlogCategories } from '@/lib/supabase/queries';
import BlogCard from '@/components/blog/BlogCard';
import BlogHero from '@/components/blog/BlogHero';
import BlogPagination from '@/components/blog/BlogPagination';
import CategoryFilter from '@/components/blog/CategoryFilter';
import NewsletterCTA from '@/components/blog/NewsletterCTA';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { blogHref } from '@/lib/blog/blog-urls';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const POSTS_PER_PAGE = 9;

export async function generateMetadata({ params, searchParams }: BlogPageProps) {
  const { locale } = await params;
  const { categoria, pagina } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'blog' });

  const category = categoria || null;
  const page = Math.max(1, Number(pagina) || 1);

  // Título y descripción propios por vista. Antes las 7 categorías y las 2
  // páginas compartían el meta de /blog y canonicalizaban ahí: el canonical a la
  // página 1 esconde el resto del inventario, y un meta repetido no distingue
  // una vista de otra.
  let title = t('listingTitle');
  let description = t('listingDescription');
  if (category) {
    title = t('listingTitleCategory', { category });
    description = t('listingDescriptionCategory', { category });
  }
  if (page > 1) {
    title = t('listingTitlePaged', { title, page });
  }

  const brandedTitle = `${title} | Propyte`;
  const state = { category, page };

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
      // Self-referencing: cada categoría y cada página apunta a sí misma.
      canonical: blogHref(locale, state),
      languages: {
        es: blogHref('es', state),
        en: blogHref('en', state),
        'x-default': blogHref('es', state),
      },
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
  await assertPageVisible(VISIBILITY_KEYS.PAGE_BLOG);

  const [t, tb] = await Promise.all([
    getTranslations({ locale, namespace: 'blog' }),
    getTranslations({ locale, namespace: 'breadcrumbs' }),
  ]);

  const activeCategory = categoria || null;
  const currentPage = Math.max(1, Number(pagina) || 1);
  const supabase = createPublicSupabaseClient();

  // Single source of truth: grid completo de TODOS los posts (paginado y filtrado).
  // Categorías se descubren automáticamente desde BD para mantener el filtro
  // sincronizado sin hardcodear nombres como "Para Asesores".
  const [{ posts, total }, categories] = supabase
    ? await Promise.all([
        getBlogPosts(supabase, { locale, category: activeCategory ?? undefined, limit: POSTS_PER_PAGE, page: currentPage }),
        getBlogCategories(supabase, locale),
      ])
    : [{ posts: [], total: 0 }, []];

  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const cardT = { minRead: t('minRead') };

  const heroT = {
    heroHeadLine1: t('heroHeadLine1'),
    heroHeadLine2: t('heroHeadLine2'),
    heroDescription: t('heroDescription'),
    ctaAsesores: t('ctaAsesores'),
    ctaInversionistas: t('ctaInversionistas'),
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://propyte.com';
  const breadcrumbItems = activeCategory
    ? [{ label: t('listingTitle'), href: `/${locale}/blog` }, { label: activeCategory }]
    : [{ label: t('listingTitle') }];

  return (
    <>
      <BlogHero t={heroT} activeCategory={activeCategory} />

      <section className="bg-white py-10 md:py-14">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <Breadcrumbs
            items={breadcrumbItems}
            locale={locale}
            homeLabel={tb('home')}
            ariaLabel={tb('ariaLabel')}
            baseUrl={siteUrl}
          />

          <div className="mt-6 mb-8">
            <CategoryFilter
              categories={categories}
              active={activeCategory}
              allLabel={t('allCategories') || 'Todos'}
              filterAriaLabel={t('categoryFilterAriaLabel')}
              locale={locale}
            />
          </div>

          {posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post, i) => (
                  <BlogCard key={post.id} post={post} locale={locale} t={cardT} priority={i < 1} />
                ))}
              </div>

              {total > 0 && (
                <p className="mt-6 text-xs text-gray-500 text-center">
                  {t('articleCount', { count: total })}
                </p>
              )}

              <BlogPagination
                currentPage={currentPage}
                totalPages={totalPages}
                locale={locale}
                activeCategory={activeCategory}
                prevLabel={t('paginationPrev')}
                nextLabel={t('paginationNext')}
                ariaLabel={t('paginationAriaLabel')}
              />
            </>
          ) : (
            <EmptyState
              icon={BookOpen}
              title={t('emptyState')}
              description={t('emptyStateBody')}
              actions={[
                { label: t('emptyStateCtaContact'), href: `/${locale}/contacto?asunto=blog` },
                // "Volver al blog" solo tiene sentido cuando hay un filtro de
                // categoría activo (limpia el filtro). Sin categoría, el
                // grid ya está vacío sitewide y el CTA sería un loop al
                // mismo estado vacío.
                ...(activeCategory
                  ? [{ label: t('emptyStateCtaBack'), href: `/${locale}/blog`, variant: 'secondary' as const }]
                  : []),
              ]}
            />
          )}
        </div>
      </section>

      <NewsletterCTA />
    </>
  );
}
