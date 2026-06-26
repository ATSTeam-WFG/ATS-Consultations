import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { ReportCoverPage } from './ReportCoverPage'
import type { SessionAnalysis, PainPoint, ToolRecommendationItem, RoadmapStep } from '@/lib/types'

const s = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: '40 48',
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#0d1117',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0d1117',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
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
    border: '1 solid #e4e8f0',
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
  weekBadge: {
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 48,
    textAlign: 'center',
  },
  roiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  roiCard: {
    flex: 1,
    backgroundColor: '#eef2ff',
    border: '1 solid #6366f1',
    borderRadius: 6,
    padding: '10 12',
    alignItems: 'center',
  },
  roiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 2,
  },
  roiLabel: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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

      {/* Summary */}
      {sections.summary && analysis.summary && (
        <Page size="LETTER" style={s.page}>
          <Text style={s.sectionHeader}>Executive Summary</Text>
          <View style={s.sectionBody}>
            <Text style={s.paragraph}>{analysis.summary}</Text>
          </View>

          {selectedPainPoints.length > 0 && (
            <>
              <Text style={s.sectionHeader}>Selected Pain Points</Text>
              <View style={s.sectionBody}>
                {selectedPainPoints.map((pp: PainPoint, idx: number) => (
                  <View key={idx} style={s.card}>
                    <View style={s.row}>
                      <Text style={[s.badge, severityStyle(pp.severity)]}>{pp.severity}</Text>
                      <Text style={{ fontSize: 9, color: '#6b7280', paddingTop: 2 }}>{pp.category}</Text>
                    </View>
                    <Text style={[s.cardBody, { marginTop: 4 }]}>{pp.description}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <PageFooter agentName={agentName} date={displayDate} />
        </Page>
      )}

      {/* Tool Recommendations */}
      {sections.tools && analysis.tool_recommendations.length > 0 && (
        <Page size="LETTER" style={s.page}>
          <Text style={s.sectionHeader}>Tool Recommendations</Text>
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
          <Text style={s.sectionHeader}>90-Day Roadmap</Text>
          <View style={s.sectionBody}>
            {analysis.roadmap_steps.map((step: RoadmapStep, idx: number) => (
              <View key={idx} style={[s.card, { flexDirection: 'row', gap: 12 }]}>
                <Text style={s.weekBadge}>Wk {step.week}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{step.title}</Text>
                  <Text style={s.cardBody}>{step.description}</Text>
                  {step.owner && (
                    <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 4 }}>Owner: {step.owner}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
          <PageFooter agentName={agentName} date={displayDate} />
        </Page>
      )}

      {/* ROI Estimate */}
      {sections.roi && analysis.roi_estimate && (
        <Page size="LETTER" style={s.page}>
          <Text style={s.sectionHeader}>ROI Estimate</Text>
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
              <View style={[s.roiCard, { backgroundColor: analysis.roi_estimate.confidence === 'high' ? '#f0fdf4' : '#fffbeb', borderColor: analysis.roi_estimate.confidence === 'high' ? '#10b981' : '#f59e0b' }]}>
                <Text style={[s.roiValue, { fontSize: 14, color: analysis.roi_estimate.confidence === 'high' ? '#059669' : '#d97706' }]}>
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
    </Document>
  )
}
