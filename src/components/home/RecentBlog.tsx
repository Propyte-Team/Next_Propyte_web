import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function RecentBlog() {
  const t = useTranslations('blog');
  const locale = useLocale();

  const articles = [
    {
      title: t('article1Title'),
      category: t('article1Category'),
      date: '2026-02-15',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop',
    },
    {
      title: t('article2Title'),
      category: t('article2Category'),
      date: '2026-02-08',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop',
    },
    {
      title: t('article3Title'),
      category: t('article3Category'),
      date: '2026-01-28',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=250&fit=crop',
    },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#2C2C2C]">{t('title')}</h2>
          <Link href="#" className="hidden md:flex items-center gap-1 text-[#5CE0D2] font-medium hover:underline">
            {t('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article, i) => (
            <Link key={i} href="#" className="group block">
              <article className="rounded-xl overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 639px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 text-xs font-semibold bg-[#5CE0D2] text-white rounded">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <time className="text-xs text-gray-400">{article.date}</time>
                  <h3 className="font-semibold text-[#2C2C2C] mt-1 line-clamp-2">{article.title}</h3>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
