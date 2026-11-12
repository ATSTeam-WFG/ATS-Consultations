import { createServiceRoleClient, createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { status, agent_id } = body

  const update: Record<string, unknown> = {}
  if (status) update.status = status
  if (agent_id !== undefined) update.agent_id = agent_id

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('consultation_requests')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
