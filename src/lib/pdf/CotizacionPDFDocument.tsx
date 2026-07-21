import {
  Document, Page, Text, View, StyleSheet, Image, Link,
} from '@react-pdf/renderer';

export interface CotizacionPDFAnnualRow {
  anio: number;
  cuota: number;
  interes: number;
  capital: number;
  saldoFinal: number;
}

export interface CotizacionPDFLabels {
  docType: string;
  bloquePrecio: string; precio: string; descuento: string; precioVenta: string;
  bloqueInversion: string; enganche: string; escrituracion: string; mobiliario: string;
  decoracion: string; incluido: string; inversionInicial: string;
  bloqueSaldo: string; saldo: string; mensualidades: string; interes: string; mensualidad: string;
  corridaTitle: string; colYear: string; colPayment: string; colInterest: string; colCapital: string; colBalance: string;
  totalInterest: string; totalPaid: string;
  perfil: string;
  tasaPlazo: string;
  avisoCambiario: string | null;
  disclaimer: string; generatedOn: string; scan: string;
  preventaTitle: string;
  preventaEngancheInicial: string;
  preventaEngancheDiferido: string;
  preventaObra: string;
  preventaContraentrega: string;
}

export interface CotizacionPDFData {
  name: string;
  url: string;
  city: string;
  zone: string;
  state: string;
  locale: 'es' | 'en';
  generatedAt: string;
  precio: number;
  descuentoPct: number;
  precioVenta: number;
  enganche: number;
  enganchePct: number;
  escrituracion: number;
  mobiliario: number;
  decoracion: number;
  mobiliarioIncluido: boolean;
  decoracionIncluido: boolean;
  inversionTotal: number;
  saldo: number;
  mensualidades: number;
  interesPct: number;
  mensualidad: number;
  totalIntereses: number;
  totalPagado: number;
  tieneInteres: boolean;
  annual: CotizacionPDFAnnualRow[];
  qrCodeDataUrl: string;
  labels: CotizacionPDFLabels;
  preventa?: {
    engancheInicial: number;
    engancheInicialPct: number;
    engancheDiferido: number;
    engancheDiferidoPct: number;
    engancheDiferidoMeses: number;
    engancheDiferidoMensual: number;
    obra: number;
    obraPct: number;
    obraMeses: number;
    obraMensual: number;
    contraentrega: number;
    contraentregaPct: number;
    viaLabel: string;
  } | null;
}

const C = {
  teal: '#5CE0D2', tealInk: '#0E7490', navy: '#1A2F3F', aztec: '#0F1923',
  ink: '#2C2C2C', muted: '#6B7280', faint: '#9CA3AF', hair: '#E8ECEF',
  surface: '#F4F6F8', amberBg: '#FFFBEB', amberBorder: '#FDE68A', amberInk: '#92400E',
};

