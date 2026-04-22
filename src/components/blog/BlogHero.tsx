'use client';

import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
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
}

export const CAT_ASESORES = 'Para Asesores';
export const CAT_INVERSIONISTAS = 'Para Inversionistas';

export default function BlogHero({ t, activeCategory }: BlogHeroProps) {
  const locale = useLocale();

  return (
    <section className="bg-[#0F1923] w-full py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5CE0D2]/10 border border-[#5CE0D2]/30 text-[#5CE0D2] text-xs font-semibold tracking-widest uppercase mb-8">
          <LayoutGrid size={12} />
          Propyte Blog
        </div>

        {/* H1 */}
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
          <span className="text-white block">{t.heroHeadLine1}</span>
          <span className="text-[#5CE0D2] block">{t.heroHeadLine2}</span>
        </h1>

        {/* Description */}
        <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">
          {t.heroDescription}
        </p>

        {/* CTA filter buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/${locale}/blog?categoria=${encodeURIComponent(CAT_ASESORES)}`}
            className={`px-6 py-3 rounded-full font-semibold text-sm transition-all ${
              activeCategory === CAT_ASESORES
                ? 'bg-[#5CE0D2] text-[#0F1923] shadow-lg shadow-[#5CE0D2]/20 ring-2 ring-white/30'
                : 'bg-[#5CE0D2]/80 text-[#0F1923] hover:bg-[#5CE0D2]'
            }`}
          >
            {t.ctaAsesores}
          </Link>
          <Link
            href={`/${locale}/blog?categoria=${encodeURIComponent(CAT_INVERSIONISTAS)}`}
            className={`px-6 py-3 rounded-full font-semibold text-sm border-2 transition-all ${
              activeCategory === CAT_INVERSIONISTAS
                ? 'border-[#5CE0D2] bg-[#5CE0D2] text-[#0F1923]'
                : 'border-[#5CE0D2] text-[#5CE0D2] hover:bg-[#5CE0D2] hover:text-[#0F1923]'
            }`}
          >
            {t.ctaInversionistas}
          </Link>
        </div>
      </div>
    </section>
  );
}
