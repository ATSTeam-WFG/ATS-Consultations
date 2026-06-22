import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { TopProblemsChart } from '@/components/dashboard/TopProblemsChart'
import { TrendAlerts } from '@/components/dashboard/TrendAlerts'
import { TopPlaybooks } from '@/components/dashboard/TopPlaybooks'
import type { Trend } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const db = createServiceRoleClient()
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

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <MetricCard label="Agents" value={totalAgents ?? 0} />
          <MetricCard label="Sessions" value={totalSessions ?? 0} />
          <MetricCard label="Processed" value={processedSessions ?? 0} accent />
          <MetricCard label="Pending" value={pendingSessions ?? 0} sub="awaiting analysis" />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <TopProblemsChart data={topProblems} />
          <TrendAlerts trends={(trends as Trend[]) ?? []} />
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <TopPlaybooks playbooks={topPlaybooks ?? []} />
        </div>
      </div>
    </>
  )
}
