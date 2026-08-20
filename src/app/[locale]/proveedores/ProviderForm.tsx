'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Check, Loader2 } from '@/lib/icons';
import { submitLead } from '@/lib/leads/submit-lead';
import PhoneInputField, { isValidPhoneNumber } from '@/components/ui/PhoneInput';

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
  const tCommon = useTranslations('common');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const schema = z.object({
    company: z.string().min(2, t('formRequired')),
    category: z.enum(CATEGORIES, { message: t('formRequired') }),
    city: z.string().min(2, t('formRequired')),
    companyWebsite: z.string().url(t('formInvalidUrl')).optional().or(z.literal('')),
    contactName: z.string().min(2, t('formRequired')),
    email: z.string().email(t('formInvalidEmail')),
    phone: z.string().min(1, t('formRequired')).refine(isValidPhoneNumber, { message: tCommon('invalidPhone') }),
    message: z.string().min(10, t('formRequired')),
    // Honeypot — el endpoint trata `website` populado como bot (REQ-F-02).
    // Mantiene nombre canónico `website` (= los otros 8 forms usan el mismo).
    website: z.string().optional().or(z.literal('')),
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setStatus('submitting');
    // Top-level fields (refactor Z4.1) — el endpoint los mapea a Zoho:
    //   company → Account.Account_Name + Lead.Company
    //   category → CATEGORY_TO_INDUSTRY → Account.Industry
    //   city → Lead.City + Account.Billing_City
    //   companyWebsite → Account.Website
    const result = await submitLead('provider_form', {
      name: values.contactName,
      email: values.email,
      phone: values.phone,
      message: values.message,
      company: values.company,
      category: values.category,
      city: values.city,
      companyWebsite: values.companyWebsite,
      website: values.website, // honeypot al endpoint
      locale,
    });
    if (result.ok) {
      setStatus('success');
      reset();
    } else {
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
    'w-full h-11 px-4 bg-white/5 border border-white/15 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-propyte-brand focus:bg-white/10 focus-within:border-propyte-brand focus-within:bg-white/10 transition-colors';
  const labelBase = 'block text-white/80 text-sm font-medium mb-2';
  const errorBase = 'text-red-400 text-xs mt-1';

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="propyte-card-glass-sm p-6 md:p-8 text-left"
      noValidate
      toolname="registrar_proveedor"
      tooldescription="Registra una empresa como proveedor de servicios inmobiliarios de Propyte."
    >
      {/* Honeypot — invisible para humanos; bots lo llenan y el endpoint los detecta (REQ-F-02). */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
        {...register('website')}
      />

      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{t('formHeading')}</h3>
      <p className="text-white/60 text-sm mb-6">{t('formIntro')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="company" className={labelBase}>{t('formCompany')}</label>
          <input
            id="company"
            type="text"
            placeholder={t('formCompanyPlaceholder')}
            className={inputBase}
            aria-invalid={!!errors.company}
            aria-describedby={errors.company ? 'company-error' : undefined}
            aria-required={true}
            toolparamdescription="Nombre de la empresa proveedora."
            {...register('company')}
          />
          {errors.company && <p id="company-error" role="alert" className={errorBase}>{errors.company.message}</p>}
        </div>

        <div>
          <label htmlFor="category" className={labelBase}>{t('formCategory')}</label>
          <select
            id="category"
            className={`${inputBase} appearance-none`}
            defaultValue=""
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? 'category-error' : undefined}
            aria-required={true}
            toolparamdescription="Categoría de servicio que ofrece el proveedor."
            {...register('category')}
          >
            <option value="" disabled>{t('formCategorySelect')}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-[#1A2F3F] text-white">
                {t(`formCategory${cat}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
          {errors.category && <p id="category-error" role="alert" className={errorBase}>{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="city" className={labelBase}>{t('formCity')}</label>
          <input
            id="city"
            type="text"
            placeholder={t('formCityPlaceholder')}
            className={inputBase}
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? 'city-error' : undefined}
            aria-required={true}
            toolparamdescription="Ciudad donde opera el proveedor."
            {...register('city')}
          />
          {errors.city && <p id="city-error" role="alert" className={errorBase}>{errors.city.message}</p>}
        </div>

        <div>
          <label htmlFor="companyWebsite" className={labelBase}>{t('formWebsite')}</label>
          <input
            id="companyWebsite"
            type="url"
            placeholder={t('formWebsitePlaceholder')}
            className={inputBase}
            aria-invalid={!!errors.companyWebsite}
            aria-describedby={errors.companyWebsite ? 'companyWebsite-error' : undefined}
            toolparamdescription="Sitio web de la empresa proveedora."
            {...register('companyWebsite')}
          />
          {errors.companyWebsite && <p id="companyWebsite-error" role="alert" className={errorBase}>{errors.companyWebsite.message}</p>}
        </div>

        <div>
          <label htmlFor="contactName" className={labelBase}>{t('formContactName')}</label>
          <input
            id="contactName"
            type="text"
            placeholder={t('formContactNamePlaceholder')}
            className={inputBase}
            aria-invalid={!!errors.contactName}
            aria-describedby={errors.contactName ? 'contactName-error' : undefined}
            aria-required={true}
            toolparamdescription="Nombre de la persona de contacto en la empresa."
            {...register('contactName')}
          />
          {errors.contactName && <p id="contactName-error" role="alert" className={errorBase}>{errors.contactName.message}</p>}
        </div>

        <div>
          <label htmlFor="phone" className={labelBase}>{t('formPhone')}</label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInputField
                id="phone"
                name={field.name}
                value={field.value || ''}
                onChange={(value) => field.onChange(value || '')}
                onBlur={() => { field.onBlur(); trigger('phone'); }}
                placeholder={t('formPhonePlaceholder')}
                invalid={!!errors.phone}
                describedBy={errors.phone ? 'phone-error' : undefined}
                required
                className={inputBase}
                toolParamDescription="Teléfono de contacto del proveedor, con selector de lada de país."
              />
            )}
          />
          {errors.phone && <p id="phone-error" aria-live="polite" className={errorBase}>{errors.phone.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="email" className={labelBase}>{t('formEmail')}</label>
          <input
            id="email"
            type="email"
            placeholder={t('formEmailPlaceholder')}
            className={inputBase}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-required={true}
            toolparamdescription="Correo electrónico de contacto del proveedor."
            {...register('email')}
          />
          {errors.email && <p id="email-error" role="alert" className={errorBase}>{errors.email.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="message" className={labelBase}>{t('formMessage')}</label>
          <textarea
            id="message"
            rows={4}
            placeholder={t('formMessagePlaceholder')}
            className={`${inputBase} h-auto py-3 resize-none`}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
            aria-required={true}
            toolparamdescription="Mensaje describiendo los servicios que ofrece el proveedor."
            {...register('message')}
          />
          {errors.message && <p id="message-error" role="alert" className={errorBase}>{errors.message.message}</p>}
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

      <p className="text-white/60 text-xs mt-4 leading-relaxed">{t('formMicro')}</p>
    </form>
  );
}
