'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DeleteSessionButton } from './DeleteSessionButton'

type Session = {
  id: string
  session_date: string
  duration_minutes?: number
  status: string
  session_type?: string
  agents?: { name: string; agency_name?: string } | null
  session_analysis?: { summary?: string } | null
}

export function SessionsClient({ initialSessions }: { initialSessions: Session[] }) {
  const [sessions, setSessions] = useState(initialSessions)

  function removeSession(id: string) {
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  if (sessions.length === 0) {
    return (
      <div className="ats-card">
        <div className="empty-state">
          <p style={{ fontWeight: 600 }}>No sessions</p>
          <p style={{ fontSize: '0.875rem' }}>All sessions have been deleted.</p>
        </div>
      </div>
    )
  }

  return (
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
              {sessions.map(session => (
                <tr key={session.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(session.session_date).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{session.agents?.name ?? '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      {session.agents?.agency_name ?? ''}
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
                      {session.session_analysis?.summary ?? '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem' }}>
                      <Link href={`/sessions/${session.id}`} style={{ fontSize: '0.8125rem', color: 'var(--ats-blue)', textDecoration: 'none' }}>
                        View
                      </Link>
                      <DeleteSessionButton sessionId={session.id} onDeleted={() => removeSession(session.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="sessions-mobile">
        {sessions.map(session => {
          const agentName = session.agents?.name ?? '—'
          const agencyName = session.agents?.agency_name ?? ''
          const summary = session.session_analysis?.summary
          return (
            <div key={session.id} style={{ position: 'relative' }}>
              <Link href={`/sessions/${session.id}`} className="session-card-row">
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
              <div style={{ position: 'absolute', top: '0.75rem', right: '2rem' }} onClick={e => e.stopPropagation()}>
                <DeleteSessionButton sessionId={session.id} onDeleted={() => removeSession(session.id)} />
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
