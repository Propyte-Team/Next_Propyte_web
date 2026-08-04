import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getBlogPosts, type BlogPost } from '@/lib/supabase/queries';
import { categoriasDeHub, type HubRelacionado } from '@/lib/blog/hub-relacionado';
import { blogHref } from '@/lib/blog/blog-urls';
import PilarArticles from './PilarArticles';

type PilarLabels = { title: string; minRead: string; viewAll: string };

/**
 * Sección lista para pegar en una página pilar: resuelve sus categorías, trae los
 * artículos y renderiza el módulo. Una línea por hub en vez de repetir el fetch.
 *
 * Usa `createPublicSupabaseClient` (cookie-less) para no romper el ISR de la
 * página que la incluye — `createServerSupabaseClient` lee cookies y la volvería
 * dinámica por request.
 *
 * Fail-soft: cualquier error deja la sección fuera, nunca tumba el hub.
 */
export default async function PilarArticlesSection({
  locale,
  hub,
  limit = 3,
}: {
  locale: string;
  hub: HubRelacionado;
  limit?: number;
}) {
  const categories = categoriasDeHub(hub);
  // Sin categorías mapeadas no hay nada que consultar: se evita el viaje a la BD.
  if (categories.length === 0) return null;

  // El try/catch envuelve SOLO la carga de datos: construir JSX dentro de un
  // try lo prohíbe la regla react-hooks/error-boundaries de eslint.
  let data: { posts: BlogPost[]; labels: PilarLabels } | null = null;
  try {
    const supabase = createPublicSupabaseClient();
    if (supabase) {
      const [{ posts }, t] = await Promise.all([
        getBlogPosts(supabase, { locale, categories, limit, page: 1 }),
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
    console.error(`[PilarArticlesSection] ${hub}:`, error);
  }

  if (!data) return null;

  return (
    <PilarArticles
      locale={locale}
      posts={data.posts}
      viewAllHref={categories.length > 0 ? blogHref(locale, { category: categories[0] }) : null}
      t={data.labels}
    />
  );
}
