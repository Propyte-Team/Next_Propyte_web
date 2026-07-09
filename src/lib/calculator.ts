// ── Rent bounds (hard filter) ──
export const RENT_BOUNDS = { MIN: 5_000, MAX: 500_000 } as const;

// ── Closing costs (escrituración) by state ──
export const CLOSING_COSTS_BY_STATE: Record<string, number> = {
  'Quintana Roo': 0.08,
  'Yucatan': 0.06,
};

export function getClosingCostRate(state: string): number {
  return CLOSING_COSTS_BY_STATE[state] ?? 0.06;
}

export function calculateClosingCosts(price: number, state: string): number {
  return Math.round(price * getClosingCostRate(state));
}

export function calculateTotalInvestment(price: number, state: string): number {
  return price + calculateClosingCosts(price, state);
}

// ── Vacation vs Residential constants ──
export const VAC = {
  EXPENSE_RATIO: 0.35,      // limpieza, amenidades, consumibles
  PLATFORM_FEE: 0.03,       // comisión Airbnb host
  MGMT_FEE: 0.15,           // administrador de propiedad
  DEFAULT_OCCUPANCY: 0.70,   // fallback sin datos de mercado
  get TOTAL_COST_RATIO() { return this.EXPENSE_RATIO + this.PLATFORM_FEE + this.MGMT_FEE; }, // 0.53
} as const;

export const RES = {
  EXPENSE_RATIO: 0.20,      // mantenimiento, predial, seguros
  OCCUPANCY: 0.95,           // ~11.4 meses/año ocupado
} as const;

// ── Market data mapping ──
export const CITY_TO_MARKET_CODE: Record<string, string> = {
  'Cancun': 'cancun',
  'Playa del Carmen': 'playa_del_carmen',
  'Tulum': 'tulum',
  'CDMX': 'cdmx',
  'Merida': 'merida',
  'Puerto Morelos': 'puerto_morelos',
  'Cozumel': 'cozumel',
  'Bacalar': 'bacalar',
  'Mahahual': 'mahahual',
  'Holbox': 'holbox',
  'Chetumal': 'chetumal',
  'Akumal': 'akumal',
  'Puerto Aventuras': 'puerto_aventuras',
  'Valladolid': 'valladolid',
  'Progreso': 'progreso',
  'Telchac Puerto': 'telchac_puerto',
  'Izamal': 'izamal',
  'Sisal': 'sisal',
  'Celestun': 'celestun',
  'Chelem': 'chelem',
  'Chicxulub Puerto': 'chicxulub_puerto',
  'Felipe Carrillo Puerto': 'felipe_carrillo_puerto',
  'Jose Maria Morelos': 'jose_maria_morelos',
};

// Market submarket → canonical zone mapping
export const MARKET_SUBMARKET_TO_ZONE: Record<string, string> = {
  // Cancún
  'smz_4': 'Zona Hotelera',
  'sm_2a': 'Puerto Cancún',
  'smz_16': 'Puerto Cancún',
  'sm_2': 'Centro',
  'sm_23': 'Supermanzana 11-17',
  'sm_24': 'Arbolada',
  'smz_25': 'Aqua / Cumbres',
  'sm_27': 'Lagos del Sol',
  'sm_28': 'Alfredo V. Bonfil',
  'sm_32': 'Las Torres',
  'sm_63': 'Isla Dorada',
  'sm_69': 'Residencial Río',
  'sm_72': 'Selvamar',
  'smz_35': 'Palmaris',
  'sm_64': 'Campestre',
  // Playa del Carmen
  'playacar': 'Playacar',
  '28_junio': '28 de Junio',
  'ejidal': 'Ejidal',
  'los_olivos': 'Los Olivos',
  'zazil_ha': 'Zazil-Ha',
  // Tulum
  'region_9': 'Tulum Centro',
  'region_15': 'Aldea Zamá',
  // CDMX
  'roma_norte': 'Roma Norte',
  'roma_sur': 'Roma Sur',
  'polanco': 'Polanco',
  'condesa': 'Condesa',
  'hipodromo': 'Hipódromo',
  'coyoacan': 'Coyoacán',
  'cuauhtemoc': 'Cuauhtémoc',
  'centro_historico': 'Centro Histórico',
  'juarez': 'Juárez',
  'napoles': 'Nápoles',
  'tabacalera': 'Tabacalera',
  'doctores': 'Doctores',
  'escandon': 'Escandón',
  'escandon_ii': 'Escandón II',
  'san_rafael': 'San Rafael',
  'narvarte': 'Narvarte',
  'del_valle_sur': 'Del Valle Sur',
  'anzures': 'Anzures',
  // Mérida
  '97314': 'CP 97314',
  // Akumal
  'bay_area': 'Bahía de Akumal',
  'centro': 'Akumal Centro',
  'resorts': 'Zona de Resorts',
  'bahia_principe': 'Bahía Príncipe',
  'tulum_country_club': 'Tulum Country Club',
};

