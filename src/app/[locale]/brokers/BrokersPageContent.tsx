'use client';

import { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  Briefcase, Headset, LockKeyhole, FileText, Rocket, GraduationCap,
  Percent, Handshake, Car, Users, Shield, Monitor,
  ClipboardCheck, ChevronDown, ChevronUp, CheckCircle, ArrowRight,
  MessageCircle, Building2, Sparkles,
} from '@/lib/icons';
import { submitForm } from '@/lib/submitForm';
import { toast } from 'sonner';
import { Particles } from '@/components/magicui/particles';
import { BorderBeam } from '@/components/magicui/border-beam';
import ScrollReveal from '@/components/shared/ScrollReveal';
import ImagePlaceholder from '@/components/shared/ImagePlaceholder';

interface BrokerFaqItem { q: string; a: string }
interface BrokersHubData { faqs: BrokerFaqItem[] }
const BrokersHubContext = createContext<BrokersHubData>({ faqs: [] });

const WA = (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '529844638032');
const WA_TEXT = encodeURIComponent('Hola, me interesa el programa de brokers de Propyte');

// ─────────────────────────────────────────────────────
// 1. HERO
// ─────────────────────────────────────────────────────
function BrokerHero() {
  const t = useTranslations('brokers');
  const locale = useLocale();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923]">
      <Particles className="absolute inset-0 z-0" quantity={90} ease={70} color="#5CE0D2" staticity={40} size={0.5} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 50% 50% at 70% 25%, rgba(92,224,210,0.13), transparent 60%)' }}
      />
      <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-6 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <ScrollReveal y={16} duration={0.5}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-propyte-brand/15 border border-propyte-brand/30 rounded-full mb-6">
                <Handshake size={16} className="text-propyte-brand" />
                <span className="text-propyte-brand text-sm font-semibold tracking-wide uppercase">{t('heroEyebrow')}</span>
              </div>
            </ScrollReveal>
            <ScrollReveal y={20} delay={0.08} duration={0.6}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">{t('heroTitle')}</h1>
            </ScrollReveal>
            <ScrollReveal y={20} delay={0.16} duration={0.6}>
              <p className="mt-6 text-lg md:text-xl text-white/85 leading-relaxed max-w-2xl">{t('heroSubtitle')}</p>
            </ScrollReveal>
            <ScrollReveal y={20} delay={0.24} duration={0.6}>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <a
                  href="#registro"
                  className="h-14 px-8 bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-bold text-base rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-propyte-brand/20 flex items-center justify-center gap-2"
                >
                  {t('heroCtaPrimary')} <ArrowRight size={18} />
                </a>
                <a
                  href={`https://wa.me/${WA}?text=${WA_TEXT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="propyte-cta-whatsapp h-14 px-8 font-bold text-base rounded-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} /> {t('heroCtaSecondary')}
                </a>
              </div>
            </ScrollReveal>
            <ScrollReveal y={16} delay={0.32} duration={0.5}>
              <p className="mt-8 text-sm text-white/55 max-w-xl">
                {t('heroMicroLine')}{' '}
                <Link href={`/${locale}/unete`} className="text-propyte-brand font-semibold hover:underline">
                  {t('heroMicroLineLink')}
                </Link>
              </p>
            </ScrollReveal>
          </div>
          {/* Visual del hero — slot para foto real (broker / portafolio) */}
          <ScrollReveal y={24} delay={0.2} duration={0.7} className="hidden lg:block">
            <ImagePlaceholder
              tone="dark"
              icon={Briefcase}
              label="Foto: broker con cliente / portafolio Propyte"
              className="aspect-[4/3]"
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 2. NOTA-PUENTE — fija el modelo antes de los beneficios
// ─────────────────────────────────────────────────────
function BridgeNote() {
  const t = useTranslations('brokers');
  return (
    <section className="bg-white pt-14 md:pt-16">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <ScrollReveal y={20}>
          <div className="relative bg-[#F4F6F8] border-l-4 border-propyte-brand rounded-r-2xl p-6 md:p-7">
            <p className="text-[#1A2F3F] leading-relaxed">
              <span className="font-bold">{t('bridgeTitle')}</span>{' '}
              {t('bridgeBody')}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 3. POR QUÉ PROPYTE — 6 cards reales
// ─────────────────────────────────────────────────────
function WhyPropyte() {
  const t = useTranslations('brokers');
  const cards = [
    { icon: Briefcase, title: t('why1Title'), desc: t('why1Desc') },
    { icon: Headset, title: t('why2Title'), desc: t('why2Desc') },
    { icon: LockKeyhole, title: t('why3Title'), desc: t('why3Desc') },
    { icon: FileText, title: t('why4Title'), desc: t('why4Desc') },
    { icon: Rocket, title: t('why5Title'), desc: t('why5Desc') },
    { icon: GraduationCap, title: t('why6Title'), desc: t('why6Desc') },
  ];
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="text-[#0E7490] text-sm font-bold tracking-widest uppercase">{t('whyEyebrow')}</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#1A2F3F]">{t('whyTitle')}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(({ icon: Icon, title, desc }, i) => (
            <ScrollReveal key={title} delay={(i % 3) * 0.06} y={20}>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 h-full hover:border-propyte-brand/30 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="w-12 h-12 bg-propyte-cyan-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon size={24} className="text-[#0E7490]" />
                </div>
                <h3 className="text-lg font-bold text-[#1A2F3F] mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 4. CÓMO GANAS — Dos modelos
// ─────────────────────────────────────────────────────
function TwoModels() {
  const t = useTranslations('brokers');
  const points = [
    { icon: Shield, title: t('model2Point1Title'), desc: t('model2Point1Desc') },
    { icon: Users, title: t('model2Point2Title'), desc: t('model2Point2Desc') },
    { icon: Car, title: t('model2Point3Title'), desc: t('model2Point3Desc') },
  ];
  return (
    <section className="py-16 md:py-20 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <span className="text-[#0E7490] text-sm font-bold tracking-widest uppercase">{t('modelsEyebrow')}</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#1A2F3F]">{t('modelsTitle')}</h2>
          <p className="mt-4 text-gray-600 text-lg leading-relaxed">{t('modelsIntro')}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Modelo 1 */}
          <ScrollReveal y={24} className="h-full">
            <div className="bg-white rounded-2xl border border-gray-200 p-7 h-full hover:shadow-lg transition-all">
              <div className="w-11 h-11 bg-propyte-cyan-100 rounded-xl flex items-center justify-center mb-4">
                <Percent size={20} className="text-[#0E7490]" />
              </div>
              <p className="text-2xs font-bold uppercase tracking-wider text-[#0E7490]">Modelo 1</p>
              <h3 className="text-xl font-extrabold text-[#1A2F3F] tracking-tight mt-1">{t('model1Name')}</h3>
              <p className="text-sm font-semibold italic text-[#0E7490] mt-1 mb-3">{t('model1Sub')}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{t('model1Desc')}</p>
            </div>
          </ScrollReveal>

          {/* Modelo 2 — featured (dark + BorderBeam) */}
          <ScrollReveal y={24} delay={0.1} className="h-full">
            <div className="relative bg-[#0F1923] rounded-2xl border-2 border-propyte-brand/60 p-7 h-full overflow-hidden">
              <BorderBeam size={70} duration={7} colorFrom="#5CE0D2" colorTo="#A2F9FF" borderWidth={2} />
              <div className="w-11 h-11 bg-propyte-brand/20 rounded-xl flex items-center justify-center mb-4">
                <Handshake size={20} className="text-propyte-brand" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-2xs font-bold uppercase tracking-wider text-propyte-brand">Modelo 2</p>
                <span className="text-2xs font-semibold uppercase tracking-wider text-white/50 bg-white/10 rounded-full px-2 py-0.5">
                  {t('model2Tag')}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight mt-1">{t('model2Name')}</h3>
              <p className="text-sm font-semibold italic text-propyte-brand mt-1 mb-3">{t('model2Sub')}</p>
              <p className="text-white/70 text-sm leading-relaxed">{t('model2Desc')}</p>

              <p className="text-white/80 text-sm mt-5 mb-4">{t('model2PointsIntro')}</p>
              <ul className="space-y-4">
                {points.map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex gap-3">
                    <div className="w-8 h-8 shrink-0 bg-propyte-brand/15 rounded-lg flex items-center justify-center">
                      <Icon size={16} className="text-propyte-brand" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{title}</p>
                      <p className="text-white/60 text-sm leading-relaxed mt-0.5">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal y={20} delay={0.15}>
          <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 md:p-7 max-w-4xl mx-auto">
            <p className="text-gray-700 text-sm md:text-base leading-relaxed flex gap-3">
              <Sparkles size={18} className="text-[#0E7490] shrink-0 mt-0.5" />
              <span>{t('modelsCallout')}</span>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 5. CÓMO FUNCIONA — 4 pasos
// ─────────────────────────────────────────────────────
function HowItWorks() {
  const t = useTranslations('brokers');
  const steps = [
    { num: '01', icon: ClipboardCheck, title: t('step1Title'), desc: t('step1Desc') },
    { num: '02', icon: Headset, title: t('step2Title'), desc: t('step2Desc') },
    { num: '03', icon: Briefcase, title: t('step3Title'), desc: t('step3Desc') },
    { num: '04', icon: Shield, title: t('step4Title'), desc: t('step4Desc') },
  ];
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="text-[#0E7490] text-sm font-bold tracking-widest uppercase">{t('processEyebrow')}</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#1A2F3F]">{t('processTitle')}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ num, icon: Icon, title, desc }, i) => (
            <ScrollReveal key={num} delay={i * 0.08} y={24}>
              <div className="relative bg-[#F4F6F8] p-6 rounded-2xl text-center h-full hover:bg-white hover:shadow-md transition-all">
                <div className="w-10 h-10 mx-auto mb-4 bg-[#1A2F3F] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{num}</span>
                </div>
                <Icon size={32} className="mx-auto mb-3 text-[#0E7490]" />
                <h3 className="text-lg font-bold text-[#1A2F3F] mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 6. PLATAFORMA — EN DESARROLLO (preview)
// ─────────────────────────────────────────────────────
function PlatformPreview() {
  const t = useTranslations('brokers');
  const features = [
    { title: t('platformFeature1Title'), desc: t('platformFeature1Desc') },
    { title: t('platformFeature2Title'), desc: t('platformFeature2Desc') },
    { title: t('platformFeature3Title'), desc: t('platformFeature3Desc') },
    { title: t('platformFeature4Title'), desc: t('platformFeature4Desc') },
  ];
  return (
    <section className="py-16 md:py-20 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-[#0E7490] text-sm font-bold tracking-widest uppercase">
            <Sparkles size={14} /> {t('platformEyebrow')}
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#1A2F3F]">{t('platformTitle')}</h2>
          <p className="mt-3 text-gray-600 text-base leading-relaxed">{t('platformSubtitle')}</p>
        </div>

        <ScrollReveal y={28}>
          <div className="relative max-w-4xl mx-auto bg-[#1A2F3F] rounded-2xl overflow-hidden shadow-2xl">
            {/* Badge En desarrollo */}
            <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 px-3 py-1 bg-propyte-brand text-[#0F1923] text-2xs font-bold uppercase tracking-wider rounded-full">
              <Monitor size={11} /> {t('platformBadge')}
            </span>
            <div className="flex items-center gap-2 px-4 py-3 bg-[#132535]">
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <div className="w-3 h-3 rounded-full bg-green-400/70" />
              <div className="ml-4 flex-1 h-7 bg-white/10 rounded-md flex items-center px-3">
                <span className="text-white/65 text-xs">app.propyte.com/dashboard</span>
              </div>
            </div>
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {features.map((feat) => (
                  <div key={feat.title} className="propyte-card-glass-sm p-4">
                    <div className="text-propyte-brand text-sm font-bold mb-1">{feat.title}</div>
                    <div className="text-white/55 text-xs leading-relaxed">{feat.desc}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 mt-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="propyte-card-glass-sm flex items-center gap-4 p-4">
                    <div className="w-10 h-10 bg-propyte-cyan-100 rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 bg-white/20 rounded w-3/4 mb-2" />
                      <div className="h-2 bg-white/10 rounded w-1/2" />
                    </div>
                    <div className="px-3 py-1 bg-propyte-brand/30 rounded-full">
                      <span className="text-propyte-brand text-xs font-bold">●</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 7. FAQ
// ─────────────────────────────────────────────────────
function FAQ() {
  const t = useTranslations('brokers');
  const hub = useContext(BrokersHubContext);
  const [open, setOpen] = useState<Set<number>>(new Set([0, 1, 2]));
  const toggle = (i: number) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const fallback = Array.from({ length: 7 }, (_, i) => ({ q: t(`faq${i + 1}Q`), a: t(`faq${i + 1}A`) }));
  const faqs = hub.faqs.length > 0 ? hub.faqs : fallback;

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
                  <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-4">{a}</div>
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
// 8. FORMULARIO — Solicita acceso
// ─────────────────────────────────────────────────────
function BrokerForm() {
  const t = useTranslations('brokers');
  const tCommon = useTranslations('common');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: '',
    brokerType: '', experience: '', focusArea: '', message: '', website: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[e.target.name];
        return next;
      });
    }
  };

  const isValidMxPhone = (v: string) => /^(\+?52[\s-]?)?\(?\d{2,3}\)?[\s-]?\d{3,4}[\s-]?\d{4}$/.test(v.trim());

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!formData.name.trim()) next.name = tCommon('required');
    if (!formData.email.trim()) next.email = tCommon('required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) next.email = tCommon('invalidEmail');
    if (!formData.phone.trim()) next.phone = tCommon('required');
    else if (!isValidMxPhone(formData.phone)) next.phone = tCommon('invalidPhone');
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const result = await submitForm(formData, 'broker_registration');
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

  const inputClass = 'w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:border-propyte-brand focus:ring-2 focus:ring-propyte-brand/20 outline-none transition-colors';
  const selectClass = `${inputClass} appearance-none`;
  const labelClass = 'block text-sm font-semibold text-[#1A2F3F] mb-1.5';

  const badges = [t('formBadge1'), t('formBadge2'), t('formBadge3'), t('formBadge4')];

  return (
    <section id="registro" className="py-16 md:py-20 bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="text-white">
            <span className="text-propyte-brand text-sm font-bold tracking-widest uppercase">{t('formEyebrow')}</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold mb-4">{t('formTitle')}</h2>
            <p className="text-white/60 text-lg mb-8">{t('formSubtitle')}</p>

            <div className="space-y-4">
              {[Briefcase, CheckCircle, Users, FileText].map((Icon, i) => (
                <div key={badges[i]} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-propyte-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-propyte-brand" />
                  </div>
                  <span className="text-white/70 text-sm">{badges[i]}</span>
                </div>
              ))}
            </div>

            {/* Slot para foto del equipo / Account Manager */}
            <div className="mt-8 hidden lg:block">
              <ImagePlaceholder tone="dark" icon={Building2} label="Foto: equipo / Account Manager Propyte" className="aspect-[16/9]" />
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
                    <label htmlFor="brk-form-name" className={labelClass}>{t('formName')} *</label>
                    <input id="brk-form-name" type="text" name="name" value={formData.name} onChange={handleChange} aria-invalid={!!errors.name} className={inputClass} />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="brk-form-email" className={labelClass}>{t('formEmail')} *</label>
                    <input id="brk-form-email" type="email" name="email" value={formData.email} onChange={handleChange} aria-invalid={!!errors.email} className={inputClass} />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="brk-form-phone" className={labelClass}>{t('formPhone')} *</label>
                    <input id="brk-form-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} aria-invalid={!!errors.phone} className={inputClass} />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label htmlFor="brk-form-company" className={labelClass}>{t('formCompany')}</label>
                    <input id="brk-form-company" type="text" name="company" value={formData.company} onChange={handleChange} className={inputClass} />
                  </div>
                </div>

                {/* Honeypot anti-spam */}
                <div aria-hidden="true" className="hidden">
                  <label htmlFor="brk-form-website">Website</label>
                  <input id="brk-form-website" type="text" name="website" tabIndex={-1} autoComplete="off" value={formData.website} onChange={handleChange} />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="brk-form-type" className={labelClass}>{t('formBrokerType')} *</label>
                    <select id="brk-form-type" name="brokerType" value={formData.brokerType} onChange={handleChange} className={selectClass}>
                      <option value="">--</option>
                      <option value="independent">{t('formBrokerTypeOptions.independent')}</option>
                      <option value="smallAgency">{t('formBrokerTypeOptions.smallAgency')}</option>
                      <option value="largeAgency">{t('formBrokerTypeOptions.largeAgency')}</option>
                      <option value="international">{t('formBrokerTypeOptions.international')}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="brk-form-exp" className={labelClass}>{t('formExperience')} *</label>
                    <select id="brk-form-exp" name="experience" value={formData.experience} onChange={handleChange} className={selectClass}>
                      <option value="">--</option>
                      <option value="0-1">{t('formExperienceOptions.0-1')}</option>
                      <option value="1-3">{t('formExperienceOptions.1-3')}</option>
                      <option value="3-5">{t('formExperienceOptions.3-5')}</option>
                      <option value="5+">{t('formExperienceOptions.5+')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="brk-form-focus" className={labelClass}>{t('formFocusArea')} *</label>
                  <select id="brk-form-focus" name="focusArea" value={formData.focusArea} onChange={handleChange} className={selectClass}>
                    <option value="">--</option>
                    <option value="rivieraMaya">{t('formFocusAreaOptions.rivieraMaya')}</option>
                    <option value="yucatan">{t('formFocusAreaOptions.yucatan')}</option>
                    <option value="both">{t('formFocusAreaOptions.both')}</option>
                    <option value="international">{t('formFocusAreaOptions.international')}</option>
                    <option value="other">{t('formFocusAreaOptions.other')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="brk-form-msg" className={labelClass}>{t('formMessage')}</label>
                  <textarea id="brk-form-msg" name="message" value={formData.message} onChange={handleChange} rows={3} className={`${inputClass} h-auto py-3`} />
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
export default function BrokersPageContent({ hubData }: { hubData?: BrokersHubData }) {
  const value = hubData ?? { faqs: [] };
  return (
    <BrokersHubContext.Provider value={value}>
      <div>
        <BrokerHero />
        <BridgeNote />
        <WhyPropyte />
        <TwoModels />
        <HowItWorks />
        <PlatformPreview />
        <FAQ />
        <BrokerForm />
      </div>
    </BrokersHubContext.Provider>
  );
}