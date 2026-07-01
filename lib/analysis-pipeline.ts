import { createServiceRoleClient } from './supabase'
import { analyzeSession, detectTrends as detectTrendsWithClaude } from './claude'
import type { SessionAnalysis, IntakeResponses } from './types'

// ============================================================
// Process a single session: run Claude analysis + store result
// ============================================================
export async function processSession(sessionId: string): Promise<SessionAnalysis> {
  const db = createServiceRoleClient()

  // Mark as processing
  await db
    .from('sessions')
    .update({ status: 'processing' })
    .eq('id', sessionId)

  try {
    // Fetch session + agent
    const { data: session, error } = await db
      .from('sessions')
      .select('*, agents(name, agency_name)')
      .eq('id', sessionId)
      .single()

    if (error || !session) throw new Error('Session not found')

    const agent = session.agents as { name: string; agency_name?: string; id?: string } | null

    // Fetch latest intake for this agent if available
    let intakeResponses: IntakeResponses | undefined
    if (session.agent_id) {
      const { data: latestIntake } = await db
        .from('agent_intakes')
        .select('responses')
        .eq('agent_id', session.agent_id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (latestIntake) {
        intakeResponses = latestIntake.responses as IntakeResponses
      }
    }

    const content = buildSessionContent(session, intakeResponses)

    // Run Claude analysis
    const analysisResult = await analyzeSession(
      content,
      agent?.name ?? 'Unknown agent',
      undefined,
      undefined
    )

    // Upsert session_analysis
    const { data: analysis, error: analysisError } = await db
      .from('session_analysis')
      .upsert(
        {
          session_id: sessionId,
          summary: analysisResult.summary,
          pain_points: analysisResult.pain_points ?? [],
          problem_tags: analysisResult.problem_tags ?? [],
          tool_recommendations: analysisResult.tool_recommendations ?? [],
          roadmap_steps: analysisResult.roadmap_steps ?? [],
          roi_estimate: analysisResult.roi_estimate ?? null,
          matched_playbook_ids: [],
          raw_claude_response: analysisResult as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' }
      )
      .select()
      .single()

    if (analysisError) throw new Error(analysisError.message)

    // Mark session as processed
    await db
      .from('sessions')
      .update({ status: 'processed' })
      .eq('id', sessionId)

    return analysis as SessionAnalysis
  } catch (err) {
    await db
      .from('sessions')
      .update({ status: 'failed' })
      .eq('id', sessionId)
    throw err
  }
}

export function buildSessionContent(
  session: {
    transcript_text?: string | null
    notes?: string | null
    rep_name?: string | null
    session_date: string
    duration_minutes?: number | null
  },
  intakeResponses?: IntakeResponses
): string {
  const parts: string[] = []

  parts.push(`Session Date: ${session.session_date}`)
  if (session.duration_minutes) parts.push(`Duration: ${session.duration_minutes} minutes`)
  if (session.rep_name) parts.push(`Consulting Rep: ${session.rep_name}`)

  if (session.notes) {
    parts.push('\n--- Session Notes ---')
    parts.push(session.notes)
  }

  if (session.transcript_text) {
    parts.push('\n--- Transcript ---')
    parts.push(session.transcript_text)
  }

  if (intakeResponses) {
    parts.push('\n--- Agent Pre-Consultation Intake ---')
    if (intakeResponses.monthly_volume)
      parts.push(`Monthly Volume: ${intakeResponses.monthly_volume} transactions`)
    if (intakeResponses.team_size)
      parts.push(`Team Size: ${intakeResponses.team_size}`)
    if (intakeResponses.current_software?.length)
      parts.push(`Current Software: ${intakeResponses.current_software.join(', ')}`)
    if (intakeResponses.challenge_areas?.length)
      parts.push(`Stated Pain Areas: ${intakeResponses.challenge_areas.join(', ')}`)
    if (intakeResponses.biggest_bottleneck)
      parts.push(`Biggest Bottleneck: ${intakeResponses.biggest_bottleneck}`)
    if (intakeResponses.success_looks_like)
      parts.push(`Success Criteria: ${intakeResponses.success_looks_like}`)
  }

  return parts.join('\n')
}

// ============================================================
// Detect trends across all sessions for a user
// ============================================================
export async function runTrendDetection(userId: string): Promise<void> {
  const db = createServiceRoleClient()

  // Aggregate problem tags across all processed sessions
  const { data: analyses } = await db
    .from('session_analysis')
    .select('problem_tags, pain_points')

  if (!analyses || analyses.length === 0) return

  // Count tag frequencies
  const tagMap: Map<string, { count: number; agentIds: Set<string>; severitySum: number }> = new Map()

  for (const analysis of analyses) {
    const tags = (analysis.problem_tags as string[]) ?? []
    const painPoints = (analysis.pain_points as { severity?: string }[]) ?? []
    const avgSeverity = painPoints.length > 0
      ? painPoints.reduce((sum, pp) => {
          const severityMap: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 }
          return sum + (severityMap[pp.severity ?? 'low'] ?? 1)
        }, 0) / painPoints.length
      : 1

    for (const tag of tags) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, { count: 0, agentIds: new Set(), severitySum: 0 })
      }
      const entry = tagMap.get(tag)!
      entry.count++
      entry.severitySum += avgSeverity
    }
  }

  const tagCounts = Array.from(tagMap.entries())
    .filter(([, v]) => v.count >= 1)
    .map(([tag, v]) => ({
      tag,
      count: v.count,
      agent_count: v.agentIds.size,
      avg_severity: v.count > 0 ? v.severitySum / v.count : 1,
    }))

  if (tagCounts.length === 0) return

  // Run Claude trend analysis
  const trends = await detectTrendsWithClaude(tagCounts)

  // Upsert trends
  for (const trend of trends) {
    const tagData = tagMap.get(trend.tag)
    await db.from('trends').upsert(
      {
        user_id: userId,
        tag: trend.tag,
        category: trend.category,
        session_count: tagData?.count ?? 0,
        agent_count: tagData?.agentIds.size ?? 0,
        severity_avg: tagData ? tagData.severitySum / tagData.count : null,
        trend_direction: trend.trend_direction,
        description: trend.description,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,tag' }
    )
  }
}
