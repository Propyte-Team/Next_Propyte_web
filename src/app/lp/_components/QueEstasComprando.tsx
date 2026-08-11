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
//
// Ya no se imprimen como volcado de base de datos. Diez sustantivos en title
// case («Alberca Comunitaria · Gimnasio · Cancha») son cero significado: nadie
// compra un lote por leer la palabra «gimnasio». Cada amenidad se publica con
// su consecuencia en una línea, en presente y en segunda persona.
//
// Regla dura: si una amenidad no tiene consecuencia escribible, NO se lista. Es
// relleno, y el relleno es justo lo que hace que el resto suene a folleto.
// ============================================================

/**
 * Consecuencia por amenidad. La clave se normaliza (sin acentos, minúsculas)
 * para que un cambio de capitalización en el Hub no rompa el match.
 *
 * Deliberadamente NO hay fallback genérico: una amenidad sin entrada aquí se
 * omite. Preferimos publicar seis amenidades que signifiquen algo a diez que no.
 */
const CONSECUENCIA: Record<string, string> = {
  'acceso controlado':
    'Tus hijos pueden salir solos de la casa. Es la razón por la que la gente se muda a una privada.',
  'seguridad 24h': 'Hay alguien despierto a las tres de la mañana.',
  cctv: 'Lo que pasa en las áreas comunes queda grabado.',
  'alberca comunitaria':
    'Aprenden a nadar a dos cuadras de tu puerta, sin subirse al coche.',
  'pet zone': 'El perro es parte del plan, no un problema a resolver.',
  'salon de eventos': 'Los cumpleaños ocurren dentro de la privada.',
  gimnasio: 'Ya está en el mantenimiento. No hay membresía que cancelar.',
  cancha: 'Los adolescentes tienen a dónde ir sin salir.',
  'jardin comunitario':
    'Se camina. En Playa del Carmen eso no se da por hecho.',
  'area de ninos': 'Los pones a la vista mientras haces otra cosa.',
  'casa club': 'Hay dónde recibir visitas cuando tu casa se queda chica.',
};

/** Quita acentos y normaliza para hacer match con `CONSECUENCIA`. */
function clave(amenidad: string): string {
  return amenidad
    .toLowerCase()
    .normalize('NFD')
    // Escapes unicode y no marcas combinantes literales: sobreviven a un
    // guardado en otra codificación.
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function QueEstasComprando({ lote }: { lote: LoteLanding }) {
  // Sólo sobreviven las amenidades con consecuencia escribible.
  const amenidades = lote.amenidades
    .map((a) => ({ nombre: a, consecuencia: CONSECUENCIA[clave(a)] }))
    .filter((a): a is { nombre: string; consecuencia: string } => Boolean(a.consecuencia));

  const imagen = lote.imagenes.amenidades;
  const apr = lote.aprovechamiento;

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
          {/* La consecuencia del uso de suelo, no el uso de suelo. COS y CUS
              siguen publicados en el bloque jurídico; aquí va lo que significan. */}
          {apr && lote.superficieM2 && (
            <p>
              Sobre {m2(lote.superficieM2)}, el uso de suelo permite ocupar{' '}
              <span className="font-mono tabular-nums">{m2(apr.huellaM2)}</span> en
              planta y construir hasta{' '}
              <strong className="font-semibold text-navy">
                <span className="font-mono tabular-nums">{m2(apr.construibleM2)}</span>{' '}
                en total
              </strong>
              : una casa de {apr.niveles === 2 ? 'dos' : apr.niveles} niveles con tres
              recámaras, no de dos.
            </p>
          )}

          <p>
            La lógica del producto es asegurar hoy la ubicación y el precio de
            preventa, y construir cuando los tiempos y el presupuesto lo permitan.
            El desarrollo fija una ventana máxima de cinco años para iniciar obra.
          </p>

          {amenidades.length > 0 && (
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
                , esto es lo que cada amenidad significa un martes cualquiera:
              </p>
              {/* Reja de dos columnas, no chips: la consecuencia es el contenido
                  y necesita ancho de línea, no una cápsula. */}
              <dl className="mt-4 border-t border-navy/12">
                {amenidades.map((a) => (
                  <div
                    key={a.nombre}
                    className="grid gap-x-4 border-b border-navy/12 py-3 sm:grid-cols-[minmax(9rem,0.5fr)_1fr]"
                  >
                    <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-navy/50">
                      {a.nombre}
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-graphite sm:mt-0">
                      {a.consecuencia}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-sm text-graphite/70">
                Se entregan conforme al calendario de obra, y ese calendario está más
                abajo con sus fechas y con lo que todavía no podemos confirmar.
              </p>
            </div>
          )}
        </div>

        {/* Imagen curada, distinta de la del hero. Antes era el MISMO archivo:
            una aérea repetida bajo el rótulo «áreas comunes». */}
        {imagen && (
          <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[360px]">
            <Image
              src={imagen.url}
              alt={imagen.alt}
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
