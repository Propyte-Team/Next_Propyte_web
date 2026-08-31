'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Loader2, MessageCircle } from '@/lib/icons';
import { submitLead } from '@/lib/leads/submit-lead';
import PhoneInputField, { isValidPhoneNumber } from '@/components/ui/PhoneInput';
import { trackWhatsAppClick } from '@/lib/analytics/track';
import { COPY, type LocaleCasas } from '../_copy';

// ============================================================
// Formulario de la landing de casas. UN SOLO PASO, siempre visible.
//
// La lección que hereda de `LeadFormLotes` está pagada y documentada: Google
// Ads gastó $991.40 MXN en 72 clics con CERO envíos porque el formulario vivía
// detrás de una compuerta de calificación —`querySelectorAll('form').length`
// devolvía 0 al cargar—. El visitante que costó $13.77 no veía un formulario,
// veía una pregunta. Aquí el formulario está montado y con sus campos a la
// vista desde el primer pixel, en el hero y otra vez al cierre.
//
// LOS DOS CANALES QUE PROMETE LA CAMPAÑA, JUNTOS Y JERARQUIZADOS. El dossier
// (email) es el objetivo primario: deja lead atribuible aunque nadie conteste.
// WhatsApp es la salida inmediata para quien no quiere esperar un correo, y va
// SUBORDINADO —contorno, no relleno—. Con los dos al mismo peso visual, el
// canal cómodo se come al canal que califica, y la campaña se queda sin correo
// al que mandar la ficha que prometió el anuncio.
//
// TRES CAMPOS OBLIGATORIOS Y NI UNO MÁS. Nombre, WhatsApp y email. El email no
// es negociable porque es donde aterriza el dossier: pedirlo es coherente con
// lo que el botón promete. Todo lo demás —casa de interés, presupuesto— son
// taps OPCIONALES que califican DESPUÉS del contacto, donde ya no pueden
// costar un lead.
//
// Atribución: `gclid`/`wbraid`/UTMs se leen de la URL y viven en estado React
// hasta el POST. Deliberadamente NO se usa `useUTMCapture` (persiste en
// sessionStorage): esta landing vive fuera de `[locale]` y no monta <UTMCapture />.
// ============================================================

// Los rangos de presupuesto viven ahora en `_copy.ts`, con el resto de las
// cadenas. El corte en 6 y en 11 millones no es redondo por capricho: parte el
// inventario en tres tercios comparables (cuatro casas, cuatro casas, tres
// villas), así que cada respuesta le dice algo distinto al asesor. Una escala
// de «hasta 3M / 3-5M / 5M+» dejaría diez de las once casas en el mismo cubo.
// La variante en inglés los mantiene EN PESOS a propósito: convertirlos exigiría
// un tipo de cambio inventado, que es justo lo que esta página no hace.

const CLAVES_URL = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'wbraid',
  'fbclid',
  // `short_code` del QR físico (lo estampa /q/[code] del Hub). Esta LP vive
  // fuera de [locale], así que <UTMCapture /> no se monta aquí: la lista está
  // duplicada respecto a la de lotes a propósito y hay que tocar AMBAS.
  'qr',
] as const;

type Atribucion = Partial<Record<(typeof CLAVES_URL)[number], string>>;

export interface OpcionCasa {
  slug: string;
  titulo: string;
}

/** Eventos de observación, no de puja. `gtag` hace cola antes de cargar. */
function emitirEvento(evento: string) {
  if (typeof window === 'undefined') return;
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  w.gtag?.('event', evento, { form_type: 'lp_casas_riviera' });
}

const ETIQUETA = 'lpc-etiqueta block text-[var(--lpc-on-dark-3)]';

function chip(activo: boolean) {
  return `min-h-[40px] cursor-pointer border px-3 text-left text-[0.8125rem] leading-tight transition-colors duration-200 ${
    activo
      ? 'border-[var(--lpc-on-dark)] bg-[var(--lpc-on-dark)] text-[var(--lpc-ink)]'
      : 'border-[var(--lpc-line-dark)] text-[var(--lpc-on-dark-2)] hover:border-[var(--lpc-on-dark-2)]'
  }`;
}

