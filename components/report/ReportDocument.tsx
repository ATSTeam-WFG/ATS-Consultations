import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { ReportCoverPage } from './ReportCoverPage'
import type { SessionAnalysis, PainPoint, ToolRecommendationItem, RoadmapStep } from '@/lib/types'

const NAVY = '#1a2744'
const GOLD = '#c4a574'
const NAVY_TINT = '#f0f4fb'
const GOLD_TINT = '#faf6ef'

const s = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: '40 48',
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#0d1117',
  },
  pageAccent: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 180,
    height: 280,
    backgroundColor: NAVY,
    opacity: 0.06,
    transform: 'rotate(-45deg)',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: NAVY,
    marginBottom: 4,
  },
  pageTitleSub: {
    fontSize: 9,
    color: GOLD,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: NAVY,
    marginBottom: 10,
    marginTop: 16,
  },
  sectionBody: {
    marginBottom: 24,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#374151',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#f9fafb',
    border: `1 solid #e4e8f0`,
    borderRadius: 6,
    padding: '10 12',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0d1117',
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 9.5,
    color: '#4b5563',
    lineHeight: 1.5,
  },
  badge: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeHigh: { backgroundColor: '#fef2f2', color: '#dc2626' },
  badgeCritical: { backgroundColor: '#450a0a', color: '#fca5a5' },
  badgeMedium: { backgroundColor: '#fffbeb', color: '#d97706' },
  badgeLow: { backgroundColor: '#f0fdf4', color: '#16a34a' },
  badgePriorityHigh: { backgroundColor: '#fef2f2', color: '#dc2626' },
  badgePriorityMedium: { backgroundColor: '#fffbeb', color: '#d97706' },
  badgePriorityLow: { backgroundColor: '#f0fdf4', color: '#16a34a' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  // Table styles
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
  },
  tableCellMuted: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  // ROI
  roiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  roiCard: {
    flex: 1,
    backgroundColor: GOLD_TINT,
    border: `1 solid ${GOLD}`,
    borderRadius: 6,
    padding: '10 12',
    alignItems: 'center',
  },
  roiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: NAVY,
    marginBottom: 2,
  },
  roiLabel: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Week badge for roadmap table
  weekCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: NAVY,
    backgroundColor: NAVY_TINT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e4e8f0',
    paddingTop: 8,
  },
})

function severityStyle(severity: string) {
  if (severity === 'critical') return s.badgeCritical
  if (severity === 'high') return s.badgeHigh
  if (severity === 'medium') return s.badgeMedium
  return s.badgeLow
}

function priorityStyle(priority: string) {
  if (priority === 'high') return s.badgePriorityHigh
  if (priority === 'medium') return s.badgePriorityMedium
  return s.badgePriorityLow
}

function PageAccent() {
  return <View style={s.pageAccent} />
}

function PageFooter({ agentName, date }: { agentName: string; date: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>ATS Consultations · Confidential</Text>
      <Text>{agentName} · {date}</Text>
    </View>
  )
}

export interface ReportDocumentProps {
  agentName: string
  agencyName: string
  sessionDate: string
  sessionType: string
  repName: string | null
  analysis: SessionAnalysis
  selectedPainPointIndices: number[]
  sections: {
    summary: boolean
    tools: boolean
    roadmap: boolean
    roi: boolean
  }
}

