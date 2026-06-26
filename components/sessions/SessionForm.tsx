'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RecordButton } from './RecordButton'

interface AgentOption {
  id: string
  name: string
  agency_name?: string | null
}

interface SessionFormProps {
  agents: AgentOption[]
  defaultAgentId?: string
}

export function SessionForm({ agents, defaultAgentId }: SessionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null)
  const [showAnalyzeBanner, setShowAnalyzeBanner] = useState(false)
  const [form, setForm] = useState({
    agent_id: defaultAgentId ?? (agents[0]?.id ?? ''),
    session_type: 'zoom_call',
    rep_name: '',
    session_date: new Date().toISOString().split('T')[0],
    duration_minutes: '',
    notes: '',
    transcript_text: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleTranscriptFill(text: string) {
    setForm((prev) => ({ ...prev, transcript_text: prev.transcript_text ? prev.transcript_text + '\n\n' + text : text }))
    const today = new Date().toISOString().split('T')[0]
    if (form.session_date <= today) {
      setShowAnalyzeBanner(true)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      ...form,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
    }

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    const sessionId = json.data.id

    // Upload transcript file if provided
    if (transcriptFile) {
      const fd = new FormData()
      fd.append('transcript', transcriptFile)
      await fetch(`/api/sessions/${sessionId}/upload`, { method: 'POST', body: fd })
    }

    router.push(`/sessions/${sessionId}`)
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Title Agent *</label>
          <select
            className="form-input"
            value={form.agent_id}
            onChange={(e) => set('agent_id', e.target.value)}
            required
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              background: 'var(--background)',
              cursor: 'pointer',
            }}
          >
            <option value="">Select Title Agent...</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}{a.agency_name ? ` — ${a.agency_name}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Session Type *</label>
          <select
            className="form-input"
            value={form.session_type}
            onChange={(e) => set('session_type', e.target.value)}
            required
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              background: 'var(--background)',
              cursor: 'pointer',
            }}
          >
            <option value="zoom_call">Zoom Call</option>
            <option value="walk_in">Walk In</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Session date *</label>
          <input
            className="form-input"
            type="date"
            value={form.session_date}
            onChange={(e) => set('session_date', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Duration (minutes)</label>
          <input
            className="form-input"
            type="number"
            min={1}
            value={form.duration_minutes}
            onChange={(e) => set('duration_minutes', e.target.value)}
            placeholder="e.g. 60"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Rep name</label>
          <input
            className="form-input"
            value={form.rep_name}
            onChange={(e) => set('rep_name', e.target.value)}
            placeholder="Consulting rep's name"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Session notes</label>
        <textarea
          className="form-input"
          style={{ resize: 'vertical', minHeight: '80px' }}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Key topics, observations, action items..."
        />
      </div>

      <div className="form-group">
        <label className="form-label">Transcript text</label>
        <textarea
          className="form-input"
          style={{ resize: 'vertical', minHeight: '120px' }}
          value={form.transcript_text}
          onChange={(e) => {
            set('transcript_text', e.target.value)
            if (e.target.value && form.session_date <= new Date().toISOString().split('T')[0]) {
              setShowAnalyzeBanner(true)
            }
          }}
          placeholder="Paste transcript here, or record / upload a file below..."
        />
      </div>

      <div className="form-group">
        <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
          Voice recording
        </label>
        <RecordButton onTranscript={handleTranscriptFill} />
        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.375rem' }}>
          Speak during or after a session — transcript auto-fills above.
        </p>
      </div>

      {showAnalyzeBanner && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'var(--ats-indigo-light)',
          border: '1px solid var(--ats-indigo)',
          borderRadius: '0.5rem',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--ats-indigo-dark)', fontWeight: 500 }}>
            Transcript ready — analyze now?
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.375rem 0.875rem',
                background: 'var(--ats-indigo)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Create &amp; Analyze
            </button>
            <button
              type="button"
              onClick={() => setShowAnalyzeBanner(false)}
              style={{
                padding: '0.375rem 0.625rem',
                background: 'none',
                border: '1px solid var(--ats-indigo)',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                color: 'var(--ats-indigo)',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Upload transcript file (.txt)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.4rem 0.875rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              background: 'var(--secondary)',
              color: 'var(--foreground)',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Choose file
            <input
              type="file"
              accept=".txt,.md,.csv"
              onChange={(e) => setTranscriptFile(e.target.files?.[0] ?? null)}
              style={{ display: 'none' }}
            />
          </label>
          <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
            {transcriptFile ? transcriptFile.name : 'No file chosen'}
          </span>
          {transcriptFile && (
            <button
              type="button"
              onClick={() => setTranscriptFile(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted-foreground)',
                fontSize: '1rem',
                lineHeight: 1,
                padding: '0 0.25rem',
              }}
              aria-label="Remove file"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {error && (
        <p style={{ fontSize: '0.875rem', color: 'var(--ats-danger)' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.5rem 1.25rem',
            background: 'var(--ats-blue)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Creating...' : 'Create session'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            padding: '0.5rem 1.25rem',
            background: 'var(--secondary)',
            color: 'var(--secondary-foreground)',
            border: '1px solid var(--border)',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
