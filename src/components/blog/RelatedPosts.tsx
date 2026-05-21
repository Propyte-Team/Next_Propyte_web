import Link from 'next/link';
import Image from 'next/image';
import { Clock } from '@/lib/icons';
import type { BlogPost } from '@/lib/supabase/queries';

interface RelatedPostsProps {
  posts: BlogPost[];
  locale: string;
  title: string;
  minRead: string;
}

export default function RelatedPosts({ posts, locale, title, minRead }: RelatedPostsProps) {
  if (!posts.length) return null;

  return (
    <section className="mt-12 pt-8 border-t border-gray-100">
      <h2 className="text-xl font-semibold text-[#1A2F3F] mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/${locale}/blog/${post.slug}`}
            className="group flex gap-3 items-start"
          >
            <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-none">
              {post.featured_image ? (
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  fill
                  sizes="80px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1A2F3F] to-[#5CE0D2]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-[#0E7490]">{post.category}</span>
              <h3 className="text-sm font-medium text-[#1A2F3F] line-clamp-2 mt-0.5 group-hover:text-[#0E7490] transition-colors">
                {post.title}
              </h3>
              <span className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                <Clock size={10} />
                {post.read_time_min} {minRead}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
