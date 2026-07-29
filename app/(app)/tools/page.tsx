'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, ExternalLink, Pencil, Trash2, X } from 'lucide-react'
import type { ToolRecommendation } from '@/lib/types'

interface ToolEditModalProps {
  tool: ToolRecommendation
  onClose: () => void
  onSave: (updated: ToolRecommendation) => void
  onDelete: (id: string) => void
}

function ToolEditModal({ tool, onClose, onSave, onDelete }: ToolEditModalProps) {
  const [form, setForm] = useState({
    name: tool.name,
    category: tool.category ?? '',
    description: tool.description ?? '',
    ats_size_fit: tool.ats_size_fit?.join(', ') ?? '',
    website_url: tool.website_url ?? '',
    notes: tool.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/tools/${tool.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category || null,
          description: form.description || null,
          ats_size_fit: form.ats_size_fit ? form.ats_size_fit.split(',').map((s) => s.trim()).filter(Boolean) : [],
          website_url: form.website_url || null,
          notes: form.notes || null,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'Save failed')
      onSave(j.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${tool.name}"? This cannot be undone.`)) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/tools/${tool.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Delete failed')
      }
      onDelete(tool.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setDeleting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Edit Tool</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '0.25rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.625rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Name
            <input
              className="ats-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tool name"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Category
            <input
              className="ats-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. CRM, E-Sign, Title Plant"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Description
            <textarea
              className="ats-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            ATS Size Fit <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(comma-separated)</span>
            <input
              className="ats-input"
              value={form.ats_size_fit}
              onChange={(e) => setForm({ ...form, ats_size_fit: e.target.value })}
              placeholder="small, mid, large"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Website URL
            <input
              className="ats-input"
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              placeholder="https://..."
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Notes
            <textarea
              className="ats-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Internal notes"
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.875rem',
              background: 'none',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.6 : 1,
            }}
          >
            <Trash2 size={14} />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 0.875rem',
                background: 'none',
                color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--ats-blue)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer',
                opacity: saving || !form.name.trim() ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ToolsPage() {
  const [tools, setTools] = useState<ToolRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTool, setEditingTool] = useState<ToolRecommendation | null>(null)

  useEffect(() => {
    fetch('/api/tools')
      .then((r) => r.json())
      .then((j) => setTools(j.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  function handleSave(updated: ToolRecommendation) {
    setTools((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setEditingTool(null)
  }

  function handleDelete(id: string) {
    setTools((prev) => prev.filter((t) => t.id !== id))
    setEditingTool(null)
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Tools Database</h1>
        <Link
          href="/tools/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            background: 'var(--ats-blue)',
            color: '#fff',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <Plus size={16} />
          Add tool
        </Link>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : tools.length === 0 ? (
          <div className="ats-card">
            <div className="empty-state">
              <p style={{ fontWeight: 600 }}>No tools added yet</p>
              <p style={{ fontSize: '0.875rem' }}>Add tools to your database for Claude to reference when making recommendations.</p>
              <Link
                href="/tools/new"
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'var(--ats-blue)',
                  color: '#fff',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Add first tool
              </Link>
            </div>
          </div>
        ) : (
          <div className="ats-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="ats-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>ATS Size Fit</th>
                  <th>Description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr key={tool.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{tool.name}</div>
                    </td>
                    <td style={{ color: 'var(--muted-foreground)' }}>{tool.category ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {tool.ats_size_fit?.map((size) => (
                          <span key={size} className="badge badge-processed" style={{ fontSize: '0.6875rem' }}>
                            {size}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', maxWidth: '280px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tool.description ?? '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {tool.website_url && (
                          <a
                            href={tool.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--ats-blue)', textDecoration: 'none' }}
                          >
                            <ExternalLink size={12} />
                            Visit
                          </a>
                        )}
                        <button
                          onClick={() => setEditingTool(tool)}
                          title="Edit tool"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--muted-foreground)',
                            padding: '0.25rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingTool && (
        <ToolEditModal
          tool={editingTool}
          onClose={() => setEditingTool(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
