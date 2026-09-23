'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { submitForm } from '@/lib/submitForm';
import { AlertCircle } from '@/lib/icons';
import PhoneInputField, { isValidPhoneNumber } from '@/components/ui/PhoneInput';

const schema = z.object({
  name: z.string().min(1, 'required'),
  email: z.string().email('invalidEmail'),
  phone: z.string().trim().min(1, 'required').refine(isValidPhoneNumber, { message: 'invalidPhone' }),
  website: z.string().optional(), // honeypot (REQ-F-02)
});

type FormData = z.infer<typeof schema>;

interface ContactFormProps {
  propertyId: string;
  propertyName: string;
  /** Si se pasa, se renderiza un botón WhatsApp pegado al "Enviar" en una sola fila. */
  whatsappUrl?: string;
  whatsappLabel?: string;
}

export default function ContactForm({ propertyId, propertyName, whatsappUrl, whatsappLabel }: ContactFormProps) {
  const t = useTranslations('common');
  const tContact = useTranslations('contact');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const { register, handleSubmit, control, trigger, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setStatus('sending');
    const result = await submitForm(
      { ...data, propertyId, propertyName },
      'property_inquiry'
    );
    if (result.success) {
      setStatus('sent');
      reset();
    } else {
      setStatus('error');
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      // WebMCP (API declarativa): expone el form como herramienta a agentes IA.
      // El honeypot `website` queda SIN toolparamdescription a propósito → no se
      // describe al agente. Sin toolautosubmit: el usuario confirma antes de enviar.
      toolname="contactar_sobre_propiedad"
      tooldescription="Envía una solicitud de contacto a un asesor de Propyte sobre una propiedad específica."
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
        <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">{tContact('formName')}</label>
        <div className="relative">
          <input
            id="contact-name"
            {...register('name')}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            aria-required={true}
            toolparamdescription="Nombre completo del interesado."
            className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:outline-none aria-invalid:border-error aria-invalid:focus:border-error"
          />
          {errors.name && (
            <AlertCircle size={16} aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-error pointer-events-none" />
          )}
        </div>
        {errors.name && (
          <p id="contact-name-error" role="alert" className="flex items-center gap-1 text-xs text-error mt-1">
            <AlertCircle size={12} aria-hidden="true" className="shrink-0" />
            {t('required')}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <div className="relative">
          <input
            id="contact-email"
            type="email"
            {...register('email')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            aria-required={true}
            toolparamdescription="Correo electrónico del interesado."
            className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:outline-none aria-invalid:border-error aria-invalid:focus:border-error"
          />
          {errors.email && (
            <AlertCircle size={16} aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-error pointer-events-none" />
          )}
        </div>
        {errors.email && (
          <p id="contact-email-error" role="alert" className="flex items-center gap-1 text-xs text-error mt-1">
            <AlertCircle size={12} aria-hidden="true" className="shrink-0" />
            {t('invalidEmail')}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">{tContact('formPhone') || 'Phone'}</label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInputField
              id="contact-phone"
              name={field.name}
              value={field.value || ''}
              onChange={(value) => field.onChange(value || '')}
              onBlur={() => { field.onBlur(); trigger('phone'); }}
              invalid={!!errors.phone}
              describedBy={errors.phone ? 'contact-phone-error' : undefined}
              required
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus-within:border-propyte-brand focus-within:outline-none aria-invalid:border-error"
              toolParamDescription="Teléfono de contacto, con selector de lada de país."
            />
          )}
        />
        {errors.phone && (
          <p id="contact-phone-error" role="alert" className="flex items-center gap-1 text-xs text-error mt-1">
            <AlertCircle size={12} aria-hidden="true" className="shrink-0" />
            {errors.phone.message === 'invalidPhone' ? t('invalidPhone') : t('required')}
          </p>
        )}
      </div>

      <div className={whatsappUrl ? 'grid grid-cols-2 gap-2' : ''}>
        <button
          type="submit"
          // status === 'sent' también deshabilita: los campos ya se resetearon
          // (reset() en onSubmit), así que un segundo clic aquí antes disparaba
          // validación contra name/email vacíos justo después de un envío exitoso.
          disabled={status === 'sending' || status === 'sent'}
          className="h-12 bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {status === 'sending' ? t('sending') : status === 'sent' ? t('sent') : t('send')}
        </button>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-12 propyte-cta-whatsapp font-semibold rounded-lg transition-colors"
          >
            {whatsappLabel || 'WhatsApp'}
          </a>
        )}
      </div>

      {status === 'error' && <p className="text-sm text-red-500 text-center">{t('error')}</p>}
    </form>
  );
}
