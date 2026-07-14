'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Mail } from '@/lib/icons';
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Honeypot — silently drop bots, fake-success UX.
    if (website) {
      setStatus('success');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t('newsletterError'));
      return;
    }
    setStatus('sending');
    const res = await submitForm({ email, source: 'blog-newsletter' }, 'newsletter');
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
    <section className="py-14 bg-[#F4F6F8]">
      <div className="max-w-xl mx-auto px-4 md:px-6 text-center">
        <Mail size={32} className="mx-auto text-[#0E7490] mb-4" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-[#1A2F3F] mb-2">{t('newsletterTitle')}</h2>
        <p className="text-gray-600 text-sm mb-6">{t('newsletterDesc')}</p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
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
            className="w-full sm:flex-1 min-h-[44px] px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#5CE0D2] focus:ring-2 focus:ring-[#5CE0D2]/20 bg-white"
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
            className="h-11 px-6 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold rounded-xl text-sm transition-colors shrink-0 disabled:opacity-60"
          >
            {status === 'sending' ? '…' : t('newsletterCta')}
          </button>
        </form>
      </div>
    </section>
  );
}
