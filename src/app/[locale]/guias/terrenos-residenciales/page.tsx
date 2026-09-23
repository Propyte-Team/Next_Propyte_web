import { getTranslations, setRequestLocale } from 'next-intl/server';
import { assertPageVisible } from '@/lib/page-visibility';
import { VISIBILITY_KEYS } from '@/lib/visibility';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import GuiaTerrenosForm from '@/components/forms/GuiaTerrenosForm';
import { CheckCircle2 } from '@/lib/icons';
import { ogLocaleImages } from '@/lib/og/images';
import { getTerrenosGuia } from '@/lib/supabase/guia-terrenos';
import {
  ComoLeerLaComparacion,
  NoHayUnMejorProyecto,
  PorQueCreceRivieraMaya,
  PorQueEstaGuia,
} from './_components/BloquesEstaticos';
import FichaProyecto from './_components/FichaProyecto';
import TablaComparativa from './_components/TablaComparativa';

/**
 * Guía comparativa de terrenos residenciales de la Riviera Maya.
 *
 * Carpeta ESTÁTICA a propósito, no un segmento `[slug]`: con segmento dinámico,
 * `/es/guias/lo-que-sea` matchea la ruta y Next suelta un 200 con el shell
 * antes de resolver el `notFound()` — el soft-404 documentado en
 * `guias/costa/page.tsx`. Con la carpeta, lo que no existe no matchea y el 404
 * es real.
 */

/** La ruta canónica, sin locale. Se usa en `canonical` y en los `hreflang`. */
const RUTA = '/guias/terrenos-residenciales';

const CONTENEDOR = 'mx-auto max-w-[1280px] px-4 md:px-6';

/**
 * ISR y no estático: los precios, las mensualidades y la disponibilidad salen
 * del inventario publicado, que cambia sin avisar. Una página estática
 * congelaría en el build cifras que la propia página promete «de hoy».
 */
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guias.terrenosResidenciales' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}${RUTA}`,
      languages: {
        es: `/es${RUTA}`,
        en: `/en${RUTA}`,
        'x-default': `/es${RUTA}`,
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

export default async function GuiaTerrenosResidencialesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertPageVisible(VISIBILITY_KEYS.PAGE_GUIAS_TERRENOS);

  const [t, tb, proyectos] = await Promise.all([
    getTranslations({ locale, namespace: 'guias.terrenosResidenciales' }),
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTerrenosGuia(),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://propyte.com';

  // Con menos de dos proyectos no hay comparación que publicar: ni fichas ni
  // tabla. Una «comparativa» de un solo proyecto no compara nada, es un
  // anuncio con encabezado de tabla. Es la misma decisión que ya toma
  // `ComparadorLotes` de la LP (`if (lotes.length < 2) return null`). El resto
  // de la página —encuadre, criterios, crecimiento, cierre y formulario— sigue
  // igual: el contenido editorial no depende del inventario.
  const hayComparacion = proyectos.length >= 2;

  // `cierreBullets` es un array en el diccionario, no cinco claves numeradas.
  // Se lee con `t.raw()`, el mismo patrón que `ProcessInfographic`,
  // `Testimonials` y `DevelopersPageContent`.
  const cierreBullets = t.raw('cierreBullets') as string[];

  return (
    <>
      <section className="bg-[#1A2F3F] py-14 text-white md:py-20">
        <div className={CONTENEDOR}>
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">{t('h1')}</h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/80 md:text-lg">
            {t('intro')}
          </p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.08em] text-white/60">
            {t('edicion')}
          </p>
        </div>
      </section>

      <section className="bg-white pt-8 md:pt-10">
        <div className={CONTENEDOR}>
          <Breadcrumbs
            items={[{ label: t('h1') }]}
            locale={locale}
            homeLabel={tb('home')}
            ariaLabel={tb('ariaLabel')}
            baseUrl={siteUrl}
          />
        </div>
      </section>

      <PorQueEstaGuia t={t} />

      <section className="bg-white pb-12 md:pb-16">
        <div className={CONTENEDOR}>
          <p className="max-w-3xl border-l-2 border-[#0E7490] bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-600">
            {t('monedaNota')}
          </p>
        </div>
      </section>

      {hayComparacion && (
        <section aria-labelledby="guia-proyectos" className="bg-gray-50 py-12 md:py-16">
          <div className={CONTENEDOR}>
            <h2 id="guia-proyectos" className="text-2xl font-bold text-[#1A2F3F] md:text-3xl">
              {t('proyectosTitle')}
            </h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-gray-700">{t('proyectosIntro')}</p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {proyectos.map((proyecto, indice) => (
                <FichaProyecto
                  key={proyecto.id}
                  proyecto={proyecto}
                  locale={locale}
                  t={t}
                  indice={indice}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {hayComparacion && (
        <section aria-labelledby="guia-tabla" className="bg-white py-12 md:py-16">
          <div className={CONTENEDOR}>
            <h2 id="guia-tabla" className="text-2xl font-bold text-[#1A2F3F] md:text-3xl">
              {t('tablaTitle')}
            </h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-gray-700">{t('tablaIntro')}</p>

            <div className="mt-8">
              <TablaComparativa proyectos={proyectos} locale={locale} t={t} />
            </div>
          </div>
        </section>
      )}

      <ComoLeerLaComparacion t={t} />

      <PorQueCreceRivieraMaya t={t} />

      <NoHayUnMejorProyecto t={t} />

      <section aria-labelledby="guia-cierre" className="bg-gray-50 py-12 md:py-16">
        <div className={CONTENEDOR}>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <h2 id="guia-cierre" className="text-2xl font-bold text-[#1A2F3F] md:text-3xl">
                {t('cierreTitle')}
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">{t('cierreBody')}</p>
              <ul className="mt-6 space-y-3">
                {cierreBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-gray-700">
                    <CheckCircle2
                      size={18}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-[#0E7490]"
                    />
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] md:p-6">
              <GuiaTerrenosForm />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-8 md:py-10">
        <div className={CONTENEDOR}>
          <p className="max-w-3xl text-xs leading-relaxed text-gray-500">{t('disclaimer')}</p>
        </div>
      </section>
    </>
  );
}
