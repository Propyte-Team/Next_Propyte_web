import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Clock } from 'lucide-react';

interface BlogPostCardProps {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: number;
  slug: string;
  coverImage?: string;
}

export default function BlogPostCard({
  title,
  excerpt,
  category,
  date,
  readTime,
  slug,
  coverImage,
}: BlogPostCardProps) {
  const locale = useLocale();

  return (
    <Link href={`/${locale}/blog/${slug}`} className="group block">
      <article className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
        {coverImage && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={coverImage}
              alt={title}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <div className="p-5">
          <span className="inline-block px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-[#0D9488]/10 text-[#0D9488] mb-3">
            {category}
          </span>
          <h3 className="text-lg font-bold text-[#2C2C2C] mb-2 line-clamp-2 group-hover:text-[#5CE0D2] transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{excerpt}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{date}</span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {readTime} min
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
