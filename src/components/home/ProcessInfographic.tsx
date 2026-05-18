'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import ScrollReveal from '@/components/shared/ScrollReveal';

// NOTE: copy lives en i18n; iconos quedan code-side. Para hacerlo Hub-editable
// a futuro: cambiar `t.raw('panelA.steps')` por fuente Hub manteniendo la forma `Step[]`.

type Step = { n: string; title: string; desc: string; key?: boolean; win?: string };
type Pillar = { before: string; strong: string; after: string };
type Stat = { value: string; label: string };

const STROKE = 'currentColor';

// ─── Color palette (canónica Propyte sobre bg-white) ─────────────────────
const NAVY = '#1A2F3F';
const BRAND = '#A2F9FF';
const EYEBROW_TEAL = '#0E7490';
const DANGER_DEEP = '#B91C1C';
const AZTEC_DARK = '#0F1923';

// ─── Icon catalogue ──────────────────────────────────────────────────────

const IconStart = (
  <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="m8 21 4-4 4 4" /><path d="M12 17v4" />
  </svg>
);

const IconCheckMini = (
  <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ICONS_A: React.ReactNode[] = [
  <svg key="a1" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>,
  <svg key="a2" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 16z" />
  </svg>,
  <svg key="a3" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>,
  <svg key="a4" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>,
  <svg key="a5" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <circle cx="12" cy="12" r="10" /><path d="M8 15s1.5-2 4-2 4 2 4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>,
  <svg key="a6" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>,
];

const ICONS_B: React.ReactNode[] = [
  <svg key="b1" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>,
  <svg key="b2" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>,
  <svg key="b3" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>,
  <svg key="b4" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>,
  <svg key="b5" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>,
  <svg key="b6" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>,
  <svg key="b7" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>,
];

const PILLAR_ICONS: React.ReactNode[] = [
  <svg key="p1" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  <svg key="p2" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  <svg key="p3" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  <svg key="p4" viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
];

const IconAlertCircle = (
  <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconGhost = (
  <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={1.5}>
    <path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 3 3 2-2 2 2 3-3 3 3V10a8 8 0 0 0-8-8z" />
  </svg>
);
const IconChevron = (
  <svg viewBox="0 0 24 24" fill="none" stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ═════════════════════════════════════════════════════════════════════════
// Main component
// ═════════════════════════════════════════════════════════════════════════

export default function ProcessInfographic() {
  const t = useTranslations('processInfographic');
  const stepsA = t.raw('panelA.steps') as Step[];
  const stepsB = t.raw('panelB.steps') as Step[];
  const pillars = t.raw('pillars') as Pillar[];
  const stats = t.raw('tangibleDiff.stats') as Stat[];
  const keyTag = t('panelB.keyTag');

  return (
    <section className="relative py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        {/* ─── Header ─── */}
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
            <span className="inline-block text-2xs font-bold uppercase tracking-[0.22em] mb-4" style={{ color: EYEBROW_TEAL }}>
              {t('eyebrow')}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight" style={{ color: NAVY }}>
              {t('title')}{' '}
              <span className="relative inline-block">
                <span aria-hidden="true" className="absolute left-0 right-0 bottom-[0.05em] h-[0.45em] -z-10" style={{ backgroundColor: BRAND, opacity: 0.45 }} />
                <span className="relative">{t('titleAccent')}</span>
              </span>
            </h2>
          </div>
        </ScrollReveal>

        {/* ─── Start node — "Todos inician igual" ─── */}
        <ScrollReveal delay={0.05}>
          <div className="flex items-center gap-4 bg-white border-2 rounded-2xl px-5 py-4 max-w-[520px] mx-auto shadow-sm" style={{ borderColor: BRAND }}>
            <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: BRAND, color: NAVY }}>
              <span className="w-6 h-6 block">{IconStart}</span>
            </div>
            <div className="text-left">
              <span className="block text-2xs font-bold uppercase tracking-[0.22em] mb-1" style={{ color: EYEBROW_TEAL }}>
                {t('startNode.tag')}
              </span>
              <strong className="block text-sm font-bold mb-1" style={{ color: NAVY }}>
                {t('startNode.title')}
              </strong>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t('startNode.desc')}
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Separador vertical entre start node y paneles (sin fork visual) */}
        <div aria-hidden="true" className="h-10 md:h-12" />

        {/* ═══ TIMELINE DUAL (DESKTOP) — HORIZONTAL ═══ */}
        <DesktopHorizontal
          stepsA={stepsA}
          stepsB={stepsB}
          keyTag={keyTag}
          afterEndTitle={t('panelA.afterEnd.title')}
          afterEndDesc={t('panelA.afterEnd.desc')}
          panelABadge={t('panelA.badge')}
          panelAName={t('panelA.name')}
          panelASubtitle={t('panelA.subtitle')}
          panelBBadge={t('panelB.badge')}
          panelBName={t('panelB.name')}
          panelBSubtitle={t('panelB.subtitle')}
          resultALabel={t('panelA.result.label')}
          resultATitle={t('panelA.result.title')}
          resultADesc={t('panelA.result.desc')}
          resultBLabel={t('panelB.result.label')}
          resultBTitle={t('panelB.result.title')}
          resultBDesc={t('panelB.result.desc')}
        />

        {/* ═══ TIMELINE DUAL (MOBILE STACK) ═══ */}
        <div className="lg:hidden space-y-10">
          {/* Panel A */}
          <div className="rounded-3xl p-4 pt-5" style={{ backgroundColor: 'rgba(239,68,68,0.04)' }}>
            <PanelHeader accent="danger" badge={t('panelA.badge')} name={t('panelA.name')} subtitle={t('panelA.subtitle')} icon={IconAlertCircle} />
            <div className="mt-4 space-y-5">
              {stepsA.map((step, i) => (
                <StepCard key={`m-a-${i}`} accent="danger" step={step} icon={ICONS_A[i]} keyTag={keyTag} isLast={i === stepsA.length - 1} />
              ))}
              <FallbackCard title={t('panelA.afterEnd.title')} desc={t('panelA.afterEnd.desc')} />
              <ResultBlock accent="danger" label={t('panelA.result.label')} title={t('panelA.result.title')} desc={t('panelA.result.desc')} />
            </div>
          </div>

          {/* Panel B */}
          <div className="rounded-3xl p-4 pt-5" style={{ backgroundColor: 'rgba(162,249,255,0.1)' }}>
            <PanelHeader accent="brand" badge={t('panelB.badge')} name={t('panelB.name')} subtitle={t('panelB.subtitle')} icon={IconCheck} />
            <div className="mt-4 space-y-5">
              {stepsB.map((step, i) => (
                <StepCard key={`m-b-${i}`} accent="brand" step={step} icon={ICONS_B[i]} keyTag={keyTag} isLast={i === stepsB.length - 1} />
              ))}
              <ResultBlock accent="brand" label={t('panelB.result.label')} title={t('panelB.result.title')} desc={t('panelB.result.desc')} />
            </div>
          </div>
        </div>

        {/* ─── BLOQUE TANGIBLE DIFF (dark, alto contraste) ─── */}
        <ScrollReveal>
          <div
            className="mt-12 md:mt-16 rounded-3xl p-8 md:p-12 relative overflow-hidden"
            style={{ backgroundColor: AZTEC_DARK }}
          >
            {/* Glow brand sutil */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(162,249,255,0.15), transparent 70%)',
              }}
            />
            <div className="relative text-center mb-8 md:mb-10">
              <span className="inline-block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: BRAND }}>
                {t('tangibleDiff.eyebrow')}
              </span>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">
                {t('tangibleDiff.title')}
              </h3>
            </div>
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, i) => (
                <ScrollReveal key={i} delay={0.05 + i * 0.06}>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-1.5 leading-none" style={{ color: BRAND }}>
                      {stat.value}
                    </div>
                    <div className="text-[11px] md:text-xs text-white/70 leading-relaxed font-medium">
                      {stat.label}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ─── Pilares ─── */}
        <div className="mt-10 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {pillars.map((p, i) => (
            <ScrollReveal key={i} delay={0.05 + i * 0.07}>
              <div className="bg-white border-2 rounded-2xl px-4 py-5 text-center transition-all hover:-translate-y-1 hover:shadow-md h-full" style={{ borderColor: BRAND }}>
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ backgroundColor: BRAND, color: NAVY }}>
                  <span className="w-5 h-5 block">{PILLAR_ICONS[i]}</span>
                </div>
                <p className="text-xs md:text-[13px] leading-relaxed font-medium text-gray-700">
                  {p.before}
                  {p.strong && <strong style={{ color: NAVY }}>{p.strong}</strong>}
                  {p.after}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Subcomponents
