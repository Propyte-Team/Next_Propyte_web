'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useLocale } from 'next-intl';

interface WhatsAppButtonProps {
  propertyName?: string;
  propertyId?: string;
  phone?: string; // Override global phone (per-agent/per-project)
}

export default function WhatsAppButton({ propertyName, propertyId, phone: propPhone }: WhatsAppButtonProps) {
  const locale = useLocale();
  const [visible, setVisible] = useState(false);
  const phone = propPhone || process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '521XXXXXXXXXX';

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

  if (!visible) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#1EBE57] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200"
      aria-label="Contact via WhatsApp"
    >
      <MessageCircle size={28} fill="white" />
    </a>
  );
}
