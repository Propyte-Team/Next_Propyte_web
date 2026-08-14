'use client';

import { Contador, Escalonado, Escalon, Reveal } from './motion';
import { mxnDesnudo, m2 } from './format';

// ============================================================
// Las cifras, a escala de cartel.
//
// QUÉ CAMBIA Y QUÉ NO. Los cuatro números son los mismos, en el mismo orden
// deliberado —lo que cuesta entrar, lo que se paga cada mes, lo construible, y
// sólo al final el precio total— y las dos líneas de honestidad siguen debajo,
// completas. Lo único que cambia es la escala.
//
// POR QUÉ TAN GRANDE. Venía resuelto como un `<dl>` de 34 px inmediatamente
// después de un hero a sangre de 100vh. El momento de mayor valor de la página
// —el precio de entrada y la mensualidad— pesaba menos que el pie de foto del
// render. A esta escala, y sobre papel blanco justo después del hero oscuro, el
// corte es el golpe visual más fuerte de la página sin añadir una sola imagen.
//
// POR QUÉ EL «MXN» VA APARTE Y MÁS CHICO. `mxn()` rinde «$202,176 MXN» en una
// sola cadena, y a 5rem eso son catorce caracteres que obligan a bajar el
// cuerpo hasta perder el efecto. Aquí el número usa `mxnDesnudo()` y el «MXN»
// viaja al lado, más pequeño pero en la misma caja de línea: nunca se separan,
// nunca se envuelve solo, y la moneda sigue declarada en toda cifra. Eso último
// no es estilo: en una zona que vende a compradores de Estados Unidos y Canadá,
// un `$` desnudo es una ambigüedad de 20× a nuestro favor.
// ============================================================

interface Cifra {
  etiqueta: string;
  valor: number | null;
  /** Cómo se dibuja el valor. El dinero parte número y moneda; los m² no. */
  tipo: 'dinero' | 'area';
  /** Los dos que deciden la compra van en acento y a cuerpo mayor. */
  protagonista?: boolean;
}

export default function BandaCifras({
  engancheMxn,
  mensualidadMxn,
  plazoMeses,
  construibleM2,
  precioMxn,
  contraentrega,
  precioM2Mxn,
}: {
  engancheMxn: number | null;
  mensualidadMxn: number | null;
  plazoMeses: number | null;
  construibleM2: number | null;
  precioMxn: number | null;
  /** null cuando no hay plan declarado: entonces se publica el precio por m². */
  contraentrega: { montoMxn: number; pct: number } | null;
  precioM2Mxn: number | null;
}) {
  const cifras: Cifra[] = [
    { etiqueta: 'Enganche', valor: engancheMxn, tipo: 'dinero', protagonista: true },
    {
      etiqueta: plazoMeses ? `Al mes, ${plazoMeses} meses` : 'Al mes',
      valor: mensualidadMxn,
      tipo: 'dinero',
      protagonista: true,
    },
    { etiqueta: 'Construible', valor: construibleM2, tipo: 'area' },
    { etiqueta: 'Precio total', valor: precioMxn, tipo: 'dinero' },
  ];

  return (
    <section className="border-b border-[var(--lp-line)] bg-[var(--lp-paper)]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
        {/* DOS COLUMNAS, NO CUATRO. A cuatro columnas y 1440 px, cada celda mide
            unos 280 px y «$1,010,880 MXN» a 4rem mide bastante más: las cifras
            se salían de su columna y se montaban sobre la siguiente. Bajar el
            cuerpo hasta que cupieran habría devuelto la página al problema que
            esta banda existe para resolver.

            En 2×2 cada celda tiene ~600 px, la escala de cartel se sostiene, y
            de paso se gana jerarquía: enganche y mensualidad arriba, que son las
            dos cifras con las que se decide, y construible y precio total
            debajo. El orden deliberado se conserva —se lee en Z, no en columna. */}
        <Escalonado
          className="grid grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2"
          intervalo={0.09}
        >
          {cifras.map((c) => (
            <Escalon key={c.etiqueta}>
              <div className="flex flex-col">
                <span className="text-[0.625rem] uppercase tracking-[0.16em] text-[var(--lp-muted)]">
                  {c.etiqueta}
                </span>

                {/* La regla de acento bajo la etiqueta es lo único que sustituye
                    a la caja: da estructura de columna sin encerrar la cifra. */}
                <span
                  aria-hidden="true"
                  className={`mt-3 block h-px w-full ${
                    c.protagonista ? 'bg-[var(--lp-accent)]' : 'bg-[var(--lp-line)]'
                  }`}
                />

                <span
                  className={`lp-display lp-num mt-4 block leading-[0.95] ${
                    c.protagonista
                      ? 'text-[clamp(2.5rem,1.4rem+3.4vw,4rem)] text-[var(--lp-accent)]'
                      : 'text-[clamp(1.875rem,1.3rem+2vw,2.75rem)] text-[var(--lp-ink)]'
                  }`}
                >
                  {c.valor === null ? (
                    <a href="#falta-confirmar" className="lp-gate text-base">
                      falta confirmar
                    </a>
                  ) : c.tipo === 'dinero' ? (
                    // `whitespace-nowrap`: el número y su moneda son una unidad
                    // tipográfica. Si el «MXN» se va solo a la línea siguiente,
                    // la cifra queda publicada sin moneda durante una lectura.
                    <span className="whitespace-nowrap">
                      <Contador valor={c.valor} formato={mxnDesnudo} />
                      <span className="ml-2 align-baseline text-[0.3em] font-medium tracking-[0.12em] text-[var(--lp-muted)]">
                        MXN
                      </span>
                    </span>
                  ) : (
                    <Contador valor={c.valor} formato={m2} />
                  )}
                </span>
              </div>
            </Escalon>
          ))}
        </Escalonado>

        {/* Las dos líneas de honestidad, íntegras. Van DESPUÉS del valor y
            antes de cualquier otra cosa: recolocadas, nunca suavizadas. */}
        <Reveal delay={0.15}>
          <div className="mt-14 grid gap-x-12 gap-y-4 border-t border-[var(--lp-line-soft)] pt-7 md:grid-cols-2">
            {contraentrega ? (
              <p className="max-w-[54ch] text-sm leading-relaxed text-[var(--lp-muted)]">
                Más un pago final de{' '}
                <span className="lp-num text-[var(--lp-ink-soft)]">
                  {mxnDesnudo(contraentrega.montoMxn)} MXN
                </span>{' '}
                contra entrega, que es el {contraentrega.pct}% del precio. Te mandamos
                la tabla de amortización completa por escrito.
              </p>
            ) : (
              <p className="max-w-[54ch] text-sm leading-relaxed text-[var(--lp-muted)]">
                El precio por metro cuadrado es{' '}
                {precioM2Mxn ? `${mxnDesnudo(precioM2Mxn)} MXN` : 'por confirmar'}. La
                mensualidad la publicamos en cuanto el desarrollador declare la tasa por
                escrito.
              </p>
            )}

            <p className="max-w-[54ch] text-sm leading-relaxed text-[var(--lp-ink-soft)]">
              Hoy el lote no tiene servicios conectados y no es escriturable. Abajo está
              el detalle servicio por servicio, con las fechas que declara el
              desarrollador y{' '}
              <a href="#falta-confirmar" className="lp-gate">
                lo que todavía no podemos confirmar
              </a>
              .
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
