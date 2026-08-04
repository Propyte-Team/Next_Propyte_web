import Link from 'next/link';
import { blogHref, type BlogUrlState } from '@/lib/blog/blog-urls';
import { pilarPorCodigo } from '@/lib/blog/pilares';

interface PilarFilterProps {
  /** CÓDIGOS con posts publicados, de `getBlogPilares`. */
  codes: string[];
  /** Código activo, o null. */
  active: string | null;
  /** Resto del estado a conservar al cambiar de pilar (categoría, audiencia). */
  keep: BlogUrlState;
  allLabel: string;
  filterAriaLabel: string;
  /** Label por código, resuelto por el server component que renderiza. */
  labels: Record<string, string>;
  locale: string;
}

/**
 * Chips de pilar canónico como `<a href>` reales, renderizados en el servidor.
 *
 * Mismo patrón que `CategoryFilter` y por el mismo motivo: con `<button>` +
 * `router.push` los chips salen en el HTML pero el rastreador no puede seguirlos,
 * así que las vistas filtradas quedan inalcanzables sin JavaScript.
 *
 * Sin códigos no renderiza nada: los chips derivan de lo publicado, y mientras no
 * haya piezas clasificadas este filtro simplemente no existe — degrada a nada, no
 * a un filtro vacío.
 *
 * Al cambiar de pilar se descarta la página (`page: null`): la página 3 de un
 * filtro rara vez existe en el siguiente.
 */
export default function PilarFilter({
  codes, active, keep, allLabel, filterAriaLabel, labels, locale,
}: PilarFilterProps) {
  if (codes.length === 0) return null;

  return (
    <nav className="flex flex-wrap gap-2" aria-label={filterAriaLabel}>
      <Link
        href={blogHref(locale, { ...keep, pilar: null, page: null })}
        aria-current={!active ? 'page' : undefined}
        className={`inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
          !active ? 'bg-[#1A2F3F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {allLabel}
      </Link>
      {codes.map((code) => {
        const pilar = pilarPorCodigo(code);
        // Un código en BD que no está en el catálogo no se renderiza: sería un
        // chip sin destino. Ocurre si alguien escribe un pilar a mano en el Hub.
        if (!pilar) return null;
        return (
          <Link
            key={code}
            href={blogHref(locale, { ...keep, pilar: pilar.slug, page: null })}
            aria-current={active === code ? 'page' : undefined}
            className={`inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
              active === code
                ? 'bg-[#5CE0D2] text-[#0F1923]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {labels[code] ?? code}
          </Link>
        );
      })}
    </nav>
  );
}
