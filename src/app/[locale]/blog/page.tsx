import { cache } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BookOpen } from '@/lib/icons';
import { assertPageVisible } from '@/lib/page-visibility';
import { VISIBILITY_KEYS } from '@/lib/visibility';
import EmptyState from '@/components/ui/EmptyState';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getBlogPosts, getBlogPilarCounts, getTeamMembers } from '@/lib/supabase/queries';
import { resolvePostAuthor } from '@/lib/blog/post-author';
import BlogCard from '@/components/blog/BlogCard';
import BlogHero from '@/components/blog/BlogHero';
import BlogPagination from '@/components/blog/BlogPagination';
import BlogFilterBar from '@/components/blog/BlogFilterBar';
import MapaDePilares from '@/components/blog/MapaDePilares';
import NewsletterCTA from '@/components/blog/NewsletterCTA';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { blogHref } from '@/lib/blog/blog-urls';
import { robotsDeListado } from '@/lib/seo/robots-listado';
import { PILARES, AUDIENCIAS, pilarPorSlug, esAudiencia } from '@/lib/blog/pilares';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const POSTS_PER_PAGE = 9;

interface BlogSearchParams {
  categoria?: string;
  pilar?: string;
  audiencia?: string;
  pagina?: string;
}

/**
 * Resuelve los searchParams a estado validado.
 *
 * Un solo lugar para los dos consumidores (`generateMetadata` y la página): antes
 * cada uno derivaba el estado por su cuenta, y este módulo existe justo porque un
 * tope escrito dos veces ya falló en silencio aquí.
 *
 * Un valor fuera del catálogo NO es 404: es un param basura en una ruta que sí
 * existe. Se ignora el filtro y se marca la vista `noindex` para que la URL basura
 * no entre al índice mostrando el listado completo bajo otra dirección. No se usa
 * `notFound()` a propósito — en este sitio las rutas dinámicas flushean shell con
 * 200 antes de resolverlo.
 */
function resolveBlogState(sp: BlogSearchParams) {
  const pilar = sp.pilar ? pilarPorSlug(sp.pilar) : null;
  const audiencia = sp.audiencia && esAudiencia(sp.audiencia) ? sp.audiencia : null;
  const paramInvalido = Boolean((sp.pilar && !pilar) || (sp.audiencia && !audiencia));

  return {
    category: sp.categoria || null,
    pilar,
    audiencia,
    page: Math.max(1, Number(sp.pagina) || 1),
    paramInvalido,
    /** Lo que va a `blogHref`: el SLUG del pilar, no su código. */
    urlState: {
      category: sp.categoria || null,
      pilar: pilar?.slug ?? null,
      audiencia,
    },
  };
}

/**
 * Carga del listado, memoizada por request.
 *
 * `generateMetadata` y el componente necesitan lo MISMO: el metadata decide el
 * `robots` a partir de si la vista trae resultados, y la página pinta esos
 * mismos posts. Sin memoizar, cada request corría las consultas dos veces.
 * `cache()` de React las dedupe dentro del mismo render — por eso los argumentos
 * son primitivos y no el objeto de estado: se comparan por valor, y un objeto
 * nuevo en cada llamada nunca acertaría el caché.
 */
const cargarListado = cache(async function cargarListado(
  locale: string,
  category: string | null,
  pilarCode: string | null,
  audiencia: string | null,
  page: number,
) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return { posts: [], total: 0, pilarCounts: {} as Record<string, number>, teamMembers: [] };
  }

  const [{ posts, total }, pilarCounts, teamMembers] = await Promise.all([
    getBlogPosts(supabase, {
      locale,
      category: category ?? undefined,
      pilar: pilarCode ?? undefined,
      audiencia: audiencia ?? undefined,
      limit: POSTS_PER_PAGE,
      page,
    }),
    getBlogPilarCounts(supabase, locale),
    getTeamMembers(supabase),
  ]);

  return { posts, total, pilarCounts, teamMembers };
});

