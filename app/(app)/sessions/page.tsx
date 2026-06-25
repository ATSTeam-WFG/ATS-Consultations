import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'

export default async function SessionsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = createServiceRoleClient()
  const { data: sessions } = await db
    .from('sessions')
    .select('*, agents(name, agency_name), session_analysis(summary)')
    .order('created_at', { ascending: false })

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Sessions</h1>
        <Link
          href="/sessions/new"
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
          <span className="page-header-action-label">Log session</span>
        </Link>
      </div>

      <div className="page-body">
        {!sessions || sessions.length === 0 ? (
          <div className="ats-card">
            <div className="empty-state">
              <p style={{ fontWeight: 600 }}>No sessions yet</p>
              <p style={{ fontSize: '0.875rem' }}>Start logging consultation sessions to build your intelligence database.</p>
              <Link
                href="/sessions/new"
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
                Log first session
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="sessions-desktop ats-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-scroll">
              <table className="ats-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Agent</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Summary</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session: Record<string, unknown> & { id: string; session_date: string; duration_minutes?: number; status: string; session_type?: string; agents?: { name: string; agency_name?: string } | null; session_analysis?: { summary?: string } | null }) => (
                    <tr key={session.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(session.session_date).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {(session.agents as { name: string } | null)?.name ?? '—'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          {(session.agents as { agency_name?: string } | null)?.agency_name ?? ''}
                        </div>
                      </td>
                      <td style={{ color: 'var(--muted-foreground)' }}>
                        {session.duration_minutes ? `${session.duration_minutes}min` : '—'}
                      </td>
                      <td>
                        <span className={`badge badge-${session.status}`}>{session.status}</span>
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                          {(session.session_analysis as { summary?: string } | null)?.summary ?? '—'}
                        </div>
                      </td>
                      <td>
                        <Link href={`/sessions/${session.id}`} style={{ fontSize: '0.8125rem', color: 'var(--ats-blue)', textDecoration: 'none' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Mobile card list */}
            <div className="sessions-mobile">
              {sessions.map((session: Record<string, unknown> & { id: string; session_date: string; duration_minutes?: number; status: string; session_type?: string; agents?: { name: string; agency_name?: string } | null; session_analysis?: { summary?: string } | null }) => {
                const agentName = (session.agents as { name: string } | null)?.name ?? '—'
                const agencyName = (session.agents as { agency_name?: string } | null)?.agency_name ?? ''
                const summary = (session.session_analysis as { summary?: string } | null)?.summary
                return (
                  <Link key={session.id} href={`/sessions/${session.id}`} className="session-card-row">
                    <div className="session-card-row__left">
                      <div className="session-card-row__date">
                        {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="session-card-row__year">
                        {new Date(session.session_date).getFullYear()}
                      </div>
                    </div>
                    <div className="session-card-row__body">
                      <div className="session-card-row__agent">{agentName}</div>
                      {agencyName && <div className="session-card-row__agency">{agencyName}</div>}
                      {summary && <div className="session-card-row__summary">{summary}</div>}
                      <div className="session-card-row__meta">
                        <span className={`badge badge-${session.status}`}>{session.status}</span>
                        {session.duration_minutes && (
                          <span className="session-card-row__duration">{session.duration_minutes}min</span>
                        )}
                      </div>
                    </div>
                    <div className="session-card-row__arrow">›</div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}
