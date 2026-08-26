'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { trackGenerateLead } from '@/lib/analytics/track';

// ============================================================
// LA CONVERSIÓN de la variante C.
//
// ═══ LA PLOMERÍA ES LA MISMA. NO SE TOCA. ═══
//
// Cambia el estilo, no la medición. Este componente es un gemelo visual de
// `FormTerrenos` con la MISMA tubería, y eso es deliberado:
//
//   · `source: 'lp_lotes_pdc'` — literal de `KNOWN_SOURCES` en `/api/leads`.
//     Inventar un `source` nuevo NO daría un error visible: daría un lead que
//     entra a Supabase y NO llega a Zoho.
//   · `trackGenerateLead()` — dispara GA4 `generate_lead`, el `Lead` de Meta y
//     el `gtag('event','conversion')` con el `send_to` de Ads. Misma acción de
//     conversión que las otras dos variantes, mismo valor (ninguno).
//
// Si además de la página cambiara la medición, la diferencia de resultados
// entre las tres variantes no sería atribuible al diseño.
//
// ═══ LO ÚNICO QUE CAMBIA EN LOS DATOS ═══
//
// `FORM_TYPE`, que es lo que separa las variantes en GA4, y el `bloque` dentro
// del `message`. En Zoho las separa `page` → `Nombre_anuncio`.
//
// ═══ DOS CAMPOS, UN PASO, SIN COMPUERTA ═══
//
// Ya se pagó por aprender esto: la campaña gastó $991.40 MXN en 72 clics en 6
// días con CERO envíos porque los campos vivían detrás de dos preguntas y
// `document.querySelectorAll('form').length` daba 0. Un formulario detrás de
// una compuerta no es un formulario corto: es un formulario invisible.
//
// El plazo SÍ se pregunta y va PRIMERO, porque no es fricción: es el gancho. Ya
// viene contestado con el plazo más largo —la mensualidad más baja—, así que el
// coste de entrada sigue siendo cero.
// ============================================================

/** Claves de atribución que se leen de la URL. Sin storage: viven en un ref. */
const CLAVES_URL = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'wbraid',
  'fbclid',
  'qr',
] as const;

type Atribucion = Partial<Record<(typeof CLAVES_URL)[number], string>>;

/** Segmenta la variante C en GA4 sin tocar la acción de conversión de Ads. */
const FORM_TYPE = 'lp_enganche_pdc';

const ORDINAL: Record<'hero' | 'medio' | 'cierre', string> = {
  hero: '01',
  medio: '02',
  cierre: '03',
};

export interface FormEngancheProps {
  variante: 'hero' | 'medio' | 'cierre';
  /** Plazos publicados. Vacío ⇒ no se pregunta. */
  plazos: number[];
  loteRef: string;
  /** Título de la unidad, ya saneado de nombre comercial aguas arriba. */
  loteTitulo: string;
  /** El enganche ya formateado con «MXN». Se rotula en la cabecera del panel. */
  engancheTexto: string | null;
  /**
   * ⚠️ COMPROMISO OPERATIVO, no copy: define qué promete la marca al enviar.
   * Cambiarlo es decisión de negocio.
   */
  tiempoRespuesta?: string;
}

