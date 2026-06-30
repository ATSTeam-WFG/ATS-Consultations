import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthClient, buildServiceRoleClient } from '../helpers/supabase-mock'

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    })),
  },
}))

const mockCreateServer = vi.fn()
const mockCreateService = vi.fn()

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: () => mockCreateServer(),
  createServiceRoleClient: () => mockCreateService(),
}))

import { GET, POST } from '@/app/api/agents/route'
import { NextResponse } from 'next/server'

const MOCK_AGENTS = [
  {
    id: 'a-1',
    name: 'Jane Title',
    email: 'jane@acme.com',
    agency_name: 'Acme Title',
    category: 'GOLD',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

describe('GET /api/agents', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient(null))
    await GET()
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized' },
      { status: 401 },
    )
  })

  it('returns agent list when authenticated', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))
    mockCreateService.mockReturnValue(
      buildServiceRoleClient({
        agents: { data: MOCK_AGENTS, error: null },
      }),
    )

    await GET()

    expect(NextResponse.json).toHaveBeenCalledWith({ data: MOCK_AGENTS })
  })
})

describe('POST /api/agents', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient(null))
    const req = new Request('http://localhost/api/agents', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bob', agency_name: 'Bob Title' }),
    })
    await POST(req)
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized' },
      { status: 401 },
    )
  })

  it('creates an agent and returns 201', async () => {
    const created = { id: 'a-new', name: 'Bob', agency_name: 'Bob Title', user_id: 'user-1' }
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))
    mockCreateService.mockReturnValue(
      buildServiceRoleClient({
        agents: { data: created, error: null },
      }),
    )

    const req = new Request('http://localhost/api/agents', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bob', agency_name: 'Bob Title' }),
    })
    await POST(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { data: created },
      { status: 201 },
    )
  })

  it('attaches user_id from the authenticated user', async () => {
    const userId = 'user-42'
    mockCreateServer.mockReturnValue(buildAuthClient({ id: userId }))

    const insertSpy = vi.fn(() => ({
      select: () => ({ single: () => Promise.resolve({ data: { id: 'x' }, error: null }) }),
    }))
    mockCreateService.mockReturnValue({
      from: vi.fn(() => ({ insert: insertSpy })),
    })

    const req = new Request('http://localhost/api/agents', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bob', agency_name: 'Bob Title' }),
    })
    await POST(req)

    // Verify the insert payload included user_id
    const insertArg = insertSpy.mock.calls[0]?.[0] as Record<string, unknown>
    expect(insertArg.user_id).toBe(userId)
  })
})
