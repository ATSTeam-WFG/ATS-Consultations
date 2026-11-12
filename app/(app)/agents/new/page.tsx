import { AgentForm } from '@/components/agents/AgentForm'
import type { TitleAgentCategory, Contact } from '@/lib/types'

interface Props {
  searchParams: Promise<{
    from_request?: string
    agency_name?: string
    category?: string
    contacts?: string
  }>
}

export default async function NewAgentPage({ searchParams }: Props) {
  const params = await searchParams
  const fromRequestId = params.from_request
  const prefilledContacts: Contact[] = params.contacts ? JSON.parse(params.contacts) : []

  const initial = fromRequestId ? {
    agency_name: params.agency_name ?? '',
    category: (params.category as TitleAgentCategory) || undefined,
    contacts: prefilledContacts,
  } : undefined

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">New Title Agent</h1>
        {fromRequestId && (
          <span style={{
            fontSize: '0.8125rem',
            color: 'var(--color-gold)',
            fontWeight: 600,
            padding: '0.25rem 0.75rem',
            background: 'rgba(196,165,116,0.1)',
            borderRadius: '999px',
          }}>
            Pre-filled from request
          </span>
        )}
      </div>
      <div className="page-body">
        <div className="ats-card" style={{ maxWidth: '680px' }}>
          <AgentForm initial={initial} fromRequestId={fromRequestId} />
        </div>
      </div>
    </>
  )
}
