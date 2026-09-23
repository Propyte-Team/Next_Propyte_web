'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileDown, CheckCircle } from '@/lib/icons';
import { submitLead } from '@/lib/leads/submit-lead';
import { rescatarDelDom } from '@/lib/leads/rescate-prehidratacion';
import PhoneInputField, { isValidPhoneNumber } from '@/components/ui/PhoneInput';

/**
 * BlogSidebarLeadForm
 * --------------------------------------------------------------
 * Form compacto para el sidebar del blog en categorías de inversión
 * (Para Inversionistas, Inversión, Mercado, Guías, etc.).
 * Reusa el endpoint /api/leads con source='lead_magnet' (mismo que el
 * LeadMagnet del home — los leads quedan unificados en Zoho).
 */
export default function BlogSidebarLeadForm({ registerTool = true }: { registerTool?: boolean }) {
  const t = useTranslations('blogSidebar');
  const tlm = useTranslations('leadMagnet');
  const tCommon = useTranslations('common');
  // El artículo monta este form 2 veces (móvil + desktop): el id del teléfono
  // tiene que ser único o el <label> de una copia apunta al input de la otra.
  const uid = useId();
  const phoneId = `blog-lead-phone-${uid}`;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // EL DOM MANDA SOBRE EL ESTADO DE REACT. Si el navegador autocompletó
    // antes de hidratar, los campos se ven llenos y el estado sigue vacío: el
    // envío se caía sin decir una palabra —ni error, ni petición, ni lead—.
    // Ver `rescatarDelDom`.
    const datos = rescatarDelDom(
      e.currentTarget,
      { name, email, phone, website },
      { estadoManda: ['phone'] },
    );
    if (datos.name !== name) setName(datos.name);
    if (datos.email !== email) setEmail(datos.email);
    if (datos.phone !== phone) setPhone(datos.phone);

    if (!datos.name || !datos.email) return;
    if (!datos.phone || !isValidPhoneNumber(datos.phone)) {
      setPhoneError(tCommon('invalidPhone'));
      return;
    }
    setPhoneError(null);
    setStatus('sending');
    const result = await submitLead('lead_magnet', datos);
    if (result.ok) setDownloadUrl(result.downloadUrl ?? null);
    setStatus(result.ok ? 'success' : 'error');
  }

  // WebMCP: solo la instancia con registerTool=true emite atributos de tool.
  // El artículo renderiza este form 2 veces (móvil + desktop); si la copia no
  // registradora deja atributos WebMCP (toolname duplicado, o toolparamdescription
  // huérfano sin toolname) Chrome tumba el renderer (RESULT_CODE_KILLED_BAD_MESSAGE).
  // La copia con registerTool=false queda 100% invisible a WebMCP (como los forms
  // sin tool del resto del sitio).
  const agentToolAttrs = registerTool
    ? {
        toolname: 'suscribir_blog',
        tooldescription: 'Suscribe al usuario a los contenidos del blog de Propyte.',
      }
    : {};
  const param = (desc: string) => (registerTool ? { toolparamdescription: desc } : {});

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
          {downloadUrl ? (
            <>
              <h4 className="text-sm font-bold text-white mb-1">{tlm('reportReady')}</h4>
              <a href={downloadUrl} className="text-xs font-bold text-[#A2F9FF] underline">
                {tlm('downloadNow')}
              </a>
            </>
          ) : (
            <>
              <h4 className="text-sm font-bold text-white mb-1">{tlm('successGeneric')}</h4>
              <p className="text-white/75 text-xs">{tlm('successGenericDesc')}</p>
            </>
          )}
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
            <label className="block text-[11px] font-medium text-white/75 mb-1">{tlm('name')}</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-11 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/60 focus:border-[#A2F9FF] focus:outline-none"
              placeholder={tlm('namePlaceholder')}
              {...param('Nombre completo del interesado.')}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/75 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/60 focus:border-[#A2F9FF] focus:outline-none"
              placeholder={tlm('emailPlaceholder')}
              {...param('Correo electrónico del interesado.')}
            />
          </div>
          <div>
            <label htmlFor={phoneId} className="block text-[11px] font-medium text-white/75 mb-1">{tCommon('phone')}</label>
            <PhoneInputField
              id={phoneId}
              name="phone"
              value={phone}
              onChange={(v) => { setPhone(v); if (phoneError) setPhoneError(null); }}
              invalid={!!phoneError}
              describedBy={phoneError ? `${phoneId}-error` : undefined}
              required
              className="w-full h-11 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus-within:border-[#A2F9FF] focus-within:outline-none"
              toolParamDescription={registerTool ? 'Teléfono de contacto, con selector de lada de país.' : undefined}
            />
            {phoneError && <p id={`${phoneId}-error`} aria-live="polite" className="text-[11px] text-red-300 mt-1">{phoneError}</p>}
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