// Submarket → real city (mirrors the comment groupings above — this is the
// source of truth for which city each submarket actually belongs to).
// Used by /zonas/[slug] to resolve the correct `city` (and, via
// CITY_TO_MARKET_CODE, the correct AirDNA `market`) instead of hardcoding
// 'Cancun' for every zone. Values MUST match CITY_TO_MARKET_CODE keys exactly.
//
// NOTE (needs manual confirmation): 'tulum_country_club' is grouped under
// Akumal here — same grouping already used independently in
// src/lib/rental-data/zone-names.ts (STR_ZONE_NAME_MAP) — even though the
// display name suggests Tulum. Likely AirDNA's "Akumal" market boundary
// extends to include it, but flagging since the name is misleading.
export const MARKET_SUBMARKET_TO_CITY: Record<string, string> = {
  // Cancún
  'smz_4': 'Cancun',
  'sm_2a': 'Cancun',
  'smz_16': 'Cancun',
  'sm_2': 'Cancun',
  'sm_23': 'Cancun',
  'sm_24': 'Cancun',
  'smz_25': 'Cancun',
  'sm_27': 'Cancun',
  'sm_28': 'Cancun',
  'sm_32': 'Cancun',
  'sm_63': 'Cancun',
  'sm_69': 'Cancun',
  'sm_72': 'Cancun',
  'smz_35': 'Cancun',
  'sm_64': 'Cancun',
  // Playa del Carmen
  'playacar': 'Playa del Carmen',
  '28_junio': 'Playa del Carmen',
  'ejidal': 'Playa del Carmen',
  'los_olivos': 'Playa del Carmen',
  'zazil_ha': 'Playa del Carmen',
  // Tulum
  'region_9': 'Tulum',
  'region_15': 'Tulum',
  // CDMX
  'roma_norte': 'CDMX',
  'roma_sur': 'CDMX',
  'polanco': 'CDMX',
  'condesa': 'CDMX',
  'hipodromo': 'CDMX',
  'coyoacan': 'CDMX',
  'cuauhtemoc': 'CDMX',
  'centro_historico': 'CDMX',
  'juarez': 'CDMX',
  'napoles': 'CDMX',
  'tabacalera': 'CDMX',
  'doctores': 'CDMX',
  'escandon': 'CDMX',
  'escandon_ii': 'CDMX',
  'san_rafael': 'CDMX',
  'narvarte': 'CDMX',
  'del_valle_sur': 'CDMX',
  'anzures': 'CDMX',
  // Mérida
  '97314': 'Merida',
  // Akumal
  'bay_area': 'Akumal',
  'centro': 'Akumal',
  'resorts': 'Akumal',
  'bahia_principe': 'Akumal',
  'tulum_country_club': 'Akumal', // needs manual confirmation — see note above
};

// Reverse: canonical zone → submarket codes
export const ZONE_TO_MARKET_SUBMARKETS: Record<string, string[]> = {};
for (const [sub, zone] of Object.entries(MARKET_SUBMARKET_TO_ZONE)) {
  if (!ZONE_TO_MARKET_SUBMARKETS[zone]) ZONE_TO_MARKET_SUBMARKETS[zone] = [];
  ZONE_TO_MARKET_SUBMARKETS[zone].push(sub);
}

// ── RevPAR & Seasonal Returns ──

/**
 * Revenue Per Available Room (night equivalent).
 * RevPAR = ADR × Occupancy Rate
 */
export function calculateRevPAR(adr: number, occupancyRate: number): number {
  return Math.round(adr * occupancyRate);
}

/**
 * Calculate seasonal-weighted annual return using monthly occupancy factors.
 * seasonalFactors: array of 12 multiplicative factors (Jan=index 0).
 * Base occupancy is multiplied by each factor to get per-month occupancy.
 */
