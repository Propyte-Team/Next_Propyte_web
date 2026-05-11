'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { isDarkHeroRoute } from '@/shared/constants/dark-hero-routes';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  locale: string;
  homeLabel: string;
  ariaLabel: string;
  baseUrl?: string;
  /**
   * Override automático de variante por ruta. Útil cuando un hero específico
   * rompe la regla (e.g., una página light en lista de dark hero).
   */
  variant?: 'auto' | 'light' | 'dark';
}

/**
 * Renders a breadcrumb trail with:
 *   - semantic <nav aria-label="Breadcrumb"> UI
 *   - schema.org BreadcrumbList JSON-LD for SEO
 *   - bg transparente (hereda del padre) + texto adaptable según hero
 *
 * El home item se inserta automáticamente (siempre primero, link a /{locale}).
 * Pasa solo el resto del trail. Marca la página actual omitiendo `href`.
 *
 * Antes el wrapper tenía `bg-white border-b` que generaba un strip blanco
 * visible entre el header transparente y los heros oscuros (gap visual).
 * Ahora es transparente y el texto detecta dark/light por pathname.
 */
export default function Breadcrumbs({
  items,
  locale,
  homeLabel,
  ariaLabel,
  baseUrl = 'https://propyte.com',
  variant = 'auto',
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const isDark =
    variant === 'dark' || (variant === 'auto' && isDarkHeroRoute(pathname));

  const fullTrail: BreadcrumbItem[] = [
    { label: homeLabel, href: `/${locale}` },
    ...items,
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: fullTrail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${baseUrl}${item.href}` } : {}),
    })),
  };

  // Color tokens según variante. Dark hero → brand cyan (sobre fondo oscuro
  // cumple contraste); light → teal-a11y #0F766E que pasa WCAG AA sobre blanco.
  const trailText = isDark ? 'text-white/60' : 'text-gray-600';
  const linkHover = isDark ? 'hover:text-propyte-brand' : 'hover:text-[#0F766E]';
  const currentText = isDark ? 'text-white font-semibold' : 'font-semibold text-[#1A2F3F]';
  const sepColor = isDark ? 'text-white/30' : 'text-gray-300';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label={ariaLabel} className="bg-transparent">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-3">
          <ol className={`flex flex-wrap items-center gap-1.5 text-xs md:text-sm ${trailText}`}>
            {fullTrail.map((item, i) => {
              const isLast = i === fullTrail.length - 1;
              const isFirst = i === 0;
              return (
                <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <ChevronRight size={14} strokeWidth={2} className={`${sepColor} flex-shrink-0`} aria-hidden="true" />
                  )}
                  {isLast || !item.href ? (
                    <span
                      className={`${currentText} truncate max-w-[220px] md:max-w-none`}
                      aria-current="page"
                    >
                      {isFirst ? <Home size={14} strokeWidth={2} className="inline-block -mt-0.5" aria-hidden="true" /> : item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className={`${linkHover} inline-flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 px-1 -mx-1 transition-colors truncate max-w-[140px] md:max-w-[220px]`}
                    >
                      {isFirst ? (
                        <Home size={14} strokeWidth={2} aria-hidden="true" />
                      ) : (
                        item.label
                      )}
                      {isFirst && <span className="sr-only">{item.label}</span>}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}
