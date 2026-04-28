import { Landmark, Banknote, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { formatPrice } from '@/lib/formatters';

interface CetesComparisonProps {
  initialInvestment: number;
  irr5y: number | null;
  irr10y: number | null;
  locale: string;
  /** CETES annual rate in percent. Default 11.0 reflects 2026 BMX reference. */
  cetesRate?: number;
  /** Bank deposit annual rate in percent. Default 5.0. */
  bankRate?: number;
}

/**
 * CETES vs bank deposit vs Propyte side-by-side comparison.
 *
 * Shows future value at year 5 and year 10 for the same initial investment
 * across three vehicles, with Propyte using the actual IRR derived from the
 * property financials.
 */
export default async function CetesComparison({
  initialInvestment,
  irr5y,
  irr10y,
  locale,
  cetesRate = 11.0,
  bankRate = 5.0,
}: CetesComparisonProps) {
  if (initialInvestment <= 0) return null;
  const t = await getTranslations({ locale, namespace: 'cetes' });

  const fv = (rate: number, years: number) => initialInvestment * Math.pow(1 + rate / 100, years);
  const pctGain = (fv5: number) => ((fv5 / initialInvestment - 1) * 100);

  const cetes = {
    rate: cetesRate,
    fv5: fv(cetesRate, 5),
    fv10: fv(cetesRate, 10),
  };
  const bank = {
    rate: bankRate,
    fv5: fv(bankRate, 5),
    fv10: fv(bankRate, 10),
  };
  const propyte = {
    rate5: irr5y,
    rate10: irr10y,
    fv5: irr5y != null ? fv(irr5y, 5) : null,
    fv10: irr10y != null ? fv(irr10y, 10) : null,
  };

  const labels = {
    annual: t('annual'),
    ourOffer: t('ourOffer'),
    value5y: t('value5y'),
    value10y: t('value10y'),
    totalSuffix: t('totalSuffix'),
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">{t('compareTitle')}</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {t('compareSubtitle', { amount: formatPrice(initialInvestment) })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <VehicleCard
          icon={<Landmark size={18} />}
          title="CETES"
          subtitle={t('cetesSubtitle')}
          rateLabel={`${cetes.rate.toFixed(1)}% ${labels.annual}`}
          fv5={cetes.fv5}
          fv10={cetes.fv10}
          gain5={pctGain(cetes.fv5)}
          gain10={((cetes.fv10 / initialInvestment - 1) * 100)}
          labels={labels}
        />
        <VehicleCard
          icon={<Banknote size={18} />}
          title={t('bankDeposit')}
          subtitle={t('fixedTerm')}
          rateLabel={`${bank.rate.toFixed(1)}% ${labels.annual}`}
          fv5={bank.fv5}
          fv10={bank.fv10}
          gain5={pctGain(bank.fv5)}
          gain10={((bank.fv10 / initialInvestment - 1) * 100)}
          labels={labels}
        />
        <VehicleCard
          icon={<Sparkles size={18} />}
          title="Propyte"
          subtitle={t('realEstate')}
          rateLabel={
            propyte.rate5 != null
              ? `IRR ${propyte.rate5.toFixed(1)}% / ${propyte.rate10?.toFixed(1) ?? '—'}%`
              : '—'
          }
          fv5={propyte.fv5}
          fv10={propyte.fv10}
          gain5={propyte.fv5 != null ? pctGain(propyte.fv5) : null}
          gain10={propyte.fv10 != null ? ((propyte.fv10 / initialInvestment - 1) * 100) : null}
          labels={labels}
          highlighted
        />
      </div>

      <p className="text-[10px] text-gray-400 leading-snug mt-4">{t('disclaimer')}</p>
    </div>
  );
}

interface VehicleLabels {
  annual: string;
  ourOffer: string;
  value5y: string;
  value10y: string;
  totalSuffix: string;
}

interface VehicleCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  rateLabel: string;
  fv5: number | null;
  fv10: number | null;
  gain5: number | null;
  gain10: number | null;
  labels: VehicleLabels;
  highlighted?: boolean;
}

function VehicleCard({
  icon, title, subtitle, rateLabel, fv5, fv10, gain5, gain10, labels, highlighted,
}: VehicleCardProps) {
  const baseClasses = highlighted
    ? 'bg-gradient-to-br from-[#1A2F3F] to-[#0F1923] text-white border-transparent ring-2 ring-[#5CE0D2]/40'
    : 'bg-white text-gray-900 border border-gray-100';
  const labelClasses = highlighted ? 'text-[#5CE0D2]/80' : 'text-gray-500';
  const valueClasses = highlighted ? 'text-white' : 'text-gray-900';
  const subtitleClasses = highlighted ? 'text-white/60' : 'text-gray-500';
  const gainClasses = highlighted ? 'text-[#5CE0D2]' : 'text-emerald-600';
  const dividerClasses = highlighted ? 'border-white/10' : 'border-gray-100';

  return (
    <div className={`rounded-xl p-4 relative ${baseClasses}`}>
      {highlighted && (
        <span className="absolute -top-2 right-3 px-2 py-0.5 bg-[#5CE0D2] text-[#0F1923] text-[10px] font-extrabold rounded-full uppercase tracking-wider">
          {labels.ourOffer}
        </span>
      )}
      <div className="flex items-center gap-2 mb-1">
        <span className={highlighted ? 'text-[#5CE0D2]' : 'text-[#0D9488]'}>{icon}</span>
        <span className={`font-bold ${valueClasses}`}>{title}</span>
      </div>
      <div className={`text-[10px] mb-3 ${subtitleClasses}`}>{subtitle}</div>
      <div className={`text-xs font-bold ${highlighted ? 'text-[#5CE0D2]' : 'text-[#0D9488]'} mb-4`}>{rateLabel}</div>

      <div className={`space-y-2 pt-3 border-t ${dividerClasses}`}>
        <Row
          label={labels.value5y}
          value={fv5 != null ? formatPrice(fv5) : '—'}
          gain={gain5}
          totalSuffix={labels.totalSuffix}
          labelClass={labelClasses}
          valueClass={valueClasses}
          gainClass={gainClasses}
        />
        <Row
          label={labels.value10y}
          value={fv10 != null ? formatPrice(fv10) : '—'}
          gain={gain10}
          totalSuffix={labels.totalSuffix}
          labelClass={labelClasses}
          valueClass={valueClasses}
          gainClass={gainClasses}
        />
      </div>
    </div>
  );
}

function Row({
  label, value, gain, totalSuffix, labelClass, valueClass, gainClass,
}: {
  label: string; value: string; gain: number | null; totalSuffix: string;
  labelClass: string; valueClass: string; gainClass: string;
}) {
  return (
    <div>
      <div className={`text-[10px] uppercase tracking-wider font-semibold ${labelClass}`}>{label}</div>
      <div className="flex items-baseline gap-2 mt-0.5">
        <div className={`text-base font-bold ${valueClass}`}>{value}</div>
        {gain != null && (
          <div className={`text-[11px] font-bold ${gainClass}`}>
            +{gain.toFixed(1)}% {totalSuffix}
          </div>
        )}
      </div>
    </div>
  );
}
