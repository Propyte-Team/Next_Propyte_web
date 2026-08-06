import Link from 'next/link';
import { ChevronDown, X } from '@/lib/icons';
import { blogHref, type BlogUrlState } from '@/lib/blog/blog-urls';
import { PILARES, AUDIENCIAS, pilarPorCodigo } from '@/lib/blog/pilares';

/**
 * Barra de filtros del blog. Mismo lenguaje visual que la de `/desarrollos`
 * (`components/marketplace/FilterBar.tsx`): barra blanca con borde inferior,
 * pills de 40px con chevron, contador de resultados a la derecha y una fila de
 * chips activos con X debajo.
 *
 * ── Por qué NO se copió su implementación ─────────────────────────────────────
 * Aquella es un componente de cliente: los items son `<button>` con `onClick`, y
 * el panel solo existe en el DOM cuando está abierto. Aquí eso rompería la
 * crawlabilidad que se arregló deliberadamente en julio-2026: con botones el
 * rastreador solo alcanzaba las categorías que enlazaba el hero, y el resto de
 * las vistas filtradas eran inalcanzables sin JavaScript.
 *
 * La solución es `<details>`: da el desplegable sin una línea de JS y su
 * contenido vive en el HTML servido esté abierto o cerrado, así que cada opción
 * es un `<a href>` real que el rastreador sigue. Server component, como el resto
 * del listado.
 *
 * ── Dos ejes, no tres ─────────────────────────────────────────────────────────
 * Tema (pilar canónico) y Público (audiencia). `?categoria=` dejó de ofrecerse
 * como pill —sus valores "Para Asesores" y "Para Inversionistas" son literalmente
 * el eje de audiencia, y dos pills para lo mismo son dos URLs para el mismo
 * resultado— pero el PARAM SIGUE FUNCIONANDO: lo usan el "ver todos" de los hubs
 * viejos y cualquier URL ya indexada. Si llega activo, aparece como chip
 * quitable, no desaparece en silencio.
 */

interface BlogFilterBarProps {
  locale: string;
  /** Piezas publicadas por código de pilar, de `getBlogPilarCounts`. Ausente = 0. */
  pilarCounts: Record<string, number>;
  /** Estado activo, ya validado por `resolveBlogState`. */
  activePilar: string | null;
  activeAudiencia: string | null;
  activeCategory: string | null;
  total: number;
  labels: {
    tema: string;
    publico: string;
    allPilares: string;
    allAudiencias: string;
    pilares: Record<string, string>;
    /** Conteo ya redactado por pilar ("6 artículos"), para lector de pantalla. */
    pilarCounts: Record<string, string>;
    audiencias: Record<string, string>;
    articleCount: string;
    filtersAriaLabel: string;
    activeFilters: string;
    removeFilter: string;
    clearAll: string;
  };
}

const PILL_BASE =
  'h-10 px-4 flex items-center gap-1.5 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap cursor-pointer list-none';
const PILL_ON = 'bg-propyte-cyan-100 border-propyte-brand text-[#0E7490]';
const PILL_OFF = 'bg-white border-gray-300 text-[#2C2C2C] hover:border-gray-400';
const ITEM_BASE = 'block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors';
const ITEM_ON = 'bg-propyte-cyan-100 text-[#0E7490] font-semibold';
const ITEM_OFF = 'hover:bg-gray-50 text-[#2C2C2C]';

/**
 * Pill desplegable sin JS. `group` + `group-open:` mueve el chevron.
 *
 * El panel es `absolute`, así que la barra que lo contiene NO puede llevar
 * `overflow-x-auto`: por spec de CSS eso fuerza `overflow-y: clip` y el panel se
 * recorta —queda invisible aunque el chevron gire—. Es el mismo bug que el
 * 2026-05-23 obligó a portar el dropdown del marketplace a `body` con posición
 * fixed. Aquí se evita con `flex-wrap` en vez de scroll horizontal, que con dos
 * pills es de sobra.
 */
function PillDetails({
  label,
  activeLabel,
  children,
}: {
  label: string;
  activeLabel?: string;
  children: React.ReactNode;
}) {
  const isActive = Boolean(activeLabel);
  return (
    <details className="group relative flex-shrink-0">
      <summary className={`${PILL_BASE} ${isActive ? PILL_ON : PILL_OFF}`} aria-label={label}>
        {activeLabel || label}
        <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 top-full z-40 mt-2 min-w-[240px] rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
        <div className="max-h-72 space-y-1 overflow-y-auto">{children}</div>
      </div>
    </details>
  );
}