export function calculateSeasonalReturn(
  monthlyRent: number,
  baseOccupancy: number,
  seasonalFactors: number[],
  expenseRatio: number = VAC.EXPENSE_RATIO,
  platformFee: number = VAC.PLATFORM_FEE,
  mgmtFee: number = VAC.MGMT_FEE,
): { annualGross: number; annualNet: number; monthlyBreakdown: number[] } {
  const totalCostRatio = expenseRatio + platformFee + mgmtFee;
  const factors = seasonalFactors.length === 12 ? seasonalFactors : Array(12).fill(1.0);

  const monthlyBreakdown = factors.map((factor) => {
    const monthOcc = Math.min(1.0, baseOccupancy * factor);
    const gross = monthlyRent * monthOcc;
    return Math.round(gross * (1 - totalCostRatio));
  });

  const annualNet = monthlyBreakdown.reduce((sum, m) => sum + m, 0);
  const annualGross = factors.reduce((sum, factor) => {
    return sum + monthlyRent * Math.min(1.0, baseOccupancy * factor);
  }, 0);

  return { annualGross: Math.round(annualGross), annualNet, monthlyBreakdown };
}

/**
 * Price-to-Rent Ratio = Sale Price / (Monthly Rent × 12).
 * Lower = better for investors.
 */
export function calculatePriceToRentRatio(salePrice: number, monthlyRent: number): number {
  if (monthlyRent <= 0) return Infinity;
  return Math.round((salePrice / (monthlyRent * 12)) * 10) / 10;
}

// ── Vacation rental calculators ──

export function calculateVacEffectiveRent(monthlyRent: number, occupancy: number): number {
  return Math.round(monthlyRent * occupancy);
}

export function calculateVacNetRent(monthlyRent: number, occupancy: number): number {
  const effective = monthlyRent * occupancy;
  return Math.round(effective * (1 - VAC.EXPENSE_RATIO - VAC.PLATFORM_FEE - VAC.MGMT_FEE));
}

export function calculateVacGrossYield(monthlyRent: number, occupancy: number, totalInvestment: number): number {
  if (totalInvestment === 0) return 0;
  return (monthlyRent * occupancy * 12 / totalInvestment) * 100;
}

export function calculateVacNetYield(monthlyRent: number, occupancy: number, totalInvestment: number): number {
  if (totalInvestment === 0) return 0;
  const annualNet = calculateVacNetRent(monthlyRent, occupancy) * 12;
  return (annualNet / totalInvestment) * 100;
}

// ── Financial calculators ──

export function calculateMonthlyPayment(
  price: number,
  downPaymentPct: number,
  months: number,
  annualRate: number
): number {
  const principal = price * (1 - downPaymentPct / 100);
  if (months === 0) return 0;
  if (annualRate === 0) return principal / months;

  const monthlyRate = annualRate / 100 / 12;
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(payment);
}

export function calculateROI(
  price: number,
  downPaymentPct: number,
  annualRent: number,
  appreciation: number,
  years: number
): number {
  const totalInvested = price * (downPaymentPct / 100);
  const totalRentalIncome = annualRent * years;
  const appreciationValue = price * Math.pow(1 + appreciation / 100, years) - price;
  const totalReturn = totalRentalIncome + appreciationValue;
  return (totalReturn / totalInvested) * 100;
}

export function calculateCashOnCash(annualRent: number, totalInvested: number): number {
  if (totalInvested === 0) return 0;
  return (annualRent / totalInvested) * 100;
}

export function calculateBreakeven(totalInvested: number, monthlyNetFlow: number): number {
  if (monthlyNetFlow <= 0) return Infinity;
  return Math.ceil(totalInvested / monthlyNetFlow);
}

export function calculateProjectedValue(
  price: number,
  appreciation: number,
  years: number
): number {
  return Math.round(price * Math.pow(1 + appreciation / 100, years));
}

export function calculateCapRate(annualNetRent: number, price: number): number {
  if (price === 0) return 0;
  return (annualNetRent / price) * 100;
}

export function calculateDSCR(noi: number, annualDebtService: number): number {
  if (annualDebtService <= 0) return Infinity;
  return Math.round((noi / annualDebtService) * 100) / 100;
}

export function calculateGrossYield(annualRent: number, price: number): number {
  if (price === 0) return 0;
  return (annualRent / price) * 100;
}

export function calculateNetYield(
  annualRent: number,
  price: number,
  expenseRatio: number = 0.25
): number {
  if (price === 0) return 0;
  return (annualRent * (1 - expenseRatio) / price) * 100;
}

