import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const s = StyleSheet.create({
  page: {
    backgroundColor: '#0d1117',
    padding: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seal: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sealText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  brand: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 4,
  },
  brandAccent: {
    color: '#6366f1',
  },
  tagline: {
    fontSize: 8,
    color: '#6366f1',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 48,
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: '#6366f1',
    marginBottom: 32,
  },
  agentName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  agencyName: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 32,
    textAlign: 'center',
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 8,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 9,
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 12,
    color: '#d1d5db',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    fontSize: 8,
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
      <View style={s.seal}>
        <Text style={s.sealText}>A</Text>
      </View>
      <Text style={s.brand}>ATS <Text style={s.brandAccent}>Consultations</Text></Text>
      <Text style={s.tagline}>White Glove Intelligence</Text>
      <View style={s.divider} />
      <Text style={s.agentName}>{agentName}</Text>
      <Text style={s.agencyName}>{agencyName}</Text>
      <View style={s.metaGrid}>
        <View style={s.metaItem}>
          <Text style={s.metaLabel}>Date</Text>
          <Text style={s.metaValue}>{date}</Text>
        </View>
        <View style={s.metaItem}>
          <Text style={s.metaLabel}>Session Type</Text>
          <Text style={s.metaValue}>{typeLabel}</Text>
        </View>
        {repName && (
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>WFG Rep</Text>
            <Text style={s.metaValue}>{repName}</Text>
          </View>
        )}
      </View>
      <Text style={s.footer}>ATS Consultations · Confidential · Generated {new Date().toLocaleDateString()}</Text>
    </Page>
  )
}