export default function BlogFilterBar({
  locale,
  pilarCounts,
  activePilar,
  activeAudiencia,
  activeCategory,
  total,
  labels,
}: BlogFilterBarProps) {
  // Estado que conserva cada enlace. La página se descarta siempre al cambiar un
  // filtro: la página 3 de un filtro rara vez existe en el siguiente.
  const keep: BlogUrlState = {
    category: activeCategory,
    pilar: activePilar ? pilarPorCodigo(activePilar)?.slug ?? null : null,
    audiencia: activeAudiencia,
  };

  const pilarActivo = activePilar ? pilarPorCodigo(activePilar) : null;

  // Los chips son SOLO para filtros que no tienen pill donde verse.
  //
  // La barra de /desarrollos repite en chips lo que ya dicen sus pills, y ahí
  // funciona porque son nueve filtros y el chip resume lo activo entre todos.
  // Con dos pills el chip diría exactamente lo mismo justo debajo: cada filtro
  // escrito dos veces. Un pill activo ya muestra su valor y se limpia desde su
  // propio desplegable.
  //
  // La categoría sí lo necesita: se retiró como pill pero el param sigue vivo
  // —lo usan el "ver todos" de los hubs viejos y las URLs ya indexadas—, así que
  // sin chip se estaría aplicando un filtro invisible.
  const chips: { key: string; label: string; href: string }[] = [];
  if (activeCategory) {
    chips.push({
      key: 'categoria',
      label: activeCategory,
      href: blogHref(locale, { ...keep, category: null, page: null }),
    });
  }

  const filtrosActivos = (pilarActivo ? 1 : 0) + (activeAudiencia ? 1 : 0) + (activeCategory ? 1 : 0);

  return (
    <div className="border-y border-gray-200 bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-3 md:px-6">
        <nav
          className="flex flex-wrap items-center gap-2"
          aria-label={labels.filtersAriaLabel}
        >
          {/* Tema — los SIETE pilares del maestro, tengan piezas o no.
              Antes solo se ofrecían los que tenían contenido, y el lector veía
              dos de siete: el mapa editorial quedaba oculto justo mientras se
              construye. Ahora se ofrecen todos con su conteo al lado, así que
              un tema vacío se reconoce ANTES de hacer clic y no después.
              La vista sin resultados no ensucia el índice: `generateMetadata`
              la marca `noindex, follow` y deja de hacerlo sola en cuanto el
              pilar publica su primera pieza. */}
          <PillDetails
            label={labels.tema}
            activeLabel={pilarActivo ? labels.pilares[pilarActivo.code] : undefined}
          >
            <Link
              href={blogHref(locale, { ...keep, pilar: null, page: null })}
              className={`${ITEM_BASE} ${!pilarActivo ? ITEM_ON : ITEM_OFF}`}
            >
              {labels.allPilares}
            </Link>
            {PILARES.map((p) => {
              const n = pilarCounts[p.code] ?? 0;
              const nombre = labels.pilares[p.code] ?? p.code;
              return (
                <Link
                  key={p.code}
                  href={blogHref(locale, { ...keep, pilar: p.slug, page: null })}
                  aria-current={activePilar === p.code ? 'page' : undefined}
                  aria-label={`${nombre} — ${labels.pilarCounts[p.code] ?? n}`}
                  className={`${ITEM_BASE} flex items-center justify-between gap-3 ${
                    activePilar === p.code ? ITEM_ON : ITEM_OFF
                  }`}
                >
                  <span>{nombre}</span>
                  {/* Sin piezas se atenúa en vez de desaparecer: el tema sigue
                      siendo parte del mapa y el 0 es la información útil. */}
                  <span
                    aria-hidden="true"
                    className={`text-xs tabular-nums ${n === 0 ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {n}
                  </span>
                </Link>
              );
            })}
          </PillDetails>

          {/* Público — catálogo cerrado de dos valores, siempre visible. */}
          <PillDetails
            label={labels.publico}
            activeLabel={activeAudiencia ? labels.audiencias[activeAudiencia] : undefined}
          >
            <Link
              href={blogHref(locale, { ...keep, audiencia: null, page: null })}
              className={`${ITEM_BASE} ${!activeAudiencia ? ITEM_ON : ITEM_OFF}`}
            >
              {labels.allAudiencias}
            </Link>
            {AUDIENCIAS.map((a) => (
              <Link
                key={a}
                href={blogHref(locale, { ...keep, audiencia: a, page: null })}
                aria-current={activeAudiencia === a ? 'page' : undefined}
                className={`${ITEM_BASE} ${activeAudiencia === a ? ITEM_ON : ITEM_OFF}`}
              >
                {labels.audiencias[a] ?? a}
              </Link>
            ))}
          </PillDetails>

          <div className="flex-1" />

          <span className="flex-shrink-0 whitespace-nowrap text-sm text-gray-600">
            {labels.articleCount}
          </span>
        </nav>

        {(chips.length > 0 || filtrosActivos > 1) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label={labels.activeFilters}>
            {chips.map((chip) => (
              <Link
                key={chip.key}
                href={chip.href}
                aria-label={`${labels.removeFilter}: ${chip.label}`}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-propyte-brand/40 bg-propyte-cyan-100 pl-3 pr-2 text-xs font-semibold text-[#0E7490] transition-colors hover:bg-propyte-cyan-200 hover:border-propyte-brand"
              >
                <span className="max-w-[180px] truncate">{chip.label}</span>
                <X size={12} strokeWidth={2.5} aria-hidden="true" />
              </Link>
            ))}
            {filtrosActivos > 1 && (
              <Link
                href={blogHref(locale)}
                className="inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#1A2F3F]"
              >
                {labels.clearAll}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
