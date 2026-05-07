import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { pickLang } from '@/lib/i18n/pickLang';
import { STAGE_MAP, STAGE_URL_SLUGS, STAGE_SLUGS_URL } from '../../_components/stageConfig';
import TaxonomyDevelopmentsPage from '../../_components/TaxonomyDevelopmentsPage';

export const revalidate = 3600;

export function generateStaticParams() {
  return STAGE_SLUGS_URL.map((stage) => ({ stage }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; stage: string }>;
}): Promise<Metadata> {
  const { locale, stage } = await params;
  const canonicalKey = STAGE_URL_SLUGS[stage];
  const info = canonicalKey ? STAGE_MAP[canonicalKey] : undefined;
  if (!info) return {};

  const isEn = locale === 'en';
  const term = isEn ? info.nameEn : info.nameEs;
  const title = isEn
    ? `Developments — ${term} | Riviera Maya & Yucatán`
    : `Desarrollos — ${term} | Riviera Maya y Yucatán`;
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
      canonical: `/${locale}/desarrollos/etapa/${stage}`,
      languages: {
        es: `/es/desarrollos/etapa/${stage}`,
        en: `/en/desarrollos/etapa/${stage}`,
        'x-default': `/es/desarrollos/etapa/${stage}`,
      },
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; stage: string }>;
}) {
  const { locale, stage } = await params;
  setRequestLocale(locale);

  const canonicalKey = STAGE_URL_SLUGS[stage];
  const info = canonicalKey ? STAGE_MAP[canonicalKey] : undefined;
  if (!info) notFound();

  const isEn = locale === 'en';
  const term = isEn ? info.nameEn : info.nameEs;
  const heading = isEn ? `Developments — ${term}` : `Desarrollos — ${term}`;

  return (
    <TaxonomyDevelopmentsPage
      locale={locale}
      termLabel={term}
      title={heading}
      subtitle={pickLang(locale, info.descEn, info.descEs)}
      filter={{ stage: info.slug }}
      canonicalPath={`/desarrollos/etapa/${stage}`}
    />
  );
}
