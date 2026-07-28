import Link from 'next/link';
import { ChevronLeft, ChevronRight } from '@/lib/icons';
import { blogHref } from '@/lib/blog/blog-urls';

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  locale: string;
  /** Filtro activo: viaja en cada href para no perderlo al paginar. */
  activeCategory?: string | null;
  prevLabel: string;
  nextLabel: string;
  ariaLabel: string;
}

/**
 * Paginación con `<a href>` reales, renderizada en el servidor.
 *
 * Antes era `<button>` + `router.push`: la página 2 existía y devolvía sus
 * artículos, pero ningún rastreador podía llegar a ella porque no había un solo
 * enlace en el HTML. Con 78 artículos previstos eso deja la mayor parte del
 * inventario sin ruta de descubrimiento.
 *
 * Los extremos van como `<span>` en vez de enlace deshabilitado: un `<a>` sin
 * destino es ruido para el rastreo y para el lector de pantalla.
 */
export default function BlogPagination({
  currentPage,
  totalPages,
  locale,
  activeCategory = null,
  prevLabel,
  nextLabel,
  ariaLabel,
}: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => blogHref(locale, { category: activeCategory, page });
  const edgeClass =
    'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 transition-colors';

  return (
    <nav className="flex items-center justify-center gap-2 mt-10" aria-label={ariaLabel}>
      {currentPage > 1 ? (
        <Link href={hrefFor(currentPage - 1)} rel="prev" className={`${edgeClass} hover:bg-gray-100`}>
          <ChevronLeft size={16} /> {prevLabel}
        </Link>
      ) : (
        <span className={`${edgeClass} opacity-40`} aria-hidden="true">
          <ChevronLeft size={16} /> {prevLabel}
        </span>
      )}

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) =>
          page === currentPage ? (
            <span
              key={page}
              aria-current="page"
              className="flex items-center justify-center w-9 h-9 min-h-[44px] min-w-[44px] rounded-lg text-sm font-medium bg-[#1A2F3F] text-white"
            >
              {page}
            </span>
          ) : (
            <Link
              key={page}
              href={hrefFor(page)}
              className="flex items-center justify-center w-9 h-9 min-h-[44px] min-w-[44px] rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {page}
            </Link>
          )
        )}
      </div>

      {currentPage < totalPages ? (
        <Link href={hrefFor(currentPage + 1)} rel="next" className={`${edgeClass} hover:bg-gray-100`}>
          {nextLabel} <ChevronRight size={16} />
        </Link>
      ) : (
        <span className={`${edgeClass} opacity-40`} aria-hidden="true">
          {nextLabel} <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}
