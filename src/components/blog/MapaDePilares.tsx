import Link from 'next/link';
import { PILARES, pilarHubHref } from '@/lib/blog/pilares';

/**
 * Los siete hubs de pilar, enlazados siempre.
 *
 * Deliberadamente independiente de si el pilar tiene artículos: los chips del
 * filtro derivan de lo publicado —hoy, un solo pilar— y sin este bloque seis de
 * los siete hubs no tendrían ningún enlace desde el blog.
 *
 * Enlaza al HUB, no a una vista filtrada, justo para no multiplicar URLs
 * indexables sin contenido. Es la diferencia entre "aquí está la guía del pilar"
 * y "aquí está una lista vacía filtrada por el pilar".
 */
export default function MapaDePilares({
  locale,
  title,
  body,
  labels,
}: {
  locale: string;
  title: string;
  body: string;
  labels: Record<string, string>;
}) {
  return (
    <section className="px-4 lg:px-10 py-[72px] lg:py-28 border-t border-black/10 text-[#13222C]">
      <div className="grid lg:grid-cols-[400px_minmax(0,1fr)] gap-8 lg:gap-16">
        <div>
          <h2 className="font-display text-[30px] lg:text-[clamp(28px,3vw,40px)] leading-[1.05] font-semibold tracking-[-0.03em]">{title}</h2>
          <p className="mt-4 text-[#5B6B74] max-w-[340px]">{body}</p>
        </div>
        <ul className="grid sm:grid-cols-2 gap-x-10 border-t border-black/10">
          {PILARES.map((p) => (
            <li key={p.code} className="border-b border-black/10">
              <Link
                href={pilarHubHref(locale, p)}
                className="group flex items-center justify-between gap-4 min-h-[60px] py-4 font-display text-[17px] lg:text-[19px] font-semibold tracking-[-0.015em] hover:text-[#0E7490] transition-colors"
              >
                {labels[p.code] ?? p.code}
                <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
