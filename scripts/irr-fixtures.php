<?php
/**
 * IRR Golden Fixtures — WP reference for Next_Propyte_web parity tests.
 *
 * Ports propyteIRR() + propyteBuildCashFlows() from
 * propyte-web-master/theme/assets/js/investment-calculator.js (JS) to PHP
 * and captures outputs for 10 scenarios.
 *
 * ────────────────────────────────────────────────────────────────────
 *  HOW TO USE
 *  1. Copy this file to propyte-web-master/scripts/ on WP prod
 *  2. From prod: `wp eval-file scripts/irr-fixtures.php > fixtures.json`
 *     (or locally: `php scripts/irr-fixtures.php > fixtures.json`)
 *  3. Send fixtures.json back to Luis / commit to Next_Propyte_web
 *  4. Vitest will consume it at tests/calculator/irr-parity.test.ts
 * ────────────────────────────────────────────────────────────────────
 *
 * IMPORTANT — WP's cashflow model (what this captures):
 *   - Initial outflow = downPayment + closingCosts
 *   - Annual net = (rent × occupancy × (1 - expenseRatio)) × 12
 *     → Does NOT subtract monthly mortgage payment
 *   - Terminal year = annualNet + price × (1 + appreciation%)^years
 *     → Does NOT subtract remaining mortgage balance
 *   - IRR: Newton-Raphson, initial 0.10, tolerance 1e-7, max 100 iter,
 *     divergence guards [-0.99, 10]
 *
 * This mirrors propyteBuildCashFlows / propyteIRR exactly as shipped.
 */

