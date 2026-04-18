import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getRentalEstimates, getAirdnaMarketSummary } from '@/lib/supabase/queries';
import type { AirdnaMarketSummary } from '@/lib/supabase/queries';
import { formatPrice } from '@/lib/formatters';
import { getClosingCostRate, calculateClosingCosts, calculateTotalInvestment, CITY_TO_AIRDNA } from '@/lib/calculator';
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

function ConfidenceBar({ sampleSize }: { sampleSize: number }) {
  const level = sampleSize >= 15 ? 3 : sampleSize >= 5 ? 2 : 1;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1.5 w-3 rounded-full ${
              i <= level ? 'bg-[#5CE0D2]' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400">{sampleSize} listings</span>
    </div>
  );
}

function EstimateCard({
  estimate,
  label,
  locale,
  fallback,
  areaM2,
}: {
  estimate: RentalEstimateType;
  label: string;
  locale: string;
  fallback: boolean;
  areaM2?: number | null;
}) {
  const isEn = locale === 'en';
  const lastUpdated = new Date(estimate.last_updated).toLocaleDateString(
    isEn ? 'en-US' : 'es-MX',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );

  // Smart estimate: rent/m² × area
  const hasSmartEstimate = estimate.avg_rent_per_m2 && estimate.avg_rent_per_m2 > 0 && areaM2 && areaM2 > 0;
  const smartRent = hasSmartEstimate ? Math.round(estimate.avg_rent_per_m2! * areaM2!) : null;

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        {label}
      </div>

      {/* Smart estimate by m² */}
      {smartRent && (
        <div className="bg-[#5CE0D2]/5 border border-[#5CE0D2]/20 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">
            {isEn ? 'Estimated by area' : 'Estimación por área'}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatPrice(smartRent)}
            <span className="text-sm font-normal text-gray-400">{isEn ? '/mo' : '/mes'}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            ${Math.round(estimate.avg_rent_per_m2!)}/m² × {Math.round(areaM2!)} m²
          </div>
        </div>
      )}

      {/* Range */}
      <div className={`${smartRent ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
        {formatPrice(estimate.p25_rent_mxn)} – {formatPrice(estimate.p75_rent_mxn)}
        <span className="text-sm font-normal text-gray-400">
          {isEn ? '/mo' : '/mes'}
        </span>
      </div>
      <div className="text-sm text-gray-500">
        {isEn ? 'Median' : 'Mediana'}: <span className="font-semibold text-gray-700">{formatPrice(estimate.median_rent_mxn)}</span>
      </div>
      <div className="flex items-center justify-between">
        <ConfidenceBar sampleSize={estimate.sample_size} />
        {fallback && (
          <span className="text-xs text-amber-500">
            {isEn ? `${estimate.city} avg` : `Promedio ${estimate.city}`}
          </span>
        )}
      </div>
      {!smartRent && estimate.avg_rent_per_m2 && estimate.avg_rent_per_m2 > 0 && (
        <div className="text-xs text-gray-400">
          {isEn ? 'Rent/m²' : 'Renta/m²'}: ${Math.round(estimate.avg_rent_per_m2)} MXN
        </div>
      )}
      <div className="text-xs text-gray-300">
        {isEn ? 'Updated' : 'Actualizado'}: {lastUpdated}
      </div>
    </div>
  );
}

function InvestmentBreakdown({
  priceMin,
  state,
  estimatedRent,
  locale,
}: {
  priceMin: number;
  state: string;
  estimatedRent: number;
  locale: string;
}) {
  const isEn = locale === 'en';
  const closingRate = getClosingCostRate(state);
  const closingCosts = calculateClosingCosts(priceMin, state);
  const totalInvestment = calculateTotalInvestment(priceMin, state);
  const annualRent = estimatedRent * 12;
  const annualRentNet = annualRent * 0.75; // 25% expense ratio
  const grossYield = (annualRent / totalInvestment) * 100;
  const netYield = (annualRentNet / totalInvestment) * 100;
  const capRate = netYield;
  const monthlyNet = estimatedRent * 0.75;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        {isEn ? 'Investment Analysis' : 'Análisis de Inversión'}
      </h4>

      {/* Total investment breakdown */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">{isEn ? 'Property price' : 'Precio del inmueble'}</span>
          <span className="font-medium">{formatPrice(priceMin)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">
            {isEn ? 'Closing costs' : 'Escrituración'} ({Math.round(closingRate * 100)}%)
          </span>
          <span className="font-medium">{formatPrice(closingCosts)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-1.5">
          <span className="font-semibold text-gray-700">{isEn ? 'Total investment' : 'Inversión total'}</span>
          <span className="font-bold text-gray-900">{formatPrice(totalInvestment)}</span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
          <div className="text-xs text-gray-400">{isEn ? 'Gross Yield' : 'Yield bruto'}</div>
          <div className="text-sm font-bold text-[#5CE0D2]">{grossYield.toFixed(1)}%</div>
        </div>
        <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
          <div className="text-xs text-gray-400">Cap Rate</div>
          <div className="text-sm font-bold text-[#5CE0D2]">{capRate.toFixed(1)}%</div>
        </div>
        <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
          <div className="text-xs text-gray-400">{isEn ? 'Net flow' : 'Flujo neto'}</div>
          <div className={`text-sm font-bold ${monthlyNet >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
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
  const isEn = locale === 'en';

  let estimates: { residencial: RentalEstimateType | null; vacacional: RentalEstimateType | null } = {
    residencial: null,
    vacacional: null,
  };
  let airdnaSummary: AirdnaMarketSummary | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return null;

    const airdnaMarket = CITY_TO_AIRDNA[city] || '';
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

  return (
    <div className="bg-gradient-to-br from-[#5CE0D2]/5 to-white rounded-2xl border border-[#5CE0D2]/10 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        {isEn ? 'Estimated Monthly Rent' : 'Renta Mensual Estimada'}
      </h3>

      <div className={`grid gap-6 ${estimates.residencial && estimates.vacacional ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {estimates.residencial && (
          <EstimateCard
            estimate={estimates.residencial}
            label={isEn ? 'Long-term Rental' : 'Renta Residencial'}
            locale={locale}
            fallback={!zone || estimates.residencial.zone !== zone}
            areaM2={areaM2}
          />
        )}
        {estimates.vacacional && (
          <EstimateCard
            estimate={estimates.vacacional}
            label={isEn ? 'Vacation Rental (30+ days)' : 'Renta Vacacional (30+ dias)'}
            locale={locale}
            fallback={!zone || estimates.vacacional.zone !== zone}
            areaM2={areaM2}
          />
        )}
      </div>

      {/* AirDNA Market Insight */}
      {airdnaSummary && (
        <AirdnaInsight summary={airdnaSummary} city={city} zone={zone} isEn={isEn} />
      )}

      {/* Investment analysis with closing costs */}
      {showInvestment && (
        <InvestmentBreakdown
          priceMin={priceMin}
          state={state}
          estimatedRent={estimatedRent}
          locale={locale}
        />
      )}

      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 leading-relaxed">
          {isEn
            ? 'Estimate based on active rental listings on real estate portals. Not a guarantee of income.'
            : 'Estimación basada en listings de renta activos en portales inmobiliarios. No constituye una garantía de ingresos.'
          }
        </p>
      </div>
    </div>
  );
}

function AirdnaInsight({ summary, city, zone, isEn }: {
  summary: AirdnaMarketSummary;
  city: string;
  zone?: string | null;
  isEn: boolean;
}) {
  const zoneMatch = zone ? summary.zones.find(z => z.zone === zone) : null;
  const displayOcc = zoneMatch?.occupancy ?? summary.current_occupancy;
  const displayAdr = zoneMatch?.adr ?? summary.current_adr;
  const displayLabel = zoneMatch ? `${zoneMatch.zone}, ${city}` : city;

  return (
    <div className="mt-4 p-3 bg-[#0F1923] rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-1.5 py-0.5 bg-[#5CE0D2]/20 text-[#5CE0D2] text-[9px] font-bold rounded uppercase tracking-wider">AirDNA</span>
        <span className="text-[11px] text-gray-400">{displayLabel}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        {displayOcc != null && (
          <div>
            <div className="text-lg font-bold text-white">{Math.round(displayOcc)}%</div>
            <div className="text-[10px] text-gray-500">{isEn ? 'Occupancy' : 'Ocupación'}</div>
          </div>
        )}
        {displayAdr != null && (
          <div>
            <div className="text-lg font-bold text-white">${displayAdr.toLocaleString()}</div>
            <div className="text-[10px] text-gray-500">ADR/{isEn ? 'night' : 'noche'}</div>
          </div>
        )}
        {summary.active_listings != null && (
          <div>
            <div className="text-lg font-bold text-white">{summary.active_listings.toLocaleString()}</div>
            <div className="text-[10px] text-gray-500">Listings</div>
          </div>
        )}
      </div>
    </div>
  );
}
