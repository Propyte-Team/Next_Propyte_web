'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Crown,
  MapPin,
  ArrowRight,
  Tag,
  CreditCard,
  Sparkles,
  Building2,
} from '@/lib/icons';
import { formatPrice } from '@/lib/formatters';
import { getStageLabel, normalizeStage } from '@/lib/development-display';
import { BorderBeam } from '@/components/ui/border-beam';
import { SparklesText } from '@/components/ui/sparkles-text';
import { Meteors } from '@/components/ui/meteors';

const GOLD = '#F9A620';
const GOLD_LIGHT = '#FFCB73';

export interface ExclusiveDev {
  id: string;
  slug: string;
  name: string;
  publication_title?: string | null;
  publication_title_en?: string | null;
  developer_name?: string | null;
  developer_slug?: string | null;
  city: string | null;
  zone?: string | null;
  stage?: string | null;
  images?: string[] | null;
  price_min_mxn?: number | null;
  price_max_mxn?: number | null;
  financing_down_payment?: number | null;
  available_units?: number | null;
  amenities?: string[] | null;
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
            <span className="bg-gradient-to-b from-white via-white to-[#FFCB73] bg-clip-text text-transparent">
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
              'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(249,166,32,0.06) 0%, transparent 60%)',
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
  const detailHref = `/${locale}/desarrollos/${dev.slug}`;

  // Encabezado público: título de publicación (nunca el nombre interno).
  const title =
    (locale === 'en' ? dev.publication_title_en : dev.publication_title) ||
    dev.publication_title ||
    dev.name;

  // Precio: rango min–max si hay máximo distinto; si no, "Desde min".
  const hasMin = dev.price_min_mxn != null && dev.price_min_mxn > 0;
  const hasRange =
    hasMin && dev.price_max_mxn != null && dev.price_max_mxn > (dev.price_min_mxn as number);
  const priceText = hasRange
    ? `${formatPrice(dev.price_min_mxn as number).replace(/\sMXN$/, '')} – ${formatPrice(dev.price_max_mxn as number)}`
    : hasMin
      ? `${t('from')} ${formatPrice(dev.price_min_mxn as number)}`
      : null;

  const amenitiesCount = dev.amenities?.length ?? 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.07, 0.4), ease: 'easeOut' }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#F9A620]/40"
    >
      <BorderBeam size={90} duration={7} delay={index * 1.4} colorFrom={GOLD} colorTo={GOLD_LIGHT} />

      {/* Imagen */}
      <Link href={detailHref} className="relative block aspect-[16/10] overflow-hidden">
        {dev.images?.[0] ? (
          <Image
            src={dev.images[0]}
            alt={`${title} — ${dev.city ?? ''}`}
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
              className="mb-2 inline-flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#FFCB73] transition-colors hover:text-white"
            >
              <Building2 size={12} />
              {dev.developer_name}
            </Link>
          ) : (
            <span className="mb-2 inline-flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#FFCB73]">
              <Building2 size={12} />
              {dev.developer_name}
            </span>
          ))}

        {/* Título de publicación (público) */}
        <Link href={detailHref}>
          <h3 className="text-xl font-bold leading-tight text-white transition-colors group-hover:text-[#FFCB73]">
            {title}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center gap-1 text-sm text-white/55">
          <MapPin size={13} />
          <span>
            {dev.zone ? `${dev.zone}, ` : ''}
            {dev.city}
          </span>
        </div>

        {/* Datos relevantes */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {priceText && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-sm font-bold text-white">
              <Tag size={13} style={{ color: GOLD }} />
              {priceText}
            </span>
          )}
          {dev.financing_down_payment != null && dev.financing_down_payment > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#F9A620]/30 bg-[#F9A620]/10 px-2.5 py-1 text-sm font-bold text-[#FFCB73]">
              <CreditCard size={13} />
              {t('downPayment', { pct: dev.financing_down_payment })}
            </span>
          )}
          {dev.available_units != null && dev.available_units > 0 && (
            <span className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70">
              {t('availableUnits', { count: dev.available_units })}
            </span>
          )}
          {amenitiesCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70">
              <Sparkles size={12} style={{ color: GOLD }} />
              {t('amenitiesCount', { count: amenitiesCount })}
            </span>
          )}
        </div>

        <div className="mt-auto pt-5">
          <Link
            href={detailHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FFCB73] transition-all group-hover:gap-2.5"
          >
            {t('viewProperty')}
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </motion.article>
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
