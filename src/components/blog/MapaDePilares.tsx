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
    <section className="bg-gray-50 py-12 md:py-16">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <h2 className="text-2xl font-bold text-[#1A2F3F]">{title}</h2>
        <p className="mt-2 text-gray-700">{body}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PILARES.map((p) => (
            <li key={p.code}>
              <Link
                href={pilarHubHref(locale, p)}
                className="flex items-center min-h-[44px] px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-[#1A2F3F] hover:border-[#5CE0D2] hover:text-[#0E7490] transition-colors"
              >
                {labels[p.code] ?? p.code}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
