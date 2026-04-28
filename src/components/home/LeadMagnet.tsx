'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileDown, CheckCircle } from 'lucide-react';
import { submitForm } from '@/lib/submitForm';

export default function LeadMagnet() {
  const t = useTranslations('leadMagnet');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStatus('sending');
    const result = await submitForm({ name, email }, 'lead_magnet');
    setStatus(result.success ? 'success' : 'error');
  }

  return (
    <section className="bg-[#1A2F3F] py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#5CE0D2]/20 text-[#5CE0D2] rounded-full text-xs font-bold mb-4">
              <FileDown size={14} />
              {t('freeReport')}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{t('title')}</h2>
            <p className="text-white/60 leading-relaxed">{t('description')}</p>
          </div>

          {/* Right: Form */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {status === 'success' ? (
              <div className="text-center py-6">
                <CheckCircle size={48} className="mx-auto text-[#22C55E] mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{t('checkEmail')}</h3>
                <p className="text-white/60 text-sm">{t('checkEmailDesc')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">{t('name')}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full h-11 px-4 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:border-[#5CE0D2] focus:outline-none"
                    placeholder={t('namePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-11 px-4 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:border-[#5CE0D2] focus:outline-none"
                    placeholder={t('emailPlaceholder')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full h-12 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FileDown size={18} />
                  {status === 'sending' ? t('sending') : t('downloadCta')}
                </button>
                <p className="text-[10px] text-white/30 text-center">{t('consent')}</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
