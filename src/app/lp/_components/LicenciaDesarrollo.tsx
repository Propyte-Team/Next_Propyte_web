import { Gate, RULE_DARK } from './ui';
import { fechaLarga } from './format';
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
// Se dibuja como el sello de un documento oficial: cuatro campos en reja, sobre
// fondo oscuro, al pie del bloque jurídico. Mientras estén vacíos publica el
// hueco en lugar de omitirlo, porque omitirlo sería incumplir en silencio.
// ============================================================

export default function LicenciaDesarrollo({ licencia }: { licencia: Licencia }) {
  const campos = [
    {
      etiqueta: 'Licencia del desarrollo',
      valor: licencia.licenciaNumero,
      falta: 'número de licencia municipal',
    },
    {
      etiqueta: 'Fecha de licencia',
      valor: licencia.licenciaFecha ? fechaLarga(licencia.licenciaFecha) : null,
      falta: 'fecha de licencia',
    },
    {
      etiqueta: 'Autorización de venta',
      valor: licencia.autorizacionNumero,
      falta: 'número de autorización de venta',
    },
    {
      etiqueta: 'Fecha de autorización',
      valor: licencia.autorizacionFecha ? fechaLarga(licencia.autorizacionFecha) : null,
      falta: 'fecha de autorización',
    },
  ];

  return (
    <section
      aria-labelledby="licencia-titulo"
      className={`border ${RULE_DARK} bg-white/[0.03] p-5 sm:p-6`}
    >
      <h3
        id="licencia-titulo"
        className="font-display text-base font-semibold tracking-tight text-white"
      >
        Licencia y autorización de venta
      </h3>

      <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {campos.map((c) => (
          <div key={c.etiqueta}>
            <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-white/40">
              {c.etiqueta}
            </dt>
            <dd className="mt-1.5 font-mono text-sm text-white/85">
              {c.valor ?? <Gate que={c.falta} tono="oscuro" />}
            </dd>
          </div>
        ))}
      </dl>

      {!licencia.completa && (
        <p className={`mt-6 border-t ${RULE_DARK} pt-4 max-w-[62ch] text-xs leading-relaxed text-white/55`}>
          Estos cuatro datos son obligatorios en la publicidad de lotes conforme al
          artículo 69 de la Ley de Asentamientos Urbanos de Quintana Roo. Los
          estamos recabando con el desarrollador y los publicamos aquí en cuanto los
          tengamos por escrito. Si los necesitas antes de avanzar, pídelos y te los
          enviamos en cuanto lleguen.
        </p>
      )}
    </section>
  );
}
