'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Loader2, MessageCircle } from '@/lib/icons';
import { submitLead } from '@/lib/leads/submit-lead';
import PhoneInputField, { isValidPhoneNumber } from '@/components/ui/PhoneInput';
import { trackWhatsAppClick } from '@/lib/analytics/track';
import type { LeadSource } from '@/lib/zoho/field-maps';

// ============================================================
// Formulario compartido de las landings de inventario (familia v2).
//
// Hereda íntegro el comportamiento de `FormCasas`, que ya pagó sus lecciones:
//
//   · UN SOLO PASO, siempre visible. Nada detrás de una compuerta de
//     calificación ($991.40 MXN en 72 clics sin un envío).
//   · TRES OBLIGATORIOS: nombre, WhatsApp y correo. El DOM manda sobre el
//     estado React (autocompletado que no dispara `change`), y se valida en
//     `enviar()` porque el `<form>` sin `noValidate` no basta cuando el DOM
//     está lleno y el estado vacío.
//   · DOSSIER PRIMERO, WHATSAPP SUBORDINADO. Relleno vs contorno.
//   · Atribución leída de la URL y guardada en un ref: esta familia vive
//     fuera de `[locale]` y no monta <UTMCapture />.
//
// Lo que cambia respecto a `FormCasas` es que aquí TODO el copy entra por
// props como cadenas planas. Cinco landings con cinco voces distintas no
// pueden compartir un diccionario con funciones, y una función no cruza la
// frontera servidor→cliente. Las interpolaciones que hacían falta
// (`{total}`, `{email}`) se resuelven aquí con un reemplazo de marcador.
//
// Pinta con los tokens `--lpv-panel-*` del contrato de `tokens.css`: la
// landing decide si el panel es negro, azul marino o hueso.
// ============================================================

const CLAVES_URL = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'wbraid',
  'fbclid',
  'short_code',
] as const;

type Atribucion = Partial<Record<(typeof CLAVES_URL)[number], string>>;

export interface OpcionPropiedad {
  slug: string;
  titulo: string;
}

export interface CopyForm {
  etiqueta: string;
  titulo: string;
  /** Admite `{total}`. */
  cuerpo: string;
  nombre: string;
  whatsapp: string;
  email: string;
  propiedadLabel: string;
  verTodas: string;
  presupuestoLabel: string;
  presupuestos: readonly string[];
  enviar: string;
  preferirWhatsApp: string;
  /** Admite `{email}` y `{total}`. */
  exitoCuerpo: string;
  exitoCta: string;
  /** Lo que el asesor ve en Zoho cuando no eligieron propiedad. */
  sinEspecifica: string;
  /** Mensaje de WhatsApp sin propiedad elegida. */
  whatsappGenerico: string;
  /** Admite `{titulo}`. */
  whatsappPorPropiedad: string;
}

const TEXTOS_FIJOS = {
  opcional: '(opcional)',
  enviando: 'Enviando',
  honeypot: 'No llenar',
  notaPrivacidad: 'Usamos tus datos solo para enviarte esta información y contactarte. Sin listas de terceros.',
  avisoPrivacidad: 'Aviso de privacidad',
  error: 'No pudimos enviar tus datos. Escríbenos por WhatsApp y lo resolvemos ahí.',
  faltanCampos: 'Completa nombre, WhatsApp y correo para recibir la información.',
  emailInvalido: 'Revisa el correo: es a donde te llega la información.',
  telefonoInvalido: 'Revisa el teléfono: elige tu país y escribe el número completo.',
  exitoTitulo: 'Listo, {nombre}.',
  sinNombre: 'gracias',
  nombrePlaceholder: 'Tu nombre',
  whatsappPlaceholder: '+52 984 000 0000',
  emailPlaceholder: 'tu@correo.com',
} as const;

/**
 * `{total}` imprime el valor; `{total|casa|casas}` elige singular o plural
 * segun el valor (asi «Ficha de 1 casa» y «Ficha de 10 casas» salen bien).
 */
function rellenar(plantilla: string, valores: Record<string, string | number>): string {
  return plantilla
    .replace(/\{(\w+)\|([^|}]*)\|([^}]*)\}/g, (_, k: string, uno: string, varios: string) =>
      Number(valores[k]) === 1 ? uno : varios,
    )
    .replace(/\{(\w+)\}/g, (_, k: string) => String(valores[k] ?? ''));
}

function emitirEvento(evento: string, source: LeadSource) {
  if (typeof window === 'undefined') return;
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  w.gtag?.('event', evento, { form_type: source });
}

const ETIQUETA = 'block text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--lpv-panel-fg-3)]';

function chip(activo: boolean) {
  return `min-h-[40px] cursor-pointer rounded-[var(--lpv-r-control)] border px-3 text-left text-[0.8125rem] leading-tight transition-colors duration-200 ${
    activo
      ? 'border-[var(--lpv-panel-accent)] bg-[var(--lpv-panel-accent)] text-[var(--lpv-panel-on-accent)]'
      : 'border-[var(--lpv-panel-line)] text-[var(--lpv-panel-fg-2)] hover:border-[var(--lpv-panel-fg-2)]'
  }`;
}

