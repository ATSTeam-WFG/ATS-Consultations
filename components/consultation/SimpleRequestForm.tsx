'use client'

import { useState } from 'react'
import { SuccessState } from './SuccessState'

interface SimpleRequestFormProps {
  email: string
}

type Category = 'SILVER' | 'GOLD' | 'DIAMOND' | 'UNICORN'

const CATEGORIES: Category[] = ['SILVER', 'GOLD', 'DIAMOND', 'UNICORN']

const CATEGORY_COLORS: Record<Category, string> = {
  SILVER: '#6b7280',
  GOLD: '#c9a45c',
  DIAMOND: '#0ea5e9',
  UNICORN: '#7c3aed',
}

export function SimpleRequestForm({ email }: SimpleRequestFormProps) {
  const [agencyName, setAgencyName] = useState('')
  const [category, setCategory] = useState<Category | null>(null)
  const [repName, setRepName] = useState('')
  const [repEmail, setRepEmail] = useState(email)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agencyName.trim()) {
      setError('Agency Name is required.')
      return
    }
    if (!category) {
      setError('Please select an Agency Level.')
      return
    }
    if (!repName.trim()) {
      setError('Your Name is required.')
      return
    }
    if (!repEmail.trim()) {
      setError('Your Email is required.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_name: agencyName.trim(),
          category,
          rep_name: repName.trim(),
          rep_email: repEmail.trim(),
          request_source: 'stepper',
          contacts: [],
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Submission failed')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          overflowY: 'auto',
        }}
      >
        <SuccessState agencyName={agencyName} repName={repName} />
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f6f7fb',
        padding: '2rem 1.5rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e4e8f0',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '640px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          animation: 'form-card-in 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both',
        }}
      >
        {/* Gold accent stripe at top */}
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, var(--ats-indigo) 0%, var(--wfg-gold) 100%)',
          }}
        />

        <div style={{ padding: '2.5rem 2.75rem' }}>
        <h2
          style={{
            fontFamily: 'var(--font-manrope)',
            fontWeight: 800,
            fontSize: '1.625rem',
            color: '#111827',
            margin: '0 0 0.375rem',
            letterSpacing: '-0.02em',
          }}
        >
          Request a Consultation
        </h2>
        <p
          style={{
            fontSize: '0.9375rem',
            color: '#6b7280',
            lineHeight: 1.6,
            margin: '0 0 2.25rem',
          }}
        >
          Fill in your details and our team will reach out within 1 business day.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.375rem' }}>
          {/* Agency Name */}
          <div>
            <label className="consultation-label" htmlFor="sf-agency-name">
              Agency Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="sf-agency-name"
              type="text"
              className="consultation-input"
              placeholder="e.g. Smith Title &amp; Escrow"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              required
            />
          </div>

          {/* Agency Level */}
          <div>
            <label className="consultation-label">Agency Level <span style={{ color: '#dc2626' }}>*</span></label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                marginTop: '0.375rem',
              }}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat
                const color = CATEGORY_COLORS[cat]
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 6px',
                      border: `1.5px solid ${isSelected ? color : '#e4e8f0'}`,
                      borderRadius: '8px',
                      background: isSelected ? `${color}18` : 'transparent',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-manrope)',
                      fontWeight: 700,
                      fontSize: '11px',
                      letterSpacing: '0.05em',
                      color: isSelected ? color : '#9ca3af',
                      transition: 'all 0.15s',
                      minHeight: '44px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = color
                        e.currentTarget.style.color = color
                        e.currentTarget.style.background = `${color}10`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#e4e8f0'
                        e.currentTarget.style.color = '#9ca3af'
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rep Name */}
          <div>
            <label className="consultation-label" htmlFor="sf-rep-name">
              Your Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="sf-rep-name"
              type="text"
              className="consultation-input"
              placeholder="First Last"
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              required
            />
          </div>

          {/* Rep Email */}
          <div>
            <label className="consultation-label" htmlFor="sf-rep-email">
              Your Email <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="sf-rep-email"
              type="email"
              className="consultation-input"
              placeholder="you@wfgtitle.com"
              value={repEmail}
              onChange={(e) => setRepEmail(e.target.value)}
              required
            />
          </div>

          {error && (
            <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '0.25rem' }}
          >
            {loading ? 'Submitting…' : 'Submit Request →'}
          </button>
        </form>
        </div>{/* /inner padding div */}
      </div>
    </div>
  )
}
