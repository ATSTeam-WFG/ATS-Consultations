import Anthropic from '@anthropic-ai/sdk'
import type { Playbook, ProblemTag, SessionAnalysis } from './types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ============================================================
// Prompt 1: Analyze a consultation session
// ============================================================
export async function analyzeSession(
  content: string,
  agentName: string,
  atsSize?: string,
  tps?: number
): Promise<SessionAnalysis> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an expert US title industry consultant analyzing a consultation session with a title agency.

Agent: ${agentName}
Agency Size: ${atsSize ?? 'unknown'}
Transactions per second (TPS): ${tps ?? 'unknown'}

Session content:
<session>
${content}
</session>

Analyze this consultation session and return a JSON object with the following structure:
{
  "summary": "2-3 sentence executive summary of the session",
  "pain_points": [
    {
      "description": "specific pain point description",
      "severity": "low|medium|high|critical",
      "category": "category name"
    }
  ],
  "problem_tags": ["tag1", "tag2"],
  "tool_recommendations": [
    {
      "name": "tool name",
      "category": "category",
      "rationale": "why this tool helps",
      "priority": "high|medium|low"
    }
  ],
  "roadmap_steps": [
    {
      "week": 1,
      "title": "step title",
      "description": "what to do",
      "owner": "who owns it"
    }
  ],
  "roi_estimate": {
    "time_saved_hours_per_week": 5,
    "revenue_impact": "$50k-100k annually",
    "confidence": "low|medium|high",
    "notes": "assumptions made"
  }
}

Problem tags must be chosen from: order_entry, purchase_sale_agreement, closing_coordination, post_closing, remittance, escrow_accounting, tps_automations, integrations, ai_adoption, marketing, crm_prospects, lender_relations, realtor_relations, reporting, compliance, wire_fraud_prevention, policies, title_search, team_capacity, client_communication

Return ONLY valid JSON, no markdown fences.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text) as SessionAnalysis
}

// ============================================================
// Prompt 2: Match playbooks to session analysis
// ============================================================
export async function matchPlaybooks(
  problemTags: ProblemTag[],
  tps: number | null,
  atsSize: string | null,
  playbooks: Playbook[]
): Promise<{ playbook_id: string; match_score: number; match_reason: string }[]> {
  if (playbooks.length === 0) return []

  const playbooksJson = playbooks.map((pb) => ({
    id: pb.id,
    title: pb.title,
    trigger_tags: pb.trigger_tags,
    ats_size_fit: pb.ats_size_fit,
    min_tps: pb.min_tps,
    max_tps: pb.max_tps,
    difficulty: pb.difficulty,
    description: pb.description,
  }))

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are a US title industry consultant matching session problems to solution playbooks.

Session problem tags: ${problemTags.join(', ')}
ATS size: ${atsSize ?? 'unknown'}
TPS: ${tps ?? 'unknown'}

Available playbooks:
${JSON.stringify(playbooksJson, null, 2)}

For each playbook, calculate a match score (0.0-1.0) based on:
- Tag overlap (most important)
- ATS size fit
- TPS range fit

Return the top 3 matches as JSON array:
[
  {
    "playbook_id": "uuid",
    "match_score": 0.95,
    "match_reason": "Why this playbook fits (1-2 sentences)"
  }
]

Only include playbooks with score >= 0.3. Return ONLY valid JSON, no markdown.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
  return JSON.parse(text)
}

// ============================================================
// Prompt 3: Extract Q&A filters from natural language
// ============================================================
export async function extractQAFilters(question: string): Promise<{
  agent_name?: string
  problem_tags?: ProblemTag[]
  date_from?: string
  date_to?: string
  ats_size?: string
  topic?: string
}> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Extract search filters from this question about title agency consultation sessions.

Question: "${question}"

Return a JSON object with any of these optional fields:
{
  "agent_name": "name if asking about specific agent",
  "problem_tags": ["tag1"] if asking about specific problems,
  "date_from": "YYYY-MM-DD if time range mentioned",
  "date_to": "YYYY-MM-DD if time range mentioned",
  "ats_size": "small|mid|large|enterprise if size mentioned",
  "topic": "general topic keyword"
}

Problem tags: order_entry, purchase_sale_agreement, closing_coordination, post_closing, remittance, escrow_accounting, tps_automations, integrations, ai_adoption, marketing, crm_prospects, lender_relations, realtor_relations, reporting, compliance, wire_fraud_prevention, policies, title_search, team_capacity, client_communication

Return ONLY valid JSON, no markdown.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

// ============================================================
// Prompt 4: Generate Q&A answer (streaming)
// ============================================================
export async function generateQAAnswer(
  question: string,
  context: string,
  history: { role: 'user' | 'assistant'; content: string }[]
) {
  return anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are an intelligent US title industry consultation analyst with access to a database of consultation sessions, title agent profiles, and playbooks.

Answer questions about patterns, specific agents, problems, and recommendations based on the provided context. Be specific, cite data from the context, and be practical in your recommendations.

If the context doesn't have enough information, say so clearly rather than guessing.`,
    messages: [
      ...history,
      {
        role: 'user',
        content: `Context from the database:
<context>
${context}
</context>

Question: ${question}`,
      },
    ],
  })
}

// ============================================================
// Prompt 5: Detect trends across sessions
// ============================================================
export async function detectTrends(
  tagCounts: { tag: string; count: number; agent_count: number; avg_severity: number }[]
): Promise<
  {
    tag: string
    trend_direction: 'rising' | 'stable' | 'falling'
    description: string
    category: string
  }[]
> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Analyze these title agency consultation problem tag frequencies and identify trends.

Tag data: ${JSON.stringify(tagCounts, null, 2)}

For each tag with count >= 2, return a JSON array:
[
  {
    "tag": "tag_name",
    "trend_direction": "rising|stable|falling",
    "description": "1-2 sentence description of what this trend means for title agencies",
    "category": "category grouping"
  }
]

Return ONLY valid JSON, no markdown.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
  try {
    return JSON.parse(text)
  } catch {
    return []
  }
}

// ============================================================
// Utility: Generate conversation title
// ============================================================
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 32,
    messages: [
      {
        role: 'user',
        content: `Create a 4-5 word title for this question: "${firstMessage.slice(0, 200)}". Return ONLY the title, no quotes or punctuation.`,
      },
    ],
  })

  return message.content[0].type === 'text'
    ? message.content[0].text.trim()
    : 'New conversation'
}