const styles = StyleSheet.create({
  // paddingBottom reserva espacio para el footer fijo (QR 58 + label + brand ≈ 100pt sobre bottom:28).
  // Con 64 el QR/footer se encimaba sobre las últimas filas de la corrida en páginas llenas.
  page: { fontFamily: 'Helvetica', fontSize: 10, color: C.ink, paddingTop: 36, paddingHorizontal: 40, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  brandLockup: { flexDirection: 'row', alignItems: 'center' },
  brandMark: { width: 14, height: 14, borderRadius: 4, backgroundColor: C.teal, marginRight: 7 },
  brandWord: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: C.navy, letterSpacing: 0.3 },
  docType: { fontSize: 8, color: C.faint, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1.4 },
  rule: { height: 1, backgroundColor: C.hair, marginBottom: 16 },
  h1: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 4, lineHeight: 1.15 },
  location: { fontSize: 10, color: C.muted, marginBottom: 14 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.aztec, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 14 },
  profileLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  profileMeta: { fontSize: 10, color: C.teal, fontFamily: 'Helvetica-Bold' },

  blocksRow: { flexDirection: 'row', marginBottom: 16 },
  block: { flex: 1, borderWidth: 1, borderColor: C.hair, borderRadius: 8, padding: 10, marginRight: 8 },
  blockLast: { flex: 1, borderWidth: 1, borderColor: C.hair, borderRadius: 8, padding: 10 },
  blockTitle: { fontSize: 7.5, color: C.faint, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'Helvetica-Bold', marginBottom: 7 },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  kvLabel: { fontSize: 8.5, color: C.muted },
  kvValue: { fontSize: 8.5, color: C.ink },
  kvTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: C.hair },
  kvTotalLabel: { fontSize: 9, color: C.tealInk, fontFamily: 'Helvetica-Bold' },
  kvTotalValue: { fontSize: 9, color: C.tealInk, fontFamily: 'Helvetica-Bold' },

  aviso: { flexDirection: 'row', backgroundColor: C.amberBg, borderWidth: 1, borderColor: C.amberBorder, borderRadius: 6, padding: 8, marginBottom: 14 },
  avisoText: { fontSize: 7.5, color: C.amberInk, lineHeight: 1.4 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTick: { width: 3, height: 12, borderRadius: 2, backgroundColor: C.teal, marginRight: 8 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.navy },

  summaryRow: { flexDirection: 'row', marginBottom: 12 },
  summaryCard: { flex: 1, backgroundColor: C.surface, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 11, marginRight: 8 },
  summaryCardLast: { flex: 1, backgroundColor: C.surface, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 11 },
  summaryLabel: { fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  summaryValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.tealInk },

  table: { borderWidth: 1, borderColor: C.hair, borderRadius: 8, overflow: 'hidden' },
  tHead: { flexDirection: 'row', backgroundColor: C.surface },
  tRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.hair },
  th: { fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'Helvetica-Bold', paddingVertical: 5, paddingHorizontal: 6 },
  td: { fontSize: 8, color: C.ink, paddingVertical: 4, paddingHorizontal: 6 },
  colYear: { width: '16%' },
  colNum: { width: '21%', textAlign: 'right' },

  disclaimer: { fontSize: 7, color: C.faint, lineHeight: 1.4, marginTop: 10 },
  footer: { position: 'absolute', bottom: 28, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: C.hair, paddingTop: 10 },
  footerInfo: { flex: 1, paddingRight: 16 },
  footerBrand: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 3 },
  footerLine: { fontSize: 8, color: C.muted, marginBottom: 2 },
  footerRight: { alignItems: 'center' },
  qr: { width: 58, height: 58 },
  qrLabel: { fontSize: 6.5, color: C.faint, textAlign: 'center', marginTop: 3, maxWidth: 64 },
});

const fmt = (n: number) =>
  `${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)} MXN`;

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

