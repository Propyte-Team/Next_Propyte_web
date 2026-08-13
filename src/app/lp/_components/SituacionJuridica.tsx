import { EnlaceGate } from './ui';
import LicenciaDesarrollo from './LicenciaDesarrollo';
import type { LoteLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Situación jurídica, sin adjetivos. Panel del módulo «Antes de firmar».
//
// Vivía inline en `page.tsx`. Se extrajo al consolidar los cinco bloques de
// riesgo: 200 líneas de JSX jurídico dentro del archivo de página hacían que
// reordenar la página fuera un ejercicio de mover llaves.
//
// El contenido va íntegro, incluida la frase que más cuesta escribir: que no
// usamos «certeza jurídica absoluta» porque ninguna comercializadora puede
// sostenerla.
// ============================================================

export default function SituacionJuridica({ lote }: { lote: LoteLanding }) {
  return (
    <div className="flex flex-col gap-8">
      <dl className="flex flex-col gap-6">
        <div>
          <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-white/40">
            Régimen
          </dt>
          <dd className="mt-2 max-w-[58ch] text-sm leading-relaxed text-white/80">
            {lote.regimenPropiedad ?? (
              <EnlaceGate que="régimen de propiedad" tono="oscuro" />
            )}
            . Opera con reglamento de construcción y comité de arquitectura que
            revisa cada proyecto antes de iniciar obra.
          </dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-white/40">
            Uso de suelo
          </dt>
          <dd className="mt-2 max-w-[58ch] text-sm leading-relaxed text-white/80">
            <span className="font-mono">{lote.usoSuelo ?? 'por confirmar'}</span>, con
            COS 0.55 y CUS 1.60 según la ficha técnica del desarrollador. Definen
            cuánto puedes ocupar en planta y cuánto construir en total.
          </dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-white/40">
            Escrituración
          </dt>
          <dd className="mt-2 max-w-[58ch] text-sm leading-relaxed text-white/80">
            Proyectada a finales de 2026 según el desarrollador. Hoy el título está en
            fideicomiso, así que el lote no es escriturable. No usamos la expresión
            &laquo;certeza jurídica absoluta&raquo;: ninguna comercializadora puede
            sostenerla.
          </dd>
        </div>
        {lote.rentasCortoPlazoPermitidas !== null && (
          <div>
            <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-white/40">
              Renta de corto plazo
            </dt>
            <dd className="mt-2 max-w-[58ch] text-sm leading-relaxed text-white/80">
              {lote.rentasCortoPlazoPermitidas
                ? 'Permitida conforme a los estatutos de la privada, una vez que exista construcción. Un terreno sin construir no genera renta.'
                : 'No permitida conforme a los estatutos de la privada.'}
            </dd>
          </div>
        )}
      </dl>

      <LicenciaDesarrollo licencia={lote.licencia} actualizado={lote.fechaCorte} />
    </div>
  );
}
