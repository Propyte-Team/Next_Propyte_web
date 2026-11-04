import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import {
  getBlogPost, getRelatedPosts, getBlogPostSlugs, getBlogPostLocales, getTeamMembers,
} from '@/lib/supabase/queries';
import { robotsDeArticulo } from '@/lib/seo/robots-articulo';
import { shouldNoIndex } from '@/lib/seo/noindex';
import { resolvePostAuthor, type ResolvedAuthor } from '@/lib/blog/post-author';
import { hasMarketFigures, needsInvestmentDisclaimer } from '@/lib/blog/article-signals';
import { hubDeCategoria, hubHref, HUB_LABEL_KEY } from '@/lib/blog/hub-relacionado';
import ArticleDataNotice from '@/components/blog/ArticleDataNotice';
import RelatedPosts from '@/components/blog/RelatedPosts';
import BlogShareBar from '@/components/blog/BlogShareBar';
import BlogSidebarForm from '@/components/blog/BlogSidebarForm';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { formatDate } from '@/lib/helpers/format-date';
import { resolvePostDates } from '@/lib/blog/post-dates';
import { sanitizeRichHtml } from '@/lib/security/sanitizeHtml';
import { categoryLabel } from '@/lib/blog/category-labels';
import { ogLocaleImages } from '@/lib/og/images';

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

  const robots = robotsDeArticulo({ postNoindex: post.noindex, deployNoindex: shouldNoIndex() });

  // hreflang solo hacia traducciones realmente publicadas. Declarar una que
  // está en draft manda al rastreador a un 200 + noindex y rompe la reciprocidad.
  const publishedLocales = supabase ? await getBlogPostLocales(supabase, slug) : [locale];
  const languages: Record<string, string> = {};
  for (const l of publishedLocales) languages[l] = `/${l}/blog/${slug}`;
  // x-default apunta al ES cuando existe; si no, a la única versión viva.
  languages['x-default'] = languages.es ?? `/${locale}/blog/${slug}`;

  // Algunos meta_title de BD ya traen el sufijo "| Propyte" (caso real: el post
  // de ejido). El template del layout agrega el suyo, y publicar los dos es
  // "| Propyte | Propyte". Se retira aquí cualquier sufijo que venga en el dato
  // para que la composición final siempre lleve UNO.
  const title = (post.meta_title || post.title).replace(/(\s*\|\s*Propyte)+\s*$/i, '');
  const brandedTitle = `${title} | Propyte`;
  const description = post.meta_description || post.excerpt || '';
  const image = post.featured_image;

  return {
    title,
    description,
    openGraph: {
      siteName: 'Propyte',
      type: 'article',
      title: brandedTitle,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      publishedTime: post.published_at ?? undefined,
      authors: [post.author_name],
      tags: post.tags,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : { images: ogLocaleImages(locale) }),
    },
    twitter: { card: 'summary_large_image', title: brandedTitle, description },
    alternates: {
      canonical: `/${locale}/blog/${slug}`,
      languages,
    },
    // Solo se emite si algo lo pide: un `robots` presente y permisivo compite con
    // el default del layout.
    ...(robots ? { robots } : {}),
  };
}