// ─────────────────────────────────────────────────────────────────────
// Port of propyteIRR() — Newton-Raphson
// ─────────────────────────────────────────────────────────────────────
function propyte_irr(array $cashFlows): ?float {
    if (count($cashFlows) < 2) return null;
    $rate = 0.10;
    for ($i = 0; $i < 100; $i++) {
        $npv = 0.0;
        $dnpv = 0.0;
        foreach ($cashFlows as $t => $cf) {
            $d = pow(1 + $rate, $t);
            $npv  += $cf / $d;
            $dnpv -= $t * $cf / ($d * (1 + $rate));
        }
        if (abs($dnpv) < 1e-12) break;
        $next = $rate - $npv / $dnpv;
        if (abs($next - $rate) < 1e-7) return $next * 100;
        if ($next < -0.99 || $next > 10) return null;
        $rate = $next;
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────
// Port of propyteBuildCashFlows()
// ─────────────────────────────────────────────────────────────────────
function propyte_build_cashflows(
    float $totalInvested,
    float $annualNetRent,
    float $price,
    float $appreciationPct,
    int $years
): array {
    $flows = [-$totalInvested];
    for ($y = 1; $y <= $years; $y++) {
        $rent = $annualNetRent;
        if ($y === $years) {
            $rent += $price * pow(1 + $appreciationPct / 100, $years);
        }
        $flows[] = $rent;
    }
    return $flows;
}

// ─────────────────────────────────────────────────────────────────────
// 10 fixture scenarios — spanning typical Propyte marketplace profiles
// ─────────────────────────────────────────────────────────────────────
$scenarios = [
    [
        'name' => 'Depto CDMX $3M / DP 30% / 10% appr / 5yr / residencial',
        'price' => 3_000_000,
        'monthly_rent' => 18_000,
        'occupancy' => 0.95,
        'expense_ratio' => 0.20,
        'down_payment_pct' => 30,
        'closing_rate' => 0.06,
        'appreciation_pct' => 10,
        'years' => 5,
    ],
    [
        'name' => 'Depto CDMX $3M / DP 20% / 10% appr / 10yr / residencial',
        'price' => 3_000_000,
        'monthly_rent' => 18_000,
        'occupancy' => 0.95,
        'expense_ratio' => 0.20,
        'down_payment_pct' => 20,
        'closing_rate' => 0.06,
        'appreciation_pct' => 10,
        'years' => 10,
    ],
    [
        'name' => 'Casa Mérida $8M / DP 30% / 8% appr / 5yr / residencial',
        'price' => 8_000_000,
        'monthly_rent' => 38_000,
        'occupancy' => 0.95,
        'expense_ratio' => 0.20,
        'down_payment_pct' => 30,
        'closing_rate' => 0.06,
        'appreciation_pct' => 8,
        'years' => 5,
    ],
    [
        'name' => 'Penthouse Tulum $15M / DP 50% / 12% appr / 5yr / vacacional',
        'price' => 15_000_000,
        'monthly_rent' => 180_000,
        'occupancy' => 0.72,
        'expense_ratio' => 0.53,
        'down_payment_pct' => 50,
        'closing_rate' => 0.08,
        'appreciation_pct' => 12,
        'years' => 5,
    ],
    [
        'name' => 'Condo Playa del Carmen $2.5M / DP 20% / 11% appr / 10yr / vacacional',
        'price' => 2_500_000,
        'monthly_rent' => 45_000,
        'occupancy' => 0.70,
        'expense_ratio' => 0.53,
        'down_payment_pct' => 20,
        'closing_rate' => 0.08,
        'appreciation_pct' => 11,
        'years' => 10,
    ],
    [
        'name' => 'Macrolote $5M / DP 100% cash / 15% appr / 5yr / land-hold',
        'price' => 5_000_000,
        'monthly_rent' => 0,
        'occupancy' => 0,
        'expense_ratio' => 0,
        'down_payment_pct' => 100,
        'closing_rate' => 0.06,
        'appreciation_pct' => 15,
        'years' => 5,
    ],
    [
        'name' => 'Terreno Mérida $1.2M / DP 50% / 6% appr / 10yr / land-hold',
        'price' => 1_200_000,
        'monthly_rent' => 0,
        'occupancy' => 0,
        'expense_ratio' => 0,
        'down_payment_pct' => 50,
        'closing_rate' => 0.06,
        'appreciation_pct' => 6,
        'years' => 10,
    ],
    [
        'name' => 'Boutique Cancun ZH $25M / DP 30% / 10% appr / 5yr / vacacional high-end',
        'price' => 25_000_000,
        'monthly_rent' => 280_000,
        'occupancy' => 0.68,
        'expense_ratio' => 0.53,
        'down_payment_pct' => 30,
        'closing_rate' => 0.08,
        'appreciation_pct' => 10,
        'years' => 5,
    ],
    [
        'name' => 'Depto Tulum $4M / DP 35% / 13% appr / 5yr / vacacional',
        'price' => 4_000_000,
        'monthly_rent' => 58_000,
        'occupancy' => 0.75,
        'expense_ratio' => 0.53,
        'down_payment_pct' => 35,
        'closing_rate' => 0.08,
        'appreciation_pct' => 13,
        'years' => 5,
    ],
    [
        'name' => 'Edge: low-appreciation $3M / DP 20% / 3% appr / 10yr / residencial',
        'price' => 3_000_000,
        'monthly_rent' => 16_000,
        'occupancy' => 0.95,
        'expense_ratio' => 0.20,
        'down_payment_pct' => 20,
        'closing_rate' => 0.06,
        'appreciation_pct' => 3,
        'years' => 10,
    ],
];

// ─────────────────────────────────────────────────────────────────────
// Run fixtures
// ─────────────────────────────────────────────────────────────────────
$out = [];
foreach ($scenarios as $s) {
    $closingCosts = $s['price'] * $s['closing_rate'];
    $downPayment = $s['price'] * ($s['down_payment_pct'] / 100);
    $totalInvested = $downPayment + $closingCosts;

    $grossMonthly = $s['monthly_rent'] * $s['occupancy'];
    $netMonthly = $grossMonthly * (1 - $s['expense_ratio']);
    $annualNet = $netMonthly * 12;

    $cf = propyte_build_cashflows(
        $totalInvested,
        $annualNet,
        $s['price'],
        $s['appreciation_pct'],
        $s['years']
    );
    $irr = propyte_irr($cf);

    $out[] = [
        'name' => $s['name'],
        'input' => [
            'price' => $s['price'],
            'monthly_rent' => $s['monthly_rent'],
            'occupancy' => $s['occupancy'],
            'expense_ratio' => $s['expense_ratio'],
            'down_payment_pct' => $s['down_payment_pct'],
            'closing_rate' => $s['closing_rate'],
            'appreciation_pct' => $s['appreciation_pct'],
            'years' => $s['years'],
        ],
        'derived' => [
            'total_invested' => round($totalInvested, 2),
            'annual_net' => round($annualNet, 2),
            'closing_costs' => round($closingCosts, 2),
            'down_payment' => round($downPayment, 2),
        ],
        'cashflows' => array_map(fn($v) => round($v, 2), $cf),
        'irr_pct' => $irr !== null ? round($irr, 8) : null,
    ];
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
