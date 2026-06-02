import { DiscountTagInclined } from '@/lib/propyte-icons';

type CornerProps = {
  variant: 'corner';
  size?: number;
  className?: string;
  ariaLabel?: string;
};

type InlineProps = {
  variant: 'inline';
  pct: number;
  className?: string;
  ariaLabel?: string;
  /** 'dark' usa el cyan brillante para contrastar sobre paneles oscuros
   *  (#1A2F3F, p.ej. DATOS CLAVE). Default 'light' = cyan-700 sobre claro. */
  tone?: 'light' | 'dark';
};

type Props = CornerProps | InlineProps;

const BRAND = '#0E7490';
// Tag de galería (sobre foto): cyan brillante + halo oscuro para que no se pierda
// sobre imágenes claras. El inline (sobre fondo blanco/claro) conserva el cyan-700.
const GALLERY_BRAND = '#5CE0D2';

export default function DiscountBadge(props: Props) {
  if (props.variant === 'corner') {
    const { size = 36, className = '', ariaLabel = 'Propiedad con descuento activo' } = props;
    return (
      <DiscountTagInclined
        size={size}
        strokeWidth={2}
        aria-label={ariaLabel}
        role="img"
        className={`drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)] drop-shadow-[0_0_1px_rgba(0,0,0,0.5)] ${className}`}
        style={{ color: GALLERY_BRAND }}
      />
    );
  }

  const { pct, className = '', ariaLabel, tone = 'light' } = props;
  const rounded = Math.round(pct);
  const label = ariaLabel ?? `Descuento de ${rounded}%`;
  const color = tone === 'dark' ? GALLERY_BRAND : BRAND;

  return (
    <span
      className={`relative inline-flex items-center justify-center align-middle ${className}`}
      role="img"
      aria-label={label}
    >
      <svg
        viewBox="0 0 85 29"
        width="76"
        height="26"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
        style={{ color }}
      >
        <path d="M81 4V26L24.8132 26L14 15L24.8132 4H65.0664" />
        <path d="M21 15H6.12281C6.12281 15 5 15.5 5 17C5 18.5 6.12281 19 6.12281 19H11.1754" />
        <circle cx="23" cy="15" r="2" />
      </svg>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[26%] right-[7%] flex items-center justify-center text-xs font-bold tabular-nums leading-none"
        style={{ color }}
      >
        −{rounded}%
      </span>
    </span>
  );
}
