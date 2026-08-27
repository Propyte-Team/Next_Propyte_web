import type { ImagenesLanding } from '@/lib/supabase/lp-lotes';
import FiguraTerrenos from './FiguraTerrenos';
import { Reveal } from './motion';
import type { IndiceLaminas } from './laminas';

// ============================================================
// HOY, AL LADO DE PROYECTADO.
//
// Dos láminas y una línea de texto. Es la sección más corta de la página y
// probablemente la que más trabaja.
//
// ═══ QUÉ PROBLEMA RESUELVE, EN CONVERSIÓN ═══
//
// Quien busca «terrenos en playa del carmen» tiene dos preguntas y la segunda
// no aparece en ningún formulario: «¿qué me están vendiendo exactamente?».
// Antes de esto, entre el titular y el plan de pagos no había una sola imagen
// del sitio. Las cifras contestaban cuánto; nada contestaba qué.
//
// ═══ Y POR QUÉ EN ESTE ORDEN ═══
//
// La fotografía real va PRIMERO y a la izquierda. Es tierra: vialidades
// trazadas, lotes delimitados, sin urbanizar. Poner el render primero y la
// fotografía después convierte la foto en una matización incómoda; ponerla
// primero convierte el render en lo que es, una proyección.
//
// Esto es también lo único que el competidor de referencia no puede hacer: su
// galería es de obra entregada, y publica treinta imágenes sin una sola de
// cómo se ve el terreno el día que firmas. Aquí la honestidad no es un freno
// a la conversión, es el argumento diferencial — y encima es el par de
// imágenes que la persona pediría en el primer mensaje de WhatsApp.
// ============================================================

export default function EstadoDelSitio({
  imagenes,
  laminas,
  numeroSeccion,
  superficieTexto,
  disponibles,
  totales,
}: {
  imagenes: ImagenesLanding;
  laminas: IndiceLaminas;
  numeroSeccion: string;
  /** Superficie ya formateada con «m²» por el llamador. */
  superficieTexto: string | null;
  /** Declarados por el desarrollador. Ver la regla 2 de `page.tsx`. */
  disponibles: number | null;
  totales: number | null;
}) {
  const hoy = imagenes.urbanizacion;
  const proyectado = imagenes.casasCenital;
  if (!hoy && !proyectado) return null;

  // Vendidos = declarados menos disponibles. No es scarcity inventada: es
  // resta. Y no se dramatiza — 81 de 310 es tracción, no «últimos lugares».
  const vendidos =
    disponibles !== null && totales !== null && totales >= disponibles
      ? totales - disponibles
      : null;

  return (
    <section className="border-t border-[var(--lpt-linea-fuerte)] bg-[var(--lpt-abismo)]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <p className="lpt-rotulo text-[var(--lpt-estaca)]">{numeroSeccion} · El sitio</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="lpt-titular mt-4 max-w-[26ch] text-[clamp(1.875rem,1.4rem+2.2vw,3rem)] text-[var(--lpt-claro)]">
            Así está hoy y así está proyectado
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:gap-12">
          {hoy && (
            /* Sin `Reveal`: es una imagen, no puede depender de JS para verse.
               Ver el comentario del mosaico en `Privada.tsx`. */
            <div className="lpt-lamina-entra">
              <FiguraTerrenos
                imagen={hoy}
                lamina={laminas.urbanizacion ?? 'FIG.'}
                rotulo="Hoy · fotografía"
                aspecto="aspect-[4/3]"
                sizes="(min-width: 1024px) 540px, (min-width: 640px) 50vw, 100vw"
              />
            </div>
          )}
          {proyectado && (
            <div className="lpt-lamina-entra">
              <FiguraTerrenos
                imagen={proyectado}
                lamina={laminas.casasCenital ?? 'FIG.'}
                rotulo="Proyectado · render"
                aspecto="aspect-[4/3]"
                sizes="(min-width: 1024px) 540px, (min-width: 640px) 50vw, 100vw"
              />
            </div>
          )}
        </div>

        <Reveal delay={0.08}>
          <div className="mt-12 grid gap-8 border-t border-[var(--lpt-linea-fuerte)] pt-8 lg:grid-cols-12 lg:gap-12">
            <p className="lpt-cuerpo max-w-[58ch] text-[1.0625rem] leading-relaxed text-[var(--lpt-claro-2)] lg:col-span-7">
              Lo que se compra es el terreno
              {superficieTexto ? ` de ${superficieTexto}` : ''}, no la casa. La
              casa la construyes tú, cuando quieras y con quien quieras, dentro
              de lo que permite el reglamento del fraccionamiento. La segunda
              lámina es el proyecto del desarrollador para lotes ya
              construidos: sirve para ver qué cabe, no para prometer que viene
              incluido.
            </p>

            {vendidos !== null && (
              <div className="lg:col-span-5 lg:justify-self-end lg:text-right">
                <p className="lpt-titular text-[clamp(2.25rem,1.4rem+3.4vw,3.5rem)] text-[var(--lpt-estaca)]">
                  {vendidos}
                </p>
                <p className="lpt-cota mt-1 text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--lpt-claro-3)]">
                  lotes ya vendidos de {totales}
                </p>
                <p className="lpt-cuerpo mt-3 max-w-[34ch] text-[0.8125rem] leading-relaxed text-[var(--lpt-claro-3)] lg:ml-auto">
                  Cifras declaradas por el desarrollador, no un contador que
                  baja solo.
                </p>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
