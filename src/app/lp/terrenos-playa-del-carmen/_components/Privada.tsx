import type { ImagenesLanding } from '@/lib/supabase/lp-lotes';
import FiguraTerrenos from './FiguraTerrenos';
import { Escalon, Escalonado, Reveal } from './motion';
import { ORDEN_MOSAICO, type IndiceLaminas } from './laminas';

// ============================================================
// LA PRIVADA, EN IMÁGENES — y la leyenda que las amarra a un dato.
//
// ═══ EL PROBLEMA QUE RESUELVE ═══
//
// Esta variante se publicó con UNA imagen. Después del primer pliegue eran
// cuatro pantallas de tipografía y cifras sobre verde: correcto, medido,
// verificable, y absolutamente abstracto. Alguien que busca «terrenos en playa
// del carmen» quiere VER el sitio antes de dar su teléfono, y no había nada que
// ver. El competidor de referencia publica más de treinta imágenes.
//
// ═══ POR QUÉ NO ES UNA REJILLA DE ICONITOS ═══
//
// El patrón de la categoría es 11 amenidades con su icono redondeado y ni una
// prueba de que existan. Aquí cada amenidad sale de una COLUMNA BOOLEANA del
// registro del desarrollo, y la que además tiene render lo referencia por
// número de lámina, como la leyenda de un plano referencia sus figuras. La que
// no tiene render se publica igual, pero SIN referencia: se ve a simple vista
// cuáles hay que creernos y cuáles se pueden mirar.
//
// ⚠️ EL EMPAREJAMIENTO NO SE ADIVINA. `PRUEBA_VISUAL` es lista blanca sobre el
// nombre normalizado de la amenidad. Una amenidad que el Hub empiece a declarar
// mañana aparece en la leyenda sin lámina, que es lo correcto: es infinitamente
// mejor que emparejarla por parecido con una imagen que muestra otra cosa.
//
// ═══ TODO ES RENDER, Y SE DICE ═══
//
// Doce de las trece láminas son renders del desarrollador y la privada no está
// construida. `FiguraTerrenos` lo rotula una por una, y el rótulo va DENTRO de
// la lámina. Ver también el pie de la sección.
// ============================================================

/**
 * Amenidad declarada → lámina que la prueba. Clave = nombre normalizado (sin
 * acentos, minúsculas), porque el catálogo escribe «Área de Niños» y
 * «Seguridad 24h» con grafía humana.
 *
 * Deliberadamente INCOMPLETO: CCTV, Pet Zone, Área de Niños y Seguridad 24h no
 * tienen render propio en la galería y se quedan sin referencia. No se les
 * asigna una imagen «parecida».
 *
 * ⚠️ «Acceso Controlado» TAMPOCO tiene lámina, y no es un olvido. El render de
 * la caseta existe en la galería y se retiró: al recorte que servía la página,
 * el monumento del acceso mostraba el nombre comercial legible. Se publica la
 * amenidad sin imagen antes que publicar la imagen. Ver `ARCHIVOS_RECHAZADOS`
 * en `lp-lotes.ts`.
 */
const PRUEBA_VISUAL: Record<string, keyof ImagenesLanding> = {
  'alberca comunitaria': 'alberca',
  gimnasio: 'gimnasio',
  'salon de eventos': 'casaClub',
  'jardin comunitario': 'andador',
  cancha: 'canchasCenital',
};

/**
 * `\p{M}` en vez del rango literal de diacríticos combinantes: ese rango se
 * escribe con caracteres invisibles en el código fuente, y un `replace` que
 * parece correcto y no hace nada es exactamente el fallo que no se ve en
 * revisión. La clase Unicode dice lo mismo y se puede leer.
 */
const normalizar = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim();

/** Rótulo corto de cada lámina. Va en la cartela, encima de la imagen. */
const ROTULOS: Partial<Record<keyof ImagenesLanding, string>> = {
  alberca: 'Alberca comunitaria',
  casaClub: 'Casa club',
  casaClubComedor: 'Comedor de la casa club',
  gimnasio: 'Gimnasio',
  canchasCenital: 'Canchas, a plomo',
  amenidades: 'Pádel y pickleball',
  andador: 'Andadores y arbolado',
  cine: 'Cine al aire libre',
  domingo: 'Alberca y casa club',
};

