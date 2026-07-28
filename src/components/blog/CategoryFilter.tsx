import Link from 'next/link';
import { blogHref } from '@/lib/blog/blog-urls';

interface CategoryFilterProps {
  categories: string[];
  active: string | null;
  allLabel: string;
  filterAriaLabel: string;
  locale: string;
}

/**
 * Chips de categoría como `<a href>` reales, renderizados en el servidor.
 *
 * Antes eran `<button>` + `router.push`: los chips sí salían en el HTML con las
 * categorías descubiertas de BD, pero como no eran enlaces el rastreador solo
 * podía llegar a las dos categorías que el hero enlaza. El resto de las vistas
 * de categoría eran inalcanzables sin JavaScript.
 *
 * Al cambiar de categoría se descarta la página (`page` omitido) — la página 3
 * de un filtro rara vez existe en el siguiente.
 */
export default function CategoryFilter({
  categories,
  active,
  allLabel,
  filterAriaLabel,
  locale,
}: CategoryFilterProps) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label={filterAriaLabel}>
      <Link
        href={blogHref(locale)}
        aria-current={!active ? 'page' : undefined}
        className={`inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
          !active ? 'bg-[#1A2F3F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {allLabel}
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat}
          href={blogHref(locale, { category: cat })}
          aria-current={active === cat ? 'page' : undefined}
          className={`inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
            active === cat
              ? 'bg-[#5CE0D2] text-[#0F1923]'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {cat}
        </Link>
      ))}
    </nav>
  );
}
