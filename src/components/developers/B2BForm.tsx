'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { submitForm } from '@/lib/submitForm';

const schema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  location: z.string().min(1),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function B2BForm() {
  const t = useTranslations('developers');
  const tCommon = useTranslations('common');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setStatus('sending');
    const result = await submitForm(data, 'b2b_request');
    if (result.success) {
      setStatus('sent');
      reset();
    } else {
      setStatus('error');
    }
  }

  const fields = [
    { name: 'name' as const, label: t('formName'), type: 'text' },
    { name: 'company' as const, label: t('formCompany'), type: 'text' },
    { name: 'email' as const, label: t('formEmail'), type: 'email' },
    { name: 'phone' as const, label: t('formPhone'), type: 'tel' },
    { name: 'location' as const, label: t('formLocation'), type: 'text' },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[640px] mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-center text-[#2C2C2C] mb-8">{t('formTitle')}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map(field => (
            <div key={field.name}>
              <label htmlFor={`b2b-${field.name}`} className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                id={`b2b-${field.name}`}
                type={field.type}
                {...register(field.name)}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:outline-none"
              />
              {errors[field.name] && (
                <p className="text-xs text-red-500 mt-1">{tCommon('required')}</p>
              )}
            </div>
          ))}

          <div>
            <label htmlFor="b2b-message" className="block text-sm font-medium text-gray-700 mb-1">{t('formMessage')}</label>
            <textarea
              id="b2b-message"
              {...register('message')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full h-12 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {status === 'sending' ? tCommon('sending') : status === 'sent' ? tCommon('sent') : t('formSubmit')}
          </button>

          {status === 'error' && <p className="text-sm text-red-500 text-center">{tCommon('error')}</p>}
        </form>
      </div>
    </section>
  );
}
