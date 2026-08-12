'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from '@/lib/icons';
import { trackGenerateLead } from '@/lib/analytics/track';

// ============================================================
// Formulario multi-paso.
//
// Resuelve una tensión real en vez de promediarla: la evidencia de conversión
// empuja a formularios cortos, y la operación de Propyte necesita calificar para
// no quemar tiempo de asesor. La salida es un multi-paso con la calificación al
// inicio (dos taps, cero escritura) y el contacto al final. Fricción de un
// formulario de tres campos, calificación de uno de seis.
//
// Atribución: `gclid`/`wbraid`/UTMs se leen de la URL y viven en estado React
// hasta el POST. Deliberadamente NO se usa `useUTMCapture`, que los persiste en
// sessionStorage.
// ============================================================

const OBJETIVOS = [
  'Construir mi casa',
  'Inversión a mediano plazo',
  'Todavía estoy comparando',
] as const;

const PRESUPUESTOS = [
  'Hasta $400,000',
  '$400,000 a $800,000',
  '$800,000 a $1.5M',
  'Más de $1.5M',
] as const;

const CLAVES_URL = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'wbraid',
  'fbclid',
] as const;

type Atribucion = Partial<Record<(typeof CLAVES_URL)[number], string>>;

/**
 * Eventos secundarios de observación, no de puja. No hay helper canónico porque
 * son específicos de esta landing; gtag hace queue antes de cargar, así que es
 * seguro llamarlo dentro del handler.
 */
function emitirPaso(evento: string) {
  if (typeof window === 'undefined') return;
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  w.gtag?.('event', evento, { form_type: 'lp_lotes_pdc' });
}

const OPCION =
  'group flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-3 border border-[var(--lp-line)] bg-white px-4 text-left text-sm text-[var(--lp-ink-soft)] transition-colors duration-200 hover:border-[var(--lp-accent)] hover:bg-[var(--lp-accent)]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-accent)]';

const INPUT =
  'min-h-[52px] w-full border border-[var(--lp-line)] bg-white px-4 font-mono text-sm text-[var(--lp-ink-soft)] transition-colors duration-200 placeholder:font-sans placeholder:text-[var(--lp-ink-soft)]/35 focus:border-[var(--lp-accent)] focus:outline-2 focus:outline-offset-0 focus:outline-[var(--lp-accent)]';

const ETIQUETA = 'text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--lp-muted)]';

