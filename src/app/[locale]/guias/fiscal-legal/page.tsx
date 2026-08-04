import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { assertPageVisible } from '@/lib/page-visibility';
import { VISIBILITY_KEYS } from '@/lib/visibility';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import ArticulosDePilar from '@/components/blog/ArticulosDePilar';
import { pilarPorCodigo } from '@/lib/blog/pilares';

/**
 * Hub del pilar P1 (Fiscal y Legal).
 *
 * Carpeta ESTÁTICA a propósito, no un segmento `[pilar]`: así `/es/guias/x` da
 * 404 real por no matchear ruta, en vez de un 200 con el shell. En este sitio las
 * rutas dinámicas flushean shell con 200 antes de resolver `notFound()`, así que
 * un hub dinámico convertiría cada pilar inexistente en una página viva vacía.
 *
 * Índice curado: presenta el pilar y manda a sus piezas. NO reexplica ISR, ISAI
 * ni fideicomiso — cada pieza es dueña de su tema, y duplicar aquí sería
 * competirle a su propio hijo por la misma intención. Al no emitir ninguna
 * afirmación fiscal nueva, esta página no necesita revisor YMYL nombrado y no
 * queda bloqueada por el fiscalista pendiente (bloqueo #1 del maestro).
 */

const PILAR = pilarPorCodigo('P1')!;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guias.fiscalLegal' });
  const path = PILAR.hubs[0];

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {
        es: `/es${path}`,
        en: `/en${path}`,
        'x-default': `/es${path}`,
      },
    },
    openGraph: {
      type: 'website',
      title: `${t('metaTitle')} | Propyte`,
      description: t('metaDescription'),
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
    },
  };
}

export default async function GuiaFiscalLegalPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertPageVisible(VISIBILITY_KEYS.PAGE_GUIAS_FISCAL_LEGAL);

  const [t, tb] = await Promise.all([
    getTranslations({ locale, namespace: 'guias.fiscalLegal' }),
    getTranslations({ locale, namespace: 'breadcrumbs' }),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://propyte.com';
  const pillClass =
    'inline-flex items-center min-h-[44px] px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-[#0E7490] hover:bg-gray-100 transition-colors';

  return (
    <>
      <section className="bg-[#1A2F3F] text-white py-14 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">{t('h1')}</h1>
          <p className="mt-5 max-w-3xl text-base md:text-lg text-white/80 leading-relaxed">
            {t('intro')}
          </p>
        </div>
      </section>

      <section className="bg-white py-10 md:py-14">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <Breadcrumbs
            items={[{ label: t('h1') }]}
            locale={locale}
            homeLabel={tb('home')}
            ariaLabel={tb('ariaLabel')}
            baseUrl={siteUrl}
          />

          <div className="mt-8 grid gap-8 md:grid-cols-2 max-w-4xl">
            <div>
              <h2 className="text-xl font-bold text-[#1A2F3F]">{t('comoLeerTitle')}</h2>
              <p className="mt-3 text-gray-700 leading-relaxed">{t('comoLeerBody')}</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1A2F3F]">{t('avisoTitle')}</h2>
              <p className="mt-3 text-gray-700 leading-relaxed">{t('avisoBody')}</p>
            </div>
          </div>
        </div>
      </section>

      <ArticulosDePilar locale={locale} code="P1" />

      <section className="bg-gray-50 py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl font-bold text-[#1A2F3F]">{t('relacionadosTitle')}</h2>
          <p className="mt-3 max-w-3xl text-gray-700 leading-relaxed">{t('relacionadosBody')}</p>
          <nav className="mt-6 flex flex-wrap gap-3">
            <Link href={`/${locale}/como-comprar`} className={pillClass}>
              {t('linkComoComprar')}
            </Link>
            <Link href={`/${locale}/financiamiento`} className={pillClass}>
              {t('linkFinanciamiento')}
            </Link>
            <Link href={`/${locale}/mercado`} className={pillClass}>
              {t('linkMercado')}
            </Link>
          </nav>
        </div>
      </section>
    </>
  );
}
