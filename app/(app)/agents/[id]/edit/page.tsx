import { notFound } from 'next/navigation'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { AgentForm } from '@/components/agents/AgentForm'

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = createServiceRoleClient()
  const { data: agent, error } = await db
    .from('agents')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (error || !agent) notFound()

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Edit Agent — {agent.name}</h1>
      </div>
      <div className="page-body">
        <AgentForm initial={agent} agentId={id} />
      </div>
    </>
  )
}
