'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { submitForm } from '@/lib/submitForm';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export default function ContactPageContent() {
  const locale = useLocale();
  const t = useTranslations('contact');
  const tCommon = useTranslations('common');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

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

  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '521XXXXXXXXXX';
  const whatsappUrl = `https://wa.me/${phone}`;

  const subjectOptions = [
    { value: 'general', label: t('subjectOptions.general') },
    { value: 'property', label: t('subjectOptions.property') },
    { value: 'investment', label: t('subjectOptions.investment') },
    { value: 'developer', label: t('subjectOptions.developer') },
    { value: 'career', label: t('subjectOptions.career') },
  ];

  return (
    <div className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-3">{t('title')}</h1>
          <p className="text-gray-600 text-lg">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t('formName')}</label>
              <input
                id="name"
                {...register('name')}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:outline-none"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{tCommon('required')}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('formEmail')}</label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:outline-none"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{tCommon('invalidEmail')}</p>}
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">{t('formSubject')}</label>
              <select
                id="subject"
                {...register('subject')}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#5CE0D2] focus:outline-none"
              >
                <option value="">—</option>
                {subjectOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.subject && <p className="text-xs text-red-500 mt-1">{tCommon('required')}</p>}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">{t('formMessage')}</label>
              <textarea
                id="message"
                {...register('message')}
                rows={5}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#5CE0D2] focus:outline-none resize-none"
              />
              {errors.message && <p className="text-xs text-red-500 mt-1">{tCommon('required')}</p>}
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

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-[#1A2F3F] mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-[#2C2C2C]">Dirección</p>
                <p className="text-sm text-gray-600">{t('info.address')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone size={20} className="text-[#1A2F3F] mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-[#2C2C2C]">Teléfono</p>
                <p className="text-sm text-gray-600">{t('info.phone')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail size={20} className="text-[#1A2F3F] mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-[#2C2C2C]">Email</p>
                <p className="text-sm text-gray-600">{t('info.email')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock size={20} className="text-[#1A2F3F] mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-[#2C2C2C]">Horario</p>
                <p className="text-sm text-gray-600">{t('info.hours')}</p>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] hover:bg-[#1EBE57] text-white font-semibold rounded-lg transition-colors"
            >
              <MessageCircle size={20} />
              {t('whatsappCta')}
            </a>

            {/* Map placeholder */}
            <div className="bg-[#F4F6F8] rounded-xl h-48 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MapPin size={32} className="mx-auto mb-2" />
                <p className="text-sm">Playa del Carmen, Q. Roo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
