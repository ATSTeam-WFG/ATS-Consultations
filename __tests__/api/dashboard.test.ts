import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthClient, buildServiceRoleClient } from '../helpers/supabase-mock'

// ── Mock next/server ─────────────────────────────────────────────────────────
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    })),
  },
}))

// ── Mock @/lib/supabase ───────────────────────────────────────────────────────
const mockCreateServer = vi.fn()
const mockCreateService = vi.fn()

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: () => mockCreateServer(),
  createServiceRoleClient: () => mockCreateService(),
}))

import { GET } from '@/app/api/dashboard/route'
import { NextResponse } from 'next/server'

// ── Tag aggregation helper (inline, mirrors route logic) ──────────────────────
function aggregateTags(
  analyses: { problem_tags: string[] }[],
): { tag: string; count: number }[] {
  const tagMap = new Map<string, number>()
  for (const analysis of analyses) {
    for (const tag of analysis.problem_tags ?? []) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1)
    }
  }
  return Array.from(tagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }))
}

describe('GET /api/dashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when user is not authenticated', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient(null))
    await GET()
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized' },
      { status: 401 },
    )
  })

  it('returns dashboard metrics when authenticated', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))
    mockCreateService.mockReturnValue(
      buildServiceRoleClient({
        agents: { count: 4, data: null, error: null },
        sessions: { count: 10, data: null, error: null },
        session_analysis: { data: [], error: null },
        trends: { data: [], error: null },
        playbooks: { data: [], error: null },
      }),
    )

    await GET()

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.any(Object) }),
    )
  })
})

describe('aggregateTags() (dashboard tag logic)', () => {
  it('counts tags across multiple analyses', () => {
    const result = aggregateTags([
      { problem_tags: ['order_entry', 'compliance'] },
      { problem_tags: ['order_entry', 'ai_adoption'] },
      { problem_tags: ['compliance'] },
    ])
    expect(result[0]).toEqual({ tag: 'order_entry', count: 2 })
    expect(result[1]).toEqual({ tag: 'compliance', count: 2 })
    expect(result[2]).toEqual({ tag: 'ai_adoption', count: 1 })
  })

  it('returns at most 5 tags', () => {
    const analyses = Array.from({ length: 10 }, (_, i) => ({
      problem_tags: [`tag_${i}`],
    }))
    expect(aggregateTags(analyses)).toHaveLength(5)
  })

  it('returns empty array when given no analyses', () => {
    expect(aggregateTags([])).toEqual([])
  })

  it('sorts by count descending', () => {
    const result = aggregateTags([
      { problem_tags: ['a'] },
      { problem_tags: ['b', 'b', 'b'] },
      { problem_tags: ['c', 'c'] },
    ])
    expect(result.map((r) => r.tag)).toEqual(['b', 'c', 'a'])
  })
})
