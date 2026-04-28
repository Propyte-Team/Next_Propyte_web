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

// NOTE: @react-pdf/renderer does NOT support CSS `gap`. Use marginRight / marginBottom.
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#2C2C2C',
    padding: 40,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
    marginBottom: 20,
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2F3F',
    letterSpacing: 1,
  },
  logoAccent: { color: '#0D9488' },
  docType: {
    fontSize: 9,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroBlock: {
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: 220,
    objectFit: 'cover',
    borderRadius: 8,
    marginBottom: 12,
  },
  heroPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#F4F6F8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stageBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#5CE0D2',
    color: '#1A2F3F',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  h1: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A2F3F',
    marginBottom: 4,
  },
  location: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 16,
  },
  priceBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F1923',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  priceBlockLeft: { flex: 1 },
  priceBlockRight: { alignItems: 'flex-end' },
  priceLabel: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  roiPill: {
    backgroundColor: '#5CE0D2',
    color: '#1A2F3F',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  specsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  specCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  specCellLast: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  specLabel: {
    fontSize: 8,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  specValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A2F3F',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A2F3F',
    marginBottom: 8,
    marginTop: 12,
  },
  descBody: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#4B5563',
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    borderRadius: 6,
    padding: 10,
    marginRight: 8,
  },
  metricCardLast: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    borderRadius: 6,
    padding: 10,
  },
  metricLabel: {
    fontSize: 8,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0D9488',
  },
  amenityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  amenityChip: {
    backgroundColor: '#F4F6F8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 9,
    color: '#4B5563',
    marginRight: 6,
    marginBottom: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  footerInfo: { flex: 1 },
  footerTagline: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1A2F3F',
    marginBottom: 2,
  },
  footerUrl: {
    fontSize: 8,
    color: '#6B7280',
  },
  qr: {
    width: 60,
    height: 60,
  },
  qrLabel: {
    fontSize: 7,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
  },
  disclaimer: {
    fontSize: 7,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

const fmtPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const fmtRange = (r: { min: number; max: number }, suffix: string) =>
  r.min === r.max ? `${r.max} ${suffix}` : `${r.min}–${r.max} ${suffix}`;

export function PropertyPDFDocument({ data }: { data: PropertyPDFData }) {
  const { labels } = data;
  const description = data.description;

  const specs: Array<{ label: string; value: string }> = [];
  if (data.bedroomsRange) specs.push({
    label: labels.bedrooms,
    value: fmtRange(data.bedroomsRange, ''),
  });
  if (data.bathroomsRange) specs.push({
    label: labels.bathrooms,
    value: fmtRange(data.bathroomsRange, ''),
  });
  if (data.areaRange) specs.push({
    label: labels.area,
    value: fmtRange(data.areaRange, 'm²'),
  });
  specs.push({ label: labels.stage, value: data.stageLabel });

  const metrics: Array<{ label: string; value: string }> = [];
  if (data.roiProjected != null)
    metrics.push({ label: 'ROI', value: `${data.roiProjected.toFixed(1)}%` });
  if (data.capRate != null)
    metrics.push({ label: 'Cap Rate', value: `${data.capRate.toFixed(1)}%` });
  if (data.irr5y != null)
    metrics.push({ label: labels.irr5y, value: `${data.irr5y.toFixed(1)}%` });
  if (data.estimatedRent != null)
    metrics.push({
      label: labels.estRentMo,
      value: fmtPrice(data.estimatedRent),
    });

  return (
    <Document title={`${data.name} — Propyte`} author="Propyte" creator="Propyte">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            PROPYTE<Text style={styles.logoAccent}>.</Text>
          </Text>
          <Text style={styles.docType}>{labels.snapshot}</Text>
        </View>

        {/* Hero */}
        <View style={styles.heroBlock}>
          {data.heroImage ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image (PDF), not DOM img; alt has no effect */}
              <Image src={data.heroImage} style={styles.heroImage} />
              <Text style={styles.stageBadge}>{data.stageLabel.toUpperCase()}</Text>
            </>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={{ color: '#9CA3AF', fontSize: 11 }}>{labels.imageNotAvailable}</Text>
            </View>
          )}
        </View>

        {/* Title + Location */}
        <Text style={styles.h1}>{data.name}</Text>
        <Text style={styles.location}>
          {data.address ? `${data.address} · ` : ''}{data.zone ? `${data.zone}, ` : ''}{data.city}, {data.state}
        </Text>

        {/* Price + ROI */}
        <View style={styles.priceBlock}>
          <View style={styles.priceBlockLeft}>
            <Text style={styles.priceLabel}>
              {data.priceMax && data.priceMax > data.price
                ? labels.priceRange
                : labels.startingFrom}
            </Text>
            <Text style={styles.priceValue}>
              {data.priceMax && data.priceMax > data.price
                ? `${fmtPrice(data.price)} – ${fmtPrice(data.priceMax)}`
                : fmtPrice(data.price)}
            </Text>
          </View>
          {data.roiProjected != null && (
            <View style={styles.priceBlockRight}>
              <Text style={styles.priceLabel}>{labels.projectedRoi}</Text>
              <Text style={styles.roiPill}>
                {data.roiProjected.toFixed(1)}% {labels.annual}
              </Text>
            </View>
          )}
        </View>

        {/* Specs strip */}
        {specs.length > 0 && (
          <View style={styles.specsRow}>
            {specs.map((s, i) => (
              <View key={i} style={i === specs.length - 1 ? styles.specCellLast : styles.specCell}>
                <Text style={styles.specLabel}>{s.label}</Text>
                <Text style={styles.specValue}>{s.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Description */}
        {description && (
          <>
            <Text style={styles.sectionTitle}>{labels.overview}</Text>
            <Text style={styles.descBody}>{description.slice(0, 680)}</Text>
          </>
        )}

        {/* Investment metrics */}
        {metrics.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{labels.investmentMetrics}</Text>
            <View style={styles.metricsRow}>
              {metrics.slice(0, 4).map((m, i) => (
                <View key={i} style={i === Math.min(metrics.length, 4) - 1 ? styles.metricCardLast : styles.metricCard}>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                  <Text style={styles.metricValue}>{m.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Amenities */}
        {data.amenities.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{labels.amenities}</Text>
            <View style={styles.amenityList}>
              {data.amenities.slice(0, 16).map((a, i) => (
                <Text key={i} style={styles.amenityChip}>{a}</Text>
              ))}
            </View>
          </>
        )}

        {/* Developer */}
        {data.developer && (
          <>
            <Text style={styles.sectionTitle}>{labels.developer}</Text>
            <Text style={styles.descBody}>{data.developer}</Text>
          </>
        )}

        <Text style={styles.disclaimer}>{labels.disclaimer}</Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerInfo}>
            <Text style={styles.footerTagline}>Propyte · Real estate en modo inteligente</Text>
            <Link src={data.url}><Text style={styles.footerUrl}>{data.url}</Text></Link>
            <Text style={styles.footerUrl}>
              {labels.generatedOn} {data.generatedAt}
            </Text>
          </View>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image (PDF), not DOM img */}
            <Image src={data.qrCodeDataUrl} style={styles.qr} />
            <Text style={styles.qrLabel}>{labels.scan}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
