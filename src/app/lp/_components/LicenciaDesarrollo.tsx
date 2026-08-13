import { RULE_DARK } from './ui';
import { fechaLarga } from './format';
import PendingStatus from './PendingStatus';
import type { LicenciaDesarrollo as Licencia } from '@/lib/supabase/lp-lotes';

// ============================================================
// Licencia del desarrollo y autorización de venta municipal.
//
// Ley de Asentamientos Urbanos del Estado de Quintana Roo, artículo 69, último
// párrafo: toda publicidad donde se oferten lotes debe citar el número y la
// fecha de la licencia del desarrollo y de la autorización de venta del
// Ayuntamiento. Una landing de pago que oferta lotes es publicidad en el
// sentido más literal de la norma.
//
// DOS ESTADOS, NUNCA UNA REJA VACÍA. Cuando los cuatro datos existen se dibuja
// como el sello de un documento oficial: cuatro campos en reja. Cuando no
// existen —que es hoy— la reja de cuatro huecos se leía como un formulario a
// medio llenar, y publicar el incumplimiento así hacía más daño que declararlo
// en una frase. En su lugar va un solo estado con dueño y fecha.
//
// Lo que NO cambia: el hueco se sigue publicando. Omitirlo sería incumplir en
// silencio, que es justo lo que el artículo 69 persigue.
// ============================================================

export default function LicenciaDesarrollo({
  licencia,
  actualizado,
}: {
  licencia: Licencia;
  /** Fecha de corte de la consulta: cuándo se verificó por última vez. */
  actualizado: string | null;
}) {
  return (
    <section
      aria-labelledby="licencia-titulo"
      className={`border ${RULE_DARK} bg-white/[0.03] p-5 sm:p-6`}
    >
      <h3
        id="licencia-titulo"
        className="lp-display text-base font-semibold tracking-tight text-white"
      >
        Licencia y autorización de venta
      </h3>

      {licencia.completa ? (
        <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {[
            { etiqueta: 'Licencia del desarrollo', valor: licencia.licenciaNumero },
            {
              etiqueta: 'Fecha de licencia',
              valor: licencia.licenciaFecha ? fechaLarga(licencia.licenciaFecha) : null,
            },
            { etiqueta: 'Autorización de venta', valor: licencia.autorizacionNumero },
            {
              etiqueta: 'Fecha de autorización',
              valor: licencia.autorizacionFecha
                ? fechaLarga(licencia.autorizacionFecha)
                : null,
            },
          ].map((c) => (
            <div key={c.etiqueta}>
              <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-white/40">
                {c.etiqueta}
              </dt>
              <dd className="mt-1.5 font-mono text-sm text-white/85">{c.valor}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="mt-5">
          <PendingStatus
            tono="oscuro"
            titulo="Licencia del desarrollo y autorización de venta municipal"
            actualizado={actualizado}
            cta={
              <>
                Pídelas y te las mandamos el mismo día en que las tengamos.{' '}
                <a
                  href="#solicitar"
                  className="underline decoration-white/30 underline-offset-4 transition-colors duration-200 hover:text-white"
                >
                  Pedirlas
                </a>
                .
              </>
            }
          >
            Son obligatorias conforme al artículo 69 de la Ley de Asentamientos
            Urbanos de Quintana Roo. Todavía no las tenemos por escrito del
            desarrollador; las estamos recabando y se publican aquí en cuanto
            lleguen.{' '}
            <a
              href="#falta-confirmar"
              className="underline decoration-white/30 underline-offset-4 transition-colors duration-200 hover:text-white"
            >
              Qué más falta
            </a>
            .
          </PendingStatus>
        </div>
      )}
    </section>
  );
}
