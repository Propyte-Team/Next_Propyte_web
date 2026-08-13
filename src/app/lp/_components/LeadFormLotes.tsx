'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from '@/lib/icons';
import { trackGenerateLead } from '@/lib/analytics/track';

// ============================================================
// Formulario de dos pasos.
//
// Resuelve una tensión real en vez de promediarla: la evidencia de conversión
// empuja a formularios cortos, y la operación de Propyte necesita calificar para
// no quemar tiempo de asesor. La salida es un multi-paso con la calificación al
// inicio (un tap, cero escritura) y el contacto al final.
//
// ERAN TRES PASOS. El intermedio preguntaba el presupuesto en cuatro rangos.
// Se quitó: era el único paso que no producía ni contacto ni intención, y
// llegaba antes de que el visitante hubiera dado un solo dato suyo —el punto de
// abandono más caro del embudo, porque ya había invertido un tap—. El asesor lo
// pregunta en el primer mensaje de WhatsApp, donde cuesta cero. La página
// además publica el precio, los gastos de cierre y los cargos únicos: quien
// llega hasta aquí ya se autofiltró por presupuesto mejor que con cuatro
// rangos.
//
// EL PLAZO SÍ SE PREGUNTA, y sustituye al presupuesto como señal de
// calificación: es la que de verdad cambia la conversación (48 o 60 meses
// implica mensualidades muy distintas) y se contesta con un tap, dentro del
// paso donde el visitante ya está escribiendo.
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

