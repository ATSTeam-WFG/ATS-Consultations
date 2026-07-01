import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import type { IntakeResponses } from '@/lib/types'

export async function POST(
  req: NextRequest,
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

  const body = await req.json() as { responses: IntakeResponses }
  const now = new Date().toISOString()

  const { error: intakeError } = await db.from('agent_intakes').insert({
    token_id: tokenRow.id,
    agent_id: tokenRow.agent_id,
    responses: body.responses,
    submitted_at: now,
  })

  if (intakeError) {
    return NextResponse.json({ error: 'Failed to save responses' }, { status: 500 })
  }

  await db
    .from('intake_tokens')
    .update({ submitted_at: now })
    .eq('id', tokenRow.id)

  return NextResponse.json({ ok: true })
}
