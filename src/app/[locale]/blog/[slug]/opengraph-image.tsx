import { ImageResponse } from 'next/og';
import { loadOGFonts } from '@/lib/og/fonts';
import OGFrame from '@/lib/og/OGFrame';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getBlogPost } from '@/lib/supabase/queries';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const fonts = loadOGFonts();

  let title = 'Blog | Propyte';
  let location = '';
  let badge = '';
  let imageUrl = '';

  try {
    const supabase = createPublicSupabaseClient();
    if (supabase) {
      const post = await getBlogPost(supabase, slug, locale);
      if (post) {
        title = post.title;
        location = post.category;
        badge = locale === 'en'
          ? `${post.read_time_min} min read`
          : `${post.read_time_min} min de lectura`;
        imageUrl = post.featured_image ?? '';
      }
    }
  } catch { /* render with defaults */ }

  return new ImageResponse(
    <OGFrame title={title} location={location} badge={badge} imageUrl={imageUrl} />,
    { ...size, fonts }
  );
}