const CLAVES_URL = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'wbraid',
  'fbclid',
  // `short_code` del QR fisico (lo estampa /q/[code] del Hub). Esta LP vive
  // fuera de [locale], asi que <UTMCapture /> no se monta aqui: la lista de
  // claves esta duplicada a proposito y hay que tocar AMBAS.
  'qr',
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
  loteRef,
  plazosDisponibles,
  /**
   * ⚠️ COMPROMISO OPERATIVO, no copy: define qué promete la marca al pulsar
   * enviar. El default es el más conservador que sigue siendo un compromiso;
   * cambiarlo es decisión de negocio, no de diseño.
   */
  tiempoRespuesta = 'el mismo día hábil',
}: {
  loteNombre: string;
  /** Slug del lote, para que el lead llegue al CRM ya referenciado. */
  loteRef: string;
  /** Plazos publicados (48/60). Vacío ⇒ no se pregunta. */
  plazosDisponibles: number[];
  tiempoRespuesta?: string;
}) {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [plazo, setPlazo] = useState<number | null>(plazosDisponibles.at(-1) ?? null);
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [emailVisible, setEmailVisible] = useState(false);
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
          propertyName: loteNombre,
          // Referencia y plazo en el mensaje: el asesor abre la conversación
          // sabiendo de qué lote y de qué plan se habla, sin preguntarlo.
          message: [
            `Lote ref. ${loteRef}.`,
            plazo ? `Pidió el plan a ${plazo} meses.` : 'Pidió el detalle del lote.',
            objetivo ? `Objetivo declarado: ${objetivo.toLowerCase()}.` : null,
          ]
            .filter(Boolean)
            .join(' '),
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
        <p className="mt-3 lp-display text-lg leading-snug text-[var(--lp-ink)]">
          Listo, {nombre.trim().split(' ')[0]}.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--lp-ink-soft)]">
          Te escribimos por WhatsApp al{' '}
          <span className="font-mono">{whatsapp.trim()}</span> {tiempoRespuesta} con el
          plano, tu tabla de amortización
          {plazo ? ` a ${plazo} meses` : ''} y el paquete documental.
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
          {/* `p` y no `h3`: `globals.css` pisa el font-size de los headings
              fuera de `.lp-root`… y aquí sí estamos dentro, pero el encabezado
              real de la conversión es el `TituloSeccion` de la columna de al
              lado. Dos h3 compitiendo confunden el índice del documento. */}
          <p className="lp-display text-lg leading-snug text-[var(--lp-ink)]">
            {paso === 1 ? '¿Qué estás buscando?' : '¿A dónde te lo enviamos?'}
          </p>
          <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-[var(--lp-muted)]">
            {paso}/2
          </span>
        </div>

        <div
          className="mt-4 flex gap-1"
          role="progressbar"
          aria-valuenow={paso}
          aria-valuemin={1}
          aria-valuemax={2}
          aria-label={`Paso ${paso} de 2`}
        >
          {[1, 2].map((n) => (
            <span
              key={n}
              className={`h-0.5 flex-1 transition-colors duration-300 ${
                n <= paso ? 'bg-[var(--lp-accent)]' : 'bg-[var(--lp-line)]'
              }`}
            />
          ))}
        </div>

        {paso === 1 && (
          // Sin botón «siguiente»: la selección ES el avance. Un paso de una
          // pregunta con un botón de confirmar cobra dos taps por un dato.
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

            {/* Tercer y último campo. Radios nativos: flechas y anuncio del
                grupo salen gratis, y no cuesta escritura. */}
            {plazosDisponibles.length > 0 && (
              <fieldset className="flex flex-col gap-1.5">
                <legend className={ETIQUETA}>Plazo que te interesa</legend>
                <div className="mt-1.5 flex gap-2">
                  {plazosDisponibles.map((m) => (
                    <label
                      key={m}
                      className={`flex min-h-[48px] flex-1 cursor-pointer items-center justify-center border text-sm transition-colors duration-200 ${
                        plazo === m
                          ? 'border-[var(--lp-accent)] bg-[var(--lp-accent)]/8 text-[var(--lp-accent)]'
                          : 'border-[var(--lp-line)] bg-white text-[var(--lp-ink-soft)] hover:border-[var(--lp-accent)]/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="plazo"
                        value={m}
                        checked={plazo === m}
                        onChange={() => setPlazo(m)}
                        className="sr-only"
                      />
                      <span className="lp-num">{m} meses</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Email colapsado: no es necesario para responder por WhatsApp, y
                un cuarto campo visible sube el abandono sin subir el contacto. */}
            {emailVisible ? (
              <label className="flex flex-col gap-1.5">
                <span className={ETIQUETA}>
                  Email <span className="lowercase tracking-normal">(opcional)</span>
                </span>
                <input
                  className={INPUT}
                  type="email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            ) : (
              <button
                type="button"
                onClick={() => setEmailVisible(true)}
                className="cursor-pointer self-start text-xs text-[var(--lp-muted)] underline underline-offset-4 transition-colors duration-200 hover:text-[var(--lp-ink-soft)]"
              >
                Prefiero que me lo manden por email
              </button>
            )}

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

            <button
              type="submit"
              disabled={enviando}
              className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 bg-[var(--lp-accent)] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--lp-accent-strong)] disabled:cursor-default disabled:opacity-60"
            >
              {enviando ? 'Enviando' : 'Enviarme el plan y los documentos'}
              {!enviando && <ArrowRight className="size-4" aria-hidden="true" />}
            </button>

            {/* Qué pasa cuando envías. Va DEBAJO del botón, no encima: encima
                es una lista de requisitos antes de actuar; debajo es lo que
                recibes por haber actuado. La oferta no puede ser lo que la
                página ya publica — son tres cosas que solo existen fuera. */}
            <div className="border-t border-[var(--lp-line)] pt-4">
              <p className={ETIQUETA}>Qué pasa cuando envías</p>
              <ul className="mt-2 flex flex-col gap-1.5 text-xs leading-relaxed text-[var(--lp-ink-soft)]">
                <li>
                  Te escribimos por WhatsApp{' '}
                  <span className="text-[var(--lp-ink)]">{tiempoRespuesta}</span>.
                </li>
                <li>El plano con la ubicación exacta del lote dentro de la privada.</li>
                <li>
                  Tu tabla de amortización
                  {plazo ? ` a ${plazo} meses` : ''}, con el pago final por escrito.
                </li>
                <li>
                  El paquete documental: licencia, autorización de venta municipal y
                  régimen de propiedad, para que lo revises tú o tu abogado.
                </li>
              </ul>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <button
                type="button"
                className="cursor-pointer text-xs text-[var(--lp-muted)] underline underline-offset-4 transition-colors duration-200 hover:text-[var(--lp-ink-soft)]"
                onClick={() => setPaso(1)}
              >
                Volver
              </button>
            </div>

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
