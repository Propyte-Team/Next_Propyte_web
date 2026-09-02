'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { submitLead } from '@/lib/leads/submit-lead';
import { AlertCircle } from '@/lib/icons';
import PhoneInputField, { isValidPhoneNumber } from '@/components/ui/PhoneInput';

const schema = z.object({
  name: z.string().min(1, 'required'),
  email: z.string().email('invalidEmail'),
  phone: z.string().trim().min(1, 'required').refine(isValidPhoneNumber, { message: 'invalidPhone' }),
  website: z.string().optional(), // honeypot (REQ-F-02)
});

type FormData = z.infer<typeof schema>;

/**
 * El snippet que Google entrega desde su propia interfaz ya trae `?gv=true`,
 * así que quien configure la variable en el servidor lo más probable es que
 * copie eso tal cual. Concatenar a pelo produciría `?gv=true?gv=true` — el
 * parámetro `gv` valdría `"true?gv=true"` y Google serviría la página
 * completa de reservas en vez del embed. Una barra final o un `#fragment`
 * rompen igual. `URL()` además devuelve `null` ante un valor con errata: la
 * regla de "nunca un iframe roto" vale para la variable mal puesta, no solo
 * para la vacía.
 */
function urlAgenda(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return null;
    u.searchParams.set('gv', 'true');
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Formulario de cierre de la guía de terrenos residenciales, con la agenda
 * detrás del envío.
 *
 * El orden importa y es decisión de negocio: primero el lead, después el
 * calendario. Un embed de Google suelto se lleva al prospecto a la agenda sin
 * dejar rastro en el CRM — ni lead, ni UTMs, ni atribución de campaña. Por
 * eso el bloque de agenda solo aparece cuando `submitLead` ya confirmó el
 * envío; no hay `reset()` al llegar a 'sent' — el formulario se sustituye
 * por el agradecimiento y el iframe, no vuelve a estar disponible.
 *
 * La URL de la agenda vive en `NEXT_PUBLIC_GUIA_TERRENOS_AGENDA_URL`. Next
 * inlinea las `NEXT_PUBLIC_*` en build, y este repo compila en el servidor al
 * desplegar — así que la variable no existe hasta el próximo deploy y el
 * formulario tiene que funcionar igual sin ella: si viene vacía o mal puesta
 * (`urlAgenda` la rechaza), el agradecimiento se muestra solo, sin iframe.
 * Nunca un iframe roto.
 */
export default function GuiaTerrenosForm() {
  const t = useTranslations('common');
  const tg = useTranslations('guias.terrenosResidenciales');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const rawAgendaUrl = process.env.NEXT_PUBLIC_GUIA_TERRENOS_AGENDA_URL || '';
  const agendaUrl = rawAgendaUrl ? urlAgenda(rawAgendaUrl) : null;

  // Al pasar a 'sent' el <form> se desmonta y con él el botón que tenía el
  // foco: se cae al <body> y quien navega con teclado o lector de pantalla no
  // recibe ningún aviso de que el envío funcionó. Mismo patrón que
  // FormCasas.tsx. `.focus()` también hace scroll, así que cubre el caso
  // móvil sin necesitar `scrollIntoView`.
  const confirmacion = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status === 'sent') confirmacion.current?.focus();
  }, [status]);

  const { register, handleSubmit, control, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setStatus('sending');
    const result = await submitLead('guia_terrenos', data);
    setStatus(result.ok ? 'sent' : 'error');
  }

  if (status === 'sent') {
    return (
      <div ref={confirmacion} tabIndex={-1} role="status" data-testid="guia-terrenos-gracias">
        <h3 className="text-xl font-bold text-[#1A2F3F]">{tg('formGracias')}</h3>
        {agendaUrl ? (
          <>
            <p className="mt-2 text-gray-700">{tg('agendaBody')}</p>
            <iframe
              title={tg('agendaTitle')}
              src={agendaUrl}
              className="mt-4 w-full h-[520px] sm:h-[600px] rounded-xl border border-gray-200"
              loading="lazy"
            />
          </>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      // WebMCP (API declarativa): expone el form como herramienta a agentes IA.
      // El honeypot `website` queda SIN toolparamdescription a propósito → no se
      // describe al agente. Sin toolautosubmit: el usuario confirma antes de enviar.
      toolname="agendar_videollamada_guia_terrenos"
      tooldescription="Envía los datos de contacto para agendar una videollamada sobre la guía de terrenos residenciales."
    >
      {/* Honeypot — bots lo llenan; el endpoint los detecta (REQ-F-02). */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
        {...register('website')}
      />

      <div>
        <label htmlFor="guia-name" className="block text-sm font-medium text-gray-700 mb-1">{tg('formNombre')}</label>
        <div className="relative">
          <input
            id="guia-name"
            {...register('name')}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'guia-name-error' : undefined}
            aria-required={true}
            toolparamdescription="Nombre completo del interesado."
            className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:outline-none aria-invalid:border-error aria-invalid:focus:border-error"
          />
          {errors.name && (
            <AlertCircle size={16} aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-error pointer-events-none" />
          )}
        </div>
        {errors.name && (
          <p id="guia-name-error" role="alert" className="flex items-center gap-1 text-xs text-error mt-1">
            <AlertCircle size={12} aria-hidden="true" className="shrink-0" />
            {t('required')}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="guia-email" className="block text-sm font-medium text-gray-700 mb-1">{tg('formEmail')}</label>
        <div className="relative">
          <input
            id="guia-email"
            type="email"
            {...register('email')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'guia-email-error' : undefined}
            aria-required={true}
            toolparamdescription="Correo electrónico del interesado."
            className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:outline-none aria-invalid:border-error aria-invalid:focus:border-error"
          />
          {errors.email && (
            <AlertCircle size={16} aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-error pointer-events-none" />
          )}
        </div>
        {errors.email && (
          <p id="guia-email-error" role="alert" className="flex items-center gap-1 text-xs text-error mt-1">
            <AlertCircle size={12} aria-hidden="true" className="shrink-0" />
            {t('invalidEmail')}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="guia-phone" className="block text-sm font-medium text-gray-700 mb-1">{tg('formTelefono')}</label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInputField
              id="guia-phone"
              name={field.name}
              value={field.value || ''}
              onChange={(value) => field.onChange(value || '')}
              onBlur={() => { field.onBlur(); trigger('phone'); }}
              invalid={!!errors.phone}
              describedBy={errors.phone ? 'guia-phone-error' : undefined}
              required
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus-within:border-propyte-brand focus-within:outline-none aria-invalid:border-error"
              toolParamDescription="Teléfono de contacto, con selector de lada de país."
            />
          )}
        />
        {errors.phone && (
          <p id="guia-phone-error" role="alert" className="flex items-center gap-1 text-xs text-error mt-1">
            <AlertCircle size={12} aria-hidden="true" className="shrink-0" />
            {errors.phone.message === 'invalidPhone' ? t('invalidPhone') : t('required')}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full h-12 bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        {status === 'sending' ? tg('formEnviando') : tg('formEnviar')}
      </button>

      {status === 'error' && <p role="alert" className="text-sm text-red-500 text-center">{tg('formError')}</p>}
    </form>
  );
}