export function ReportDocument({
  agentName, agencyName, sessionDate, sessionType, repName,
  analysis, selectedPainPointIndices, sections,
}: ReportDocumentProps) {
  const displayDate = new Date(sessionDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const selectedPainPoints = analysis.pain_points.filter((_, i) => selectedPainPointIndices.includes(i))

  return (
    <Document>
      <ReportCoverPage
        agentName={agentName}
        agencyName={agencyName}
        sessionDate={sessionDate}
        sessionType={sessionType}
        repName={repName}
      />

      {/* Summary + Pain Points */}
      {sections.summary && analysis.summary && (
        <Page size="LETTER" style={s.page}>
          <PageAccent />
          <Text style={s.pageTitle}>Executive Summary</Text>
          <Text style={s.pageTitleSub}>Consultation Analysis</Text>
          <View style={s.sectionBody}>
            <Text style={s.paragraph}>{analysis.summary}</Text>
          </View>

          {selectedPainPoints.length > 0 && (
            <>
              <Text style={s.sectionHeader}>Selected Pain Points</Text>
              {/* Table header */}
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, { width: 64 }]}>Severity</Text>
                <Text style={[s.tableHeaderCell, { width: 100 }]}>Category</Text>
                <Text style={[s.tableHeaderCell, { flex: 1 }]}>Description</Text>
              </View>
              {selectedPainPoints.map((pp: PainPoint, idx: number) => (
                <View key={idx} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
                  <View style={{ width: 64 }}>
                    <Text style={[s.badge, severityStyle(pp.severity)]}>{pp.severity}</Text>
                  </View>
                  <Text style={[s.tableCellMuted, { width: 100 }]}>{pp.category}</Text>
                  <Text style={[s.tableCell, { flex: 1 }]}>{pp.description}</Text>
                </View>
              ))}
            </>
          )}

          <PageFooter agentName={agentName} date={displayDate} />
        </Page>
      )}

      {/* Tool Recommendations */}
      {sections.tools && analysis.tool_recommendations.length > 0 && (
        <Page size="LETTER" style={s.page}>
          <PageAccent />
          <Text style={s.pageTitle}>Tool Recommendations</Text>
          <Text style={s.pageTitleSub}>Recommended Technology</Text>
          <View style={s.sectionBody}>
            {analysis.tool_recommendations.map((tool: ToolRecommendationItem, idx: number) => (
              <View key={idx} style={s.card}>
                <View style={s.row}>
                  <Text style={s.cardTitle}>{tool.name}</Text>
                  <Text style={[s.badge, priorityStyle(tool.priority)]}>{tool.priority}</Text>
                </View>
                <Text style={{ fontSize: 8, color: '#9ca3af', marginBottom: 4 }}>{tool.category}</Text>
                <Text style={s.cardBody}>{tool.rationale}</Text>
              </View>
            ))}
          </View>
          <PageFooter agentName={agentName} date={displayDate} />
        </Page>
      )}

      {/* Roadmap */}
      {sections.roadmap && analysis.roadmap_steps.length > 0 && (
        <Page size="LETTER" style={s.page}>
          <PageAccent />
          <Text style={s.pageTitle}>90-Day Roadmap</Text>
          <Text style={s.pageTitleSub}>Implementation Timeline</Text>
          <View style={s.sectionBody}>
            {/* Table header */}
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderCell, { width: 36 }]}>Wk</Text>
              <Text style={[s.tableHeaderCell, { width: 110 }]}>Title</Text>
              <Text style={[s.tableHeaderCell, { flex: 1 }]}>Description</Text>
              <Text style={[s.tableHeaderCell, { width: 70 }]}>Owner</Text>
            </View>
            {analysis.roadmap_steps.map((step: RoadmapStep, idx: number) => (
              <View key={idx} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
                <View style={{ width: 36 }}>
                  <Text style={s.weekCell}>{step.week}</Text>
                </View>
                <Text style={[s.tableCell, { width: 110, fontWeight: 'bold' }]}>{step.title}</Text>
                <Text style={[s.tableCell, { flex: 1 }]}>{step.description}</Text>
                <Text style={[s.tableCellMuted, { width: 70 }]}>{step.owner ?? '—'}</Text>
              </View>
            ))}
          </View>
          <PageFooter agentName={agentName} date={displayDate} />
        </Page>
      )}

      {/* ROI Estimate */}
      {sections.roi && analysis.roi_estimate && (
        <Page size="LETTER" style={s.page}>
          <PageAccent />
          <Text style={s.pageTitle}>ROI Estimate</Text>
          <Text style={s.pageTitleSub}>Projected Impact</Text>
          <View style={s.sectionBody}>
            <View style={s.roiRow}>
              <View style={s.roiCard}>
                <Text style={s.roiValue}>{analysis.roi_estimate.time_saved_hours_per_week}h</Text>
                <Text style={s.roiLabel}>Hours saved/week</Text>
              </View>
              <View style={s.roiCard}>
                <Text style={[s.roiValue, { fontSize: 13 }]}>{analysis.roi_estimate.revenue_impact}</Text>
                <Text style={s.roiLabel}>Revenue impact</Text>
              </View>
              <View style={[s.roiCard, {
                backgroundColor: analysis.roi_estimate.confidence === 'high' ? '#f0fdf4' : GOLD_TINT,
                borderColor: analysis.roi_estimate.confidence === 'high' ? '#10b981' : GOLD,
              }]}>
                <Text style={[s.roiValue, { fontSize: 14, color: analysis.roi_estimate.confidence === 'high' ? '#059669' : '#a8894f' }]}>
                  {analysis.roi_estimate.confidence.toUpperCase()}
                </Text>
                <Text style={s.roiLabel}>Confidence</Text>
              </View>
            </View>
            {analysis.roi_estimate.notes && (
              <View style={s.card}>
                <Text style={{ fontSize: 9, color: '#6b7280', fontWeight: 'bold', marginBottom: 4 }}>Assumptions</Text>
                <Text style={s.cardBody}>{analysis.roi_estimate.notes}</Text>
              </View>
            )}
          </View>
          <PageFooter agentName={agentName} date={displayDate} />
        </Page>
      )}

      {/* Closing Page */}
      <Page size="LETTER" style={s.page}>
        <PageAccent />
        <Text style={s.pageTitle}>Closing & Next Steps</Text>
        <Text style={s.pageTitleSub}>Summary & Follow-Up</Text>
        <View style={s.sectionBody}>
          <Text style={s.paragraph}>
            Thank you for the opportunity to consult with {agentName} on {displayDate}. This report summarizes the findings from our session and is intended to serve as a roadmap for modernizing your ATS operations.
          </Text>
          <Text style={s.paragraph}>
            The recommendations outlined in this report are prioritized based on impact and ease of implementation. We encourage reviewing the 90-day roadmap with your team and identifying quick wins to build momentum.
          </Text>
        </View>
        <Text style={s.sectionHeader}>Recommended Next Steps</Text>
        <View style={s.sectionBody}>
          <Text style={s.paragraph}>1. Share this report with key stakeholders at {agentName}.</Text>
          <Text style={s.paragraph}>2. Schedule a follow-up session to review tool demos for the top recommendations.</Text>
          <Text style={s.paragraph}>3. Assign internal owners for each phase of the 90-day roadmap.</Text>
          {repName && (
            <Text style={s.paragraph}>4. Reach out to your WFG representative {repName} with any questions or to schedule the next consultation.</Text>
          )}
        </View>
        {repName && (
          <>
            <Text style={s.sectionHeader}>Your WFG Contact</Text>
            <View style={[s.card, { backgroundColor: GOLD_TINT, borderColor: GOLD }]}>
              <Text style={[s.cardTitle, { color: NAVY }]}>{repName}</Text>
              <Text style={s.cardBody}>WFG National Title Insurance Company</Text>
            </View>
          </>
        )}
        <PageFooter agentName={agentName} date={displayDate} />
      </Page>
    </Document>
  )
}
