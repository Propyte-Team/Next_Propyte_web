'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X, MapPin, MessageCircle } from '@/lib/icons';
import type { TeamBioPerson } from '@/lib/team-bio';

interface Props {
  open: boolean;
  onClose: () => void;
  person: TeamBioPerson | null;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function TeamBioModal({ open, onClose, person }: Props) {
  const t = useTranslations('teamBio');
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    queueMicrotask(() => closeBtnRef.current?.focus());

    const sel =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, [open, onClose]);

  if (!open || !person) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-bio-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8"
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-gray-100 text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2]"
        >
          <X size={20} strokeWidth={1.75} />
        </button>

        <div className="flex flex-col items-center text-center">
          {person.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photoUrl}
              alt={person.name}
              className="w-32 h-32 rounded-full object-cover object-top mb-4"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-[#1A2F3F] flex items-center justify-center mb-4">
              <span className="text-white text-3xl font-bold" aria-hidden="true">
                {getInitials(person.name)}
              </span>
            </div>
          )}

          <h2 id="team-bio-title" className="text-2xl font-bold text-[#1A2F3F]">
            {person.name}
          </h2>
          <p className="text-sm font-semibold text-[#0E7490] mt-1">{person.role}</p>
          {person.city && (
            <p className="text-xs text-gray-600 mt-1 flex items-center justify-center gap-1">
              <MapPin size={12} /> {person.city}
            </p>
          )}
        </div>

        <p className="mt-6 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {person.bio}
        </p>

        {person.whatsappLink && (
          <div className="mt-6 text-center">
            <a
              href={person.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-5 bg-[#25D366]/10 text-[#075E54] text-sm font-semibold rounded-full hover:bg-[#25D366]/20 transition-colors"
            >
              <MessageCircle size={14} /> {t('whatsapp')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
