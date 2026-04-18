import { redirect } from 'next/navigation';

export default async function NosotrosRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/nosotros/quienes-somos`);
}
