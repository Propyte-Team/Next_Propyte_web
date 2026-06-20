'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Share2, Download, Copy, Check, Loader2, Facebook, Twitter,
  MessageCircle, ChevronDown, FileImage,
} from '@/lib/icons';

export interface ShareDownloadData {
  title: string;
  price: string;
  location: string;
  img: string;
  url: string;
  wa?: string;
  price_disc?: string;
  disc_text?: string;
  etapa?: string;
  specs?: Array<{ label: string; value: string }>;
  desc?: string;
  amenidades?: string[];
  dev_name?: string;
  delivery?: string;
  roi?: string;
  piso?: string;
  price_to?: string;
  prop_type?: string;
  num_unidad?: string;
  precio_usd?: string;
}

interface Props {
  data: ShareDownloadData;
  locale?: string;
  compact?: boolean;
}

// Fallback de último recurso. El número real llega por data.wa (resuelto desde
// el Hub por la página padre). NO usamos NEXT_PUBLIC_WHATSAPP_PHONE (stale).
const WA_NUMBER = '529844638032';

async function captureTemplate(el: HTMLElement): Promise<Blob> {
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(el, {
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    scale: 2,
    logging: false,
  });
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/png'),
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ─── Template: Stories 360×640 ─── */
function TemplateStories({ data }: { data: ShareDownloadData }) {
  const specs4 = (data.specs || []).slice(0, 4);
  const amenities4 = (data.amenidades || []).slice(0, 4);
  const descTrunc = data.desc ? data.desc.slice(0, 120) : '';

  return (
    <div
      style={{ width: 360, height: 640, fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden', backgroundColor: '#0F1923' }}
    >
      {/* Image overlay top 60% */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60%', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.img}
          alt=""
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,25,35,0.3) 0%, rgba(15,25,35,0.85) 100%)' }} />
      </div>

      {/* Etapa badge */}
      {data.etapa && (
        <div style={{ position: 'absolute', top: 16, left: 16, backgroundColor: '#5CE0D2', color: '#0F1923', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
          {data.etapa}
        </div>
      )}

      {/* Info area */}
      <div style={{ position: 'absolute', top: '58%', left: 0, right: 0, bottom: 0, padding: '12px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Location + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
          <span>📍</span>
          <span>{data.location}</span>
        </div>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {data.title}
        </div>

        {/* 2×2 stats grid */}
        {specs4.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {specs4.slice(0, 4).map((s, i) => (
              <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                <div style={{ color: '#5CE0D2', fontWeight: 700, fontSize: 14 }}>{s.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Price */}
        <div>
          <div style={{ color: '#5CE0D2', fontWeight: 800, fontSize: 20 }}>{data.price}</div>
          {data.price_disc && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through', fontSize: 12 }}>{data.price_disc}</span>
              {data.disc_text && <span style={{ backgroundColor: '#EF4444', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>{data.disc_text}</span>}
            </div>
          )}
        </div>

        {/* Description snippet */}
        {descTrunc && (
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {descTrunc}
          </div>
        )}

        {/* Amenity tags */}
        {amenities4.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {amenities4.map((a, i) => (
              <span key={i} style={{ backgroundColor: 'rgba(92,224,210,0.15)', color: '#5CE0D2', fontSize: 10, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(92,224,210,0.3)' }}>
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Brand footer */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#5CE0D2', fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>PROPYTE</span>
          {data.dev_name && <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{data.dev_name}</span>}
        </div>
      </div>
    </div>
  );
}

/* ─── Template: Square 500×500 ─── */
function TemplateSquare({ data }: { data: ShareDownloadData }) {
  const specs3 = (data.specs || []).slice(0, 3);
  const amenities5 = (data.amenidades || []).slice(0, 5);
  const descTrunc = data.desc ? data.desc.slice(0, 200) : '';

  return (
    <div style={{ width: 500, height: 500, fontFamily: 'system-ui, sans-serif', backgroundColor: '#fff', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Image top 52% */}
      <div style={{ height: '52%', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.img}
          alt=""
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {data.etapa && (
          <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#5CE0D2', color: '#0F1923', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
            {data.etapa}
          </div>
        )}
      </div>

      {/* Info bottom */}
      <div style={{ flex: 1, padding: '10px 16px 10px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
        {/* Teal divider */}
        <div style={{ height: 3, backgroundColor: '#5CE0D2', borderRadius: 2, width: 40 }} />

        {/* Title + Location */}
        <div style={{ fontWeight: 800, fontSize: 17, color: '#1A2F3F', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {data.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 11 }}>
          <span>📍</span>
          <span>{data.location}</span>
        </div>

        {/* 3-col stats */}
        {specs3.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {specs3.map((s, i) => (
              <div key={i} style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: '6px 4px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                <div style={{ color: '#1A2F3F', fontWeight: 700, fontSize: 14 }}>{s.value}</div>
                <div style={{ color: '#9CA3AF', fontSize: 10 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#1A2F3F' }}>{data.price}</span>
          {data.price_disc && <span style={{ color: '#9CA3AF', textDecoration: 'line-through', fontSize: 12 }}>{data.price_disc}</span>}
        </div>

        {/* Amenity tags */}
        {amenities5.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {amenities5.map((a, i) => (
              <span key={i} style={{ backgroundColor: '#F0FDFA', color: '#0E7490', fontSize: 10, padding: '2px 8px', borderRadius: 20, border: '1px solid #CCFBF1' }}>
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Description snippet */}
        {descTrunc && (
          <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {descTrunc}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: 6 }}>
          <span style={{ color: '#1A2F3F', fontWeight: 800, fontSize: 12, letterSpacing: 1 }}>PROPYTE</span>
          <span style={{ color: '#9CA3AF', fontSize: 10 }}>propyte.com</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Template: Letter 794×1056 ─── */
function TemplateLetter({ data }: { data: ShareDownloadData }) {
  const amenitiesAll = data.amenidades || [];
  const descTrunc = data.desc ? data.desc.slice(0, 300) : '';

  return (
    <div style={{ width: 794, height: 1056, fontFamily: 'system-ui, sans-serif', backgroundColor: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar */}
      <div style={{ backgroundColor: '#0F1923', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ color: '#5CE0D2', fontWeight: 900, fontSize: 20, letterSpacing: 2 }}>PROPYTE</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Ficha Técnica</span>
      </div>

      {/* Gradient divider */}
      <div style={{ height: 4, background: 'linear-gradient(to right, #5CE0D2, #1A2F3F)', flexShrink: 0 }} />

      {/* Body */}
      <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        {/* Image left + specs right */}
        <div style={{ display: 'flex', gap: 20, height: 280, flexShrink: 0 }}>
          {/* Image */}
          <div style={{ width: 340, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.img}
              alt=""
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Specs right */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 900, fontSize: 22, color: '#1A2F3F', lineHeight: 1.2 }}>{data.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 13 }}>
              <span>📍</span>
              <span>{data.location}</span>
            </div>
            {data.etapa && (
              <span style={{ display: 'inline-block', backgroundColor: '#5CE0D2', color: '#0F1923', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, alignSelf: 'flex-start' }}>
                {data.etapa}
              </span>
            )}
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(data.specs || []).map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingBottom: 6 }}>
                  <span style={{ color: '#6B7280', fontSize: 13, width: 120 }}>{s.label}:</span>
                  <span style={{ color: '#1A2F3F', fontWeight: 600, fontSize: 13 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, backgroundColor: '#F9FAFB', borderRadius: 10, padding: '12px 16px', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Precio</div>
            <div style={{ fontWeight: 900, fontSize: 24, color: '#1A2F3F' }}>{data.price}</div>
          </div>
          {data.precio_usd && (
            <div style={{ borderLeft: '1px solid #E5E7EB', paddingLeft: 24 }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>USD</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#6B7280' }}>{data.precio_usd}</div>
            </div>
          )}
          {data.price_disc && (
            <div>
              <span style={{ color: '#9CA3AF', textDecoration: 'line-through', fontSize: 14 }}>{data.price_disc}</span>
              {data.disc_text && (
                <span style={{ marginLeft: 8, backgroundColor: '#EF4444', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{data.disc_text}</span>
              )}
            </div>
          )}
        </div>

        {/* Amenities */}
        {amenitiesAll.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1A2F3F', marginBottom: 8, borderLeft: '3px solid #5CE0D2', paddingLeft: 8 }}>Características</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
              {amenitiesAll.slice(0, 10).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#374151' }}>
                  <span style={{ color: '#5CE0D2', fontWeight: 700 }}>✓</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery + ROI */}
        {(data.delivery || data.roi) && (
          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            {data.delivery && (
              <div style={{ flex: 1, backgroundColor: '#F0FDFA', borderRadius: 8, padding: '10px 14px', border: '1px solid #CCFBF1' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Entrega estimada</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0E7490' }}>{data.delivery}</div>
              </div>
            )}
            {data.roi && (
              <div style={{ flex: 1, backgroundColor: '#F0FDFA', borderRadius: 8, padding: '10px 14px', border: '1px solid #CCFBF1' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>ROI estimado</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0E7490' }}>{data.roi}</div>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {descTrunc && (
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1A2F3F', marginBottom: 6, borderLeft: '3px solid #5CE0D2', paddingLeft: 8 }}>Descripción</div>
            <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{descTrunc}</div>
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 'auto', backgroundColor: '#0F1923', borderRadius: 10, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>📱 WhatsApp: +{(data.wa || WA_NUMBER).replace(/^\+/, '')}</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>🌐 {data.url}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#5CE0D2', fontWeight: 900, fontSize: 16, letterSpacing: 1 }}>PROPYTE</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Tu aliado en bienes raíces</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function ShareDownloadModal({ data, locale: _locale, compact }: Props) {
  const t = useTranslations('share');
  const [shareOpen, setShareOpen] = useState(false);
  const [fichaOpen, setFichaOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const storiesRef = useRef<HTMLDivElement>(null);
  const squareRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);

  const safe = data.title.replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 50);

  useEffect(() => {
    if (!shareOpen && !fichaOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShareOpen(false);
        setFichaOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shareOpen, fichaOpen]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      setTimeout(() => setShareOpen(false), 2500);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = data.url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }, [data.url]);

  const handleDownload = useCallback(async (format: 'stories' | 'square' | 'letter') => {
    if (format === 'letter') {
      setFichaOpen(false);
      window.print();
      return;
    }
    const ref = format === 'stories' ? storiesRef : squareRef;
    if (!ref.current) return;
    setLoading(format);
    setFichaOpen(false);
    try {
      const blob = await captureTemplate(ref.current);
      downloadBlob(blob, `propyte-${format}-${safe}.png`);
    } catch (e) {
      console.error('html2canvas error:', e);
    } finally {
      setLoading(null);
    }
  }, [safe]);

  const waText = t('whatsappText', { name: data.title, url: data.url });
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
  const facebookUrl = `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`;
  const twitterUrl = `https://x.com/intent/tweet?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.title)}`;

  return (
    <>
      {/* Off-screen templates (for html2canvas capture) */}
      <div aria-hidden="true" style={{ position: 'fixed', top: -9999, left: -9999, pointerEvents: 'none' }}>
        <div ref={storiesRef}>
          <TemplateStories data={data} />
        </div>
        <div ref={squareRef}>
          <TemplateSquare data={data} />
        </div>
        <div ref={letterRef}>
          <TemplateLetter data={data} />
        </div>
      </div>

      {/* Print-only: show TemplateLetter */}
      <div className="hidden print:block" aria-hidden="true">
        <TemplateLetter data={data} />
      </div>

      {/* Trigger row */}
      <div className="flex items-center gap-2">
        {/* Compartir dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShareOpen((v) => !v); setFichaOpen(false); }}
            aria-expanded={shareOpen}
            className={
              compact
                ? 'inline-flex items-center justify-center w-11 h-11 rounded-full bg-white border border-gray-200 hover:border-[#5CE0D2] text-gray-700 shadow-sm transition-colors'
                : 'inline-flex items-center gap-1.5 min-h-[44px] px-4 bg-white border border-gray-200 hover:border-[#5CE0D2] text-gray-700 text-sm font-semibold rounded-lg transition-colors'
            }
          >
            <Share2 size={16} className="text-[#0E7490]" />
            {!compact && (
              <>
                <span>{t('share')}</span>
                <ChevronDown size={14} className="opacity-50" />
              </>
            )}
          </button>

          {shareOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
              >
                {copied ? <Check size={15} className="text-emerald-500 shrink-0" /> : <Copy size={15} className="text-gray-600 shrink-0" />}
                {copied ? t('copied') : t('copyLink')}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setTimeout(() => setShareOpen(false), 200)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <MessageCircle size={15} className="text-[#25D366] shrink-0" />
                WhatsApp
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setTimeout(() => setShareOpen(false), 200)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <Facebook size={15} className="text-[#1877F2] shrink-0" />
                Facebook
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setTimeout(() => setShareOpen(false), 200)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <Twitter size={15} className="text-gray-800 shrink-0" />
                X (Twitter)
              </a>
            </div>
          )}
        </div>

        {/* Ficha dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setFichaOpen((v) => !v); setShareOpen(false); }}
            aria-expanded={fichaOpen}
            disabled={loading !== null}
            className={
              compact
                ? 'inline-flex items-center justify-center w-11 h-11 rounded-full bg-white border border-gray-200 hover:border-[#5CE0D2] text-gray-700 shadow-sm transition-colors disabled:opacity-60'
                : 'inline-flex items-center gap-1.5 min-h-[44px] px-4 bg-white border border-gray-200 hover:border-[#5CE0D2] text-gray-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60'
            }
          >
            {loading ? (
              <Loader2 size={16} className="text-[#0E7490] animate-spin" />
            ) : (
              <Download size={16} className="text-[#0E7490]" />
            )}
            {!compact && (
              <>
                <span>{loading ? t('generating') : t('downloadLabel')}</span>
                {!loading && <ChevronDown size={14} className="opacity-50" />}
              </>
            )}
          </button>

          {fichaOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1">
              <button
                type="button"
                onClick={() => handleDownload('stories')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <FileImage size={15} className="text-[#0E7490] shrink-0" />
                <div className="text-left">
                  <div className="font-semibold">{t('stories')}</div>
                  <div className="text-xs text-gray-600">360×640px PNG</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDownload('square')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <FileImage size={15} className="text-[#0E7490] shrink-0" />
                <div className="text-left">
                  <div className="font-semibold">{t('square')}</div>
                  <div className="text-xs text-gray-600">500×500px PNG</div>
                </div>
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                type="button"
                onClick={() => handleDownload('letter')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <Download size={15} className="text-[#0E7490] shrink-0" />
                <div className="text-left">
                  <div className="font-semibold">{t('letter')}</div>
                  <div className="text-xs text-gray-600">794×1056px PDF</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click-outside overlay for dropdowns */}
      {(shareOpen || fichaOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShareOpen(false); setFichaOpen(false); }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
