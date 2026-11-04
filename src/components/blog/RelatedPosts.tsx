import Link from 'next/link';
import type { BlogPost } from '@/lib/supabase/queries';
import { categoryLabel } from '@/lib/blog/category-labels';
import { formatDateShort } from '@/lib/helpers/format-date';

interface RelatedPostsProps {
  posts: BlogPost[];
  locale: string;
  title: string;
  minRead: string;
}

/**
 * "Sigue leyendo" v3: tres columnas de texto separadas por filetes, sin
 * portadas (son ilustraciones generadas; ver BlogIndexV3).
 */
export default function RelatedPosts({ posts, locale, title, minRead }: RelatedPostsProps) {
  if (!posts.length) return null;

  return (
    <section aria-labelledby="related-title" className="px-4 lg:px-10 pt-12 lg:pt-16 pb-[72px] lg:pb-28 border-t border-black/10">
      <h2 id="related-title" className="font-display text-[30px] lg:text-[clamp(30px,3.4vw,48px)] leading-[1.04] font-semibold tracking-[-0.035em] text-[#13222C]">{title}</h2>
      <div className="mt-8 lg:mt-12 grid grid-cols-1 md:grid-cols-3 border-t border-black/10 md:border-t-0">
        {posts.map((post, i) => (
          <Link
            key={post.id}
            href={`/${locale}/blog/${post.slug}`}
            className={`group block py-6 md:py-0 md:pt-6 border-b md:border-b-0 md:border-t border-black/10 ${i > 0 ? 'md:pl-8 md:border-l' : ''} md:pr-8`}
          >
            <span className="block text-[13px] text-[#5B6B74]">
              <b className="text-[#0E7490] font-semibold">{categoryLabel(post.category, locale)}</b> · {formatDateShort(post.published_at, locale)}
            </span>
            <span className="block mt-2 font-display text-[20px] lg:text-[23px] leading-[1.22] font-semibold tracking-[-0.02em] text-[#13222C] group-hover:text-[#0E7490] transition-colors">
              {post.title}
            </span>
            <span className="block mt-3 text-[13px] text-[#5B6B74]">{post.read_time_min} {minRead} →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
