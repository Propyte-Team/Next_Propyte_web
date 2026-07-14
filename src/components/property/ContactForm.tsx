'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { submitForm } from '@/lib/submitForm';

const schema = z.object({
  name: z.string().min(1, 'required'),
  email: z.string().email('invalidEmail'),
  phone: z.string().optional(),
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
  const [showPhone, setShowPhone] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
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
        <input
          id="contact-name"
          {...register('name')}
          toolparamdescription="Nombre completo del interesado."
          className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:outline-none"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{t('required')}</p>}
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          id="contact-email"
          type="email"
          {...register('email')}
          toolparamdescription="Correo electrónico del interesado."
          className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:outline-none"
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{t('invalidEmail')}</p>}
      </div>

      {!showPhone ? (
        <button type="button" onClick={() => setShowPhone(true)} className="text-sm text-[#0E7490] hover:underline">
          + {tContact('formPhone') || 'Phone'}
        </button>
      ) : (
        <div>
          <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">{tContact('formPhone') || 'Phone'}</label>
          <input
            id="contact-phone"
            type="tel"
            {...register('phone')}
            toolparamdescription="Teléfono de contacto a 10 dígitos (opcional)."
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:outline-none"
          />
        </div>
      )}

      <div className={whatsappUrl ? 'grid grid-cols-2 gap-2' : ''}>
        <button
          type="submit"
          disabled={status === 'sending'}
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