export default function FormInventario({
  source,
  variante,
  copy,
  opciones,
  seleccion,
  onSeleccion,
  telefonoWhatsApp,
  className = '',
}: {
  source: LeadSource;
  /** Solo distingue las superficies de medición. */
  variante: 'hero' | 'cierre';
  copy: CopyForm;
  opciones: OpcionPropiedad[];
  /** Controlado desde fuera (la cuadrícula elige). Si no viene, es interno. */
  seleccion?: string | null;
  onSeleccion?: (slug: string | null) => void;
  telefonoWhatsApp: string;
  className?: string;
}) {
  const [seleccionInterna, setSeleccionInterna] = useState<string | null>(null);
  const elegida = seleccion !== undefined ? seleccion : seleccionInterna;
  const elegir = onSeleccion ?? setSeleccionInterna;

  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState('');
  const [presupuesto, setPresupuesto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const atribucion = useRef<Atribucion>({});
  const inicioEmitido = useRef(false);
  const confirmacion = useRef<HTMLDivElement>(null);
  const uid = useId();
  const total = opciones.length;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const capturado: Atribucion = {};
    for (const clave of CLAVES_URL) {
      const valor = params.get(clave);
      if (valor) capturado[clave] = valor;
    }
    atribucion.current = capturado;
  }, []);

  useEffect(() => {
    if (enviado) confirmacion.current?.focus();
  }, [enviado]);

  function marcarInicio() {
    if (inicioEmitido.current) return;
    inicioEmitido.current = true;
    emitirEvento('form_start', source);
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    if (website) {
      setEnviado(true);
      return;
    }

    const campos = new FormData(e.currentTarget);
    const leer = (clave: string, estado: string) =>
      (String(campos.get(clave) ?? '') || estado).trim();
    const nombreEnviado = leer('name', nombre);
    const emailEnviado = leer('email', email);
    const whatsappEnviado = (whatsapp || String(campos.get('phone') ?? '')).trim();

    if (nombreEnviado !== nombre) setNombre(nombreEnviado);
    if (emailEnviado !== email) setEmail(emailEnviado);
    if (whatsappEnviado !== whatsapp) setWhatsapp(whatsappEnviado);

    if (!nombreEnviado || !emailEnviado || !whatsappEnviado) {
      setError(TEXTOS_FIJOS.faltanCampos);
      emitirEvento('form_invalido', source);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEnviado)) {
      setError(TEXTOS_FIJOS.emailInvalido);
      emitirEvento('form_invalido', source);
      return;
    }
    if (!isValidPhoneNumber(whatsappEnviado)) {
      setError(TEXTOS_FIJOS.telefonoInvalido);
      emitirEvento('form_invalido', source);
      return;
    }

    setEnviando(true);
    setError(null);

    const propiedad = opciones.find((o) => o.slug === elegida);
    const resultado = await submitLead(source, {
      name: nombreEnviado,
      email: emailEnviado,
      phone: whatsappEnviado,
      whatsapp: whatsappEnviado,
      propertyName: propiedad ? propiedad.titulo : copy.sinEspecifica,
      budget: presupuesto ?? undefined,
      locale: 'es',
      website,
      ...atribucion.current,
    });

    setEnviando(false);
    if (!resultado.ok) {
      setError(TEXTOS_FIJOS.error);
      emitirEvento('form_error', source);
      return;
    }
    setEnviado(true);
    emitirEvento('form_submit', source);
  }

  const hrefWhatsApp = (() => {
    const propiedad = opciones.find((o) => o.slug === elegida);
    const texto = propiedad
      ? rellenar(copy.whatsappPorPropiedad, { titulo: propiedad.titulo })
      : copy.whatsappGenerico;
    return `https://wa.me/${telefonoWhatsApp}?${new URLSearchParams({ text: texto }).toString()}`;
  })();

  const panel = `lpv-panel rounded-[var(--lpv-r)] bg-[var(--lpv-panel-bg)] text-[var(--lpv-panel-fg)] ${className}`;

  if (enviado) {
    return (
      <div ref={confirmacion} tabIndex={-1} className={`${panel} p-7 sm:p-9`} data-lpv-estado="enviado">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--lpv-r-control)] border border-[var(--lpv-panel-fg)]">
          <Check className="h-4 w-4" aria-hidden />
        </div>
        <h3 className="lpv-display mt-5 text-[1.5rem] font-semibold leading-tight">
          {rellenar(TEXTOS_FIJOS.exitoTitulo, {
            nombre: nombre.split(' ')[0] || TEXTOS_FIJOS.sinNombre,
          })}
        </h3>
        <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-[var(--lpv-panel-fg-2)]">
          {rellenar(copy.exitoCuerpo, { email, total })}
        </p>
        <a
          href={hrefWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsAppClick({ surface: `${source}_${variante}_post_envio` })}
          className="mt-7 inline-flex min-h-[52px] items-center gap-2.5 rounded-[var(--lpv-r-control)] border border-[var(--lpv-panel-line)] px-6 text-sm transition-colors duration-200 hover:border-[var(--lpv-panel-fg)]"
        >
          <MessageCircle className="h-4 w-4" style={{ color: 'var(--lpv-wa)' }} aria-hidden />
          {copy.exitoCta}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} data-lpv-form={variante} className={`${panel} relative p-7 sm:p-9`}>
      <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--lpv-panel-accent)]">
        {rellenar(copy.etiqueta, { total })}
      </p>
      <h2 className="lpv-display mt-3 text-[clamp(1.5rem,1.2rem+1.1vw,2rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
        {copy.titulo}
      </h2>
      <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-[var(--lpv-panel-fg-2)]">
        {rellenar(copy.cuerpo, { total })}
      </p>

      <div className="mt-8 grid gap-6">
        <div>
          <label htmlFor={`nombre-${uid}`} className={ETIQUETA}>
            {copy.nombre}
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
            placeholder={TEXTOS_FIJOS.nombrePlaceholder}
            className="lpv-campo mt-2 text-base"
          />
        </div>

        <div>
          <label htmlFor={`whatsapp-${uid}`} className={ETIQUETA}>
            {copy.whatsapp}
          </label>
          <PhoneInputField
            id={`whatsapp-${uid}`}
            name="phone"
            value={whatsapp}
            onChange={(v) => {
              marcarInicio();
              setWhatsapp(v);
            }}
            placeholder={TEXTOS_FIJOS.whatsappPlaceholder}
            required
            className="lpv-campo mt-2 text-base"
          />
        </div>

        <div>
          <label htmlFor={`email-${uid}`} className={ETIQUETA}>
            {copy.email}
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
            placeholder={TEXTOS_FIJOS.emailPlaceholder}
            className="lpv-campo mt-2 text-base"
          />
        </div>

        {opciones.length > 0 && (
          <div>
            <label htmlFor={`propiedad-${uid}`} className={ETIQUETA}>
              {copy.propiedadLabel}{' '}
              <span className="normal-case tracking-normal">{TEXTOS_FIJOS.opcional}</span>
            </label>
            <select
              id={`propiedad-${uid}`}
              name="propertySlug"
              value={elegida ?? ''}
              onChange={(e) => elegir(e.target.value || null)}
              className="lpv-campo mt-2 cursor-pointer text-base"
            >
              <option value="" className="bg-[var(--lpv-panel-bg-2)]">
                {copy.verTodas}
              </option>
              {opciones.map((o) => (
                <option key={o.slug} value={o.slug} className="bg-[var(--lpv-panel-bg-2)]">
                  {o.titulo}
                </option>
              ))}
            </select>
          </div>
        )}

        {copy.presupuestos.length > 0 && (
          <fieldset>
            <legend className={ETIQUETA}>
              {copy.presupuestoLabel}{' '}
              <span className="normal-case tracking-normal">{TEXTOS_FIJOS.opcional}</span>
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {copy.presupuestos.map((rango) => (
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
        )}
      </div>

      <div className="absolute left-[-9999px]" aria-hidden>
        <label htmlFor={`website-${uid}`}>{TEXTOS_FIJOS.honeypot}</label>
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
        <p role="alert" className="mt-6 text-sm text-[#ff6a4d]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-8 inline-flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-[var(--lpv-r-control)] bg-[var(--lpv-panel-accent)] px-6 text-sm font-semibold text-[var(--lpv-panel-on-accent)] transition-opacity duration-200 hover:opacity-90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55"
      >
        {enviando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {TEXTOS_FIJOS.enviando}
          </>
        ) : (
          <>
            {copy.enviar}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>

      <a
        href={hrefWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick({ surface: `${source}_${variante}` })}
        className="mt-3 inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[var(--lpv-r-control)] border border-[var(--lpv-panel-line)] px-6 text-sm text-[var(--lpv-panel-fg-2)] transition-colors duration-200 hover:border-[var(--lpv-panel-fg)] hover:text-[var(--lpv-panel-fg)]"
      >
        <MessageCircle className="h-4 w-4" style={{ color: 'var(--lpv-wa)' }} aria-hidden />
        {copy.preferirWhatsApp}
      </a>

      <p className="mt-5 text-xs leading-relaxed text-[var(--lpv-panel-fg-3)]">
        {TEXTOS_FIJOS.notaPrivacidad}{' '}
        <Link
          href="/es/privacidad"
          prefetch={false}
          className="underline underline-offset-2 hover:text-[var(--lpv-panel-fg-2)]"
        >
          {TEXTOS_FIJOS.avisoPrivacidad}
        </Link>
      </p>
    </form>
  );
}