/**
 * Cómo se corta cada lámina y cuánto ocupa. Una hoja de planos mezcla escalas;
 * una rejilla de nueve cuadros iguales se lee como un catálogo de stock.
 *
 * ⚠️ EL ORDEN NO ESTÁ AQUÍ. Lo manda `ORDEN_MOSAICO` en `laminas.ts`, que es
 * también el que numera. Cuando el orden vivía en los dos sitios se desincronizó
 * y el mosaico salió con los números fuera del orden de lectura. Este objeto
 * solo dice CÓMO se corta cada una, no CUÁNDO aparece.
 *
 * ═══ LA CUENTA DE COLUMNAS, QUE NO ES DECORATIVA ═══
 *
 * Son 9 láminas: 7 estrechas, una a dos columnas y una a las tres. En la rejilla
 * de 3 eso suma 7 + 2 + 3 = 12 unidades, o sea CUATRO FILAS EXACTAS. Con la
 * combinación anterior sumaba 11 y la última lámina se quedaba sola en su fila,
 * que en un mosaico se lee como que falta una imagen.
 *
 * En móvil la rejilla es de 2, y ahí `amenidades` también ocupa el ancho
 * completo (`sm:col-span-1` lo devuelve a una columna): sin eso, 7 estrechas en
 * 2 columnas vuelven a dejar una huérfana.
 */
const CORTE: Partial<
  Record<keyof ImagenesLanding, { span: string; aspecto: string }>
> = {
  alberca: { span: '', aspecto: 'aspect-[4/5]' },
  gimnasio: { span: '', aspecto: 'aspect-[4/5]' },
  casaClub: { span: '', aspecto: 'aspect-[4/5]' },
  canchasCenital: { span: '', aspecto: 'aspect-[4/5]' },
  cine: { span: 'col-span-2', aspecto: 'aspect-[16/10]' },
  casaClubComedor: { span: '', aspecto: 'aspect-[4/5]' },
  domingo: { span: '', aspecto: 'aspect-[4/5]' },
  // Ocupa el ancho en móvil, así que ahí va en horizontal: un 4/5 a ancho
  // completo en un teléfono es una lámina de casi 500 px de alto.
  amenidades: {
    span: 'col-span-2 lg:col-span-1',
    aspecto: 'aspect-[16/10] lg:aspect-[4/5]',
  },
  // Cierra el mosaico a todo lo ancho. El original es muy vertical y en 4/5 se
  // recortaba a pura copa de árbol: el andador y las canchas del fondo, que es
  // lo que la lámina tiene que mostrar, quedaban fuera del cuadro. En móvil el
  // 21/9 dejaría una tira de 167 px, así que ahí se abre a 16/9.
  andador: {
    span: 'col-span-2 lg:col-span-3',
    aspecto: 'aspect-[16/9] lg:aspect-[21/9]',
  },
};

