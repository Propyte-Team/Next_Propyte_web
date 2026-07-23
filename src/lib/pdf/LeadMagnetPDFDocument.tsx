// src/lib/pdf/LeadMagnetPDFDocument.tsx
// PDF "Top 10 Oportunidades" (lead magnet, edición mensual es/en).
// Patrones heredados de CotizacionPDFDocument: Helvetica, footer fixed +
// paddingBottom 120, tarjetas wrap={false}. Sin fotos (v1: <1.5MB garantizado).
import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';
import type { ScoredUnit } from '@/lib/lead-magnet/score';
import type { EditionData } from '@/lib/lead-magnet/edition-data';

const C = {
  navy: '#1A2F3F', aztec: '#0F1923', teal: '#5CE0D2', ice: '#A2F9FF',
  text: '#1F2937', sub: '#6B7280', line: '#E5E7EB', bg: '#F8FAFC', white: '#FFFFFF',
};

const LABELS = {
  es: {
    docTitle: 'Top 10 Oportunidades de Inversión',
    region: 'Caribe Mexicano', edition: 'Edición',
    intro: 'Selección mensual de las unidades con mejor combinación de rentabilidad estimada, descuento vigente y desempeño de zona, según el análisis de mercado Propyte.',
    rank: '#', price: 'Precio', discount: 'Descuento', rent: 'Renta est./mes',
    yieldLbl: 'Yield bruto est.', roi: 'ROI proyectado', perYear: 'anual',
    bd: 'rec', seeUnit: 'Ver ficha completa',
    marketTitle: 'Panorama de mercado', strTitle: 'Renta vacacional — nivel ciudad',
    occupancy: 'Ocupación', adr: 'Tarifa/noche (ADR)', revpar: 'RevPAR',
    ltrTitle: 'Renta larga — mediana mensual', sample: 'muestra',
    zonesTitle: 'Top 5 zonas por desempeño', zoneScore: 'Score',
    methodTitle: 'Metodología', method:
      'Ranking por score compuesto (yield de renta 35%, ROI proyectado 30%, descuento 20%, desempeño de zona 15%) sobre el inventario público de propyte.com. Cifras en MXN. Fuente: Análisis de mercado Propyte.',
    disclaimer:
      'Estimaciones referenciales, no constituyen asesoría financiera ni garantía de rendimiento. Precios y disponibilidad sujetos a cambio sin previo aviso.',
    scan: 'Escanea para explorar', brand: 'Propyte · Tu aliado en bienes raíces',
    generatedOn: 'Generado el',
  },
  en: {
    docTitle: 'Top 10 Investment Opportunities',
    region: 'Mexican Caribbean', edition: 'Edition',
    intro: 'Monthly selection of the units with the best combination of estimated returns, active discounts and zone performance, according to Propyte market analysis.',
    rank: '#', price: 'Price', discount: 'Discount', rent: 'Est. rent/mo',
    yieldLbl: 'Est. gross yield', roi: 'Projected ROI', perYear: 'per year',
    bd: 'bd', seeUnit: 'View full listing',
    marketTitle: 'Market overview', strTitle: 'Vacation rental — city level',
    occupancy: 'Occupancy', adr: 'Nightly rate (ADR)', revpar: 'RevPAR',
    ltrTitle: 'Long-term rent — monthly median', sample: 'sample',
    zonesTitle: 'Top 5 zones by performance', zoneScore: 'Score',
    methodTitle: 'Methodology', method:
      'Composite-score ranking (rental yield 35%, projected ROI 30%, discount 20%, zone performance 15%) over propyte.com public inventory. Figures in MXN. Source: Propyte market analysis.',
    disclaimer:
      'Referential estimates; not financial advice nor a performance guarantee. Prices and availability subject to change without notice.',
    scan: 'Scan to explore', brand: 'Propyte · Your real estate ally',
    generatedOn: 'Generated on',
  },
} as const;

type Labels = (typeof LABELS)[keyof typeof LABELS];

