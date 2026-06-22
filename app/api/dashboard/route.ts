import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()
  const uid = user.id

  const [
    { count: totalAgents },
    { count: totalSessions },
    { count: processedSessions },
    { count: pendingSessions },
    { data: analyses },
    { data: trends },
    { data: topPlaybooks },
  ] = await Promise.all([
    db.from('agents').select('*', { count: 'exact', head: true }).eq('user_id', uid),
    db.from('sessions').select('*', { count: 'exact', head: true }).eq('user_id', uid),
    db.from('sessions').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'processed'),
    db.from('sessions').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'pending'),
    db.from('session_analysis').select('problem_tags, sessions!inner(user_id)').eq('sessions.user_id', uid),
    db.from('trends').select('*').eq('user_id', uid).order('session_count', { ascending: false }).limit(5),
    db.from('playbooks').select('id, title, usage_count').eq('user_id', uid).order('usage_count', { ascending: false }).limit(5),
  ])

  // Aggregate problem tags
  const tagMap = new Map<string, number>()
  for (const analysis of (analyses ?? [])) {
    const tags = (analysis.problem_tags as string[]) ?? []
    for (const tag of tags) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1)
    }
  }
  const topProblems = Array.from(tagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }))

  return NextResponse.json({
    data: {
      total_agents: totalAgents ?? 0,
      total_sessions: totalSessions ?? 0,
      processed_sessions: processedSessions ?? 0,
      pending_sessions: pendingSessions ?? 0,
      top_problems: topProblems,
      active_trends: trends ?? [],
      top_playbooks: topPlaybooks ?? [],
    },
  })
}
