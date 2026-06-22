'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'unauthorized' ? 'You are not authorized to access this app.' : null
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
    } else {
      router.push('/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ats-bg)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--ats-surface)',
          border: '1px solid var(--ats-border)',
          borderRadius: '0.75rem',
          padding: '2.5rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0, filter: 'drop-shadow(0 0 6px rgba(129,140,248,0.6))' }}>
              <polygon points="6,1.5 9.9,3.75 9.9,8.25 6,10.5 2.1,8.25 2.1,3.75" stroke="#818cf8" strokeWidth="1.2" strokeLinejoin="round" opacity="0.9" />
              <circle cx="6" cy="6" r="1.6" fill="#818cf8" />
            </svg>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ats-text)', margin: 0, letterSpacing: '-0.03em' }}>
              ATS <span style={{ color: '#818cf8', fontWeight: 700 }}>Consultations</span>
            </h1>
          </div>
          <p style={{ fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(79, 70, 229, 0.55)', margin: 0 }}>
            White Glove Intelligence
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Work email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@wfgtitle.com"
              required
              className="form-input"
            />
          </div>

          {error && (
            <p style={{ fontSize: '0.875rem', color: 'var(--ats-danger)', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '0.625rem 1rem' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p style={{ fontSize: '0.75rem', color: 'var(--ats-text-3)', textAlign: 'center', margin: 0 }}>
            For authorized team members only
          </p>
        </form>
      </div>
    </div>
  )
}
