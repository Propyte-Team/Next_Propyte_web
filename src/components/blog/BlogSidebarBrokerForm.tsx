'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircle, Send } from '@/lib/icons';
import { submitLead } from '@/lib/leads/submit-lead';

/**
 * BlogSidebarBrokerForm
 * --------------------------------------------------------------
 * Form compacto para el sidebar del blog en la categoría "Para Asesores".
 * Reusa el endpoint /api/leads con source='affiliate_request' — mismo
 * que el form completo de /unete (reclutamiento de asesores).
 */
const CITY_OPTIONS: Array<{ value: string; key: 'city2' | 'city3' | 'city4' | 'city5' | 'city6' | 'city7' | 'city8' | 'formCityOther' }> = [
  { value: 'playa', key: 'city2' },
  { value: 'tulum', key: 'city3' },
  { value: 'cancun', key: 'city4' },
  { value: 'merida', key: 'city5' },
  { value: 'cdmx', key: 'city6' },
  { value: 'vallarta', key: 'city7' },
  { value: 'cabos', key: 'city8' },
  { value: 'otra', key: 'formCityOther' },
];

export default function BlogSidebarBrokerForm({ registerTool = true }: { registerTool?: boolean }) {
  const t = useTranslations('blogSidebar');
  const tu = useTranslations('unete');
  const locale = useLocale();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !whatsapp.trim() || !city) return;
    setStatus('sending');
    const result = await submitLead('affiliate_request', {
      name,
      email,
      whatsapp,
      city,
      website,
      locale,
    });
    setStatus(result.ok ? 'success' : 'error');
  }

  // WebMCP: solo la instancia con registerTool=true emite el toolname. El
  // artículo renderiza este form 2 veces (móvil + desktop); dos <form> con el
  // mismo toolname tumban el renderer de Chrome (RESULT_CODE_KILLED_BAD_MESSAGE).
  const agentToolAttrs = registerTool
    ? {
        toolname: 'registrar_broker_blog',
        tooldescription: 'Registra a un asesor inmobiliario desde el blog de Propyte.',
      }
    : {};

  return (
    <aside className="bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-propyte-brand/15 text-propyte-brand border border-propyte-brand/30 rounded-full text-[11px] font-bold mb-3">
        {t('brokerEyebrow')}
      </div>
      <h3 className="text-lg font-bold text-white leading-snug mb-2">{t('brokerTitle')}</h3>
      <p className="text-white/75 text-sm mb-5">{t('brokerSubtitle')}</p>

      {status === 'success' ? (
        <div className="text-center py-4">
          <CheckCircle size={36} className="mx-auto text-[#22C55E] mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">{tu('formSubmittedTitle')}</h4>
          <p className="text-white/75 text-xs">{tu('formSubmittedDesc')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3" {...agentToolAttrs}>
          {/* Honeypot sin `name`: se captura por estado, invisible para WebMCP. */}
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
            <label className="block text-[11px] font-medium text-white/75 mb-1">{tu('formNameLabel')}</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-11 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/60 focus:border-propyte-brand focus:outline-none"
              placeholder={tu('formNamePlaceholder')}
              toolparamdescription="Nombre completo del asesor inmobiliario."
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/75 mb-1">{tu('formEmailLabel')}</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/60 focus:border-propyte-brand focus:outline-none"
              placeholder={tu('formEmailPlaceholder')}
              toolparamdescription="Correo electrónico del asesor inmobiliario."
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/75 mb-1">{tu('formWhatsappLabel')}</label>
            <input
              type="tel"
              name="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
              className="w-full h-11 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/60 focus:border-propyte-brand focus:outline-none"
              placeholder={tu('formWhatsappPlaceholder')}
              toolparamdescription="Número de WhatsApp del asesor inmobiliario."
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/75 mb-1">{tu('formCityLabel')}</label>
            <select
              name="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full h-11 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:border-propyte-brand focus:outline-none"
              toolparamdescription="Ciudad donde opera el asesor inmobiliario."
            >
              <option value="" className="text-slate-900">{tu('formCityPlaceholder')}</option>
              {CITY_OPTIONS.map(({ value, key }) => (
                <option key={value} value={value} className="text-slate-900">{tu(key)}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full h-11 bg-propyte-brand hover:bg-[#81EAF1] text-[#0F1923] font-bold text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {status === 'sending' ? tu('formSubmit') + '…' : t('brokerCta')}
          </button>
          {status === 'error' && (
            <p className="text-[11px] text-red-300 text-center">{t('errorRetry')}</p>
          )}
        </form>
      )}
    </aside>
  );
}