export default function FormCasas({
  variante,
  casas,
  casaSeleccionada,
  onCasaChange,
  telefonoWhatsApp,
  /**
   * Idioma de las cadenas. Cruza la frontera servidor→cliente como CADENA y no
   * como el objeto de copy: el diccionario interpola con funciones y una
   * función no es serializable (ver la nota de `COPY` en `_copy.ts`). El
   * español es el valor por defecto para que `/lp/casas-riviera-maya` se
   * comporte igual que antes: el idioma es decisión de la RUTA.
   */
  locale = 'es',
  /**
   * ⚠️ COMPROMISO OPERATIVO, no copy. Define qué promete la marca al enviar.
   * Cambiarlo es decisión de negocio: si el equipo comercial no puede sostener
   * el plazo, la promesa quema el lead en vez de calentarlo. El valor por
   * defecto lo declara el diccionario, porque el plazo que se puede sostener en
   * inglés no es el mismo que en español.
   */
  tiempoRespuesta,
}: {
  /** `hero` va en el panel del primer pliegue; `cierre` cierra el documento. */
  variante: 'hero' | 'cierre';
  casas: OpcionCasa[];
  casaSeleccionada: string | null;
  onCasaChange: (slug: string | null) => void;
  telefonoWhatsApp: string;
  locale?: LocaleCasas;
  tiempoRespuesta?: string;
}) {
  const copy = COPY[locale];
  const plazo = tiempoRespuesta ?? copy.form.tiempoRespuesta;
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState('');
  const [presupuesto, setPresupuesto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ref y NO estado: la atribución no se pinta en ningún sitio, solo se lee en
  // el submit. En estado, el `setAtribucion` del efecto de montaje dispara un
  // render en cascada del formulario entero para cambiar un dato invisible.
  const atribucion = useRef<Atribucion>({});

  // Honeypot. Un bot rellena todo lo que encuentra; una persona no ve esto.
  const [website, setWebsite] = useState('');

  // Se emite UNA vez por instancia, no en cada tecla.
  const inicioEmitido = useRef(false);
  const confirmacion = useRef<HTMLDivElement>(null);

  // Dos instancias del form conviven en la página. Sin ids únicos el
  // `htmlFor` de la segunda apunta al campo de la primera y el tap en la
  // etiqueta mueve el foco a otro pliegue de la página.
  const uid = useId();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const capturado: Atribucion = {};
    for (const clave of CLAVES_URL) {
      const valor = params.get(clave);
      if (valor) capturado[clave] = valor;
    }
    atribucion.current = capturado;
  }, []);

  function marcarInicio() {
    if (inicioEmitido.current) return;
    inicioEmitido.current = true;
    emitirEvento('form_start');
  }

  // `<HTMLFormElement>` y no el `Element` por defecto: `new FormData(...)` no
  // acepta un Element genérico.
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;

    // El honeypot NO devuelve error: el bot debe creer que funcionó. El
    // servidor lo descarta igual; esto solo evita el viaje.
    if (website) {
      setEnviado(true);
      return;
    }

    // EL DOM MANDA SOBRE EL ESTADO REACT en los tres campos de texto. Un
    // autocompletado del navegador o un gestor de contraseñas rellena el
    // <input> sin disparar `change`: el visitante ve el campo lleno y
    // `nombre`/`email`/`whatsapp` siguen en ''. Leer del estado manda vacío un
    // formulario que en pantalla estaba completo.
    const campos = new FormData(e.currentTarget);
    const leer = (clave: string, estado: string) =>
      (String(campos.get(clave) ?? '') || estado).trim();

    const nombreEnviado = leer('name', nombre);
    const emailEnviado = leer('email', email);
    // El teléfono es el ÚNICO que no lee del DOM primero: el <input> del
    // selector de lada muestra el número formateado («+52 984 123 4567») y el
    // estado guarda el E.164 canónico, que es lo que va a Zoho. El DOM queda
    // de red de seguridad para el autocompletado que no dispara `change`.
    const whatsappEnviado = (whatsapp || String(campos.get('phone') ?? '')).trim();

    // Se sincroniza el estado con lo que el visitante realmente ve: sin esto la
    // pantalla de éxito lo saluda con el fallback y le repite un correo vacío.
    if (nombreEnviado !== nombre) setNombre(nombreEnviado);
    if (emailEnviado !== email) setEmail(emailEnviado);
    if (whatsappEnviado !== whatsapp) setWhatsapp(whatsappEnviado);

    // LA RAZÓN DE ESTE BLOQUE, con fecha. El 29-ago-2026 un clic de Google Ads
    // en inglés (17 clics, $291.87 MXN) envió este formulario con los tres
    // campos vacíos: el <form> llevaba `noValidate`, así que los `required` no
    // frenaban nada, y `enviar()` no comprobaba nada. Aterrizó en Zoho como
    // «Anónimo», sin correo ni teléfono, y al visitante se le dijo que todo
    // había salido bien. Un lead pagado e incontactable.
    if (!nombreEnviado || !emailEnviado || !whatsappEnviado) {
      setError(copy.form.faltanCampos);
      emitirEvento('form_invalido');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEnviado)) {
      setError(copy.form.emailInvalido);
      emitirEvento('form_invalido');
      return;
    }

    if (!isValidPhoneNumber(whatsappEnviado)) {
      setError(copy.form.telefonoInvalido);
      emitirEvento('form_invalido');
      return;
    }

    setEnviando(true);
    setError(null);

    const casa = casas.find((c) => c.slug === casaSeleccionada);

    const resultado = await submitLead('lp_casas_riviera', {
      name: nombreEnviado,
      email: emailEnviado,
      phone: whatsappEnviado,
      whatsapp: whatsappEnviado,
      // `propertyName` es lo que el asesor ve primero en Zoho. Va el título de
      // la casa cuando hay una elegida, y el alcance de la campaña cuando no:
      // «(sin casa específica)» le dice al asesor que abra con el inventario
      // completo, no que el dato se perdió.
      propertyName: casa ? casa.titulo : copy.form.sinCasaEspecifica,
      budget: presupuesto ?? undefined,
      locale: copy.locale,
      website,
      ...atribucion.current,
    });

    setEnviando(false);

    if (!resultado.ok) {
      setError(copy.form.error);
      emitirEvento('form_error');
      return;
    }

    setEnviado(true);
    emitirEvento('form_submit');
  }

  // El foco salta a la confirmación: en móvil el éxito puede quedar fuera de
  // pantalla y el visitante cree que no pasó nada y vuelve a pulsar.
  useEffect(() => {
    if (enviado) confirmacion.current?.focus();
  }, [enviado]);

  const hrefWhatsApp = (() => {
    const casa = casas.find((c) => c.slug === casaSeleccionada);
    const texto = casa ? copy.whatsapp.porCasa(casa.titulo) : copy.whatsapp.generico;
    const params = new URLSearchParams({ text: texto });
    return `https://wa.me/${telefonoWhatsApp}?${params.toString()}`;
  })();

  if (enviado) {
    return (
      <div
        ref={confirmacion}
        tabIndex={-1}
        className="lpc-panel-oscuro bg-[var(--lpc-dark-2)] p-7 sm:p-9"
        data-lpc-estado="enviado"
      >
        <div className="flex h-9 w-9 items-center justify-center border border-[var(--lpc-on-dark)]">
          <Check className="h-4 w-4 text-[var(--lpc-on-dark)]" aria-hidden />
        </div>
        <h3 className="lpc-titulo mt-5 text-[1.5rem] text-[var(--lpc-on-dark)]">
          {copy.form.exito.titulo(nombre.split(' ')[0] || copy.form.exito.sinNombre)}
        </h3>
        <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-[var(--lpc-on-dark-2)]">
          {copy.form.exito.cuerpo(email, casas.length, plazo)}
        </p>
        <a
          href={hrefWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsAppClick({ surface: `lp_casas_${variante}_post_envio` })}
          className="mt-7 inline-flex min-h-[52px] items-center gap-2.5 border border-[var(--lpc-line-dark)] px-6 text-sm text-[var(--lpc-on-dark)] transition-colors duration-200 hover:border-[var(--lpc-on-dark)]"
        >
          <MessageCircle className="h-4 w-4" style={{ color: 'var(--lpc-wa)' }} aria-hidden />
          {copy.form.exito.cta}
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={enviar}
      data-lpc-form={variante}
      className="lpc-panel-oscuro bg-[var(--lpc-dark-2)] p-7 sm:p-9"
    >
      <p className="lpc-etiqueta text-[var(--lpc-signal-on-dark)]">
        {copy.form.etiqueta(casas.length)}
      </p>
      <h2 className="lpc-titulo mt-3 text-[clamp(1.5rem,1.2rem+1.1vw,2rem)] text-[var(--lpc-on-dark)]">
        {copy.form.titulo}
      </h2>
      <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-[var(--lpc-on-dark-2)]">
        {copy.form.cuerpo(plazo)}
      </p>

      <div className="mt-8 grid gap-6">
        <div>
          <label htmlFor={`nombre-${uid}`} className={ETIQUETA}>
            {copy.form.nombre}
          </label>
          <input
            id={`nombre-${uid}`}
            name="name"
            type="text"
            autoComplete="name"
            required
            value={nombre}
            onFocus={marcarInicio}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={copy.form.nombrePlaceholder}
            className="lpc-campo mt-2 text-base"
          />
        </div>

        <div>
          <label htmlFor={`whatsapp-${uid}`} className={ETIQUETA}>
            {copy.form.whatsapp}
          </label>
          <PhoneInputField
            id={`whatsapp-${uid}`}
            name="phone"
            value={whatsapp}
            onChange={(v) => { marcarInicio(); setWhatsapp(v); }}
            placeholder={copy.form.whatsappPlaceholder}
            required
            className="lpc-campo mt-2 text-base"
          />
        </div>

        <div>
          <label htmlFor={`email-${uid}`} className={ETIQUETA}>
            {copy.form.email}
          </label>
          <input
            id={`email-${uid}`}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onFocus={marcarInicio}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={copy.form.emailPlaceholder}
            className="lpc-campo mt-2 text-base"
          />
        </div>

        {/* Casa de interés. Opcional y sincronizada con la cuadrícula: pulsar
            «Me interesa» en una tarjeta la deja elegida aquí. Un <select> y no
            once radios porque el campo NO debe crecer con el inventario. */}
        <div>
          <label htmlFor={`casa-${uid}`} className={ETIQUETA}>
            {copy.form.casaLabel}{' '}
            <span className="normal-case tracking-normal">{copy.form.opcional}</span>
          </label>
          <select
            id={`casa-${uid}`}
            name="propertySlug"
            value={casaSeleccionada ?? ''}
            onChange={(e) => onCasaChange(e.target.value || null)}
            className="lpc-campo mt-2 cursor-pointer text-base"
          >
            <option value="" className="bg-[var(--lpc-dark-2)]">
              {copy.form.verTodas}
            </option>
            {casas.map((casa) => (
              <option key={casa.slug} value={casa.slug} className="bg-[var(--lpc-dark-2)]">
                {casa.titulo}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className={ETIQUETA}>
            {copy.form.presupuestoLabel}{' '}
            <span className="normal-case tracking-normal">{copy.form.opcional}</span>
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {copy.form.presupuestos.map((rango) => (
              <button
                key={rango}
                type="button"
                aria-pressed={presupuesto === rango}
                onClick={() => {
                  marcarInicio();
                  setPresupuesto(presupuesto === rango ? null : rango);
                }}
                className={chip(presupuesto === rango)}
              >
                {rango}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Honeypot. `tabIndex={-1}` y `aria-hidden` para que ni el teclado ni el
          lector de pantalla lo encuentren; `sr-only` no sirve aquí, porque a un
          lector de pantalla SÍ se lo leería. */}
      <div className="absolute left-[-9999px]" aria-hidden>
        <label htmlFor={`website-${uid}`}>{copy.form.honeypot}</label>
        <input
          id={`website-${uid}`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="mt-6 text-sm text-[var(--lpc-signal-on-dark)]">
          {error}
        </p>
      )}

      {/* CTA primario: relleno sólido invertido. En un documento monocromo la
          inversión ES el énfasis — un botón de color aquí sería el mismo botón
          que tiene toda la competencia. */}
      <button
        type="submit"
        disabled={enviando}
        className="mt-8 inline-flex min-h-[56px] w-full items-center justify-center gap-2.5 bg-[var(--lpc-on-dark)] px-6 text-sm font-medium uppercase tracking-[0.1em] text-[var(--lpc-ink)] transition-opacity duration-200 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {enviando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {copy.form.enviando}
          </>
        ) : (
          <>
            {copy.form.enviar}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>

      {/* WhatsApp SUBORDINADO: mismo tap target de 52px, contorno en vez de
          relleno. Presente porque quitarlo pierde ventas, en segundo plano
          porque al mismo peso se come el correo al que va el dossier. */}
      <a
        href={hrefWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick({ surface: `lp_casas_${variante}` })}
        className="mt-3 inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 border border-[var(--lpc-line-dark)] px-6 text-sm text-[var(--lpc-on-dark-2)] transition-colors duration-200 hover:border-[var(--lpc-on-dark)] hover:text-[var(--lpc-on-dark)]"
      >
        <MessageCircle className="h-4 w-4" style={{ color: 'var(--lpc-wa)' }} aria-hidden />
        {copy.form.preferirWhatsApp}
      </a>

      <p className="mt-5 text-xs leading-relaxed text-[var(--lpc-on-dark-3)]">
        {copy.form.notaPrivacidad}{' '}
        <Link
          href={copy.legal.privacidadHref}
          prefetch={false}
          className="underline decoration-[var(--lpc-on-dark-3)] underline-offset-2 hover:text-[var(--lpc-on-dark-2)]"
        >
          {copy.legal.avisoPrivacidad}
        </Link>
        .
      </p>
    </form>
  );
}
