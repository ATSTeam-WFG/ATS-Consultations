'use client'

import { useState } from 'react'

interface EmailGateProps {
  onVerify: (email: string) => void
}

export function EmailGate({ onVerify }: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const hasValue = email.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.endsWith('@wfgtitle.com')) {
      setError('Must be a @wfgtitle.com address')
      return
    }
    setLoading(true)
    sessionStorage.setItem('wfg_email', trimmed)
    onVerify(trimmed)
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        background: '#0a0d14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '400px',
          gap: '0',
        }}
      >
        {/* WFG Logo */}
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-label="WFG logo" style={{ marginBottom: '1.5rem' }}>
          <polygon points="24,4 44,40 4,40" fill="none" stroke="#c9a45c" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="24,14 36,36 12,36" fill="#c9a45c" opacity="0.18" />
          <text x="24" y="35" textAnchor="middle" fill="#c9a45c" fontSize="11" fontWeight="800" fontFamily="Manrope, Inter, sans-serif">WFG</text>
        </svg>

        {/* Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-manrope)',
            fontSize: '2rem',
            fontWeight: 800,
            color: '#f4f5fa',
            margin: '0 0 0.5rem',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          ATS Intelligence Hub
        </h1>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--on-midnight-muted)',
            margin: '0 0 2.5rem',
            textAlign: 'center',
          }}
        >
          For WFG representatives
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError('')
            }}
            placeholder="you@wfgtitle.com"
            autoFocus
            autoComplete="email"
            style={{
              width: '100%',
              height: '56px',
              padding: '0 16px',
              border: '1px solid #1e2535',
              borderRadius: '10px',
              background: '#0f1520',
              color: '#f4f5fa',
              fontSize: '16px',
              fontFamily: 'var(--font-manrope)',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'box-shadow 0.15s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.4)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          />

          {error && (
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#f87171' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!hasValue || loading}
            style={{
              width: '100%',
              height: '48px',
              border: 'none',
              borderRadius: '8px',
              background: hasValue && !loading ? 'var(--ats-indigo)' : '#1e2535',
              color: hasValue && !loading ? '#ffffff' : '#4b5563',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: 'var(--font-manrope)',
              cursor: hasValue && !loading ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s, color 0.2s',
              letterSpacing: '0.01em',
            }}
          >
            {loading ? 'Entering…' : 'Enter Hub →'}
          </button>
        </form>
      </div>
    </div>
  )
}