// ═════════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════════
// DESKTOP HORIZONTAL — 7 cols, 2 rows, detail panel below
// ═════════════════════════════════════════════════════════════════════════

function DesktopHorizontal({
  stepsA,
  stepsB,
  keyTag,
  afterEndTitle,
  afterEndDesc,
  panelABadge,
  panelAName,
  panelASubtitle,
  panelBBadge,
  panelBName,
  panelBSubtitle,
  resultALabel,
  resultATitle,
  resultADesc,
  resultBLabel,
  resultBTitle,
  resultBDesc,
}: {
  stepsA: Step[];
  stepsB: Step[];
  keyTag: string;
  afterEndTitle: string;
  afterEndDesc: string;
  panelABadge: string;
  panelAName: string;
  panelASubtitle: string;
  panelBBadge: string;
  panelBName: string;
  panelBSubtitle: string;
  resultALabel: string;
  resultATitle: string;
  resultADesc: string;
  resultBLabel: string;
  resultBTitle: string;
  resultBDesc: string;
}) {
  // 7 columnas — A tiene 6 pasos + 1 fallback, B tiene 7 pasos
  const cols = Array.from({ length: stepsB.length }, (_, i) => i);

  return (
    <div className="hidden lg:block">
      <ScrollReveal>
        {/* ─── Panel A header ─── */}
        <CompactPanelHeader accent="danger" badge={panelABadge} name={panelAName} subtitle={panelASubtitle} icon={IconAlertCircle} />

        {/* ─── A row (cards arriba con desc) — rotaciones leves alternadas para reforzar el caos ─── */}
        <div className="grid grid-cols-7 gap-2.5 mt-3 pt-2">
          {cols.map((i) => {
            // Patrón de caos: rotación alterna sutil entre -1.2° y +1.0°
            const chaosPattern = [-1.2, 0.8, -0.6, 1.0, -1.0, 0.6, -0.8];
            const chaos = chaosPattern[i] ?? 0;
            const step = stepsA[i];
            if (step) {
              return (
                <MiniCard
                  key={`mini-a-${i}`}
                  accent="danger"
                  step={step}
                  icon={ICONS_A[i]}
                  chaos={chaos}
                />
              );
            }
            return (
              <MiniFallback
                key={`mini-a-fb-${i}`}
                title={afterEndTitle}
                desc={afterEndDesc}
                chaos={chaos}
              />
            );
          })}
        </div>

        {/* ═══ TIMELINE CENTRAL ═══ */}
        <CentralTimeline cols={cols} stepsB={stepsB} keyTag={keyTag} />

        {/* ─── B row (cards abajo con desc + win) ─── */}
        <div className="grid grid-cols-7 gap-2.5 mb-3">
          {cols.map((i) => (
            <MiniCard
              key={`mini-b-${i}`}
              accent="brand"
              step={stepsB[i]}
              icon={ICONS_B[i]}
              keyTag={keyTag}
            />
          ))}
        </div>

        {/* ─── Panel B header ─── */}
        <CompactPanelHeader accent="brand" badge={panelBBadge} name={panelBName} subtitle={panelBSubtitle} icon={IconCheck} />
      </ScrollReveal>

      {/* ─── Result blocks ─── */}
      <div className="grid grid-cols-2 gap-x-8 mt-8">
        <ResultBlock accent="danger" label={resultALabel} title={resultATitle} desc={resultADesc} />
        <ResultBlock accent="brand" label={resultBLabel} title={resultBTitle} desc={resultBDesc} />
      </div>
    </div>
  );
}

