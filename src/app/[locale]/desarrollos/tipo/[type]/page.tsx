import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { pickLang } from '@/lib/i18n/pickLang';
import { TYPE_MAP, TYPE_SLUGS } from '../../_components/typeConfig';
import TaxonomyDevelopmentsPage from '../../_components/TaxonomyDevelopmentsPage';

export const revalidate = 3600;

export function generateStaticParams() {
  return TYPE_SLUGS.map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}): Promise<Metadata> {
  const { locale, type } = await params;
  const info = TYPE_MAP[type];
  if (!info) return {};

  const isEn = locale === 'en';
  const plural = isEn ? info.pluralEn : info.pluralEs;
  const title = isEn
    ? `${plural} for Sale | Pre-Sales in Riviera Maya & Yucatán`
    : `${plural} en Venta | Preventas en Riviera Maya y Yucatán`;
  const description = pickLang(locale, info.descEn, info.descEs);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: isEn ? 'en_US' : 'es_MX',
      alternateLocale: isEn ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
    },
    alternates: {
      canonical: `/${locale}/desarrollos/tipo/${type}`,
      languages: {
        es: `/es/desarrollos/tipo/${type}`,
        en: `/en/desarrollos/tipo/${type}`,
        'x-default': `/es/desarrollos/tipo/${type}`,
      },
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}) {
  const { locale, type } = await params;
  setRequestLocale(locale);

  const info = TYPE_MAP[type];
  if (!info) notFound();

  const isEn = locale === 'en';
  const plural = isEn ? info.pluralEn : info.pluralEs;
  const heading = isEn
    ? `${plural} in pre-sale and construction`
    : `${plural} en preventa y construcción`;

  return (
    <TaxonomyDevelopmentsPage
      locale={locale}
      termLabel={plural}
      title={heading}
      subtitle={pickLang(locale, info.descEn, info.descEs)}
      filter={{ type: info.slug }}
      canonicalPath={`/desarrollos/tipo/${type}`}
    />
  );
}