export default function FormEnganche({
  variante,
  plazos,
  loteRef,
  loteTitulo,
  engancheTexto,
  tiempoRespuesta = 'el mismo día hábil',
}: FormEngancheProps) {
  const uid = useId();
  const [plazo, setPlazo] = useState<number | null>(plazos.at(-1) ?? null);
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const atribucion = useRef<Atribucion>({});
  const honeypot = useRef<HTMLInputElement>(null);
  const refNombre = useRef<HTMLInputElement>(null);
  const refWhatsapp = useRef<HTMLInputElement>(null);

  /**
   * ⚠️ EL CAMPO SE VE LLENO Y EL BOTÓN DICE QUE ESTÁ VACÍO.
   *
   * Este efecto NO es opcional y no se puede borrar por parecer redundante. El
   * componente es un formulario CONTROLADO servido por SSR: entre que el HTML
   * llega y React hidrata hay una ventana en la que el DOM acepta texto que el
   * estado de React nunca ve. Al hidratar, React reconcilia el nodo y da por
   * bueno su estado —vacío—, así que el valor escrito antes queda huérfano.
   *
   * El resultado en pantalla es el peor posible: el campo SE VE lleno, con el
   * nombre y el teléfono a la vista, y al pulsar enviar sale «Falta tu nombre o
   * tu WhatsApp». Sin error de consola, sin POST y sin lead. Y no se cura solo:
   * el estado sigue vacío hasta que la persona vuelve a teclear.
   *
   * El disparador más común no es teclear rápido: es el AUTOCOMPLETADO del
   * navegador, que rellena los dos campos de golpe y en muchos navegadores no
   * dispara el `onChange` que React escucha. O sea, le pasa justo a quien tiene
   * sus datos guardados y venía con la menor fricción posible.
   *
   * Se descubrió aquí con el escenario B de `tests/lp-enganche-conversion.mjs`,
   * que dio rojo la primera vez que se corrió contra esta variante: el
   * formulario se copió de `FormTerrenos` SIN este efecto.
   *
   * Sincronizar el DOM hacia React es el caso de uso legítimo de `useEffect`:
   * leer un sistema externo que cambió por fuera. Solo escribe si hay
   * divergencia real, así que en el camino normal no provoca ni un render.
   */
  useEffect(() => {
    const nombreDom = refNombre.current?.value ?? '';
    const waDom = refWhatsapp.current?.value ?? '';
    if (nombreDom) setNombre((actual) => (actual === nombreDom ? actual : nombreDom));
    if (waDom) setWhatsapp((actual) => (actual === waDom ? actual : waDom));
  }, []);

  // Atribución leída una vez, al montar. Deliberadamente sin sessionStorage: el
  // POST sale de esta misma vista, no hay navegación que sobrevivir.
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
      setError('Falta tu nombre o tu WhatsApp. Son los dos únicos datos que pedimos.');
      return;
    }
    // 10 dígitos es el largo de un móvil en México. Se cuentan DÍGITOS, no se
    // valida un formato: quien escribe "984 123 4567" o "+52 984..." no puede
    // perder el lead por un espacio.
    if (whatsapp.replace(/\D/g, '').length < 10) {
      setError('El WhatsApp necesita 10 dígitos para que podamos escribirte.');
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // ⚠️ Literal de `KNOWN_SOURCES`. Cambiarlo rompe el mapa de Zoho.
          source: 'lp_lotes_pdc',
          locale: 'es',
          name: nombre.trim(),
          phone: whatsapp.trim(),
          whatsapp: whatsapp.trim(),
          propertyName: loteTitulo,
          message: [
            `Lote ref. ${loteRef}.`,
            plazo
              ? `Pidió el plan de pagos a ${plazo} meses.`
              : 'Pidió el plan de pagos completo.',
            `Origen: landing de enganche (variante C), bloque «${variante}».`,
          ].join(' '),
          // `page` se mapea a Nombre_anuncio en Zoho: es lo que permite separar
          // los leads de esta variante de los de las otras dos dentro del CRM.
          page: window.location.href,
          website: honeypot.current?.value || '',
          ...atribucion.current,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // El disparo a Ads va DESPUÉS del 200: una conversión reportada sobre un
      // lead que no se guardó es peor que ninguna.
      trackGenerateLead({ formType: FORM_TYPE });
      setEnviado(true);
    } catch {
      setError('No pudimos enviarlo. Inténtalo otra vez o escríbenos por WhatsApp.');
    } finally {
      setEnviando(false);
    }
  }

  // Agradecimiento en la misma ruta. Redirigir a /gracias perdería el gclid de
  // la URL y el contexto de medición.
  if (enviado) {
    return (
      <div
        data-lpe-form={variante}
        className="rounded-[var(--lpe-r)] border border-[var(--lpe-linea)] bg-[var(--lpe-aqua-suave)] p-7 sm:p-9"
      >
        <p className="lpe-rotulo text-[var(--lpe-teal-texto)]">Solicitud recibida</p>
        <p className="lpe-titular mt-3 text-[clamp(1.5rem,1.2rem+1.4vw,2rem)]">
          Listo, {nombre.trim().split(' ')[0]}.
        </p>
        <p className="lpe-cuerpo mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-[var(--lpe-tinta-2)]">
          Te escribimos por WhatsApp {tiempoRespuesta} con el plan completo
          {plazo ? ` a ${plazo} meses` : ''}: enganche, mensualidad, contraentrega
          y qué cubre la escritura. Una persona, no un robot.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={enviar}
      data-lpe-form={variante}
      noValidate
      className="rounded-[var(--lpe-r)] border border-[var(--lpe-linea)] bg-[var(--lpe-blanco)] p-6 shadow-[0_28px_70px_-32px_rgb(15_25_35/0.35)] sm:p-9"
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="lpe-rotulo text-[var(--lpe-teal-texto)]">
          Solicitud · {ORDINAL[variante]}
        </p>
        <p className="lpe-cuerpo text-[0.75rem] text-[var(--lpe-tinta-3)]">2 campos</p>
      </div>

      {/* El titular del panel nombra la CIFRA, que es la protagonista de la
          página. Si el enganche no está publicable, cae a la promesa genérica:
          nunca se rotula un hueco. */}
      <h2 className="lpe-titular mt-3 text-[clamp(1.5rem,1.3rem+1.1vw,2rem)]">
        {engancheTexto ? (
          <>
            Aparta el tuyo{' '}
            <span className="lpe-italica">con</span> {engancheTexto}
          </>
        ) : (
          <>
            Recibe el <span className="lpe-italica">plan de pagos</span> completo
          </>
        )}
      </h2>

      {plazos.length > 0 && (
        <fieldset className="mt-7">
          <legend className="lpe-cuerpo text-[0.8125rem] text-[var(--lpe-tinta-2)]">
            ¿A cuántos meses quieres el resto?
          </legend>
          <div className="mt-2.5 flex gap-2.5">
            {plazos.map((m) => {
              const activo = plazo === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPlazo(m)}
                  aria-pressed={activo}
                  className={`lpe-cuerpo min-h-12 flex-1 rounded-[var(--lpe-r-pill)] border px-4 text-[0.9375rem] transition-[background-color,border-color,color] duration-200 ${
                    activo
                      ? 'border-[var(--lpe-tinta)] bg-[var(--lpe-tinta)] font-medium text-[var(--lpe-blanco)]'
                      : 'border-[var(--lpe-linea)] bg-transparent text-[var(--lpe-tinta-2)] hover:border-[var(--lpe-tinta-3)]'
                  }`}
                >
                  {m} meses
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor={`${uid}-nombre`} className="sr-only">
            Tu nombre
          </label>
          <input
            id={`${uid}-nombre`}
            ref={refNombre}
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="lpe-cuerpo min-h-[56px] w-full rounded-[var(--lpe-r-pill)] border border-[var(--lpe-linea)] bg-[var(--lpe-hueso)] px-5 text-[0.9375rem] text-[var(--lpe-tinta)] transition-colors duration-200 placeholder:text-[var(--lpe-tinta-3)] focus:border-[var(--lpe-tinta)] focus:bg-[var(--lpe-blanco)]"
          />
        </div>
        <div>
          <label htmlFor={`${uid}-wa`} className="sr-only">
            Tu WhatsApp a 10 dígitos
          </label>
          <input
            id={`${uid}-wa`}
            ref={refWhatsapp}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="WhatsApp a 10 dígitos"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="lpe-cuerpo min-h-[56px] w-full rounded-[var(--lpe-r-pill)] border border-[var(--lpe-linea)] bg-[var(--lpe-hueso)] px-5 text-[0.9375rem] text-[var(--lpe-tinta)] transition-colors duration-200 placeholder:text-[var(--lpe-tinta-3)] focus:border-[var(--lpe-tinta)] focus:bg-[var(--lpe-blanco)]"
          />
        </div>
      </div>

      {/* Honeypot. `aria-hidden` + tabIndex para que ningún lector lo anuncie. */}
      <input
        ref={honeypot}
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {error && (
        <p role="alert" className="lpe-cuerpo mt-3 text-sm text-[#b42318]">
          {error}
        </p>
      )}

      {/* El CTA en píldora con el disco de acento a la derecha: es la forma del
          botón del original. El relleno es el teal de marca y el texto va en
          TINTA OSCURA — el teal sobre blanco da 1.7:1 y no es color de texto,
          mientras la tinta sobre teal da 13.9:1. */}
      <button
        type="submit"
        disabled={enviando}
        className="group mt-6 flex min-h-[60px] w-full items-center justify-between gap-3 rounded-[var(--lpe-r-pill)] bg-[var(--lpe-teal)] pl-7 pr-2.5 text-[1.0625rem] font-medium text-[var(--lpe-tinta)] transition-[background-color,transform] duration-200 hover:bg-[var(--lpe-teal-hover)] active:translate-y-px disabled:opacity-60"
      >
        <span className="lpe-cuerpo font-medium">
          {enviando ? 'Enviando…' : 'Recibe el plan de pagos'}
        </span>
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--lpe-tinta)] text-[var(--lpe-teal)] transition-transform duration-200 group-hover:translate-x-0.5"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h9M8.5 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      <p className="lpe-cuerpo mt-4 text-[0.8125rem] leading-relaxed text-[var(--lpe-tinta-3)]">
        Te contesta un asesor por WhatsApp {tiempoRespuesta}. Sin llamadas
        automáticas y sin compartir tu número con terceros.
      </p>
    </form>
  );
}
