import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getBlogPosts, type BlogPost } from '@/lib/supabase/queries';
import { blogHref } from '@/lib/blog/blog-urls';
import { pilarPorCodigo, type PilarCode } from '@/lib/blog/pilares';
import PilarArticles from './PilarArticles';

type PilarLabels = { title: string; minRead: string; viewAll: string };

/**
 * Artículos de un pilar CANÓNICO (`blog_posts.pilar`), para los hubs nuevos.
 *
 * El hermano `PilarArticlesSection` resuelve el otro eje —afinidad por
 * categoría— y sirve a los hubs viejos. Ver `lib/blog/pilares.ts` frente a
 * `lib/blog/hub-relacionado.ts`: son dos preguntas distintas y a propósito
 * separadas.
 *
 * `createPublicSupabaseClient` (cookie-less) para no volver dinámica por request
 * la página que lo incluye. Fail-soft: cualquier error deja la sección fuera y
 * nunca tumba el hub.
 *
 * Sin artículos devuelve null (vía `PilarArticles`): un hub cuyo pilar todavía no
 * tiene piezas no muestra un módulo vacío. Es el caso de P6 hoy.
 */
export default async function ArticulosDePilar({
  locale,
  code,
  limit = 6,
}: {
  locale: string;
  code: PilarCode;
  limit?: number;
}) {
  const pilar = pilarPorCodigo(code);
  if (!pilar) return null;

  // El try/catch envuelve SOLO la carga de datos: construir JSX dentro de un try
  // lo prohíbe la regla react-hooks/error-boundaries de eslint.
  let data: { posts: BlogPost[]; labels: PilarLabels } | null = null;
  try {
    const supabase = createPublicSupabaseClient();
    if (supabase) {
      const [{ posts }, t] = await Promise.all([
        getBlogPosts(supabase, { locale, pilar: code, limit, page: 1 }),
        getTranslations({ locale, namespace: 'blog' }),
      ]);
      data = {
        posts,
        labels: {
          title: t('pilarArticlesTitle'),
          minRead: t('minRead'),
          viewAll: t('pilarViewAll'),
        },
      };
    }
  } catch (error) {
    console.error(`[ArticulosDePilar] ${code}:`, error);
  }

  if (!data) return null;

  return (
    <PilarArticles
      locale={locale}
      posts={data.posts}
      viewAllHref={blogHref(locale, { pilar: pilar.slug })}
      t={data.labels}
    />
  );
}
