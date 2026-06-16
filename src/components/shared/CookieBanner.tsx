'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, X, ShieldCheck } from '@/lib/icons';
import { motion, AnimatePresence } from 'framer-motion';
// Nota: AnimatePresence se mantiene importado porque la sección "expanded"
// interna lo usa para colapsar las opciones de cookies (analytics/marketing).
import { readConsent, writeConsent, REOPEN_EVENT } from '@/lib/cookies/consent';
import { useCompare } from '@/hooks/useCompare';

export default function CookieBanner() {
  const t = useTranslations('cookieBanner');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  // Tras aceptar/rechazar desmontamos el banner por completo (no solo
  // pointer-events:none) para garantizar que NADA quede tapando WhatsApp/CTAs.
  const [hidden, setHidden] = useState(false);
  // Compare sticky bar es ~52px. Empuja el banner por encima cuando hay
  // selección activa para no tapar el botón "Comparar" (mismo patrón que
  // WhatsAppButton). Reportado en Mac 2026-05-22.
  const { count: compareCount } = useCompare();
  const bottomOffset = compareCount > 0 ? '5rem' : '1rem';

  // Mount-time bootstrap via setState-during-render pattern (avoids
  // react-hooks/set-state-in-effect; same approach used in useFilters).
  if (!bootstrapped) {
    setBootstrapped(true);
    const current = readConsent();
    if (!current) {
      setOpen(true);
    } else {
      setAnalytics(current.analytics);
      setMarketing(current.marketing);
    }
  }

  useEffect(() => {
    const onReopen = () => {
      const current = readConsent();
      setAnalytics(current?.analytics ?? false);
      setMarketing(current?.marketing ?? false);
      setExpanded(true);
      setHidden(false);
      setOpen(true);
    };
    window.addEventListener(REOPEN_EVENT, onReopen);
    return () => window.removeEventListener(REOPEN_EVENT, onReopen);
  }, []);

  const acceptAll = () => {
    writeConsent({ analytics: true, marketing: true });
    setOpen(false);
  };
  const rejectOptional = () => {
    writeConsent({ analytics: false, marketing: false });
    setOpen(false);
  };
  const saveCustom = () => {
    writeConsent({ analytics, marketing });
    setOpen(false);
  };

  // Bug 2026-05-23: AnimatePresence con `{open && ...}` retenía el motion.aside
  // en el DOM durante el exit animation. Aunque opacity caía a 0, el elemento
  // seguía capturando pointer events en la esquina inferior derecha — bloqueaba
  // clicks al WhatsApp button y al CTA "Comparar" del ComparePanel.
  // Fix: motion.aside SIEMPRE montado (position:fixed, no afecta layout) con
  // `pointer-events` en el `style` que salta a 'none' inmediatamente cuando
  // open=false. La transición visual sigue siendo smooth porque framer anima
  // y/opacity, pero pointerEvents no es animable y cambia instantáneo.
  // Desmontaje total tras el exit: la animación de salida corre con
  // pointer-events:none y, al terminar (onAnimationComplete), sacamos el aside
  // del DOM. Así no queda overlay invisible que tape WhatsApp/CTAs.
  if (hidden) return null;

  return (
    <motion.aside
      role="dialog"
      aria-modal="false"
      aria-hidden={!open}
      aria-label={t('ariaLabel')}
      initial={false}
      animate={open ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      onAnimationComplete={() => { if (!open) setHidden(true); }}
      className="fixed inset-x-3 sm:inset-x-auto sm:right-4 z-50 sm:max-w-sm sm:w-[380px] bg-white border border-gray-200 rounded-xl shadow-[0_8px_28px_rgba(15,25,35,0.16)] overflow-hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        bottom: `calc(env(safe-area-inset-bottom, 0px) + ${bottomOffset})`,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
          <div className="p-3.5">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-[#1A2F3F] leading-tight">{t('title')}</h2>
                <p className="text-xs text-gray-600 mt-1 leading-snug line-clamp-3">
                  {t('description')}
                </p>
              </div>
              <button
                type="button"
                onClick={rejectOptional}
                aria-label={t('closeAria')}
                className="w-11 h-11 -mt-2 -mr-2 flex items-center justify-center rounded-full text-gray-600 hover:text-[#1A2F3F] hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-2 inline-flex items-center gap-1 min-h-[44px] -my-2 text-2xs font-semibold text-[#0E7490] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand rounded"
            >
              {t('customize')}
              <ChevronDown
                size={12}
                strokeWidth={2.5}
                className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ul className="mt-3 space-y-2.5 border-t border-gray-100 pt-3">
                    <li className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
                        <ShieldCheck size={13} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-[#1A2F3F]">
                            {t('necessaryTitle')}
                          </p>
                          <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5 shrink-0">
                            {t('alwaysOn')}
                          </span>
                        </div>
                        <p className="text-2xs text-gray-600 mt-0.5 leading-snug">
                          {t('necessaryDesc')}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <label className="flex items-center justify-between gap-2 cursor-pointer">
                          <p className="text-xs font-bold text-[#1A2F3F]">
                            {t('analyticsTitle')}
                          </p>
                          <Toggle
                            checked={analytics}
                            onChange={setAnalytics}
                            ariaLabel={t('analyticsToggleAria')}
                          />
                        </label>
                        <p className="text-2xs text-gray-600 mt-0.5 leading-snug">
                          {t('analyticsDesc')}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <label className="flex items-center justify-between gap-2 cursor-pointer">
                          <p className="text-xs font-bold text-[#1A2F3F]">
                            {t('marketingTitle')}
                          </p>
                          <Toggle
                            checked={marketing}
                            onChange={setMarketing}
                            ariaLabel={t('marketingToggleAria')}
                          />
                        </label>
                        <p className="text-2xs text-gray-600 mt-0.5 leading-snug">
                          {t('marketingDesc')}
                        </p>
                      </div>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-3 flex gap-2">
              {expanded ? (
                <>
                  <button
                    type="button"
                    onClick={saveCustom}
                    className="inline-flex items-center justify-center flex-1 min-h-[44px] px-3 rounded-lg touch-manipulation bg-[#1A2F3F] hover:bg-[#0F1923] text-white text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand transition-colors"
                  >
                    {t('saveCta')}
                  </button>
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="inline-flex items-center justify-center flex-1 min-h-[44px] px-3 rounded-lg touch-manipulation bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand transition-colors"
                  >
                    {t('acceptAllCta')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={rejectOptional}
                    className="inline-flex items-center justify-center flex-1 min-h-[44px] px-3 rounded-lg touch-manipulation border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[#1A2F3F] text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand transition-colors"
                  >
                    {t('rejectCta')}
                  </button>
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="inline-flex items-center justify-center flex-1 min-h-[44px] px-3 rounded-lg touch-manipulation bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand transition-colors"
                  >
                    {t('acceptAllCta')}
                  </button>
                </>
              )}
            </div>
      </div>
    </motion.aside>
  );
}

function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-9 h-5 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propyte-brand shrink-0 ${
        checked ? 'bg-propyte-brand' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
