import { Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer'
import { existsSync } from 'fs'
import { join } from 'path'

const NAVY = '#1a2744'
const GOLD = '#c4a574'

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
    backgroundColor: GOLD,
  },
  bgAccent: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 320,
    height: 500,
    backgroundColor: NAVY,
    opacity: 0.25,
    transform: 'rotate(-35deg)',
  },
  bgAccent2: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 260,
    height: 380,
    backgroundColor: GOLD,
    opacity: 0.06,
    transform: 'rotate(-35deg)',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 'auto',
  },
  logoFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    border: `1.5pt solid ${GOLD}`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  logoFallbackText: {
    color: GOLD,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  reportType: {
    fontSize: 7,
    color: GOLD,
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
    backgroundColor: GOLD,
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
    marginBottom: 28,
  },
  metaList: {
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  metaLabel: {
    fontSize: 9,
    color: GOLD,
    fontWeight: 'bold',
    minWidth: 80,
  },
  metaValue: {
    fontSize: 11,
    color: '#d1d5db',
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
    color: GOLD,
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
      <View style={s.bgAccent} />
      <View style={s.bgAccent2} />

      <View style={s.logoWrapper}>
        {/* Try logo PNG; fall back to styled monogram if asset missing */}
        <WFGLogo />
      </View>

      <Text style={s.reportType}>ATS Consultations</Text>
      <Text style={s.reportSubtype}>Consultation Analysis Report</Text>
      <View style={s.dividerTop} />
      <Text style={s.agentName}>{agentName}</Text>
      <Text style={s.agencyName}>{agencyName}</Text>
      <View style={s.dividerBottom} />

      <View style={s.metaList}>
        <View style={s.metaRow}>
          <Text style={s.metaLabel}>Date:</Text>
          <Text style={s.metaValue}>{date}</Text>
        </View>
        <View style={s.metaRow}>
          <Text style={s.metaLabel}>Session Type:</Text>
          <Text style={s.metaValue}>{typeLabel}</Text>
        </View>
        {repName && (
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>WFG Rep:</Text>
            <Text style={s.metaValue}>{repName}</Text>
          </View>
        )}
      </View>

      <View style={s.footerRule} />
      <Text style={s.footerConfidential}>Confidential</Text>
      <Text style={s.footerDate}>Generated {new Date().toLocaleDateString()}</Text>
    </Page>
  )
}

function WFGLogo() {
  const logoPath = join(process.cwd(), 'public', 'wfg-logo.png')
  if (existsSync(logoPath)) {
    return <Image src={logoPath} style={s.logo} />
  }
  return (
    <View style={s.logoFallback}>
      <Text style={s.logoFallbackText}>WFG</Text>
    </View>
  )
}
