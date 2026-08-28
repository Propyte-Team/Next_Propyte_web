import type { Metadata } from 'next';
import PaginaCasas from '../casas-riviera-maya/_pagina';
import { COPY_EN } from '../casas-riviera-maya/_copy';

// ============================================================
// Landing de casas — INGLÉS. Tráfico pagado de Estados Unidos y Canadá.
//
// ═══ POR QUÉ ESTA URL Y NO `/en/lp/casas-riviera-maya` ═══
//
// Porque `middleware.ts` salta `/lp/*` a propósito y lo deja fuera de
// `[locale]`: las landings de pago no heredan el chrome del sitio y no reciben
// prefijo de idioma. Colgar esta página de `/en/...` obligaría a meter `/lp` en
// el enrutado de next-intl, que arrastraría el layout del sitio a las tres
// landings de pago. El idioma va en el SLUG, que además es el que ve el
// visitante estadounidense debajo del anuncio.
//
// ═══ ES LA MISMA PÁGINA, NO UNA VERSIÓN REDUCIDA ═══
//
// Mismo componente, mismo inventario, mismo formulario. Lo único propio es el
// diccionario `COPY_EN`. Si alguien arregla el formulario, se arregla en los dos
// idiomas el mismo día — que es justo lo que no pasa cuando se duplica el árbol.
//
// ═══ LO QUE ESTA PÁGINA NO HACE ═══
//
//   · NO convierte precios a dólares. Dos casas se venden en USD y se publican
//     en USD; las demás en pesos, con el código de moneda impreso en cada
//     tarjeta. Un tipo de cambio aquí es una cifra que el asesor desmiente en la
//     primera llamada.
//   · NO explica el fideicomiso para extranjeros en zona restringida. Es la
//     primera duda real del comprador de fuera, y por eso mismo no cabe en una
//     página cuyo único trabajo es capturar el contacto: abrir un tema legal
//     pierde al visitante en la lectura. Va en la llamada.
//   · NO declara `hreflang` contra la versión española. Las dos son `noindex`
//     (lo pone el layout de `/lp`), así que no hay nada que reconciliar para
//     buscadores; el par de idiomas lo resuelve la segmentación de la campaña.
// ============================================================

// Mismo ISR que la española: comparten el dato, no tendría sentido que una
// enseñara un inventario más viejo que la otra.
export const revalidate = 300;

export const metadata: Metadata = {
  title: COPY_EN.meta.title,
  description: COPY_EN.meta.description,
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

export default function LandingHomesRivieraMaya() {
  return <PaginaCasas copy={COPY_EN} />;
}
