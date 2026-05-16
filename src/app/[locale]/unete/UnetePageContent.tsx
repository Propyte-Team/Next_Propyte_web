'use client';

import { createContext, useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { submitLead } from '@/lib/leads/submit-lead';
import {
  Play,
  TrendingUp,
  DollarSign,
  Globe,
  Laptop,
  Users,
  Award,
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Star,
  MapPin,
  Zap,
  Shield,
  Headphones,
  GraduationCap,
  Building2,
  ArrowRight,
  Phone,
  Mail,
  Send,
} from 'lucide-react';

// ============================================================
// HUB CONTENT CONTEXT (Hub-driven editorial overrides)
// ============================================================
interface UneteTestimonialItem {
  name: string;
  role: string;
  quote: string;
  stats: string;
}
interface UneteFaqItem {
  q: string;
  a: string;
}
interface UneteStatOverride {
  value: string;
  label: string;
}
interface UneteHubData {
  videoUrl: string | null;
  testimonials: UneteTestimonialItem[];
  faqs: UneteFaqItem[];
  statsOverride: UneteStatOverride[] | null;
}
const UneteHubContext = createContext<UneteHubData>({
  videoUrl: null,
  testimonials: [],
  faqs: [],
  statsOverride: null,
});

// ============================================================
// HERO SECTION
// ============================================================
function HeroSection() {
  const hub = useContext(UneteHubContext);
  const t = useTranslations('unete');
  const [showVideo, setShowVideo] = useState(false);

  const stats = [
    { value: t('heroStat1Value'), label: t('heroStat1Label') },
    { value: t('heroStat2Value'), label: t('heroStat2Label') },
    { value: t('heroStat3Value'), label: t('heroStat3Label') },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300B4C8' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-propyte-brand/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#A2F9FF]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-propyte-brand/15 border border-propyte-brand/30 text-propyte-brand text-sm font-bold px-4 py-2 rounded-full mb-6">
              <Zap size={14} />
              {t('heroEyebrow')}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {t('heroTitlePart1')}{' '}
              <span className="text-propyte-brand">{t('heroTitleHighlight')}</span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 leading-relaxed mb-8 max-w-xl">
              {t('heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a
                href="#aplicar"
                className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-bold text-lg rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-propyte-brand/20"
              >
                {t('heroCtaJoin')}
                <ArrowRight size={20} />
              </a>
              <button
                type="button"
                onClick={() => setShowVideo(true)}
                className="inline-flex items-center justify-center gap-2 h-14 px-8 border-2 border-white/20 hover:border-white/40 text-white font-bold text-lg rounded-xl transition-all hover:bg-white/5"
              >
                <Play size={20} className="fill-white" />
                {t('heroCtaVideo')}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl md:text-3xl font-bold text-propyte-brand">{stat.value}</div>
                  <div className="text-sm text-white/75">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative bg-gradient-to-br from-[#1A2F3F] to-[#0F1923] rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-video">
              {showVideo ? (
                <iframe
                  src={hub.videoUrl ?? 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0'}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={t('heroVideoLabel')}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F1923] via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <button
                        type="button"
                        className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors group"
                        onClick={() => setShowVideo(true)}
                      >
                        <Play size={36} className="text-white fill-white ml-1 group-hover:scale-110 transition-transform" />
                      </button>
                      <p className="text-white/60 text-sm mt-4 font-medium">{t('heroVideoLabel')}</p>
                    </div>
                  </div>
                  <div className="absolute inset-4 border border-white/5 rounded-xl" />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  </div>
                </div>
              )}
            </div>
            <div className="absolute -bottom-4 -left-4 bg-[#A2F9FF] text-[#0F1923] font-bold text-sm px-4 py-2 rounded-xl shadow-lg">
              {t('heroTopBadge')}
            </div>
          </div>
        </div>
      </div>

      {showVideo && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 lg:hidden"
          onClick={() => setShowVideo(false)}
        >
          <div className="w-full max-w-3xl aspect-video" onClick={e => e.stopPropagation()}>
            <iframe
              src={hub.videoUrl ?? 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0'}
              className="w-full h-full rounded-xl"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={t('heroVideoLabel')}
            />
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================
// SOCIAL PROOF
// ============================================================
function SocialProofBar() {
  const t = useTranslations('unete');
  const cityKeys = ['city1', 'city2', 'city3', 'city4', 'city5', 'city6', 'city7', 'city8'] as const;
  return (
    <section className="bg-white border-y border-gray-100 py-8">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <p className="text-center text-xs text-gray-600 uppercase tracking-wider font-semibold mb-6">
          {t('socialProofLabel')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {cityKeys.map((key) => (
            <div key={key} className="flex items-center gap-2 text-gray-600 hover:text-[#1A2F3F] transition-colors">
              <MapPin size={14} />
              <span className="text-sm font-semibold">{t(key)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// WHY PROPYTE
// ============================================================
function WhyPropyte() {
  const t = useTranslations('unete');
  const ICONS = [DollarSign, Laptop, GraduationCap, Users, Globe, Shield] as const;
  const benefits = ICONS.map((Icon, i) => {
    const n = i + 1;
    return {
      icon: Icon,
      title: t(`benefit${n}Title` as 'benefit1Title'),
      description: t(`benefit${n}Desc` as 'benefit1Desc'),
      highlight: t(`benefit${n}Highlight` as 'benefit1Highlight'),
    };
  });

  return (
    <section className="py-20 md:py-28 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <span className="text-[#0F766E] font-bold text-sm uppercase tracking-wider">{t('whyEyebrow')}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mt-3">
            {t('whyTitlePart1')} <span className="text-[#1A2F3F]">{t('whyTitleHighlight')}</span>
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            {t('whySubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-propyte-brand/30 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-propyte-cyan-100 rounded-xl flex items-center justify-center group-hover:bg-propyte-cyan-100 transition-colors">
                    <Icon size={24} className="propyte-amenity-icon" />
                  </div>
                  <span className="text-xs font-bold text-[var(--propyte-dark-700)] bg-propyte-cyan-100 px-2.5 py-1 rounded-full">
                    {b.highlight}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">{b.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{b.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// COMMISSION MODEL
// ============================================================
function CommissionModel() {
  const t = useTranslations('unete');
  const tiers = [1, 2, 3].map((n) => ({
    range: t(`tier${n}Range` as 'tier1Range'),
    pct: t(`tier${n}Pct` as 'tier1Pct'),
    you: t(`tier${n}You` as 'tier1You'),
    propyte: t(`tier${n}Propyte` as 'tier1Propyte'),
    bar: n === 1 ? 80 : n === 2 ? 85 : 100,
  }));
  const points = [1, 2, 3, 4, 5, 6].map((n) => t(`commissionPoint${n}` as 'commissionPoint1'));

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative">
            <div className="bg-gradient-to-br from-[#0F1923] to-[#1A2F3F] rounded-2xl p-8 md:p-10">
              <h3 className="text-white text-xl font-bold mb-8">{t('commissionPlanHeader')}</h3>

              <div className="space-y-4">
                {tiers.map((tier) => (
                  <div key={tier.range} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">{tier.range}</span>
                      <span className="text-lg font-bold text-propyte-brand">{tier.pct}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-propyte-brand to-[#00D4EA] rounded-full transition-all"
                        style={{ width: `${tier.bar}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-propyte-brand">{t('youLabel')}: {tier.you}</span>
                      <span className="text-white/65">{t('propyteLabel')}: {tier.propyte}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-[#A2F9FF]/10 border border-[#A2F9FF]/20 rounded-xl p-4 flex items-start gap-3">
                <Award size={20} className="text-[#A2F9FF] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">{t('capAnnualLabel')}</p>
                  <p className="text-xs text-white/75 mt-1">
                    {t('capAnnualDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[#0F766E] font-bold text-sm uppercase tracking-wider">{t('commissionEyebrow')}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mt-3 mb-6">
              {t('commissionTitlePart1')}{' '}
              <span className="text-[#1A2F3F]">{t('commissionTitleHighlight')}</span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              {t('commissionSubtitle')}
            </p>

            <ul className="space-y-4">
              {points.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-[#0F766E] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2C2C2C] font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// REVENUE SHARING
// ============================================================
function RevenueSharing() {
  const t = useTranslations('unete');
  const levels = [
    { level: 1, pct: '3.5%', whoKey: 'level1Who', color: '#0F766E' },
    { level: 2, pct: '1.5%', whoKey: 'level2Who', color: '#0F766E' },
    { level: 3, pct: '1.0%', whoKey: 'level3Who', color: '#0F766E' },
    { level: 4, pct: '0.5%', whoKey: 'level4Who', color: '#1A2F3F' },
    { level: 5, pct: '0.25%', whoKey: 'level5Who', color: '#0F1923' },
  ] as const;

  return (
    <section className="py-20 md:py-28 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="text-[#0F766E] font-bold text-sm uppercase tracking-wider">{t('revenueEyebrow')}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mt-3 mb-6">
              {t('revenueTitlePart1')}{' '}
              <span className="text-[#1A2F3F]">{t('revenueTitleHighlight')}</span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              {t('revenueSubtitle')}
            </p>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h4 className="font-bold text-[#2C2C2C] mb-4">{t('revenueExampleTitle')}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F4F6F8] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#0F766E]">10</div>
                  <div className="text-xs text-gray-600 mt-1">{t('revenueDirectAgents')}</div>
                </div>
                <div className="bg-[#F4F6F8] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#0D9488]">$45K</div>
                  <div className="text-xs text-gray-600 mt-1">{t('revenueMonthlyExtra')}</div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                {t('revenueAssumption')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {levels.map((l) => (
              <div
                key={l.level}
                className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: l.color }}
                >
                  {l.level}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2C2C2C]">{t('levelPrefix')} {l.level}</span>
                    <span className="text-lg font-bold text-[#0F766E]">{l.pct}</span>
                  </div>
                  <span className="text-sm text-gray-600">{t(l.whoKey)}</span>
                </div>
                <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${100 - (l.level - 1) * 18}%`,
                      backgroundColor: l.color,
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="bg-propyte-cyan-100/60 border border-propyte-brand/20 rounded-xl p-4 mt-4">
              <p className="text-sm text-[#2C2C2C] font-medium">
                {t('revenueNote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TECHNOLOGY PLATFORM
// ============================================================
function TechPlatform() {
  const t = useTranslations('unete');
  const ICONS = [BarChart3, Globe, Laptop, TrendingUp, Zap, Headphones] as const;
  const tools = ICONS.map((Icon, i) => {
    const n = i + 1;
    return {
      icon: Icon,
      name: t(`tool${n}Name` as 'tool1Name'),
      desc: t(`tool${n}Desc` as 'tool1Desc'),
    };
  });
  const dashStats = [
    { label: t('dashStat1Label'), value: t('dashStat1Value'), change: t('dashStat1Change') },
    { label: t('dashStat2Label'), value: t('dashStat2Value'), change: t('dashStat2Change') },
    { label: t('dashStat3Label'), value: t('dashStat3Value'), change: '' },
    { label: t('dashStat4Label'), value: t('dashStat4Value'), change: t('dashStat4Change') },
  ];

  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#F4F6F8] to-transparent" />

      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <span className="text-[#0F766E] font-bold text-sm uppercase tracking-wider">{t('techEyebrow')}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mt-3">
            {t('techTitlePart1')} <span className="text-[#1A2F3F]">{t('techTitleHighlight')}</span>
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            {t('techSubtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div key={tool.name} className="flex items-start gap-4 p-5 rounded-2xl hover:bg-[#F4F6F8] transition-colors">
                <div className="w-10 h-10 bg-[#1A2F3F] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-propyte-brand" />
                </div>
                <div>
                  <h4 className="font-bold text-[#2C2C2C] mb-1">{tool.name}</h4>
                  <p className="text-sm text-gray-600">{tool.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-14 bg-gradient-to-br from-[#0F1923] to-[#1A2F3F] rounded-2xl p-1 mx-auto max-w-4xl">
          <div className="bg-[#0F1923] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white/10 rounded-lg h-7 flex items-center px-3 max-w-md mx-auto">
                  <span className="text-xs text-white/65">app.propyte.com/dashboard</span>
                </div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-4 gap-4">
              {dashStats.map((s) => (
                <div key={s.label} className="bg-white/5 rounded-lg p-4">
                  <div className="text-xs text-white/65">{s.label}</div>
                  <div className="text-xl font-bold text-white mt-1">{s.value}</div>
                  {s.change && <div className="text-xs text-green-400 mt-1">{s.change}</div>}
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <div className="h-32 bg-white/5 rounded-lg flex items-end justify-around p-4 gap-2">
                {[40, 65, 55, 80, 70, 90, 75, 95, 85, 60, 88, 92].map((h, i) => (
                  <div key={i} className="flex-1 bg-propyte-brand/60 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TESTIMONIALS
// ============================================================
function Testimonials() {
  const t = useTranslations('unete');
  const hub = useContext(UneteHubContext);
  const fallback = [1, 2, 3].map((n) => ({
    name: t(`t${n}Name` as 't1Name'),
    role: t(`t${n}Role` as 't1Role'),
    quote: t(`t${n}Quote` as 't1Quote'),
    stats: t(`t${n}Stats` as 't1Stats'),
  }));
  const source = hub.testimonials.length > 0 ? hub.testimonials : fallback;
  const testimonials = source.map((tt) => ({
    ...tt,
    avatar: tt.name
      .split(' ')
      .slice(0, 2)
      .map((s) => s[0])
      .join(''),
  }));

  return (
    <section className="py-20 md:py-28 bg-[#0F1923]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <span className="text-propyte-brand font-bold text-sm uppercase tracking-wider">{t('testimonialsEyebrow')}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-3">
            {t('testimonialsTitle')}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((tt) => (
            <div
              key={tt.name}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-propyte-brand/30 transition-all"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className="text-[#A2F9FF] fill-[#A2F9FF]" />
                ))}
              </div>
              <p className="text-white/80 leading-relaxed mb-6 text-sm">&ldquo;{tt.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-propyte-brand rounded-full flex items-center justify-center text-[#0F1923] font-bold text-sm">
                  {tt.avatar}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{tt.name}</div>
                  <div className="text-white/65 text-xs">{tt.role}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-propyte-brand font-bold text-sm">{tt.stats}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// STATS SECTION
// ============================================================
function StatsSection() {
  const t = useTranslations('unete');
  const hub = useContext(UneteHubContext);
  const ICONS = [Users, DollarSign, MapPin, Building2, Award, Zap] as const;
  const stats = ICONS.map((Icon, i) => {
    const n = i + 1;
    const override = hub.statsOverride?.[i];
    return {
      icon: Icon,
      value: override?.value ?? t(`stat${n}Value` as 'stat1Value'),
      label: override?.label ?? t(`stat${n}Label` as 'stat1Label'),
    };
  });

  return (
    <section className="py-16 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="text-center">
                <div className="w-12 h-12 mx-auto bg-propyte-cyan-100 rounded-xl flex items-center justify-center mb-3">
                  <Icon size={24} className="text-[#0F766E]" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">{s.value}</div>
                <div className="text-xs text-gray-600 mt-1">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// JOIN PROCESS
// ============================================================
function JoinProcess() {
  const t = useTranslations('unete');
  const steps = [1, 2, 3, 4].map((n) => ({
    num: String(n).padStart(2, '0'),
    title: t(`step${n}Title` as 'step1Title'),
    desc: t(`step${n}Desc` as 'step1Desc'),
  }));

  return (
    <section className="py-20 md:py-28 bg-[#F4F6F8]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <span className="text-[#0F766E] font-bold text-sm uppercase tracking-wider">{t('processEyebrow')}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mt-3">
            {t('processTitlePart1')} <span className="text-[#1A2F3F]">{t('processTitleHighlight')}</span>
          </h2>
        </div>

        <ol className="grid md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <li key={step.num} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 h-0.5 bg-propyte-cyan-100" style={{ left: 'calc(50% + 32px)', width: 'calc(100% - 32px)' }} />
              )}
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:border-propyte-brand/30 hover:shadow-lg transition-all relative">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-propyte-brand to-propyte-cyan-200 rounded-2xl flex items-center justify-center text-[#0F1923] text-2xl font-bold mb-4">
                  {step.num}
                </div>
                <h4 className="font-bold text-[#2C2C2C] text-lg mb-2">{step.title}</h4>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ============================================================
// FAQ
// ============================================================
function FAQ() {
  const t = useTranslations('unete');
  const hub = useContext(UneteHubContext);
  const [open, setOpen] = useState<Set<number>>(new Set([0, 1, 2]));
  const toggle = (i: number) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const fallback = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    q: t(`faq${n}Q` as 'faq1Q'),
    a: t(`faq${n}A` as 'faq1A'),
  }));
  const faqs = hub.faqs.length > 0 ? hub.faqs : fallback;

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <span className="text-[#0F766E] font-bold text-sm uppercase tracking-wider">{t('faqEyebrow')}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mt-3">
            {t('faqTitle')}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open.has(i);
            return (
              <div
                key={faq.q}
                className={`border rounded-xl overflow-hidden transition-all ${
                  isOpen ? 'border-propyte-brand/30 shadow-sm' : 'border-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-[#2C2C2C] pr-4">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp size={20} className="text-[#0F766E] flex-shrink-0" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-600 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-600 leading-relaxed">{faq.a}</p>
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

// ============================================================
// APPLICATION FORM (CTA)
// ============================================================
function ApplicationForm() {
  const t = useTranslations('unete');
  const locale = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const cityOptions: Array<{ value: string; key: 'city2' | 'city3' | 'city4' | 'city5' | 'city6' | 'city7' | 'city8' | 'formCityOther' }> = [
    { value: 'playa', key: 'city2' },
    { value: 'tulum', key: 'city3' },
    { value: 'cancun', key: 'city4' },
    { value: 'merida', key: 'city5' },
    { value: 'cdmx', key: 'city6' },
    { value: 'vallarta', key: 'city7' },
    { value: 'cabos', key: 'city8' },
    { value: 'otra', key: 'formCityOther' },
  ];

  const schema = z.object({
    name: z.string().trim().min(2),
    whatsapp: z.string().trim().min(8),
    email: z.string().trim().email(),
    city: z.string().min(1),
    experience: z.string().optional().or(z.literal('')),
    interest: z.string().max(2000).optional().or(z.literal('')),
    // Honeypot — bots lo llenan, el endpoint los detecta (REQ-F-02)
    website: z.string().optional().or(z.literal('')),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(false);
    const result = await submitLead('affiliate_request', {
      name: values.name,
      email: values.email,
      whatsapp: values.whatsapp,
      city: values.city,
      experience: values.experience,
      interest: values.interest,
      website: values.website, // honeypot
      locale,
    });
    if (result.ok) {
      setSubmitted(true);
    } else {
      setError(true);
    }
  }

  return (
    <section id="aplicar" className="py-20 md:py-28 bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-propyte-brand/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#A2F9FF]/5 rounded-full blur-3xl" />

      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t('formTitlePart1')}{' '}
              <span className="text-propyte-brand">{t('formTitleHighlight')}</span>?
            </h2>
            <p className="text-white/70 leading-relaxed mb-8 text-lg">
              {t('formSubtitle')}
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Phone size={18} className="text-propyte-brand" />
                </div>
                <span className="text-white/80 font-medium">{t('formPhone')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Mail size={18} className="text-propyte-brand" />
                </div>
                <span className="text-white/80 font-medium">{t('formEmail')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-[#2C2C2C] mb-2">{t('formSubmittedTitle')}</h3>
                <p className="text-gray-600">
                  {t('formSubmittedDesc')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Honeypot — invisible para humanos; bots lo llenan y el endpoint los detecta (REQ-F-02). */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="sr-only"
                  {...register('website')}
                />

                <h3 className="text-xl font-bold text-[#2C2C2C] mb-6">{t('formHeadline')}</h3>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="unete-name" className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">{t('formNameLabel')}</label>
                      <input
                        id="unete-name"
                        type="text"
                        autoComplete="name"
                        className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-propyte-brand/20 focus:border-propyte-brand"
                        placeholder={t('formNamePlaceholder')}
                        {...register('name')}
                      />
                    </div>
                    <div>
                      <label htmlFor="unete-whatsapp" className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">{t('formWhatsappLabel')}</label>
                      <input
                        id="unete-whatsapp"
                        type="tel"
                        autoComplete="tel"
                        className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-propyte-brand/20 focus:border-propyte-brand"
                        placeholder={t('formWhatsappPlaceholder')}
                        {...register('whatsapp')}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="unete-email" className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">{t('formEmailLabel')}</label>
                    <input
                      id="unete-email"
                      type="email"
                      autoComplete="email"
                      className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-propyte-brand/20 focus:border-propyte-brand"
                      placeholder={t('formEmailPlaceholder')}
                      {...register('email')}
                    />
                  </div>

                  <div>
                    <label htmlFor="unete-city" className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">{t('formCityLabel')}</label>
                    <select
                      id="unete-city"
                      defaultValue=""
                      className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-propyte-brand/20 focus:border-propyte-brand bg-white"
                      {...register('city')}
                    >
                      <option value="" disabled>{t('formCityPlaceholder')}</option>
                      {cityOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="unete-experience" className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">{t('formExpLabel')}</label>
                    <select
                      id="unete-experience"
                      defaultValue=""
                      className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-propyte-brand/20 focus:border-propyte-brand bg-white"
                      {...register('experience')}
                    >
                      <option value="" disabled>{t('formExpPlaceholder')}</option>
                      <option value="0">{t('formExp0')}</option>
                      <option value="1-2">{t('formExp1')}</option>
                      <option value="3-5">{t('formExp2')}</option>
                      <option value="5+">{t('formExp3')}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="unete-interest" className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">{t('formInterestLabel')}</label>
                    <textarea
                      id="unete-interest"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-propyte-brand/20 focus:border-propyte-brand resize-none"
                      placeholder={t('formInterestPlaceholder')}
                      {...register('interest')}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-600 text-sm mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    {t('formError')}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 h-12 bg-propyte-brand hover:bg-propyte-cyan-200 disabled:bg-gray-300 text-[#0F1923] font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-propyte-brand/20"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-[#0F1923]/30 border-t-[#0F1923] rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      {t('formSubmit')}
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-600 text-center mt-4">
                  {t('formTerms')}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FINAL CTA BANNER
// ============================================================
function FinalCTA() {
  const t = useTranslations('unete');
  return (
    <section className="py-16 bg-propyte-brand">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-[#0F1923] mb-4">
          {t('finalTitle')}
        </h2>
        <p className="text-[#0F1923]/80 mb-8 max-w-2xl mx-auto">
          {t('finalSubtitle')}
        </p>
        <a
          href="#aplicar"
          className="inline-flex items-center gap-2 h-14 px-10 bg-[#0F1923] text-propyte-brand font-bold text-lg rounded-xl hover:bg-[#1A2F3F] transition-all hover:shadow-lg"
        >
          {t('finalCta')}
          <ArrowRight size={20} />
        </a>
      </div>
    </section>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function UnetePageContent({ hubData }: { hubData?: UneteHubData }) {
  const value = hubData ?? {
    videoUrl: null,
    testimonials: [],
    faqs: [],
    statsOverride: null,
  };
  return (
    <UneteHubContext.Provider value={value}>
      <div>
        <HeroSection />
        <SocialProofBar />
        <WhyPropyte />
        <CommissionModel />
        <RevenueSharing />
        <TechPlatform />
        <Testimonials />
        <StatsSection />
        <JoinProcess />
        <FAQ />
        <ApplicationForm />
        <FinalCTA />
      </div>
    </UneteHubContext.Provider>
  );
}
