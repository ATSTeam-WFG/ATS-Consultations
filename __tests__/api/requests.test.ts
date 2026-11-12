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

import { GET, POST } from '@/app/api/requests/route'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const MOCK_REQUEST = {
  id: 'req-1',
  agency_name: 'Sunrise Title',
  category: 'GOLD',
  status: 'pending',
  contacts: [],
  submitted_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
}

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new Request('http://localhost/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

// ── POST /api/requests ─────────────────────────────────────────
describe('POST /api/requests', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 201 with valid minimal payload', async () => {
    mockCreateService.mockReturnValue(
      buildServiceRoleClient({
        consultation_requests: { data: MOCK_REQUEST, error: null },
      }),
    )

    const req = makePostRequest({ agency_name: 'Sunrise Title', category: 'GOLD' })
    await POST(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { data: MOCK_REQUEST },
      { status: 201 },
    )
  })

  it('returns 400 when agency_name is missing', async () => {
    const req = makePostRequest({ category: 'GOLD' })
    await POST(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'agency_name is required' },
      { status: 400 },
    )
  })

  it('returns 400 when category is missing', async () => {
    const req = makePostRequest({ agency_name: 'Sunrise Title' })
    await POST(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'category must be one of UNICORN, DIAMOND, GOLD, SILVER' },
      { status: 400 },
    )
  })

  it('returns 400 when category is invalid', async () => {
    const req = makePostRequest({ agency_name: 'Sunrise Title', category: 'INVALID' })
    await POST(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'category must be one of UNICORN, DIAMOND, GOLD, SILVER' },
      { status: 400 },
    )
  })

  it('persists v2 fields: region, team_size, topics, situation, notes', async () => {
    const insertSpy = vi.fn(() => ({
      select: () => ({
        single: () => Promise.resolve({ data: { ...MOCK_REQUEST, id: 'req-2' }, error: null }),
      }),
    }))
    mockCreateService.mockReturnValue({
      from: vi.fn(() => ({ insert: insertSpy })),
    })

    const req = makePostRequest({
      agency_name: 'Summit Title',
      category: 'UNICORN',
      region: 'Pacific Northwest',
      team_size: '16–30',
      topics: ['Order Entry', 'AI Adoption'],
      situation: 'We need help with automation.',
      notes: 'Prefer morning slots.',
    })
    await POST(req)

    const insertArg = (insertSpy.mock.calls[0] as unknown as [Record<string, unknown>])[0]
    expect(insertArg.region).toBe('Pacific Northwest')
    expect(insertArg.team_size).toBe('16–30')
    expect(insertArg.topics).toEqual(['Order Entry', 'AI Adoption'])
    expect(insertArg.situation).toBe('We need help with automation.')
    expect(insertArg.notes).toBe('Prefer morning slots.')
  })

  it('persists contacts from key_personnel mapping', async () => {
    const insertSpy = vi.fn(() => ({
      select: () => ({
        single: () => Promise.resolve({ data: { ...MOCK_REQUEST, id: 'req-3' }, error: null }),
      }),
    }))
    mockCreateService.mockReturnValue({
      from: vi.fn(() => ({ insert: insertSpy })),
    })

    const contacts = [
      { name: 'Jane Doe', email: 'jane@acme.com', role: '' },
      { name: 'Mark Hill', email: 'mark@acme.com', role: '' },
    ]

    const req = makePostRequest({
      agency_name: 'Acme Title',
      category: 'DIAMOND',
      contacts,
    })
    await POST(req)

    const insertArg = (insertSpy.mock.calls[0] as unknown as [Record<string, unknown>])[0]
    expect(insertArg.contacts).toEqual(contacts)
  })

  it('persists bot-sourced fields: closing_software, request_type, request_source, submitter_email', async () => {
    const insertSpy = vi.fn(() => ({
      select: () => ({
        single: () => Promise.resolve({ data: { ...MOCK_REQUEST, id: 'req-4' }, error: null }),
      }),
    }))
    mockCreateService.mockReturnValue({
      from: vi.fn(() => ({ insert: insertSpy })),
    })

    const req = makePostRequest({
      agency_name: 'Acme Title',
      category: 'SILVER',
      closing_software: 'ResWare',
      request_type: 'consultation',
      request_source: 'chatbot',
      submitter_email: 'rep@wfg.com',
    })
    await POST(req)

    const insertArg = (insertSpy.mock.calls[0] as unknown as [Record<string, unknown>])[0]
    expect(insertArg.closing_software).toBe('ResWare')
    expect(insertArg.request_type).toBe('consultation')
    expect(insertArg.request_source).toBe('chatbot')
    expect(insertArg.submitter_email).toBe('rep@wfg.com')
  })

  it('defaults request_source to stepper when not provided', async () => {
    const insertSpy = vi.fn(() => ({
      select: () => ({
        single: () => Promise.resolve({ data: MOCK_REQUEST, error: null }),
      }),
    }))
    mockCreateService.mockReturnValue({
      from: vi.fn(() => ({ insert: insertSpy })),
    })

    const req = makePostRequest({ agency_name: 'Acme Title', category: 'GOLD' })
    await POST(req)

    const insertArg = (insertSpy.mock.calls[0] as unknown as [Record<string, unknown>])[0]
    expect(insertArg.request_source).toBe('stepper')
  })
})

