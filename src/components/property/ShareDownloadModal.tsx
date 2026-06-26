'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Share2, Download, Copy, Check, Loader2, Facebook, Twitter,
  MessageCircle, ChevronDown, FileImage, FileText, QrCode,
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

// Isotipo de Propyte (molinete de 3 pétalos), versión blanca, sobre badge teal.
const ISOTYPE_WHITE = '/img/logos/logo-icon-white.png';

type DownloadFormat = 'stories' | 'square' | 'ficha' | 'qr';

/* ─── helpers ─── */

// Deriva slug + kind de la URL canónica (.../{locale}/desarrollos|propiedades/{slug}).
function parseTarget(url: string): { slug: string; kind: 'development' | 'unit' } {
  const m = url.match(/\/(?:es|en)\/(desarrollos|propiedades)\/([^/?#]+)/);
  if (!m) return { slug: '', kind: 'development' };
  return { slug: m[2], kind: m[1] === 'propiedades' ? 'unit' : 'development' };
}

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// html2canvas no renderiza `-webkit-line-clamp` (deja el texto en blanco). Truncamos
// en JS y usamos texto normal para que el título/descripcion siempre aparezcan.
function clip(s: string | undefined, max: number): string {
  if (!s) return '';
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// QR de alta resolución con el isotipo de Propyte al centro (badge blanco + disco
// teal + isotipo blanco). Error-correction 'H' (~30%) tolera el oclusor central.
async function buildQrCard(data: ShareDownloadData): Promise<Blob> {
  const QRCode = (await import('qrcode')).default;

  const QR = 900;          // lado del QR
  const PAD = 80;          // margen del QR dentro del card
  const CAPTION = 168;     // zona inferior de texto
  const W = QR + PAD * 2;
  const H = QR + PAD * 2 + CAPTION;

  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, data.url, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: QR,
    color: { dark: '#0F1923', light: '#FFFFFF' },
  });

  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('No 2D context');

  // Fondo del card
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // QR
  ctx.drawImage(qrCanvas, PAD, PAD, QR, QR);

  // Badge central
  const cx = PAD + QR / 2;
  const cy = PAD + QR / 2;
  const outer = QR * 0.24;
  const inner = outer * 0.82;

  // Aro blanco (separa el badge de los módulos oscuros)
  roundRectPath(ctx, cx - outer / 2, cy - outer / 2, outer, outer, outer * 0.3);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Disco teal de marca
  roundRectPath(ctx, cx - inner / 2, cy - inner / 2, inner, inner, inner * 0.28);
  ctx.fillStyle = '#5CE0D2';
  ctx.fill();

  // Isotipo blanco centrado
  try {
    const iso = await loadImage(ISOTYPE_WHITE);
    const isoSize = inner * 0.6;
    ctx.drawImage(iso, cx - isoSize / 2, cy - isoSize / 2, isoSize, isoSize);
  } catch {
    /* sin isotipo: el QR sigue siendo válido */
  }

  // Caption: título + dominio
  const baseY = QR + PAD * 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const title = data.title.length > 40 ? `${data.title.slice(0, 39)}…` : data.title;
  ctx.fillStyle = '#1A2F3F';
  ctx.font = '600 40px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText(title, W / 2, baseY + 56, W - PAD * 2);

  ctx.fillStyle = '#0E7490';
  ctx.font = '600 30px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText('propyte.com', W / 2, baseY + 104);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 24px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText('Escanea para ver la propiedad', W / 2, baseY + 142);

  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/png'),
  );
}

/* ─── Template: Stories 360×640 ─── */
function PinDot() {
  return <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#5CE0D2', flexShrink: 0 }} />;
}

function TemplateStories({ data }: { data: ShareDownloadData }) {
  const specs4 = (data.specs || []).slice(0, 4);
  const amenities3 = (data.amenidades || []).slice(0, 3);

  return (
    <div
      style={{ width: 360, height: 640, fontFamily: '"Space Grotesk", system-ui, sans-serif', position: 'relative', overflow: 'hidden', backgroundColor: '#0F1923' }}
    >
      {/* Image top 62% */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 397, overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.img}
          alt=""
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(15,25,35,0.1) 0%, rgba(15,25,35,0.55) 60%, rgba(15,25,35,1) 100%)' }} />
      </div>

      {/* Etapa badge */}
      {data.etapa && (
        <div style={{ position: 'absolute', top: 18, left: 18, backgroundColor: '#5CE0D2', color: '#0F1923', padding: '5px 13px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 0.2 }}>
          {data.etapa}
        </div>
      )}

      {/* Info area — anchored to bottom, flows with content (no flex crush) */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 22px 24px' }}>
        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.72)', fontSize: 12, marginBottom: 7 }}>
          <PinDot />
          <span style={{ marginLeft: 6 }}>{data.location}</span>
        </div>

        {/* Title */}
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 23, lineHeight: '28px', letterSpacing: -0.4, marginBottom: 13 }}>
          {clip(data.title, 50)}
        </div>

        {/* 2×2 stats */}
        {specs4.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 8 }}>
            {specs4.map((s, i) => (
              <div key={i} style={{ width: '47%', boxSizing: 'border-box', marginRight: i % 2 === 0 ? '6%' : 0, marginBottom: 7, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 11px' }}>
                <div style={{ color: '#5CE0D2', fontWeight: 700, fontSize: 15 }}>{s.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Price */}
        <div style={{ color: '#5CE0D2', fontWeight: 800, fontSize: 26, letterSpacing: -0.6, marginBottom: 12 }}>
          {data.price}
          {data.price_disc && (
            <span style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through', fontSize: 13, fontWeight: 500, marginLeft: 8 }}>{data.price_disc}</span>
          )}
        </div>

        {/* Amenity tags — single row */}
        {amenities3.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 14 }}>
            {amenities3.map((a, i) => (
              <span key={i} style={{ backgroundColor: 'rgba(92,224,210,0.14)', color: '#5CE0D2', fontSize: 10, padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(92,224,210,0.3)', marginRight: 6, marginBottom: 6 }}>
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Brand footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.14)', paddingTop: 11, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#5CE0D2', fontWeight: 800, fontSize: 14, letterSpacing: 1.5 }}>PROPYTE</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{data.dev_name || 'propyte.com'}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Template: Square 1080×1080 (render @540, scale 2 → 1080) ─── */
function TemplateSquare({ data }: { data: ShareDownloadData }) {
  const specs3 = (data.specs || []).slice(0, 3);
  const amenities4 = (data.amenidades || []).slice(0, 4);

  return (
    <div style={{ width: 540, height: 540, fontFamily: '"Space Grotesk", system-ui, sans-serif', backgroundColor: '#fff', overflow: 'hidden', position: 'relative' }}>
      {/* Image top */}
      <div style={{ height: 250, position: 'relative', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.img}
          alt=""
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {data.etapa && (
          <div style={{ position: 'absolute', top: 14, left: 14, backgroundColor: '#5CE0D2', color: '#0F1923', padding: '5px 13px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
            {data.etapa}
          </div>
        )}
        <div style={{ position: 'absolute', top: 14, right: 16, color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: 1.5, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>PROPYTE</div>
      </div>

      {/* Info — block flow, footer pinned absolute */}
      <div style={{ padding: '16px 22px 60px' }}>
        <div style={{ height: 3, backgroundColor: '#5CE0D2', borderRadius: 2, width: 44, marginBottom: 11 }} />

        <div style={{ fontWeight: 700, fontSize: 19, color: '#1A2F3F', lineHeight: '24px', letterSpacing: -0.3, marginBottom: 8 }}>
          {clip(data.title, 48)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', color: '#6B7280', fontSize: 12, marginBottom: 12 }}>
          <PinDot />
          <span style={{ marginLeft: 6 }}>{data.location}</span>
        </div>

        {/* 3-col stats */}
        {specs3.length > 0 && (
          <div style={{ display: 'flex', marginBottom: 12 }}>
            {specs3.map((s, i) => (
              <div key={i} style={{ flex: 1, marginRight: i < specs3.length - 1 ? 7 : 0, backgroundColor: '#F4F6F8', borderRadius: 10, padding: '9px 6px', textAlign: 'center', border: '1px solid #E8ECEF' }}>
                <div style={{ color: '#1A2F3F', fontWeight: 700, fontSize: 15 }}>{s.value}</div>
                <div style={{ color: '#9CA3AF', fontSize: 10 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Price */}
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 22, color: '#1A2F3F', letterSpacing: -0.5 }}>{data.price}</span>
          {data.price_disc && <span style={{ color: '#9CA3AF', textDecoration: 'line-through', fontSize: 12, marginLeft: 8 }}>{data.price_disc}</span>}
        </div>

        {/* Amenity tags */}
        {amenities4.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {amenities4.map((a, i) => (
              <span key={i} style={{ backgroundColor: '#F0FDFA', color: '#0E7490', fontSize: 10, padding: '4px 10px', borderRadius: 999, border: '1px solid #CCFBF1', marginRight: 6, marginBottom: 6 }}>
                {a}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer pinned to bottom */}
      <div style={{ position: 'absolute', left: 22, right: 22, bottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: 9 }}>
        <span style={{ color: '#1A2F3F', fontWeight: 800, fontSize: 12, letterSpacing: 1 }}>Tu aliado en bienes raíces</span>
        <span style={{ color: '#0E7490', fontSize: 11, fontWeight: 600 }}>propyte.com</span>
      </div>
    </div>
  );
}

/* ─── Dropdown item ─── */
function MenuItem({
  icon, title, hint, onClick, busy,
}: { icon: React.ReactNode; title: string; hint: string; onClick: () => void; busy?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm hover:bg-[#F0FDFA] focus-visible:bg-[#F0FDFA] focus-visible:outline-none text-gray-700 transition-colors disabled:opacity-60"
    >
      <span className="grid place-items-center w-9 h-9 rounded-lg bg-[#F4F6F8] text-[#0E7490] shrink-0">
        {busy ? <Loader2 size={16} className="animate-spin" /> : icon}
      </span>
      <span className="text-left min-w-0">
        <span className="block font-semibold text-[#1A2F3F] truncate">{title}</span>
        <span className="block text-xs text-gray-500 truncate">{hint}</span>
      </span>
    </button>
  );
}

/* ─── Main Component ─── */
export default function ShareDownloadModal({ data, locale = 'es', compact }: Props) {
  const t = useTranslations('share');
  const [shareOpen, setShareOpen] = useState(false);
  const [fichaOpen, setFichaOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState<DownloadFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const storiesRef = useRef<HTMLDivElement>(null);
  const squareRef = useRef<HTMLDivElement>(null);

  const safe = data.title.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'propyte';

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

  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 3500);
    return () => clearTimeout(id);
  }, [error]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      setTimeout(() => setShareOpen(false), 2500);
    } catch {
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

  const handleDownload = useCallback(async (format: DownloadFormat) => {
    setFichaOpen(false);
    setLoading(format);
    setError(null);
    try {
      if (format === 'ficha') {
        const { slug, kind } = parseTarget(data.url);
        if (!slug) throw new Error('No slug');
        const res = await fetch(`/api/generate-pdf?slug=${encodeURIComponent(slug)}&kind=${kind}&locale=${locale}`);
        if (!res.ok) throw new Error(`PDF ${res.status}`);
        const blob = await res.blob();
        downloadBlob(blob, `propyte-${kind}-${safe}-${locale}.pdf`);
        return;
      }
      if (format === 'qr') {
        const blob = await buildQrCard(data);
        downloadBlob(blob, `propyte-qr-${safe}.png`);
        return;
      }
      // stories | square → html2canvas
      const ref = format === 'stories' ? storiesRef : squareRef;
      if (!ref.current) throw new Error('No template');
      const blob = await captureTemplate(ref.current);
      downloadBlob(blob, `propyte-${format}-${safe}.png`);
    } catch (e) {
      console.error('download error:', e);
      setError(format === 'ficha' ? t('pdfError') : t('qrError'));
    } finally {
      setLoading(null);
    }
  }, [data, locale, safe, t]);

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
      </div>

      {/* Trigger row */}
      <div className="flex items-center gap-2">
        {/* Compartir dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShareOpen((v) => !v); setFichaOpen(false); }}
            aria-expanded={shareOpen}
            aria-haspopup="menu"
            className={
              compact
                ? 'inline-flex items-center justify-center w-11 h-11 rounded-full bg-white border border-gray-200 hover:border-[#5CE0D2] focus-visible:border-[#5CE0D2] focus-visible:outline-none text-gray-700 shadow-sm transition-colors'
                : 'inline-flex items-center gap-1.5 min-h-[44px] px-4 bg-white border border-gray-200 hover:border-[#5CE0D2] focus-visible:border-[#5CE0D2] focus-visible:outline-none text-gray-700 text-sm font-semibold rounded-lg transition-colors'
            }
          >
            <Share2 size={16} className="text-[#0E7490]" />
            {!compact && (
              <>
                <span>{t('share')}</span>
                <ChevronDown size={14} className={`opacity-50 transition-transform ${shareOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          {shareOpen && (
            <div role="menu" className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-900/10 z-50 py-1.5 origin-top-right">
              <button
                type="button"
                role="menuitem"
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none text-gray-700 transition-colors"
              >
                {copied ? <Check size={15} className="text-emerald-500 shrink-0" /> : <Copy size={15} className="text-gray-600 shrink-0" />}
                {copied ? t('copied') : t('copyLink')}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setTimeout(() => setShareOpen(false), 200)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none text-gray-700 transition-colors"
              >
                <MessageCircle size={15} className="text-[#25D366] shrink-0" />
                WhatsApp
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setTimeout(() => setShareOpen(false), 200)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none text-gray-700 transition-colors"
              >
                <Facebook size={15} className="text-[#1877F2] shrink-0" />
                Facebook
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setTimeout(() => setShareOpen(false), 200)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none text-gray-700 transition-colors"
              >
                <Twitter size={15} className="text-gray-800 shrink-0" />
                X (Twitter)
              </a>
            </div>
          )}
        </div>

        {/* Descargar dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setFichaOpen((v) => !v); setShareOpen(false); }}
            aria-expanded={fichaOpen}
            aria-haspopup="menu"
            disabled={loading !== null}
            className={
              compact
                ? 'inline-flex items-center justify-center w-11 h-11 rounded-full bg-white border border-gray-200 hover:border-[#5CE0D2] focus-visible:border-[#5CE0D2] focus-visible:outline-none text-gray-700 shadow-sm transition-colors disabled:opacity-60'
                : 'inline-flex items-center gap-1.5 min-h-[44px] px-4 bg-white border border-gray-200 hover:border-[#5CE0D2] focus-visible:border-[#5CE0D2] focus-visible:outline-none text-gray-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60'
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
                {!loading && <ChevronDown size={14} className={`opacity-50 transition-transform ${fichaOpen ? 'rotate-180' : ''}`} />}
              </>
            )}
          </button>

          {fichaOpen && (
            <div role="menu" className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-900/10 z-50 py-1.5 origin-top-right">
              <MenuItem
                icon={<FileText size={17} />}
                title={t('ficha')}
                hint={t('fichaHint')}
                busy={loading === 'ficha'}
                onClick={() => handleDownload('ficha')}
              />
              <MenuItem
                icon={<QrCode size={17} />}
                title={t('qr')}
                hint={t('qrHint')}
                busy={loading === 'qr'}
                onClick={() => handleDownload('qr')}
              />
              <div className="h-px bg-gray-100 mx-3 my-1.5" />
              <MenuItem
                icon={<FileImage size={17} />}
                title={t('stories')}
                hint={t('storiesHint')}
                busy={loading === 'stories'}
                onClick={() => handleDownload('stories')}
              />
              <MenuItem
                icon={<FileImage size={17} />}
                title={t('square')}
                hint={t('squareHint')}
                busy={loading === 'square'}
                onClick={() => handleDownload('square')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div role="alert" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] bg-[#1A2F3F] text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-xl">
          {error}
        </div>
      )}

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
