import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { assertPageVisible } from '@/lib/page-visibility';
import { VISIBILITY_KEYS } from '@/lib/visibility';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import ArticulosDePilar from '@/components/blog/ArticulosDePilar';
import { pilarPorCodigo } from '@/lib/blog/pilares';
import { ogLocaleImages } from '@/lib/og/images';

/**
 * Hub del pilar P6 (Producto: Costa y Branded).
 *
 * Carpeta ESTÁTICA a propósito, no un segmento `[pilar]`: así `/es/guias/x` da
 * 404 real por no matchear ruta, en vez de un 200 con el shell.
 *
 * A diferencia del hub de P1, este lleva encuadre PROPIO: cero de las diez piezas
 * del pilar existen todavía, y un índice sin hijos indexa la nada. El encuadre se
 * queda en nivel panorámico —qué es la ZOFEMAT, qué transmite la escritura y qué
 * no, dónde verificarlo— para no canibalizar P6-01, que es la pieza prioritaria
 * del pilar y la que desarrolla el tema a fondo.
 */

const PILAR = pilarPorCodigo('P6')!;

/** Los cinco bloques del cuerpo, en orden de lectura. */
const BLOQUES = [
  ['zofematTitle', 'zofematBody'],
  ['escrituraTitle', 'escrituraBody'],
  ['verificarTitle', 'verificarBody'],
  ['extranjeroTitle', 'extranjeroBody'],
  ['masAllaTitle', 'masAllaBody'],
] as const;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guias.costa' });
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
      siteName: 'Propyte',
      type: 'website',
      title: `${t('metaTitle')} | Propyte`,
      description: t('metaDescription'),
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: ogLocaleImages(locale),
    },
  };
}

export default async function GuiaCostaPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertPageVisible(VISIBILITY_KEYS.PAGE_GUIAS_COSTA);

  const [t, tb] = await Promise.all([
    getTranslations({ locale, namespace: 'guias.costa' }),
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

          <div className="mt-8 max-w-3xl space-y-8">
            {BLOQUES.map(([title, body]) => (
              <div key={title}>
                <h2 className="text-xl md:text-2xl font-bold text-[#1A2F3F]">{t(title)}</h2>
                <p className="mt-3 text-gray-700 leading-relaxed">{t(body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Con 0 piezas devuelve null: un hub cuyo pilar todavía no tiene artículos
          no muestra un módulo vacío. Es el comportamiento correcto, no un bug —
          crecerá cuando existan piezas clasificadas como P6. */}
      <ArticulosDePilar locale={locale} code="P6" />

      <section className="bg-gray-50 py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <nav className="flex flex-wrap gap-3">
            <Link href={`/${locale}/desarrollos`} className={pillClass}>
              {t('linkDesarrollos')}
            </Link>
            <Link href={`/${locale}/zonas`} className={pillClass}>
              {t('linkZonas')}
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
