import { Campo, BloqueCampos, EnlaceGate, TituloSeccion } from './ui';
import { mxn, mxnExacto, m2 } from './format';
import type { LoteLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Ficha del lote.
//
// El brief pedía una tabla comparativa ordenable por MXN/m². Con un solo lote
// disponible no hay nada que ordenar, así que es una ficha de campos. Lo que se
// conserva es lo que ningún competidor de este SERP publica: el precio por
// metro cuadrado y el estatus real de urbanización, sin eufemismos.
//
// Gramática de plano catastral: campos reglados con regla vertical entre
// etiqueta y dato. En móvil las columnas se estrechan pero no se apilan: la
// lectura de documento depende de que la reja se mantenga.
// ============================================================

export default function FichaLote({ lote }: { lote: LoteLanding }) {
  const plazoMax = lote.plan?.opciones.at(-1) ?? null;

  return (
    <section aria-labelledby="ficha-titulo">
      <TituloSeccion id="ficha-titulo">El lote, con todos sus números</TituloSeccion>

      <div className="mt-6 border-t-2 border-[var(--lp-accent)]">
        <BloqueCampos>
          <Campo etiqueta="Superficie">
            {lote.superficieM2 ? m2(lote.superficieM2) : <EnlaceGate que="superficie" />}
          </Campo>

          <Campo etiqueta="Precio">
            {lote.precioMxn ? `${mxn(lote.precioMxn)}` : <EnlaceGate que="precio" />}
          </Campo>

          <Campo etiqueta="Precio por m²" destacado>
            {lote.precioM2Mxn ? (
              `${mxnExacto(lote.precioM2Mxn)}`
            ) : (
              <EnlaceGate que="superficie para calcular el precio por m²" />
            )}
          </Campo>

          {/* Consecuencia del uso de suelo. Va junto al precio a propósito: es
              el denominador que cambia cómo se lee el precio por m². */}
          <Campo etiqueta="Construible" destacado>
            {lote.aprovechamiento ? (
              <>
                {m2(lote.aprovechamiento.construibleM2)}
                <span className="block text-xs text-[var(--lp-muted)]">
                  COS {lote.aprovechamiento.cos} · CUS {lote.aprovechamiento.cus}, hasta{' '}
                  {m2(lote.aprovechamiento.huellaM2)} en planta
                </span>
              </>
            ) : (
              <EnlaceGate que="superficie para calcular lo construible" />
            )}
          </Campo>

          <Campo etiqueta="Enganche">
            {lote.enganchePct && lote.engancheMxn !== null ? (
              <>
                Desde {lote.enganchePct}%
                <span className="text-[var(--lp-muted)]">
                  {'  '}
                  {mxn(lote.engancheMxn)}
                </span>
              </>
            ) : (
              <EnlaceGate que="enganche" />
            )}
          </Campo>

          {/* La mensualidad es la cifra de mayor palanca de conversión en este
              segmento, y por eso mismo publicarla asumiendo 0% de interés y
              descubrir después que hay tasa convertiría la página en publicidad
              engañosa. Se publica sólo cuando `construirPlan` devuelve plan, y
              eso exige que la tasa esté declarada como dato. */}
          <Campo etiqueta="Mensualidad" destacado>
            {plazoMax ? (
              <>
                {mxn(plazoMax.mensualidadMxn)}
                <span className="block text-xs text-[var(--lp-muted)]">
                  {plazoMax.pagos} pagos a {plazoMax.meses} meses, sin intereses
                </span>
              </>
            ) : (
              <EnlaceGate que="tasa de financiamiento" />
            )}
          </Campo>

          <Campo etiqueta="Plazos">
            {lote.mesesOpciones.length > 0 ? (
              `Hasta ${Math.max(...lote.mesesOpciones)} meses`
            ) : lote.mesesNota ? (
              lote.mesesNota
            ) : (
              <EnlaceGate que="plazos de financiamiento" />
            )}
          </Campo>

          <Campo etiqueta="Urbanización" destacado>
            {lote.ningunServicioHoy
              ? 'Ningún servicio conectado hoy'
              : lote.subtipoLiteral ?? <EnlaceGate que="estatus de urbanización" />}
          </Campo>

          <Campo etiqueta="Escrituración">
            {lote.escrituraDisponibleHoy
              ? 'Inmediata, cumplido el calendario de pagos del contrato'
              : 'Proyectada. Hoy el lote no es escriturable'}
          </Campo>
        </BloqueCampos>
      </div>

      {/* ───── Cómo leer este precio ─────
          La versión anterior invitaba a comparar precio por m² contra cualquier
          otro terreno y ahí se detenía. Es honesto y, tal cual, trabajaba para
          la competencia: en el mismo fraccionamiento hay lotes anunciados a la
          mitad de este precio por metro, y varios ya tienen servicios o son
          reventa con escritura inmediata.

          La invitación a comparar se conserva —quitarla sería exactamente lo
          contrario de la marca— pero se completa con los cuatro renglones que
          hacen que la comparación signifique algo. No es un truco retórico:
          cada uno es verificable en el otro terreno. */}
      <div className="mt-5 max-w-[62ch] text-sm leading-relaxed text-[var(--lp-ink-soft)]">
        {lote.precioM2Mxn && lote.superficieM2 ? (
          <>
            <p>
              <strong className="font-semibold text-[var(--lp-ink)]">
                Cómo leer este precio.
              </strong>{' '}
              Son {mxnExacto(lote.precioM2Mxn)} por metro cuadrado sobre{' '}
              {m2(lote.superficieM2)}. Vas a encontrar terrenos en Playa del Carmen
              a la mitad de ese precio por metro, y conviene que los veas. Antes de
              comparar, revisa cuatro cosas en el otro terreno:
            </p>
            <ol className="mt-3 flex flex-col gap-2">
              {[
                'Si está en régimen de condominio o es un lote suelto.',
                'Si la urbanización corre por cuenta del desarrollador o por la tuya.',
                'Si tiene amenidades entregables por contrato.',
                'Si te lo financian a 48 o 60 meses o hay que pagarlo de contado.',
              ].map((criterio, i) => (
                <li key={criterio} className="grid grid-cols-[1.5rem_1fr] gap-x-2">
                  <span
                    aria-hidden="true"
                    className="lp-num text-xs text-[var(--lp-muted)]"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{criterio}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3">
              Cuando esos cuatro renglones estén en la mesa, la comparación por metro
              cuadrado significa algo. Antes, no.
            </p>
          </>
        ) : (
          <p>
            <strong className="font-semibold text-[var(--lp-ink)]">Cómo leer este precio.</strong>{' '}
            El precio por metro cuadrado es lo que permite comparar este lote contra
            cualquier otro. Todavía no lo publicamos porque falta confirmar la
            superficie exacta, y preferimos decírtelo antes que estimarlo.
          </p>
        )}
      </div>
    </section>
  );
}
