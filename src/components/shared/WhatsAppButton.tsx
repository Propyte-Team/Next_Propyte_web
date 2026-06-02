'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle } from '@/lib/icons';
import { useLocale } from 'next-intl';
import { useCompare } from '@/hooks/useCompare';
import { trackWhatsAppClick } from '@/lib/analytics/track';
import type { HubSiteConfig } from '@/lib/hub-content';

/**
 * Rutas hijas de /propiedades/* y /desarrollos/* que NO son detalle (taxonomías).
 * En estas, el flotante WA sigue activo en mobile. En las que SÍ son detalle
 * ([slug] real), ocultamos el flotante mobile para no encimar con MobileContactBar.
 */
const TAXONOMY_SEGMENTS = new Set([
  'cancun',
  'merida',
  'playa-del-carmen',
  'tulum',
  'tipo',
  'etapa',
  'destacados',
]);

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
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Detecta /(es|en)/(propiedades|desarrollos)/<slug-real> (no taxonomía).
  // En esas rutas, MobileContactBar ya ocupa la franja inferior con WhatsApp
  // integrado — el flotante mobile redundante se oculta.
  const segments = pathname.split('/').filter(Boolean); // ej. ['en','propiedades','villa-xyz']
  const isDetailPage =
    segments.length === 3 &&
    (segments[1] === 'propiedades' || segments[1] === 'desarrollos') &&
    !TAXONOMY_SEGMENTS.has(segments[2]);
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
      // Threshold 100px (decisión Luis 2026-05-23): el botón aparece más temprano
      // en home + listings para descubrimiento. Antes 300.
      setVisible(window.scrollY > 100);
    }
    // Fire una vez al montar para no esperar el primer scroll del usuario.
    handleScroll();
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
      onClick={() => {
        // Try/catch defensivo: si analytics falla no debe romper la navegación
        // a wa.me. Diagnóstico 2026-05-23 — usuario reportó botón sin respuesta.
        try {
          trackWhatsAppClick({ surface: propertyId ? 'detail-floating' : 'floating', propertyId });
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[WhatsAppButton] trackWhatsAppClick failed:', err);
          }
        }
      }}
      style={{
        bottom: `max(1.5rem, calc(env(safe-area-inset-bottom) + ${compareOffset}))`,
      }}
      className={`propyte-cta-whatsapp fixed right-6 z-[55] w-[60px] h-[60px] rounded-full items-center justify-center shadow-lg hover:scale-110 transition-[bottom,opacity,transform] duration-200 ${
        isDetailPage ? 'hidden md:flex' : 'flex'
      } ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      aria-label={locale === 'en' ? 'Contact via WhatsApp' : 'Contactar por WhatsApp'}
    >
      <MessageCircle size={28} />
    </a>
  );
}
