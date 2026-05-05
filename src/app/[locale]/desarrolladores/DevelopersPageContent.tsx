'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import {
  Building2, Users, Target, BarChart3, TrendingUp, Palette, GraduationCap,
  ChevronDown, ChevronUp, CheckCircle, ArrowRight,
  MessageCircle, Zap, ClipboardCheck, Rocket, FileText, Shield,
  Search, MapPin, BadgeCheck,
} from 'lucide-react';
import { submitForm } from '@/lib/submitForm';
import { toast } from 'sonner';
import type { DeveloperRow } from '@/lib/supabase/types';

// ─────────────────────────────────────────────────────
// DEVELOPER DIRECTORY (archive section)
// ─────────────────────────────────────────────────────
function DeveloperDirectory({ developers }: { developers: DeveloperRow[] }) {
  const t = useTranslations('developers');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');

  function updateUrl(newSearch: string, newCity: string) {
    const params = new URLSearchParams();
    if (newSearch) params.set('search', newSearch);
    if (newCity) params.set('city', newCity);
    const qs = params.toString();
    router.replace(pathname + (qs ? `?${qs}` : ''), { scroll: false });
  }

  const cities = useMemo(
    () => [...new Set(developers.map((d) => d.city).filter(Boolean) as string[])].sort(),
    [developers],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return developers.filter((d) => {
      const matchSearch = !q || d.name.toLowerCase().includes(q);
      const matchCity = !city || d.city === city;
      return matchSearch && matchCity;
    });
  }, [developers, search, city]);

  return (
    <section className="py-10 md:py-14 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A2F3F]">{t('archiveTitle')}</h1>
          <p className="mt-2 text-gray-600 text-lg">{t('archiveSubtitle')}</p>
        </div>

        {/* FilterBar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm">
          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
            <label htmlFor="dev-search" className="sr-only">{t('searchPlaceholder')}</label>
            <input
              id="dev-search"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); updateUrl(e.target.value, city); }}
              placeholder={t('searchPlaceholder')}
              className="h-10 w-52 pl-9 pr-3 rounded-full border border-gray-300 text-sm focus:border-[#5CE0D2] focus:outline-none"
            />
          </div>

          {/* City filter */}
          <div className="relative flex-shrink-0">
            <label htmlFor="dev-city" className="sr-only">{t('filterCity')}</label>
            <select
              id="dev-city"
              value={city}
              onChange={(e) => { setCity(e.target.value); updateUrl(search, e.target.value); }}
              className="h-10 pl-4 pr-8 rounded-full border border-gray-300 text-sm bg-white focus:border-[#5CE0D2] focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">{t('filterCity')}: {t('filterAll')}</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
          </div>

          <div className="flex-1" />
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {t('archiveCount', { count: filtered.length })}
          </span>
        </div>

        {/* Cards grid */}
        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((dev) => (
              <DeveloperCard key={dev.id} dev={dev} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-600">
            <Building2 size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">{t('noResults')}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function DeveloperCard({ dev, locale }: { dev: DeveloperRow; locale: string }) {
  const t = useTranslations('developers');
  const initials = dev.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:border-[#5CE0D2]/30 hover:shadow-lg transition-all p-5 flex flex-col gap-3">
      {/* Logo or initials */}
      <div className="flex items-center gap-3">
        {dev.logo_url ? (
          <div className="w-12 h-12 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
            <Image
              src={dev.logo_url}
              alt={dev.name}
              width={48}
              height={48}
              className="object-contain w-full h-full"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-[#1A2F3F] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-[#1A2F3F] text-sm leading-tight truncate">{dev.name}</p>
          {dev.verified && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0F766E] mt-0.5">
              <BadgeCheck size={11} />
              {t('verified')}
            </span>
          )}
        </div>
      </div>

      {/* City */}
      {dev.city && (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <MapPin size={12} />
          <span>{dev.city}</span>
        </div>
      )}

      {/* CTA */}
      <Link
        href={`/${locale}/desarrollos?search=${encodeURIComponent(dev.name)}`}
        className="mt-auto inline-flex items-center justify-center h-9 px-4 text-xs font-semibold bg-[#5CE0D2]/10 text-[#0F766E] rounded-xl hover:bg-[#5CE0D2]/20 transition-colors gap-1.5"
      >
        {t('viewProjects')} <ArrowRight size={12} />
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// JOIN BANNER (condensed B2B pitch)
// ─────────────────────────────────────────────────────
function JoinBanner() {
  const t = useTranslations('developers');
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '';
  return (
    <section className="py-12 md:py-16 bg-[#0F1923]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{t('joinBannerTitle')}</h2>
            <p className="text-white/60 max-w-xl">{t('joinBannerDesc')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <a
              href="#registro"
              className="h-12 px-6 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {t('joinBannerCta')} <ArrowRight size={16} />
            </a>
            {phone && (
              <a
                href={`https://wa.me/${phone}?text=${encodeURIComponent('Hola, me interesa comercializar mi desarrollo con Propyte')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-6 bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// VALUE PROPOSITION
// ─────────────────────────────────────────────────────
function ValueProposition() {
  const t = useTranslations('developers');
  const cards = [
    { icon: Users, title: t('value1Title'), desc: t('value1Desc') },
    { icon: Target, title: t('value2Title'), desc: t('value2Desc') },
    { icon: BarChart3, title: t('value3Title'), desc: t('value3Desc') },
    { icon: TrendingUp, title: t('value4Title'), desc: t('value4Desc') },
    { icon: Palette, title: t('value5Title'), desc: t('value5Desc') },
    { icon: GraduationCap, title: t('value6Title'), desc: t('value6Desc') },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <span className="text-[#0F766E] text-sm font-bold tracking-widest uppercase">{t('valueTitle')}</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#1A2F3F]">{t('valueSubtitle')}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#5CE0D2]/20 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-[#5CE0D2]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#5CE0D2]/20 transition-colors">
                <Icon size={24} className="text-[#0F766E]" />
              </div>
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
// HOW IT WORKS
// ─────────────────────────────────────────────────────
function HowItWorks() {
  const t = useTranslations('developers');
  const steps = [
    { num: '01', icon: ClipboardCheck, title: t('step1'), desc: t('step1Desc') },
    { num: '02', icon: FileText, title: t('step2'), desc: t('step2Desc') },
    { num: '03', icon: Rocket, title: t('step3'), desc: t('step3Desc') },
    { num: '04', icon: BarChart3, title: t('step4'), desc: t('step4Desc') },
  ];

  return (
    <section className="py-16 md:py-20 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2F3F]">{t('processTitle')}</h2>
          <p className="mt-3 text-gray-600 text-lg">{t('processSubtitle')}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ num, icon: Icon, title, desc }) => (
            <div key={num} className="relative bg-white p-6 rounded-2xl text-center">
              <div className="w-10 h-10 mx-auto mb-4 bg-[#1A2F3F] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{num}</span>
              </div>
              <Icon size={32} className="mx-auto mb-3 text-[#0F766E]" />
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
// FAQ
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
    <section className="py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-[#1A2F3F] text-center mb-12">{t('faqTitle')}</h2>
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
                    ? <ChevronUp size={20} className="text-[#0F766E] flex-shrink-0" />
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
// DEVELOPER FORM
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

  const inputClass = "w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:border-[#5CE0D2] focus:ring-2 focus:ring-[#5CE0D2]/20 outline-none transition-colors";
  const selectClass = `${inputClass} appearance-none`;
  const labelClass = "block text-sm font-semibold text-[#1A2F3F] mb-1.5";

  return (
    <section id="registro" className="py-16 md:py-20 bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('formTitle')}</h2>
            <p className="text-white/60 text-lg mb-8">{t('formSubtitle')}</p>
            <div className="space-y-4">
              {[
                { icon: Shield, text: t('formBullet1') },
                { icon: Zap, text: t('formBullet2') },
                { icon: Users, text: t('formBullet3') },
                { icon: CheckCircle, text: t('formBullet4') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#5CE0D2]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-[#5CE0D2]" />
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
                  className="w-full h-14 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-[#0F1923] font-bold text-base rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
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
export default function DevelopersPageContent({ developers }: { developers: DeveloperRow[] }) {
  return (
    <div>
      <Suspense fallback={null}>
        <DeveloperDirectory developers={developers} />
      </Suspense>
      <JoinBanner />
      <ValueProposition />
      <HowItWorks />
      <FAQ />
      <DeveloperForm />
    </div>
  );
}
