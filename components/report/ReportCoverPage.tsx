import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const s = StyleSheet.create({
  page: {
    backgroundColor: '#0a0c10',
    padding: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#c4a574',
  },
  monogramRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    border: '1.5pt solid #c4a574',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  monogram: {
    color: '#c4a574',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  reportType: {
    fontSize: 7,
    color: '#c4a574',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  reportSubtype: {
    fontSize: 7,
    color: '#4b5563',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  dividerTop: {
    width: 40,
    height: 1,
    backgroundColor: '#c4a574',
    marginBottom: 24,
  },
  agentName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  agencyName: {
    fontSize: 15,
    color: '#9ca3af',
    marginBottom: 24,
    textAlign: 'center',
  },
  dividerBottom: {
    width: 40,
    height: 1,
    backgroundColor: '#a8894f',
    marginBottom: 24,
  },
  metaGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  metaSeparator: {
    width: 1,
    height: 24,
    backgroundColor: '#1f2937',
  },
  metaLabel: {
    fontSize: 7,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 11,
    color: '#d1d5db',
    fontWeight: 'bold',
  },
  footerRule: {
    position: 'absolute',
    bottom: 48,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: '#1f2937',
  },
  footerConfidential: {
    position: 'absolute',
    bottom: 30,
    fontSize: 7,
    color: '#c4a574',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  footerDate: {
    position: 'absolute',
    bottom: 18,
    fontSize: 7,
    color: '#374151',
    textAlign: 'center',
  },
})

interface ReportCoverPageProps {
  agentName: string
  agencyName: string
  sessionDate: string
  sessionType: string
  repName: string | null
}

export function ReportCoverPage({ agentName, agencyName, sessionDate, sessionType, repName }: ReportCoverPageProps) {
  const date = new Date(sessionDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const typeLabel = sessionType === 'walk_in' ? 'Walk In' : 'Zoom Call'

  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.topBar} />
      <View style={s.monogramRing}>
        <Text style={s.monogram}>ATS</Text>
      </View>
      <Text style={s.reportType}>ATS Consultations</Text>
      <Text style={s.reportSubtype}>Consultation Analysis Report</Text>
      <View style={s.dividerTop} />
      <Text style={s.agentName}>{agentName}</Text>
      <Text style={s.agencyName}>{agencyName}</Text>
      <View style={s.dividerBottom} />
      <View style={s.metaGrid}>
        <View style={s.metaItem}>
          <Text style={s.metaLabel}>Date</Text>
          <Text style={s.metaValue}>{date}</Text>
        </View>
        <View style={s.metaSeparator} />
        <View style={s.metaItem}>
          <Text style={s.metaLabel}>Session Type</Text>
          <Text style={s.metaValue}>{typeLabel}</Text>
        </View>
        {repName && (
          <>
            <View style={s.metaSeparator} />
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>WFG Rep</Text>
              <Text style={s.metaValue}>{repName}</Text>
            </View>
          </>
        )}
      </View>
      <View style={s.footerRule} />
      <Text style={s.footerConfidential}>Confidential</Text>
      <Text style={s.footerDate}>Generated {new Date().toLocaleDateString()}</Text>
    </Page>
  )
}
