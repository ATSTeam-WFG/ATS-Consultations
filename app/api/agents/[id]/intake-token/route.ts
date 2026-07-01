import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, createServerSupabaseClient } from '@/lib/supabase'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceRoleClient()

  // Return existing unsubmitted token if one exists
  const { data: existing } = await db
    .from('intake_tokens')
    .select('token')
    .eq('agent_id', agentId)
    .is('submitted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/intake/${existing.token}`
    return NextResponse.json({ token: existing.token, url })
  }

  const { data: tokenRow, error } = await db
    .from('intake_tokens')
    .insert({ agent_id: agentId, created_by: user.id })
    .select('token')
    .single()

  if (error || !tokenRow) {
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 })
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/intake/${tokenRow.token}`
  return NextResponse.json({ token: tokenRow.token, url })
}
