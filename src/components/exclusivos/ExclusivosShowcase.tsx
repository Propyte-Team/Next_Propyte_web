'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Crown,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  FileDown,
  Play,
  Map as MapIcon,
  LayoutGrid,
  Tag,
  TrendingUp,
  Building2,
} from '@/lib/icons';
import { formatPrice } from '@/lib/formatters';
import { safeExternalUrl } from '@/lib/security/safeUrl';
import { getStageLabel, normalizeStage } from '@/lib/development-display';
import { BorderBeam } from '@/components/ui/border-beam';
import { SparklesText } from '@/components/ui/sparkles-text';
import { Meteors } from '@/components/ui/meteors';

const GOLD = '#F5A623';
const GOLD_LIGHT = '#FDE68A';

export interface ExclusiveDev {
  id: string;
  slug: string;
  name: string;
  publication_title?: string | null;
  developer_name?: string | null;
  developer_slug?: string | null;
  city: string | null;
  zone?: string | null;
  stage?: string | null;
  images?: string[] | null;
  price_min_mxn?: number | null;
  roi_projected?: number | null;
  available_units?: number | null;
  amenities?: string[] | null;
  description_short_es?: string | null;
  description_short_en?: string | null;
  brochure_url?: string | null;
  price_list_url?: string | null;
  virtual_tour_url?: string | null;
  video_url?: string | null;
  masterplan?: string | null;
}

interface Props {
  items: ExclusiveDev[];
  locale: string;
}

