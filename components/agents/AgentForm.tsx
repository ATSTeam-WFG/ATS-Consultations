'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Agent, Contact, TitleAgentCategory } from '@/lib/types'

interface AgentFormProps {
  initial?: Partial<Agent>
  agentId?: string
}

const CATEGORIES: TitleAgentCategory[] = ['UNICORN', 'DIAMOND', 'GOLD', 'SILVER']

export function AgentForm({ initial, agentId }: AgentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    agency_name: initial?.agency_name ?? '',
    location: initial?.location ?? '',
    category: initial?.category ?? '' as TitleAgentCategory | '',
    wfg_rep: initial?.wfg_rep ?? '',
    notes: initial?.notes ?? '',
  })
  const [contacts, setContacts] = useState<Contact[]>(initial?.contacts ?? [])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addContact() {
    setContacts((prev) => [...prev, { name: '', email: '' }])
  }

  function updateContact(index: number, field: keyof Contact, value: string) {
    setContacts((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  function removeContact(index: number) {
    setContacts((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const url = agentId ? `/api/agents/${agentId}` : '/api/agents'
    const method = agentId ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        name: form.agency_name,
        category: form.category || null,
        contacts,
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
    } else {
      router.push(`/agents/${json.data.id}`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Agency Name *</label>
          <input
            className="form-input"
            value={form.agency_name}
            onChange={(e) => set('agency_name', e.target.value)}
            required
            placeholder="e.g. XYZ Closers"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input
            className="form-input"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="City, State"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Category *</label>
          <select
            className="form-input"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
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
            <option value="">Select category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">WFG Rep</label>
          <input
            className="form-input"
            value={form.wfg_rep}
            onChange={(e) => set('wfg_rep', e.target.value)}
            placeholder="Internal WFG rep who made the connection"
          />
        </div>
      </div>

      {/* Contacts */}
      <div className="form-group">
        <label className="form-label">Contacts</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {contacts.map((contact, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <input
                className="form-input"
                value={contact.name}
                onChange={(e) => updateContact(i, 'name', e.target.value)}
                placeholder="Name"
              />
              <input
                className="form-input"
                type="email"
                value={contact.email}
                onChange={(e) => updateContact(i, 'email', e.target.value)}
                placeholder="Email"
              />
              <button
                type="button"
                onClick={() => removeContact(i)}
                style={{
                  padding: '0.375rem 0.625rem',
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  color: 'var(--muted-foreground)',
                  fontSize: '0.875rem',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addContact}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: 'none',
              padding: '0.25rem 0',
              fontSize: '0.875rem',
              color: 'var(--ats-blue)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            + Add contact
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea
          className="form-input"
          style={{ resize: 'vertical', minHeight: '80px' }}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Any context about this Title Agent..."
        />
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
          {loading ? 'Saving...' : agentId ? 'Save changes' : 'Create Title Agent'}
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
