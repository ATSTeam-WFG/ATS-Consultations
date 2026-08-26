'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ATS_SIZES = ['small', 'mid', 'large', 'enterprise']

export default function NewToolPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [atsSizeFit, setAtsSizeFit] = useState<string[]>([])
  const [source, setSource] = useState<'ats' | 'external'>('external')
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
      body: JSON.stringify({ ...form, ats_size_fit: atsSizeFit, source }),
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
          {/* Source toggle */}
          <div className="form-group">
            <label className="form-label">Source</label>
            <div style={{ display: 'flex', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)', width: 'fit-content' }}>
              {(['ats', 'external'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                    background: source === s ? 'var(--color-gold, #c4a574)' : 'transparent',
                    color: source === s ? '#fff' : 'var(--muted-foreground)',
                  }}
                >
                  {s === 'ats' ? 'Developed by ATS' : 'External Recommended'}
                </button>
              ))}
            </div>
          </div>

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
            <label className="form-label">Team Size</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {ATS_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  style={{
                    padding: '0.3rem 0.875rem',
                    borderRadius: '9999px',
                    fontSize: '0.8125rem',
                    fontWeight: atsSizeFit.includes(size) ? 600 : 500,
                    border: '1px solid',
                    borderColor: atsSizeFit.includes(size) ? 'var(--ats-indigo)' : 'var(--border)',
                    background: atsSizeFit.includes(size) ? 'var(--ats-indigo)' : 'transparent',
                    color: atsSizeFit.includes(size) ? '#fff' : 'var(--muted-foreground)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
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
