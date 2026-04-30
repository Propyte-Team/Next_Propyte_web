'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useCompare } from '@/hooks/useCompare';

interface WhatsAppButtonProps {
  propertyName?: string;
  propertyId?: string;
  phone?: string; // Override global phone (per-agent/per-project)
}

export default function WhatsAppButton({ propertyName, propertyId, phone: propPhone }: WhatsAppButtonProps) {
  const locale = useLocale();
  const [visible, setVisible] = useState(false);
  const phone = propPhone || process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '529843235354';
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

  const messages: Record<string, string> = {
    es: `Hola, me interesa ${propertyName || 'sus propiedades'}${propertyId ? ` (Ref: ${propertyId})` : ''}. Vi su sitio web.`,
    en: `Hi, I'm interested in ${propertyName || 'your properties'}${propertyId ? ` (Ref: ${propertyId})` : ''}. I saw your website.`,
  };

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(messages[locale] || messages.es)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        bottom: `max(1.5rem, calc(env(safe-area-inset-bottom) + ${compareOffset}))`,
      }}
      className={`fixed right-6 z-50 w-[60px] h-[60px] bg-[#25D366] hover:bg-[#1EBE57] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-[bottom,opacity,transform] duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      aria-label={locale === 'en' ? 'Contact via WhatsApp' : 'Contactar por WhatsApp'}
    >
      <MessageCircle size={28} fill="white" />
    </a>
  );
}
