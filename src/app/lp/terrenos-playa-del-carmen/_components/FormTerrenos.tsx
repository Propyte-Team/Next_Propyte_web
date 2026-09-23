'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { trackGenerateLead } from '@/lib/analytics/track';
import PhoneInputField, { isValidPhoneNumber } from '@/components/ui/PhoneInput';

// ============================================================
// LA CONVERSIÓN. Todo lo demás en esta página existe para traer a alguien aquí.
//
// ═══ LA PLOMERÍA NO SE REINVENTA ═══
//
// Dos destinos, los dos ya probados de punta a punta en la variante A el
// 2026-08-20 (POST 200 → fila en Supabase → sync a Zoho → ping de conversión a
// Ads). Este componente los usa TAL CUAL, y esa es la decisión de diseño más
// importante del archivo:
//
//   · Zoho ← POST a `/api/leads` con `source: 'lp_lotes_pdc'`. Ese literal está
//     en `KNOWN_SOURCES` del endpoint y es lo que engancha el mapa de campos de
//     Zoho. Inventar un `source` nuevo aquí no daría un error visible: daría un
//     lead que entra a Supabase y NO llega al CRM.
//   · Google Ads ← `trackGenerateLead()`. Esa llamada dispara GA4
//     `generate_lead`, el `Lead` de Meta, `lead_created` de OpenAI y —lo que
//     importa para la campaña— un `gtag('event','conversion')` con el `send_to`
//     de `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LEAD`. Es la única línea de toda la
//     landing que le habla a Google Ads.
//
// ⚠️ La conversión de Ads depende del CONSENTIMIENTO. Consent Mode v2 arranca
// con `ad_storage: denied`; quien no acepta cookies genera el lead en Zoho pero
// NO produce conversión atribuida en Ads. Es un hueco conocido, compartido con
// la variante A, y por eso no sesga el A/B: las dos páginas lo tienen igual.
//
// ═══ POR QUÉ ES DE UN SOLO PASO Y SIN COMPUERTA ═══
//
// Porque ya se pagó por aprenderlo: la campaña gastó $991.40 MXN en 72 clics en
// 6 días con CERO envíos. La medición estaba sana; lo roto era que
// `document.querySelectorAll('form').length` daba 0 al cargar, porque los
// campos vivían detrás de dos preguntas. El visitante que costó $13.77 no veía
// un formulario, veía una pregunta. Un formulario detrás de una compuerta no es
// un formulario corto: es un formulario invisible.
//
// El plazo SÍ se pregunta, y va PRIMERO, porque no es fricción: es el gancho.
// Ya viene contestado con el plazo más largo —la mensualidad más baja— así que
// el coste de entrada sigue siendo cero y el asesor abre la conversación
// sabiendo de qué plan se habla. `tests/lp-terrenos-form.mjs` fija el contrato
// de marcado que impide que esto vuelva a taparse.
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
  // `short_code` del QR físico, lo estampa /q/[code] del Hub. Esta LP vive
  // fuera de [locale], así que <UTMCapture /> no se monta: la lista está
  // duplicada a propósito respecto a la del sitio.
  'qr',
] as const;

type Atribucion = Partial<Record<(typeof CLAVES_URL)[number], string>>;

/** Segmenta el A/B en GA4 sin tocar la acción de conversión de Ads. */
const FORM_TYPE = 'lp_terrenos_pdc';

/** El número que se rotula en la cartela, en orden de documento. */
const ORDINAL: Record<'hero' | 'medio' | 'cierre', string> = {
  hero: '01',
  medio: '02',
  cierre: '03',
};

export interface FormTerrenosProps {
  /**
   * Dónde vive esta instancia.
   *
   * `hero` va en el primer pliegue y `cierre` remata la página. `medio` se
   * añadió el 2026-08-26, justo detrás del mosaico de láminas: es el punto de
   * máxima intención de toda la página —acaban de ver el sitio— y antes había
   * que volver a subir o seguir bajando dos secciones para encontrar un campo.
   * El competidor de referencia repite su formulario cinco veces; tres, con la
   * página midiendo lo que mide, es la lectura razonable de esa idea.
   *
   * El `bloque` viaja en el `message` del lead, así que en el CRM se ve DESDE
   * DÓNDE convirtió cada persona. Eso es lo que va a decir si el mosaico
   * vende o solo alarga.
   */
  variante: 'hero' | 'medio' | 'cierre';
  /** Plazos publicados. Vacío ⇒ no se pregunta. */
  plazos: number[];
  /** Slug del lote: el lead llega al CRM ya referenciado. */
  loteRef: string;
  /** Título de la unidad, ya saneado de nombre comercial aguas arriba. */
  loteTitulo: string;
  /**
   * ⚠️ COMPROMISO OPERATIVO, no copy: define qué promete la marca al enviar.
   * Cambiarlo es decisión de negocio.
   */
  tiempoRespuesta?: string;
}

