import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { agent_id, session_date, notes, session_type = 'zoom_call' } = body

  if (!agent_id || !session_date) {
    return NextResponse.json({ error: 'agent_id and session_date are required' }, { status: 400 })
  }

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('sessions')
    .insert({
      user_id: user.id,
      agent_id,
      session_date,
      session_type,
      notes: notes ?? null,
      status: 'scheduled',
    })
    .select('*, agents(name, agency_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
