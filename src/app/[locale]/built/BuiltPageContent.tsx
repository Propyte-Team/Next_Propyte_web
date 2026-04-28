'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Building2, Palette, HardHat, TreePine, Hammer, Leaf,
  CheckCircle, ArrowRight, MessageCircle, Shield, Zap, Users,
  ChevronDown, ChevronUp, Compass, Pencil, FileCheck, Wrench, KeyRound
} from 'lucide-react';
import { submitForm } from '@/lib/submitForm';

// ── Scroll-reveal wrapper ───────────────────────────
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────
// 1. EDITORIAL HERO
// ─────────────────────────────────────────────────────
function EditorialHero() {
  const t = useTranslations('built');
  const words = [t('heroWord1'), t('heroWord2'), t('heroWord3')];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0F1923]">
      {/* Subtle background orbs */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#5CE0D2]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 left-1/3 w-[400px] h-[400px] bg-[#1A2F3F]/30 rounded-full blur-[100px]" />

      <div className="relative text-center px-4 md:px-6">
        <div className="space-y-2 md:space-y-4">
          {words.map((word, i) => (
            <motion.div
              key={word}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="block text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight">
                {word.replace('.', '')}<span className="text-[#5CE0D2]">.</span>
              </span>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-8 text-lg md:text-xl text-white/65 max-w-xl mx-auto"
        >
          {t('heroSubtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="mt-10"
        >
          <a
            href="#servicios"
            className="inline-flex items-center gap-2 h-14 px-8 border border-white/20 text-white font-medium rounded-xl hover:bg-white hover:text-[#0F1923] transition-all duration-300"
          >
            {t('heroCta')} <ArrowRight size={18} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 2. PHILOSOPHY STATEMENT
// ─────────────────────────────────────────────────────
function PhilosophyStatement() {
  const t = useTranslations('built');
  return (
    <section className="py-24 md:py-32 bg-[#0F1923]">
      <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
        <FadeIn>
          <p className="text-2xl md:text-3xl font-light italic text-white/70 leading-relaxed">
            &ldquo;{t('philosophyQuote')}&rdquo;
          </p>
          <div className="w-16 h-px bg-[#5CE0D2] mx-auto mt-8" />
          <p className="text-sm text-white/60 uppercase tracking-[0.2em] mt-4">Propyte Built</p>
        </FadeIn>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 3. SERVICES GRID
// ─────────────────────────────────────────────────────
function ServicesGrid() {
  const t = useTranslations('built');
  const services = [
    { icon: Building2, title: t('service1Title'), desc: t('service1Desc') },
    { icon: Palette, title: t('service2Title'), desc: t('service2Desc') },
    { icon: HardHat, title: t('service3Title'), desc: t('service3Desc') },
    { icon: TreePine, title: t('service4Title'), desc: t('service4Desc') },
    { icon: Hammer, title: t('service5Title'), desc: t('service5Desc') },
    { icon: Leaf, title: t('service6Title'), desc: t('service6Desc') },
  ];

  return (
    <section id="servicios" className="py-16 md:py-24 bg-[#0F1923]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <FadeIn>
          <div className="mb-12">
            <span className="text-[#5CE0D2] text-xs font-bold tracking-[0.2em]">{t('sectionServices')}</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-white">{t('servicesTitle')}</h2>
          </div>
        </FadeIn>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(({ icon: Icon, title, desc }, i) => (
            <FadeIn key={title} delay={i * 0.1}>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#5CE0D2]/30 hover:bg-white/[0.07] transition-all duration-300 group h-full">
                <Icon size={28} className="text-white/60 group-hover:text-[#5CE0D2] transition-colors duration-300" />
                <h3 className="text-xl font-semibold text-white mt-4">{title}</h3>
                <p className="text-white/75 text-sm mt-2 leading-relaxed">{desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 4. IMPACT STATS
// ─────────────────────────────────────────────────────
function ImpactStats() {
  const t = useTranslations('built');
  const stats = [
    { value: t('stat1Value'), label: t('stat1Label') },
    { value: t('stat2Value'), label: t('stat2Label') },
    { value: t('stat3Value'), label: t('stat3Label') },
    { value: t('stat4Value'), label: t('stat4Label') },
  ];

  return (
    <section className="bg-[#1A2F3F] border-t border-b border-white/10">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map(({ value, label }, i) => (
            <FadeIn key={label} delay={i * 0.1}>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white">{value}</div>
                <div className="text-sm text-white/65 mt-2 uppercase tracking-wider">{label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 5. PORTFOLIO SHOWCASE
// ─────────────────────────────────────────────────────
function PortfolioShowcase() {
  const t = useTranslations('built');
  const [filter, setFilter] = useState('all');

  const filters = [
    { key: 'all', label: t('filterAll') },
    { key: 'architecture', label: t('filterArchitecture') },
    { key: 'interior', label: t('filterInterior') },
    { key: 'construction', label: t('filterConstruction') },
    { key: 'landscape', label: t('filterLandscape') },
  ];

  const projects = Array.from({ length: 6 }, (_, i) => ({
    title: t(`project${i + 1}Title`),
    location: t(`project${i + 1}Location`),
    category: t(`project${i + 1}Category`),
    wide: i === 2 || i === 5, // every 3rd spans full width
  }));

  const filtered = filter === 'all' ? projects : projects.filter(p => p.category === filter);

  return (
    <section className="py-16 md:py-24 bg-[#0F1923]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white">{t('portfolioTitle')}</h2>
            <div className="flex flex-wrap gap-2">
              {filters.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    filter === key
                      ? 'bg-[#5CE0D2] text-white'
                      : 'bg-white/5 text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((project, i) => (
            <FadeIn key={project.title} delay={i * 0.08} className={project.wide ? 'md:col-span-2' : ''}>
              <div className={`relative overflow-hidden rounded-xl group cursor-pointer ${project.wide ? 'aspect-[21/9]' : 'aspect-[4/3]'}`}>
                {/* Gradient placeholder with subtle grid texture */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1A2F3F] to-[#0F1923]">
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                      backgroundSize: '40px 40px',
                    }}
                  />
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#5CE0D2]/0 group-hover:bg-[#5CE0D2]/10 transition-colors duration-500" />
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                  <h3 className="text-xl md:text-2xl font-bold text-white">{project.title}</h3>
                  <p className="text-sm text-white/75 mt-1">{project.location}</p>
                </div>
                {/* Scale on hover */}
                <div className="absolute inset-0 group-hover:scale-[1.03] transition-transform duration-700" />
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 6. PROCESS TIMELINE
// ─────────────────────────────────────────────────────
function ProcessTimeline() {
  const t = useTranslations('built');
  const steps = [
    { icon: Compass, title: t('process1Title'), desc: t('process1Desc') },
    { icon: Pencil, title: t('process2Title'), desc: t('process2Desc') },
    { icon: FileCheck, title: t('process3Title'), desc: t('process3Desc') },
    { icon: Wrench, title: t('process4Title'), desc: t('process4Desc') },
    { icon: KeyRound, title: t('process5Title'), desc: t('process5Desc') },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#0F1923]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">{t('processTitle')}</h2>
        </FadeIn>

        {/* Desktop: horizontal */}
        <div className="hidden md:flex items-start justify-between relative">
          {/* Connecting line */}
          <div className="absolute top-6 left-[10%] right-[10%] h-px bg-white/10" />
          <div className="absolute top-6 left-[10%] h-px bg-[#5CE0D2]/40" style={{ width: '80%' }} />

          {steps.map(({ icon: Icon, title, desc }, i) => (
            <FadeIn key={title} delay={i * 0.15} className="flex-1 text-center relative px-4">
              <div className="w-12 h-12 mx-auto rounded-full border-2 border-[#5CE0D2] bg-[#0F1923] flex items-center justify-center relative z-10">
                <Icon size={20} className="text-[#5CE0D2]" />
              </div>
              <h3 className="text-lg font-semibold text-white mt-4">{title}</h3>
              <p className="text-sm text-white/65 mt-2 leading-relaxed">{desc}</p>
            </FadeIn>
          ))}
        </div>

        {/* Mobile: vertical */}
        <div className="md:hidden space-y-8">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <FadeIn key={title} delay={i * 0.1}>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border-2 border-[#5CE0D2] bg-[#0F1923] flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-[#5CE0D2]" />
                  </div>
                  {i < steps.length - 1 && <div className="w-px flex-1 bg-white/10 mt-2" />}
                </div>
                <div className="pb-6">
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="text-sm text-white/65 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 7. TEAM EXPERTISE
// ─────────────────────────────────────────────────────
function TeamExpertise() {
  const t = useTranslations('built');
  const areas = [
    { icon: Building2, title: t('expertise1Title'), role: t('expertise1Role'), desc: t('expertise1Desc') },
    { icon: HardHat, title: t('expertise2Title'), role: t('expertise2Role'), desc: t('expertise2Desc') },
    { icon: Compass, title: t('expertise3Title'), role: t('expertise3Role'), desc: t('expertise3Desc') },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#1A2F3F]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">{t('expertiseTitle')}</h2>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-8">
          {areas.map(({ icon: Icon, title, role, desc }, i) => (
            <FadeIn key={title} delay={i * 0.15}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#5CE0D2]/10 flex items-center justify-center mb-4">
                  <Icon size={28} className="text-[#5CE0D2]" />
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-sm text-[#5CE0D2] font-medium mt-1 uppercase tracking-wider">{role}</p>
                <p className="text-white/75 text-sm mt-3 leading-relaxed">{desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 8. CONSULTATION FORM
// ─────────────────────────────────────────────────────
function ConsultationForm() {
  const t = useTranslations('built');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: '',
    projectType: '', budget: '', location: '', message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) return;
    setStatus('sending');
    try {
      const result = await submitForm(formData, 'built_consultation');
      setStatus(result.success ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const inputClass = "w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:border-[#5CE0D2] focus:ring-2 focus:ring-[#5CE0D2]/20 outline-none transition-colors";
  const selectClass = `${inputClass} appearance-none`;
  const labelClass = "block text-sm font-semibold text-[#1A2F3F] mb-1.5";

  return (
    <section id="contacto" className="py-16 md:py-24 bg-[#0F1923]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Info */}
          <FadeIn>
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('formTitle')}</h2>
              <p className="text-white/75 text-lg mb-8">{t('formSubtitle')}</p>
              <div className="space-y-4">
                {[
                  { icon: Shield, text: t('formBenefit1') },
                  { icon: Users, text: t('formBenefit2') },
                  { icon: Compass, text: t('formBenefit3') },
                  { icon: CheckCircle, text: t('formBenefit4') },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#5CE0D2]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-[#5CE0D2]" />
                    </div>
                    <span className="text-white/70 text-sm">{text}</span>
                  </div>
                ))}
              </div>
              {/* WhatsApp (subtle) */}
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '529843235354'}?text=Hola%2C%20me%20interesa%20Propyte%20Built`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-8 text-sm text-white/65 hover:text-[#25D366] transition-colors"
              >
                <MessageCircle size={16} /> {t('formWhatsapp')}
              </a>
            </div>
          </FadeIn>

          {/* Right: Form */}
          <FadeIn delay={0.2}>
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              {status === 'success' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={32} className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1A2F3F] mb-2">{t('formSuccess')}</h3>
                  <p className="text-gray-500">{t('formSuccessDesc')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{t('formName')} *</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>{t('formEmail')} *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{t('formPhone')} *</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>{t('formCompany')}</label>
                      <input type="text" name="company" value={formData.company} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{t('formProjectType')}</label>
                      <select name="projectType" value={formData.projectType} onChange={handleChange} className={selectClass}>
                        <option value="">--</option>
                        <option value="residential">{t('formProjectTypeOptions.residential')}</option>
                        <option value="commercial">{t('formProjectTypeOptions.commercial')}</option>
                        <option value="hospitality">{t('formProjectTypeOptions.hospitality')}</option>
                        <option value="mixed">{t('formProjectTypeOptions.mixed')}</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>{t('formBudget')}</label>
                      <select name="budget" value={formData.budget} onChange={handleChange} className={selectClass}>
                        <option value="">--</option>
                        <option value="under5m">{t('formBudgetOptions.under5m')}</option>
                        <option value="5to15m">{t('formBudgetOptions.5to15m')}</option>
                        <option value="15to50m">{t('formBudgetOptions.15to50m')}</option>
                        <option value="over50m">{t('formBudgetOptions.over50m')}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{t('formLocation')}</label>
                    <select name="location" value={formData.location} onChange={handleChange} className={selectClass}>
                      <option value="">--</option>
                      <option value="rivieraMaya">{t('formLocationOptions.rivieraMaya')}</option>
                      <option value="yucatan">{t('formLocationOptions.yucatan')}</option>
                      <option value="other">{t('formLocationOptions.other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t('formMessage')}</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} rows={3} className={`${inputClass} h-auto py-3`} />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full h-14 bg-[#0F1923] hover:bg-[#1A2F3F] text-white font-bold text-base rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {status === 'sending' ? t('formSending') : t('formSubmit')}
                    {status === 'idle' && <ArrowRight size={18} />}
                  </button>
                  {status === 'error' && <p className="text-red-500 text-sm text-center">{t('formError')}</p>}
                </form>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// 9. FINAL CTA
// ─────────────────────────────────────────────────────
function FinalCTA() {
  const t = useTranslations('built');
  return (
    <section className="py-24 md:py-32 bg-[#0F1923]">
      <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
        <FadeIn>
          <h2 className="text-3xl md:text-5xl font-light text-white">{t('finalCtaText')}</h2>
          <div className="mt-10">
            <a
              href="#contacto"
              className="inline-flex items-center gap-2 h-14 px-8 border border-white/20 text-white font-medium rounded-xl hover:bg-white hover:text-[#0F1923] transition-all duration-300"
            >
              {t('finalCtaButton')} <ArrowRight size={18} />
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// PAGE COMPOSITION
// ─────────────────────────────────────────────────────
export default function BuiltPageContent() {
  return (
    <div className="bg-[#0F1923]">
      <EditorialHero />
      <PhilosophyStatement />
      <ServicesGrid />
      <ImpactStats />
      <PortfolioShowcase />
      <ProcessTimeline />
      <TeamExpertise />
      <ConsultationForm />
      <FinalCTA />
    </div>
  );
}
