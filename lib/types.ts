// ============================================================
// Core domain types for ATS Consultation Engine
// ============================================================

export type ATSSize = 'small' | 'mid' | 'large' | 'enterprise'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type TrendDirection = 'rising' | 'stable' | 'falling'
export type SessionStatus = 'scheduled' | 'pending' | 'processing' | 'processed' | 'failed'
export type SessionType = 'walk_in' | 'zoom_call'
export type PlaybookStatus = 'draft' | 'published' | 'archived'
export type MessageRole = 'user' | 'assistant'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type TitleAgentCategory = 'UNICORN' | 'DIAMOND' | 'GOLD' | 'SILVER'

export interface Contact {
  name: string
  email: string
}

export const PROBLEM_TAGS = [
  'order_entry',
  'purchase_sale_agreement',
  'closing_coordination',
  'post_closing',
  'remittance',
  'escrow_accounting',
  'tps_automations',
  'integrations',
  'ai_adoption',
  'marketing',
  'crm_prospects',
  'lender_relations',
  'realtor_relations',
  'reporting',
  'compliance',
  'wire_fraud_prevention',
  'policies',
  'title_search',
  'team_capacity',
  'client_communication',
] as const

export type ProblemTag = (typeof PROBLEM_TAGS)[number]

// ============================================================
// Agents (Title Agents)
// ============================================================
export interface Agent {
  id: string
  user_id: string
  name: string
  email: string | null
  agency_name: string
  category: TitleAgentCategory | null
  wfg_rep: string | null
  contacts: Contact[]
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AgentWithSessions extends Agent {
  sessions?: Session[]
  session_count?: number
}

// ============================================================
// Sessions
// ============================================================
export interface Session {
  id: string
  user_id: string
  agent_id: string
  rep_name: string | null
  session_date: string
  duration_minutes: number | null
  notes: string | null
  transcript_url: string | null
  transcript_text: string | null
  status: SessionStatus
  session_type: SessionType
  created_at: string
  updated_at: string
  agent?: Agent
  analysis?: SessionAnalysis
}

export interface PainPoint {
  description: string
  severity: Severity
  category: string
}

export interface ToolRecommendationItem {
  name: string
  category: string
  rationale: string
  priority: 'high' | 'medium' | 'low'
}

export interface RoadmapStep {
  week: number
  title: string
  description: string
  owner: string
}

export interface ROIEstimate {
  time_saved_hours_per_week: number
  revenue_impact: string
  confidence: 'low' | 'medium' | 'high'
  notes: string
}

export interface SessionAnalysis {
  id: string
  session_id: string
  summary: string | null
  pain_points: PainPoint[]
  problem_tags: ProblemTag[]
  tool_recommendations: ToolRecommendationItem[]
  roadmap_steps: RoadmapStep[]
  roi_estimate: ROIEstimate | null
  matched_playbook_ids: string[]
  raw_claude_response: Record<string, unknown> | null
  created_at: string
  updated_at: string
  matched_playbooks?: PlaybookMatch[]
}

// ============================================================
// Tool Recommendations (DB records)
// ============================================================
export interface ToolRecommendation {
  id: string
  user_id: string
  name: string
  category: string | null
  description: string | null
  use_cases: string[]
  ats_size_fit: ATSSize[]
  min_tps: number | null
  max_tps: number | null
  website_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// Trends
// ============================================================
export interface Trend {
  id: string
  user_id: string
  tag: ProblemTag | string
  category: string | null
  session_count: number
  agent_count: number
  severity_avg: number | null
  trend_direction: TrendDirection | null
  description: string | null
  detected_at: string
  updated_at: string
}

// ============================================================
// Playbooks
// ============================================================
export interface PlaybookStep {
  id: string
  order: number
  title: string
  description: string
  duration_days: number
  tools: string[]
  deliverables: string[]
}

export interface Playbook {
  id: string
  user_id: string
  title: string
  description: string | null
  trigger_tags: ProblemTag[]
  ats_size_fit: ATSSize[]
  agent_category_fit: TitleAgentCategory[]
  min_tps: number | null
  max_tps: number | null
  difficulty: Difficulty | null
  estimated_weeks: number | null
  steps: PlaybookStep[]
  tools_needed: string[]
  expected_outcome: string | null
  usage_count: number
  status: PlaybookStatus
  created_at: string
  updated_at: string
}

export interface PlaybookMatch {
  playbook: Playbook
  match_score: number
  match_reason: string
}

export interface AgentPlaybook {
  id: string
  agent_id: string
  playbook_id: string
  added_by: string | null
  created_at: string
  playbook?: Playbook
}

// ============================================================
// Q&A
// ============================================================
export interface ContextUsed {
  type: 'agent' | 'session' | 'analysis' | 'trend' | 'playbook'
  id: string
  label: string
  excerpt?: string
}

export interface QAMessage {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  context_used: ContextUsed[] | null
  created_at: string
}

export interface QAConversation {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
  messages?: QAMessage[]
  last_message?: QAMessage
}

// ============================================================
// Dashboard
// ============================================================
export interface DashboardMetrics {
  total_agents: number
  total_sessions: number
  processed_sessions: number
  pending_sessions: number
  top_problems: { tag: string; count: number }[]
  active_trends: Trend[]
  top_playbooks: { playbook: Playbook; usage_count: number }[]
}

// ============================================================
// Intake
// ============================================================
export interface IntakeToken {
  id: string
  token: string
  agent_id: string
  created_by: string
  submitted_at: string | null
  created_at: string
}

export interface AgentIntake {
  id: string
  token_id: string
  agent_id: string
  responses: IntakeResponses
  submitted_at: string
}

export interface IntakeResponses {
  monthly_volume?: string
  team_size?: string
  current_software?: string[]
  challenge_areas?: string[]
  biggest_bottleneck?: string
  success_looks_like?: string
  additional_context?: string
  preferred_contact?: { name: string; email: string }
}

export interface IntakeQuestion {
  id: string
  key: string
  type: 'choice' | 'multiselect' | 'text' | 'contact'
  title: string
  subtitle: string | null
  options: { label: string; value: string }[] | null
  max_select: number | null
  display_order: number
  enabled: boolean
}

// ============================================================
// API Response shapes
// ============================================================
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}
