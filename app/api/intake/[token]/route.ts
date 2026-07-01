import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import type { Contact } from '@/lib/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const db = createServiceRoleClient()

  const { data: tokenRow, error } = await db
    .from('intake_tokens')
    .select('id, agent_id, submitted_at')
    .eq('token', token)
    .single()

  if (error || !tokenRow) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  const { data: agent } = await db
    .from('agents')
    .select('name, agency_name, wfg_rep, contacts')
    .eq('id', tokenRow.agent_id)
    .single()

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return NextResponse.json({
    agentName: agent.name,
    agencyName: agent.agency_name,
    wfgRep: agent.wfg_rep,
    contacts: (agent.contacts ?? []) as Contact[],
    alreadySubmitted: tokenRow.submitted_at !== null,
  })
}
