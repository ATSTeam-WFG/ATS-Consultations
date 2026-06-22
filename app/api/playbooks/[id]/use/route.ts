import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { session_id } = await request.json()
  const db = createServiceRoleClient()

  // Log usage
  if (session_id) {
    await db.from('playbook_sessions').upsert(
      { playbook_id: id, session_id },
      { onConflict: 'playbook_id,session_id' }
    )
  }

  // Increment usage count
  const { data, error } = await db.rpc('increment_playbook_usage', { playbook_id: id })
  if (error) {
    // Fallback: fetch current count + update
    const { data: pb } = await db.from('playbooks').select('usage_count').eq('id', id).single()
    await db.from('playbooks').update({ usage_count: (pb?.usage_count ?? 0) + 1 }).eq('id', id)
  }

  return NextResponse.json({ data: { success: true } })
}
