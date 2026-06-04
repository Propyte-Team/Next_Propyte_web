import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  TrendingUp, Home, Palmtree, BarChart3, ArrowRight,
  ShieldCheck, Clock, DollarSign, Sparkles,
} from '@/lib/icons';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import SiteMedia from '@/components/shared/SiteMedia';
import InvestmentComparison from '@/components/como-invertir/InvestmentComparison';
import { MARKET_STATS, COMPARATOR_READY } from '@/lib/market-stats';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'comoInvertir' });
  const title = t('heroTitle');
  const brandedTitle = `${title} | Propyte`;
  const description = t('heroSubtitle');
  return {
    title,
    description,
    openGraph: {
      type: 'article',
      title: brandedTitle,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
    },
    twitter: { card: 'summary_large_image', title: brandedTitle, description },
    alternates: {
      canonical: `/${locale}/como-invertir`,
      languages: {
        es: '/es/como-invertir',
        en: '/en/como-invertir',
        'x-default': '/es/como-invertir',
      },
    },
  };
}

const STRATEGY_ICONS = [TrendingUp, Home, Palmtree] as const;
const METRIC_ICONS = [BarChart3, DollarSign, Clock, ShieldCheck] as const;
const STAGE_RISK = ['⬆️', '➡️', '⬇️'] as const;

export default async function ComoInvertirPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'comoInvertir' });
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  // ROI por estrategia = stats del backend (ocultos hasta que haya dato real).
  const STRAT_ROI_KEYS = ['roi_plusvalia', 'roi_renta_residencial', 'roi_airbnb'] as const;
  const strategies = STRATEGY_ICONS.map((Icon, i) => ({
    icon: Icon,
    title: t(`strat${i + 1}Title` as 'strat1Title'),
    desc: t(`strat${i + 1}Desc` as 'strat1Desc'),
    roi: MARKET_STATS[STRAT_ROI_KEYS[i]],
    horizon: t(`strat${i + 1}Horizon` as 'strat1Horizon'),
    risk: t(`strat${i + 1}Risk` as 'strat1Risk'),
  }));

  // Descuento por etapa = stats del backend (placeholder "según proyecto" si no hay dato).
  const STAGE_DESC_KEYS = ['desc_preventa', 'desc_construccion', 'desc_entrega'] as const;
  const stages = [1, 2, 3].map((i) => ({
    stage: t(`stage${i}Name` as 'stage1Name'),
    discount: MARKET_STATS[STAGE_DESC_KEYS[i - 1]],
    risk: STAGE_RISK[i - 1],
    delivery: t(`stage${i}Delivery` as 'stage1Delivery'),
    ideal: t(`stage${i}Ideal` as 'stage1Ideal'),
  }));

  const metrics = METRIC_ICONS.map((Icon, i) => ({
    icon: Icon,
    title: t(`metric${i + 1}Title` as 'metric1Title'),
    desc: t(`metric${i + 1}Desc` as 'metric1Desc'),
  }));

  // HowTo JSON-LD (invest steps = 3 strategies)
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: t('heroTitle'),
    description: t('heroSubtitle'),
    step: strategies.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.title,
      text: s.desc,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[{ label: tBC('howToInvest') }]}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0F1923] text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-propyte-brand/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-propyte-brand/10 rounded-full blur-3xl" />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-propyte-brand/15 border border-propyte-brand/30 rounded-full mb-6">
            <Sparkles size={14} className="text-propyte-brand" />
            <span className="text-propyte-brand text-sm font-semibold tracking-wide uppercase">
              {t('heroEyebrow')}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            {t('heroTitle')}
          </h1>
          <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>
          {/* Hero media — Hub › Materiales (como-invertir.hero); fallback a placeholder */}
          <SiteMedia
            mediaKey="como-invertir.hero"
            locale={locale}
            tone="dark"
            icon={TrendingUp}
            label="Foto/render: propiedad de inversión en la Riviera Maya"
            className="mt-10 max-w-3xl mx-auto aspect-[21/9]"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      </section>

      {/* 3 Strategies */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-10 text-center">
            {t('strategiesTitle')}
          </h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {strategies.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-propyte-cyan-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={24} className="text-[#0E7490]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1A2F3F] mb-3">{s.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{s.desc}</p>
                  <div className={`grid ${s.roi ? 'grid-cols-3' : 'grid-cols-2'} gap-3 pt-4 border-t border-gray-100`}>
                    {s.roi && (
                      <div>
                        <div className="text-xs text-gray-600 uppercase">{t('roiLabel')}</div>
                        <div className="text-sm font-bold text-[#0E7490]">{s.roi}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-gray-600 uppercase">{t('horizonLabel')}</div>
                      <div className="text-sm font-bold text-gray-700">{s.horizon}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 uppercase">{t('riskLabel')}</div>
                      <div className="text-sm font-bold text-gray-700">{s.risk}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-3xl mx-auto mt-8 text-center">
            {t('strategiesFootnote')}
          </p>
        </div>
      </section>

      {/* ROI by Stage Table */}
      <section className="py-16 md:py-20 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-8 text-center">
            {t('stageTitle')}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm bg-white">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-3">{t('stageColStage')}</th>
                  <th className="px-4 py-3 text-center">{t('stageColDiscount')}</th>
                  <th className="px-4 py-3 text-center">{t('stageColRisk')}</th>
                  <th className="px-4 py-3 text-center">{t('stageColDelivery')}</th>
                  <th className="px-4 py-3">{t('stageColIdeal')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stages.map((row) => (
                  <tr key={row.stage} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{row.stage}</td>
                    <td className="px-4 py-3 text-center font-bold text-[#0E7490]">{row.discount ?? <span className="font-medium text-gray-500">{t('stageDiscountPending')}</span>}</td>
                    <td className="px-4 py-3 text-center">{row.risk}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{row.delivery}</td>
                    <td className="px-4 py-3 text-gray-600">{row.ideal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-3xl mx-auto mt-6 text-center">
            {t('stageNote')}
          </p>
        </div>
      </section>

      {/* Comparador de inversión — solo cuando hay tasas reales (anti-humo). */}
      {COMPARATOR_READY && <InvestmentComparison />}

      {/* Key Metrics */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-8 text-center">
            {t('metricsTitle')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.title} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="w-10 h-10 bg-propyte-cyan-100 rounded-lg flex items-center justify-center mb-3">
                    <Icon size={20} className="text-[#0E7490]" />
                  </div>
                  <h3 className="font-bold text-[#1A2F3F] mb-2">{m.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{m.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-[#1A2F3F]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-white/70 max-w-lg mx-auto mb-8">{t('ctaDesc')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/propiedades`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-bold rounded-xl transition-colors"
            >
              {t('ctaSimulator')}
              <ArrowRight size={18} />
            </Link>
            <Link
              href={`/${locale}/contacto?asunto=inversion`}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-colors"
            >
              {t('ctaRentals')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
