import Image from 'next/image';
import { TituloSeccion } from './ui';
import { m2 } from './format';
import type { LoteLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Qué estás comprando.
//
// El bloque que faltaba. La página tenía pruebas y no tenía promesa: cuatro
// bloques defensivos consecutivos antes de un solo argumento a favor. Esto va
// arriba, antes de cualquier objeción, para que exista una razón de seguir
// leyendo.
//
// Las amenidades salen de las columnas booleanas del desarrollo vía
// `v_developments.amenities`, no de prosa: si el Hub desmarca una, desaparece de
// aquí sin tocar código. Pádel y pickleball no están estructurados, así que no
// se nombran individualmente aunque aparezcan en el texto editorial.
// ============================================================

export default function QueEstasComprando({ lote }: { lote: LoteLanding }) {
  return (
    <section aria-labelledby="comprando-titulo">
      <TituloSeccion id="comprando-titulo">Qué estás comprando, exactamente</TituloSeccion>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:gap-10">
        <div className="flex max-w-[62ch] flex-col gap-4 text-base leading-relaxed text-graphite">
          <p>
            No una casa terminada: el espacio para decidir la tuya. Cuando compras
            un terreno no heredas los acabados ni la distribución de alguien más.
          </p>
          <p>
            Y estás comprando ubicación en una ciudad que ya existe. La diferencia
            con un desarrollo en plena selva esperando que llegue la infraestructura
            es que aquí la vida urbana ya está alrededor: 4.2 km a la playa, 2 km a
            la carretera federal, sobre Av. Universidades.
          </p>
          <p>
            La lógica del producto es asegurar hoy la ubicación y el precio de
            preventa, y construir cuando los tiempos y el presupuesto lo permitan.
            El desarrollo fija una ventana máxima de cinco años para iniciar obra.
          </p>

          {lote.amenidades.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-graphite">
                Dentro de la privada
                {lote.lotesTotalesPrivada && (
                  <>
                    {' '}
                    de{' '}
                    <span className="font-mono tabular-nums">
                      {lote.lotesTotalesPrivada}
                    </span>{' '}
                    lotes
                  </>
                )}
                , las amenidades son el centro del diseño, no un anexo:
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {lote.amenidades.map((a) => (
                  <li
                    key={a}
                    className="border border-navy/15 px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-wide text-navy/70"
                  >
                    {a}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-graphite/70">
                Se entregan conforme al calendario de obra, y ese calendario está más
                abajo con sus fechas y con lo que todavía no podemos confirmar.
              </p>
            </div>
          )}
        </div>

        {/* La foto sostiene la mitad de la función de este bloque. */}
        {lote.imagenPortada && (
          <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[360px]">
            <Image
              src={lote.imagenPortada}
              alt={`Áreas comunes de la privada residencial en ${lote.zona ?? 'Playa del Carmen'}`}
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
