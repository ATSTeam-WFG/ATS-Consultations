import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { generateConversationTitle } from '@/lib/claude'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversation_id, first_message } = await request.json()

  const title = await generateConversationTitle(first_message)
  const db = createServiceRoleClient()

  await db
    .from('qa_conversations')
    .update({ title })
    .eq('id', conversation_id)
    .eq('user_id', user.id)

  return NextResponse.json({ data: { title } })
}
