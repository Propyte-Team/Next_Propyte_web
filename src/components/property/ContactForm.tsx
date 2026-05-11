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
  investmentType: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ContactFormProps {
  propertyId: string;
  propertyName: string;
}

export default function ContactForm({ propertyId, propertyName }: ContactFormProps) {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">{tContact('formName')}</label>
        <input
          id="contact-name"
          {...register('name')}
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
          className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:outline-none"
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{t('invalidEmail')}</p>}
      </div>

      {!showPhone ? (
        <button type="button" onClick={() => setShowPhone(true)} className="text-sm text-[#0F766E] hover:underline">
          + {tContact('formPhone') || 'Phone'}
        </button>
      ) : (
        <div>
          <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">{tContact('formPhone') || 'Phone'}</label>
          <input
            id="contact-phone"
            type="tel"
            {...register('phone')}
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:outline-none"
          />
        </div>
      )}

      <div>
        <label htmlFor="contact-investmentType" className="block text-sm font-medium text-gray-700 mb-1">
          {tContact('formInvestmentType') || 'Tipo de inversión'}
        </label>
        <select
          id="contact-investmentType"
          {...register('investmentType')}
          className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm text-gray-700 focus:border-propyte-brand focus:outline-none bg-white"
        >
          <option value="">—</option>
          <option value="residencial">Residencial</option>
          <option value="vacacional">Vacacional</option>
          <option value="plusvalia">{tContact('formPlusvalia') || 'Plusvalía'}</option>
          <option value="mixto">Mixto</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full h-12 bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        {status === 'sending' ? t('sending') : status === 'sent' ? t('sent') : t('send')}
      </button>

      {status === 'error' && <p className="text-sm text-red-500 text-center">{t('error')}</p>}
    </form>
  );
}
