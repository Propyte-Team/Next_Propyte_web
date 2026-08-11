import Image from 'next/image';
import { EnlaceGate, EstadoServicio, TituloSeccion, RULE_DARK } from './ui';
import { mesAnio } from './format';
import type { LoteLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Urbanización real. La sección va sobre fondo oscuro a propósito.
//
// Los competidores de este SERP anuncian "100% urbanizado" sin evidencia. El
// registro de este lote declara lo contrario, servicio por servicio y con
// fechas. Publicar eso es el activo de conversión más fuerte de la página y
// también el filtro más eficaz, así que merece su propio mundo visual: es el
// único bloque donde el cian de marca hace de tinta de datos.
//
// El registro advierte que las fechas son de otra etapa y que la de ESTE lote
// no está confirmada. Esa advertencia se publica: presentar las fechas como si
// fueran del lote sería tergiversación.
// ============================================================

export default function UrbanizacionReal({ lote }: { lote: LoteLanding }) {
  return (
    <section aria-labelledby="urb-titulo" className="bg-aztec">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <TituloSeccion id="urb-titulo" tono="oscuro">
              Qué tiene el lote hoy, y qué falta
            </TituloSeccion>

            {lote.ningunServicioHoy && (
              <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-white/75">
                <strong className="font-semibold text-aqua-bright">
                  Hoy no hay ningún servicio conectado.
                </strong>{' '}
                Ninguno. Todos están proyectados. Lo ponemos antes de la tabla, no
                después, porque es el dato que más cambia la decisión y el que la
                mayoría de los anuncios de esta zona omite.
              </p>
            )}

            <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-white/50">
              Fechas declaradas por el desarrollador, sujetas a su calendario de
              obra. Corresponden a una etapa cuya correspondencia con este lote
              todavía no está confirmada. Pídelo por escrito antes de firmar, y si
              no te lo dan por escrito, eso también es información.
            </p>

            <div className="mt-5">
              <EnlaceGate que="etapa a la que pertenece este lote" tono="oscuro" />
            </div>

            {/* Aérea REAL del polígono, no render. Es la única imagen de la
                página que muestra el lote como está hoy: vialidades trazadas y
                terreno sin construir. Va justo aquí porque la sección afirma
                que no hay ningún servicio conectado, y una foto que lo confirma
                vale más que la tabla. Los renders viven arriba, etiquetados
                como lo que son. */}
            {lote.imagenes.urbanizacion && (
              <div className="relative mt-8 aspect-[16/10]">
                <Image
                  src={lote.imagenes.urbanizacion.url}
                  alt={lote.imagenes.urbanizacion.alt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 38vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {lote.servicios.length > 0 ? (
            <div className={`border-t-2 border-aqua-bright/45`}>
              <dl className={`border-x border-b ${RULE_DARK}`}>
                {lote.servicios.map((s) => {
                  const fecha = mesAnio(s.fechaEstimada);
                  return (
                    <div
                      key={s.clave}
                      className={`grid grid-cols-[1fr_auto] items-baseline gap-4 border-t ${RULE_DARK} px-4 py-3.5`}
                    >
                      <dt className="text-sm text-white/85">
                        <span className="capitalize">{s.etiqueta}</span>
                        {s.detalle && (
                          <span className="block text-xs text-white/40">{s.detalle}</span>
                        )}
                      </dt>
                      <dd className="text-right font-mono text-xs tabular-nums">
                        <EstadoServicio estado={s.estado} />
                        {fecha && (
                          <span className="block text-white/45">{fecha}</span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ) : (
            <div className="self-start">
              <EnlaceGate que="estatus de urbanización servicio por servicio" tono="oscuro" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
