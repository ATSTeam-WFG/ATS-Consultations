import { describe, it, expect, vi } from 'vitest'

// Prevent lib/claude.ts from initializing the Anthropic SDK at import time
vi.mock('@/lib/claude', () => ({
  analyzeSession: vi.fn(),
  detectTrends: vi.fn(),
  matchPlaybooks: vi.fn(),
  extractQAFilters: vi.fn(),
  generateQAAnswer: vi.fn(),
  generateProactiveGreeting: vi.fn(),
}))

// Prevent lib/supabase.ts from running in browser env
vi.mock('@/lib/supabase', () => ({
  createServiceRoleClient: vi.fn(),
  createServerSupabaseClient: vi.fn(),
}))

import { buildSessionContent } from '@/lib/analysis-pipeline'

describe('buildSessionContent()', () => {
  const base = {
    session_date: '2026-06-30',
  }

  it('always includes the session date', () => {
    const result = buildSessionContent(base)
    expect(result).toContain('Session Date: 2026-06-30')
  })

  it('includes duration when provided', () => {
    const result = buildSessionContent({ ...base, duration_minutes: 45 })
    expect(result).toContain('Duration: 45 minutes')
  })

  it('omits duration when null', () => {
    const result = buildSessionContent({ ...base, duration_minutes: null })
    expect(result).not.toContain('Duration')
  })

  it('includes rep name when provided', () => {
    const result = buildSessionContent({ ...base, rep_name: 'Jane Doe' })
    expect(result).toContain('Consulting Rep: Jane Doe')
  })

  it('includes notes section with header', () => {
    const result = buildSessionContent({ ...base, notes: 'Agent needs help with order entry.' })
    expect(result).toContain('--- Session Notes ---')
    expect(result).toContain('Agent needs help with order entry.')
  })

  it('includes transcript section with header', () => {
    const result = buildSessionContent({
      ...base,
      transcript_text: 'REP: Hello. AGENT: Hi.',
    })
    expect(result).toContain('--- Transcript ---')
    expect(result).toContain('REP: Hello. AGENT: Hi.')
  })

  it('omits notes and transcript sections when both are null', () => {
    const result = buildSessionContent({ ...base, notes: null, transcript_text: null })
    expect(result).not.toContain('--- Session Notes ---')
    expect(result).not.toContain('--- Transcript ---')
  })

  it('builds a combined result with all fields', () => {
    const result = buildSessionContent({
      session_date: '2026-06-30',
      duration_minutes: 30,
      rep_name: 'John',
      notes: 'Quick check-in.',
      transcript_text: 'Talk talk.',
    })
    expect(result).toContain('Session Date: 2026-06-30')
    expect(result).toContain('Duration: 30 minutes')
    expect(result).toContain('Consulting Rep: John')
    expect(result).toContain('Quick check-in.')
    expect(result).toContain('Talk talk.')
  })
})
