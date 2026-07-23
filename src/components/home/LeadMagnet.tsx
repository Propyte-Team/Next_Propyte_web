'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileDown, CheckCircle } from '@/lib/icons';
import { submitLead } from '@/lib/leads/submit-lead';

export interface LeadMagnetCta {
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  buttonLabel: string | null;
}

// `cta` se pasa desde server con copy desde Hub. Si null/undefined, cae a i18n.
export default function LeadMagnet({ cta }: { cta?: LeadMagnetCta | null }) {
  const t = useTranslations('leadMagnet');
  const tCommon = useTranslations('common');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot (REQ-F-02)
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const eyebrow = cta?.eyebrow ?? t('freeReport');
  const titleText = cta?.title ?? t('title');
  const subtitleText = cta?.subtitle ?? t('description');
  const ctaLabel = cta?.buttonLabel ?? t('downloadCta');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStatus('sending');
    const result = await submitLead('lead_magnet', { name, email, website });
    if (result.ok) {
      setDownloadUrl(result.downloadUrl ?? null);
      setStatus('success');
    } else {
      setStatus('error');
    }
  }

  return (
    <section className="bg-[#0B1C1E] py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#A2F9FF]/15 text-[#A2F9FF] border border-[#A2F9FF]/30 rounded-full text-xs font-bold mb-4">
              <FileDown size={14} />
              {eyebrow}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{titleText}</h2>
            <p className="text-white/75 leading-relaxed">{subtitleText}</p>
          </div>

          {/* Right: Form */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {status === 'success' ? (
              <div className="text-center py-6">
                <CheckCircle size={48} className="mx-auto text-[#22C55E] mb-4" />
                {downloadUrl ? (
                  <>
                    <h3 className="text-xl font-bold text-white mb-2">{t('reportReady')}</h3>
                    <p className="text-white/75 text-sm mb-4">{t('reportReadyDesc')}</p>
                    <a
                      href={downloadUrl}
                      className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#A2F9FF] hover:bg-[#81EAF1] text-[#0B1C1E] font-bold rounded-lg transition-colors"
                    >
                      <FileDown size={18} />
                      {t('downloadNow')}
                    </a>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-white mb-2">{t('successGeneric')}</h3>
                    <p className="text-white/75 text-sm">{t('successGenericDesc')}</p>
                  </>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                toolname="descargar_guia_inversion"
                tooldescription="Solicita la guía de inversión de Propyte a cambio de nombre y correo."
              >
                {/* Honeypot — bots lo llenan; el endpoint los detecta (REQ-F-02).
                    Sin `name` a propósito: se captura por estado (no por name), así
                    WebMCP no lo sintetiza como parámetro; la detección no cambia. */}
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="sr-only"
                />

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">{t('name')}</label>
                  <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full h-11 px-4 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/60 focus:border-[#A2F9FF] focus:outline-none"
                    placeholder={t('namePlaceholder')}
                    toolparamdescription="Nombre completo del interesado."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-11 px-4 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/60 focus:border-[#A2F9FF] focus:outline-none"
                    placeholder={t('emailPlaceholder')}
                    toolparamdescription="Correo electrónico del interesado."
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full h-12 bg-[#A2F9FF] hover:bg-[#81EAF1] text-[#0B1C1E] font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FileDown size={18} />
                  {status === 'sending' ? t('sending') : ctaLabel}
                </button>
                {status === 'error' && (
                  <p className="text-sm text-red-400 text-center">{tCommon('error')}</p>
                )}
                <p className="text-2xs text-white/65 text-center">{t('consent')}</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
