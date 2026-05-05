'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Cookie, ChevronDown, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { readConsent, writeConsent, REOPEN_EVENT } from '@/lib/cookies/consent';

export default function CookieBanner() {
  const t = useTranslations('cookieBanner');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

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

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          role="dialog"
          aria-modal="false"
          aria-label={t('ariaLabel')}
          initial={{ y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed inset-x-3 sm:inset-x-6 bottom-3 sm:bottom-6 z-50 max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-[0_12px_40px_rgba(15,25,35,0.18)] overflow-hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="hidden sm:flex w-10 h-10 rounded-full bg-[#5CE0D2]/15 items-center justify-center shrink-0">
                <Cookie size={18} className="text-[#0F766E]" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base md:text-lg font-bold text-[#1A2F3F]">{t('title')}</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1 leading-relaxed">
                  {t('description')}
                </p>
              </div>
              <button
                type="button"
                onClick={rejectOptional}
                aria-label={t('closeAria')}
                className="w-8 h-8 -mt-1 -mr-1 flex items-center justify-center rounded-full text-gray-600 hover:text-[#1A2F3F] hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2]"
              >
                <X size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] rounded"
            >
              {t('customize')}
              <ChevronDown
                size={14}
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
                  <ul className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    <li className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <ShieldCheck size={16} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-[#1A2F3F]">
                            {t('necessaryTitle')}
                          </p>
                          <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            {t('alwaysOn')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                          {t('necessaryDesc')}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <label className="flex items-center justify-between gap-2 cursor-pointer">
                          <p className="text-sm font-bold text-[#1A2F3F]">
                            {t('analyticsTitle')}
                          </p>
                          <Toggle
                            checked={analytics}
                            onChange={setAnalytics}
                            ariaLabel={t('analyticsToggleAria')}
                          />
                        </label>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                          {t('analyticsDesc')}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <label className="flex items-center justify-between gap-2 cursor-pointer">
                          <p className="text-sm font-bold text-[#1A2F3F]">
                            {t('marketingTitle')}
                          </p>
                          <Toggle
                            checked={marketing}
                            onChange={setMarketing}
                            ariaLabel={t('marketingToggleAria')}
                          />
                        </label>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                          {t('marketingDesc')}
                        </p>
                      </div>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:gap-3">
              {expanded ? (
                <>
                  <button
                    type="button"
                    onClick={saveCustom}
                    className="flex-1 h-11 px-5 rounded-full bg-[#1A2F3F] hover:bg-[#0F1923] text-white text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] transition-colors"
                  >
                    {t('saveCta')}
                  </button>
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="flex-1 h-11 px-5 rounded-full bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] transition-colors"
                  >
                    {t('acceptAllCta')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={rejectOptional}
                    className="flex-1 h-11 px-5 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[#1A2F3F] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] transition-colors"
                  >
                    {t('rejectCta')}
                  </button>
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="flex-1 h-11 px-5 rounded-full bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] transition-colors"
                  >
                    {t('acceptAllCta')}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
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
      className={`relative inline-flex w-10 h-6 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2] ${
        checked ? 'bg-[#5CE0D2]' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