// ── GET /api/requests ──────────────────────────────────────────
describe('GET /api/requests', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient(null))

    await GET()

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized' },
      { status: 401 },
    )
  })

  it('returns 200 with pending records when authenticated', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))
    mockCreateService.mockReturnValue(
      buildServiceRoleClient({
        consultation_requests: { data: [MOCK_REQUEST], error: null },
      }),
    )

    await GET()

    expect(NextResponse.json).toHaveBeenCalledWith({ data: [MOCK_REQUEST] })
  })

  it('only returns status=pending records', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))

    const eqSpy = vi.fn(() => buildChain({ data: [MOCK_REQUEST], error: null }))
    const selectSpy = vi.fn(() => ({ eq: eqSpy }))

    mockCreateService.mockReturnValue({
      from: vi.fn(() => ({ select: selectSpy })),
    })

    await GET()

    expect(eqSpy).toHaveBeenCalledWith('status', 'pending')
  })
})

// ── PATCH /api/requests/[id] ───────────────────────────────────
describe('PATCH /api/requests/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  async function doPatch(id: string, body: Record<string, unknown>) {
    // Dynamically import PATCH after mocks are set up
    const { PATCH } = await import('@/app/api/requests/[id]/route')
    const req = new Request(`http://localhost/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as unknown as NextRequest
    const params = Promise.resolve({ id })
    return PATCH(req, { params })
  }

  it('returns 401 when unauthenticated', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient(null))

    await doPatch('req-1', { status: 'dismissed' })

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized' },
      { status: 401 },
    )
  })

  it('updates status to dismissed', async () => {
    const updated = { ...MOCK_REQUEST, status: 'dismissed' }
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))
    mockCreateService.mockReturnValue(
      buildServiceRoleClient({
        consultation_requests: { data: updated, error: null },
      }),
    )

    await doPatch('req-1', { status: 'dismissed' })

    expect(NextResponse.json).toHaveBeenCalledWith({ data: updated })
  })

  it('updates status to converted and sets agent_id', async () => {
    const updated = { ...MOCK_REQUEST, status: 'converted', agent_id: 'agent-42' }
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))
    mockCreateService.mockReturnValue(
      buildServiceRoleClient({
        consultation_requests: { data: updated, error: null },
      }),
    )

    await doPatch('req-1', { status: 'converted', agent_id: 'agent-42' })

    expect(NextResponse.json).toHaveBeenCalledWith({ data: updated })
  })
})
