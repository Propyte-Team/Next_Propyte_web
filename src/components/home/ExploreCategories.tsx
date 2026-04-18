import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';

const categories = [
  {
    key: 'apartments',
    typeKey: 'departamento',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    query: 'type=departamento',
  },
  {
    key: 'penthouses',
    typeKey: 'penthouse',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop',
    query: 'type=penthouse',
  },
  {
    key: 'houses',
    typeKey: 'casa',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
    query: 'type=casa',
  },
  {
    key: 'land',
    typeKey: 'terreno',
    image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400&h=300&fit=crop',
    query: 'type=terreno',
  },
  {
    key: 'presale',
    typeKey: 'preventa',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop',
    query: 'stage=preventa',
  },
];

interface ExploreCategoriesProps {
  typeCounts?: Record<string, number>;
}

export default function ExploreCategories({ typeCounts }: ExploreCategoriesProps) {
  const t = useTranslations('explore');
  const locale = useLocale();

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#2C2C2C] mb-8">
          {t('title')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={`/${locale}/propiedades?${cat.query}`}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
            >
              <Image
                src={cat.image}
                alt={t(cat.key)}
                fill
                sizes="(max-width: 639px) 50vw, (max-width: 767px) 33vw, 20vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                <span className="text-white font-bold text-sm md:text-base drop-shadow-md">
                  {t(cat.key)}
                </span>
                {typeCounts && typeCounts[cat.typeKey] > 0 && (
                  <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
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
