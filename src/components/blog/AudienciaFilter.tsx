import Link from 'next/link';
import { blogHref, type BlogUrlState } from '@/lib/blog/blog-urls';
import { AUDIENCIAS } from '@/lib/blog/pilares';

interface AudienciaFilterProps {
  active: string | null;
  keep: BlogUrlState;
  allLabel: string;
  filterAriaLabel: string;
  labels: Record<string, string>;
  locale: string;
}

/**
 * Chips de audiencia, enlaces reales renderizados en el servidor.
 *
 * A diferencia de los de pilar, las dos audiencias se muestran SIEMPRE: son un
 * catálogo cerrado de dos valores acordado con Luis, no un descubrimiento de BD.
 * El costo de eso es que una audiencia sin piezas lleva a una vista vacía, y se
 * asume a cambio de que el eje sea estable y predecible.
 */
export default function AudienciaFilter({
  active, keep, allLabel, filterAriaLabel, labels, locale,
}: AudienciaFilterProps) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label={filterAriaLabel}>
      <Link
        href={blogHref(locale, { ...keep, audiencia: null, page: null })}
        aria-current={!active ? 'page' : undefined}
        className={`inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
          !active ? 'bg-[#1A2F3F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {allLabel}
      </Link>
      {AUDIENCIAS.map((a) => (
        <Link
          key={a}
          href={blogHref(locale, { ...keep, audiencia: a, page: null })}
          aria-current={active === a ? 'page' : undefined}
          className={`inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
            active === a ? 'bg-[#5CE0D2] text-[#0F1923]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {labels[a] ?? a}
        </Link>
      ))}
    </nav>
  );
}
