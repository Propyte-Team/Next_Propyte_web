'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Share2, X, FileDown, Mail, MessageCircle, Link2, Check, Loader2,
} from 'lucide-react';

interface ShareButtonProps {
  propertyName: string;
  propertyUrl: string;
  slug: string;
  kind: 'development' | 'unit';
  locale: string;
  compact?: boolean;
}

/**
 * Share/Download trigger + modal with 4 actions:
 *   PDF (fetch /api/generate-pdf?slug=...)
 *   Email (mailto)
 *   WhatsApp (wa.me)
 *   Copy link (clipboard + toast)
 *
 * `compact=true` renders an icon-only 44x44 button for sidebar.
 */
export default function ShareButton({
  propertyName, propertyUrl, slug, kind, locale, compact,
}: ShareButtonProps) {
  const isEn = locale === 'en';
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const subject = isEn
    ? `${propertyName} on Propyte`
    : `${propertyName} en Propyte`;
  const bodyText = isEn
    ? `Take a look at this property on Propyte:\n\n${propertyName}\n${propertyUrl}`
    : `Mira esta propiedad en Propyte:\n\n${propertyName}\n${propertyUrl}`;

  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  const whatsappText = isEn
    ? `Hi! Check out ${propertyName} on Propyte: ${propertyUrl}`
    : `¡Hola! Mira ${propertyName} en Propyte: ${propertyUrl}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const handlePDF = useCallback(async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`/api/generate-pdf?slug=${encodeURIComponent(slug)}&kind=${kind}&locale=${locale}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const safe = propertyName.replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 60);
      const a = document.createElement('a');
      a.href = url;
      a.download = `propyte-${kind}-${safe}-${locale}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(isEn ? 'Could not generate PDF. Try again.' : 'No se pudo generar el PDF. Intenta de nuevo.');
      console.error('pdf download failed:', e);
    } finally {
      setDownloading(false);
    }
  }, [slug, kind, locale, propertyName, isEn]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(propertyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError(isEn ? 'Copy failed.' : 'No se pudo copiar.');
    }
  }, [propertyUrl, isEn]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={isEn ? 'Share or download' : 'Compartir o descargar'}
        className={
          compact
            ? 'inline-flex items-center justify-center w-11 h-11 rounded-full bg-white border border-gray-200 hover:border-[#5CE0D2] text-gray-700 shadow-sm transition-colors'
            : 'inline-flex items-center gap-1.5 min-h-[44px] px-4 bg-white border border-gray-200 hover:border-[#5CE0D2] text-gray-700 text-sm font-semibold rounded-lg transition-colors'
        }
      >
        <Share2 size={16} className="text-[#0D9488]" />
        {!compact && <span>{isEn ? 'Share' : 'Compartir'}</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={isEn ? 'Share or download' : 'Compartir o descargar'}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-[#2C2C2C]">
                  {isEn ? 'Share or download' : 'Compartir o descargar'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">{propertyName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={isEn ? 'Close' : 'Cerrar'}
                className="w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            {/* Options */}
            <div className="p-4 space-y-2">
              {/* PDF */}
              <button
                type="button"
                onClick={handlePDF}
                disabled={downloading}
                className="w-full flex items-center gap-3 min-h-[56px] px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left disabled:opacity-60"
              >
                <div className="w-10 h-10 rounded-lg bg-[#1A2F3F] flex items-center justify-center shrink-0">
                  {downloading ? <Loader2 size={18} className="text-white animate-spin" /> : <FileDown size={18} className="text-[#5CE0D2]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#2C2C2C]">
                    {downloading
                      ? (isEn ? 'Generating…' : 'Generando…')
                      : (isEn ? 'Download PDF' : 'Descargar PDF')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isEn ? 'One-page summary with QR' : 'Ficha de 1 página con QR'}
                  </div>
                </div>
              </button>

              {/* Email */}
              <a
                href={mailto}
                onClick={() => setTimeout(() => setOpen(false), 300)}
                className="flex items-center gap-3 min-h-[56px] px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#0D9488] flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#2C2C2C]">
                    {isEn ? 'Share by email' : 'Compartir por email'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isEn ? 'Opens your mail app' : 'Abre tu app de correo'}
                  </div>
                </div>
              </a>

              {/* WhatsApp */}
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setTimeout(() => setOpen(false), 300)}
                className="flex items-center gap-3 min-h-[56px] px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#25D366] flex items-center justify-center shrink-0">
                  <MessageCircle size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#2C2C2C]">WhatsApp</div>
                  <div className="text-xs text-gray-500">
                    {isEn ? 'Share with a contact' : 'Comparte con un contacto'}
                  </div>
                </div>
              </a>

              {/* Copy link */}
              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center gap-3 min-h-[56px] px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${copied ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                  {copied ? <Check size={18} className="text-white" /> : <Link2 size={18} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#2C2C2C]">
                    {copied
                      ? (isEn ? 'Copied!' : '¡Copiado!')
                      : (isEn ? 'Copy link' : 'Copiar enlace')}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{propertyUrl}</div>
                </div>
              </button>
            </div>

            {error && (
              <div className="px-6 py-3 bg-red-50 border-t border-red-100 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-400 text-center">
              Propyte · propyte.com
            </div>
          </div>
        </div>
      )}
    </>
  );
}
