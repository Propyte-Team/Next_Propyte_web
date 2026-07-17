import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getRentalEstimates, getAirdnaMarketSummary } from '@/lib/supabase/queries';
import type { AirdnaMarketSummary } from '@/lib/supabase/queries';
import { formatPrice } from '@/lib/formatters';
import { getClosingCostRate, calculateClosingCosts, calculateTotalInvestment, CITY_TO_MARKET_CODE, RES } from '@/lib/calculator';
import type { RentalEstimate as RentalEstimateType } from '@/lib/supabase/queries';

interface RentalEstimateProps {
  city: string;
  zone?: string | null;
  propertyType: string;
  bedrooms?: number | null;
  locale: string;
  areaM2?: number | null;
  priceMin?: number | null;
  state?: string | null;
}

type EstimateStrings = {
  estimatedByArea: string;
  monthSuffix: string;
  median: string;
  cityAvg: (city: string) => string;
  rentPerM2: string;
  updated: string;
};

function ConfidenceBar({ sampleSize }: { sampleSize: number }) {
  const level = sampleSize >= 15 ? 3 : sampleSize >= 5 ? 2 : 1;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1.5 w-3 rounded-full ${
              i <= level ? 'bg-[#0E7490]' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-600">{sampleSize} listings</span>
    </div>
  );
}

