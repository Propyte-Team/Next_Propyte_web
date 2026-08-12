import Image from 'next/image';
import { ExternalLink } from '@/lib/icons';
import { EnlaceGate, TituloSeccion, RULE_LIGHT } from './ui';
import type { LoteLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Prueba de que existimos.
//
// Sustituye los tres bullets genéricos de "Por qué a través de Propyte". En un
// mercado donde la objeción dominante es el fraude, lo que convierte no es un
// testimonio: es verificabilidad. Una dirección a la que puedes ir, una persona
// con nombre y cara, y un contrato que puede revisar tu abogado.
//
// Dirección, horario y asesor vienen del Hub, no de un documento. La dirección
// canónica de `Propyte_site_config` es la 5ta Avenida; cualquier otra que
// circule en briefs externos no está respaldada por la fuente de verdad.
// ============================================================

export default function PruebaDeQueExistimos({ lote }: { lote: LoteLanding }) {
  const { asesor, oficina, costos } = lote;
  const apartado = costos?.cargosUnicos.find((c) =>
    c.concepto.toLowerCase().includes('apartado'),
  );

  return (
    <section aria-labelledby="prueba-titulo">
      <TituloSeccion id="prueba-titulo">Cómo compruebas que existimos</TituloSeccion>

      <div className="mt-6 grid gap-px border-t-2 border-[var(--lp-accent)] bg-[var(--lp-line)] sm:grid-cols-2">
        {oficina && (
          <div className="bg-white p-5">
            <h3 className="text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--lp-muted)]">
              Oficina física
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-[var(--lp-ink-soft)]">
              {oficina.direccion}
            </p>
            <p className="mt-1 lp-num text-xs text-[var(--lp-muted)]">
              {oficina.horario}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--lp-ink)]">
              Puedes venir a revisar los documentos en papel antes de apartar.
            </p>
          </div>
        )}

        {asesor && (
          <div className="bg-white p-5">
            <h3 className="text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--lp-muted)]">
              Quién te atiende
            </h3>
            <div className="mt-3 flex items-center gap-3">
              {asesor.fotoUrl && (
                <Image
                  src={asesor.fotoUrl}
                  alt={asesor.nombre}
                  width={48}
                  height={48}
                  loading="lazy"
                  className="size-12 shrink-0 object-cover"
                />
              )}
              <div>
                <p className="text-sm font-medium text-[var(--lp-ink)]">{asesor.nombre}</p>
                <p className="text-xs text-[var(--lp-muted)]">{asesor.rol}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--lp-ink-soft)]">
              Una persona con nombre y cargo, no &laquo;un asesor&raquo;.{' '}
              <a
                href="/es/nosotros/equipo-comercial"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-baseline gap-1 text-[var(--lp-accent)] underline decoration-[var(--lp-accent)]/40 underline-offset-4 transition-colors duration-200 hover:decoration-[var(--lp-accent)]"
              >
                Ve al equipo completo
                <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
              </a>
            </p>
          </div>
        )}
      </div>

      <div className={`mt-6 border-x border-b border-t-2 border-t-[var(--lp-accent)] ${RULE_LIGHT}`}>
        <div className={`border-t ${RULE_LIGHT} px-4 py-4`}>
          <h3 className="text-sm font-medium text-[var(--lp-ink)]">Antes de que firmes nada</h3>
          <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-[var(--lp-ink-soft)]">
            Te mandamos el contrato para que lo revise tu abogado, y el paquete
            documental completo: licencia del desarrollo, autorización de venta
            municipal y régimen de propiedad.
          </p>
        </div>

        <div className={`border-t ${RULE_LIGHT} px-4 py-4`}>
          <h3 className="text-sm font-medium text-[var(--lp-ink)]">Apartado</h3>
          <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-[var(--lp-ink-soft)]">
            {apartado ? (
              <>
                {apartado.monto}, {apartado.momento}.{' '}
              </>
            ) : (
              <>El monto del apartado lo confirmamos por escrito. </>
            )}
            Las condiciones de devolución todavía no están publicadas por el
            desarrollador, y es la pregunta que más conviene resolver antes de
            entregar dinero:
          </p>
          <p className="mt-2.5">
            <EnlaceGate que="condiciones de devolución del apartado" />
          </p>
        </div>

        <div className={`border-t ${RULE_LIGHT} px-4 py-4`}>
          <h3 className="text-sm font-medium text-[var(--lp-ink)]">Cómo validamos lo que listamos</h3>
          <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-[var(--lp-ink-soft)]">
            Cinco criterios documentados antes de publicar cualquier propiedad, y la
            información de urbanización la verificamos en campo en lugar de copiarla
            del brochure.{' '}
            <a
              href="/es/metodologia"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-baseline gap-1 text-[var(--lp-accent)] underline decoration-[var(--lp-accent)]/40 underline-offset-4 transition-colors duration-200 hover:decoration-[var(--lp-accent)]"
            >
              Lee la metodología
              <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
