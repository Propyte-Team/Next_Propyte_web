import { TrendingUp } from 'lucide-react';
import { CITY_TO_AIRDNA, calculatePriceToRentRatio } from '@/lib/calculator';

interface MarketIndicatorProps {
  city: string;
  price: number;
  monthlyRent: number | null;
  capRate?: number | null;
  airdnaOccupancy?: number | null;
  locale: string;
}

/**
 * 4-factor market score (0-100):
 *   1. Occupancy (AirDNA)       — 25 pts max
 *   2. Price-to-Rent ratio      — 25 pts max (lower = better, <15 = full)
 *   3. Cap rate                 — 25 pts max (higher = better, >=7% = full)
 *   4. Location coverage        — 25 pts (in AirDNA market = full, else 10)
 *
 * Grade: 80+ excellent / 60-79 good / 40-59 fair / <40 poor
 */
export default function MarketIndicator({
  city, price, monthlyRent, capRate, airdnaOccupancy, locale,
}: MarketIndicatorProps) {
  const isEn = locale === 'en';

  // Factor 1: Occupancy
  const occ = airdnaOccupancy ?? null;
  const occScore = occ == null ? 12 : Math.min(25, Math.round((occ / 80) * 25));

  // Factor 2: Price-to-rent
  const ptr = monthlyRent && monthlyRent > 0 ? calculatePriceToRentRatio(price, monthlyRent) : null;
  const ptrScore = ptr == null || !Number.isFinite(ptr)
    ? 10
    : ptr <= 15 ? 25 : ptr <= 20 ? 18 : ptr <= 25 ? 12 : 6;

  // Factor 3: Cap rate
  const cap = capRate ?? null;
  const capScore = cap == null ? 10 : cap >= 7 ? 25 : cap >= 5 ? 18 : cap >= 3 ? 12 : 6;

  // Factor 4: Location coverage
  const locScore = CITY_TO_AIRDNA[city] ? 25 : 10;

  const total = occScore + ptrScore + capScore + locScore;

  const grade: { label: string; color: string; bg: string } =
    total >= 80
      ? { label: isEn ? 'Excellent' : 'Excelente', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' }
      : total >= 60
        ? { label: isEn ? 'Strong' : 'Sólido', color: 'text-[#0D9488]', bg: 'bg-[#5CE0D2]/10 border-[#5CE0D2]/30' }
        : total >= 40
          ? { label: isEn ? 'Fair' : 'Regular', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
          : { label: isEn ? 'Weak' : 'Débil', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };

  return (
    <div className={`rounded-2xl border p-4 ${grade.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className={grade.color} />
          <span className={`text-sm font-bold ${grade.color}`}>
            {isEn ? 'Market Score' : 'Índice de Mercado'}
          </span>
        </div>
        <div className={`text-2xl font-extrabold ${grade.color}`}>
          {total}<span className="text-sm font-semibold">/100</span>
        </div>
      </div>

      <div className={`text-xs font-semibold ${grade.color} mb-3`}>{grade.label}</div>

      <div className="space-y-1.5 text-xs">
        <FactorBar label={isEn ? 'Occupancy' : 'Ocupación'} value={occScore} max={25} />
        <FactorBar label={isEn ? 'Price-to-Rent' : 'Precio/Renta'} value={ptrScore} max={25} />
        <FactorBar label={isEn ? 'Cap Rate' : 'Cap Rate'} value={capScore} max={25} />
        <FactorBar label={isEn ? 'Market Coverage' : 'Cobertura'} value={locScore} max={25} />
      </div>

      <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">
        {isEn
          ? 'Composite score from AirDNA occupancy, price-to-rent ratio, cap rate, and market coverage.'
          : 'Puntuación compuesta: ocupación AirDNA, relación precio/renta, cap rate y cobertura de mercado.'}
      </p>
    </div>
  );
}

function FactorBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
        <span>{label}</span>
        <span className="font-semibold">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#5CE0D2] to-[#0D9488] rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
