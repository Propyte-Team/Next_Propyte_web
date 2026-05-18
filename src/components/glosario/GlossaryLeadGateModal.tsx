'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { X, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trackFileDownload } from '@/lib/analytics/track';
import { submitLead } from '@/lib/leads/submit-lead';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GlossaryLeadGateModal({ open, onClose }: Props) {
  const locale = useLocale();
  const t = useTranslations('glosario');
  const tCommon = useTranslations('common');
  const [submitting, setSubmitting] = useState(false);

  const schema = z.object({
    name: z.string().trim().min(2, tCommon('required')),
    email: z.string().trim().email(tCommon('invalidEmail')),
    consent: z.literal(true, { message: t('gateRequiredConsent') }),
    website: z.string().optional(),
  });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    queueMicrotask(() => closeBtnRef.current?.focus());

    const sel =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const fs = Array.from(root.querySelectorAll<HTMLElement>(sel)).filter(
        (el) => el.offsetParent !== null,
      );
      if (fs.length === 0) return;
      const first = fs[0];
      const last = fs[fs.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!root.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      lastFocusedRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    // submitLead se encarga del honeypot server-side (REQ-F-02) y del trackGenerateLead.
    // El cliente solo decide qué hacer con el resultado UX.
    const result = await submitLead('glossary_pdf', {
      name: data.name,
      email: data.email,
      website: data.website, // honeypot — el endpoint lo evalúa
      locale,
    });
    if (result.ok) {
      trackFileDownload({ fileType: 'glossary_pdf' });
      window.location.assign(`/api/glossary/pdf?locale=${locale}`);
      toast.success(t('gateSuccess'));
      reset();
      onClose();
    } else {
      toast.error(t('gateError'));
    }
    setSubmitting(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="glossary-gate-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8"
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label={t('gateClose')}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-gray-100 text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2]"
        >
          <X size={20} strokeWidth={1.75} />
        </button>

        <div className="mb-6 pr-8">
          <h2
            id="glossary-gate-title"
            className="text-2xl font-bold text-[#1A2F3F] mb-2"
          >
            {t('gateTitle')}
          </h2>
          <p className="text-sm text-gray-600">{t('gateSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="gate-name"
              className="block text-sm font-semibold text-[#1A2F3F] mb-1"
            >
              {t('gateNameLabel')}
            </label>
            <input
              id="gate-name"
              type="text"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              placeholder={t('gateNamePlaceholder')}
              {...register('name')}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#5CE0D2] focus:ring-2 focus:ring-[#5CE0D2]/30 focus:outline-none"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="gate-email"
              className="block text-sm font-semibold text-[#1A2F3F] mb-1"
            >
              {t('gateEmailLabel')}
            </label>
            <input
              id="gate-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              placeholder={t('gateEmailPlaceholder')}
              {...register('email')}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#5CE0D2] focus:ring-2 focus:ring-[#5CE0D2]/30 focus:outline-none"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '-9999px',
              width: 0,
              height: 0,
              overflow: 'hidden',
            }}
          >
            <label htmlFor="gate-website">Website</label>
            <input
              id="gate-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...register('website')}
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              {...register('consent')}
              className="mt-0.5 rounded border-gray-300 text-[#0E7490] focus:ring-[#5CE0D2]"
            />
            <span>{t('gateConsent')}</span>
          </label>
          {errors.consent && (
            <p className="-mt-2 text-xs text-red-600">{errors.consent.message}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 h-12 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Download size={18} strokeWidth={2.25} aria-hidden="true" />
            )}
            {submitting ? t('gateSubmitting') : t('gateSubmit')}
          </button>

          <p className="text-2xs text-center text-gray-600">
            <Link
              href={`/${locale}/privacidad`}
              className="hover:text-gray-600 underline"
            >
              {t('gatePrivacy')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
