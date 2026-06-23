import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { Playbook } from '@/lib/types'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const tag = searchParams.get('tag')

  const db = createServiceRoleClient()
  let query = db
    .from('playbooks')
    .select('*')
    .order('updated_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (tag) query = query.contains('trigger_tags', [tag])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: Partial<Playbook> = await request.json()
  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('playbooks')
    .insert({ ...body, user_id: user.id, status: body.status ?? 'draft' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
