import { Campo, BloqueCampos, Gate, TituloSeccion } from './ui';
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
  return (
    <section aria-labelledby="ficha-titulo">
      <TituloSeccion id="ficha-titulo">El lote, con todos sus números</TituloSeccion>

      <div className="mt-6 border-t-2 border-navy">
        <BloqueCampos>
          <Campo etiqueta="Superficie">
            {lote.superficieM2 ? m2(lote.superficieM2) : <Gate que="superficie" />}
          </Campo>

          <Campo etiqueta="Precio">
            {lote.precioMxn ? `${mxn(lote.precioMxn)} MXN` : <Gate que="precio" />}
          </Campo>

          <Campo etiqueta="Precio por m²" destacado>
            {lote.precioM2Mxn ? (
              `${mxnExacto(lote.precioM2Mxn)} MXN`
            ) : (
              <Gate que="superficie para calcular el precio por m²" />
            )}
          </Campo>

          <Campo etiqueta="Enganche">
            {lote.enganchePct ? (
              <>
                Desde {lote.enganchePct}%
                {lote.precioMxn && (
                  <span className="text-graphite/55">
                    {'  '}
                    {mxn((lote.precioMxn * lote.enganchePct) / 100)} MXN
                  </span>
                )}
              </>
            ) : (
              <Gate que="enganche" />
            )}
          </Campo>

          {/* Gate deliberado. La mensualidad es la cifra de mayor palanca de
              conversión en este segmento, y por eso mismo publicarla asumiendo
              0% de interés y descubrir después que hay tasa convertiría la
              página en publicidad engañosa. Cerrar el gate es un cambio de
              dato: basta poblar `fin_tasa`. */}
          <Campo etiqueta="Mensualidad">
            <Gate que="tasa de financiamiento" />
          </Campo>

          <Campo etiqueta="Plazos">
            {lote.mesesOpciones.length > 0 ? (
              `Hasta ${Math.max(...lote.mesesOpciones)} meses`
            ) : lote.mesesNota ? (
              lote.mesesNota
            ) : (
              <Gate que="plazos de financiamiento" />
            )}
          </Campo>

          <Campo etiqueta="Urbanización" destacado>
            {lote.ningunServicioHoy
              ? 'Ningún servicio conectado hoy'
              : lote.subtipoLiteral ?? <Gate que="estatus de urbanización" />}
          </Campo>

          <Campo etiqueta="Escrituración">
            {lote.escrituraDisponibleHoy
              ? 'Inmediata, cumplido el calendario de pagos del contrato'
              : 'Proyectada. Hoy el lote no es escriturable'}
          </Campo>
        </BloqueCampos>
      </div>

      <p className="mt-5 max-w-[62ch] text-sm leading-relaxed text-graphite">
        {lote.precioM2Mxn && lote.superficieM2 ? (
          <>
            <strong className="font-semibold text-navy">Cómo leer esta ficha.</strong>{' '}
            El precio por metro cuadrado es lo que permite comparar este lote
            contra cualquier otro, y es el dato que casi nadie publica. Aquí son{' '}
            {mxnExacto(lote.precioM2Mxn)} sobre {m2(lote.superficieM2)}. Si te
            ofrecen un terreno sin ese número, pídelo: un ticket total más bajo
            puede salir más caro por metro.
          </>
        ) : (
          <>
            <strong className="font-semibold text-navy">Cómo leer esta ficha.</strong>{' '}
            El precio por metro cuadrado es lo que permite comparar este lote
            contra cualquier otro. Todavía no lo publicamos porque falta
            confirmar la superficie exacta, y preferimos decírtelo antes que
            estimarlo.
          </>
        )}
      </p>
    </section>
  );
}
