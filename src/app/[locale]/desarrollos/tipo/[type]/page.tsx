import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { pickLang } from '@/lib/i18n/pickLang';
import { TYPE_MAP, TYPE_SLUGS } from '../../_components/typeConfig';
import TaxonomyDevelopmentsPage from '../../_components/TaxonomyDevelopmentsPage';
import { ogLocaleImages } from '@/lib/og/images';

export const revalidate = 3600;

/**
 * Cualquier slug fuera de `TYPE_SLUGS` es un 404 del enrutador, no una página.
 *
 * Sin esto el `notFound()` de abajo SÍ se ejecutaba —el cuerpo que salía era
 * el del 404— pero la respuesta viajaba con **200**. Medido contra producción
 * el 2026-08-31: `/es/desarrollos/tipo/basura-inventada-xyz` daba 200 mientras
 * `/es/pagina-que-no-existe` daba 404 correctamente. Un soft-404 así deja que
 * los buscadores indexen páginas basura sin límite, y cada una diluye el peso
 * del sitio.
 *
 * `dynamicParams = false` mueve el rechazo al mismo sitio que ya devuelve un
 * 404 de verdad: el enrutador, antes de que la página llegue a renderizarse.
 * Es viable aquí y solo aquí porque la taxonomía es una lista cerrada que vive
 * en el código (`TYPE_SLUGS`), no un catálogo que crezca desde la base: las
 * rutas de contenido —`/desarrollos/<slug>`, `/zonas/<slug>`, `/blog/<slug>`—
 * tienen el mismo soft-404 y NO se arreglan así, porque ahí un slug nuevo debe
 * funcionar sin volver a compilar. Eso va en su propia tarjeta.
 */
export const dynamicParams = false;

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
      siteName: 'Propyte',
      type: 'website',
      title,
      description,
      locale: isEn ? 'en_US' : 'es_MX',
      alternateLocale: isEn ? 'es_MX' : 'en_US',
      images: ogLocaleImages(locale),
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
