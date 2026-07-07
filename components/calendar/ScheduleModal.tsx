'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface AgentOption {
  id: string
  name: string
  agency_name?: string | null
}

interface ExistingSession {
  id: string
  session_date: string
  agent_id: string
  agent_name: string
}

interface ScheduleModalProps {
  date: string
  agents: AgentOption[]
  onClose: () => void
  onScheduled: (session: { id: string; agent_id: string; session_date: string; status: string; agents?: { name: string } }) => void
  existingSession?: ExistingSession | null
}

export function ScheduleModal({ date, agents, onClose, onScheduled, existingSession }: ScheduleModalProps) {
  const isEdit = !!existingSession

  const [agentId, setAgentId] = useState(existingSession?.agent_id ?? agents[0]?.id ?? '')
  const [selectedDate, setSelectedDate] = useState(existingSession?.session_date ?? date)
  const [notes, setNotes] = useState('')
  const [sessionType, setSessionType] = useState('zoom_call')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agentId) { setError('Please select a title agent'); return }
    setLoading(true)
    setError(null)

    if (isEdit && existingSession) {
      const res = await fetch(`/api/sessions/${existingSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_date: selectedDate }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong')
        setLoading(false)
        return
      }
      onScheduled({
        id: existingSession.id,
        agent_id: existingSession.agent_id,
        session_date: selectedDate,
        status: 'scheduled',
        agents: { name: existingSession.agent_name },
      })
    } else {
      const res = await fetch('/api/sessions/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, session_date: selectedDate, notes, session_type: sessionType }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong')
        setLoading(false)
        return
      }
      onScheduled(json.data)
    }
    setLoading(false)
  }

  const displayDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.45)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{isEdit ? 'Reschedule Session' : 'Schedule Meeting'}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.125rem' }}>{displayDate}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '0.25rem' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Title Agent *</label>
            {isEdit ? (
              <div style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem', background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                {existingSession!.agent_name}
              </div>
            ) : (
              <select
                className="form-input"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                required
                style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem', background: 'var(--background)', cursor: 'pointer' }}
              >
                <option value="">Select agent...</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.agency_name ? ` — ${a.agency_name}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {isEdit && (
            <div className="form-group">
              <label className="form-label">New date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem', background: 'var(--background)', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {!isEdit && (
            <>
              <div className="form-group">
                <label className="form-label">Meeting type</label>
                <select
                  className="form-input"
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem', background: 'var(--background)', cursor: 'pointer' }}
                >
                  <option value="zoom_call">Zoom Call</option>
                  <option value="walk_in">Walk In</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea
                  className="form-input"
                  style={{ resize: 'vertical', minHeight: '72px', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Topics to discuss, prep notes..."
                />
              </div>
            </>
          )}

          {error && <p style={{ fontSize: '0.875rem', color: 'var(--ats-danger)' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '0.5rem 1rem', background: 'var(--secondary)', color: 'var(--secondary-foreground)', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '0.5rem 1.25rem', background: 'var(--ats-indigo)', color: '#fff', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (isEdit ? 'Rescheduling...' : 'Scheduling...') : (isEdit ? 'Reschedule' : 'Schedule')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