// ── Cashflow construction helpers ──

export interface BuildCashflowsParams {
  /** Initial outflow (e.g. down payment + closing costs, or full price + closing for cash purchase) */
  totalInvested: number;
  /** Annual net cash flow (monthly net × 12). Caller is responsible for whether mortgage payments are already subtracted */
  annualNetFlow: number;
  /** Base price used to compute terminal sale value */
  price: number;
  /** Appreciation per year as percentage (e.g. 8 for 8%) */
  appreciationPct: number;
  /** Horizon in years (e.g. 5 or 10) */
  years: number;
  /** Mortgage balance at year `years`. Pass 0 for cash purchase */
  remainingBalance?: number;
}

/**
 * Build an annual cashflow array suitable for `calculateIRR()`.
 * Convention: [-totalInvested, netY1, netY2, ..., netYn + saleValue - remainingBalance]
 *
 * This helper is mechanics-only — the caller decides what `annualNetFlow` represents
 * (whether mortgage payments are subtracted, which expense ratios apply, etc.).
 * Used by FinancialSimulator and InvestmentSummary to avoid duplicate inline builders.
 */
export function buildCashflows(p: BuildCashflowsParams): number[] {
  if (p.years < 1) return [-p.totalInvested];
  const saleValue = p.price * Math.pow(1 + p.appreciationPct / 100, p.years);
  const cf: number[] = [-p.totalInvested];
  for (let y = 1; y < p.years; y++) cf.push(p.annualNetFlow);
  cf.push(p.annualNetFlow + saleValue - (p.remainingBalance ?? 0));
  return cf;
}

/**
 * Remaining mortgage balance using actuarial amortization.
 *
 *   remaining = principal × [(1+r)^n − (1+r)^p] / [(1+r)^n − 1]
 *
 * Where r = monthly rate, n = total months, p = paid months.
 *
 * This is the correct formula for a fixed-rate fully-amortizing loan.
 * Replaces the legacy `calculateRemainingBalanceLinear` helper which
 * overestimated remaining balance (Next had this bug until 2026-04-18).
 *
 * Decision (Luis, 2026-04-18): Next uses actuarial, WP legacy stays with
 * its no-mortgage-modeling approach. Numbers will diverge from WP by
 * ~1-3 percentage points in IRR; documented in commit message.
 */
export function calculateRemainingBalanceActuarial(
  price: number,
  downPaymentPct: number,
  annualRatePct: number,
  totalMonths: number,
  paidMonths: number
): number {
  const principal = price * (1 - downPaymentPct / 100);
  if (paidMonths >= totalMonths) return 0;
  if (annualRatePct === 0) {
    // Zero-rate loan: pure linear payoff
    return Math.max(0, principal * (1 - paidMonths / totalMonths));
  }
  const r = annualRatePct / 100 / 12;
  const factor = Math.pow(1 + r, totalMonths);
  const paidFactor = Math.pow(1 + r, paidMonths);
  const remaining = (principal * (factor - paidFactor)) / (factor - 1);
  return Math.max(0, remaining);
}

/**
 * @deprecated Use `calculateRemainingBalanceActuarial` — this linear approximation
 * overestimates remaining balance and produces IRR drift of 1-3 pp on 5-10yr horizons.
 * Kept temporarily for rollback comparison; remove after Fase 4 1b.
 */
export function calculateRemainingBalanceLinear(
  price: number,
  downPaymentPct: number,
  monthlyPayment: number,
  paidMonths: number
): number {
  const principal = price * (1 - downPaymentPct / 100);
  return Math.max(0, principal - monthlyPayment * paidMonths);
}

/**
 * Calculate Internal Rate of Return using Newton-Raphson method.
 * cashFlows: array of annual cash flows (negative initial investment, positive returns).
 * Returns annual IRR as percentage, or null if doesn't converge.
 */
export function calculateIRR(cashFlows: number[]): number | null {
  if (cashFlows.length < 2) return null;

  let rate = 0.1; // initial guess 10%
  const maxIterations = 100;
  const tolerance = 1e-7;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / factor;
      dnpv -= (t * cashFlows[t]) / (factor * (1 + rate));
    }

    if (Math.abs(dnpv) < 1e-12) break;

    const newRate = rate - npv / dnpv;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate * 100;
    }
    rate = newRate;

    // Guard against divergence
    if (rate < -0.99 || rate > 10) return null;
  }

  return null;
}
