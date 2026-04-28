'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { MapPin, Phone, Mail, Clock, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { submitForm } from '@/lib/submitForm';

export default function ContactPageContent() {
  void useLocale();
  const t = useTranslations('contact');
  const tCommon = useTranslations('common');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const schema = z.object({
    name: z.string().min(2, tCommon('required')),
    email: z.string().email(tCommon('invalidEmail')),
    subject: z.string().min(1, tCommon('required')),
    message: z.string().min(10, tCommon('required')),
  });

  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setStatus('sending');
    const result = await submitForm(data, 'contact');
    if (result.success) {
      setStatus('sent');
      reset();
    } else {
      setStatus('error');
    }
  }

  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '5219840000000';
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(t('whatsappMessage'))}`;
  const telHref = `tel:${t('info.phone').replace(/[^+\d]/g, '')}`;
  const mailHref = `mailto:${t('info.email')}`;

  const subjectOptions = [
    { value: 'general', label: t('subjectOptions.general') },
    { value: 'property', label: t('subjectOptions.property') },
    { value: 'investment', label: t('subjectOptions.investment') },
    { value: 'developer', label: t('subjectOptions.developer') },
    { value: 'career', label: t('subjectOptions.career') },
  ];

  const mapQuery = encodeURIComponent(t('info.address'));
  const mapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] text-white py-20 md:py-24 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#5CE0D2]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#5CE0D2]/5 rounded-full blur-3xl" />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#5CE0D2]/15 rounded-full mb-6">
            <Send size={14} strokeWidth={2} className="text-[#5CE0D2]" />
            <span className="text-[#5CE0D2] text-sm font-semibold tracking-wide uppercase">
              {t('heroEyebrow')}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Contact body */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12">
            {/* Form — 3 cols */}
            <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-3 bg-white">
              <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-2">
                {t('formHeading')}
              </h2>
              <p className="text-gray-500 mb-6">{t('formIntro')}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#2C2C2C] mb-2">
                    {t('formName')}
                  </label>
                  <input
                    id="name"
                    {...register('name')}
                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:ring-2 focus:ring-[#5CE0D2]/20 focus:outline-none transition-colors"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#2C2C2C] mb-2">
                    {t('formEmail')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:ring-2 focus:ring-[#5CE0D2]/20 focus:outline-none transition-colors"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="subject" className="block text-sm font-medium text-[#2C2C2C] mb-2">
                    {t('formSubject')}
                  </label>
                  <select
                    id="subject"
                    {...register('subject')}
                    defaultValue=""
                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:ring-2 focus:ring-[#5CE0D2]/20 focus:outline-none transition-colors"
                  >
                    <option value="" disabled>{t('formSubjectPlaceholder')}</option>
                    {subjectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="message" className="block text-sm font-medium text-[#2C2C2C] mb-2">
                    {t('formMessage')}
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    {...register('message')}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:ring-2 focus:ring-[#5CE0D2]/20 focus:outline-none resize-none transition-colors"
                  />
                  {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
                </div>
              </div>

              {status === 'sent' ? (
                <div className="mt-6 flex items-center gap-3 bg-[#5CE0D2]/10 border border-[#5CE0D2]/30 text-[#0D9488] rounded-lg px-4 py-3">
                  <CheckCircle2 size={20} strokeWidth={2} />
                  <span className="text-sm font-medium">{tCommon('sent')}</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-8 bg-[#5CE0D2] hover:bg-[#4BCEC0] disabled:opacity-60 disabled:cursor-not-allowed text-[#0F1923] font-bold rounded-lg transition-colors"
                >
                  {status === 'sending' ? (
                    tCommon('sending')
                  ) : (
                    <>
                      <Send size={16} strokeWidth={2.5} />
                      {t('formSubmit')}
                    </>
                  )}
                </button>
              )}

              {status === 'error' && (
                <p className="mt-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {tCommon('error')}
                </p>
              )}
            </form>

            {/* Info + map — 2 cols */}
            <aside className="lg:col-span-2 space-y-5" aria-label={t('labels.contactInfo')}>
              <h2 className="text-lg font-bold text-[#1A2F3F]">{t('labels.contactInfo')}</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-[#F4F6F8] rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-[#5CE0D2]/15 flex items-center justify-center shrink-0">
                    <MapPin size={18} strokeWidth={2} className="text-[#0D9488]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A2F3F] text-sm">{t('labels.address')}</p>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{t('info.address')}</p>
                  </div>
                </div>

                <a
                  href={telHref}
                  className="flex items-start gap-3 p-4 bg-[#F4F6F8] hover:bg-[#5CE0D2]/10 rounded-xl transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#5CE0D2]/15 flex items-center justify-center shrink-0 group-hover:bg-[#5CE0D2]/25 transition-colors">
                    <Phone size={18} strokeWidth={2} className="text-[#0D9488]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A2F3F] text-sm">{t('labels.phone')}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{t('info.phone')}</p>
                  </div>
                </a>

                <a
                  href={mailHref}
                  className="flex items-start gap-3 p-4 bg-[#F4F6F8] hover:bg-[#5CE0D2]/10 rounded-xl transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#5CE0D2]/15 flex items-center justify-center shrink-0 group-hover:bg-[#5CE0D2]/25 transition-colors">
                    <Mail size={18} strokeWidth={2} className="text-[#0D9488]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A2F3F] text-sm">{t('labels.email')}</p>
                    <p className="text-sm text-gray-600 mt-0.5 break-words">{t('info.email')}</p>
                  </div>
                </a>

                <div className="flex items-start gap-3 p-4 bg-[#F4F6F8] rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-[#5CE0D2]/15 flex items-center justify-center shrink-0">
                    <Clock size={18} strokeWidth={2} className="text-[#0D9488]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A2F3F] text-sm">{t('labels.hours')}</p>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{t('info.hours')}</p>
                  </div>
                </div>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold rounded-lg transition-colors"
              >
                <MessageCircle size={20} strokeWidth={2} />
                {t('whatsappCta')}
              </a>

              {/* Google Maps embed */}
              <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <iframe
                  title={t('labels.mapTitle')}
                  src={mapEmbedUrl}
                  width="100%"
                  height="280"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
