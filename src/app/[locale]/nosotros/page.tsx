import { notFound, redirect } from 'next/navigation';
import { getVisibility, isVisible, VISIBILITY_KEYS } from '@/lib/visibility';

export default async function NosotrosRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const visibility = await getVisibility();
  const order: Array<{ slug: string; key: string }> = [
    { slug: 'quienes-somos', key: VISIBILITY_KEYS.NOSOTROS_QUIENES_SOMOS },
    { slug: 'estructura', key: VISIBILITY_KEYS.NOSOTROS_ESTRUCTURA },
  ];
  const first = order.find((t) => isVisible(visibility, t.key));
  if (!first) notFound();
  redirect(`/${locale}/nosotros/${first.slug}`);
}
