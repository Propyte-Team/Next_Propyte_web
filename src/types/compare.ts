export type CompareKind = 'development' | 'unit'

export interface ComparisonMetrics {
  pricePerM2: number | null      // MXN por m²
  zoneOccupancy: number | null   // 0-100
  zoneAdr: number | null         // MXN
  roiNetYieldPct: number | null  // % anual, all-cash vacacional
}

export interface ComparisonItem {
  id: string
  kind: CompareKind
  name: string
  slug: string | null
  city: string | null
  zone: string | null
  priceBaseMxn: number | null    // desarrollo: price_min_mxn; unidad: price_mxn
  metrics: ComparisonMetrics
}

export interface ComparisonPayload {
  kind: CompareKind
  items: ComparisonItem[]
}
