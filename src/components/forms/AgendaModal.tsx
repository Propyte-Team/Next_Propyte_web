'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X } from '@/lib/icons';

interface Props {
  open: boolean;
  onClose: () => void;
  /** URL ya validada y con `gv=true`. Si es null, el caller no debe abrir. */
  agendaUrl: string | null;
  titulo: string;
}

/**
 * La agenda de Google en una capa, con el scroll de la página bloqueado.
 *
 * POR QUÉ ES MODAL Y NO UN BLOQUE EN EL FLUJO. En línea, la rueda sobre el
 * calendario movía la página: el widget de Google cabe en sus 600 px y no es
 * scrolleable, así que el navegador —correctamente— pasa el evento al padre y
 * la agenda se le va de la pantalla al visitante justo cuando está eligiendo
 * horario. Medido el 2026-09-02: 250 px por gesto.
 *
 * Y NO SE ARREGLA CON CSS. Se intentó `overscroll-behavior: contain` en el
 * iframe y se midió: la página siguió moviéndose los mismos 250 px. En un
 * iframe de OTRO ORIGEN el padre no controla el puerto de scroll del hijo, y
 * aquí además no hay nada que contener porque el hijo no scrollea. La única
 * forma de que la página no se mueva es que no pueda: `overflow: hidden` en el
 * body mientras la capa está abierta.
 *
 * El patrón (bloqueo del body, trampa de foco, Escape, restauración del foco,
 * y el ref de `onClose` para que el efecto dependa solo de `open`) viene de
 * `src/components/shared/TeamBioModal.tsx`. Es la cuarta copia de esa lógica
 * en el repo —están también `ShareDownloadModal` y `GlossaryLeadGateModal`—;
 * extraer una cáscara común sería lo correcto, pero toca tres componentes en
 * producción y no es de este arreglo.
 */
export default function AgendaModal({ open, onClose, agendaUrl, titulo }: Props) {
  const t = useTranslations('common');
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // En un ref para que el efecto dependa solo de `open`. Si dependiera de
  // `onClose` (callback inline del caller), re-correría en cada render del
  // padre, recapturando `activeElement` y rompiendo la restauración del foco.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    queueMicrotask(() => closeBtnRef.current?.focus());

    const sel =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const fs = Array.from(root.querySelectorAll<HTMLElement>(sel)).filter(
        (el) => el.offsetParent !== null,
      );
      if (fs.length === 0) return;
      const first = fs[0];
      const last = fs[fs.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!root.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      lastFocusedRef.current?.focus?.();
    };
  }, [open]);

  if (!open || !agendaUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      data-testid="guia-terrenos-agenda-modal"
      className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-3xl rounded-2xl bg-white p-2 pt-12 shadow-2xl sm:p-4 sm:pt-14"
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="absolute right-3 top-3 rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2]"
        >
          <X size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>

        {/* `h-[70vh]` y no una altura fija: en un móvil de 667 px los 600 px que
            recomienda Google dejaban la capa sin margen ni sitio para el botón
            de cerrar. El tope evita que en escritorio crezca sin sentido. */}
        <iframe
          title={titulo}
          src={agendaUrl}
          className="h-[70vh] max-h-[640px] w-full rounded-xl border border-gray-200"
        />
      </div>
    </div>
  );
}
