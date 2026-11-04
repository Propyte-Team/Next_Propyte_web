import Image from 'next/image';
import Link from 'next/link';
import type { BlogPost } from '@/lib/supabase/queries';
import { categoryLabel } from '@/lib/blog/category-labels';
import { formatDateShort } from '@/lib/helpers/format-date';

export interface BlogRowAuthor {
  name: string;
  role: string | null;
}

interface Labels {
  minutes: (n: number) => string;
  featured: string;
  latest: string;
}

/**
 * Fila del índice v3: sin portada. Las portadas del blog son ilustraciones
 * generadas y eran justo lo que hacía ver el sitio "hecho con IA"; aquí el
 * peso lo llevan el titular en Archivo, la categoría y la fecha.
 */
export function BlogRowV3({ post, locale, labels, author }: { post: BlogPost; locale: string; labels: Labels; author?: BlogRowAuthor }) {
  return (
    <Link
      href={`/${locale}/blog/${post.slug}`}
      className="group grid grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[220px_minmax(0,1fr)_auto] gap-x-6 lg:gap-x-10 gap-y-2 items-start py-6 lg:py-8 border-b border-black/10"
    >
      <span className="col-span-2 lg:col-span-1 text-[13px] text-[#5B6B74] lg:pt-1.5">
        <b className="text-[#0E7490] font-semibold">{categoryLabel(post.category, locale)}</b>
        <span className="lg:block lg:mt-1"> · {formatDateShort(post.published_at, locale)}</span>
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[20px] lg:text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#13222C] group-hover:text-[#0E7490] transition-colors">
          {post.title}
        </span>
        {post.excerpt && (
          <span className="block mt-2 text-[15px] lg:text-[16px] leading-[1.55] text-[#5B6B74] max-w-[70ch] line-clamp-2">{post.excerpt}</span>
        )}
        <span className="block mt-3 text-[13px] text-[#5B6B74]">
          {author?.name ? `${author.name} · ` : ''}{labels.minutes(post.read_time_min)}
        </span>
      </span>
      <span aria-hidden="true" className="text-xl text-[#13222C] lg:pt-1 transition-transform duration-300 group-hover:translate-x-2">→</span>
    </Link>
  );
}

/**
 * Nota destacada + "Lo más reciente", mismo esquema que el bloque de blog del
 * home v3. La foto es de un desarrollo real (de la ciudad del artículo cuando
 * la hay), no la portada generada del post.
 */
export function BlogLeadV3({
  lead,
  photo,
  latest,
  locale,
  labels,
  authors,
}: {
  lead: BlogPost;
  photo: string | null;
  latest: BlogPost[];
  locale: string;
  labels: Labels;
  authors: Record<string, BlogRowAuthor>;
}) {
  const href = (slug: string) => `/${locale}/blog/${slug}`;
  return (
    <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-10 lg:gap-[clamp(40px,5vw,72px)] items-start">
      <Link href={href(lead.slug)} className="group block">
        <div className="relative aspect-[16/10] rounded-md overflow-hidden bg-[#D9E0E3]">
          {photo && (
            <Image src={photo} alt="" fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]" />
          )}
        </div>
        <div className="mt-5 lg:mt-6 flex flex-wrap items-center gap-2.5 text-[13px] text-[#5B6B74]">
          <span className="bg-[#0F1923] text-white font-semibold px-2 py-[3px] rounded">{labels.featured}</span>
          <b className="text-[#0E7490] font-semibold">{categoryLabel(lead.category, locale)}</b>
          <span>{formatDateShort(lead.published_at, locale)} · {labels.minutes(lead.read_time_min)}</span>
        </div>
        <h2 className="mt-3 font-display text-[28px] lg:text-[clamp(30px,3.2vw,46px)] leading-[1.06] font-semibold tracking-[-0.03em] text-[#13222C] max-w-[22ch]">{lead.title}</h2>
        {lead.excerpt && <p className="mt-3.5 text-[16px] lg:text-[18px] leading-[1.55] text-[#5B6B74] max-w-[620px]">{lead.excerpt}</p>}
        {authors[lead.id]?.name && <p className="mt-4 text-[14px] text-[#5B6B74]">{authors[lead.id].name}{authors[lead.id].role ? `, ${authors[lead.id].role}` : ''}</p>}
      </Link>
      {latest.length > 0 && (
        <div>
          <p className="font-display text-sm font-medium text-[#5B6B74] pb-4 border-b border-black/10">{labels.latest}</p>
          {latest.map((p) => (
            <Link key={p.id} href={href(p.slug)} className="group grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center py-5 lg:py-[22px] border-b border-black/10">
              <span>
                <span className="block text-[13px] text-[#5B6B74]"><b className="text-[#0E7490] font-semibold">{categoryLabel(p.category, locale)}</b> · {formatDateShort(p.published_at, locale)} · {labels.minutes(p.read_time_min)}</span>
                <span className="block mt-1.5 font-display text-lg lg:text-[21px] leading-[1.25] font-semibold tracking-[-0.015em] text-[#13222C] group-hover:text-[#0E7490] transition-colors">{p.title}</span>
              </span>
              <span aria-hidden="true" className="text-xl transition-transform duration-300 group-hover:translate-x-2">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
