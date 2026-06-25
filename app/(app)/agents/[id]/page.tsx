import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase'
import { Pencil, CalendarDays } from 'lucide-react'
import { AgentPlaybooks } from '@/components/agents/AgentPlaybooks'
import type { Session, TitleAgentCategory, Contact, AgentPlaybook, Playbook } from '@/lib/types'

const CATEGORY_BADGE: Record<TitleAgentCategory, string> = {
  UNICORN: 'badge-unicorn',
  DIAMOND: 'badge-diamond',
  GOLD: 'badge-gold',
  SILVER: 'badge-silver',
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = createServiceRoleClient()
  const { data: agent, error } = await db
    .from('agents')
    .select('*, sessions(*, session_analysis(summary, problem_tags))')
    .eq('id', id)
    .single()

  if (error || !agent) notFound()

  const sessions: Session[] = agent.sessions ?? []
  const contacts: Contact[] = agent.contacts ?? []

  const [{ data: bookmarkedPlaybooks }, { data: allPlaybooks }] = await Promise.all([
    db.from('agent_playbooks').select('*, playbook:playbooks(*)').eq('agent_id', id).order('created_at', { ascending: false }),
    db.from('playbooks').select('*').eq('status', 'published').order('title'),
  ])

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <Link
            href="/agents"
            style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', textDecoration: 'none', flexShrink: 0 }}
          >
            Agents
          </Link>
          <span style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}>/</span>
          <h1 className="page-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</h1>
        </div>
        <Link
          href={`/agents/${id}/edit`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            border: '1px solid var(--border)',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            color: 'var(--foreground)',
          }}
        >
          <Pencil size={14} />
          Edit
        </Link>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Profile card */}
        <div className="ats-card profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Agency</div>
            <div style={{ fontWeight: 500 }}>{agent.agency_name}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Category</div>
            <div>
              {agent.category ? (
                <span className={`badge ${CATEGORY_BADGE[agent.category as TitleAgentCategory]}`}>
                  {agent.category}
                </span>
              ) : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>WFG Rep</div>
            <div style={{ fontWeight: 500 }}>{agent.wfg_rep ?? '—'}</div>
          </div>
          {agent.location && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Location</div>
              <div style={{ fontWeight: 500 }}>{agent.location}</div>
            </div>
          )}
          {agent.email && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Email</div>
              <div style={{ fontWeight: 500 }}>{agent.email}</div>
            </div>
          )}
          {agent.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Notes</div>
              <div style={{ fontSize: '0.875rem' }}>{agent.notes}</div>
            </div>
          )}
        </div>

        {/* Contacts */}
        {contacts.length > 0 && (
          <div className="ats-card">
            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Contacts ({contacts.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {contacts.map((contact, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 500 }}>{contact.name}</span>
                  {contact.email && (
                    <span style={{ color: 'var(--muted-foreground)' }}>{contact.email}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sessions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Sessions ({sessions.length})</h2>
            <Link
              href={`/sessions/new?agent=${id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.875rem',
                background: 'var(--ats-blue)',
                color: '#fff',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <CalendarDays size={14} />
              Log session
            </Link>
          </div>

          {sessions.length === 0 ? (
            <div className="ats-card">
              <div className="empty-state">
                <p style={{ fontSize: '0.875rem' }}>No sessions logged for this Title Agent yet.</p>
              </div>
            </div>
          ) : (
            <div className="ats-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-scroll">
              <table className="ats-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Summary</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>{new Date(session.session_date).toLocaleDateString()}</td>
                      <td style={{ color: 'var(--muted-foreground)' }}>
                        {session.session_type === 'walk_in' ? 'Walk In' : 'Zoom Call'}
                      </td>
                      <td style={{ color: 'var(--muted-foreground)' }}>
                        {session.duration_minutes ? `${session.duration_minutes}min` : '—'}
                      </td>
                      <td>
                        <span className={`badge badge-${session.status}`}>
                          {session.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--muted-foreground)', maxWidth: '300px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {(session as unknown as { session_analysis?: { summary?: string } }).session_analysis?.summary ?? '—'}
                        </div>
                      </td>
                      <td>
                        <Link
                          href={`/sessions/${session.id}`}
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
            </div>
          )}
        </div>
        {/* Playbook bookmarks */}
        <AgentPlaybooks
          agentId={id}
          initialPlaybooks={(bookmarkedPlaybooks ?? []) as AgentPlaybook[]}
          allPlaybooks={(allPlaybooks ?? []) as Playbook[]}
        />
      </div>
    </>
  )
}
