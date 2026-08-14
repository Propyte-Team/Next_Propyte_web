'use client';

import { motion } from 'framer-motion';
import { DUR, EASE_ENTRADA, Reveal } from './motion';

// ============================================================
// Dónde estás parado.
//
// POR QUÉ EXISTE ESTA SECCIÓN. «A 4.2 km de la playa» es la afirmación
// geográfica más fuerte de la página y aparecía dos veces como texto corrido,
// enterrada a mitad de un párrafo de siete líneas. Un número que decide una
// compra no puede llegar al lector con el mismo peso tipográfico que el resto
// de la oración.
//
// POR QUÉ NO ES UN MAPA DE VERDAD. Dos razones, y ninguna es estética. La
// primera: el registro del lote no trae coordenadas —no hay lat/lng en
// `lp-lotes.ts`—, así que un mapa real exigiría teclear un punto a mano y
// publicarlo como si fuera dato del desarrollador. La segunda: montar Google
// Maps en una landing que se paga por clic añade una petición a un tercero, una
// API key en el cliente y un coste por carga, para responder una pregunta que
// un mapa contesta peor. Lo que el visitante quiere saber no es la forma de la
// costa: es cuánto hay de aquí al agua.
//
// TODOS LOS DATOS SON LOS QUE LA PÁGINA YA PUBLICA. 4.2 km a la playa, 2 km a
// la carretera federal, sobre Av. Universidades. Este bloque no añade una sola
// afirmación nueva: le da escala a las que ya estaban.
// ============================================================

/** Kilómetro en el que cae cada hito. El orden es el del recorrido. */
const HITOS = [
  {
    km: 0,
    titulo: 'El lote',
    detalle: 'En privada, sobre Av. Universidades',
    tipo: 'origen' as const,
  },
  {
    km: 2,
    titulo: 'Carretera federal',
    detalle: 'La salida hacia el resto de la ciudad',
    tipo: 'paso' as const,
  },
  {
    km: 4.2,
    titulo: 'La playa',
    detalle: 'El mar Caribe',
    tipo: 'destino' as const,
  },
];

const TOTAL_KM = 4.2;