export default function ExclusivosShowcase({ items, locale }: Props) {
  const t = useTranslations('exclusivos');
  const tStages = useTranslations('stages');

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1418] via-[#13212B] to-[#0B1418] text-white">
        {/* Glow blobs */}
        <motion.div
          aria-hidden
          className="absolute -top-24 right-[8%] h-80 w-80 rounded-full blur-[120px]"
          style={{ background: `${GOLD}33` }}
          animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.12, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute bottom-[-6rem] left-[6%] h-96 w-96 rounded-full blur-[140px]"
          style={{ background: 'rgba(92, 224, 210, 0.14)' }}
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <Meteors number={16} />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 py-24 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 border"
            style={{ borderColor: `${GOLD}59`, background: `${GOLD}14` }}
          >
            <Crown size={16} style={{ color: GOLD }} className="animate-crown-pulse" />
            <span className="text-xs md:text-sm font-semibold tracking-[0.22em] uppercase" style={{ color: GOLD_LIGHT }}>
              {t('heroEyebrow')}
            </span>
          </motion.div>

          <SparklesText
            className="text-4xl md:text-6xl lg:text-7xl leading-[1.05] mb-6"
            colors={{ first: GOLD, second: GOLD_LIGHT }}
            sparklesCount={14}
          >
            <span className="bg-gradient-to-b from-white via-white to-[#FDE68A] bg-clip-text text-transparent">
              {t('heroTitle')}
            </span>
          </SparklesText>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed"
          >
            {t('heroSubtitle')}
          </motion.p>

          {items.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ color: GOLD }}
            >
              {t('countLabel', { count: items.length })}
            </motion.p>
          )}
        </div>

        {/* Fade bottom hacia la grid */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#0B1418]" aria-hidden />
      </section>

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0B1418] py-16 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,166,35,0.06) 0%, transparent 60%)',
          }}
        />
        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6">
          {items.length === 0 ? (
            <EmptyState locale={locale} t={t} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
              {items.map((dev, i) => (
                <ExclusiveCard
                  key={dev.id}
                  dev={dev}
                  locale={locale}
                  index={i}
                  stageLabel={getStageLabel(dev.stage, (k) => tStages(k as 'preventa'))}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-[#0B1418] to-[#13212B] py-16 md:py-20 text-center">
        <div className="max-w-[760px] mx-auto px-4 md:px-6">
          <Crown size={32} style={{ color: GOLD }} className="mx-auto mb-5 animate-crown-pulse" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{t('ctaTitle')}</h2>
          <p className="text-white/65 max-w-lg mx-auto mb-8">{t('ctaDesc')}</p>
          <Link
            href={`/${locale}/contacto`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-[#0B1418] transition-transform hover:scale-[1.03] animate-exclusive-glow"
            style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` }}
          >
            {t('ctaButton')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}

function ExclusiveCard({
  dev,
  locale,
  index,
  stageLabel,
  t,
}: {
  dev: ExclusiveDev;
  locale: string;
  index: number;
  stageLabel: string | null;
  t: ReturnType<typeof useTranslations>;
}) {
  const stageKey = normalizeStage(dev.stage);
  const desc = locale === 'en' ? dev.description_short_en : dev.description_short_es;
  const brochure = safeExternalUrl(dev.brochure_url);
  const priceList = safeExternalUrl(dev.price_list_url);
  const tour = safeExternalUrl(dev.virtual_tour_url);
  const video = safeExternalUrl(dev.video_url);
  const masterplan = safeExternalUrl(dev.masterplan);
  const detailHref = `/${locale}/desarrollos/${dev.slug}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.07, 0.4), ease: 'easeOut' }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#F5A623]/40"
    >
      <BorderBeam size={90} duration={7} delay={index * 1.4} colorFrom={GOLD} colorTo={GOLD_LIGHT} />

      {/* Imagen */}
      <Link href={detailHref} className="relative block aspect-[16/10] overflow-hidden">
        {dev.images?.[0] ? (
          <Image
            src={dev.images[0]}
            alt={`${dev.name} — ${dev.city ?? ''}`}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1A2F3F] to-[#0B1418]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1418] via-transparent to-transparent" aria-hidden />

        {/* Badge Exclusivo */}
        <div
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#0B1418] shadow-lg"
          style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` }}
        >
          <Crown size={13} />
          {t('badge')}
        </div>

        {stageLabel && (
          <div className="absolute top-3 right-3">
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase shadow-sm ${
                stageKey === 'preventa'
                  ? 'bg-[#0E7490] text-white'
                  : stageKey === 'construccion'
                    ? 'bg-[#22C55E] text-white'
                    : 'bg-white/90 text-[#0B1418]'
              }`}
            >
              {stageLabel}
            </span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Desarrollador — visible en exclusivos */}
        {dev.developer_name &&
          (dev.developer_slug ? (
            <Link
              href={`/${locale}/desarrolladores/${dev.developer_slug}`}
              className="mb-2 inline-flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#FDE68A] transition-colors hover:text-white"
            >
              <Building2 size={12} />
              {dev.developer_name}
            </Link>
          ) : (
            <span className="mb-2 inline-flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#FDE68A]">
              <Building2 size={12} />
              {dev.developer_name}
            </span>
          ))}

        {/* Nombre REAL del desarrollo */}
        <Link href={detailHref}>
          <h3 className="text-xl font-bold leading-tight text-white transition-colors group-hover:text-[#FDE68A]">
            {dev.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center gap-1 text-sm text-white/55">
          <MapPin size={13} />
          <span>
            {dev.zone ? `${dev.zone}, ` : ''}
            {dev.city}
          </span>
        </div>

        {desc && <p className="mt-3 line-clamp-2 text-sm text-white/65">{desc}</p>}

        {/* Métricas */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {dev.price_min_mxn != null && dev.price_min_mxn > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-sm font-bold text-white">
              <Tag size={13} style={{ color: GOLD }} />
              {t('from')} {formatPrice(dev.price_min_mxn)}
            </span>
          )}
          {dev.roi_projected != null && dev.roi_projected > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#F5A623]/30 bg-[#F5A623]/10 px-2.5 py-1 text-sm font-bold text-[#FDE68A]">
              <TrendingUp size={13} />
              {t('roiBadge')} {dev.roi_projected}%
            </span>
          )}
          {dev.available_units != null && dev.available_units > 0 && (
            <span className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70">
              {t('availableUnits', { count: dev.available_units })}
            </span>
          )}
        </div>

        {/* Recursos — brochure, lista, masterplan, tour, video (todo visible en exclusivos) */}
        {(brochure || priceList || masterplan || tour || video) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {brochure && (
              <ResourceLink href={brochure} primary icon={<FileDown size={14} />} label={t('brochure')} />
            )}
            {priceList && (
              <ResourceLink href={priceList} icon={<Tag size={14} />} label={t('priceList')} />
            )}
            {masterplan && (
              <ResourceLink href={masterplan} icon={<LayoutGrid size={14} />} label={t('masterplan')} />
            )}
            {tour && <ResourceLink href={tour} icon={<MapIcon size={14} />} label={t('tour')} />}
            {video && <ResourceLink href={video} icon={<Play size={14} />} label={t('video')} />}
          </div>
        )}

        <div className="mt-auto pt-5">
          <Link
            href={detailHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FDE68A] transition-all group-hover:gap-2.5"
          >
            {t('viewProperty')}
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

function ResourceLink({
  href,
  label,
  icon,
  primary = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        primary
          ? 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-[#0B1418] transition-transform hover:scale-[1.04]'
          : 'inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:border-[#F5A623]/40 hover:text-white'
      }
      style={primary ? { background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` } : undefined}
    >
      {icon}
      {label}
      <ArrowUpRight size={12} />
    </a>
  );
}

function EmptyState({ locale, t }: { locale: string; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-sm">
      <Crown size={36} style={{ color: GOLD }} className="mx-auto mb-4 animate-crown-pulse" />
      <h2 className="mb-2 text-xl font-bold text-white">{t('emptyTitle')}</h2>
      <p className="mb-6 text-sm text-white/60">{t('emptyDesc')}</p>
      <Link
        href={`/${locale}/desarrollos`}
        className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-[#0B1418] transition-transform hover:scale-[1.03]"
        style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` }}
      >
        {t('viewAll')}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
