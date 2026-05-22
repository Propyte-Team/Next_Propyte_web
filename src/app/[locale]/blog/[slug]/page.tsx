import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getBlogPost, getRelatedPosts, getBlogPostSlugs } from '@/lib/supabase/queries';
import RelatedPosts from '@/components/blog/RelatedPosts';
import BlogShareBar from '@/components/blog/BlogShareBar';
import BlogSidebarForm from '@/components/blog/BlogSidebarForm';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { formatDate } from '@/lib/helpers/format-date';
import { sanitizeRichHtml } from '@/lib/security/sanitizeHtml';
import { Calendar, Clock, Tag, ChevronLeft } from '@/lib/icons';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return [];
    const slugs = await getBlogPostSlugs(supabase);
    return slugs.map(({ slug, locale }) => ({ slug, locale }));
  } catch (err) {
    console.error('[blog] generateStaticParams failed:', err);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const supabase = createPublicSupabaseClient();
  const post = supabase ? await getBlogPost(supabase, slug, locale) : null;
  if (!post) return {};

  const title = post.meta_title || post.title;
  const brandedTitle = `${title} | Propyte`;
  const description = post.meta_description || post.excerpt || '';
  const image = post.featured_image;

  return {
    title,
    description,
    openGraph: {
      type: 'article',
      title: brandedTitle,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      publishedTime: post.published_at ?? undefined,
      authors: [post.author_name],
      tags: post.tags,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : { images: [`/${locale}/opengraph-image`] }),
    },
    twitter: { card: 'summary_large_image', title: brandedTitle, description },
    alternates: {
      canonical: `/${locale}/blog/${slug}`,
      languages: {
        es: `/es/blog/${slug}`,
        en: `/en/blog/${slug}`,
        'x-default': `/es/blog/${slug}`,
      },
    },
  };
}

function buildJsonLd(post: NonNullable<Awaited<ReturnType<typeof getBlogPost>>>, locale: string, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.featured_image ?? undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at ?? post.created_at,
    author: { '@type': 'Person', name: post.author_name },
    publisher: {
      '@type': 'Organization',
      name: 'Propyte',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/img/logos/propyte-horizontal-teal.png` },
    },
    url: `${siteUrl}/${locale}/blog/${post.slug}`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/${locale}/blog/${post.slug}` },
    keywords: post.tags.join(', '),
    articleSection: post.category,
    inLanguage: locale === 'es' ? 'es-MX' : 'en-US',
    timeRequired: `PT${post.read_time_min}M`,
  };
}

interface BlogPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const supabase = createPublicSupabaseClient();
  if (!supabase) notFound();

  const [post, t, tb] = await Promise.all([
    getBlogPost(supabase, slug, locale),
    getTranslations({ locale, namespace: 'blog' }),
    getTranslations({ locale, namespace: 'breadcrumbs' }),
  ]);

  if (!post) notFound();

  const related = await getRelatedPosts(supabase, {
    category: post.category,
    excludeSlug: post.slug,
    locale,
    limit: 3,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://propyte.com';
  const jsonLd = buildJsonLd(post, locale, siteUrl);
  const breadcrumbs = [
    { label: t('listingTitle'), href: `/${locale}/blog` },
    { label: post.title },
  ];

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        <Breadcrumbs
          items={breadcrumbs}
          locale={locale}
          homeLabel={tb('home')}
          ariaLabel={tb('ariaLabel')}
          baseUrl={siteUrl}
        />

        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#0E7490] mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> {t('backToListing')}
        </Link>

        {/* Two-column layout: article + sticky sidebar form */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-12">
          {/* MAIN COLUMN — article content */}
          <article className="min-w-0">
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 text-xs font-semibold bg-[#0E7490] text-white rounded-full">
                  {post.category}
                </span>
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full">
                    <Tag size={10} /> {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-2xl md:text-4xl font-bold text-[#0F1923] leading-tight mb-4">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-lg text-slate-600 leading-relaxed mb-6">{post.excerpt}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  {post.author_image ? (
                    <Image
                      src={post.author_image}
                      alt={post.author_name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#0F1923] flex items-center justify-center text-white text-xs font-bold">
                      {post.author_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium text-[#0F1923]">{post.author_name}</span>
                </div>

                {post.published_at && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(post.published_at, locale)}
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {post.read_time_min} {t('minRead')}
                </span>
              </div>
            </header>

            {post.featured_image && (
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-8">
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover"
                />
              </div>
            )}

            {post.content && (
              <div
                className="prose prose-lg prose-slate max-w-none
                  prose-headings:text-[#0F1923] prose-headings:font-bold
                  prose-a:text-[#0E7490] prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-[#0F1923]
                  prose-img:rounded-xl prose-img:shadow-card
                  prose-blockquote:border-propyte-brand prose-blockquote:text-slate-600
                  prose-code:bg-slate-100 prose-code:text-[#0F1923] prose-code:px-1 prose-code:rounded"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.content) }}
              />
            )}

            {/* Mobile: sidebar form appears here (between content and footer) */}
            <div className="mt-10 lg:hidden">
              <BlogSidebarForm category={post.category} />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <BlogShareBar
                title={post.title}
                url={`${siteUrl}/${locale}/blog/${post.slug}`}
                shareLabel={t('share')}
                copyLabel={t('copyLink')}
                copiedLabel={t('copied')}
                whatsappLabel={t('shareWhatsapp')}
              />
            </div>

            <RelatedPosts
              posts={related}
              locale={locale}
              title={t('relatedTitle')}
              minRead={t('minRead')}
            />
          </article>

          {/* SIDEBAR — sticky form on desktop, hidden on mobile (rendered inline above) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <BlogSidebarForm category={post.category} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
