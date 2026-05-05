import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

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
}

/**
 * Renders a breadcrumb trail with:
 *   - semantic <nav aria-label="Breadcrumb"> UI
 *   - schema.org BreadcrumbList JSON-LD for SEO
 *
 * The home item is inserted automatically (always first, linking to /{locale}).
 * Pass only the trail after home. Mark the current page by omitting `href`.
 */
export default function Breadcrumbs({
  items,
  locale,
  homeLabel,
  ariaLabel,
  baseUrl = 'https://propyte.com',
}: BreadcrumbsProps) {
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label={ariaLabel} className="bg-white border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-3">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs md:text-sm text-gray-600">
            {fullTrail.map((item, i) => {
              const isLast = i === fullTrail.length - 1;
              const isFirst = i === 0;
              return (
                <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <ChevronRight size={14} strokeWidth={2} className="text-gray-300 flex-shrink-0" aria-hidden="true" />
                  )}
                  {isLast || !item.href ? (
                    <span
                      className="font-semibold text-[#1A2F3F] truncate max-w-[220px] md:max-w-none"
                      aria-current="page"
                    >
                      {isFirst ? <Home size={14} strokeWidth={2} className="inline-block -mt-0.5" aria-hidden="true" /> : item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="hover:text-[#0F766E] transition-colors truncate max-w-[140px] md:max-w-[220px]"
                    >
                      {isFirst ? (
                        <Home size={14} strokeWidth={2} className="inline-block -mt-0.5" aria-hidden="true" />
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
