import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';

const FALLBACK_CATEGORIES = [
  {
    key: 'apartments',
    typeKey: 'departamento',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=320&h=240&fit=crop&q=75',
    query: 'type=departamento',
  },
  {
    key: 'penthouses',
    typeKey: 'penthouse',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=320&h=240&fit=crop&q=75',
    query: 'type=penthouse',
  },
  {
    key: 'houses',
    typeKey: 'casa',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=320&h=240&fit=crop&q=75',
    query: 'type=casa',
  },
  {
    key: 'land',
    typeKey: 'terreno',
    image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=320&h=240&fit=crop&q=75',
    query: 'type=terreno',
  },
  {
    key: 'presale',
    typeKey: 'preventa',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=320&h=240&fit=crop&q=75',
    query: 'stage=preventa',
  },
];

// Cuando Hub provee override, cada card trae label resuelto y href absoluto
// (sin locale prefix — el sitio antepone /{locale}/).
export interface ExploreCategoryOverride {
  key: string;
  typeKey: string;
  label: string;
  image: string;
  href: string; // path sin locale, ej. "/propiedades?type=departamento"
}

interface ExploreCategoriesProps {
  typeCounts?: Record<string, number>;
  override?: ExploreCategoryOverride[] | null;
}

export default function ExploreCategories({ typeCounts, override }: ExploreCategoriesProps) {
  const t = useTranslations('explore');
  const locale = useLocale();

  // Normalizamos a una forma común para renderizar. Si Hub trae items, usamos
  // su label ya resuelto. Si no, caemos al fallback con t(cat.key) i18n.
  const items: Array<{
    key: string;
    typeKey: string;
    label: string;
    image: string;
    href: string;
  }> = override && override.length > 0
    ? override.map((c) => ({
        key: c.key,
        typeKey: c.typeKey,
        label: c.label,
        image: c.image,
        href: `/${locale}${c.href}`,
      }))
    : FALLBACK_CATEGORIES.map((c) => ({
        key: c.key,
        typeKey: c.typeKey,
        label: t(c.key),
        image: c.image,
        href: `/${locale}/propiedades?${c.query}`,
      }));

  // Brand: el título de la sección destaca la última palabra en cyan #A2F9FF
  // (mismo patrón que el hero — coherencia editorial en el home).
  const titleRaw = t('title');
  const splitMatch = titleRaw.match(/^(.*)\s(\S+)$/);
  const titleHead = splitMatch ? splitMatch[1] : titleRaw;
  const titleAccent = splitMatch ? splitMatch[2] : '';

  return (
    <section className="relative py-16 md:py-20 bg-[#0B1C1E] overflow-hidden">
      {/* Glow ambient — radial sutil del color brand para profundidad. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 80% 20%, rgba(162, 249, 255, 0.10), transparent 60%), radial-gradient(ellipse 45% 40% at 15% 85%, rgba(92, 224, 210, 0.06), transparent 65%)',
        }}
      />
      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {titleHead}
          {titleAccent && (
            <>
              {' '}
              <span className="text-[#A2F9FF]">{titleAccent}</span>
            </>
          )}
        </h2>
        <p className="text-white/70 text-base md:text-lg mb-8 max-w-2xl">{t('subtitle')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {items.map((cat) => (
            <Link
              key={cat.key}
              href={cat.href}
              // Audit 2026-05-15: radius reducido (antes 28/52px → 16/24px) para
              // que la imagen tenga más protagonismo y matchee el feel del
              // listado. Glass background detrás de la imagen suaviza el
              // contacto con el grid oscuro.
              className="group relative aspect-[4/3] rounded-2xl md:rounded-3xl overflow-hidden border border-white/15 bg-[rgba(72,115,121,0.40)] backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:border-[#A2F9FF]/50 hover:shadow-[0_12px_36px_rgba(162,249,255,0.20)] transition-all duration-300"
            >
              <Image
                src={cat.image}
                alt={cat.label}
                fill
                sizes="(max-width: 639px) 50vw, (max-width: 767px) 33vw, 20vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {/* Overlay aztec gradient — preserva legibilidad del label sobre
                  cualquier imagen de catálogo y se mantiene en cromaticidad brand. */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1C1E]/85 via-[#0B1C1E]/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                <span className="text-white font-bold text-sm md:text-base drop-shadow-md">
                  {cat.label}
                </span>
                {typeCounts && typeCounts[cat.typeKey] > 0 && (
                  <span className="bg-[#A2F9FF] text-[#0B1C1E] text-2xs font-bold px-2 py-0.5 rounded-full">
                    {typeCounts[cat.typeKey]}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
