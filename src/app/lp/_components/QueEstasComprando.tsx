import Figure from './Figure';
import { TituloSeccion } from './ui';
import { m2, mxn, mxnExacto } from './format';

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

/**
 * Territorio de cada amenidad.
 *
 * Once amenidades en lista plana obligan a leerlas todas para saber si hay
 * alguna que importe. Agrupadas en tres territorios, el visitante encuentra el
 * suyo de un vistazo: quien compra por los hijos busca «familia», quien viene
 * de otra ciudad busca «seguridad». El copy de cada una NO cambia — la lista
 * ya estaba bien escrita; lo que faltaba era el orden.
 *
 * Una amenidad sin territorio cae en «vida diaria», que es el cajón correcto
 * para lo que no es ni infantil ni perimetral.
 */
const TERRITORIO: Record<string, 'familia' | 'seguridad' | 'vida diaria'> = {
  'alberca comunitaria': 'familia',
  'area de ninos': 'familia',
  'jardin comunitario': 'familia',
  cancha: 'familia',
  'seguridad 24h': 'seguridad',
  cctv: 'seguridad',
  'acceso controlado': 'seguridad',
  gimnasio: 'vida diaria',
  'salon de eventos': 'vida diaria',
  'pet zone': 'vida diaria',
  'casa club': 'vida diaria',
};

/** Orden de presentación. Familia primero: es el motivo de compra dominante. */
const ORDEN_TERRITORIOS = ['familia', 'seguridad', 'vida diaria'] as const;

