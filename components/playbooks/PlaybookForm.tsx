'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Playbook, PlaybookStep, ProblemTag } from '@/lib/types'
import { TriggerTagSelector } from './TriggerTagSelector'
import { StepBuilder } from './StepBuilder'

interface PlaybookFormProps {
  initial?: Partial<Playbook>
  playbookId?: string
}

export function PlaybookForm({ initial, playbookId }: PlaybookFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<PlaybookStep[]>(initial?.steps ?? [])
  const [triggerTags, setTriggerTags] = useState<ProblemTag[]>(initial?.trigger_tags ?? [])
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    difficulty: initial?.difficulty ?? 'medium',
    estimated_weeks: initial?.estimated_weeks ?? '',
    expected_outcome: initial?.expected_outcome ?? '',
    status: initial?.status ?? 'draft',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      ...form,
      trigger_tags: triggerTags,
      steps,
      estimated_weeks: form.estimated_weeks ? parseInt(form.estimated_weeks as string) : null,
    }

    const url = playbookId ? `/api/playbooks/${playbookId}` : '/api/playbooks'
    const method = playbookId ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
    } else {
      router.push(`/playbooks/${json.data.id}`)
      router.refresh()
    }
    setLoading(false)
  }

  async function handlePublish() {
    if (!playbookId) return
    setLoading(true)
    await fetch(`/api/playbooks/${playbookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '720px' }}>
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input
          className="form-input"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Pipeline Velocity Optimization"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-input"
          style={{ resize: 'vertical', minHeight: '80px' }}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="What problem does this playbook solve?"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Trigger Tags</label>
        <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
          Select the problem tags that should trigger this playbook.
        </p>
        <TriggerTagSelector selected={triggerTags} onChange={setTriggerTags} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Difficulty</label>
          <select
            className="form-input"
            value={form.difficulty}
            onChange={(e) => set('difficulty', e.target.value)}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem', background: 'var(--background)' }}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Estimated weeks</label>
          <input
            className="form-input"
            type="number"
            min={1}
            value={form.estimated_weeks}
            onChange={(e) => set('estimated_weeks', e.target.value)}
            placeholder="e.g. 6"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-input"
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem', background: 'var(--background)' }}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Expected outcome</label>
        <textarea
          className="form-input"
          style={{ resize: 'vertical', minHeight: '60px' }}
          value={form.expected_outcome}
          onChange={(e) => set('expected_outcome', e.target.value)}
          placeholder="What will the agent achieve after following this playbook?"
        />
      </div>

      <div>
        <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
          Steps ({steps.length})
        </label>
        <StepBuilder steps={steps} onChange={setSteps} />
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
          {loading ? 'Saving...' : playbookId ? 'Save changes' : 'Create playbook'}
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
