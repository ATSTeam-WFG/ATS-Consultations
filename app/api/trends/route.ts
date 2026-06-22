import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { runTrendDetection } from '@/lib/analysis-pipeline'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('trends')
    .select('*')
    .eq('user_id', user.id)
    .order('session_count', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await runTrendDetection(user.id)
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Trend detection failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
