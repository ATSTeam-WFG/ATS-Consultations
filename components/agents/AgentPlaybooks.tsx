'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Plus, X, Search } from 'lucide-react'
import type { AgentPlaybook, Playbook } from '@/lib/types'

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: 'badge-low',
  medium: 'badge-medium',
  hard: 'badge-high',
}

interface Props {
  agentId: string
  initialPlaybooks: AgentPlaybook[]
  allPlaybooks: Playbook[]
}

export function AgentPlaybooks({ agentId, initialPlaybooks, allPlaybooks }: Props) {
  const [bookmarked, setBookmarked] = useState<AgentPlaybook[]>(initialPlaybooks)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const bookmarkedIds = new Set(bookmarked.map((b) => b.playbook_id))

  const available = allPlaybooks.filter(
    (p) => !bookmarkedIds.has(p.id) && p.title.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleAdd(playbook: Playbook) {
    setLoading(playbook.id)
    const optimistic: AgentPlaybook = {
      id: `temp-${playbook.id}`,
      agent_id: agentId,
      playbook_id: playbook.id,
      added_by: null,
      created_at: new Date().toISOString(),
      playbook,
    }
    setBookmarked((prev) => [optimistic, ...prev])
    setOpen(false)
    setSearch('')

    const res = await fetch(`/api/agents/${agentId}/playbooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playbook_id: playbook.id }),
    })
    const json = await res.json()
    if (res.ok) {
      setBookmarked((prev) => prev.map((b) => (b.id === optimistic.id ? json.data : b)))
    } else {
      setBookmarked((prev) => prev.filter((b) => b.id !== optimistic.id))
    }
    setLoading(null)
  }

  async function handleRemove(bookmark: AgentPlaybook) {
    setBookmarked((prev) => prev.filter((b) => b.playbook_id !== bookmark.playbook_id))
    await fetch(`/api/agents/${agentId}/playbooks/${bookmark.playbook_id}`, { method: 'DELETE' })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Playbooks ({bookmarked.length})</h2>
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.8125rem' }}
            onClick={() => setOpen((v) => !v)}
          >
            <Plus size={14} />
            Add Playbook
          </button>

          {open && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 0.5rem)',
              width: '280px',
              background: 'var(--ats-surface)',
              border: '1px solid var(--ats-border)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 50,
            }}>
              <div style={{ padding: '0.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ats-text-3)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '1.75rem', fontSize: '0.8125rem' }}
                    placeholder="Search playbooks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {available.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--ats-text-3)' }}>
                    {search ? 'No matches' : 'All playbooks already added'}
                  </div>
                ) : (
                  available.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleAdd(p)}
                      disabled={loading === p.id}
                      style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '0.25rem',
                        padding: '0.625rem 0.75rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--ats-border)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ats-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--ats-text)' }}>{p.title}</span>
                      {p.difficulty && (
                        <span className={`badge ${DIFFICULTY_BADGE[p.difficulty] ?? ''}`} style={{ fontSize: '0.6875rem' }}>
                          {p.difficulty}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {bookmarked.length === 0 ? (
        <div className="ats-card">
          <div className="empty-state">
            <BookOpen size={24} style={{ opacity: 0.4 }} />
            <p style={{ fontSize: '0.875rem' }}>No playbooks associated yet. Add one to track what you offered this agent.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {bookmarked.map((b) => {
            const pb = b.playbook
            if (!pb) return null
            return (
              <div
                key={b.id}
                className="ats-card"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', gap: '1rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <BookOpen size={16} style={{ color: 'var(--ats-indigo)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <Link
                      href={`/playbooks/${pb.id}`}
                      style={{ fontWeight: 500, fontSize: '0.875rem', textDecoration: 'none', color: 'var(--ats-text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {pb.title}
                    </Link>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      {pb.difficulty && (
                        <span className={`badge ${DIFFICULTY_BADGE[pb.difficulty] ?? ''}`} style={{ fontSize: '0.6875rem' }}>
                          {pb.difficulty}
                        </span>
                      )}
                      <span className={`badge badge-${pb.status}`} style={{ fontSize: '0.6875rem' }}>{pb.status}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(b)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ats-text-3)', padding: '0.25rem', display: 'flex', flexShrink: 0 }}
                  title="Remove"
                  aria-label="Remove playbook"
                >
                  <X size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