export default function Privada({
  imagenes,
  amenidades,
  laminas,
  numeroSeccion,
}: {
  imagenes: ImagenesLanding;
  /** Array derivado de columnas booleanas de `v_developments`. Nunca prosa. */
  amenidades: string[];
  laminas: IndiceLaminas;
  numeroSeccion: string;
}) {
  // Orden de pintado = orden de numeración, de una sola fuente.
  const plates = ORDEN_MOSAICO.filter((clave) => imagenes[clave] && CORTE[clave]).map(
    (clave) => ({ clave, ...CORTE[clave]! }),
  );
  if (plates.length === 0 && amenidades.length === 0) return null;

  const leyenda = amenidades.map((a) => {
    const clave = PRUEBA_VISUAL[normalizar(a)];
    return { nombre: a, lamina: clave ? (laminas[clave] ?? null) : null };
  });
  const conPrueba = leyenda.filter((l) => l.lamina).length;

  return (
    <section className="lpt-plano border-t border-[var(--lpt-linea-fuerte)] bg-[var(--lpt-selva)]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <p className="lpt-rotulo text-[var(--lpt-estaca)]">{numeroSeccion} · La privada</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="lpt-titular mt-4 max-w-[24ch] text-[clamp(1.875rem,1.4rem+2.2vw,3rem)] text-[var(--lpt-claro)]">
            El lote está dentro de esto
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="lpt-cuerpo mt-6 max-w-[56ch] text-[1.0625rem] leading-relaxed text-[var(--lpt-claro-2)]">
            Un terreno en privada no se compra por el terreno: se compra por lo
            que hay al otro lado de la caseta. Estas son las amenidades que el
            desarrollador tiene declaradas, y las láminas de su proyecto.
          </p>
        </Reveal>

        {/* ═══ LA LEYENDA ═══
            Va ANTES del mosaico a propósito: primero el dato duro —qué está
            declarado— y luego las imágenes que lo ilustran. Al contrario, las
            imágenes harían la promesa y la lista llegaría a matizarla. */}
        {leyenda.length > 0 && (
          <Escalonado
            className="mt-14 grid gap-x-8 gap-y-0 border-t border-[var(--lpt-linea-fuerte)] sm:grid-cols-2 lg:grid-cols-3"
            delay={0.05}
          >
            {leyenda.map((l) => (
              <Escalon
                key={l.nombre}
                className="flex items-baseline justify-between gap-4 border-b border-[var(--lpt-linea)] py-4"
              >
                <span className="lpt-cuerpo text-[0.9375rem] text-[var(--lpt-claro)]">
                  {l.nombre}
                </span>
                {l.lamina ? (
                  <span className="lpt-cota shrink-0 text-[0.625rem] tracking-[0.12em] text-[var(--lpt-estaca)]">
                    {l.lamina}
                  </span>
                ) : (
                  /* Sin lámina y se dice. Un guion largo, no un hueco: el hueco
                     se lee como error de maquetación, el guion como dato. */
                  <span
                    className="lpt-cota shrink-0 text-[0.625rem] text-[var(--lpt-claro-3)]"
                    title="Declarada por el desarrollador, sin render en la galería"
                  >
                    —
                  </span>
                )}
              </Escalon>
            ))}
          </Escalonado>
        )}

        {leyenda.length > 0 && (
          <Reveal delay={0.1}>
            <p className="lpt-cuerpo mt-5 max-w-[62ch] text-[0.8125rem] leading-relaxed text-[var(--lpt-claro-3)]">
              {/* ⚠️ Decía «no tenemos render de ellas». Dejó de ser verdad al
                  retirar la lámina de la caseta: de ésa SÍ hay render, y no se
                  publica por otra razón. En una página cuya voz entera depende
                  de que cada frase sea literalmente cierta, eso importa. */}
              {conPrueba} de las {leyenda.length} tienen lámina del proyecto, y
              son las que llevan número. Las marcadas con guion están declaradas
              en la ficha del desarrollador y no las publicamos en imagen: antes
              de eso te ponemos un guion, no una foto de otra cosa.
            </p>
          </Reveal>
        )}

        {/* ═══ EL MOSAICO ═══
            ⚠️ AQUÍ NO SE USA `Escalonado`, Y ES DELIBERADO. Esa primitiva sirve
            `initial={{opacity:0}}`, o sea que el CERO viaja en el HTML del
            servidor y lo levanta Framer al entrar en pantalla. Para un párrafo
            es un riesgo aceptable; para las diez imágenes que son la razón de
            existir de esta sección, no: si el JS no carga, tarda o falla, la
            página se queda sin lo único que la persona vino a ver.

            El movimiento se hace con `.lpt-lamina-entra`, que es CSS con
            `animation-timeline: view()` dentro de un `@supports`. Lo conduce el
            scroll, no un observer, así que no puede quedarse atascado en cero;
            y donde el navegador no lo soporta la lámina simplemente se ve.
            Ver `lpt-theme.css`. */}
        {plates.length > 0 && (
          <div className="mt-16 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {plates.map((m) => {
              const img = imagenes[m.clave]!;
              return (
                <div key={m.clave} className={`lpt-lamina-entra ${m.span}`}>
                  <FiguraTerrenos
                    imagen={img}
                    lamina={laminas[m.clave] ?? 'FIG.'}
                    rotulo={ROTULOS[m.clave] ?? 'La privada'}
                    aspecto={m.aspecto}
                    // El mosaico ocupa media pantalla en móvil, un tercio en
                    // escritorio. Sin esto el navegador pide el candidato de
                    // 3840 px para una lámina que se pinta a 380.
                    // El candidato que se pide tiene que seguir al span real, o
                    // el navegador descarga el de 3840 px para una lámina que
                    // se pinta a 360. `andador` es de ancho completo, `cine`
                    // dos tercios, el resto un tercio.
                    sizes={
                      m.clave === 'andador'
                        ? '(min-width: 1024px) 1152px, 100vw'
                        : m.clave === 'cine'
                          ? '(min-width: 1024px) 760px, 100vw'
                          : '(min-width: 1024px) 368px, 50vw'
                    }
                    // Pie fuera: trece pies bajo trece láminas es una columna de
                    // letra chica. El rótulo va en la cartela y el aviso de que
                    // TODAS son renders va una sola vez, abajo.
                    conPie={false}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* El aviso, una vez y en serio. Sustituye a los pies individuales. */}
        {plates.length > 0 && (
          <Reveal delay={0.08}>
            <p className="lpt-cuerpo mt-8 max-w-[62ch] border-t border-[var(--lpt-linea)] pt-6 text-[0.8125rem] leading-relaxed text-[var(--lpt-claro-3)]">
              Las {plates.length} láminas de arriba son renders del proyecto del
              desarrollador, no obra existente: hoy la privada no está
              construida. Cómo se ve el terreno HOY está en la lámina{' '}
              {laminas.urbanizacion ?? 'aérea'}, que sí es fotografía. Las
              amenidades se entregan conforme al calendario de obra del
              desarrollador, y te lo mandamos junto con el plan de pagos.
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