const ROTULO: Record<(typeof ORDEN_TERRITORIOS)[number], string> = {
  familia: 'Para los que viven contigo',
  seguridad: 'Para dormir tranquilo',
  'vida diaria': 'Para el día a día',
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
    .map((a) => ({
      nombre: a,
      consecuencia: CONSECUENCIA[clave(a)],
      territorio: TERRITORIO[clave(a)] ?? ('vida diaria' as const),
    }))
    .filter((a) => Boolean(a.consecuencia));

  const imagen = lote.imagenes.amenidades;
  const apr = lote.aprovechamiento;
  const plazoMax = lote.plan?.opciones.at(-1) ?? null;

  return (
    <section aria-labelledby="comprando-titulo">
      <TituloSeccion id="comprando-titulo">Qué estás comprando, exactamente</TituloSeccion>

      {/* Resumen en una frase. Bajó del hero, donde ocupaba la banda entera
          justo después de las cifras y repetía en prosa lo que las cifras
          acababan de decir en números. Aquí abre el bloque que sí desarrolla el
          argumento, y la afirmación que de verdad hace trabajo —propiedad
          privada, no ejidal— aterriza donde el visitante ya se está preguntando
          qué está comprando. */}
      <p className="mt-5 max-w-[58ch] lp-display text-[clamp(1.0625rem,1rem+0.4vw,1.375rem)] leading-[1.5] text-[var(--lp-ink)]">
        En Playa del Carmen tenemos un lote residencial disponible de{' '}
        <span className="lp-num">
          {lote.superficieM2 ? m2(lote.superficieM2) : 'superficie por confirmar'}
        </span>{' '}
        en{' '}
        <span className="lp-num">
          {lote.precioMxn ? `${mxn(lote.precioMxn)}` : 'precio por confirmar'}
        </span>
        {lote.precioM2Mxn && (
          <>
            , es decir <span className="lp-num">{mxnExacto(lote.precioM2Mxn)}</span> por
            metro cuadrado
          </>
        )}
        . Está en preventa dentro de una privada sobre Av. Universidades, a 4.2 km de
        la playa, con financiamiento directo del desarrollador
        {lote.plan?.sinIntereses && <> y sin intereses</>}
        {/* El porcentaje NO depende del plan: vive en `lote.enganchePct`. Leerlo
            de `plan` producía «enganche de enganche» cuando faltaba la tasa. */}
        {lote.enganchePct && <>: {lote.enganchePct}% de enganche</>}
        {plazoMax && <> y hasta {plazoMax.meses} meses</>}. Es propiedad privada, no
        terreno ejidal.
      </p>

      {/* UNA columna, no dos. Esta sección ya vive dentro de la columna
          izquierda del grid de la página (~550 px, porque el formulario ocupa
          la derecha). Abrir aquí un segundo grid de texto + imagen dejaba la
          prosa en **276 px**: unos 34 caracteres por línea, la mitad de la
          medida legible, con la imagen flotando al lado y un hueco muerto
          debajo. Medido, no estimado.

          Apilado, el texto recupera los ~62ch de `max-w` y la imagen se lee
          como imagen en vez de como columna lateral. */}
      <div className="mt-8 flex flex-col gap-8">
        <div className="flex max-w-[62ch] flex-col gap-4 text-base leading-relaxed text-[var(--lp-ink-soft)]">
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
              <span className="lp-num">{m2(apr.huellaM2)}</span> en
              planta y construir hasta{' '}
              <strong className="font-semibold text-[var(--lp-ink)]">
                <span className="lp-num">{m2(apr.construibleM2)}</span>{' '}
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
              <p className="text-sm text-[var(--lp-ink-soft)]">
                Dentro de la privada
                {lote.lotesTotalesPrivada && (
                  <>
                    {' '}
                    de{' '}
                    <span className="lp-num">
                      {lote.lotesTotalesPrivada}
                    </span>{' '}
                    lotes
                  </>
                )}
                , esto es lo que cada amenidad significa un martes cualquiera:
              </p>
              {/* Agrupadas en tres territorios, no en lista plana. Once
                  amenidades seguidas obligan a leerlas todas para saber si hay
                  alguna que te importe; en territorios, cada perfil encuentra
                  el suyo de un vistazo. Dentro de cada uno, dos columnas: once
                  filas apiladas con hairline se comían el 20% del scroll y
                  leían como hoja de cálculo. */}
              <div className="mt-5 flex flex-col gap-6">
                {ORDEN_TERRITORIOS.map((t) => {
                  const delGrupo = amenidades.filter((a) => a.territorio === t);
                  if (delGrupo.length === 0) return null;
                  return (
                    <div key={t}>
                      <p className="text-[0.625rem] uppercase tracking-[0.14em] text-[var(--lp-muted)]">
                        {ROTULO[t]}
                      </p>
                      <dl className="mt-3 grid gap-x-10 gap-y-5 sm:grid-cols-2">
                        {delGrupo.map((a) => (
                          <div key={a.nombre}>
                            <dt className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--lp-accent)]">
                              {a.nombre}
                            </dt>
                            <dd className="mt-1 text-sm leading-relaxed text-[var(--lp-ink-soft)]">
                              {a.consecuencia}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-[var(--lp-muted)]">
                Se entregan conforme al calendario de obra, y ese calendario está más
                abajo con sus fechas y con lo que todavía no podemos confirmar.
              </p>
            </div>
          )}
        </div>

        {/* Imagen curada, distinta de la del hero. Antes era el MISMO archivo:
            una aérea repetida bajo el rótulo «áreas comunes». */}
        {/* `self-start` + relación de aspecto FIJA, y sticky en desktop.
            Antes era `lg:aspect-auto lg:min-h-[360px]`: dentro de un grid eso
            estira la celda hasta la altura de la columna de texto, que aquí es
            larguísima. El resultado era una tira vertical estrecha con
            `object-cover` recortando el centro de un render horizontal, o sea
            árboles desenfocados. Con la relación fija la foto vuelve a leerse
            como foto, y el sticky la acompaña mientras se lee el texto en vez
            de dejar un hueco muerto debajo. */}
        {imagen && (
          // Ya no es `sticky`: eso tenía sentido cuando acompañaba a una
          // columna de texto larguísima a su izquierda. Apilada, seguir a la
          // vista mientras se lee lo de abajo sería una imagen persiguiendo al
          // lector.
          <Figure imagen={imagen} sizes="(max-width: 1024px) 100vw, 46vw" />
        )}
      </div>
    </section>
  );
}
