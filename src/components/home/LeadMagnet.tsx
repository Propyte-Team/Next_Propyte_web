'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { FileDown, CheckCircle } from 'lucide-react';
import { submitForm } from '@/lib/submitForm';

export default function LeadMagnet() {
  const locale = useLocale();
  const isEn = locale === 'en';
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
              {isEn ? 'FREE REPORT' : 'REPORTE GRATUITO'}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {isEn
                ? 'Top 10 Developments with Highest ROI 2026'
                : 'Top 10 Desarrollos con Mayor ROI 2026'}
            </h2>
            <p className="text-white/60 leading-relaxed">
              {isEn
                ? 'Get our exclusive analysis of the highest-performing real estate investments in Mexico\'s Riviera Maya. Based on real AirDNA data, rental comparables, and market projections.'
                : 'Obtén nuestro análisis exclusivo de las inversiones inmobiliarias de mayor rendimiento en la Riviera Maya. Basado en datos reales de AirDNA, comparables de renta y proyecciones de mercado.'}
            </p>
          </div>

          {/* Right: Form */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {status === 'success' ? (
              <div className="text-center py-6">
                <CheckCircle size={48} className="mx-auto text-[#22C55E] mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  {isEn ? 'Check your email!' : '¡Revisa tu correo!'}
                </h3>
                <p className="text-white/60 text-sm">
                  {isEn
                    ? 'We\'ve sent the report to your inbox.'
                    : 'Te hemos enviado el reporte a tu bandeja de entrada.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">
                    {isEn ? 'Name' : 'Nombre'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full h-11 px-4 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:border-[#5CE0D2] focus:outline-none"
                    placeholder={isEn ? 'Your name' : 'Tu nombre'}
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
                    placeholder={isEn ? 'your@email.com' : 'tu@correo.com'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full h-12 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FileDown size={18} />
                  {status === 'sending'
                    ? (isEn ? 'Sending...' : 'Enviando...')
                    : (isEn ? 'Download Free Report' : 'Descargar Reporte Gratis')}
                </button>
                <p className="text-[10px] text-white/30 text-center">
                  {isEn
                    ? 'By downloading, you agree to receive occasional market updates. Unsubscribe anytime.'
                    : 'Al descargar, aceptas recibir actualizaciones de mercado ocasionales. Cancela cuando quieras.'}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