export default function LeadFormLotes({
  loteNombre,
  plazoMeses,
}: {
  loteNombre: string;
  /** Plazo máximo publicado, para que el asesor abra sabiendo de qué plan se habla. */
  plazoMeses: number | null;
}) {
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [presupuesto, setPresupuesto] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const atribucion = useRef<Atribucion>({});
  const honeypot = useRef<HTMLInputElement>(null);

  // Atribución leída una vez, al montar. Sin storage.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const captura: Atribucion = {};
    for (const clave of CLAVES_URL) {
      const valor = params.get(clave);
      if (valor) captura[clave] = valor;
    }
    atribucion.current = captura;
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setError(null);

    if (!nombre.trim() || !whatsapp.trim()) {
      setError('Necesitamos tu nombre y un WhatsApp para enviarte el comparativo.');
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'lp_lotes_pdc',
          locale: 'es',
          name: nombre.trim(),
          phone: whatsapp.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim() || undefined,
          investmentType: objetivo ?? undefined,
          budget: presupuesto ?? undefined,
          propertyName: loteNombre,
          // El plazo publicado viaja en el mensaje para que el asesor no tenga
          // que preguntar de qué plan hablamos.
          message: plazoMeses
            ? `Pidió el plan de pagos a ${plazoMeses} meses desde la landing de lotes de Playa del Carmen.`
            : 'Pidió el detalle del lote desde la landing de lotes de Playa del Carmen.',
          page: window.location.href,
          website: honeypot.current?.value || '',
          ...atribucion.current,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      trackGenerateLead({ formType: 'lp_lotes_pdc' });
      setEnviado(true);
    } catch {
      setError('No pudimos enviar tu solicitud. Vuelve a intentarlo, o escríbenos por WhatsApp.');
    } finally {
      setEnviando(false);
    }
  }

  // Agradecimiento en la misma ruta: redirigir a /gracias perdería el contexto
  // de medición y el gclid de la URL.
  if (enviado) {
    return (
      <div className="border-t-2 border-[var(--lp-accent)] bg-white p-6" role="status" aria-live="polite">
        <Check className="size-5 text-[var(--lp-accent)]" aria-hidden="true" />
        <h3 className="mt-3 lp-display text-lg font-semibold tracking-tight text-[var(--lp-ink)]">
          Listo, {nombre.trim().split(' ')[0]}.
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--lp-ink-soft)]">
          Te enviamos por WhatsApp al{' '}
          <span className="font-mono">{whatsapp.trim()}</span> el comparativo del
          lote con precio, precio por metro cuadrado, estatus de urbanización
          servicio por servicio y el esquema de pago completo, incluidos los costos
          que no están en el precio.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--lp-ink-soft)]">
          Si por presupuesto u objetivo este lote no encaja, te lo decimos en el
          primer mensaje y te ahorramos la llamada.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t-2 border-[var(--lp-accent)] bg-white">
      <div className="border-x border-b border-[var(--lp-line)] p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="lp-display text-lg font-semibold leading-snug tracking-tight text-[var(--lp-ink)]">
            {paso === 1 && '¿Qué estás buscando?'}
            {paso === 2 && 'Tu presupuesto total, gastos de cierre incluidos'}
            {paso === 3 && '¿A dónde te enviamos el comparativo?'}
          </h3>
          <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-[var(--lp-muted)]">
            {paso}/3
          </span>
        </div>

        {/* Progreso en tres segmentos: reduce el abandono en el paso final. */}
        <div
          className="mt-4 flex gap-1"
          role="progressbar"
          aria-valuenow={paso}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label={`Paso ${paso} de 3`}
        >
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-0.5 flex-1 transition-colors duration-300 ${
                n <= paso ? 'bg-[var(--lp-accent)]' : 'bg-[var(--lp-line)]'
              }`}
            />
          ))}
        </div>

        {paso === 1 && (
          <div className="mt-5 flex flex-col gap-2">
            {OBJETIVOS.map((o) => (
              <button
                key={o}
                type="button"
                className={OPCION}
                onClick={() => {
                  setObjetivo(o);
                  emitirPaso('paso_1_completado');
                  setPaso(2);
                }}
              >
                {o}
                <ArrowRight
                  className="size-4 shrink-0 text-[var(--lp-ink)]/25 transition-colors duration-200 group-hover:text-[var(--lp-accent)]"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        )}

        {paso === 2 && (
          <div className="mt-5 flex flex-col gap-2">
            {PRESUPUESTOS.map((p) => (
              <button
                key={p}
                type="button"
                className={`${OPCION} lp-num`}
                onClick={() => {
                  setPresupuesto(p);
                  emitirPaso('paso_2_completado');
                  setPaso(3);
                }}
              >
                {p}
                <ArrowRight
                  className="size-4 shrink-0 text-[var(--lp-ink)]/25 transition-colors duration-200 group-hover:text-[var(--lp-accent)]"
                  aria-hidden="true"
                />
              </button>
            ))}
            <button
              type="button"
              className="mt-1 cursor-pointer self-start text-xs text-[var(--lp-muted)] underline transition-colors duration-200 hover:text-[var(--lp-ink-soft)]"
              onClick={() => setPaso(1)}
            >
              Volver
            </button>
          </div>
        )}

        {paso === 3 && (
          <form className="mt-5 flex flex-col gap-4" onSubmit={enviar} noValidate>
            <label className="flex flex-col gap-1.5">
              <span className={ETIQUETA}>Nombre</span>
              <input
                className={INPUT}
                type="text"
                name="name"
                autoComplete="name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={ETIQUETA}>WhatsApp</span>
              <input
                className={INPUT}
                type="tel"
                inputMode="numeric"
                name="phone"
                autoComplete="tel"
                placeholder="+52 984 123 4567"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={ETIQUETA}>
                Email <span className="lowercase tracking-normal">(opcional)</span>
              </span>
              <input
                className={INPUT}
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            {/* Honeypot. Un captcha visible cuesta conversión; esto no. */}
            <input
              ref={honeypot}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="pointer-events-none absolute -left-[9999px] size-0 opacity-0"
            />

            {error && (
              <p className="text-xs text-error" role="alert">
                {error}
              </p>
            )}

            {/* La oferta no puede ser lo que la página ya publica. Son tres cosas
                que sólo existen fuera de la página: el plano con la ubicación del
                lote, la tabla de amortización con el pago final por escrito, y el
                paquete documental para que lo revise tu abogado. */}
            <div className="border-t border-[var(--lp-line)] pt-4">
              <p className="text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--lp-muted)]">
                Lo que recibes
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-xs leading-relaxed text-[var(--lp-ink-soft)]">
                <li>El plano con la ubicación exacta del lote dentro de la privada.</li>
                <li>
                  Tu tabla de amortización
                  {plazoMeses ? ` a ${plazoMeses} meses` : ''}, con el pago final por
                  escrito.
                </li>
                <li>
                  El paquete documental: licencia, autorización de venta municipal y
                  régimen de propiedad, para que lo revises tú o tu abogado.
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 bg-[var(--lp-accent)] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--lp-accent-strong)] disabled:cursor-default disabled:opacity-60"
            >
              {enviando ? 'Enviando' : 'Enviarme el plan y los documentos'}
              {!enviando && <ArrowRight className="size-4" aria-hidden="true" />}
            </button>

            <p className="text-xs leading-relaxed text-[var(--lp-ink-soft)]/60">
              Al enviar aceptas que te contactemos por WhatsApp sobre este lote.
              Puedes pedirnos que dejemos de hacerlo en cualquier momento.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
