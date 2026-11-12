'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Inbox, User, Clock, CheckCircle, X, MapPin, Tag } from 'lucide-react'
import type { ConsultationRequest, TitleAgentCategory } from '@/lib/types'

const CATEGORY_COLORS: Record<TitleAgentCategory, string> = {
  UNICORN: '#7c3aed',
  DIAMOND: '#0ea5e9',
  GOLD: '#c4a574',
  SILVER: '#6b7280',
}

export default function RequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<ConsultationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissConfirm, setDismissConfirm] = useState<string | null>(null)
  const [dismissing, setDismissing] = useState<string | null>(null)
  const [approving, setApproving] = useState<string | null>(null)
  const [approveResults, setApproveResults] = useState<Record<string, { agentId: string } | { error: string }>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    const res = await fetch('/api/requests')
    const j = await res.json()
    setRequests(j.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function confirmDismiss(id: string) {
    setDismissing(id)
    await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'dismissed' }),
    })
    setRequests((prev) => prev.filter((r) => r.id !== id))
    setDismissing(null)
    setDismissConfirm(null)
  }

  async function handleApprove(id: string) {
    setApproving(id)
    try {
      const res = await fetch(`/api/requests/${id}/approve`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setApproveResults((prev) => ({ ...prev, [id]: { error: json.error ?? 'Approval failed' } }))
      } else {
        setApproveResults((prev) => ({ ...prev, [id]: { agentId: json.agent.id } }))
        setRequests((prev) => prev.filter((r) => r.id !== id))
      }
    } catch {
      setApproveResults((prev) => ({ ...prev, [id]: { error: 'Network error' } }))
    } finally {
      setApproving(null)
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Requests</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.125rem' }}>
            Consultation requests submitted via the public intake form
          </p>
        </div>
        <span style={{
          padding: '0.25rem 0.75rem',
          background: 'rgba(196,165,116,0.12)',
          color: 'var(--color-gold)',
          borderRadius: '999px',
          fontSize: '0.8125rem',
          fontWeight: 700,
        }}>
          {requests.length} pending
        </span>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : requests.length === 0 ? (
          <div className="ats-card">
            <div className="empty-state">
              <Inbox size={32} style={{ color: 'var(--muted-foreground)', margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 600 }}>No pending requests</p>
              <p style={{ fontSize: '0.875rem' }}>Requests submitted at <code>/request</code> will appear here.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {requests.map((req) => {
              const isExpanded = expanded.has(req.id)
              const confirmingDismiss = dismissConfirm === req.id
              return (
                <div key={req.id} className="ats-card" style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Agency name + category */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{req.agency_name}</h3>
                        <span style={{
                          padding: '0.125rem 0.625rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: CATEGORY_COLORS[req.category] + '18',
                          color: CATEGORY_COLORS[req.category],
                          letterSpacing: '0.04em',
                        }}>
                          {req.category}
                        </span>
                      </div>

                      {/* Rep */}
                      {(req.rep_name || req.rep_email) && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '0.375rem' }}>
                          Submitted by {[req.rep_name, req.rep_email].filter(Boolean).join(' · ')}
                        </div>
                      )}

                      {/* Meta row */}
                      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {req.region && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                            <MapPin size={13} />
                            <span>{req.region}</span>
                          </div>
                        )}
                        {req.requested_time && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                            <Clock size={13} />
                            <span>{req.requested_time}</span>
                          </div>
                        )}
                        {req.contacts && req.contacts.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                            <User size={13} />
                            <span>{req.contacts.map((c) => c.name || c.email).filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          Submitted {new Date(req.submitted_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Topics chips */}
                      {req.topics && req.topics.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.625rem' }}>
                          <Tag size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0, alignSelf: 'center' }} />
                          {req.topics.map((t) => (
                            <span
                              key={t}
                              style={{
                                padding: '0.125rem 0.5rem',
                                background: 'rgba(99,102,241,0.08)',
                                color: '#6366f1',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Situation excerpt */}
                      {req.situation && (
                        <div style={{ marginTop: '0.625rem' }}>
                          <p
                            style={{
                              fontSize: '0.8125rem',
                              color: 'var(--muted-foreground)',
                              margin: 0,
                              lineHeight: 1.5,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: isExpanded ? undefined : 2,
                              WebkitBoxOrient: 'vertical',
                            } as React.CSSProperties}
                          >
                            {req.situation}
                          </p>
                          {req.situation.length > 120 && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(req.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '2px 0',
                                fontSize: '0.75rem',
                                color: '#6366f1',
                                cursor: 'pointer',
                                fontWeight: 500,
                              }}
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0, flexDirection: 'column' }}>
                      {approveResults[req.id] && 'agentId' in approveResults[req.id] ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'flex-end' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#16a34a', fontWeight: 600 }}>
                            <CheckCircle size={14} />
                            Agent created
                          </div>
                          <button
                            type="button"
                            onClick={() => router.push(`/agents/${(approveResults[req.id] as { agentId: string }).agentId}`)}
                            style={{
                              padding: '0.25rem 0.625rem',
                              background: 'none',
                              border: '1px solid var(--border)',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              color: 'var(--muted-foreground)',
                              cursor: 'pointer',
                            }}
                          >
                            View Agent Profile →
                          </button>
                        </div>
                      ) : confirmingDismiss ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textAlign: 'right' }}>
                            Dismiss this request?
                          </span>
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <button
                              type="button"
                              onClick={() => setDismissConfirm(null)}
                              style={{
                                padding: '0.3rem 0.6rem',
                                background: 'none',
                                border: '1px solid var(--border)',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                color: 'var(--muted-foreground)',
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDismiss(req.id)}
                              disabled={dismissing === req.id}
                              style={{
                                padding: '0.3rem 0.6rem',
                                background: '#dc2626',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                color: '#fff',
                                cursor: dismissing === req.id ? 'not-allowed' : 'pointer',
                                opacity: dismissing === req.id ? 0.6 : 1,
                                fontWeight: 600,
                              }}
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {approveResults[req.id] && 'error' in approveResults[req.id] && (
                            <span style={{ fontSize: '0.75rem', color: '#dc2626', textAlign: 'right', maxWidth: '160px' }}>
                              {(approveResults[req.id] as { error: string }).error}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setDismissConfirm(req.id)}
                            title="Dismiss"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '0.375rem 0.75rem',
                              background: 'none',
                              border: '1px solid var(--border)',
                              borderRadius: '0.375rem',
                              fontSize: '0.8125rem',
                              color: 'var(--muted-foreground)',
                              cursor: 'pointer',
                            }}
                          >
                            <X size={13} />
                            Dismiss
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(req.id)}
                            disabled={approving === req.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '0.375rem 0.875rem',
                              background: approving === req.id ? 'rgba(22,163,74,0.5)' : '#16a34a',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              cursor: approving === req.id ? 'not-allowed' : 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <CheckCircle size={13} />
                            {approving === req.id ? 'Approving…' : 'Approve'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
