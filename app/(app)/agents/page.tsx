import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import type { TitleAgentCategory } from '@/lib/types'

const CATEGORY_BADGE: Record<TitleAgentCategory, string> = {
  UNICORN: 'badge-unicorn',
  DIAMOND: 'badge-diamond',
  GOLD: 'badge-gold',
  SILVER: 'badge-silver',
}

export default async function AgentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = createServiceRoleClient()
  const { data: agents } = await db
    .from('agents')
    .select('*, sessions(count)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Title Agents</h1>
        <Link
          href="/agents/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            background: 'var(--ats-blue)',
            color: '#fff',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <Plus size={16} />
          New Title Agent
        </Link>
      </div>

      <div className="page-body">
        {!agents || agents.length === 0 ? (
          <div className="ats-card">
            <div className="empty-state">
              <p style={{ fontWeight: 600 }}>No Title Agents yet</p>
              <p style={{ fontSize: '0.875rem' }}>Add your first Title Agent to start logging consultation sessions.</p>
              <Link
                href="/agents/new"
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'var(--ats-blue)',
                  color: '#fff',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Add Title Agent
              </Link>
            </div>
          </div>
        ) : (
          <div className="ats-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="ats-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Agency</th>
                  <th>Category</th>
                  <th>WFG Rep</th>
                  <th>Contacts</th>
                  <th>Sessions</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent: {
                  id: string
                  name: string
                  agency_name?: string
                  category?: TitleAgentCategory | null
                  wfg_rep?: string | null
                  contacts?: unknown[]
                  sessions?: { count: number }[]
                }) => (
                  <tr key={agent.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div
                          style={{
                            width: '1.875rem',
                            height: '1.875rem',
                            borderRadius: '50%',
                            background: 'var(--ats-blue-light)',
                            color: 'var(--ats-blue-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            flexShrink: 0,
                          }}
                        >
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <Link
                          href={`/agents/${agent.id}`}
                          style={{ fontWeight: 500, textDecoration: 'none', color: 'var(--foreground)' }}
                        >
                          {agent.name}
                        </Link>
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted-foreground)' }}>{agent.agency_name ?? '—'}</td>
                    <td>
                      {agent.category ? (
                        <span className={`badge ${CATEGORY_BADGE[agent.category]}`}>
                          {agent.category}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ color: 'var(--muted-foreground)' }}>{agent.wfg_rep ?? '—'}</td>
                    <td style={{ color: 'var(--muted-foreground)' }}>
                      {agent.contacts?.length ?? 0}
                    </td>
                    <td>
                      <span className="badge badge-processed">
                        {(agent.sessions as unknown as { count: number }[])?.[0]?.count ?? 0}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/agents/${agent.id}`}
                        style={{ fontSize: '0.8125rem', color: 'var(--ats-blue)', textDecoration: 'none' }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
