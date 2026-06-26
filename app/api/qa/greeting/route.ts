import { createServerSupabaseClient } from '@/lib/supabase'
import { fetchContext } from '@/lib/qa-engine'
import { generateProactiveGreeting } from '@/lib/claude'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { conversation_id } = body

  if (!conversation_id) {
    return NextResponse.json({ error: 'conversation_id required' }, { status: 400 })
  }

  try {
    const { text: context } = await fetchContext('overview of agent portfolio and problems', user.id)

    // Only send greeting if there's meaningful context
    if (!context || context.length < 100) {
      return NextResponse.json({ data: null })
    }

    const content = await generateProactiveGreeting(context)
    if (!content) return NextResponse.json({ data: null })

    return NextResponse.json({ data: { content } })
  } catch {
    return NextResponse.json({ data: null })
  }
}
