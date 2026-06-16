import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { assertPageVisible } from '@/lib/page-visibility';
import { VISIBILITY_KEYS } from '@/lib/visibility';
import {
  Landmark, Banknote, Building2, ArrowLeftRight, ArrowRight,
  CheckCircle, Sparkles,
} from '@/lib/icons';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import MortgageCalculator from '@/components/financiamiento/MortgageCalculator';
import BankLogos from '@/components/financiamiento/BankLogos';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'financiamiento' });

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
      canonical: `/${locale}/financiamiento`,
      languages: {
        es: '/es/financiamiento',
        en: '/en/financiamiento',
        'x-default': '/es/financiamiento',
      },
    },
  };
}

const METHOD_ICONS = [Landmark, Banknote, Building2, ArrowLeftRight] as const;

export default async function FinanciamientoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertPageVisible(VISIBILITY_KEYS.PAGE_FINANCIAMIENTO);
  const t = await getTranslations({ locale, namespace: 'financiamiento' });
  const [tBC, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  const methods = METHOD_ICONS.map((Icon, i) => {
    const n = i + 1;
    return {
      icon: Icon,
      title: t(`method${n}Title` as 'method1Title'),
      desc: t(`method${n}Desc` as 'method1Desc'),
      downPayment: t(`method${n}DownPayment` as 'method1DownPayment'),
      rate: t(`method${n}Rate` as 'method1Rate'),
      term: t(`method${n}Term` as 'method1Term'),
      pros: [
        t(`method${n}Pro1` as 'method1Pro1'),
        t(`method${n}Pro2` as 'method1Pro2'),
        t(`method${n}Pro3` as 'method1Pro3'),
      ],
      ideal: t(`method${n}Ideal` as 'method1Ideal'),
    };
  });

  // FinancialProduct JSON-LD (one ItemList with 4 LoanOrCredit products)
  const financialSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('heroTitle'),
    description: t('heroSubtitle'),
    itemListElement: methods.map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'LoanOrCredit',
        name: m.title,
        description: m.desc,
        amount: { '@type': 'MonetaryAmount', currency: 'MXN' },
        loanTerm: { '@type': 'QuantitativeValue', description: m.term },
        interestRate: m.rate,
        requiredCollateral: m.downPayment,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(financialSchema) }}
      />

      <Breadcrumbs
        locale={locale}
        homeLabel={tBC('home')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[{ label: tBC('financing') }]}
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
        </div>
      </section>

      {/* Bank Logos Trustbar */}
      <BankLogos locale={locale} />

      {/* Mortgage Calculator */}
      <MortgageCalculator />

      {/* 4 Methods */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-10 text-center">
            {t('methodsTitle')}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {methods.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-propyte-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon size={24} className="text-[#0E7490]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#1A2F3F]">{m.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{m.desc}</p>

                  <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                    <div>
                      <div className="text-2xs text-gray-600 uppercase">{t('labelDownPayment')}</div>
                      <div className="text-sm font-bold text-gray-900">{m.downPayment}</div>
                    </div>
                    <div>
                      <div className="text-2xs text-gray-600 uppercase">{t('labelRate')}</div>
                      <div className="text-sm font-bold text-gray-900">{m.rate}</div>
                    </div>
                    <div>
                      <div className="text-2xs text-gray-600 uppercase">{t('labelTerm')}</div>
                      <div className="text-sm font-bold text-gray-900">{m.term}</div>
                    </div>
                  </div>

                  <ul className="space-y-1.5 mb-3">
                    {m.pros.map((pro) => (
                      <li key={pro} className="flex items-center gap-2 text-sm">
                        <CheckCircle size={14} className="text-[#22C55E] flex-shrink-0" />
                        <span className="text-gray-600">{pro}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="text-xs text-gray-600 pt-3 border-t border-gray-100">
                    <span className="font-semibold">{t('labelIdealFor')}</span> {m.ideal}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 md:py-20 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-8 text-center">
            {t('tableTitle')}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full min-w-[640px] text-sm bg-white">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-3">{t('labelMethod')}</th>
                  <th className="px-4 py-3 text-center">{t('labelDownPayment')}</th>
                  <th className="px-4 py-3 text-center">{t('labelRate')}</th>
                  <th className="px-4 py-3 text-center">{t('labelTerm')}</th>
                  <th className="px-4 py-3 text-center">{t('labelSpeed')}</th>
                  <th className="px-4 py-3">{t('labelBestFor')}</th>
                  <th className="px-4 py-3 text-right">{t('labelAdvisor')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {methods.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{m.title}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{m.downPayment}</td>
                    <td className="px-4 py-3 text-center font-bold text-[#0E7490]">{m.rate}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{m.term}</td>
                    <td className="px-4 py-3 text-center">
                      {m.rate === '0%' ? '⚡⚡' : i === 1 ? '⚡⚡⚡' : '🕐'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 leading-snug max-w-[220px]">
                      {m.ideal}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/${locale}/contacto?asunto=financiamiento-m${i + 1}`}
                        className="inline-flex items-center min-h-[44px] md:min-h-0 text-xs font-semibold text-[#0E7490] hover:underline whitespace-nowrap"
                      >
                        {t('rowAdvisorCta')} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pre-qualify CTA */}
          <div className="mt-8 max-w-2xl mx-auto bg-white border border-propyte-brand/40 rounded-2xl p-6 md:p-8 text-center shadow-sm">
            <h3 className="text-xl md:text-2xl font-bold text-[#1A2F3F] mb-2">
              {t('preQualifyTitle')}
            </h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">{t('preQualifyDesc')}</p>
            <Link
              href={`/${locale}/contacto?asunto=precalificacion`}
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-bold text-sm transition-colors"
            >
              {t('preQualifyCta')} →
            </Link>
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
          <Link
            href={`/${locale}/contacto`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-propyte-brand hover:bg-propyte-cyan-200 text-[#0F1923] font-bold rounded-xl transition-colors"
          >
            {t('ctaButton')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Legal disclaimer */}
      <div className="py-6 bg-gray-50">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <p className="text-xs text-gray-600 text-center">{t('disclaimer')}</p>
        </div>
      </div>
    </>
  );
}