export interface LeadMagnetPDFData {
  locale: 'es' | 'en';
  editionLabel: string;      // 'Agosto 2026' / 'August 2026'
  generatedAt: string;       // fecha legible
  data: EditionData;
  siteUrl: string;           // https://propyte.com
  qrCodeDataUrl: string;     // QR a {siteUrl}/{locale}/propiedades
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', fontSize: 9, color: C.text,
    paddingTop: 36, paddingHorizontal: 40, paddingBottom: 120, backgroundColor: C.white,
  },
  cover: { backgroundColor: C.aztec, borderRadius: 8, padding: 24, marginBottom: 16 },
  eyebrow: { color: C.ice, fontSize: 8, letterSpacing: 2, marginBottom: 6 },
  h1: { color: C.white, fontSize: 20, fontFamily: 'Helvetica-Bold' },
  coverSub: { color: C.teal, fontSize: 11, marginTop: 4 },
  intro: { color: '#D1D5DB', fontSize: 9, marginTop: 10, lineHeight: 1.5 },
  sectionTitle: {
    fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.navy,
    marginTop: 14, marginBottom: 8, paddingBottom: 4,
    borderBottomWidth: 1.5, borderBottomColor: C.teal,
  },
  card: {
    flexDirection: 'row', borderWidth: 1, borderColor: C.line, borderRadius: 6,
    padding: 10, marginBottom: 8, backgroundColor: C.bg,
  },
  rankBox: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: C.navy,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  rankText: { color: C.ice, fontSize: 11, fontFamily: 'Helvetica-Bold' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: C.navy },
  cardSub: { fontSize: 8, color: C.sub, marginTop: 2 },
  metricsRow: { flexDirection: 'row', marginTop: 6 },
  metric: { marginRight: 16 },
  metricLabel: { fontSize: 7, color: C.sub },
  metricValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.text, marginTop: 1 },
  discountBadge: { color: '#B91C1C', fontFamily: 'Helvetica-Bold' },
  unitLink: { fontSize: 8, color: '#0E7490', marginTop: 5, textDecoration: 'underline' },
  table: { borderWidth: 1, borderColor: C.line, borderRadius: 6, overflow: 'hidden' },
  tHead: { flexDirection: 'row', backgroundColor: C.navy, paddingVertical: 5, paddingHorizontal: 8 },
  tHeadCell: { color: C.white, fontSize: 8, fontFamily: 'Helvetica-Bold', flex: 1 },
  tRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: C.line },
  tCell: { fontSize: 8.5, flex: 1 },
  smallNote: { fontSize: 7.5, color: C.sub, marginTop: 6, lineHeight: 1.4 },
  footer: {
    position: 'absolute', bottom: 28, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8,
  },
  footerBrand: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy },
  footerLine: { fontSize: 7, color: C.sub, marginTop: 2 },
  footerRight: { alignItems: 'center' },
  qr: { width: 58, height: 58 },
  qrLabel: { fontSize: 6.5, color: C.sub, marginTop: 2 },
});

const fmtMoney = (n: number | null | undefined) =>
  n == null ? '—' : `$${Math.round(n).toLocaleString('en-US')}`;
const fmtPct = (n: number | null | undefined, d = 1) =>
  n == null ? '—' : `${n.toFixed(d)}%`;

function UnitCard({ u, i, L, siteUrl, locale }: {
  u: ScoredUnit; i: number; L: Labels; siteUrl: string; locale: string;
}) {
  const href = `${siteUrl}/${locale}/propiedades/${u.slug}`;
  return (
    <View style={styles.card} wrap={false}>
      <View style={styles.rankBox}><Text style={styles.rankText}>{i + 1}</Text></View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{u.development_name ?? u.slug}</Text>
        <Text style={styles.cardSub}>
          {[u.city, u.zone].filter(Boolean).join(' · ')}
          {u.bedrooms != null ? `  ·  ${u.bedrooms} ${L.bd}` : ''}
          {u.area_m2 != null ? `  ·  ${Math.round(u.area_m2)} m²` : ''}
        </Text>
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>{L.price}</Text>
            <Text style={styles.metricValue}>{fmtMoney(u.effectivePrice)} MXN</Text>
          </View>
          {u.discountPct > 0 && (
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{L.discount}</Text>
              <Text style={[styles.metricValue, styles.discountBadge]}>-{fmtPct(u.discountPct, 0)}</Text>
            </View>
          )}
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>{L.rent}</Text>
            <Text style={styles.metricValue}>{fmtMoney(u.estimated_rent_mxn)}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>{L.yieldLbl}</Text>
            <Text style={styles.metricValue}>{fmtPct(u.grossYieldPct)}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>{L.roi} *</Text>
            <Text style={styles.metricValue}>{fmtPct(u.roiPct)} {L.perYear}</Text>
          </View>
        </View>
        <Link src={href}><Text style={styles.unitLink}>{L.seeUnit} →</Text></Link>
      </View>
    </View>
  );
}