export default function DistanciaPlaya() {
  // Sin ramas por `prefers-reduced-motion`: de eso se encarga `MotionConfig` en
  // el layout, que descarta los `transform` y conserva los fundidos. Decidirlo
  // aquí es lo que dejó nodos servidos en `opacity: 0` sin nadie que los
  // levantara. Ver la cabecera de `motion.tsx`.
  //
  // La línea se dibuja de una vez; los hitos entran detrás, en orden de
  // recorrido, para que se lea como un trayecto y no como tres etiquetas.
  const trazo = {
    initial: { scaleX: 0 },
    whileInView: { scaleX: 1 },
    viewport: { once: true, margin: '-20% 0px -20% 0px' },
    transition: { duration: DUR.larga, ease: EASE_ENTRADA },
  };

  const trazoVertical = {
    initial: { scaleY: 0 },
    whileInView: { scaleY: 1 },
    viewport: { once: true, margin: '-20% 0px -20% 0px' },
    transition: { duration: DUR.larga, ease: EASE_ENTRADA },
  };

  const hito = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-20% 0px -20% 0px' },
    transition: {
      duration: DUR.media,
      ease: EASE_ENTRADA,
      // Escalonado detrás del trazo: el hito aparece cuando la línea ya pasó
      // por encima de él.
      delay: 0.25 + (HITOS[i].km / TOTAL_KM) * 0.5,
    },
  });

  return (
    <section
      aria-labelledby="distancia-titulo"
      className="border-b border-[var(--lp-line)] bg-[var(--lp-paper-2)]"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <Reveal>
          <h2
            id="distancia-titulo"
            className="lp-display max-w-[20ch] text-[clamp(1.75rem,1.2rem+2.2vw,2.75rem)] leading-[1.12] text-balance text-[var(--lp-ink)]"
          >
            Cuatro kilómetros con doscientos metros
          </h2>
          <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-[var(--lp-ink-soft)]">
            Eso es lo que hay del lote al mar. No es un desarrollo en plena selva
            esperando a que llegue la ciudad: la vida urbana ya está alrededor.
          </p>
        </Reveal>

        {/* ───── Recorrido horizontal (desde lg) ───── */}
        <div className="mt-16 hidden lg:block">
          <div className="relative h-px">
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 origin-left bg-gradient-to-r from-[var(--lp-accent)] via-[var(--lp-accent)] to-[#2E6F82]"
              {...trazo}
            />

            {HITOS.map((h, i) => (
              // Dos capas a propósito: la de fuera posiciona (`left` + el
              // desplazamiento que impide que la etiqueta de los extremos
              // desborde el contenedor), la de dentro anima. Si ambas cosas
              // vivieran en el mismo nodo, el `transform` de la posición y el
              // que escribe Framer para la entrada se pisarían: gana el último
              // que se aplica y el hito termina descolocado o sin animar.
              <div
                key={h.titulo}
                className={`absolute top-0 ${
                  h.tipo === 'destino'
                    ? '-translate-x-full'
                    : h.tipo === 'origen'
                      ? ''
                      : '-translate-x-1/2'
                }`}
                style={{ left: `${(h.km / TOTAL_KM) * 100}%` }}
              >
                <motion.div
                  // `-mt-1.5` = medio punto: el círculo queda a caballo sobre
                  // la línea y el resto de la etiqueta cuelga por debajo. Subir
                  // media COLUMNA en vez de medio punto dejaría el texto encima
                  // del trazo. Y no puede ser un `translate`: Framer escribe el
                  // suyo para la entrada y lo sobrescribiría.
                  //
                  // `w-56` NO es decorativo. Un absoluto en `left: 100%` tiene
                  // cero espacio disponible a su derecha, así que el ancho
                  // ajustado al contenido colapsa al mínimo: «4.2 km» se partía
                  // en dos líneas y «La playa» en tres. Con ancho fijo las tres
                  // etiquetas miden lo mismo y ninguna depende de dónde cae.
                  className={`-mt-1.5 flex w-56 flex-col ${
                    h.tipo === 'destino'
                      ? 'items-end text-right'
                      : h.tipo === 'origen'
                        ? 'items-start'
                        : 'items-center text-center'
                  }`}
                  {...hito(i)}
                >
                  <span
                    aria-hidden="true"
                    className={`size-3 rounded-full ring-4 ring-[var(--lp-paper-2)] ${
                      h.tipo === 'destino' ? 'bg-[#2E6F82]' : 'bg-[var(--lp-accent)]'
                    }`}
                  />
                  <span className="lp-display lp-num mt-5 text-[1.75rem] leading-none text-[var(--lp-ink)]">
                    {h.km === 0 ? '0' : h.km} <span className="text-base">km</span>
                  </span>
                  <span className="mt-2 text-sm font-medium text-[var(--lp-ink)]">
                    {h.titulo}
                  </span>
                  <span className="mt-1 max-w-[24ch] text-xs leading-relaxed text-[var(--lp-muted)]">
                    {h.detalle}
                  </span>
                </motion.div>
              </div>
            ))}
          </div>
          {/* Reserva del alto que ocupan las etiquetas absolutas. */}
          <div aria-hidden="true" className="h-32" />
        </div>

        {/* ───── Recorrido vertical (móvil) ─────
            No es el mismo bloque rotado: a 375 px, tres etiquetas repartidas
            sobre una línea horizontal se solapan o encogen hasta no leerse. */}
        <div className="relative mt-12 lg:hidden">
          <motion.div
            aria-hidden="true"
            className="absolute bottom-3 left-[5px] top-3 w-px origin-top bg-gradient-to-b from-[var(--lp-accent)] to-[#2E6F82]"
            {...trazoVertical}
          />
          <ul className="flex flex-col gap-10">
            {HITOS.map((h, i) => (
              <motion.li key={h.titulo} className="relative flex gap-5" {...hito(i)}>
                <span
                  aria-hidden="true"
                  className={`mt-1.5 size-3 shrink-0 rounded-full ring-4 ring-[var(--lp-paper-2)] ${
                    h.tipo === 'destino' ? 'bg-[#2E6F82]' : 'bg-[var(--lp-accent)]'
                  }`}
                />
                <div className="flex flex-col">
                  <span className="lp-display lp-num text-[1.5rem] leading-none text-[var(--lp-ink)]">
                    {h.km === 0 ? '0' : h.km} <span className="text-sm">km</span>
                  </span>
                  <span className="mt-1.5 text-sm font-medium text-[var(--lp-ink)]">
                    {h.titulo}
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-[var(--lp-muted)]">
                    {h.detalle}
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
