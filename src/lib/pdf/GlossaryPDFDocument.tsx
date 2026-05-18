import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer';

export interface GlossaryTerm {
  name: string;
  def: string;
}

export interface GlossaryPDFLabels {
  title: string;
  subtitle: string;
  brand: string;
  generatedOn: string;
  termsCount: string;
  disclaimer: string;
  cta: string;
  url: string;
}

export interface GlossaryPDFData {
  terms: GlossaryTerm[];
  locale: 'es' | 'en';
  generatedAt: string;
  labels: GlossaryPDFLabels;
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
  cover: {
    fontFamily: 'Helvetica',
    color: 'white',
    padding: 50,
    backgroundColor: '#0F1923',
  },
  coverInner: {
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  coverBrand: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5CE0D2',
    letterSpacing: 1.5,
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    maxWidth: 380,
    lineHeight: 1.4,
  },
  coverFooter: {
    fontSize: 9,
    color: '#5CE0D2',
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottom: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 16,
  },
  headerLogo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A2F3F',
    letterSpacing: 1,
  },
  headerLogoAccent: {
    color: '#0E7490',
  },
  headerMeta: {
    fontSize: 8,
    color: '#9CA3AF',
  },
  letterSection: {
    marginBottom: 18,
  },
  letterHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0E7490',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: 1,
    borderBottomColor: '#F3F4F6',
  },
  term: {
    marginBottom: 10,
  },
  termName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1A2F3F',
    marginBottom: 3,
  },
  termDef: {
    fontSize: 10,
    color: '#4B5563',
    lineHeight: 1.45,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    fontSize: 8,
    color: '#9CA3AF',
  },
});

function groupByLetter(terms: GlossaryTerm[]): Record<string, GlossaryTerm[]> {
  const grouped: Record<string, GlossaryTerm[]> = {};
  for (const term of terms) {
    const letter = (term.name[0] || '#').toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(term);
  }
  return grouped;
}

export function GlossaryPDFDocument({ data }: { data: GlossaryPDFData }) {
  const { terms, locale, generatedAt, labels } = data;
  const grouped = groupByLetter(terms);
  const letters = Object.keys(grouped).sort();

  return (
    <Document
      title={labels.title}
      author="Propyte"
      subject={labels.subtitle}
      language={locale}
    >
      {/* Cover */}
      <Page size="LETTER" style={styles.cover}>
        <View style={styles.coverInner}>
          <Text style={styles.coverBrand}>{labels.brand}</Text>
          <View>
            <Text style={styles.coverTitle}>{labels.title}</Text>
            <Text style={styles.coverSubtitle}>{labels.subtitle}</Text>
            <Text style={[styles.coverSubtitle, { marginTop: 18, color: '#5CE0D2' }]}>
              {labels.termsCount}
            </Text>
          </View>
          <Text style={styles.coverFooter}>{labels.url}</Text>
        </View>
      </Page>

      {/* Content */}
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <Text style={styles.headerLogo}>
            PROP<Text style={styles.headerLogoAccent}>YTE</Text>
          </Text>
          <Text style={styles.headerMeta}>
            {labels.title} · {generatedAt}
          </Text>
        </View>

        {letters.map((letter) => (
          <View key={letter} style={styles.letterSection} wrap={false}>
            <Text style={styles.letterHeading}>{letter}</Text>
            {grouped[letter].map((term) => (
              <View key={term.name} style={styles.term} wrap={false}>
                <Text style={styles.termName}>{term.name}</Text>
                <Text style={styles.termDef}>{term.def}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>{labels.disclaimer}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
