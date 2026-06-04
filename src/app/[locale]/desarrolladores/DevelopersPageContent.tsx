'use client';

import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Compass, MapPin, Megaphone, Layers, LockKeyhole,
  Palette, TrendingUp, Handshake, Headset, Rocket, BarChart3, KeySquare,
  FileChartColumnIncreasing, ClipboardCheck, FileText,
  ChevronDown, ChevronUp, CheckCircle, ArrowRight,
  MessageCircle, Zap, Shield, Users, Sparkles,
} from '@/lib/icons';
import { submitForm } from '@/lib/submitForm';
import { toast } from 'sonner';
import { BorderBeam } from '@/components/magicui/border-beam';
import ScrollReveal from '@/components/shared/ScrollReveal';
import HeroAtmosphere from '@/components/home/HeroAtmosphere';

// ─────────────────────────────────────────────────────
// 1 · HERO — angled bottom edge (calca page-desarrolladores.php WP)
// ─────────────────────────────────────────────────────
function DevelopersHero() {
  const t = useTranslations('developers');
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '';
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0F1923] to-[#1A2F3F]">
      {/* Cuadrícula blueprint + parallax al cursor — misma atmósfera que el Hero
          del Home (grid animado, orbs teal, watermark). Reemplaza las antiguas
          partículas para unificar el lenguaje visual entre páginas. */}
      <HeroAtmosphere />
      {/* Glow radial brand para dar volumen al hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 50% at 50% 18%, rgba(92,224,210,0.14), transparent 60%)',
        }}
      />
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-20 md:py-28 text-center relative z-10">
        <ScrollReveal y={16} duration={0.5}>
          <span className="inline-block text-propyte-brand text-xs md:text-sm font-bold tracking-widest uppercase mb-5">
            {t('heroEyebrow')}
          </span>
        </ScrollReveal>
        <ScrollReveal y={20} delay={0.08} duration={0.6}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 max-w-4xl mx-auto">
            {t('heroTitle')}
          </h1>
        </ScrollReveal>
        <ScrollReveal y={20} delay={0.16} duration={0.6}>
          <p className="text-base md:text-xl text-white/85 max-w-3xl mx-auto mb-10 leading-relaxed">
            {t('heroSubtitle')}
          </p>
        </ScrollReveal>
        <ScrollReveal y={20} delay={0.24} duration={0.6}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#registro"
              className="h-12 px-7 bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {t('heroCtaPrimary')} <ArrowRight size={16} />
            </a>
            {phone && (
              <a
                href={`https://wa.me/${phone}?text=${encodeURIComponent('Hola, me interesa comercializar mi desarrollo con Propyte')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-7 propyte-cta-whatsapp font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} /> {t('heroCtaSecondary')}
              </a>
            )}
          </div>
        </ScrollReveal>
      </div>
      {/* Angled bottom edge — diagonal cut hacia el siguiente bg */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{ background: 'linear-gradient(to top right, #ffffff 49.5%, transparent 50.5%)' }}
        aria-hidden="true"
      />
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 2 · EL PROBLEMA
// ─────────────────────────────────────────────────────
function Problem() {
  const t = useTranslations('developers');
  const pains = [
    { icon: Compass, title: t('problem1Title'), desc: t('problem1Desc') },
    { icon: MapPin, title: t('problem2Title'), desc: t('problem2Desc') },
    { icon: Megaphone, title: t('problem3Title'), desc: t('problem3Desc') },
    { icon: Layers, title: t('problem4Title'), desc: t('problem4Desc') },
    { icon: LockKeyhole, title: t('problem5Title'), desc: t('problem5Desc') },
  ];
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="max-w-3xl mb-12">
          <span className="text-[#0E7490] text-sm font-bold tracking-widest uppercase">{t('problemEyebrow')}</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#1A2F3F] leading-tight">{t('problemTitle')}</h2>
          <p className="mt-4 text-gray-600 text-lg leading-relaxed">{t('problemIntro')}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {pains.map(({ icon: Icon, title, desc }, i) => (
            <ScrollReveal key={title} delay={i * 0.06} y={20}>
              <div className="flex gap-4 bg-[#F4F6F8] rounded-2xl p-6 h-full transition-all hover:bg-white hover:shadow-md">
                <div className="w-11 h-11 shrink-0 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Icon size={20} className="text-[#0E7490]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1A2F3F] mb-1.5">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 3 · EL CICLO COMPLETO (4 bloques)
// ─────────────────────────────────────────────────────
function Cycle() {
  const t = useTranslations('developers');
  const blocks = [
    { num: '01', icon: Compass, tag: t('cycle1Tag'), desc: t('cycle1Desc') },
    { num: '02', icon: Palette, tag: t('cycle2Tag'), desc: t('cycle2Desc') },
    { num: '03', icon: TrendingUp, tag: t('cycle3Tag'), desc: t('cycle3Desc') },
    { num: '04', icon: Handshake, tag: t('cycle4Tag'), desc: t('cycle4Desc') },
  ];
  return (
    <section className="py-16 md:py-20 bg-[#0F1923]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="max-w-3xl mb-12">
          <span className="text-propyte-brand text-sm font-bold tracking-widest uppercase">{t('cycleEyebrow')}</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-white leading-tight">{t('cycleTitle')}</h2>
          <p className="mt-4 text-white/70 text-lg leading-relaxed">{t('cycleIntro')}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {blocks.map(({ num, icon: Icon, tag, desc }, i) => (
            <ScrollReveal key={num} delay={i * 0.08} y={24}>
              <div className="group relative bg-white/[0.04] border border-white/10 rounded-2xl p-6 h-full hover:border-propyte-brand/40 hover:bg-white/[0.07] transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-propyte-brand/40 text-2xl font-extrabold tabular-nums group-hover:text-propyte-brand/70 transition-colors">{num}</span>
                  <div className="w-10 h-10 bg-propyte-brand/15 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon size={20} className="text-propyte-brand" />
                  </div>
                </div>
                <h3 className="font-bold text-white uppercase text-sm tracking-wide mb-2">{tag}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <div className="mt-8 bg-propyte-brand/10 border border-propyte-brand/25 rounded-2xl p-6 md:p-7">
          <p className="text-white/90 text-base md:text-lg leading-relaxed">{t('cycleCallout')}</p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 4 · LOS 4 PRODUCTOS
// ─────────────────────────────────────────────────────
const PRODUCTS = [
  { id: 'support', name: 'PROPYTE SUPPORT', icon: Headset, taglineKey: 'productSupportTagline', descKey: 'productSupportDesc', recommended: false },
  { id: 'launch', name: 'PROPYTE LAUNCH', icon: Rocket, taglineKey: 'productLaunchTagline', descKey: 'productLaunchDesc', recommended: false },
  { id: 'engine', name: 'PROPYTE ENGINE', icon: BarChart3, taglineKey: 'productEngineTagline', descKey: 'productEngineDesc', recommended: false },
  { id: 'turnkey', name: 'PROPYTE PRO·360', icon: KeySquare, taglineKey: 'productTurnkeyTagline', descKey: 'productTurnkeyDesc', recommended: true },
] as const;

function Products() {
  const t = useTranslations('developers');
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[#0E7490] text-sm font-bold tracking-widest uppercase">{t('productsEyebrow')}</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#1A2F3F]">{t('productsTitle')}</h2>
          <p className="mt-4 text-gray-600 text-lg leading-relaxed">{t('productsIntro')}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PRODUCTS.map(({ id, name, icon: Icon, taglineKey, descKey, recommended }, i) => (
            <ScrollReveal key={id} delay={i * 0.08} y={24} className="h-full">
              <div
                className={`relative flex flex-col rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-1 ${
                  recommended
                    ? 'bg-[#0F1923] border-2 border-propyte-brand shadow-lg lg:-mt-3 lg:mb-3'
                    : 'bg-white border border-gray-200 hover:border-propyte-brand/40 hover:shadow-xl'
                }`}
              >
                {recommended && (
                  <>
                    <BorderBeam
                      size={70}
                      duration={6}
                      colorFrom="#5CE0D2"
                      colorTo="#A2F9FF"
                      borderWidth={2}
                    />
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 bg-propyte-brand text-[#0F1923] text-2xs font-bold uppercase tracking-wider rounded-full">
                      <Sparkles size={11} /> {t('productTurnkeyBadge')}
                    </span>
                  </>
                )}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${recommended ? 'bg-propyte-brand/20' : 'bg-propyte-cyan-100'}`}>
                  <Icon size={20} className={recommended ? 'text-propyte-brand' : 'text-[#0E7490]'} />
                </div>
                <h3 className={`font-extrabold text-lg tracking-tight mb-1.5 ${recommended ? 'text-white' : 'text-[#1A2F3F]'}`}>{name}</h3>
                <p className={`text-sm font-semibold italic mb-3 ${recommended ? 'text-propyte-brand' : 'text-[#0E7490]'}`}>{t(taglineKey)}</p>
                <p className={`text-sm leading-relaxed ${recommended ? 'text-white/70' : 'text-gray-600'}`}>{t(descKey)}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        {/* Callout: cómo elegir */}
        <div className="mt-8 bg-[#F4F6F8] rounded-2xl p-6 md:p-7 max-w-4xl mx-auto">
          <h3 className="font-bold text-[#1A2F3F] mb-2 flex items-center gap-2">
            <Compass size={18} className="text-[#0E7490]" /> {t('productsChooseTitle')}
          </h3>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">{t('productsChooseBody')}</p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 5 · TABLA COMPARATIVA DE ALCANCE
// ─────────────────────────────────────────────────────
// La tabla pasó de "palomita/—" a una matriz de valor: cada celda lleva una
// micro-descripción del nivel + el valor de referencia de esa pieza por
// separado. Los datos viven en i18n (developers.comp) y se leen con t.raw().
type CompCell = { d: string; v?: string; muted?: boolean };
type CompRow = { label: string; cells: CompCell[] };
type CompGroup = { sep: string; rows: CompRow[] };

function ComparisonTable() {
  const t = useTranslations('developers');
  const groups = t.raw('comp.groups') as CompGroup[];
  const totals = t.raw('comp.totals') as string[];
  const cols = PRODUCTS.map((p) => p.name.replace('PROPYTE ', ''));
  const [openProduct, setOpenProduct] = useState<number>(3); // PRO·360 abierto por defecto
  const flatRows = groups.flatMap((g) => g.rows);

  return (
    <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-br from-[#0B1C1E] via-[#0F1923] to-[#1A2F3F]">
      {/* Glow radial + cuadrícula blueprint — misma atmósfera tech del Hero;
          necesaria para que el glass de la tabla "esmerile" sobre el oscuro. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(92,224,210,0.14), transparent 60%), radial-gradient(ellipse 50% 50% at 90% 100%, rgba(162,249,255,0.10), transparent 60%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_80%_70%_at_center,black_40%,transparent_100%)]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative z-10 max-w-[1100px] mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">{t('tableTitle')}</h2>
        <p className="text-center text-sm text-propyte-brand font-semibold mb-6">★ {t('tableRecommended')}</p>

        {/* Encuadre: valor, no precio */}
        <div className="max-w-[920px] mx-auto mb-7 rounded-2xl border border-propyte-brand/25 bg-propyte-brand/[0.08] backdrop-blur-md px-5 py-4 text-center text-sm md:text-[15px] leading-relaxed text-white/85">
          {t('comp.bannerA')}
          <span className="text-propyte-brand font-bold">{t('comp.bannerHi')}</span>
          {t('comp.bannerB')}
        </div>

        {/* Desktop: tabla glass */}
        <div className="hidden md:block rounded-2xl overflow-hidden border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-extrabold text-white p-3.5 border-b border-white/10">{t('comp.colHeader')}</th>
                {cols.map((c, i) => (
                  <th
                    key={c}
                    className={`text-center text-[11px] font-extrabold p-3.5 border-b ${
                      i === 3 ? 'bg-propyte-brand/15 text-[#A2F9FF] border-propyte-brand/30' : 'text-white border-white/10'
                    }`}
                  >
                    {c}
                    {i === 3 && <Sparkles size={11} className="inline-block ml-1 text-propyte-brand" />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.sep}>
                  <tr>
                    <td colSpan={5} className="text-left text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#A2F9FF]/55 bg-propyte-brand/[0.05] px-3.5 py-2">
                      {group.sep}
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.label}>
                      <td className="text-left text-[11.5px] font-bold text-white p-3.5 border-b border-white/[0.06] whitespace-nowrap">{row.label}</td>
                      {row.cells.map((cell, ci) => (
                        <td
                          key={ci}
                          className={`text-center align-top p-3.5 border-b border-white/[0.06] ${ci === 3 ? 'bg-propyte-brand/[0.08]' : ''}`}
                        >
                          <span className={`block text-[10.5px] leading-snug ${cell.muted ? 'text-white/30' : 'text-white/75'}`}>{cell.d}</span>
                          {cell.v && <span className="block mt-1.5 text-[9.5px] font-extrabold text-propyte-brand">{cell.v}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
              <tr>
                <td className="text-left text-[11px] font-extrabold text-white bg-black/30 p-3.5">{t('comp.totalLabel')}</td>
                {totals.map((tot, i) => (
                  <td
                    key={i}
                    className={`text-center font-extrabold p-3.5 leading-tight ${
                      i === 3 ? 'bg-propyte-brand/[0.14] text-propyte-brand text-[13px]' : 'bg-black/30 text-white text-[11px]'
                    }`}
                  >
                    {tot}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile: acordeón por producto */}
        <div className="md:hidden space-y-3">
          {PRODUCTS.map((p, pi) => {
            const isOpen = openProduct === pi;
            return (
              <div key={p.id} className={`rounded-2xl overflow-hidden border ${p.recommended ? 'border-propyte-brand/60' : 'border-white/10'} bg-white/[0.06] backdrop-blur-xl`}>
                <button
                  type="button"
                  onClick={() => setOpenProduct(isOpen ? -1 : pi)}
                  className="w-full flex items-center justify-between p-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-extrabold text-white flex items-center gap-1.5">
                    {p.name.replace('PROPYTE ', '')}
                    {p.recommended && <Sparkles size={13} className="text-propyte-brand" />}
                  </span>
                  {isOpen ? <ChevronUp size={18} className="text-propyte-brand" /> : <ChevronDown size={18} className="text-white/40" />}
                </button>
                {isOpen && (
                  <ul className="px-4 pb-4 divide-y divide-white/[0.06]">
                    {flatRows.map((row) => {
                      const cell = row.cells[pi];
                      return (
                        <li key={row.label} className="flex items-start justify-between gap-3 py-2.5">
                          <span className="text-white/65 text-sm pr-3">{row.label}</span>
                          <span className="shrink-0 text-right">
                            <span className={`block text-[12px] ${cell.muted ? 'text-white/30' : 'text-white/90'}`}>{cell.d}</span>
                            {cell.v && <span className="block text-[11px] font-bold text-propyte-brand">{cell.v}</span>}
                          </span>
                        </li>
                      );
                    })}
                    <li className="flex items-center justify-between pt-3">
                      <span className="text-white text-sm font-extrabold">{t('comp.totalLabel')}</span>
                      <span className="text-propyte-brand text-sm font-extrabold text-right leading-tight">{totals[pi]}</span>
                    </li>
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-xs text-white/45 leading-relaxed max-w-3xl mx-auto text-center">{t('tableFootnote')}</p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 6 · EL ESTUDIO COMO PUNTO DE PARTIDA
// ─────────────────────────────────────────────────────
function Study() {
  const t = useTranslations('developers');
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <span className="text-[#0E7490] text-sm font-bold tracking-widest uppercase">{t('studyEyebrow')}</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#1A2F3F] leading-tight">{t('studyTitle')}</h2>
            <p className="mt-5 text-gray-600 leading-relaxed">{t('studyBody1')}</p>
            <p className="mt-4 text-gray-600 leading-relaxed">{t('studyBody2')}</p>
          </div>
          <div className="bg-[#0F1923] rounded-3xl p-8 md:p-10">
            <div className="w-12 h-12 bg-propyte-brand/15 rounded-xl flex items-center justify-center mb-5">
              <FileChartColumnIncreasing size={24} className="text-propyte-brand" />
            </div>
            <p className="text-white/90 text-lg leading-relaxed">{t('studyCallout')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 7 · CÓMO TRABAJAMOS (4 pasos)
// ─────────────────────────────────────────────────────
function HowItWorks() {
  const t = useTranslations('developers');
  const steps = [
    { num: '01', icon: ClipboardCheck, title: t('step1'), desc: t('step1Desc') },
    { num: '02', icon: FileText, title: t('step2'), desc: t('step2Desc') },
    { num: '03', icon: Rocket, title: t('step3'), desc: t('step3Desc') },
    { num: '04', icon: Handshake, title: t('step4'), desc: t('step4Desc') },
  ];
  return (
    <section className="py-16 md:py-20 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="text-[#0E7490] text-sm font-bold tracking-widest uppercase">{t('processEyebrow')}</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#1A2F3F]">{t('processTitle')}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ num, icon: Icon, title, desc }) => (
            <div key={num} className="relative bg-white p-6 rounded-2xl text-center">
              <div className="w-10 h-10 mx-auto mb-4 bg-[#1A2F3F] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{num}</span>
              </div>
              <Icon size={32} className="mx-auto mb-3 text-[#0E7490]" />
              <h3 className="text-lg font-bold text-[#1A2F3F] mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 8 · FAQ
// ─────────────────────────────────────────────────────
function FAQ() {
  const t = useTranslations('developers');
  const [open, setOpen] = useState<Set<number>>(new Set([0, 1, 2]));
  const faqs = Array.from({ length: 8 }, (_, i) => ({ q: t(`faq${i + 1}Q`), a: t(`faq${i + 1}A`) }));
  const toggle = (i: number) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <span className="text-[#0E7490] text-sm font-bold tracking-widest uppercase">{t('faqEyebrow')}</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#1A2F3F]">{t('faqTitle')}</h2>
        </div>
        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => {
            const isOpen = open.has(i);
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-[#1A2F3F] pr-4">{q}</span>
                  {isOpen
                    ? <ChevronUp size={20} className="text-[#0E7490] flex-shrink-0" />
                    : <ChevronDown size={20} className="text-gray-600 flex-shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-4">
                    {a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 9 · FORMULARIO
// ─────────────────────────────────────────────────────
function DeveloperForm() {
  const t = useTranslations('developers');
  const tCommon = useTranslations('common');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '', company: '', email: '', phone: '', location: '',
    projectType: '', unitCount: '', message: '', website: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[e.target.name];
        return next;
      });
    }
  };

  // MX phone: optional +52, 10 digits with optional spaces/dashes/parens.
  const isValidMxPhone = (v: string) => /^(\+?52[\s-]?)?\(?\d{2,3}\)?[\s-]?\d{3,4}[\s-]?\d{4}$/.test(v.trim());

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!formData.name.trim()) next.name = tCommon('required');
    if (!formData.company.trim()) next.company = tCommon('required');
    if (!formData.email.trim()) next.email = tCommon('required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) next.email = tCommon('invalidEmail');
    if (!formData.phone.trim()) next.phone = tCommon('required');
    else if (!isValidMxPhone(formData.phone)) next.phone = tCommon('invalidPhone');
    if (!formData.location.trim()) next.location = tCommon('required');
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Honeypot: silently drop bot submissions with fake-success UX.
    if (formData.website && formData.website.length > 0) {
      setStatus('success');
      return;
    }
    const v = validate();
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setStatus('sending');
    try {
      const result = await submitForm(formData, 'developer_request');
      if (result.success) {
        setStatus('success');
        toast.success(t('formSuccess'));
      } else {
        setStatus('error');
        toast.error(t('formError'));
      }
    } catch {
      setStatus('error');
      toast.error(t('formError'));
    }
  };

  const inputClass = "w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:border-propyte-brand focus:ring-2 focus:ring-propyte-brand/20 outline-none transition-colors";
  const selectClass = `${inputClass} appearance-none`;
  const labelClass = "block text-sm font-semibold text-[#1A2F3F] mb-1.5";

  return (
    <section id="registro" className="py-16 md:py-20 bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="text-white">
            <span className="text-propyte-brand text-sm font-bold tracking-widest uppercase">{t('formEyebrow')}</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold mb-4">{t('formTitle')}</h2>
            <p className="text-white/60 text-lg mb-8">{t('formSubtitle')}</p>
            <div className="space-y-4">
              {[
                { icon: Shield, text: t('formBullet1') },
                { icon: Zap, text: t('formBullet2') },
                { icon: Users, text: t('formBullet3') },
                { icon: CheckCircle, text: t('formBullet4') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-propyte-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-propyte-brand" />
                  </div>
                  <span className="text-white/70 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            {status === 'success' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-[#1A2F3F] mb-2">{t('formSuccess')}</h3>
                <p className="text-gray-600">{t('formSuccessDesc')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dev-form-name" className={labelClass}>{t('formName')} *</label>
                    <input id="dev-form-name" type="text" name="name" value={formData.name} onChange={handleChange} aria-invalid={!!errors.name} className={inputClass} />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="dev-form-company" className={labelClass}>{t('formCompany')} *</label>
                    <input id="dev-form-company" type="text" name="company" value={formData.company} onChange={handleChange} aria-invalid={!!errors.company} className={inputClass} />
                    {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company}</p>}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dev-form-email" className={labelClass}>{t('formEmail')} *</label>
                    <input id="dev-form-email" type="email" name="email" value={formData.email} onChange={handleChange} aria-invalid={!!errors.email} className={inputClass} />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="dev-form-phone" className={labelClass}>{t('formPhone')} *</label>
                    <input id="dev-form-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} aria-invalid={!!errors.phone} className={inputClass} />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>
                <div>
                  <label htmlFor="dev-form-location" className={labelClass}>{t('formLocation')} *</label>
                  <input id="dev-form-location" type="text" name="location" value={formData.location} onChange={handleChange} aria-invalid={!!errors.location} className={inputClass} />
                  {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
                </div>

                {/* Honeypot anti-spam */}
                <div aria-hidden="true" className="hidden">
                  <label htmlFor="dev-form-website">Website</label>
                  <input id="dev-form-website" type="text" name="website" tabIndex={-1} autoComplete="off" value={formData.website} onChange={handleChange} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dev-form-project-type" className={labelClass}>{t('formProjectType')}</label>
                    <select id="dev-form-project-type" name="projectType" value={formData.projectType} onChange={handleChange} className={selectClass}>
                      <option value="">--</option>
                      <option value="vertical">{t('formProjectTypeOptions.vertical')}</option>
                      <option value="horizontal">{t('formProjectTypeOptions.horizontal')}</option>
                      <option value="mixed">{t('formProjectTypeOptions.mixed')}</option>
                      <option value="land">{t('formProjectTypeOptions.land')}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dev-form-unit-count" className={labelClass}>{t('formUnitCount')}</label>
                    <select id="dev-form-unit-count" name="unitCount" value={formData.unitCount} onChange={handleChange} className={selectClass}>
                      <option value="">--</option>
                      <option value="small">{t('formUnitCountOptions.small')}</option>
                      <option value="medium">{t('formUnitCountOptions.medium')}</option>
                      <option value="large">{t('formUnitCountOptions.large')}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="dev-form-message" className={labelClass}>{t('formMessage')}</label>
                  <textarea id="dev-form-message" name="message" value={formData.message} onChange={handleChange} rows={3} className={`${inputClass} h-auto py-3`} />
                </div>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full h-14 bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-bold text-base rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {status === 'sending' ? t('formSending') : t('formSubmit')}
                  {status === 'idle' && <ArrowRight size={18} />}
                </button>
                {status === 'error' && <p className="text-red-500 text-sm text-center">{t('formError')}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// PAGE COMPOSITION
// ─────────────────────────────────────────────────────
export default function DevelopersPageContent() {
  return (
    <div>
      <DevelopersHero />
      <Problem />
      <Cycle />
      <Products />
      <ComparisonTable />
      <Study />
      <HowItWorks />
      <FAQ />
      <DeveloperForm />
    </div>
  );
}
