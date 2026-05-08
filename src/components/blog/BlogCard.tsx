'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Calendar } from 'lucide-react';
import type { BlogPost } from '@/lib/supabase/queries';
import { formatDateShort } from '@/lib/helpers/format-date';

interface BlogCardProps {
  post: BlogPost;
  locale: string;
  t: {
    minRead: string;
  };
  priority?: boolean;
}

export default function BlogCard({ post, locale, t, priority = false }: BlogCardProps) {
  const href = `/${locale}/blog/${post.slug}`;
  const date = formatDateShort(post.published_at, locale);

  return (
    <Link href={href} className="group block h-full">
      <article className="rounded-xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-shadow h-full flex flex-col">
        <div className="relative aspect-[16/10] overflow-hidden flex-none">
          {post.featured_image ? (
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={priority}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1A2F3F] to-[#5CE0D2]" />
          )}
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 text-xs font-semibold bg-[#5CE0D2] text-[#0F1923] rounded">
              {post.category}
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
            {date && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {date}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {post.read_time_min} {t.minRead}
            </span>
          </div>

          <h3 className="font-semibold text-[#1A2F3F] line-clamp-2 leading-snug group-hover:text-[#0F766E] transition-colors">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2 flex-1">{post.excerpt}</p>
          )}

          <div className="mt-3 flex items-center gap-2">
            {post.author_image ? (
              <Image
                src={post.author_image}
                alt={post.author_name}
                width={24}
                height={24}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#1A2F3F] flex items-center justify-center text-white text-2xs font-bold flex-none">
                {post.author_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs text-gray-600">{post.author_name}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
