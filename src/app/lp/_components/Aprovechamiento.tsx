'use client';

import { motion } from 'framer-motion';
import { DUR, EASE_ENTRADA, Reveal } from './motion';
import { m2 } from './format';

// ============================================================
// Qué cabe aquí: COS y CUS, dibujados.
//
// EL PROBLEMA QUE RESUELVE. La página ya publicaba las tres cifras —129.6 m² de
// lote, 71.28 en planta, 207.36 construibles— dentro de un párrafo. Escritas en
// prosa, «207.36» se lee como un número más grande que «129.6» y ahí muere la
// idea. Dibujadas a escala, salta lo único que importa: LO CONSTRUIBLE ES MAYOR
// QUE EL TERRENO. Ese es el argumento entero del titular de la página, y estaba
// pidiéndole al lector que lo dedujera él.
//
// LA ESCALA ES REAL. Las tres barras se miden contra la mayor —la construible—,
// así que sus anchos son la proporción verdadera entre las tres cifras. Si el
// COS o el CUS de este lote cambiaran en el Hub, el dibujo cambia con ellos: no
// hay un solo ancho escrito a mano. Un diagrama de proporciones inventadas en
// una página cuya tesis es la verificabilidad sería la contradicción más cara
// de todo el rediseño.
//
// LA ATRIBUCIÓN SE QUEDA. Los coeficientes son los que declara la ficha técnica
// del desarrollador, y así se dice al pie. La aritmética es nuestra y cualquiera
// puede rehacerla; los insumos no.
// ============================================================

export default function Aprovechamiento({
  superficieM2,
  huellaM2,
  construibleM2,
  cos,
  cus,
  niveles,
}: {
  superficieM2: number;
  huellaM2: number;
  construibleM2: number;
  cos: number;
  cus: number;
  niveles: number;
}) {
  // Todo se mide contra la barra mayor. Normalmente es la construible (CUS >
  // 1), pero no se asume: con un CUS menor que 1 la mayor sería el lote y la
  // escala quedaría al revés.
  const maximo = Math.max(superficieM2, huellaM2, construibleM2);

  const barras = [
    {
      clave: 'lote',
      etiqueta: 'Superficie del lote',
      valor: superficieM2,
      nota: 'Lo que compras',
      clase: 'bg-[var(--lp-ink)]/12 border border-[var(--lp-ink)]/25',
      texto: 'text-[var(--lp-ink)]',
    },
    {
      clave: 'huella',
      etiqueta: `Ocupable en planta · COS ${cos}`,
      valor: huellaM2,
      nota: 'La huella de la casa sobre el terreno',
      clase: 'bg-[var(--lp-ink-soft)]/70',
      texto: 'text-[var(--lp-ink)]',
    },
    {
      clave: 'construible',
      etiqueta: `Construible en total · CUS ${cus}`,
      valor: construibleM2,
      nota:
        niveles >= 2
          ? `Sumando los ${niveles} niveles que permite`
          : 'Superficie total de construcción',
      clase: 'bg-[var(--lp-accent)]',
      texto: 'text-[var(--lp-accent)]',
    },
  ];

  return (
    <section
      aria-labelledby="aprovechamiento-titulo"
      className="border-b border-[var(--lp-line)] bg-[var(--lp-paper)]"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal>
            <h2
              id="aprovechamiento-titulo"
              className="lp-display max-w-[18ch] text-[clamp(1.75rem,1.2rem+2.2vw,2.75rem)] leading-[1.12] text-balance text-[var(--lp-ink)]"
            >
              Puedes construir más metros de los que mide el terreno
            </h2>
            <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-[var(--lp-ink-soft)]">
              No es un juego de palabras: es lo que permiten el COS y el CUS del uso de
              suelo. Ocupas menos de la mitad del lote en planta, y creces hacia arriba.
            </p>
          </Reveal>

          <div className="flex flex-col gap-9">
            {barras.map((b, i) => {
              const pct = (b.valor / maximo) * 100;
              return (
                <div key={b.clave}>
                  {/* Etiqueta y cifra van juntas y a la izquierda, encima de su
                      barra. Repartidas con `justify-between` la cifra se iba al
                      borde derecho del contenedor, a veces a medio metro visual
                      de la barra que mide: el ojo tenía que emparejarlas a mano. */}
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      className={`lp-display lp-num text-[1.5rem] leading-none ${b.texto}`}
                    >
                      {m2(b.valor)}
                    </span>
                    <span className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--lp-muted)]">
                      {b.etiqueta}
                    </span>
                  </div>

                  {/* La barra crece desde la izquierda, en cascada. El orden es
                      el del razonamiento: esto es el lote, esto ocupas, esto
                      construyes.

                      Crece por `scaleX`, no por `width`: el ancho final ya está
                      puesto, así que el navegador no recalcula layout en cada
                      frame. Tres barras animando `width` a la vez es trabajo de
                      hilo principal a cambio de nada visible. */}
                  <div className="mt-3 h-[3.25rem] w-full">
                    <motion.div
                      className={`h-full origin-left rounded-[var(--lp-r-control)] ${b.clase}`}
                      style={{ width: `${pct}%` }}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, margin: '-15% 0px -15% 0px' }}
                      transition={{
                        duration: DUR.larga,
                        ease: EASE_ENTRADA,
                        delay: i * 0.14,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-[var(--lp-muted)]">
                    {b.nota}
                  </p>
                </div>
              );
            })}

            <Reveal delay={0.1}>
              <p className="max-w-[60ch] border-t border-[var(--lp-line-soft)] pt-5 text-xs leading-relaxed text-[var(--lp-muted)]">
                Barras a escala real entre sí. COS {cos} y CUS {cus} son los que declara
                la ficha técnica del desarrollador; los metros son esa aritmética
                aplicada a {m2(superficieM2)}, y puedes rehacerla. Los niveles se truncan
                hacia abajo: {niveles} es lo que cabe, no lo que redondea.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
