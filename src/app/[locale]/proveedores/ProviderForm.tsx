'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Check, Loader2 } from 'lucide-react';

const CATEGORIES = [
  'Notary',
  'Legal',
  'Finance',
  'Architecture',
  'Construction',
  'Moving',
  'Furniture',
  'Insurance',
  'Marketing',
  'Other',
] as const;

type _Category = (typeof CATEGORIES)[number];

export default function ProviderForm({ locale }: { locale: string }) {
  const t = useTranslations('providers');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const schema = z.object({
    company: z.string().min(2, t('formRequired')),
    category: z.enum(CATEGORIES, { message: t('formRequired') }),
    city: z.string().min(2, t('formRequired')),
    website: z.string().url(t('formInvalidUrl')).optional().or(z.literal('')),
    contactName: z.string().min(2, t('formRequired')),
    email: z.string().email(t('formInvalidEmail')),
    phone: z.string().min(8, t('formRequired')),
    message: z.string().min(10, t('formRequired')),
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setStatus('submitting');
    try {
      const payload = {
        name: values.contactName,
        email: values.email,
        phone: values.phone,
        source: 'provider_form',
        locale,
        message: [
          `[Provider Application]`,
          `Company: ${values.company}`,
          `Category: ${values.category}`,
          `City: ${values.city}`,
          `Website: ${values.website || 'N/A'}`,
          ``,
          values.message,
        ].join('\n'),
      };
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('success');
      reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-propyte-brand/30 rounded-2xl p-8 md:p-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-propyte-cyan-100 mb-5">
          <Check size={28} strokeWidth={2.5} className="text-propyte-brand" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">{t('formSuccessTitle')}</h3>
        <p className="text-white/70 leading-relaxed max-w-md mx-auto">{t('formSuccess')}</p>
      </div>
    );
  }

  const inputBase =
    'w-full h-11 px-4 bg-white/5 border border-white/15 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-propyte-brand focus:bg-white/10 transition-colors';
  const labelBase = 'block text-white/80 text-sm font-medium mb-2';
  const errorBase = 'text-red-400 text-xs mt-1';

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 text-left"
      noValidate
    >
      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{t('formHeading')}</h3>
      <p className="text-white/60 text-sm mb-6">{t('formIntro')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="company" className={labelBase}>{t('formCompany')}</label>
          <input id="company" type="text" placeholder={t('formCompanyPlaceholder')} className={inputBase} {...register('company')} />
          {errors.company && <p className={errorBase}>{errors.company.message}</p>}
        </div>

        <div>
          <label htmlFor="category" className={labelBase}>{t('formCategory')}</label>
          <select
            id="category"
            className={`${inputBase} appearance-none`}
            defaultValue=""
            {...register('category')}
          >
            <option value="" disabled>{t('formCategorySelect')}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-[#1A2F3F] text-white">
                {t(`formCategory${cat}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
          {errors.category && <p className={errorBase}>{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="city" className={labelBase}>{t('formCity')}</label>
          <input id="city" type="text" placeholder={t('formCityPlaceholder')} className={inputBase} {...register('city')} />
          {errors.city && <p className={errorBase}>{errors.city.message}</p>}
        </div>

        <div>
          <label htmlFor="website" className={labelBase}>{t('formWebsite')}</label>
          <input id="website" type="url" placeholder={t('formWebsitePlaceholder')} className={inputBase} {...register('website')} />
          {errors.website && <p className={errorBase}>{errors.website.message}</p>}
        </div>

        <div>
          <label htmlFor="contactName" className={labelBase}>{t('formContactName')}</label>
          <input id="contactName" type="text" placeholder={t('formContactNamePlaceholder')} className={inputBase} {...register('contactName')} />
          {errors.contactName && <p className={errorBase}>{errors.contactName.message}</p>}
        </div>

        <div>
          <label htmlFor="phone" className={labelBase}>{t('formPhone')}</label>
          <input id="phone" type="tel" placeholder={t('formPhonePlaceholder')} className={inputBase} {...register('phone')} />
          {errors.phone && <p className={errorBase}>{errors.phone.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="email" className={labelBase}>{t('formEmail')}</label>
          <input id="email" type="email" placeholder={t('formEmailPlaceholder')} className={inputBase} {...register('email')} />
          {errors.email && <p className={errorBase}>{errors.email.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="message" className={labelBase}>{t('formMessage')}</label>
          <textarea
            id="message"
            rows={4}
            placeholder={t('formMessagePlaceholder')}
            className={`${inputBase} h-auto py-3 resize-none`}
            {...register('message')}
          />
          {errors.message && <p className={errorBase}>{errors.message.message}</p>}
        </div>
      </div>

      {status === 'error' && (
        <p className="text-red-400 text-sm mt-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          {t('formError')}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-6 w-full md:w-auto inline-flex items-center justify-center gap-2 h-12 px-8 bg-propyte-brand hover:bg-propyte-cyan-200 disabled:opacity-60 disabled:cursor-not-allowed text-[#0F1923] font-bold rounded-lg transition-colors"
      >
        {status === 'submitting' ? (
          <>
            <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
            {t('formSubmitting')}
          </>
        ) : (
          t('formSubmit')
        )}
      </button>
    </form>
  );
}