export function CotizacionPDFDocument({ data }: { data: CotizacionPDFData }) {
  const L = data.labels;
  return (
    <Document title={`${data.name} — ${L.docType} — Propyte`} author="Propyte" creator="Propyte" subject={L.docType} language={data.locale}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.brandLockup}>
            <View style={styles.brandMark} />
            <Text style={styles.brandWord}>propyte</Text>
          </View>
          <Text style={styles.docType}>{L.docType}</Text>
        </View>
        <View style={styles.rule} />

        <Text style={styles.h1}>{data.name}</Text>
        <Text style={styles.location}>
          {data.zone ? `${data.zone}, ` : ''}{data.city}{data.state ? `, ${data.state}` : ''}
        </Text>

        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>{L.perfil}</Text>
          <Text style={styles.profileMeta}>{L.tasaPlazo}</Text>
        </View>

        {data.preventa && (
          <View style={[styles.blockLast, { marginBottom: 16 }]}>
            <Text style={styles.blockTitle}>{L.preventaTitle}</Text>
            <KV
              label={`${L.preventaEngancheInicial} (${data.preventa.engancheInicialPct}%)`}
              value={fmt(data.preventa.engancheInicial)}
            />
            {data.preventa.engancheDiferido > 0 && (
              <KV
                label={`${L.preventaEngancheDiferido} (${data.preventa.engancheDiferidoPct}%) · ${data.preventa.engancheDiferidoMeses}m`}
                value={fmt(data.preventa.engancheDiferido)}
              />
            )}
            {data.preventa.obra > 0 && (
              <KV
                label={`${L.preventaObra} (${data.preventa.obraPct}%) · ${data.preventa.obraMeses}m`}
                value={fmt(data.preventa.obra)}
              />
            )}
            <View style={styles.kvTotalRow}>
              <Text style={styles.kvTotalLabel}>
                {`${L.preventaContraentrega} (${data.preventa.contraentregaPct}%) · ${data.preventa.viaLabel}`}
              </Text>
              <Text style={styles.kvTotalValue}>{fmt(data.preventa.contraentrega)}</Text>
            </View>
          </View>
        )}

        {/* 3 bloques */}
        <View style={styles.blocksRow}>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>{L.bloquePrecio}</Text>
            <KV label={L.precio} value={fmt(data.precio)} />
            {data.descuentoPct > 0 && <KV label={L.descuento} value={`-${data.descuentoPct}%`} />}
            <View style={styles.kvTotalRow}>
              <Text style={styles.kvTotalLabel}>{L.precioVenta}</Text>
              <Text style={styles.kvTotalValue}>{fmt(data.precioVenta)}</Text>
            </View>
          </View>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>{L.bloqueInversion}</Text>
            <KV label={`${L.enganche} (${data.enganchePct}%)`} value={fmt(data.enganche)} />
            <KV label={L.escrituracion} value={fmt(data.escrituracion)} />
            <KV label={L.mobiliario} value={data.mobiliarioIncluido ? L.incluido : fmt(data.mobiliario)} />
            <KV label={L.decoracion} value={data.decoracionIncluido ? L.incluido : fmt(data.decoracion)} />
            <View style={styles.kvTotalRow}>
              <Text style={styles.kvTotalLabel}>{L.inversionInicial}</Text>
              <Text style={styles.kvTotalValue}>{fmt(data.inversionTotal)}</Text>
            </View>
          </View>
          <View style={styles.blockLast}>
            <Text style={styles.blockTitle}>{L.bloqueSaldo}</Text>
            <KV label={L.saldo} value={fmt(data.saldo)} />
            <KV label={L.mensualidades} value={String(data.mensualidades)} />
            <KV label={L.interes} value={`${data.interesPct.toFixed(2)}%`} />
            <View style={styles.kvTotalRow}>
              <Text style={styles.kvTotalLabel}>{L.mensualidad}</Text>
              <Text style={styles.kvTotalValue}>{fmt(data.mensualidad)}</Text>
            </View>
          </View>
        </View>

        {L.avisoCambiario && (
          <View style={styles.aviso}>
            <Text style={styles.avisoText}>{L.avisoCambiario}</Text>
          </View>
        )}

        {/* Resumen corrida */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{L.mensualidad}</Text>
            <Text style={styles.summaryValue}>{fmt(data.mensualidad)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{L.totalInterest}</Text>
            <Text style={styles.summaryValue}>{data.tieneInteres ? fmt(data.totalIntereses) : '—'}</Text>
          </View>
          <View style={styles.summaryCardLast}>
            <Text style={styles.summaryLabel}>{L.totalPaid}</Text>
            <Text style={styles.summaryValue}>{fmt(data.totalPagado)}</Text>
          </View>
        </View>

        {/* Corrida por año */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionTick} />
          <Text style={styles.sectionTitle}>{L.corridaTitle}</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.tHead} fixed>
            <Text style={[styles.th, styles.colYear]}>{L.colYear}</Text>
            <Text style={[styles.th, styles.colNum]}>{L.colPayment}</Text>
            <Text style={[styles.th, styles.colNum]}>{L.colInterest}</Text>
            <Text style={[styles.th, styles.colNum]}>{L.colCapital}</Text>
            <Text style={[styles.th, styles.colNum]}>{L.colBalance}</Text>
          </View>
          {data.annual.map((y) => (
            <View style={styles.tRow} key={y.anio} wrap={false}>
              <Text style={[styles.td, styles.colYear]}>{`${L.colYear} ${y.anio}`}</Text>
              <Text style={[styles.td, styles.colNum]}>{fmt(y.cuota)}</Text>
              <Text style={[styles.td, styles.colNum]}>{fmt(y.interes)}</Text>
              <Text style={[styles.td, styles.colNum]}>{fmt(y.capital)}</Text>
              <Text style={[styles.td, styles.colNum]}>{fmt(y.saldoFinal)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>{L.disclaimer}</Text>

        <View style={styles.footer} fixed>
          <View style={styles.footerInfo}>
            <Text style={styles.footerBrand}>Propyte · Tu aliado en bienes raíces</Text>
            <Link src={data.url}><Text style={styles.footerLine}>{data.url.replace(/^https?:\/\//, '')}</Text></Link>
            <Text style={styles.footerLine}>{L.generatedOn} {data.generatedAt}</Text>
          </View>
          <View style={styles.footerRight}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image (PDF), not DOM img */}
            <Image src={data.qrCodeDataUrl} style={styles.qr} />
            <Text style={styles.qrLabel}>{L.scan}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