function EstimateCard({
  estimate,
  label,
  locale,
  fallback,
  areaM2,
  strings,
}: {
  estimate: RentalEstimateType;
  label: string;
  locale: string;
  fallback: boolean;
  areaM2?: number | null;
  strings: EstimateStrings;
}) {
  const lastUpdated = new Date(estimate.last_updated).toLocaleDateString(
    locale === 'en' ? 'en-US' : 'es-MX',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );

  // Smart estimate: rent/m² × area
  const hasSmartEstimate = estimate.avg_rent_per_m2 && estimate.avg_rent_per_m2 > 0 && areaM2 && areaM2 > 0;
  const smartRent = hasSmartEstimate ? Math.round(estimate.avg_rent_per_m2! * areaM2!) : null;

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
        {label}
      </div>

      {/* Smart estimate by m² */}
      {smartRent && (
        <div className="bg-[#5CE0D2]/5 border border-[#5CE0D2]/20 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">
            {strings.estimatedByArea}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatPrice(smartRent)}
            <span className="text-sm font-normal text-gray-600">{strings.monthSuffix}</span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            ${Math.round(estimate.avg_rent_per_m2!)}/m² × {Math.round(areaM2!)} m²
          </div>
        </div>
      )}

      {/* Range */}
      <div className={`${smartRent ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
        {formatPrice(estimate.p25_rent_mxn)} – {formatPrice(estimate.p75_rent_mxn)}
        <span className="text-sm font-normal text-gray-600">
          {strings.monthSuffix}
        </span>
      </div>
      <div className="text-sm text-gray-600">
        {strings.median}: <span className="font-semibold text-gray-700">{formatPrice(estimate.median_rent_mxn)}</span>
      </div>
      <div className="flex items-center justify-between">
        <ConfidenceBar sampleSize={estimate.sample_size} />
        {fallback && (
          <span className="text-xs text-amber-500">
            {strings.cityAvg(estimate.city)}
          </span>
        )}
      </div>
      {!smartRent && estimate.avg_rent_per_m2 && estimate.avg_rent_per_m2 > 0 && (
        <div className="text-xs text-gray-600">
          {strings.rentPerM2}: ${Math.round(estimate.avg_rent_per_m2)} MXN
        </div>
      )}
      <div className="text-xs text-gray-600">
        {strings.updated}: {lastUpdated}
      </div>
    </div>
  );
}

type InvestmentStrings = {
  investmentAnalysis: string;
  propertyPrice: string;
  closingCosts: string;
  totalInvestment: string;
  grossYield: string;
  netFlow: string;
};

function InvestmentBreakdown({
  priceMin,
  state,
  estimatedRent,
  strings,
}: {
  priceMin: number;
  state: string;
  estimatedRent: number;
  strings: InvestmentStrings;
}) {
  const closingRate = getClosingCostRate(state);
  const closingCosts = calculateClosingCosts(priceMin, state);
  const totalInvestment = calculateTotalInvestment(priceMin, state);
  // Mismos supuestos que InvestmentSummary / el simulador (RES.OCCUPANCY 95%,
  // RES.EXPENSE_RATIO 20%). Antes usaba un 25% fijo sin ocupación → daba un Yield
  // distinto al de InvestmentSummary en el MISMO tab bajo la misma etiqueta.
  const effectiveMonthly = estimatedRent * RES.OCCUPANCY;
  const annualGross = effectiveMonthly * 12;
  const annualNet = annualGross * (1 - RES.EXPENSE_RATIO);
  const grossYield = (annualGross / totalInvestment) * 100;
  const netYield = (annualNet / totalInvestment) * 100;
  const capRate = netYield;
  const monthlyNet = effectiveMonthly * (1 - RES.EXPENSE_RATIO);

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        {strings.investmentAnalysis}
      </h4>

      {/* Total investment breakdown */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">{strings.propertyPrice}</span>
          <span className="font-medium">{formatPrice(priceMin)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">
            {strings.closingCosts} ({Math.round(closingRate * 100)}%)
          </span>
          <span className="font-medium">{formatPrice(closingCosts)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-1.5">
          <span className="font-semibold text-gray-700">{strings.totalInvestment}</span>
          <span className="font-bold text-gray-900">{formatPrice(totalInvestment)}</span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
          <div className="text-xs text-gray-600">{strings.grossYield}</div>
          <div className="text-sm font-bold text-[#0E7490]">{grossYield.toFixed(1)}%</div>
        </div>
        <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
          <div className="text-xs text-gray-600">Cap Rate</div>
          <div className="text-sm font-bold text-[#0E7490]">{capRate.toFixed(1)}%</div>
        </div>
        <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
          <div className="text-xs text-gray-600">{strings.netFlow}</div>
          <div className={`text-sm font-bold ${monthlyNet >= 0 ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
            {formatPrice(Math.round(monthlyNet))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function RentalEstimate({
  city,
  zone,
  propertyType,
  bedrooms,
  locale,
  areaM2,
  priceMin,
  state,
}: RentalEstimateProps) {
  const t = await getTranslations({ locale, namespace: 'rentalEstimate' });

  let estimates: { residencial: RentalEstimateType | null; vacacional: RentalEstimateType | null } = {
    residencial: null,
    vacacional: null,
  };
  let airdnaSummary: AirdnaMarketSummary | null = null;

  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return null;

    const airdnaMarket = CITY_TO_MARKET_CODE[city] || '';
    const [est, airdna] = await Promise.all([
      getRentalEstimates(supabase, city, propertyType || 'departamento', bedrooms, zone),
      airdnaMarket ? getAirdnaMarketSummary(supabase, airdnaMarket) : Promise.resolve(null),
    ]);
    estimates = est;
    airdnaSummary = airdna;
  } catch {
    return null;
  }

  if (!estimates.residencial && !estimates.vacacional) return null;

  // Determine best rent estimate for investment analysis
  const bestEstimate = estimates.residencial || estimates.vacacional;
  const estimatedRent = (() => {
    if (!bestEstimate) return null;
    // Prefer smart estimate (rent/m² × area)
    if (bestEstimate.avg_rent_per_m2 && bestEstimate.avg_rent_per_m2 > 0 && areaM2 && areaM2 > 0) {
      return Math.round(bestEstimate.avg_rent_per_m2 * areaM2);
    }
    return bestEstimate.median_rent_mxn;
  })();

  const showInvestment = priceMin && priceMin > 0 && state && estimatedRent && estimatedRent > 0;

  const estimateStrings: EstimateStrings = {
    estimatedByArea: t('estimatedByArea'),
    monthSuffix: t('monthSuffix'),
    median: t('median'),
    cityAvg: (c: string) => t('cityAvg', { city: c }),
    rentPerM2: t('rentPerM2'),
    updated: t('updated'),
  };

  const investmentStrings: InvestmentStrings = {
    investmentAnalysis: t('investmentAnalysis'),
    propertyPrice: t('propertyPrice'),
    closingCosts: t('closingCosts'),
    totalInvestment: t('totalInvestment'),
    grossYield: t('grossYield'),
    netFlow: t('netFlow'),
  };

  return (
    <div className="bg-gradient-to-br from-[#5CE0D2]/5 to-white rounded-2xl border border-[#5CE0D2]/10 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        {t('estimatedRentTitle')}
      </h3>

      <div className={`grid gap-6 ${estimates.residencial && estimates.vacacional ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {estimates.residencial && (
          <EstimateCard
            estimate={estimates.residencial}
            label={t('longTerm')}
            locale={locale}
            fallback={!zone || estimates.residencial.zone !== zone}
            areaM2={areaM2}
            strings={estimateStrings}
          />
        )}
        {estimates.vacacional && (
          <EstimateCard
            estimate={estimates.vacacional}
            label={t('vacationLong')}
            locale={locale}
            fallback={!zone || estimates.vacacional.zone !== zone}
            areaM2={areaM2}
            strings={estimateStrings}
          />
        )}
      </div>

      {/* Market Data Insight */}
      {airdnaSummary && (
        <AirdnaInsight
          summary={airdnaSummary}
          city={city}
          zone={zone}
          occupancyLabel={t('occupancy')}
          nightLabel={t('night')}
          dataLabel={t('dataBadge')}
          listingsLabel={t('listingsLabel')}
          cityNote={t('cityLevelNote')}
        />
      )}

      {/* Investment analysis with closing costs */}
      {showInvestment && (
        <InvestmentBreakdown
          priceMin={priceMin}
          state={state}
          estimatedRent={estimatedRent}
          strings={investmentStrings}
        />
      )}

      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-600 leading-relaxed">
          {t('shortDisclaimer')}
        </p>
      </div>
    </div>
  );
}

function AirdnaInsight({ summary, city, zone, occupancyLabel, nightLabel, dataLabel, listingsLabel, cityNote }: {
  summary: AirdnaMarketSummary;
  city: string;
  zone?: string | null;
  occupancyLabel: string;
  nightLabel: string;
  dataLabel: string;
  listingsLabel: string;
  cityNote: string;
}) {
  // Match de zona sin acentos/mayúsculas (antes exacto → "Aldea Zamá" y similares
  // no matcheaban y caían a ciudad silenciosamente).
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const zoneMatch = zone ? summary.zones.find((z) => norm(z.zone) === norm(zone)) : null;
  const displayOcc = zoneMatch?.occupancy ?? summary.current_occupancy;
  const displayAdr = zoneMatch?.adr ?? summary.current_adr;
  const displayLabel = zoneMatch ? `${zoneMatch.zone}, ${city}` : city;
  const isCityLevel = !zoneMatch;

  return (
    <div className="mt-4 p-3 bg-[#0F1923] rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-1.5 py-0.5 bg-[#5CE0D2]/20 text-[#5CE0D2] text-2xs font-bold rounded uppercase tracking-wider">{dataLabel}</span>
        <span className="text-2xs text-gray-400">{displayLabel}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        {displayOcc != null && (
          <div>
            <div className="text-lg font-bold text-white">{Math.round(displayOcc)}%</div>
            <div className="text-2xs text-gray-400">{occupancyLabel}</div>
          </div>
        )}
        {displayAdr != null && (
          <div>
            <div className="text-lg font-bold text-white">${displayAdr.toLocaleString()}</div>
            <div className="text-2xs text-gray-400">ADR/{nightLabel} · MXN</div>
          </div>
        )}
        {summary.active_listings != null && (
          <div>
            <div className="text-lg font-bold text-white">{summary.active_listings.toLocaleString()}</div>
            <div className="text-2xs text-gray-400">{listingsLabel}</div>
          </div>
        )}
      </div>
      {isCityLevel && (
        <p className="text-2xs text-gray-400 mt-2 leading-relaxed">{cityNote}</p>
      )}
    </div>
  );
}
