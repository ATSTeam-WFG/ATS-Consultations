'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ATS_SIZES = ['small', 'mid', 'large', 'enterprise']

export default function NewToolPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [atsSizeFit, setAtsSizeFit] = useState<string[]>([])
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    website_url: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleSize(size: string) {
    setAtsSizeFit((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, ats_size_fit: atsSizeFit }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
    } else {
      router.push('/tools')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Add Tool</h1>
      </div>
      <div className="page-body">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Tool name *</label>
              <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="e.g. Bullhorn ATS" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-input" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. CRM, ATS, Analytics" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" style={{ resize: 'vertical', minHeight: '80px' }} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What does this tool do?" />
          </div>

          <div className="form-group">
            <label className="form-label">ATS Size Fit</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {ATS_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    border: `1px solid ${atsSizeFit.includes(size) ? 'var(--ats-blue)' : 'var(--border)'}`,
                    background: atsSizeFit.includes(size) ? 'var(--ats-blue-light)' : 'transparent',
                    color: atsSizeFit.includes(size) ? 'var(--ats-blue-dark)' : 'var(--muted-foreground)',
                    cursor: 'pointer',
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Website URL</label>
            <input className="form-input" type="url" value={form.website_url} onChange={(e) => set('website_url', e.target.value)} placeholder="https://..." />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" style={{ resize: 'vertical', minHeight: '60px' }} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any internal notes..." />
          </div>

          {error && <p style={{ fontSize: '0.875rem', color: 'var(--ats-danger)' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" disabled={loading} style={{ padding: '0.5rem 1.25rem', background: 'var(--ats-blue)', color: '#fff', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving...' : 'Add tool'}
            </button>
            <button type="button" onClick={() => router.back()} style={{ padding: '0.5rem 1.25rem', background: 'var(--secondary)', color: 'var(--secondary-foreground)', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
