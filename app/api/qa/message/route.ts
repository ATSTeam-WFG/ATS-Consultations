import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { fetchContext, streamAnswer } from '@/lib/qa-engine'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversation_id, message } = await request.json()
  if (!conversation_id || !message) {
    return NextResponse.json({ error: 'conversation_id and message required' }, { status: 400 })
  }

  const db = createServiceRoleClient()

  // Verify conversation belongs to user
  const { data: conv, error: convError } = await db
    .from('qa_conversations')
    .select('id')
    .eq('id', conversation_id)
    .eq('user_id', user.id)
    .single()

  if (convError || !conv) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Save user message
  await db.from('qa_messages').insert({
    conversation_id,
    role: 'user',
    content: message,
  })

  // Fetch prior messages for history
  const { data: priorMessages } = await db
    .from('qa_messages')
    .select('role, content')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: true })
    .limit(20)

  const history = (priorMessages ?? [])
    .slice(0, -1) // exclude the message we just added
    .map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  // Fetch context from DB
  const { text: contextText, sources } = await fetchContext(message, user.id)

  // Stream Claude response
  const stream = await streamAnswer(message, contextText, history)

  let fullResponse = ''

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text
            fullResponse += text
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        // Save assistant message after streaming
        await db.from('qa_messages').insert({
          conversation_id,
          role: 'assistant',
          content: fullResponse,
          context_used: sources,
        })

        // Update conversation timestamp + title if first response
        await db
          .from('qa_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversation_id)

        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ done: true, sources })}\n\n`
          )
        )
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Stream error'
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
