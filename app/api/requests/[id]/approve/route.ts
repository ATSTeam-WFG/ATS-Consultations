import { createServiceRoleClient, createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { ConsultationRequest } from '@/lib/types'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = createServiceRoleClient()

  const { data: req, error: fetchErr } = await db
    .from('consultation_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !req) {
    return NextResponse.json({ error: fetchErr?.message ?? 'Request not found' }, { status: 404 })
  }

  const request = req as ConsultationRequest

  const primaryContact = request.contacts?.[0]
  const agentName = primaryContact?.name || request.agency_name

  const notesParts: string[] = []
  if (request.situation) notesParts.push(`Situation: ${request.situation}`)
  if (request.closing_software) notesParts.push(`Closing software: ${request.closing_software}`)
  if (request.request_type) notesParts.push(`Request type: ${request.request_type.replace(/_/g, ' ')}`)
  if (request.notes) notesParts.push(`Notes: ${request.notes}`)
  const notes = notesParts.length > 0 ? notesParts.join('\n\n') : null

  const agentPayload = {
    user_id: user.id,
    name: agentName,
    email: primaryContact?.email || null,
    agency_name: request.agency_name,
    category: request.category,
    wfg_rep: request.rep_name || null,
    location: request.region || null,
    notes,
    contacts: (request.contacts ?? []).map(({ name, email }) => ({ name, email })),
  }

  const { data: agent, error: insertErr } = await db
    .from('agents')
    .insert(agentPayload)
    .select()
    .single()

  if (insertErr || !agent) {
    return NextResponse.json({ error: insertErr?.message ?? 'Failed to create agent' }, { status: 500 })
  }

  const { error: updateErr } = await db
    .from('consultation_requests')
    .update({ status: 'converted', agent_id: agent.id })
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ agent }, { status: 201 })
}
