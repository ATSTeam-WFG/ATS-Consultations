import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase'
import { IntakeForm } from '@/components/intake/IntakeForm'
import type { Contact, IntakeQuestion } from '@/lib/types'

export default async function IntakePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const db = createServiceRoleClient()

  const { data: tokenRow, error: tokenError } = await db
    .from('intake_tokens')
    .select('agent_id, submitted_at')
    .eq('token', token)
    .single()

  if (tokenError || !tokenRow) notFound()

  const { data: agent } = await db
    .from('agents')
    .select('name, agency_name, wfg_rep, contacts')
    .eq('id', tokenRow.agent_id)
    .single()

  if (!agent) notFound()

  const { data: questions } = await db
    .from('intake_questions')
    .select('*')
    .eq('enabled', true)
    .order('display_order', { ascending: true })

  if (tokenRow.submitted_at !== null) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
        color: '#f1f5f9',
        textAlign: 'center',
        padding: '2rem',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)',
          border: '1px solid rgba(34,197,94,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', marginBottom: '1.5rem',
        }}>
          ✓
        </div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Already submitted
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', maxWidth: '360px' }}>
          We already have your discovery responses on file. Your WFG rep will be in touch soon.
        </p>
      </div>
    )
  }

  return (
    <IntakeForm
      token={token}
      agentName={agent.name}
      agencyName={agent.agency_name}
      wfgRep={agent.wfg_rep}
      contacts={(agent.contacts ?? []) as Contact[]}
      questions={(questions ?? []) as IntakeQuestion[]}
    />
  )
}
