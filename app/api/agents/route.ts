import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { TitleAgentCategory, Contact } from '@/lib/types'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('agents')
    .select('id, name, email, agency_name, category, wfg_rep, contacts, notes, created_at, updated_at, sessions(count)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: {
    name: string
    email?: string
    agency_name: string
    location?: string
    category?: TitleAgentCategory | null
    wfg_rep?: string
    contacts?: Contact[]
    notes?: string
  } = await request.json()

  const { name, email, agency_name, location, category, wfg_rep, contacts, notes } = body

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('agents')
    .insert({ name, email, agency_name, location, category, wfg_rep, contacts: contacts ?? [], notes, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
