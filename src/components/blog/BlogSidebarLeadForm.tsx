'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileDown, CheckCircle } from '@/lib/icons';
import { submitLead } from '@/lib/leads/submit-lead';

/**
 * BlogSidebarLeadForm
 * --------------------------------------------------------------
 * Form compacto para el sidebar del blog en categorías de inversión
 * (Para Inversionistas, Inversión, Mercado, Guías, etc.).
 * Reusa el endpoint /api/leads con source='lead_magnet' (mismo que el
 * LeadMagnet del home — los leads quedan unificados en Zoho).
 */
export default function BlogSidebarLeadForm() {
  const t = useTranslations('blogSidebar');
  const tlm = useTranslations('leadMagnet');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStatus('sending');
    const result = await submitLead('lead_magnet', { name, email, website });
    setStatus(result.ok ? 'success' : 'error');
  }

  return (
    <aside className="bg-[#0B1C1E] rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#A2F9FF]/15 text-[#A2F9FF] border border-[#A2F9FF]/30 rounded-full text-[11px] font-bold mb-3">
        <FileDown size={12} />
        {t('investorEyebrow')}
      </div>
      <h3 className="text-lg font-bold text-white leading-snug mb-2">{t('investorTitle')}</h3>
      <p className="text-white/75 text-sm mb-5">{t('investorSubtitle')}</p>

      {status === 'success' ? (
        <div className="text-center py-4">
          <CheckCircle size={36} className="mx-auto text-[#22C55E] mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">{tlm('checkEmail')}</h4>
          <p className="text-white/75 text-xs">{tlm('checkEmailDesc')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
          />
          <div>
            <label className="block text-[11px] font-medium text-white/75 mb-1">{tlm('name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-10 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/60 focus:border-[#A2F9FF] focus:outline-none"
              placeholder={tlm('namePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/75 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-10 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/60 focus:border-[#A2F9FF] focus:outline-none"
              placeholder={tlm('emailPlaceholder')}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full h-11 bg-[#A2F9FF] hover:bg-[#81EAF1] text-[#0B1C1E] font-bold text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FileDown size={16} />
            {status === 'sending' ? tlm('sending') : t('investorCta')}
          </button>
          {status === 'error' && (
            <p className="text-[11px] text-red-300 text-center">{t('errorRetry')}</p>
          )}
          <p className="text-[10px] text-white/65 text-center leading-relaxed">{tlm('consent')}</p>
        </form>
      )}
    </aside>
  );
}
