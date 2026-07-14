'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeleteSessionButtonProps {
  sessionId: string
  onDeleted?: () => void
  redirectAfter?: boolean
}

export function DeleteSessionButton({ sessionId, onDeleted, redirectAfter }: DeleteSessionButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      if (redirectAfter) {
        router.push('/sessions')
      } else {
        onDeleted?.()
      }
    } catch {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Sure?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#fff',
            background: 'var(--ats-danger, #ef4444)',
            border: 'none',
            borderRadius: '0.25rem',
            padding: '0.125rem 0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '…' : 'Yes'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          style={{
            fontSize: '0.8125rem',
            color: 'var(--muted-foreground)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.125rem 0.25rem',
          }}
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        fontSize: '0.8125rem',
        fontWeight: 500,
        color: 'var(--ats-danger, #ef4444)',
        background: 'none',
        border: '1px solid var(--ats-danger, #ef4444)',
        borderRadius: '0.25rem',
        padding: '0.125rem 0.5rem',
        cursor: 'pointer',
      }}
    >
      Delete
    </button>
  )
}
