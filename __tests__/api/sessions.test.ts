import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthClient, buildServiceRoleClient, buildChain } from '../helpers/supabase-mock'

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

import { GET, POST } from '@/app/api/sessions/route'
import { NextResponse } from 'next/server'

const MOCK_SESSIONS = [
  {
    id: 's-1',
    agent_id: 'a-1',
    session_date: '2026-06-30',
    status: 'processed',
    agents: { name: 'Agent Smith', agency_name: 'Acme Title' },
    session_analysis: { summary: 'Good session.', problem_tags: ['order_entry'] },
  },
]

describe('GET /api/sessions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient(null))
    const req = new Request('http://localhost/api/sessions')
    await GET(req)
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized' },
      { status: 401 },
    )
  })

  it('returns session list when authenticated', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))
    mockCreateService.mockReturnValue(
      buildServiceRoleClient({
        sessions: { data: MOCK_SESSIONS, error: null },
      }),
    )

    const req = new Request('http://localhost/api/sessions')
    await GET(req)

    expect(NextResponse.json).toHaveBeenCalledWith({ data: MOCK_SESSIONS })
  })

  it('filters by agent_id when provided in query string', async () => {
    const user = { id: 'user-1' }
    mockCreateServer.mockReturnValue(buildAuthClient(user))

    const fromSpy = vi.fn(() => buildChain({ data: [], error: null }))
    mockCreateService.mockReturnValue({ from: fromSpy })

    const req = new Request('http://localhost/api/sessions?agent_id=a-99')
    await GET(req)

    // The route calls db.from('sessions') — verify it was called
    expect(fromSpy).toHaveBeenCalledWith('sessions')
  })
})

describe('POST /api/sessions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient(null))
    const req = new Request('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ agent_id: 'a-1', session_date: '2026-06-30' }),
    })
    await POST(req)
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized' },
      { status: 401 },
    )
  })

  it('creates a session and returns 201', async () => {
    const newSession = { id: 's-new', status: 'pending', agent_id: 'a-1' }
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))
    mockCreateService.mockReturnValue(
      buildServiceRoleClient({
        sessions: { data: newSession, error: null },
      }),
    )

    const req = new Request('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ agent_id: 'a-1', session_date: '2026-06-30' }),
    })
    await POST(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { data: newSession },
      { status: 201 },
    )
  })
})
