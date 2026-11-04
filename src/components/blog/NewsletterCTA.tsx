'use client';

import { useState, type FormEvent } from 'react';
import { rescatarDelDom } from '@/lib/leads/rescate-prehidratacion';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { submitForm } from '@/lib/submitForm';

/**
 * Newsletter CTA — closes the blog listing with an email capture.
 * Wires through `submitForm` so the lead lands in the same hub webhook
 * as the rest of the lead funnels (UTMs auto-attached via getCapturedUTMs).
 */
export default function NewsletterCTA() {
  const t = useTranslations('blog');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // EL DOM MANDA SOBRE EL ESTADO DE REACT. Si el navegador autocompletó
    // antes de hidratar, los campos se ven llenos y el estado sigue vacío: el
    // envío se caía sin decir una palabra —ni error, ni petición, ni lead—.
    // Ver `rescatarDelDom`.
    const datos = rescatarDelDom(e.currentTarget, { email, website });
    if (datos.email !== email) setEmail(datos.email);

    // Honeypot — silently drop bots, fake-success UX.
    if (datos.website) {
      setStatus('success');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
      toast.error(t('newsletterInvalidEmail'));
      return;
    }
    setStatus('sending');
    const res = await submitForm({ email: datos.email, source: 'blog-newsletter' }, 'newsletter');
    if (res.success) {
      setStatus('success');
      toast.success(t('newsletterSuccess'));
      setEmail('');
    } else {
      setStatus('idle');
      toast.error(t('newsletterError'));
    }
  }

  return (
    <section className="px-4 lg:px-10 py-[72px] lg:py-28 bg-[#0F1923] text-white">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] gap-8 lg:gap-16 items-end">
        <div>
          <h2 className="font-display text-[32px] lg:text-[clamp(34px,4vw,56px)] leading-[1.02] font-semibold tracking-[-0.035em] max-w-[16ch]">{t('newsletterTitle')}</h2>
          <p className="mt-4 text-[16px] lg:text-[17px] text-white/70 max-w-[46ch]">{t('newsletterDesc')}</p>
        </div>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col sm:flex-row gap-3 w-full"
          toolname="suscribir_newsletter"
          tooldescription="Suscribe un correo al newsletter de Propyte."
        >
          <label htmlFor="newsletter-email" className="sr-only">
            {t('newsletterPlaceholder')}
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('newsletterPlaceholder')}
            className="w-full sm:flex-1 h-12 px-0 bg-transparent border-0 border-b border-white/30 rounded-none text-[16px] text-white placeholder:text-white/45 focus:outline-none focus:border-white"
            aria-label={t('newsletterPlaceholder')}
            toolparamdescription="Correo electrónico a suscribir."
          />
          {/* Honeypot anti-spam */}
          <div aria-hidden="true" className="hidden">
            <label htmlFor="newsletter-website">Website</label>
            <input
              id="newsletter-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={status !== 'idle'}
            className="h-12 px-7 bg-propyte-brand hover:bg-white text-[#0F1923] font-semibold rounded-md text-[15px] transition-colors shrink-0 disabled:opacity-60"
          >
            {status === 'sending' ? '…' : t('newsletterCta')}
          </button>
        </form>
      </div>
    </section>
  );
}
