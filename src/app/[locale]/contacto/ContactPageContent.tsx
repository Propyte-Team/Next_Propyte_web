'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { MapPin, Phone, Mail, Clock, MessageCircle, Send, CheckCircle2, Users, Calendar, ShieldCheck } from '@/lib/icons';
import { submitForm } from '@/lib/submitForm';
import { toast } from 'sonner';
import type { HubSiteConfig } from '@/lib/hub-content';
import SiteMediaView from '@/components/shared/SiteMediaView';
import type { SiteMediaMap } from '@/lib/hub-content';

function pickString(config: HubSiteConfig | undefined, key: string, fallback: string): string {
  const v = config?.[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}

export default function ContactPageContent({ siteConfig, siteMedia }: { siteConfig?: HubSiteConfig; siteMedia?: SiteMediaMap }) {
  const locale = useLocale();
  const t = useTranslations('contact');
  const tCommon = useTranslations('common');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const schema = z.object({
    name: z.string().min(2, tCommon('required')),
    email: z.string().email(tCommon('invalidEmail')),
    subject: z.string().min(1, tCommon('required')),
    message: z.string().min(10, tCommon('required')),
    // Honeypot — humans don't see/fill this; bots do. Allow any value to
    // pass schema so onSubmit can drop silently with fake-success UX.
    website: z.string().optional(),
  });

  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Preselect subject from ?asunto= param. Maps external slugs (used by other
  // pages: /financiamiento ?asunto=financiamiento-m1, /promociones ?asunto=
  // promos, blog/equipo CTAs, etc.) to the 5 internal subjectOptions values.
  const searchParams = useSearchParams();
  useEffect(() => {
    const asunto = searchParams.get('asunto') ?? '';
    if (!asunto) return;
    const direct: Record<string, string> = {
      general: 'general',
      property: 'property',
      investment: 'investment',
      developer: 'developer',
      career: 'career',
      precalificacion: 'investment',
      promos: 'property',
      equipo: 'career',
      blog: 'general',
    };
    const target = asunto.startsWith('financiamiento-')
      ? 'investment'
      : asunto.startsWith('lanzamientos-')
        ? 'property'
        : direct[asunto];
    if (target) setValue('subject', target);
  }, [searchParams, setValue]);

  async function onSubmit(data: FormData) {
    // Honeypot: silently drop bot submissions.
    if (data.website && data.website.length > 0) {
      setStatus('sent');
      reset();
      return;
    }
    setStatus('sending');
    const result = await submitForm(data, 'contact');
    if (result.success) {
      setStatus('sent');
      reset();
      toast.success(t('formSuccessToast'));
    } else {
      setStatus('error');
      toast.error(t('formErrorToast'));
    }
  }

  // Site config con fallback a i18n (red de seguridad)
  const configPhoneRaw = pickString(siteConfig, 'whatsapp.number', '');
  const phone =
    (configPhoneRaw ? normalizePhone(configPhoneRaw) : '') ||
    '529844638032';
  const address = pickString(
    siteConfig,
    locale === 'en' ? 'contact.address_en' : 'contact.address_es',
    t('info.address'),
  );
  const phoneDisplay = pickString(siteConfig, 'whatsapp.number', t('info.phone'));
  const email = pickString(siteConfig, 'contact.email', t('info.email'));
  const hours = pickString(
    siteConfig,
    locale === 'en' ? 'contact.hours_en' : 'contact.hours_es',
    t('info.hours'),
  );

  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || '';
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(t('whatsappMessage'))}`;
  const telHref = `tel:${phoneDisplay.replace(/[^+\d]/g, '')}`;
  const mailHref = `mailto:${email}`;

  const subjectOptions = [
    { value: 'general', label: t('subjectOptions.general') },
    { value: 'property', label: t('subjectOptions.property') },
    { value: 'investment', label: t('subjectOptions.investment') },
    { value: 'developer', label: t('subjectOptions.developer') },
    { value: 'career', label: t('subjectOptions.career') },
  ];

  const mapQuery = encodeURIComponent(address);
  const mapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] text-white py-20 md:py-24 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-propyte-brand/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-propyte-brand/10 rounded-full blur-3xl" />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-propyte-brand/15 border border-propyte-brand/30 rounded-full mb-6">
            <Send size={14} className="text-propyte-brand" />
            <span className="text-propyte-brand text-sm font-semibold tracking-wide uppercase">
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
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="lg:col-span-3 bg-white"
              toolname="enviar_mensaje_contacto"
              tooldescription="Envía un mensaje de contacto general a Propyte."
            >
              <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-2">
                {t('formHeading')}
              </h2>
              <p className="text-gray-600 mb-6">{t('formIntro')}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#2C2C2C] mb-2">
                    {t('formName')}
                  </label>
                  <input
                    id="name"
                    {...register('name')}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    aria-required={true}
                    toolparamdescription="Nombre completo de la persona que contacta."
                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:ring-2 focus:ring-propyte-brand/20 focus:outline-none transition-colors"
                  />
                  {errors.name && <p id="name-error" role="alert" className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#2C2C2C] mb-2">
                    {t('formEmail')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    aria-required={true}
                    toolparamdescription="Correo electrónico de contacto."
                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:ring-2 focus:ring-propyte-brand/20 focus:outline-none transition-colors"
                  />
                  {errors.email && <p id="email-error" role="alert" className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="subject" className="block text-sm font-medium text-[#2C2C2C] mb-2">
                    {t('formSubject')}
                  </label>
                  <select
                    id="subject"
                    {...register('subject')}
                    defaultValue=""
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? 'subject-error' : undefined}
                    aria-required={true}
                    toolparamdescription="Asunto del mensaje: general, propiedad, inversión, desarrollador o carrera."
                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:ring-2 focus:ring-propyte-brand/20 focus:outline-none transition-colors"
                  >
                    <option value="" disabled>{t('formSubjectPlaceholder')}</option>
                    {subjectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.subject && <p id="subject-error" role="alert" className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="message" className="block text-sm font-medium text-[#2C2C2C] mb-2">
                    {t('formMessage')}
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    {...register('message')}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    aria-required={true}
                    toolparamdescription="Mensaje o consulta detallada de la persona."
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-propyte-brand focus:ring-2 focus:ring-propyte-brand/20 focus:outline-none resize-none transition-colors"
                  />
                  {errors.message && <p id="message-error" role="alert" className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
                </div>

                {/* Honeypot anti-spam: hidden from humans, visible to bots. */}
                <div aria-hidden="true" className="hidden">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    {...register('website')}
                  />
                </div>
              </div>

              {status === 'sent' ? (
                <div className="mt-6 flex items-center gap-3 bg-propyte-cyan-100 border border-propyte-brand/30 text-[#0E7490] rounded-lg px-4 py-3">
                  <CheckCircle2 size={20} />
                  <span className="text-sm font-medium">{tCommon('sent')}</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-8 bg-propyte-brand hover:bg-propyte-cyan-200 disabled:opacity-60 disabled:cursor-not-allowed text-[#0F1923] font-bold rounded-lg transition-colors"
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

              {/* Social proof — coverage, certified team, response SLA */}
              <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-lg bg-propyte-cyan-100 flex items-center justify-center mb-2">
                    <MapPin size={18} className="text-[#0E7490]" />
                  </div>
                  <p className="text-xs font-bold text-[#1A2F3F] leading-tight">{t('socialProof.coverageTitle')}</p>
                  <p className="text-2xs text-gray-600 mt-0.5 leading-tight">{t('socialProof.coverageDesc')}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-lg bg-propyte-cyan-100 flex items-center justify-center mb-2">
                    <Users size={18} className="text-[#0E7490]" />
                  </div>
                  <p className="text-xs font-bold text-[#1A2F3F] leading-tight">{t('socialProof.teamTitle')}</p>
                  <p className="text-2xs text-gray-600 mt-0.5 leading-tight">{t('socialProof.teamDesc')}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-lg bg-propyte-cyan-100 flex items-center justify-center mb-2">
                    <ShieldCheck size={18} className="text-[#0E7490]" />
                  </div>
                  <p className="text-xs font-bold text-[#1A2F3F] leading-tight">{t('socialProof.slaTitle')}</p>
                  <p className="text-2xs text-gray-600 mt-0.5 leading-tight">{t('socialProof.slaDesc')}</p>
                </div>
              </div>
            </form>

            {/* Info + map — 2 cols */}
            <aside className="lg:col-span-2 space-y-5" aria-label={t('labels.contactInfo')}>
              <h2 className="text-lg font-bold text-[#1A2F3F]">{t('labels.contactInfo')}</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-[#F4F6F8] rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-propyte-cyan-100 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-[#0E7490]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A2F3F] text-sm">{t('labels.address')}</p>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{address}</p>
                  </div>
                </div>

                <a
                  href={telHref}
                  className="flex items-start gap-3 p-4 bg-[#F4F6F8] hover:bg-propyte-cyan-100 rounded-xl transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-propyte-cyan-100 flex items-center justify-center shrink-0 group-hover:bg-propyte-brand/25 transition-colors">
                    <Phone size={18} className="text-[#0E7490]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A2F3F] text-sm">{t('labels.phone')}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{phoneDisplay}</p>
                  </div>
                </a>

                <a
                  href={mailHref}
                  className="flex items-start gap-3 p-4 bg-[#F4F6F8] hover:bg-propyte-cyan-100 rounded-xl transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-propyte-cyan-100 flex items-center justify-center shrink-0 group-hover:bg-propyte-brand/25 transition-colors">
                    <Mail size={18} className="text-[#0E7490]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A2F3F] text-sm">{t('labels.email')}</p>
                    <p className="text-sm text-gray-600 mt-0.5 break-words">{email}</p>
                  </div>
                </a>

                <div className="flex items-start gap-3 p-4 bg-[#F4F6F8] rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-propyte-cyan-100 flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-[#0E7490]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A2F3F] text-sm">{t('labels.hours')}</p>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{hours}</p>
                  </div>
                </div>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-12 propyte-cta-whatsapp font-bold rounded-lg transition-colors"
              >
                <MessageCircle size={20} />
                {t('whatsappCta')}
              </a>
              <p className="text-center text-xs text-gray-600 -mt-2">
                {t('whatsappResponseTime')}
              </p>

              {/* Calendly: agendar videollamada 30 min */}
              {calendlyUrl ? (
                <a
                  href={calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-12 bg-[#1A2F3F] hover:bg-[#0F1923] text-white font-semibold rounded-lg transition-colors"
                >
                  <Calendar size={18} />
                  {t('calendlyCta')}
                </a>
              ) : null}

              {/* Foto oficina — Hub › Materiales (contacto.oficina); fallback a placeholder */}
              <SiteMediaView entry={siteMedia?.['contacto.oficina']} locale={locale} icon={MapPin} label="Foto: oficina Propyte" className="aspect-[16/9]" sizes="(max-width: 1024px) 100vw, 480px" />

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
