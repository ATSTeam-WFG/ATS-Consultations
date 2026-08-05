import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { runTrendDetection } from '@/lib/analysis-pipeline'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()
  const { data: trends, error } = await db
    .from('trends')
    .select('*')
    .eq('user_id', user.id)
    .order('session_count', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!trends || trends.length === 0) {
    return NextResponse.json({ data: { trends: [], summary: null, categories: [], top_agents: [] } })
  }

  // Per-agent analytics from session_analysis
  const { data: agentAnalyses } = await db
    .from('session_analysis')
    .select('problem_tags, sessions!inner(agent_id, agents!inner(name, agency_name))')

  const agentMap: Map<string, { name: string; agency_name: string; tagCounts: Map<string, number> }> = new Map()
  for (const row of agentAnalyses ?? []) {
    const session = row.sessions as unknown as { agent_id: string; agents: { name: string; agency_name: string } } | null
    if (!session) continue
    const { agent_id, agents: agent } = session
    if (!agent_id || !agent) continue
    if (!agentMap.has(agent_id)) {
      agentMap.set(agent_id, { name: agent.name, agency_name: agent.agency_name ?? '', tagCounts: new Map() })
    }
    const entry = agentMap.get(agent_id)!
    for (const tag of (row.problem_tags as string[]) ?? []) {
      entry.tagCounts.set(tag, (entry.tagCounts.get(tag) ?? 0) + 1)
    }
  }

  const top_agents = Array.from(agentMap.values())
    .map((a) => {
      const totalIssues = Array.from(a.tagCounts.values()).reduce((s, c) => s + c, 0)
      const topTagEntry = Array.from(a.tagCounts.entries()).sort((x, y) => y[1] - x[1])[0]
      return {
        name: a.name,
        agency_name: a.agency_name,
        issue_count: totalIssues,
        top_tag: topTagEntry?.[0] ?? '',
      }
    })
    .sort((a, b) => b.issue_count - a.issue_count)
    .slice(0, 10)

  // Category breakdown
  const categoryMap: Map<string, { count: number; severitySum: number }> = new Map()
  for (const t of trends) {
    const cat = (t.category as string) ?? 'General'
    const existing = categoryMap.get(cat) ?? { count: 0, severitySum: 0 }
    categoryMap.set(cat, {
      count: existing.count + (t.session_count as number),
      severitySum: existing.severitySum + ((t.severity_avg as number) ?? 0),
    })
  }
  const categories = Array.from(categoryMap.entries())
    .map(([name, v]) => ({ name, count: v.count, avg_severity: v.severitySum / (v.count || 1) }))
    .sort((a, b) => b.count - a.count)

  const rising = trends.filter((t) => t.trend_direction === 'rising').length
  const falling = trends.filter((t) => t.trend_direction === 'falling').length
  const stable = trends.filter((t) => t.trend_direction === 'stable').length
  const topCategory = categories[0]?.name ?? ''

  const summary = {
    total_patterns: trends.length,
    rising,
    stable,
    falling,
    sessions_analyzed: agentAnalyses?.length ?? 0,
    agents_analyzed: agentMap.size,
    top_category: topCategory,
  }

  return NextResponse.json({ data: { trends, summary, categories, top_agents } })
}

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const insights = await runTrendDetection(user.id)
    return NextResponse.json({ data: { success: true, insights } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Trend detection failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
