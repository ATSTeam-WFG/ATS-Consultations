import { createServiceRoleClient } from './supabase'
import { extractQAFilters, generateQAAnswer } from './claude'
import type { ContextUsed } from './types'

export async function fetchContext(
  question: string,
  userId: string
): Promise<{ text: string; sources: ContextUsed[] }> {
  const filters = await extractQAFilters(question)
  const db = createServiceRoleClient()
  const sources: ContextUsed[] = []
  const parts: string[] = []

  // Fetch agent profiles
  const { data: agents } = await db
    .from('agents')
    .select('id, name, agency_name, category')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (agents && agents.length > 0) {
    // Fetch session counts and last-seen per agent
    const { data: sessionMeta } = await db
      .from('sessions')
      .select('agent_id, session_date, session_analysis(problem_tags)')
      .eq('user_id', userId)
      .eq('status', 'processed')

    const agentSessionMap: Record<string, { count: number; lastDate: string; tags: string[] }> = {}
    if (sessionMeta) {
      for (const s of sessionMeta) {
        const aid = s.agent_id as string
        const entry = agentSessionMap[aid] ?? { count: 0, lastDate: '', tags: [] }
        entry.count++
        if (!entry.lastDate || s.session_date > entry.lastDate) entry.lastDate = s.session_date as string
        const analysis = s.session_analysis as { problem_tags?: string[] } | null
        if (analysis?.problem_tags) entry.tags.push(...analysis.problem_tags)
        agentSessionMap[aid] = entry
      }
    }

    parts.push('## Agents in Your Portfolio\n')
    for (const agent of agents) {
      const meta = agentSessionMap[agent.id]
      const topTags = meta
        ? [...new Set(meta.tags)].slice(0, 3).join(', ')
        : 'no sessions yet'
      const lastSeen = meta?.lastDate
        ? new Date(meta.lastDate).toLocaleDateString()
        : 'never'
      parts.push(
        `- ${agent.name} (${agent.category ?? 'unclassified'}) — ${agent.agency_name}, ${meta?.count ?? 0} sessions, last seen ${lastSeen}${topTags ? `. Key problems: ${topTags}` : ''}`
      )
      sources.push({
        type: 'agent',
        id: agent.id,
        label: `Agent: ${agent.name}`,
      })
    }
  }

  // Fetch relevant sessions + analyses
  let sessionQuery = db
    .from('sessions')
    .select('id, session_date, notes, agents(name, agency_name), session_analysis(summary, pain_points, problem_tags, tool_recommendations)')
    .eq('user_id', userId)
    .eq('status', 'processed')
    .order('created_at', { ascending: false })
    .limit(15)

  if (filters.date_from) sessionQuery = sessionQuery.gte('session_date', filters.date_from)
  if (filters.date_to) sessionQuery = sessionQuery.lte('session_date', filters.date_to)

  const { data: sessions } = await sessionQuery

  if (sessions && sessions.length > 0) {
    parts.push('## Consultation Sessions\n')
    for (const s of sessions) {
      const agent = (s.agents as unknown) as { name: string; agency_name?: string } | null
      const analysis = s.session_analysis as {
        summary?: string
        pain_points?: { description: string; severity: string }[]
        problem_tags?: string[]
        tool_recommendations?: { name: string; rationale: string }[]
      } | null

      // Filter by agent name if specified
      if (filters.agent_name && !agent?.name?.toLowerCase().includes(filters.agent_name.toLowerCase())) {
        continue
      }

      // Filter by problem tags if specified
      if (filters.problem_tags?.length) {
        const sessionTags = analysis?.problem_tags ?? []
        const hasTag = filters.problem_tags.some((t) => sessionTags.includes(t))
        if (!hasTag) continue
      }

      const sessionText = [
        `### Session — ${new Date(s.session_date).toLocaleDateString()} — Agent: ${agent?.name ?? 'Unknown'}`,
        agent?.agency_name ? `Agency: ${agent.agency_name}` : '',
        s.notes ? `Notes: ${s.notes}` : '',
        analysis?.summary ? `Summary: ${analysis.summary}` : '',
        analysis?.pain_points?.length
          ? `Pain points: ${analysis.pain_points.map((p) => `${p.description} (${p.severity})`).join('; ')}`
          : '',
        analysis?.problem_tags?.length
          ? `Tags: ${analysis.problem_tags.join(', ')}`
          : '',
        analysis?.tool_recommendations?.length
          ? `Tools: ${analysis.tool_recommendations.map((t) => t.name).join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')

      parts.push(sessionText)
      sources.push({
        type: 'session',
        id: s.id,
        label: `Session ${new Date(s.session_date).toLocaleDateString()} — ${agent?.name ?? 'Unknown'}`,
        excerpt: analysis?.summary?.slice(0, 120),
      })
    }
  }

  // Fetch trends
  const { data: trends } = await db
    .from('trends')
    .select('tag, session_count, trend_direction, description')
    .eq('user_id', userId)
    .order('session_count', { ascending: false })
    .limit(10)

  if (trends && trends.length > 0) {
    parts.push('\n## Current Trends\n')
    for (const t of trends) {
      parts.push(`- ${t.tag.replace(/_/g, ' ')}: ${t.trend_direction ?? 'stable'} (${t.session_count} sessions) — ${t.description ?? ''}`)
      sources.push({
        type: 'trend',
        id: t.tag,
        label: `Trend: ${t.tag.replace(/_/g, ' ')}`,
      })
    }
  }

  // Fetch published playbooks
  const { data: playbooks } = await db
    .from('playbooks')
    .select('id, title, description, trigger_tags, expected_outcome')
    .eq('user_id', userId)
    .eq('status', 'published')
    .limit(10)

  if (playbooks && playbooks.length > 0) {
    parts.push('\n## Available Playbooks\n')
    for (const pb of playbooks) {
      parts.push(`- ${pb.title}: triggers on [${(pb.trigger_tags as string[]).join(', ')}]. ${pb.description ?? ''} Expected outcome: ${pb.expected_outcome ?? 'N/A'}`)
      sources.push({
        type: 'playbook',
        id: pb.id,
        label: `Playbook: ${pb.title}`,
      })
    }
  }

  return {
    text: parts.join('\n').slice(0, 12000), // cap context
    sources,
  }
}

export async function streamAnswer(
  question: string,
  context: string,
  history: { role: 'user' | 'assistant'; content: string }[]
) {
  return generateQAAnswer(question, context, history)
}
