import { setRequestLocale } from 'next-intl/server';
import CityDevelopmentsPage from '../_components/CityDevelopmentsPage';
import { buildCityMetadata } from '../_components/buildCityMetadata';

export const revalidate = 3600;

const CITY_SLUG = 'cancun';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildCityMetadata(CITY_SLUG, locale);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CityDevelopmentsPage locale={locale} citySlug={CITY_SLUG} />;
}
