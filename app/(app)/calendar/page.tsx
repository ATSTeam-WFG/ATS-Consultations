import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'

export default async function CalendarPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = createServiceRoleClient()

  const [{ data: sessions }, { data: agents }] = await Promise.all([
    db
      .from('sessions')
      .select('id, session_date, status, agent_id, agents(name, agency_name)')
      .eq('user_id', user!.id)
      .order('session_date', { ascending: false }),
    db
      .from('agents')
      .select('id, name, agency_name')
      .eq('user_id', user!.id)
      .order('name'),
  ])

  // Supabase returns agents as array from join — normalize to single object
  const normalizedSessions = (sessions ?? []).map((s) => ({
    ...s,
    agents: Array.isArray(s.agents) ? (s.agents[0] ?? null) : s.agents,
  }))

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
      </div>
      <div className="page-body">
        <CalendarGrid
          sessions={normalizedSessions as Parameters<typeof CalendarGrid>[0]['sessions']}
          agents={agents ?? []}
        />
      </div>
    </>
  )
}
