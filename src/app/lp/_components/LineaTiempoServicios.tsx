'use client';

import { motion } from 'framer-motion';
import { DUR, EASE_ENTRADA } from './motion';
import { EstadoServicio } from './ui';
import { mesAnio } from './format';
import type { ServicioUrbanizacion } from '@/lib/supabase/lp-lotes';

// ============================================================
// El calendario de urbanización, como calendario.
//
// ANTES ERA UNA TABLA de cinco filas: servicio a la izquierda, estado y fecha a
// la derecha. Toda la información estaba ahí, pero la tabla dice «aquí hay
// cinco cosas» y esconde lo único que el comprador necesita entender: que HOY
// no hay nada, y que lo que hay son dos fechas, no cinco. Cuatro servicios caen
// en el mismo mes; leídos en filas separadas parecen cuatro promesas
// independientes.
//
// AGRUPAR POR FECHA ES LA TESIS. El eje es el tiempo: primero hoy, luego cada
// mes declarado. Así se ve de un golpe la distancia real entre firmar y tener
// servicios, que es exactamente el dato que la sección existe para no esconder.
//
// NO SE PIERDE NI SE SUAVIZA NADA. Cada servicio conserva su etiqueta, su
// detalle y su chip de estado individual —no se hereda del grupo—, y la
// advertencia sobre que las fechas son de otra etapa sigue viviendo arriba, en
// `UrbanizacionReal`, antes de este bloque.
//
// EL ORDEN NO SE ESCRIBE A MANO. Las claves son 'YYYY-MM', que ordenan
// alfabéticamente igual que cronológicamente. Lo que no trae fecha va al final,
// declarado como sin fecha en vez de colocado en un mes inventado.
// ============================================================

const SIN_FECHA = 'sin-fecha';

export default function LineaTiempoServicios({
  servicios,
}: {
  servicios: ServicioUrbanizacion[];
}) {

  const disponibles = servicios.filter((s) => s.estado === 'disponible');
  const pendientes = servicios.filter((s) => s.estado !== 'disponible');

  const porFecha = new Map<string, ServicioUrbanizacion[]>();
  for (const s of pendientes) {
    const clave = s.fechaEstimada ?? SIN_FECHA;
    const grupo = porFecha.get(clave);
    if (grupo) grupo.push(s);
    else porFecha.set(clave, [s]);
  }

  const claves = [...porFecha.keys()].sort((a, b) => {
    if (a === SIN_FECHA) return 1;
    if (b === SIN_FECHA) return -1;
    return a.localeCompare(b);
  });

  // El primer nodo es siempre el presente: lo que hay conectado hoy, aunque la
  // respuesta sea «nada». Omitirlo cuando está vacío haría que la línea
  // empezara en 2027, que es justo la lectura optimista que aquí no toca.
  const nodos = [
    {
      clave: 'hoy',
      titulo: 'Hoy',
      servicios: disponibles,
      vacio: 'Ningún servicio conectado',
      presente: true,
    },
    ...claves.map((c) => ({
      clave: c,
      titulo: c === SIN_FECHA ? 'Sin fecha declarada' : (mesAnio(c) ?? c),
      servicios: porFecha.get(c) ?? [],
      vacio: null,
      presente: false,
    })),
  ];

  // Sin ramas por `prefers-reduced-motion`: lo resuelve `MotionConfig` en el
  // layout. Ver la cabecera de `motion.tsx` para por qué decidirlo aquí rompía.
  const anim = (i: number) => ({
    initial: { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-10% 0px -10% 0px' },
    transition: { duration: DUR.media, ease: EASE_ENTRADA, delay: 0.12 + i * 0.12 },
  });

  return (
    <div className="relative">
      {/* El trazo se dibuja de arriba abajo, en el sentido en que se lee el
          calendario. `bottom-6` lo corta antes del último punto: una línea que
          sigue más allá del último hito sugiere una fecha que nadie declaró. */}
      <motion.div
        aria-hidden="true"
        className="absolute bottom-6 left-[3px] top-2 w-px origin-top bg-gradient-to-b from-[var(--lp-accent-on-dark)] via-[var(--lp-accent-on-dark)]/50 to-[var(--lp-line-dark)]"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
        transition={{ duration: DUR.larga, ease: EASE_ENTRADA }}
      />

      <ol className="flex flex-col gap-9">
        {nodos.map((n, i) => (
          <motion.li key={n.clave} className="relative flex gap-5" {...anim(i)}>
            <span
              aria-hidden="true"
              className={`mt-2 size-[7px] shrink-0 rounded-full ring-4 ring-[var(--lp-dark)] ${
                n.presente ? 'bg-[var(--lp-accent-on-dark)]' : 'bg-white/35'
              }`}
            />

            <div className="min-w-0 flex-1">
              <h4
                className={`lp-display text-base leading-none ${
                  n.presente ? 'text-[var(--lp-accent-on-dark)]' : 'text-white/85'
                }`}
              >
                {n.titulo}
              </h4>

              {n.servicios.length === 0 ? (
                <p className="mt-2.5 text-sm text-white/60">{n.vacio}</p>
              ) : (
                <dl className="mt-3 flex flex-col gap-2.5">
                  {n.servicios.map((s) => (
                    <div
                      key={s.clave}
                      className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-[var(--lp-line-dark)] pb-2.5 last:border-0 last:pb-0"
                    >
                      <dt className="min-w-0 text-sm text-white/85">
                        <span className="capitalize">{s.etiqueta}</span>
                        {s.detalle && (
                          <span className="block text-xs text-white/40">{s.detalle}</span>
                        )}
                      </dt>
                      {/* El estado viaja con cada servicio, no con el grupo: dos
                          servicios pueden compartir mes y no estado. */}
                      <dd className="lp-num shrink-0 text-right text-xs">
                        <EstadoServicio estado={s.estado} />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
