'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import type { IntakeQuestion } from '@/lib/types'

const TYPE_LABELS: Record<IntakeQuestion['type'], string> = {
  choice: 'Single choice',
  multiselect: 'Multi-select',
  text: 'Text',
  contact: 'Contact',
}

interface EditFormState {
  title: string
  subtitle: string
  options: { label: string; value: string }[]
  max_select: string
  enabled: boolean
}

function defaultForm(q: IntakeQuestion): EditFormState {
  return {
    title: q.title,
    subtitle: q.subtitle ?? '',
    options: q.options ?? [],
    max_select: q.max_select?.toString() ?? '',
    enabled: q.enabled,
  }
}

export function IntakeQuestionsEditor({ initialQuestions }: { initialQuestions: IntakeQuestion[] }) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMove(id: string, direction: 'up' | 'down') {
    const idx = questions.findIndex(q => q.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === questions.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const newQuestions = [...questions]
    const a = { ...newQuestions[idx], display_order: newQuestions[swapIdx].display_order }
    const b = { ...newQuestions[swapIdx], display_order: newQuestions[idx].display_order }
    newQuestions[idx] = a
    newQuestions[swapIdx] = b
    newQuestions.sort((x, y) => x.display_order - y.display_order)
    setQuestions(newQuestions)

    await Promise.all([
      fetch(`/api/settings/intake-questions/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: a.display_order }),
      }),
      fetch(`/api/settings/intake-questions/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: b.display_order }),
      }),
    ])
  }

  async function handleToggleEnabled(q: IntakeQuestion) {
    const updated = { ...q, enabled: !q.enabled }
    setQuestions(prev => prev.map(x => x.id === q.id ? updated : x))
    await fetch(`/api/settings/intake-questions/${q.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: updated.enabled }),
    })
  }

  function startEdit(q: IntakeQuestion) {
    setEditingId(q.id)
    setEditForm(defaultForm(q))
    setError(null)
  }

  async function handleSave(q: IntakeQuestion) {
    if (!editForm) return
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/settings/intake-questions/${q.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editForm.title,
        subtitle: editForm.subtitle || null,
        options: (q.type === 'choice' || q.type === 'multiselect') ? editForm.options : null,
        max_select: editForm.max_select ? parseInt(editForm.max_select) : null,
        enabled: editForm.enabled,
      }),
    })
    if (res.ok) {
      const updated: IntakeQuestion = await res.json()
      setQuestions(prev => prev.map(x => x.id === updated.id ? updated : x))
      setEditingId(null)
      setEditForm(null)
    } else {
      const json = await res.json()
      setError(json.error ?? 'Failed to save')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this question? This cannot be undone.')) return
    const res = await fetch(`/api/settings/intake-questions/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      setQuestions(prev => prev.filter(q => q.id !== id))
    }
  }

  function addOption() {
    setEditForm(prev => prev ? { ...prev, options: [...prev.options, { label: '', value: '' }] } : prev)
  }

  function updateOption(i: number, field: 'label' | 'value', val: string) {
    setEditForm(prev => {
      if (!prev) return prev
      const options = [...prev.options]
      options[i] = { ...options[i], [field]: val }
      return { ...prev, options }
    })
  }

  function removeOption(i: number) {
    setEditForm(prev => prev ? { ...prev, options: prev.options.filter((_, idx) => idx !== i) } : prev)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {error && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--ats-danger)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {questions.map((q, idx) => {
        const isEditing = editingId === q.id

        return (
          <div key={q.id} className="ats-card" style={{ padding: '1rem', opacity: q.enabled ? 1 : 0.6 }}>
            {/* Row header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Reorder buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
                <button
                  onClick={() => handleMove(q.id, 'up')}
                  disabled={idx === 0}
                  style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: 'var(--muted-foreground)', padding: '1px', opacity: idx === 0 ? 0.3 : 1 }}
                  aria-label="Move up"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => handleMove(q.id, 'down')}
                  disabled={idx === questions.length - 1}
                  style={{ background: 'none', border: 'none', cursor: idx === questions.length - 1 ? 'not-allowed' : 'pointer', color: 'var(--muted-foreground)', padding: '1px', opacity: idx === questions.length - 1 ? 0.3 : 1 }}
                  aria-label="Move down"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Question info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{q.title}</span>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.125rem 0.5rem',
                    borderRadius: '2rem',
                    background: 'var(--secondary)',
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {TYPE_LABELS[q.type]}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{q.key}</span>
                </div>
                {q.subtitle && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.125rem' }}>{q.subtitle}</div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                {/* Enabled toggle */}
                <button
                  onClick={() => handleToggleEnabled(q)}
                  title={q.enabled ? 'Disable question' : 'Enable question'}
                  style={{
                    width: 36,
                    height: 20,
                    borderRadius: 10,
                    border: 'none',
                    background: q.enabled ? 'var(--ats-indigo)' : 'var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    left: q.enabled ? 18 : 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                  }} />
                </button>
                <button
                  onClick={() => isEditing ? (setEditingId(null), setEditForm(null)) : startEdit(q)}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '0.375rem', padding: '0.25rem 0.625rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--foreground)' }}
                >
                  {isEditing ? <X size={13} /> : <Pencil size={13} />}
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', cursor: 'pointer', color: 'var(--ats-danger)', display: 'flex', alignItems: 'center' }}
                  aria-label="Delete question"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Edit form */}
            {isEditing && editForm && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input
                      className="form-input"
                      value={editForm.title}
                      onChange={e => setEditForm(prev => prev ? { ...prev, title: e.target.value } : prev)}
                      style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem', background: 'var(--background)', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subtitle</label>
                    <input
                      className="form-input"
                      value={editForm.subtitle}
                      onChange={e => setEditForm(prev => prev ? { ...prev, subtitle: e.target.value } : prev)}
                      style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem', background: 'var(--background)', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {(q.type === 'choice' || q.type === 'multiselect') && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Options</label>
                      <button
                        type="button"
                        onClick={addOption}
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '0.375rem', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--foreground)' }}
                      >
                        <Plus size={12} /> Add option
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {editForm.options.map((opt, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            placeholder="Label (shown to user)"
                            value={opt.label}
                            onChange={e => updateOption(i, 'label', e.target.value)}
                            style={{ padding: '0.375rem 0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.8125rem', background: 'var(--background)' }}
                          />
                          <input
                            placeholder="Value (stored)"
                            value={opt.value}
                            onChange={e => updateOption(i, 'value', e.target.value)}
                            style={{ padding: '0.375rem 0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.8125rem', background: 'var(--background)', fontFamily: 'monospace' }}
                          />
                          <button
                            onClick={() => removeOption(i)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '0.25rem' }}
                            aria-label="Remove option"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {q.type === 'multiselect' && (
                      <div className="form-group" style={{ marginTop: '0.75rem' }}>
                        <label className="form-label">Max selections (leave blank for unlimited)</label>
                        <input
                          type="number"
                          min={1}
                          value={editForm.max_select}
                          onChange={e => setEditForm(prev => prev ? { ...prev, max_select: e.target.value } : prev)}
                          style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem', background: 'var(--background)', width: '120px' }}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setEditForm(null) }}
                    style={{ padding: '0.5rem 1rem', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(q)}
                    disabled={saving}
                    style={{ padding: '0.5rem 1.25rem', background: 'var(--ats-indigo)', color: '#fff', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                  >
                    <Check size={14} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {questions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted-foreground)', fontSize: '0.9375rem' }}>
          No questions yet. Run the seed SQL to populate the default questions.
        </div>
      )}
    </div>
  )
}
