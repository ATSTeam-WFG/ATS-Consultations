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

import { POST } from '@/app/api/requests/[id]/approve/route'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const MOCK_REQUEST = {
  id: 'req-1',
  agency_name: 'Sunrise Title',
  category: 'GOLD',
  status: 'pending',
  rep_name: 'Alice Rep',
  rep_email: 'alice@wfg.com',
  region: 'Southeast',
  situation: 'Need help with closings.',
  closing_software: 'SoftPro',
  request_type: 'consultation',
  notes: 'Prefers mornings.',
  contacts: [
    { name: 'Bob Smith', email: 'bob@sunrise.com', role: 'Owner' },
    { name: 'Carol Jones', email: 'carol@sunrise.com', role: '' },
  ],
  submitted_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
}

const MOCK_AGENT = {
  id: 'agent-99',
  user_id: 'user-1',
  name: 'Bob Smith',
  email: 'bob@sunrise.com',
  agency_name: 'Sunrise Title',
  category: 'GOLD',
  wfg_rep: 'Alice Rep',
  location: 'Southeast',
  notes: 'Situation: Need help with closings.\n\nClosing software: SoftPro\n\nRequest type: consultation\n\nNotes: Prefers mornings.',
  contacts: [
    { name: 'Bob Smith', email: 'bob@sunrise.com' },
    { name: 'Carol Jones', email: 'carol@sunrise.com' },
  ],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function doApprove(id: string) {
  const req = new Request(`http://localhost/api/requests/${id}/approve`, {
    method: 'POST',
  }) as unknown as NextRequest
  return POST(req, { params: Promise.resolve({ id }) })
}

// ── POST /api/requests/[id]/approve ────────────────────────────
describe('POST /api/requests/[id]/approve', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient(null))

    await doApprove('req-1')

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized' },
      { status: 401 },
    )
  })

  it('returns 404 when request is not found', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))
    mockCreateService.mockReturnValue(
      buildServiceRoleClient({
        consultation_requests: { data: null, error: { message: 'Not found' } },
        agents: { data: null, error: null },
      }),
    )

    await doApprove('req-1')

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Not found' },
      { status: 404 },
    )
  })

  it('returns 201 with agent on success', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))
    mockCreateService.mockReturnValue(
      buildServiceRoleClient({
        consultation_requests: { data: MOCK_REQUEST, error: null },
        agents: { data: MOCK_AGENT, error: null },
      }),
    )

    await doApprove('req-1')

    expect(NextResponse.json).toHaveBeenCalledWith(
      { agent: MOCK_AGENT },
      { status: 201 },
    )
  })

  it('maps request fields to agent correctly', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))

    const insertSpy = vi.fn(() => ({
      select: () => ({ single: () => Promise.resolve({ data: MOCK_AGENT, error: null }) }),
    }))

    const selectOnce = vi.fn(() => ({
      eq: vi.fn(() => ({ single: () => Promise.resolve({ data: MOCK_REQUEST, error: null }) })),
    }))

    mockCreateService.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'agents') return { insert: insertSpy }
        // consultation_requests: first call is select, second is update
        return {
          select: selectOnce,
          update: vi.fn(() => buildChain({ data: null, error: null })),
        }
      }),
    })

    await doApprove('req-1')

    const payload = (insertSpy.mock.calls[0] as unknown as [Record<string, unknown>])[0]
    expect(payload.name).toBe('Bob Smith')
    expect(payload.email).toBe('bob@sunrise.com')
    expect(payload.agency_name).toBe('Sunrise Title')
    expect(payload.category).toBe('GOLD')
    expect(payload.wfg_rep).toBe('Alice Rep')
    expect(payload.location).toBe('Southeast')
  })

  it('concatenates situation, closing_software, request_type, notes into agent notes', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))

    const insertSpy = vi.fn(() => ({
      select: () => ({ single: () => Promise.resolve({ data: MOCK_AGENT, error: null }) }),
    }))

    mockCreateService.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'agents') return { insert: insertSpy }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: () => Promise.resolve({ data: MOCK_REQUEST, error: null }) })),
          })),
          update: vi.fn(() => buildChain({ data: null, error: null })),
        }
      }),
    })

    await doApprove('req-1')

    const payload = (insertSpy.mock.calls[0] as unknown as [Record<string, unknown>])[0]
    expect(payload.notes).toContain('Situation: Need help with closings.')
    expect(payload.notes).toContain('Closing software: SoftPro')
    expect(payload.notes).toContain('Request type: consultation')
    expect(payload.notes).toContain('Notes: Prefers mornings.')
  })

  it('strips role from contacts — only name+email passed to agent', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))

    const insertSpy = vi.fn(() => ({
      select: () => ({ single: () => Promise.resolve({ data: MOCK_AGENT, error: null }) }),
    }))

    mockCreateService.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'agents') return { insert: insertSpy }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: () => Promise.resolve({ data: MOCK_REQUEST, error: null }) })),
          })),
          update: vi.fn(() => buildChain({ data: null, error: null })),
        }
      }),
    })

    await doApprove('req-1')

    const payload = (insertSpy.mock.calls[0] as unknown as [Record<string, unknown>])[0]
    const contacts = payload.contacts as { name: string; email: string; role?: string }[]
    expect(contacts).toHaveLength(2)
    expect(contacts[0]).toEqual({ name: 'Bob Smith', email: 'bob@sunrise.com' })
    expect(contacts[1]).toEqual({ name: 'Carol Jones', email: 'carol@sunrise.com' })
    expect(contacts[0].role).toBeUndefined()
  })

  it('falls back to agency_name as agent name when contacts is empty', async () => {
    const noContactsRequest = { ...MOCK_REQUEST, contacts: [] }
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))

    const insertSpy = vi.fn(() => ({
      select: () => ({ single: () => Promise.resolve({ data: MOCK_AGENT, error: null }) }),
    }))

    mockCreateService.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'agents') return { insert: insertSpy }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: () => Promise.resolve({ data: noContactsRequest, error: null }) })),
          })),
          update: vi.fn(() => buildChain({ data: null, error: null })),
        }
      }),
    })

    await doApprove('req-1')

    const payload = (insertSpy.mock.calls[0] as unknown as [Record<string, unknown>])[0]
    expect(payload.name).toBe('Sunrise Title')
    expect(payload.email).toBeNull()
    expect(payload.contacts).toEqual([])
  })

  it('returns 500 when agent INSERT fails', async () => {
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))
    mockCreateService.mockReturnValue(
      buildServiceRoleClient({
        consultation_requests: { data: MOCK_REQUEST, error: null },
        agents: { data: null, error: { message: 'insert error' } },
      }),
    )

    await doApprove('req-1')

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'insert error' },
      { status: 500 },
    )
  })

  it('notes is null when situation, closing_software, request_type, and notes are all absent', async () => {
    const bareRequest = {
      ...MOCK_REQUEST,
      situation: null,
      closing_software: null,
      request_type: null,
      notes: null,
    }
    mockCreateServer.mockReturnValue(buildAuthClient({ id: 'user-1' }))

    const insertSpy = vi.fn(() => ({
      select: () => ({ single: () => Promise.resolve({ data: MOCK_AGENT, error: null }) }),
    }))

    mockCreateService.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'agents') return { insert: insertSpy }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: () => Promise.resolve({ data: bareRequest, error: null }) })),
          })),
          update: vi.fn(() => buildChain({ data: null, error: null })),
        }
      }),
    })

    await doApprove('req-1')

    const payload = (insertSpy.mock.calls[0] as unknown as [Record<string, unknown>])[0]
    expect(payload.notes).toBeNull()
  })
})
