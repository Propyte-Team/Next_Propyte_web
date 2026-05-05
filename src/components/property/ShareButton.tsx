'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('share');
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

  const subject = t('subject', { name: propertyName });
  const bodyText = t('bodyText', { name: propertyName, url: propertyUrl });

  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  const whatsappText = t('whatsappText', { name: propertyName, url: propertyUrl });
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
      setError(t('pdfError'));
      console.error('pdf download failed:', e);
    } finally {
      setDownloading(false);
    }
  }, [slug, kind, locale, propertyName, t]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(propertyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError(t('copyFailed'));
    }
  }, [propertyUrl, t]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('shareOrDownload')}
        className={
          compact
            ? 'inline-flex items-center justify-center w-11 h-11 rounded-full bg-white border border-gray-200 hover:border-[#5CE0D2] text-gray-700 shadow-sm transition-colors'
            : 'inline-flex items-center gap-1.5 min-h-[44px] px-4 bg-white border border-gray-200 hover:border-[#5CE0D2] text-gray-700 text-sm font-semibold rounded-lg transition-colors'
        }
      >
        <Share2 size={16} className="text-[#0F766E]" />
        {!compact && <span>{t('share')}</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('shareOrDownload')}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-[#2C2C2C]">{t('shareOrDownload')}</h3>
                <p className="text-xs text-gray-600 mt-0.5 truncate max-w-[280px]">{propertyName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('close')}
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
                    {downloading ? t('generating') : t('downloadPdf')}
                  </div>
                  <div className="text-xs text-gray-600">{t('pdfSummary')}</div>
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
                  <div className="font-semibold text-sm text-[#2C2C2C]">{t('shareByEmail')}</div>
                  <div className="text-xs text-gray-600">{t('opensMailApp')}</div>
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
                  <div className="text-xs text-gray-600">{t('shareWithContact')}</div>
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
                    {copied ? t('copied') : t('copyLink')}
                  </div>
                  <div className="text-xs text-gray-600 truncate">{propertyUrl}</div>
                </div>
              </button>
            </div>

            {error && (
              <div className="px-6 py-3 bg-red-50 border-t border-red-100 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-600 text-center">
              Propyte · propyte.com
            </div>
          </div>
        </div>
      )}
    </>
  );
}
