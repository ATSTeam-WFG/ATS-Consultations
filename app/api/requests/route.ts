import { createServiceRoleClient, createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID_CATEGORIES = ['UNICORN', 'DIAMOND', 'GOLD', 'SILVER']

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    rep_name,
    rep_email,
    agency_name,
    category,
    requested_time,
    contacts,
    region,
    team_size,
    topics,
    situation,
    notes,
    chat_transcript,
    submitter_email,
    request_source,
    closing_software,
    request_type,
  } = body

  if (!agency_name) {
    return NextResponse.json({ error: 'agency_name is required' }, { status: 400 })
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'category must be one of UNICORN, DIAMOND, GOLD, SILVER' }, { status: 400 })
  }

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('consultation_requests')
    .insert({
      rep_name: rep_name || null,
      rep_email: rep_email || null,
      agency_name,
      category,
      requested_time: requested_time || null,
      contacts: contacts ?? [],
      region: region || null,
      team_size: team_size || null,
      topics: topics ?? [],
      situation: situation || null,
      notes: notes || null,
      chat_transcript: chat_transcript ?? [],
      submitter_email: submitter_email || null,
      request_source: request_source || 'stepper',
      closing_software: closing_software || null,
      request_type: request_type || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('consultation_requests')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
