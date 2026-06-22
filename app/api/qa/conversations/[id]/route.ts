import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()
  const { data: conversation, error } = await db
    .from('qa_conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const { data: messages } = await db
    .from('qa_messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ data: { ...conversation, messages: messages ?? [] } })
}
