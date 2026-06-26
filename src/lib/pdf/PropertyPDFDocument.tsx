import {
  Document, Page, Text, View, StyleSheet, Image, Link,
} from '@react-pdf/renderer';

export interface PropertyPDFLabels {
  snapshot: string;
  imageNotAvailable: string;
  priceRange: string;
  startingFrom: string;
  projectedRoi: string;
  annual: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  stage: string;
  irr5y: string;
  estRentMo: string;
  overview: string;
  investmentMetrics: string;
  amenities: string;
  developer: string;
  disclaimer: string;
  generatedOn: string;
  scan: string;
  entregaEstimada: string;
  contact: string;
}

export interface PropertyPDFData {
  name: string;
  kind: 'development' | 'unit';
  url: string;
  heroImage: string | null;
  city: string;
  zone: string;
  state: string;
  address: string | null;
  price: number;
  priceMax?: number | null;
  areaRange?: { min: number; max: number } | null;
  bedroomsRange?: { min: number; max: number } | null;
  bathroomsRange?: { min: number; max: number } | null;
  developer: string | null;
  stageLabel: string;
  deliveryLabel?: string | null;
  whatsapp?: string | null;
  description: string;
  roiProjected: number | null;
  capRate: number | null;
  irr5y: number | null;
  irr10y: number | null;
  estimatedRent: number | null;
  amenities: string[];
  qrCodeDataUrl: string;
  locale: 'es' | 'en';
  generatedAt: string;
  labels: PropertyPDFLabels;
}

// Tokens de marca (canónicos WP)
const C = {
  teal: '#5CE0D2',
  tealInk: '#0E7490', // accent legible sobre blanco (WCAG AA)
  navy: '#1A2F3F',
  aztec: '#0F1923',
  ink: '#2C2C2C',
  muted: '#6B7280',
  faint: '#9CA3AF',
  hair: '#E8ECEF',
  surface: '#F4F6F8',
  tealSurface: '#F0FDFA',
  tealHair: '#CCFBF1',
};

// NOTA: @react-pdf/renderer NO soporta CSS `gap`. Usar marginRight / marginBottom.
// El font estándar Helvetica no incluye glifos como ✓ (U+2713): usar Views, no símbolos.
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.ink,
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 64,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  brandLockup: { flexDirection: 'row', alignItems: 'center' },
  brandMark: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: C.teal,
    marginRight: 7,
  },
  brandWord: {
    fontSize: 17,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    letterSpacing: 0.3,
  },
  docType: {
    fontSize: 8,
    color: C.faint,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  rule: { height: 1, backgroundColor: C.hair, marginBottom: 18 },

  /* Hero */
  heroBlock: { marginBottom: 18, position: 'relative' },
  heroImage: {
    width: '100%',
    height: 224,
    objectFit: 'cover',
    borderRadius: 10,
  },
  heroPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: C.surface,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderText: { color: C.faint, fontSize: 11 },
  stageBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: C.teal,
    color: C.aztec,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },

  /* Title */
  h1: {
    fontSize: 21,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    marginBottom: 5,
    lineHeight: 1.15,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  locDot: { width: 5, height: 5, borderRadius: 999, backgroundColor: C.teal, marginRight: 6 },
  location: { fontSize: 10.5, color: C.muted },

  /* Price block */
  priceBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.aztec,
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  priceBlockLeft: { flex: 1 },
  priceLabel: {
    fontSize: 8,
    color: '#94A3B8',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  priceValue: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  roiPill: { alignItems: 'flex-end' },
  roiPillLabel: { fontSize: 8, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  roiPillValue: {
    backgroundColor: C.teal,
    color: C.aztec,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  /* Specs strip */
  specsRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: C.hair,
    borderRadius: 10,
    marginBottom: 18,
    overflow: 'hidden',
  },
  specCell: { flex: 1, paddingHorizontal: 12, paddingVertical: 11 },
  specDivider: { width: 1, backgroundColor: C.hair },
  specLabel: {
    fontSize: 7.5,
    color: C.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  specValue: { fontSize: 12.5, fontFamily: 'Helvetica-Bold', color: C.navy },

  /* Section */
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 9, marginTop: 4 },
  sectionTick: { width: 3, height: 13, borderRadius: 2, backgroundColor: C.teal, marginRight: 8 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.navy },

  descBody: { fontSize: 9.5, lineHeight: 1.55, color: '#4B5563', marginBottom: 18 },

  /* Metrics */
  metricsRow: { flexDirection: 'row', marginBottom: 18 },
  metricCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  metricCardLast: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  metricLabel: { fontSize: 7.5, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 },
  metricValue: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.tealInk },

  /* Amenities — checklist 2 columnas */
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 18 },
  amenityItem: { width: '50%', flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingRight: 10 },
  amenityDot: { width: 5, height: 5, borderRadius: 2, backgroundColor: C.teal, marginRight: 8 },
  amenityText: { fontSize: 9.5, color: '#374151', flex: 1 },

  /* Highlight boxes (entrega / developer) */
  infoRow: { flexDirection: 'row', marginBottom: 18 },
  infoBox: {
    flex: 1,
    backgroundColor: C.tealSurface,
    borderWidth: 1,
    borderColor: C.tealHair,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  infoBoxLast: {
    flex: 1,
    backgroundColor: C.tealSurface,
    borderWidth: 1,
    borderColor: C.tealHair,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  infoLabel: { fontSize: 7.5, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  infoValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.tealInk },

  disclaimer: {
    fontSize: 7,
    color: C.faint,
    lineHeight: 1.4,
    marginTop: 6,
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: C.hair,
    paddingTop: 10,
  },
  footerInfo: { flex: 1, paddingRight: 16 },
  footerBrand: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 3 },
  footerLine: { fontSize: 8, color: C.muted, marginBottom: 2 },
  footerRight: { alignItems: 'center' },
  qr: { width: 58, height: 58 },
  qrLabel: { fontSize: 6.5, color: C.faint, textAlign: 'center', marginTop: 3, maxWidth: 64 },
});

const fmtPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const fmtRange = (r: { min: number; max: number }, suffix: string) =>
  r.min === r.max ? `${r.max}${suffix}` : `${r.min}–${r.max}${suffix}`;

export function PropertyPDFDocument({ data }: { data: PropertyPDFData }) {
  const { labels } = data;
  const description = data.description;

  const specs: Array<{ label: string; value: string }> = [];
  if (data.bedroomsRange) specs.push({ label: labels.bedrooms, value: fmtRange(data.bedroomsRange, '') });
  if (data.bathroomsRange) specs.push({ label: labels.bathrooms, value: fmtRange(data.bathroomsRange, '') });
  if (data.areaRange) specs.push({ label: labels.area, value: fmtRange(data.areaRange, ' m²') });
  specs.push({ label: labels.stage, value: data.stageLabel });

  const metrics: Array<{ label: string; value: string }> = [];
  if (data.roiProjected != null) metrics.push({ label: 'ROI', value: `${data.roiProjected.toFixed(1)}%` });
  if (data.capRate != null) metrics.push({ label: 'Cap Rate', value: `${data.capRate.toFixed(1)}%` });
  if (data.irr5y != null) metrics.push({ label: labels.irr5y, value: `${data.irr5y.toFixed(1)}%` });
  if (data.estimatedRent != null) metrics.push({ label: labels.estRentMo, value: fmtPrice(data.estimatedRent) });

  const amenities = data.amenities.slice(0, 12);
  const hasInfoRow = Boolean(data.deliveryLabel) || Boolean(data.developer);
  const priceIsRange = data.priceMax != null && data.priceMax > data.price;
  const waDigits = (data.whatsapp || '').replace(/[^\d]/g, '');

  return (
    <Document title={`${data.name} — Propyte`} author="Propyte" creator="Propyte" subject={labels.snapshot}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.brandLockup}>
            <View style={styles.brandMark} />
            <Text style={styles.brandWord}>propyte</Text>
          </View>
          <Text style={styles.docType}>{labels.snapshot}</Text>
        </View>
        <View style={styles.rule} />

        {/* Hero */}
        <View style={styles.heroBlock}>
          {data.heroImage ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image (PDF), not DOM img */}
              <Image src={data.heroImage} style={styles.heroImage} />
              <Text style={styles.stageBadge}>{data.stageLabel}</Text>
            </>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroPlaceholderText}>{labels.imageNotAvailable}</Text>
            </View>
          )}
        </View>

        {/* Title + Location */}
        <Text style={styles.h1}>{data.name}</Text>
        <View style={styles.locationRow}>
          <View style={styles.locDot} />
          <Text style={styles.location}>
            {data.address ? `${data.address} · ` : ''}{data.zone ? `${data.zone}, ` : ''}{data.city}{data.state ? `, ${data.state}` : ''}
          </Text>
        </View>

        {/* Price + ROI */}
        <View style={styles.priceBlock}>
          <View style={styles.priceBlockLeft}>
            <Text style={styles.priceLabel}>{priceIsRange ? labels.priceRange : labels.startingFrom}</Text>
            <Text style={styles.priceValue}>
              {priceIsRange ? `${fmtPrice(data.price)} – ${fmtPrice(data.priceMax!)}` : fmtPrice(data.price)}
            </Text>
          </View>
          {data.roiProjected != null && (
            <View style={styles.roiPill}>
              <Text style={styles.roiPillLabel}>{labels.projectedRoi}</Text>
              <Text style={styles.roiPillValue}>{data.roiProjected.toFixed(1)}% {labels.annual}</Text>
            </View>
          )}
        </View>

        {/* Specs strip */}
        {specs.length > 0 && (
          <View style={styles.specsRow}>
            {specs.map((s, i) => (
              <View key={i} style={{ flex: 1, flexDirection: 'row' }}>
                {i > 0 && <View style={styles.specDivider} />}
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>{s.label}</Text>
                  <Text style={styles.specValue}>{s.value}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Description */}
        {description ? (
          <>
            <View style={styles.sectionHead}>
              <View style={styles.sectionTick} />
              <Text style={styles.sectionTitle}>{labels.overview}</Text>
            </View>
            <Text style={styles.descBody}>{description.slice(0, 620)}</Text>
          </>
        ) : null}

        {/* Investment metrics */}
        {metrics.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <View style={styles.sectionTick} />
              <Text style={styles.sectionTitle}>{labels.investmentMetrics}</Text>
            </View>
            <View style={styles.metricsRow}>
              {metrics.slice(0, 4).map((m, i, arr) => (
                <View key={i} style={i === arr.length - 1 ? styles.metricCardLast : styles.metricCard}>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                  <Text style={styles.metricValue}>{m.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Amenities checklist */}
        {amenities.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <View style={styles.sectionTick} />
              <Text style={styles.sectionTitle}>{labels.amenities}</Text>
            </View>
            <View style={styles.amenityGrid}>
              {amenities.map((a, i) => (
                <View key={i} style={styles.amenityItem}>
                  <View style={styles.amenityDot} />
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Entrega + Desarrolladora */}
        {hasInfoRow && (
          <View style={styles.infoRow}>
            {data.deliveryLabel ? (
              <View style={data.developer ? styles.infoBox : styles.infoBoxLast}>
                <Text style={styles.infoLabel}>{labels.entregaEstimada}</Text>
                <Text style={styles.infoValue}>{data.deliveryLabel}</Text>
              </View>
            ) : null}
            {data.developer ? (
              <View style={styles.infoBoxLast}>
                <Text style={styles.infoLabel}>{labels.developer}</Text>
                <Text style={styles.infoValue}>{data.developer}</Text>
              </View>
            ) : null}
          </View>
        )}

        <Text style={styles.disclaimer}>{labels.disclaimer}</Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerInfo}>
            <Text style={styles.footerBrand}>Propyte · Tu aliado en bienes raíces</Text>
            {waDigits ? <Text style={styles.footerLine}>WhatsApp: +{waDigits}</Text> : null}
            <Link src={data.url}><Text style={styles.footerLine}>{data.url.replace(/^https?:\/\//, '')}</Text></Link>
            <Text style={styles.footerLine}>{labels.generatedOn} {data.generatedAt}</Text>
          </View>
          <View style={styles.footerRight}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image (PDF), not DOM img */}
            <Image src={data.qrCodeDataUrl} style={styles.qr} />
            <Text style={styles.qrLabel}>{labels.scan}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
