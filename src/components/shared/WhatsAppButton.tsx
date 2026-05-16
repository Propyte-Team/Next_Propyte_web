'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useCompare } from '@/hooks/useCompare';
import { trackWhatsAppClick } from '@/lib/analytics/track';
import type { HubSiteConfig } from '@/lib/hub-content';

interface WhatsAppButtonProps {
  propertyName?: string;
  propertyId?: string;
  phone?: string; // Override global phone (per-agent/per-project)
  siteConfig?: HubSiteConfig;
}

function pickString(config: HubSiteConfig | undefined, key: string, fallback: string): string {
  const v = config?.[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

function normalizePhone(raw: string): string {
  // Hub guarda formato "+52 984 145 0000"; wa.me requiere dígitos puros.
  return raw.replace(/[^\d]/g, '');
}

export default function WhatsAppButton({ propertyName, propertyId, phone: propPhone, siteConfig }: WhatsAppButtonProps) {
  const locale = useLocale();
  const [visible, setVisible] = useState(false);
  const configPhoneRaw = pickString(siteConfig, 'whatsapp.number', '');
  const phone =
    propPhone ||
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE ||
    (configPhoneRaw ? normalizePhone(configPhoneRaw) : '') ||
    '529843235354';
  const { count: compareCount } = useCompare();
  // ComparePanel sticky bar is ~64px tall when visible. Push WA up to clear it.
  const compareOffset = compareCount > 0 ? '5rem' : '1.25rem';

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Si hay propertyName/Id, mantener el preset contextual (más útil que el genérico del Hub).
  // Si no, usar el preset configurable del Hub con fallback al texto histórico.
  const presetEs = pickString(
    siteConfig,
    'whatsapp.preset_es',
    'Hola, me interesa sus propiedades. Vi su sitio web.',
  );
  const presetEn = pickString(
    siteConfig,
    'whatsapp.preset_en',
    "Hi, I'm interested in your properties. I saw your website.",
  );
  const messages: Record<string, string> = propertyName || propertyId
    ? {
        es: `Hola, me interesa ${propertyName || 'sus propiedades'}${propertyId ? ` (Ref: ${propertyId})` : ''}. Vi su sitio web.`,
        en: `Hi, I'm interested in ${propertyName || 'your properties'}${propertyId ? ` (Ref: ${propertyId})` : ''}. I saw your website.`,
      }
    : { es: presetEs, en: presetEn };

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(messages[locale] || messages.es)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsAppClick({ surface: propertyId ? 'detail-floating' : 'floating', propertyId })}
      style={{
        bottom: `max(1.5rem, calc(env(safe-area-inset-bottom) + ${compareOffset}))`,
      }}
      className={`propyte-cta-whatsapp fixed right-6 z-50 w-[60px] h-[60px] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-[bottom,opacity,transform] duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      aria-label={locale === 'en' ? 'Contact via WhatsApp' : 'Contactar por WhatsApp'}
    >
      <MessageCircle size={28} />
    </a>
  );
}
