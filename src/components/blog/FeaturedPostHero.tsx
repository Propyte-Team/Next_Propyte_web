import Link from 'next/link';
import Image from 'next/image';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/lib/supabase/queries';

interface FeaturedPostHeroProps {
  post: BlogPost;
  locale: string;
  t: {
    minRead: string;
    readMore: string;
    featured: string;
  };
}

function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

export default function FeaturedPostHero({ post, locale, t }: FeaturedPostHeroProps) {
  const href = `/${locale}/blog/${post.slug}`;

  return (
    <Link href={href} className="group block mb-10">
      <article className="rounded-2xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-shadow relative">
        <div className="relative aspect-[21/9] md:aspect-[3/1] overflow-hidden">
          {post.featured_image ? (
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              priority
              sizes="100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#5CE0D2]" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 text-xs font-semibold bg-[#5CE0D2] text-white rounded-full">
                {t.featured}
              </span>
              <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                {post.category}
              </span>
            </div>
            <h2 className="text-xl md:text-3xl font-bold leading-tight line-clamp-2 mb-3">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-sm md:text-base text-white/80 line-clamp-2 mb-4 hidden md:block">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-white/70">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(post.published_at, locale)}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {post.read_time_min} {t.minRead}
              </span>
              <span className="flex items-center gap-1 ml-auto text-[#5CE0D2] font-medium text-sm group-hover:underline">
                {t.readMore} <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
