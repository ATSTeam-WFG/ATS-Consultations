'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, AlertCircle } from 'lucide-react'

interface AnalyzeTriggerProps {
  sessionId: string
  hasTranscript: boolean
}

export function AnalyzeTrigger({ sessionId, hasTranscript }: AnalyzeTriggerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/sessions/${sessionId}/analyze`, { method: 'POST' })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Analysis failed')
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div
      className="ats-card"
      style={{
        border: '2px dashed var(--ats-indigo)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem',
        gap: '0.75rem',
        textAlign: 'center',
      }}
    >
      <Sparkles size={28} style={{ color: 'var(--ats-indigo)' }} />
      <div>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--ats-text)' }}>Process with AI</div>
        <p style={{ fontSize: '0.875rem', color: 'var(--ats-text-2)' }}>
          {hasTranscript
            ? 'Run Claude analysis to extract pain points, recommend tools, and generate a roadmap.'
            : 'No transcript found. Add session notes or upload a transcript file for best results.'}
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--ats-danger)', fontSize: '0.875rem' }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="btn-primary"
        style={{ padding: '0.625rem 1.5rem' }}
      >
        {loading && <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />}
        {loading ? 'Analyzing...' : 'Analyze with Claude'}
      </button>
    </div>
  )
}
