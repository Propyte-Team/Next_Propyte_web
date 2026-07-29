'use client';

import Link from 'next/link';
import { LayoutGrid } from '@/lib/icons';
import { useLocale } from 'next-intl';

interface BlogHeroProps {
  t: {
    heroHeadLine1: string;
    heroHeadLine2: string;
    heroDescription: string;
    ctaAsesores: string;
    ctaInversionistas: string;
  };
  activeCategory?: string | null;
  /**
   * Categorías con al menos un artículo publicado. Un CTA hacia una categoría
   * vacía manda al lector al estado vacío desde el hero: pasó al poner en draft
   * los artículos con marcadores DATA-GATE, que dejó "Para Asesores" en cero.
   * `undefined` = no se pasó la lista → se muestran ambos (comportamiento previo).
   */
  availableCategories?: string[];
}

import { CAT_ASESORES, CAT_INVERSIONISTAS } from './categories';
import { blogHref } from '@/lib/blog/blog-urls';

export default function BlogHero({ t, activeCategory, availableCategories }: BlogHeroProps) {
  const locale = useLocale();
  const has = (cat: string) => !availableCategories || availableCategories.includes(cat);

  return (
    <section className="bg-[#0F1923] w-full py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#A2F9FF]/10 border border-[#A2F9FF]/30 text-[#A2F9FF] text-xs font-semibold tracking-widest uppercase mb-8">
          <LayoutGrid size={12} />
          Propyte Blog
        </div>

        {/* H1 */}
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
          <span className="text-white block">{t.heroHeadLine1}</span>
          <span className="text-[#A2F9FF] block">{t.heroHeadLine2}</span>
        </h1>

        {/* Description */}
        <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">
          {t.heroDescription}
        </p>

        {/* CTA filter buttons — el href sale de blogHref, igual que los chips y el
            canonical: con encodeURIComponent daban "Para%20Asesores" y los chips
            "Para+Asesores", o sea DOS URLs para el mismo contenido. */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {has(CAT_ASESORES) && (
            <Link
              href={blogHref(locale, { category: CAT_ASESORES })}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-all ${
                activeCategory === CAT_ASESORES
                  ? 'bg-[#A2F9FF] text-[#0F1923] shadow-lg shadow-[#A2F9FF]/20 ring-2 ring-white/30'
                  : 'bg-[#A2F9FF]/80 text-[#0F1923] hover:bg-[#A2F9FF]'
              }`}
            >
              {t.ctaAsesores}
            </Link>
          )}
          {has(CAT_INVERSIONISTAS) && (
            <Link
              href={blogHref(locale, { category: CAT_INVERSIONISTAS })}
              className={`px-6 py-3 rounded-full font-semibold text-sm border-2 transition-all ${
                activeCategory === CAT_INVERSIONISTAS
                  ? 'border-[#A2F9FF] bg-[#A2F9FF] text-[#0F1923]'
                  : 'border-[#A2F9FF] text-[#A2F9FF] hover:bg-[#A2F9FF] hover:text-[#0F1923]'
              }`}
            >
              {t.ctaInversionistas}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