export default function LeadMagnetPDFDocument({ locale, editionLabel, generatedAt, data, siteUrl, qrCodeDataUrl }: LeadMagnetPDFData) {
  const L = LABELS[locale];
  return (
    <Document title={`${L.docTitle} — ${editionLabel}`} author="Propyte">
      <Page size="A4" style={styles.page}>
        {/* Portada compacta */}
        <View style={styles.cover}>
          <Text style={styles.eyebrow}>PROPYTE · {L.region.toUpperCase()}</Text>
          <Text style={styles.h1}>{L.docTitle}</Text>
          <Text style={styles.coverSub}>{L.edition} {editionLabel}</Text>
          <Text style={styles.intro}>{L.intro}</Text>
        </View>

        {/* Top 10 */}
        {data.topUnits.map((u, i) => (
          <UnitCard key={u.id} u={u} i={i} L={L} siteUrl={siteUrl} locale={locale} />
        ))}
        <Text style={styles.smallNote}>* {L.disclaimer}</Text>

        {/* Panorama de mercado */}
        <Text style={styles.sectionTitle} break>{L.marketTitle}</Text>

        <Text style={[styles.cardTitle, { marginBottom: 6 }]}>{L.strTitle}</Text>
        <View style={styles.table}>
          <View style={styles.tHead}>
            <Text style={styles.tHeadCell}>—</Text>
            <Text style={styles.tHeadCell}>{L.occupancy}</Text>
            <Text style={styles.tHeadCell}>{L.adr}</Text>
            <Text style={styles.tHeadCell}>{L.revpar}</Text>
          </View>
          {data.cityBenchmarks.map((b) => (
            <View style={styles.tRow} key={b.city} wrap={false}>
              <Text style={[styles.tCell, { fontFamily: 'Helvetica-Bold' }]}>{b.city}</Text>
              <Text style={styles.tCell}>{fmtPct(b.median_occupancy, 0)}</Text>
              <Text style={styles.tCell}>{fmtMoney(b.median_adr)}</Text>
              <Text style={styles.tCell}>{fmtMoney(b.revpar)}</Text>
            </View>
          ))}
        </View>

        {data.ltrByCity.length > 0 && (
          <>
            <Text style={[styles.cardTitle, { marginTop: 12, marginBottom: 6 }]}>{L.ltrTitle}</Text>
            <View style={styles.table}>
              {data.ltrByCity.map((r) => (
                <View style={styles.tRow} key={r.city} wrap={false}>
                  <Text style={[styles.tCell, { fontFamily: 'Helvetica-Bold' }]}>{r.city}</Text>
                  <Text style={styles.tCell}>{fmtMoney(r.medianRent)} MXN</Text>
                  <Text style={styles.tCell}>{L.sample}: {r.sample}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {data.topZones.length > 0 && (
          <>
            <Text style={[styles.cardTitle, { marginTop: 12, marginBottom: 6 }]}>{L.zonesTitle}</Text>
            <View style={styles.table}>
              {data.topZones.map((z) => (
                <View style={styles.tRow} key={`${z.city}-${z.zone}`} wrap={false}>
                  <Text style={[styles.tCell, { fontFamily: 'Helvetica-Bold', flex: 2 }]}>{z.zone} · {z.city}</Text>
                  <Text style={styles.tCell}>{L.zoneScore}: {z.score == null ? '—' : Math.round(z.score)}</Text>
                  <Text style={styles.tCell}>{L.occupancy}: {fmtPct(z.median_occupancy, 0)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Metodología + disclaimer */}
        <Text style={styles.sectionTitle}>{L.methodTitle}</Text>
        <Text style={styles.smallNote}>{L.method}</Text>
        <Text style={styles.smallNote}>{L.disclaimer}</Text>

        {/* Footer fijo (paddingBottom:120 lo protege — lección cotización A1) */}
        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerBrand}>{L.brand}</Text>
            <Link src={siteUrl}><Text style={styles.footerLine}>{siteUrl.replace(/^https?:\/\//, '')}</Text></Link>
            <Text style={styles.footerLine}>{L.generatedOn} {generatedAt}</Text>
          </View>
          <View style={styles.footerRight}>
            <Image src={qrCodeDataUrl} style={styles.qr} />
            <Text style={styles.qrLabel}>{L.scan}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