function CentralTimeline({
  cols,
  stepsB,
}: {
  cols: number[];
  stepsB: Step[];
  keyTag?: string;
}) {
  return (
    <div className="relative grid grid-cols-7 gap-2.5 py-4 my-1">
      {/* Línea horizontal continua que conecta todos los dots */}
      <div
        aria-hidden="true"
        className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full"
        style={{
          background: `linear-gradient(to right, transparent 0%, ${BRAND} 8%, ${BRAND} 92%, transparent 100%)`,
          opacity: 0.45,
        }}
      />
      {cols.map((i) => {
        const step = stepsB[i];
        const isKey = !!step.key;
        return (
          <div key={`dot-${i}`} className="relative flex items-center justify-center">
            {/* Dot circular numerado */}
            <span
              className="relative z-10 rounded-full flex items-center justify-center font-extrabold tabular-nums transition-all"
              style={{
                width: isKey ? 48 : 36,
                height: isKey ? 48 : 36,
                fontSize: isKey ? 14 : 12,
                backgroundColor: isKey ? BRAND : 'white',
                color: NAVY,
                border: `2px solid ${isKey ? BRAND : 'rgba(13,148,136,0.4)'}`,
                ...(isKey && {
                  boxShadow: '0 0 0 5px rgba(162,249,255,0.3), 0 4px 12px rgba(162,249,255,0.25)',
                }),
              }}
            >
              {step.n}
              {/* Star indicator de KEY dentro del dot, esquina superior */}
              {isKey && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold leading-none"
                  style={{ backgroundColor: NAVY, color: BRAND }}
                >
                  ★
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CompactPanelHeader({
  accent,
  badge,
  name,
  subtitle,
  icon,
}: {
  accent: 'danger' | 'brand';
  badge: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  const isDanger = accent === 'danger';
  const textColor = isDanger ? DANGER_DEEP : NAVY;
  const fillColor = isDanger ? '#EF4444' : BRAND;
  const bgTint = isDanger ? 'rgba(239,68,68,0.06)' : 'rgba(162,249,255,0.18)';
  const borderColor = isDanger ? 'rgba(239,68,68,0.3)' : BRAND;
  const badgeBg = isDanger ? 'white' : BRAND;
  const badgeText = isDanger ? DANGER_DEEP : NAVY;

  return (
    <div className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 border-2" style={{ backgroundColor: bgTint, borderColor }}>
      <div
        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
        style={{ backgroundColor: badgeBg, color: badgeText, border: isDanger ? `2px solid ${borderColor}` : 'none' }}
      >
        {badge}
      </div>
      {/* Para Panel B: "Con [LOGO]". Para Panel A: texto "Sin Propyte" */}
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] flex-1" style={{ color: textColor }}>
        {isDanger ? (
          name
        ) : (
          <>
            <span>{name.replace(/propyte/i, '').trim()}</span>
            <Image
              src="/img/logos/logo-horizontal-teal.png"
              alt="Propyte"
              width={2420}
              height={452}
              className="h-4 md:h-5 w-auto"
            />
          </>
        )}
      </h3>
      <span className="text-2xs text-gray-500 hidden md:inline">{subtitle}</span>
      <div className="w-4 h-4 shrink-0" style={{ color: fillColor }}>{icon}</div>
    </div>
  );
}

function MiniCard({
  accent,
  step,
  icon,
  keyTag,
  chaos,
}: {
  accent: 'danger' | 'brand';
  step: Step;
  icon: React.ReactNode;
  keyTag?: string;
  /** Rotación ligera para reforzar caos en Panel A. */
  chaos?: number;
}) {
  const isDanger = accent === 'danger';
  const isKey = !!step.key;
  const iconColor = isDanger ? DANGER_DEEP : NAVY;
  const iconBg = isDanger ? 'rgba(239,68,68,0.1)' : isKey ? 'rgba(162,249,255,0.55)' : 'rgba(162,249,255,0.3)';
  const borderColor = isDanger ? 'rgba(239,68,68,0.3)' : isKey ? BRAND : 'rgba(162,249,255,0.55)';
  const dividerColor = isDanger ? 'rgba(239,68,68,0.2)' : 'rgba(162,249,255,0.7)';

  return (
    <div
      className="rounded-xl border-2 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col h-full overflow-hidden"
      style={{
        borderColor,
        ...(chaos && { transform: `rotate(${chaos}deg)` }),
        ...(isKey && {
          boxShadow: '0 0 0 4px rgba(162,249,255,0.25), 0 2px 10px rgba(162,249,255,0.18)',
        }),
      }}
    >
      {/* HEADER — Icon + KEY badge */}
      <div className="flex items-start justify-between gap-1 px-3 pt-3 pb-2">
        <div
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          <span className="w-[18px] h-[18px] block">{icon}</span>
        </div>
        {isKey && keyTag && (
          <span
            className="text-2xs font-bold tracking-[0.14em] uppercase px-1.5 py-0.5 rounded-full whitespace-nowrap"
            style={{ backgroundColor: NAVY, color: BRAND }}
          >
            ★ {keyTag}
          </span>
        )}
      </div>

      {/* Divider sutil que separa el header del contenido */}
      <div className="mx-3 border-t border-dashed" style={{ borderColor: dividerColor }} />

      {/* CONTENT — Title + Desc */}
      <div className="px-3 py-2.5 flex-1 flex flex-col">
        <h4 className="text-sm font-bold leading-snug mb-1.5" style={{ color: NAVY }}>
          {step.title}
        </h4>
        <p className="text-xs text-gray-600 leading-relaxed flex-1">{step.desc}</p>
      </div>

      {/* WIN BADGE (solo B) — bg-tinted bottom strip */}
      {step.win && (
        <div className="px-3 py-2 border-t" style={{ backgroundColor: 'rgba(162,249,255,0.18)', borderColor: 'rgba(162,249,255,0.4)' }}>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold leading-none"
            style={{ backgroundColor: BRAND, color: NAVY }}
          >
            <span className="w-2 h-2 block">{IconCheckMini}</span>
            {step.win}
          </span>
        </div>
      )}
    </div>
  );
}

function MiniFallback({
  title,
  desc,
  chaos,
}: {
  title: string;
  desc: string;
  chaos?: number;
}) {
  return (
    <div
      className="rounded-xl border-2 border-dashed bg-gray-50 flex flex-col h-full overflow-hidden transition-all"
      style={{
        borderColor: 'rgba(239,68,68,0.3)',
        ...(chaos && { transform: `rotate(${chaos}deg)` }),
      }}
    >
      <div className="px-3 pt-3 pb-2">
        <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: DANGER_DEEP }}>
          <span className="w-[18px] h-[18px] block">{IconGhost}</span>
        </div>
      </div>
      <div className="mx-3 border-t border-dashed" style={{ borderColor: 'rgba(239,68,68,0.2)' }} />
      <div className="px-3 py-2.5 flex-1 flex flex-col">
        <h4 className="text-sm font-bold leading-snug italic mb-1.5" style={{ color: DANGER_DEEP }}>
          {title}
        </h4>
        <p className="text-xs text-gray-500 leading-relaxed italic flex-1">{desc}</p>
      </div>
    </div>
  );
}

function DetailPanel({
  colIdx,
  stepA,
  stepB,
  iconA,
  iconB,
  keyTag,
  afterEndTitle,
  afterEndDesc,
}: {
  colIdx: number;
  stepA: Step | null;
  stepB: Step;
  iconA: React.ReactNode | null;
  iconB: React.ReactNode;
  keyTag: string;
  afterEndTitle: string;
  afterEndDesc: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-2">
      {/* A detail */}
      <DetailCard
        accent="danger"
        icon={iconA}
        step={stepA}
        fallbackTitle={afterEndTitle}
        fallbackDesc={afterEndDesc}
        keyTag={keyTag}
      />
      {/* B detail */}
      <DetailCard accent="brand" icon={iconB} step={stepB} keyTag={keyTag} />
    </div>
  );
}

function DetailCard({
  accent,
  icon,
  step,
  fallbackTitle,
  fallbackDesc,
  keyTag,
}: {
  accent: 'danger' | 'brand';
  icon: React.ReactNode | null;
  step: Step | null;
  fallbackTitle?: string;
  fallbackDesc?: string;
  keyTag: string;
}) {
  const isDanger = accent === 'danger';
  const isFallback = !step && !!fallbackTitle;
  const isKey = step?.key;
  const labelColor = isDanger ? DANGER_DEEP : EYEBROW_TEAL;
  const iconColor = isDanger ? DANGER_DEEP : NAVY;
  const iconBg = isDanger ? 'rgba(239,68,68,0.1)' : isKey ? 'rgba(162,249,255,0.55)' : 'rgba(162,249,255,0.3)';
  const bgTint = isDanger ? 'rgba(239,68,68,0.04)' : 'rgba(162,249,255,0.1)';
  const borderColor = isDanger ? 'rgba(239,68,68,0.3)' : BRAND;

  if (isFallback) {
    return (
      <div className="rounded-2xl px-5 py-4 border-2 border-dashed" style={{ backgroundColor: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.3)' }}>
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: DANGER_DEEP }}>
            <span className="w-5 h-5 block">{IconGhost}</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold mb-1" style={{ color: DANGER_DEEP }}>{fallbackTitle}</h4>
            <p className="text-[12.5px] text-gray-500 leading-relaxed italic">{fallbackDesc}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!step) return <div />;

  return (
    <div className="rounded-2xl px-5 py-4 border-2" style={{ backgroundColor: bgTint, borderColor }}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: iconBg, color: iconColor }}>
          <span className="w-5 h-5 block">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: labelColor }}>
              {step.n}
            </span>
            {isKey && (
              <span className="text-[9px] font-bold tracking-[0.16em] uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: NAVY, color: BRAND }}>
                ★ {keyTag}
              </span>
            )}
          </div>
          <h4 className="text-sm md:text-[15px] font-bold leading-snug mb-1.5" style={{ color: NAVY }}>{step.title}</h4>
          <p className="text-[12.5px] text-gray-600 leading-relaxed">{step.desc}</p>
          {step.win && (
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold" style={{ backgroundColor: BRAND, color: NAVY }}>
              <span className="w-3 h-3 block">{IconCheckMini}</span>
              {step.win}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PanelHeader({
  accent,
  badge,
  name,
  subtitle,
  icon,
}: {
  accent: 'danger' | 'brand';
  badge: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  const isDanger = accent === 'danger';
  const textColor = isDanger ? DANGER_DEEP : NAVY;
  const fillColor = isDanger ? '#EF4444' : BRAND;
  const bgTint = isDanger ? 'rgba(239,68,68,0.08)' : 'rgba(162,249,255,0.25)';
  const borderColor = isDanger ? 'rgba(239,68,68,0.35)' : BRAND;
  const badgeBg = isDanger ? 'white' : BRAND;
  const badgeText = isDanger ? DANGER_DEEP : NAVY;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-5 py-4 border-2 mb-4"
      style={{ backgroundColor: bgTint, borderColor }}
    >
      <div
        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-base"
        style={{ backgroundColor: badgeBg, color: badgeText, border: isDanger ? `2px solid ${borderColor}` : 'none' }}
      >
        {badge}
      </div>
      <div className="flex-1">
        <h3 className="text-sm md:text-[15px] font-bold uppercase tracking-[0.14em]" style={{ color: textColor }}>
          {name}
        </h3>
        <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="w-5 h-5 shrink-0" style={{ color: fillColor }}>
        {icon}
      </div>
    </div>
  );
}

function PairedRow({
  leftStep,
  rightStep,
  leftIcon,
  rightIcon,
  keyTag,
  isLast,
  leftFallback,
}: {
  leftStep: Step | null;
  rightStep: Step | null;
  leftIcon: React.ReactNode | null;
  rightIcon: React.ReactNode | null;
  keyTag: string;
  isLast: boolean;
  leftFallback?: { title: string; desc: string };
}) {
  return (
    <>
      {/* Left cell (A) */}
      <ScrollReveal>
        {leftStep && leftIcon ? (
          <StepCard accent="danger" step={leftStep} icon={leftIcon} keyTag={keyTag} isLast={isLast} />
        ) : leftFallback ? (
          <FallbackCard title={leftFallback.title} desc={leftFallback.desc} />
        ) : (
          <div />
        )}
      </ScrollReveal>

      {/* Right cell (B) */}
      <ScrollReveal delay={0.06}>
        {rightStep && rightIcon ? (
          <StepCard accent="brand" step={rightStep} icon={rightIcon} keyTag={keyTag} isLast={isLast} />
        ) : (
          <div />
        )}
      </ScrollReveal>
    </>
  );
}

function StepCard({
  accent,
  step,
  icon,
  keyTag,
  isLast,
}: {
  accent: 'danger' | 'brand';
  step: Step;
  icon: React.ReactNode | null;
  keyTag: string;
  isLast: boolean;
}) {
  const isDanger = accent === 'danger';
  const isKey = !!step.key;
  // KEY card abre por default — es el mensaje más importante.
  const [open, setOpen] = useState(isKey);

  const iconColor = isDanger ? DANGER_DEEP : NAVY;
  const borderColor = isDanger ? 'rgba(239,68,68,0.3)' : isKey ? BRAND : 'rgba(162,249,255,0.6)';
  const iconBg = isDanger ? 'rgba(239,68,68,0.1)' : isKey ? 'rgba(162,249,255,0.55)' : 'rgba(162,249,255,0.3)';
  const stepNumColor = isDanger ? DANGER_DEEP : EYEBROW_TEAL;
  const connectorColor = isDanger ? 'rgba(239,68,68,0.45)' : BRAND;

  return (
    <div className="relative">
      <div
        className="relative bg-white rounded-2xl border-2 transition-all hover:shadow-md overflow-hidden"
        style={{
          borderColor,
          ...(isKey && {
            boxShadow: '0 0 0 4px rgba(162,249,255,0.3), 0 4px 16px rgba(162,249,255,0.25)',
          }),
        }}
      >
        {/* HEADER — siempre visible (clickable) */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50/60 transition-colors"
        >
          {/* Icon */}
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            <span className="w-5 h-5 block">{icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span
                className="text-[10px] font-bold tracking-[0.18em] uppercase"
                style={{ color: stepNumColor }}
              >
                {step.n}
              </span>
              {isKey && (
                <span
                  className="text-[9px] font-bold tracking-[0.16em] uppercase px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: NAVY, color: BRAND }}
                >
                  ★ {keyTag}
                </span>
              )}
              {step.win && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: BRAND, color: NAVY }}
                >
                  <span className="w-2.5 h-2.5 block">{IconCheckMini}</span>
                  {step.win}
                </span>
              )}
            </div>
            <h4 className="text-[13.5px] md:text-[14.5px] font-bold leading-snug" style={{ color: NAVY }}>
              {step.title}
            </h4>
          </div>

          {/* Chevron */}
          <div
            className={`shrink-0 w-5 h-5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            style={{ color: isDanger ? DANGER_DEEP : NAVY }}
          >
            {IconChevron}
          </div>
        </button>

        {/* BODY — collapsible (CSS-only grid trick para altura animable) */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <p className="px-4 pb-4 pt-0 text-[12.5px] text-gray-600 leading-relaxed">
              {step.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Connector vertical entre cards */}
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 -bottom-5 w-1 h-5 rounded-full"
          style={{ backgroundColor: connectorColor }}
        />
      )}
    </div>
  );
}

function FallbackCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      className="relative bg-gray-50 rounded-2xl px-5 py-5 border-2 border-dashed overflow-hidden"
      style={{ borderColor: 'rgba(239,68,68,0.35)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: DANGER_DEEP }}
        >
          <span className="w-5 h-5 block">{IconGhost}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] md:text-sm font-bold leading-snug mb-1" style={{ color: DANGER_DEEP }}>
            {title}
          </h4>
          <p className="text-[12px] text-gray-500 leading-relaxed italic">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function ResultBlock({
  accent,
  label,
  title,
  desc,
}: {
  accent: 'danger' | 'brand';
  label: string;
  title: string;
  desc: string;
}) {
  const isDanger = accent === 'danger';
  const labelColor = isDanger ? DANGER_DEEP : EYEBROW_TEAL;
  const bgTint = isDanger ? 'rgba(239,68,68,0.08)' : 'rgba(162,249,255,0.25)';
  const borderColor = isDanger ? 'rgba(239,68,68,0.35)' : BRAND;

  return (
    <ScrollReveal delay={0.05}>
      <div className="rounded-2xl px-5 py-5 border-2 mt-6" style={{ backgroundColor: bgTint, borderColor }}>
        <div className="text-[10px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: labelColor }}>
          {label}
        </div>
        <h4 className="text-base md:text-lg font-bold leading-tight mb-1.5" style={{ color: NAVY }}>
          {title}
        </h4>
        <p className="text-[13px] text-gray-600 leading-relaxed">{desc}</p>
      </div>
    </ScrollReveal>
  );
}