function buildJsonLd(
  post: NonNullable<Awaited<ReturnType<typeof getBlogPost>>>,
  locale: string,
  siteUrl: string,
  author: ResolvedAuthor,
) {
  // `dateModified` saneado: 8 artículos ES tienen updated_at anterior al publish
  // y emitirlo crudo daba dateModified < datePublished. Ver resolvePostDates.
  const dates = resolvePostDates(post);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.featured_image ?? undefined,
    datePublished: dates.published,
    dateModified: dates.modified,
    // `url` y `jobTitle` solo cuando el autor es una persona real del equipo con
    // perfil publicado — el schema no debe declarar lo que la página no muestra.
    author: {
      '@type': 'Person',
      name: author.name,
      ...(author.profileUrl ? { url: `${siteUrl}${author.profileUrl}` } : {}),
      ...(author.role ? { jobTitle: author.role } : {}),
      ...(author.photo ? { image: author.photo } : {}),
    },
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

  const [post, t, tb, tHub] = await Promise.all([
    getBlogPost(supabase, slug, locale),
    getTranslations({ locale, namespace: 'blog' }),
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'hubRelacionado' }),
  ]);

  if (!post) notFound();

  const [related, teamMembers] = await Promise.all([
    getRelatedPosts(supabase, {
      category: post.category,
      excludeSlug: post.slug,
      locale,
      limit: 3,
    }),
    // Fail-soft: si el equipo no carga, el byline cae al genérico de siempre.
    getTeamMembers(supabase),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://propyte.com';
  const author = resolvePostAuthor(post, teamMembers, locale);
  const jsonLd = buildJsonLd(post, locale, siteUrl, author);
  const postDates = resolvePostDates(post);
  const showMethodology = hasMarketFigures(post.content);
  const showDisclaimer = needsInvestmentDisclaimer(post.content);
  const hub = hubDeCategoria(post.category);
  const breadcrumbs = [
    { label: t('listingTitle'), href: `/${locale}/blog` },
    { label: post.category, href: `/${locale}/blog?categoria=${encodeURIComponent(post.category)}` },
    { label: post.title },
  ];

  return (
    <div className="bg-white text-[#13222C] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="px-4 lg:px-10 pt-8 lg:pt-12">
        <Breadcrumbs
          items={breadcrumbs}
          locale={locale}
          homeLabel={tb('home')}
          ariaLabel={tb('ariaLabel')}
          baseUrl={siteUrl}
        />
      </div>

      {/* Encabezado a todo lo ancho: categoría y fecha en una línea, titular
          grande en Archivo, entradilla y autor. Sin pastillas ni iconos. */}
      <header className="px-4 lg:px-10 pt-8 lg:pt-14 pb-10 lg:pb-14">
        <p className="text-[14px] text-[#5B6B74]">
          <Link
            href={`/${locale}/blog?categoria=${encodeURIComponent(post.category)}`}
            className="font-semibold text-[#0E7490] hover:underline"
          >
            {categoryLabel(post.category, locale)}
          </Link>
          {' · '}
          <time dateTime={postDates.published}>
            <span className="sr-only">{t('publishedOn')} </span>
            {formatDate(postDates.published, locale)}
          </time>
          {' · '}
          {post.read_time_min} {t('minRead')}
        </p>
        <h1 className="mt-4 lg:mt-6 font-display text-[36px] sm:text-[46px] lg:text-[clamp(50px,5.4vw,84px)] leading-[1.0] font-semibold tracking-[-0.04em] max-w-[20ch] text-balance">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-5 lg:mt-7 text-[18px] lg:text-[22px] leading-[1.45] text-[#5B6B74] max-w-[46ch]">{post.excerpt}</p>
        )}

        {/* Byline: cuando el autor es una persona del equipo se muestra su
            cargo y el nombre enlaza a su perfil. */}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 pt-6 border-t border-black/10 text-[14px] text-[#5B6B74]">
          <div className="flex items-center gap-3">
            {author.photo ? (
              <Image src={author.photo} alt={author.name} width={40} height={40} className="rounded-full object-cover" />
            ) : (
              <span aria-hidden="true" className="w-10 h-10 rounded-full bg-[#0F1923] flex items-center justify-center text-white text-sm font-semibold">
                {author.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="flex flex-col leading-tight">
              {author.profileUrl ? (
                <Link href={author.profileUrl} className="font-semibold text-[#13222C] hover:text-[#0E7490] hover:underline">{author.name}</Link>
              ) : (
                <span className="font-semibold text-[#13222C]">{author.name}</span>
              )}
              {author.role && <span className="text-[13px]">{author.role}</span>}
            </span>
          </div>
          {/* Fecha de actualización solo cuando hubo un cambio en un día
              posterior. Sale de `updated_at` de la fila, no de la hora del render. */}
          {postDates.showModified && (
            <time dateTime={postDates.modified}>
              {t('updatedOn')} {formatDate(postDates.modified, locale)}
            </time>
          )}
        </div>
      </header>

      {/* Sin portada en el cuerpo: las de este blog son ilustraciones generadas
          (auditoría "se ve IA", 2026-10-27). `featured_image` sigue alimentando
          el JSON-LD y la imagen para compartir. */}

      {/* Artículo + formulario lateral fijo */}
      <div className="px-4 lg:px-10 pt-2 pb-[72px] lg:pb-28 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10 lg:gap-20">
        <article className="min-w-0">
          {post.content && (
            <div
              className="prose prose-lg max-w-[68ch]
                prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-[-0.025em] prose-headings:text-[#13222C]
                prose-h2:text-[30px] prose-h2:leading-[1.12] prose-h2:mt-14
                prose-h3:text-[22px]
                prose-p:text-[#2C3A42] prose-p:leading-[1.7] prose-li:text-[#2C3A42]
                prose-a:text-[#0E7490] prose-a:font-medium prose-a:underline-offset-2
                prose-strong:text-[#13222C]
                prose-img:rounded-md
                prose-blockquote:border-l-2 prose-blockquote:border-[#0F1923] prose-blockquote:font-display prose-blockquote:not-italic prose-blockquote:text-[#13222C]
                prose-table:text-[15px] prose-th:text-[#13222C]
                prose-code:bg-[#F4F6F8] prose-code:text-[#13222C] prose-code:px-1 prose-code:rounded"
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.content) }}
            />
          )}

          {/* Enlace al pilar padre. Anchor descriptivo (el título del pilar), no
              "clic aquí": es el lado artículo→hub del enlace bidireccional. */}
          {hub && (
            <p className="mt-12 max-w-[68ch] py-5 border-y border-black/10 text-[15px] text-[#5B6B74]">
              {t('pilarLinkIntro')}{' '}
              <Link href={hubHref(locale, hub)} className="font-semibold text-[#0E7490] hover:underline">
                {tHub(HUB_LABEL_KEY[hub] as 'comoInvertir')}
              </Link>
              .
            </p>
          )}

          {/* Enlace a /metodologia y al aviso legal, según lo que el artículo publique. */}
          <div className="max-w-[68ch]">
            <ArticleDataNotice
              locale={locale}
              showMethodology={showMethodology}
              showDisclaimer={showDisclaimer}
              t={{
                methodologyText: t('methodologyNoticeText'),
                methodologyCta: t('methodologyNoticeCta'),
                disclaimerText: t('legalNoticeText'),
                disclaimerCta: t('legalNoticeCta'),
              }}
            />
          </div>

          {/* Móvil: el formulario va aquí. registerTool={false} → no emite
              toolname WebMCP: la copia de escritorio es la única que la registra
              (dos formularios con el mismo toolname tumban el renderer de Chrome). */}
          <div className="mt-12 lg:hidden pt-10 border-t border-black/10">
            <BlogSidebarForm category={post.category} registerTool={false} />
          </div>

          <div className="mt-12 pt-6 border-t border-black/10 max-w-[68ch]">
            {post.tags.length > 0 && (
              <p className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-[14px] text-[#5B6B74]">
                {post.tags.map((tag) => <span key={tag}>#{tag}</span>)}
              </p>
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
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <BlogSidebarForm category={post.category} />
          </div>
        </aside>
      </div>

      <RelatedPosts
        posts={related}
        locale={locale}
        title={t('relatedTitle')}
        minRead={t('minRead')}
      />
    </div>
  );
}