export default function FormTerrenos({
  variante,
  plazos,
  loteRef,
  loteTitulo,
  tiempoRespuesta = 'el mismo día hábil',
}: FormTerrenosProps) {
  const esHero = variante === 'hero';
  const uid = useId();
  // Por defecto el plazo MÁS LARGO: es la mensualidad más baja, que es la razón
  // por la que la persona sigue leyendo.
  const [plazo, setPlazo] = useState<number | null>(plazos.at(-1) ?? null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState<string | undefined>(undefined);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const atribucion = useRef<Atribucion>({});
  const honeypot = useRef<HTMLInputElement>(null);
  const refNombre = useRef<HTMLInputElement>(null);
  const refEmail = useRef<HTMLInputElement>(null);

  // Atribución leída una vez, al montar. Deliberadamente sin sessionStorage:
  // el POST sale de esta misma vista, no hay navegación que sobrevivir.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const captura: Atribucion = {};
    for (const clave of CLAVES_URL) {
      const valor = params.get(clave);
      if (valor) captura[clave] = valor;
    }
    atribucion.current = captura;
  }, []);

  /**
   * ═══ RESCATE DE LO QUE SE ESCRIBIÓ ANTES DE HIDRATAR ═══
   *
   * El bug que esto arregla, medido contra producción el 2026-08-21:
   *
   *   El HTML del servidor pinta el formulario a los ~600 ms, pero React no
   *   hidrata hasta ~2.2 s —más en un móvil con 4G, porque compiten GA4, el
   *   Pixel de Meta, Hotjar y el de OpenAI por el hilo principal—. Quien
   *   escribe en esa ventana deja su texto en el DOM, pero `nombre` y
   *   `whatsapp` siguen valiendo `''`: React nunca lee de vuelta un input
   *   controlado al hidratar.
   *
   *   El resultado en pantalla es el peor posible. El campo SE VE lleno, con
   *   el nombre y el teléfono a la vista, y al pulsar enviar sale «Falta tu
   *   nombre o tu WhatsApp». No hay error de consola, no hay POST, no hay
   *   lead. Y no se cura solo: el estado sigue vacío hasta que la persona
   *   vuelve a teclear en el campo.
   *
   *   El disparador más común NO es teclear rápido: es el AUTOCOMPLETADO del
   *   navegador, que rellena los campos de golpe y en muchos navegadores
   *   no dispara el `onChange` que React escucha. Es decir, le pasa
   *   justo a quien tiene sus datos guardados y venía con la menor fricción.
   *
   * Un efecto que sincroniza el DOM hacia React es exactamente el caso de uso
   * legítimo de `useEffect`: leer un sistema externo que cambió por fuera. Solo
   * escribe estado si de verdad hay divergencia, así que en el camino normal
   * —React hidrata antes de que nadie toque nada— no provoca ni un render.
   */
  useEffect(() => {
    const delDom = refNombre.current?.value ?? '';
    const emailDom = refEmail.current?.value ?? '';
    if (delDom) setNombre((actual) => (actual === delDom ? actual : delDom));
    if (emailDom) setEmail((actual) => (actual === emailDom ? actual : emailDom));
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setError(null);

    if (!nombre.trim() || !email.trim() || !whatsapp) {
      setError('Faltan datos: pedimos tu nombre, tu correo y tu WhatsApp.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Revisa el correo: es a donde te mandamos el plan de pagos.');
      return;
    }
    // La validación por país la hace el selector de lada: quien escribe desde
    // fuera de México ya no pierde el lead por no tener 10 dígitos.
    if (!isValidPhoneNumber(whatsapp)) {
      setError('Revisa el WhatsApp: elige tu país y escribe el número completo.');
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
          email: email.trim(),
          phone: whatsapp,
          whatsapp: whatsapp,
          propertyName: loteTitulo,
          message: [
            `Lote ref. ${loteRef}.`,
            plazo
              ? `Pidió el plan de pagos a ${plazo} meses.`
              : 'Pidió el plan de pagos completo.',
            `Origen: landing corta de terrenos, bloque «${variante}».`,
          ].join(' '),
          // `page` se mapea a Nombre_anuncio en Zoho: es lo que permite separar
          // los leads de esta variante de los de la larga dentro del CRM.
          page: window.location.href,
          website: honeypot.current?.value || '',
          ...atribucion.current,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // ═══ El disparo a Google Ads. Va DESPUÉS del 200: una conversión
      // reportada sobre un lead que no se guardó es peor que ninguna. ═══
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
        data-lpt-form={variante}
        className="lpt-vertice border border-[var(--lpt-caliza-2)] bg-[var(--lpt-caliza)] p-7 sm:p-8"
      >
        <p className="lpt-rotulo text-[var(--lpt-estaca-2)]">Solicitud recibida</p>
        <p className="lpt-titular mt-3 text-[clamp(1.5rem,1.2rem+1.4vw,2rem)] text-[var(--lpt-tinta)]">
          Listo, {nombre.trim().split(' ')[0]}.
        </p>
        <p className="lpt-cuerpo mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-[var(--lpt-tinta-2)]">
          Te escribimos por WhatsApp {tiempoRespuesta} con el plan completo
          {plazo ? ` a ${plazo} meses` : ''}: precio, enganche, mensualidad y qué
          incluye la escritura. Una persona, no un robot.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={enviar}
      data-lpt-form={variante}
      noValidate
      className="lpt-vertice border border-[var(--lpt-caliza-2)] bg-[var(--lpt-caliza)] p-6 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.55)] sm:p-8"
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="lpt-rotulo text-[var(--lpt-estaca-2)]">
          Solicitud · {ORDINAL[variante]}
        </p>
        <p className="lpt-cota text-[0.6875rem] text-[var(--lpt-tinta-2)]">3 campos</p>
      </div>

      {/* Una sola promesa en las tres instancias, a propósito: tres titulares
          distintos se leerían como tres ofertas distintas. Lo único que cambia
          es el cuerpo de letra, que sigue al peso del bloque donde vive. */}
      <h2
        className={`lpt-titular mt-3 text-[var(--lpt-tinta)] ${
          esHero
            ? 'text-[clamp(1.5rem,1.25rem+1.1vw,1.875rem)]'
            : variante === 'medio'
              ? 'text-[clamp(1.625rem,1.35rem+1.3vw,2.125rem)]'
              : 'text-[clamp(1.75rem,1.4rem+1.6vw,2.5rem)]'
        }`}
      >
        Recibe el plan de pagos completo
      </h2>

      {plazos.length > 0 && (
        <fieldset className="mt-6">
          <legend className="lpt-cota text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--lpt-tinta-2)]">
            ¿A cuántos meses?
          </legend>
          <div className="mt-2.5 flex gap-2">
            {plazos.map((m) => {
              const activo = plazo === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPlazo(m)}
                  aria-pressed={activo}
                  className={`lpt-cota min-h-11 flex-1 rounded-[var(--lpt-r)] border px-3 text-sm transition-[background-color,border-color,color] duration-200 ${
                    activo
                      ? 'border-[var(--lpt-tinta)] bg-[var(--lpt-tinta)] text-[var(--lpt-caliza)]'
                      : 'border-[var(--lpt-caliza-2)] bg-transparent text-[var(--lpt-tinta-2)] hover:border-[var(--lpt-tinta-2)]'
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
            className="lpt-cuerpo min-h-[52px] w-full rounded-[var(--lpt-r)] border border-[var(--lpt-caliza-2)] bg-white px-4 text-[0.9375rem] text-[var(--lpt-tinta)] transition-colors duration-200 placeholder:text-[var(--lpt-tinta-2)]/55 focus:border-[var(--lpt-tinta)]"
          />
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className="sr-only">
            Tu correo
          </label>
          <input
            id={`${uid}-email`}
            ref={refEmail}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Tu correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="lpt-cuerpo min-h-[52px] w-full rounded-[var(--lpt-r)] border border-[var(--lpt-caliza-2)] bg-white px-4 text-[0.9375rem] text-[var(--lpt-tinta)] transition-colors duration-200 placeholder:text-[var(--lpt-tinta-2)]/55 focus:border-[var(--lpt-tinta)]"
          />
        </div>
        <div>
          <label htmlFor={`${uid}-wa`} className="sr-only">
            Tu WhatsApp
          </label>
          <PhoneInputField
            id={`${uid}-wa`}
            name="phone"
            value={whatsapp}
            onChange={setWhatsapp}
            placeholder="Tu WhatsApp"
            required
            className="lpt-cota min-h-[52px] w-full rounded-[var(--lpt-r)] border border-[var(--lpt-caliza-2)] bg-white px-4 text-[0.9375rem] text-[var(--lpt-tinta)] transition-colors duration-200 focus-within:border-[var(--lpt-tinta)]"
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
        <p role="alert" className="lpt-cuerpo mt-3 text-sm text-[var(--lpt-estaca-2)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="lpt-titular mt-5 min-h-[56px] w-full rounded-[var(--lpt-r)] bg-[var(--lpt-estaca)] px-5 text-[1.0625rem] text-[var(--lpt-tinta)] transition-[background-color,transform] duration-200 hover:bg-[var(--lpt-estaca-2)] hover:text-[var(--lpt-caliza)] active:translate-y-px disabled:opacity-60"
      >
        {enviando ? 'Enviando…' : 'Ver mi plan de pagos'}
      </button>

      <p className="lpt-cuerpo mt-3.5 text-[0.8125rem] leading-relaxed text-[var(--lpt-tinta-2)]">
        Te contesta un asesor por WhatsApp {tiempoRespuesta}. Sin llamadas
        automáticas y sin compartir tu número con terceros.
      </p>
    </form>
  );
}
