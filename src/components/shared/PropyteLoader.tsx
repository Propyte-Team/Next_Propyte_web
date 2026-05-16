/**
 * Global loading indicator with the Propyte icon spinning.
 *
 * Usa CSS mask para colorear el icono blanco con cualquier brand color sin
 * depender de filtros aproximados (filter: hue-rotate). El icono gira con
 * animate-spin a velocidad media (1.2s) — suficientemente perceptible sin
 * sentirse frenético.
 *
 * Props:
 *  - fullscreen: `true` para overlay full-viewport (defecto), `false` para
 *    quedarse contenido en el contenedor padre.
 *  - label: texto opcional bajo el icono.
 */
interface PropyteLoaderProps {
  fullscreen?: boolean;
  label?: string;
}

export default function PropyteLoader({ fullscreen = true, label = 'Cargando…' }: PropyteLoaderProps) {
  const containerClass = fullscreen
    ? 'fixed inset-0 z-[60] flex items-center justify-center bg-white/96 backdrop-blur-sm'
    : 'flex items-center justify-center w-full min-h-[400px] bg-white';

  return (
    <div className={containerClass} role="status" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-5">
        {/* Icono propyte con mask CSS — bg-color usa brand cyan oficial #A2F9FF.
            Sin glow/borde — el icono solo, girando. */}
        <div
          aria-hidden="true"
          className="w-16 h-16 animate-spin"
          style={{
            animationDuration: '1.2s',
            backgroundColor: '#A2F9FF',
            WebkitMaskImage: 'url(/img/logos/logo-icon-white.png)',
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskImage: 'url(/img/logos/logo-icon-white.png)',
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
          }}
        />
        {label && (
          <p className="text-sm font-medium text-gray-500 tracking-wide">
            {label}
          </p>
        )}
        <span className="sr-only">{label || 'Cargando'}</span>
      </div>
    </div>
  );
}
