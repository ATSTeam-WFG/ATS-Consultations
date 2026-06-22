import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { SessionForm } from '@/components/sessions/SessionForm'

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string }>
}) {
  const { agent: agentId } = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = createServiceRoleClient()
  const { data: agents } = await db
    .from('agents')
    .select('id, name, agency_name')
    .eq('user_id', user!.id)
    .order('name')

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Log Session</h1>
      </div>
      <div className="page-body">
        <div className="ats-card" style={{ maxWidth: '680px' }}>
          <SessionForm agents={agents ?? []} defaultAgentId={agentId} />
        </div>
      </div>
    </>
  )
}
