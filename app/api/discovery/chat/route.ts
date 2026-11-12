import Anthropic from '@anthropic-ai/sdk'
import type { NextRequest } from 'next/server'
import type { DiscoveryMessage, DiscoveryExtracted } from '@/lib/types'
import { createServiceRoleClient } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BASE_SYSTEM_PROMPT = `You are the ATS Discovery Agent — a warm, knowledgeable guide for WFG title agency representatives. You help reps capture consultation requests from their title agency clients in a natural conversation.

Your goal: gather enough context to submit a meaningful consultation request, in 4–6 turns total.

Information to gather (progressively, naturally):
1. Agency name and approximate tier/category (UNICORN = top producer, DIAMOND = strong regional, GOLD = established, SILVER = emerging)
2. Primary need or request type (consultation, product setup, tool inquiry, idea pitch, efficiency help)
3. Closing software they use (SoftPro, RamQuest, ResWare, Qualia, AtlasTitle, or other)
4. Team size (approximate headcount or number of closers)
5. Core situation or challenge they're facing
6. Key personnel who should attend — near the end: "Who from their team should be on this call? Even one name helps." Never demand it; skip if conversation is already wrapping up.

RULES:
- Ask exactly ONE question per response — never a list of questions
- Keep responses ≤80 words — crisp and conversational
- Be warm and human, not robotic or clinical
- When an agency rep shares freely about an idea or problem, listen and reflect before asking your next question
- When you have gathered agency name + at least one of (topics, situation, request_type), signal readiness naturally: end your message with something like "I think I have what the team needs — feel free to add anything else, or you can submit this now."
- Handle "idea pitch" mode empathetically — don't push for structure if they're sharing openly
- Never ask for personal contact info — the rep's email is already captured

TOOL RESOURCES — when a rep asks about any of these tools, immediately share the link(s) and briefly describe the tool, then ask if they need setup help or want to schedule a consultation:

- FieldMT (https://fieldmt.ai): Field inspection & measurement tool. Has training videos and material — direct reps there.
- WFGRemit (https://wfgtitle.my.site.com/s/login/?ec=302&startURL=%2Fs%2F): Remittance platform — share the link and mention the Quick Guide to Onboard is available inside.
- Survey Intelligence Engine (https://title-survey-processing-tool.vercel.app/): Automated survey processing and analysis.
- FAR/BAR Deadline Tracker — Florida only (https://farbar-deadline-tracker.vercel.app/): Tracks FAR/BAR contract deadlines for FL transactions.
- WFGPrompts (https://wfgprompts.ai): AI marketing workspace for title agencies — see detailed product knowledge below.`

async function extractDiscoveryData(
  messages: DiscoveryMessage[],
  lastResponse: string
): Promise<{ suggestions: string[]; extracted: DiscoveryExtracted; readyToSubmit: boolean }> {
  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Rep' : 'ATS'}: ${m.content}`)
    .join('\n')

  const result = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: `You are a data extractor. Given this conversation transcript, extract structured data and generate follow-up suggestions.

TRANSCRIPT:
${transcript}
ATS: ${lastResponse}

Return JSON only — no markdown fences:
{
  "suggestions": ["suggestion 1 (≤10 words)", "suggestion 2 (≤10 words)", "suggestion 3 (≤10 words)"],
  "extracted": {
    "agency_name": "string or null",
    "category": "UNICORN|DIAMOND|GOLD|SILVER or null",
    "region": "string or null",
    "team_size": "string or null",
    "closing_software": "string or null",
    "topics": ["topic1"] or [],
    "situation": "brief summary of their situation or null",
    "request_type": "consultation|product_setup|tool_inquiry|idea_pitch|efficiency_help or null",
    "key_personnel": [{"name": "string", "email": "string or null"}] or []
  },
  "readyToSubmit": boolean
}

key_personnel is bonus — never block readyToSubmit on it. Extract names/emails only if explicitly mentioned.

readyToSubmit = true when:
- At least 4 messages have been exchanged (${messages.length} so far)
- agency_name is known
- At least one of: topics non-empty, situation non-null, request_type non-null

Suggestions should be short, natural next things a rep might say (not questions, but statements or actions).`,
      },
    ],
  })

  const text = result.content[0].type === 'text' ? result.content[0].text : '{}'
  try {
    return JSON.parse(text)
  } catch {
    return {
      suggestions: ['Tell me more about their situation', 'Add more context', 'Submit this request'],
      extracted: {},
      readyToSubmit: false,
    }
  }
}

export async function POST(req: NextRequest) {
  const { messages, email } = (await req.json()) as { messages: DiscoveryMessage[]; email: string }

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages required' }), { status: 400 })
  }

  const anthropicMessages = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const db = createServiceRoleClient()
  const { data: toolContextRows } = await db
    .from('tool_recommendations')
    .select('name, bot_context')
    .not('bot_context', 'is', null)
    .order('name')

  const detailedContext = toolContextRows?.length
    ? '\n\n---\nDETAILED PRODUCT KNOWLEDGE (from ATS team, always current):\n\n' +
      toolContextRows.map((t) => t.bot_context).join('\n\n---\n\n')
    : ''

  const systemPrompt =
    BASE_SYSTEM_PROMPT +
    detailedContext +
    (email ? `\n\nThe submitting rep's email: ${email}` : '')

  let fullResponse = ''

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 256,
          system: systemPrompt,
          messages: anthropicMessages,
        })

        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const text = chunk.delta.text
            fullResponse += text
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        // After streaming: extract structured data via haiku
        const { suggestions, extracted, readyToSubmit } = await extractDiscoveryData(
          messages,
          fullResponse
        )

        controller.enqueue(
          enc.encode(
            `data: ${JSON.stringify({ suggestions, extracted, readyToSubmit })}\n\n`
          )
        )
        controller.enqueue(enc.encode(`data: {"done":true}\n\n`))
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Stream error'
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
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