export async function generateMetadata({ params, searchParams }: BlogPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const [t, tp] = await Promise.all([
    getTranslations({ locale, namespace: 'blog' }),
    getTranslations({ locale, namespace: 'pilares' }),
  ]);
  const { category, pilar, audiencia, page, paramInvalido, urlState } = resolveBlogState(sp);

  // Título y descripción propios por vista. Antes las 7 categorías y las 2
  // páginas compartían el meta de /blog y canonicalizaban ahí: el canonical a la
  // página 1 esconde el resto del inventario, y un meta repetido no distingue
  // una vista de otra.
  let title = t('listingTitle');
  let description = t('listingDescription');
  if (category) {
    title = t('listingTitleCategory', { category });
    description = t('listingDescriptionCategory', { category });
  } else if (pilar) {
    title = t('listingTitleCategory', { category: tp(pilar.code) });
    description = t('listingDescriptionCategory', { category: tp(pilar.code) });
  }
  if (page > 1) {
    title = t('listingTitlePaged', { title, page });
  }

  const brandedTitle = `${title} | Propyte`;
  const state = { ...urlState, page };

  // Qué se indexa y qué no lo decide `robotsDeListado`: un pilar sin piezas o
  // una página fuera de rango son URLs vivas con un estado vacío, y el filtro
  // ahora ofrece los siete pilares tengan contenido o no.
  const { posts } = await cargarListado(locale, category, pilar?.code ?? null, audiencia, page);
  const robots = robotsDeListado({
    paramInvalido,
    resultados: posts.length,
    hayFiltro: Boolean(category || pilar || audiencia),
    page,
  });

  return {
    title,
    description,
    ...(robots ? { robots } : {}),
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
      // Self-referencing: cada vista apunta a sí misma, con el estado limpio.
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
  searchParams: Promise<BlogSearchParams>;
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  await assertPageVisible(VISIBILITY_KEYS.PAGE_BLOG);

  const [t, tb, tp, ta] = await Promise.all([
    getTranslations({ locale, namespace: 'blog' }),
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'pilares' }),
    getTranslations({ locale, namespace: 'audiencias' }),
  ]);

  const { category, pilar, audiencia, page: currentPage, urlState } = resolveBlogState(sp);

  // Single source of truth: grid completo de TODOS los posts (paginado y
  // filtrado). Se comparte con `generateMetadata` vía `cargarListado`, que
  // memoiza por request. Los conteos por pilar alimentan la barra —los siete
  // temas se ofrecen siempre, con su número al lado—. El equipo se trae para
  // resolver el autor real de cada tarjeta (foto + cargo); fail-soft: sin
  // equipo, la tarjeta usa el autor crudo de la fila.
  //
  // `getBlogCategories` ya no se llama: la categoría dejó de ser un filtro
  // público al fusionarse los ejes en la barra, y descubrirla era un viaje a la
  // BD que nadie leía. El param `?categoria=` sigue funcionando.
  const { posts, total, pilarCounts, teamMembers } = await cargarListado(
    locale,
    category,
    pilar?.code ?? null,
    audiencia,
    currentPage,
  );

  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const cardT = { minRead: t('minRead') };

  // Labels resueltos en el servidor: los componentes de filtro son neutros y no
  // llaman a getTranslations por su cuenta.
  const pilarLabels = Object.fromEntries(PILARES.map((p) => [p.code, tp(p.code)]));
  const audienciaLabels = Object.fromEntries(AUDIENCIAS.map((a) => [a, ta(a)]));
  // El número que se pinta junto a cada tema es un glifo suelto: un lector de
  // pantalla necesita la unidad ("6 artículos", "0 artículos"), así que el
  // enlace lleva su propia etiqueta accesible.
  const pilarCountLabels = Object.fromEntries(
    PILARES.map((p) => [p.code, t('articleCount', { count: pilarCounts[p.code] ?? 0 })]),
  );

  const heroT = {
    heroHeadLine1: t('heroHeadLine1'),
    heroHeadLine2: t('heroHeadLine2'),
    heroDescription: t('heroDescription'),
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://propyte.com';
  const activeLabel = category ?? (pilar ? tp(pilar.code) : null);
  const breadcrumbItems = activeLabel
    ? [{ label: t('listingTitle'), href: `/${locale}/blog` }, { label: activeLabel }]
    : [{ label: t('listingTitle') }];
  const hayFiltro = Boolean(category || pilar || audiencia);

  return (
    <>
      <BlogHero t={heroT} />

      <BlogFilterBar
        locale={locale}
        pilarCounts={pilarCounts}
        activePilar={pilar?.code ?? null}
        activeAudiencia={audiencia}
        activeCategory={category}
        total={total}
        labels={{
          tema: t('filterTema'),
          publico: t('filterPublico'),
          allPilares: t('allPilares'),
          allAudiencias: t('allAudiencias'),
          pilares: pilarLabels,
          pilarCounts: pilarCountLabels,
          audiencias: audienciaLabels,
          articleCount: t('articleCount', { count: total }),
          filtersAriaLabel: t('filtersAriaLabel'),
          activeFilters: t('activeFilters'),
          removeFilter: t('removeFilter'),
          clearAll: t('clearAll'),
        }}
      />

      <section className="bg-white py-10 md:py-14">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <Breadcrumbs
            items={breadcrumbItems}
            locale={locale}
            homeLabel={tb('home')}
            ariaLabel={tb('ariaLabel')}
            baseUrl={siteUrl}
          />

          <div className="mt-6" />

          {posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post, i) => {
                  const a = resolvePostAuthor(post, teamMembers, locale);
                  return (
                    <BlogCard
                      key={post.id}
                      post={post}
                      locale={locale}
                      t={cardT}
                      priority={i < 1}
                      author={{ name: a.name, role: a.role, photo: a.photo }}
                    />
                  );
                })}
              </div>

              {/* El conteo vive en la barra de filtros, a la derecha, como en
                  /desarrollos. Repetirlo aquí era decir lo mismo dos veces. */}

              <BlogPagination
                currentPage={currentPage}
                totalPages={totalPages}
                locale={locale}
                keep={urlState}
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
                // "Volver al blog" solo tiene sentido con algún filtro activo (lo
                // limpia). Sin filtro, el grid ya está vacío sitewide y el CTA
                // sería un loop al mismo estado vacío.
                ...(hayFiltro
                  ? [{ label: t('emptyStateCtaBack'), href: `/${locale}/blog`, variant: 'secondary' as const }]
                  : []),
              ]}
            />
          )}
        </div>
      </section>

      <MapaDePilares
        locale={locale}
        title={t('mapaPilaresTitle')}
        body={t('mapaPilaresBody')}
        labels={pilarLabels}
      />

      <NewsletterCTA />
    </>
  );
}
