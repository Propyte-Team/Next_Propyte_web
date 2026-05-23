import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { ArrowRight, Tag } from '@/lib/icons';
import MarketplaceCard from '@/components/marketplace/MarketplaceCard';
import type { Property } from '@/types/property';

interface Props {
  /** Unidades con descuento activo. Filtradas server-side por v_units.is_discount_active. */
  units: Property[];
}

/**
 * Sección home post-destacados: showcase de unidades con descuento activo.
 * Reusa MarketplaceCard para no duplicar diseño/badge/strikethrough. Se monta
 * sólo cuando hay ≥3 items; debajo de eso no aporta visualmente y queda
 * desbalanceada con el grid 3-col.
 *
 * Source: queries.getDiscountedUnits() → mapper unit-to-property emite
 * `property.discount` y `priceOriginal` para que la card render el patrón
 * brand cyan strikethrough + badge %.
 */
export default async function DiscountedUnitsSection({ units }: Props) {
  const t = await getTranslations('discountedSection');
  const locale = await getLocale();

  const items = units.slice(0, 6);
  if (items.length < 3) return null;

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between mb-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0E7490]/10 border border-[#0E7490]/30 rounded-full mb-2">
              <Tag size={12} strokeWidth={2.25} className="text-[#0E7490]" />
              <span className="text-[#0E7490] text-2xs font-bold tracking-[0.18em] uppercase">
                {t('eyebrow')}
              </span>
            </div>
            <h2 className="text-base md:text-xl font-bold text-[#2C2C2C] leading-tight tracking-tight">
              {t('title')}
            </h2>
            <p className="text-gray-600 mt-1">{t('subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/promociones`}
            className="hidden md:flex items-center gap-1.5 text-[#0E7490] font-semibold hover:underline"
          >
            {t('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((unit, i) => (
            <MarketplaceCard key={unit.id} property={unit} priority={i < 3} variant="grid" />
          ))}
        </div>

        {/* Link mobile (el desktop está en el header) */}
        <div className="mt-6 md:hidden text-center">
          <Link
            href={`/${locale}/promociones`}
            className="inline-flex items-center gap-1.5 text-[#0E7490] font-semibold hover:underline"
          >
            {t('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
